// ==========================================================================
// PubMed — EvidenceConnector Adapter
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
// Implements EvidenceConnector for the ConnectorOrchestrator.
// ==========================================================================

import type { EvidenceConnector, ConnectorManifest, ConnectorSearchParams, ExternalRecord, NormalizedRecord } from '../framework/types.js';
import type { PubMedApiClient } from './client.js';
import { mapArticleToClaims } from './claim-mapper.js';
import type { PubMedArticle } from './types.js';
import type { IdentityResolution } from '../../identity/types.js';
import { buildProvenance } from '../framework/provenance.js';

export const PUBMED_MANIFEST: ConnectorManifest = {
  name: 'pubmed',
  evidenceClass: 'A',
  identityRequired: true,
  supportsIncremental: true,
  supportsRetry: true,
  supportsBackfill: true,
  supportsWebhook: false,
  description: 'PubMed/NLM publication database — Class A evidence for research activity. Affiliation strings are identity hints, not proof.',
};

export function createPubMedAdapter(client: PubMedApiClient, deps: { actorId: string; organizationId: string }): EvidenceConnector {
  return {
    manifest: PUBMED_MANIFEST,

    async search(params: ConnectorSearchParams): Promise<ExternalRecord[]> {
      const articles = await client.searchByInstitution({
        institutionName: params.institutionName ?? '',
        investigatorName: params.investigatorName,
        city: params.city,
        state: params.state,
        country: params.country,
        limit: params.maxResults ?? 50,
      });

      return articles.map(articleToExternalRecord);
    },

    async fetch(sourceRecordId: string): Promise<ExternalRecord | null> {
      const article = await client.getArticleByPmid(sourceRecordId);
      return article ? articleToExternalRecord(article) : null;
    },

    normalize(record: ExternalRecord, _resolution: IdentityResolution | null): NormalizedRecord {
      const provenance = buildProvenance({
        sourceRecordId: record.sourceRecordId,
        source: 'pubmed',
        actorId: deps.actorId,
        organizationId: deps.organizationId,
        correlationId: record.attributes.correlationId as string ?? '',
        summary: `PubMed: ${record.content.slice(0, 100)}`,
      });

      return {
        sourceRecordId: record.sourceRecordId,
        siteId: _resolution?.site?.siteId ?? '',
        evidenceClass: 'A',
        content: record.content,
        source: 'pubmed',
        date: record.date,
        isCounterEvidence: false,
        provenance,
        rawPayload: record.rawPayload,
        externalUrl: record.externalUrl,
      };
    },

    mapToClaim(record: NormalizedRecord): string | null {
      const article = record.rawPayload as unknown as PubMedArticle;
      if (!article) return null;
      const mappings = mapArticleToClaims(article);
      return mappings[0]?.claimTypeId ?? null;
    },
  };
}

function articleToExternalRecord(article: PubMedArticle): ExternalRecord {
  return {
    sourceRecordId: article.pmid,
    content: `PubMed article ${article.pmid}: ${article.title}`,
    source: 'pubmed',
    date: article.publicationDate,
    institutionName: article.affiliations[0] ?? '',
    institutionCity: '',
    institutionState: '',
    institutionCountry: '',
    attributes: {
      pmid: article.pmid,
      title: article.title,
      journal: article.journal,
      authors: article.authors,
      affiliations: article.affiliations,
      doi: article.doi,
      meshTerms: article.meshTerms,
      publicationType: article.publicationType,
      referencesClinicalStudy: article.referencesClinicalStudy,
      correlationId: '',
    },
    rawPayload: article.rawPayload,
    externalUrl: article.externalUrl,
    isNegativeFinding: false,
  };
}
