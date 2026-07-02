// ==========================================================================
// PubMed — Ingestion Pipeline
// ==========================================================================
// Baseline AF-1.0. Sprint 19.2.
//
// Stricter than CT.gov because PubMed affiliation strings are identity hints,
// not identity proof.
//
// Flow:
//   1. Search PubMed by institution/investigator name
//   2. Extract affiliations and article metadata
//   3. Call /identity/resolve
//   4. Only HIGH-confidence resolved identity → create EvidenceNode
//   5. MEDIUM/LOW or affiliation-only → stage for manual review
//   6. No auto-link from affiliation string alone
// ==========================================================================

import type { PubMedApiClient } from './client.js';
import type { IdentityResolution, ExternalIdentifier } from '../../identity/types.js';
import { mapArticleToClaims } from './claim-mapper.js';
import type { PubMedArticle, PubMedSearchParams, PubMedIngestionResult, IngestedArticle, StagedArticle } from './types.js';

export interface IdentityResolver {
  resolve(params: {
    name: string;
    externalIds: ExternalIdentifier[];
    city?: string;
    state?: string;
    country?: string;
  }): Promise<IdentityResolution>;
}

export interface EvidenceNodeCreator {
  createEvidenceNode(params: {
    siteId: string;
    claimId: string | null;
    evidenceClass: 'A';
    content: string;
    source: string;
    date: string;
    weight: number;
    provenance: { createdByActorId: string; createdByOrganizationId: string; correlationId: string; summary: string };
    rawPayload: Record<string, unknown>;
    externalUrl: string;
  }): Promise<{ id: string }>;
}

export interface Stager {
  stage(params: { externalId: string; sourceName: string; source: string; context: Record<string, unknown> }): Promise<{ stagingId: string }>;
}

export interface DuplicateChecker {
  isDuplicate(pmid: string): Promise<boolean>;
}

export async function ingestPubMed(
  apiClient: PubMedApiClient,
  searchParams: PubMedSearchParams,
  deps: {
    identityResolver: IdentityResolver;
    evidenceCreator: EvidenceNodeCreator;
    stager: Stager;
    duplicateChecker: DuplicateChecker;
    actorId: string;
    organizationId: string;
    correlationId: string;
  },
): Promise<PubMedIngestionResult> {
  const ingested: IngestedArticle[] = [];
  const staged: StagedArticle[] = [];
  let duplicatesSkipped = 0;

  const articles = await apiClient.searchByInstitution(searchParams);

  for (const article of articles) {
    // Deduplicate
    if (await deps.duplicateChecker.isDuplicate(article.pmid)) {
      duplicatesSkipped++;
      continue;
    }

    // Try resolving with affiliations as identity hints
    let bestResolution: IdentityResolution | null = null;
    let bestAffiliation = '';

    for (const affiliation of article.affiliations) {
      const resolution = await deps.identityResolver.resolve({
        name: affiliation,
        externalIds: article.doi
          ? [{ type: 'custom', value: article.doi, label: `DOI ${article.doi}`, confidence: 'low', verifiedAt: null, verifiedBy: 'automated' }]
          : [],
        city: searchParams.city,
        state: searchParams.state,
        country: searchParams.country,
      });

      if (resolution.identityConfidence === 'high' && resolution.institution && resolution.site) {
        bestResolution = resolution;
        bestAffiliation = affiliation;
        break;
      }

      // Track best available resolution
      if (!bestResolution ||
          (resolution.identityConfidence === 'medium' && bestResolution.identityConfidence !== 'high')) {
        bestResolution = resolution;
        bestAffiliation = affiliation;
      }
    }

    // Only create evidence for HIGH confidence resolutions
    if (bestResolution && bestResolution.identityConfidence === 'high' && bestResolution.institution && bestResolution.site) {
      const claimMappings = mapArticleToClaims(article);
      const mappingsToCreate = claimMappings.length > 0 ? claimMappings : [null];

      for (const mapping of mappingsToCreate) {
        const evidenceNode = await deps.evidenceCreator.createEvidenceNode({
          siteId: bestResolution.site.siteId,
          claimId: mapping?.claimTypeId ?? null,
          evidenceClass: 'A',
          content: `PubMed article ${article.pmid}: ${article.title}`,
          source: 'pubmed',
          date: article.publicationDate,
          weight: 0.7,
          provenance: {
            createdByActorId: deps.actorId,
            createdByOrganizationId: deps.organizationId,
            correlationId: deps.correlationId,
            summary: `Ingested from PubMed: ${article.pmid} — ${article.title.slice(0, 100)}`,
          },
          rawPayload: article.rawPayload,
          externalUrl: article.externalUrl,
        });

        ingested.push({
          pmid: article.pmid,
          kadarnSiteId: bestResolution.site.siteId,
          evidenceNodeId: evidenceNode.id,
          claimId: mapping?.claimTypeId ?? null,
        });
      }
    } else {
      // Medium/low confidence or no resolution → stage
      const reason = bestResolution?.identityConfidence === 'medium' || bestResolution?.identityConfidence === 'low'
        ? `Identity confidence is "${bestResolution.identityConfidence}". PubMed affiliations are identity hints, not identity proof. Manual review required.`
        : 'Identity could not be resolved based on affiliation strings alone. Staged for manual review.';

      const stagedRecord = await deps.stager.stage({
        externalId: article.pmid,
        sourceName: bestAffiliation || article.affiliations[0] || 'unknown',
        source: 'pubmed',
        context: { pmid: article.pmid, title: article.title, affiliations: article.affiliations, rawPayload: article.rawPayload },
      });

      staged.push({
        pmid: article.pmid,
        stagingId: stagedRecord.stagingId,
        reason,
        confidence: bestResolution?.identityConfidence === 'medium' ? 'medium' : 'low',
      });
    }
  }

  return {
    totalFound: articles.length,
    ingested,
    staged,
    duplicatesSkipped,
    ingestedAt: new Date().toISOString(),
  };
}
