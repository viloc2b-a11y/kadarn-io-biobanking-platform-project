// ==========================================================================
// ClinicalTrials.gov — Ingestion Pipeline
// ==========================================================================
// Baseline AF-1.0. Sprint 19.1.
//
// Flow:
//   1. Search CT.gov by institution name + location
//   2. For each study, extract facility and call /identity/resolve
//   3. If resolved → create Class A EvidenceNode linked to SiteIdentity
//   4. If unresolved → create staging record
//   5. Map to Claims conservatively
//   6. Preserve raw payload for audit
// ==========================================================================

import type { CTGovApiClient } from './client.js';
import type {
  InstitutionIdentity,
  SiteIdentity,
  IdentityResolution,
  UnresolvedIdentity,
  ExternalIdentifier,
} from '../../identity/types.js';
import { mapStudyToClaims } from './claim-mapper.js';
import type { CTGovStudy, CTGovSearchParams, CTGovIngestionResult, IngestedStudy, UnresolvedStudy } from './types.js';

// --------------------------------------------------------------------------
// Dependency injection interfaces
// --------------------------------------------------------------------------

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
    provenance: {
      createdByActorId: string;
      createdByOrganizationId: string;
      correlationId: string;
      summary: string;
    };
    rawPayload: Record<string, unknown>;
    externalUrl: string;
  }): Promise<{ id: string }>;
}

export interface UnresolvedStager {
  stage(params: {
    externalId: string;
    sourceName: string;
    source: string;
    context: Record<string, unknown>;
  }): Promise<{ stagingId: string }>;
}

export interface DuplicateChecker {
  isDuplicate(nctId: string): Promise<boolean>;
}

// --------------------------------------------------------------------------
// Ingestion pipeline
// --------------------------------------------------------------------------

export async function ingestClinicalTrials(
  apiClient: CTGovApiClient,
  searchParams: CTGovSearchParams,
  deps: {
    identityResolver: IdentityResolver;
    evidenceCreator: EvidenceNodeCreator;
    unresolvedStager: UnresolvedStager;
    duplicateChecker: DuplicateChecker;
    actorId: string;
    organizationId: string;
    correlationId: string;
  },
): Promise<CTGovIngestionResult> {
  const ingested: IngestedStudy[] = [];
  const unresolved: UnresolvedStudy[] = [];
  let duplicatesSkipped = 0;

  // 1. Search CT.gov
  const studies = await apiClient.searchStudies(searchParams);

  // 2. Process each study
  for (const study of studies) {
    // Check duplicate
    const isDup = await deps.duplicateChecker.isDuplicate(study.nctId);
    if (isDup) {
      duplicatesSkipped++;
      continue;
    }

    // 3. Resolve identity
    const resolution = await deps.identityResolver.resolve({
      name: study.facilityName,
      externalIds: [{ type: 'nct_id', value: study.nctId, label: `NCT ${study.nctId}`, confidence: 'high', verifiedAt: null, verifiedBy: 'automated' }],
      city: study.facilityCity,
      state: study.facilityState,
      country: study.facilityCountry,
    });

    if (!resolution.institution || !resolution.site) {
      // Unresolved — stage it
      const staged = await deps.unresolvedStager.stage({
        externalId: study.nctId,
        sourceName: study.facilityName,
        source: 'clinicaltrials.gov',
        context: { study: study.nctId, title: study.title, rawPayload: study.rawPayload },
      });

      unresolved.push({
        nctId: study.nctId,
        facilityName: study.facilityName,
        stagingId: staged.stagingId,
        reason: 'Identity could not be resolved. Staged for manual review.',
      });
      continue;
    }

    const siteId = resolution.site.siteId;

    // 4. Map to Claims conservatively
    const claimMappings = mapStudyToClaims(study);

    // 5. Create Class A EvidenceNode (one per claim mapping, or one generic if no mapping)
    const mappingsToCreate = claimMappings.length > 0 ? claimMappings : [null];

    for (const mapping of mappingsToCreate) {
      const evidenceNode = await deps.evidenceCreator.createEvidenceNode({
        siteId,
        claimId: mapping?.claimTypeId ?? null,
        evidenceClass: 'A',
        content: `CT.gov study ${study.nctId}: ${study.title}`,
        source: 'clinicaltrials.gov',
        date: study.startDate,
        weight: 0,  // Weight determined by EvaluationPolicy (see policy.ts)
        provenance: {
          createdByActorId: deps.actorId,
          createdByOrganizationId: deps.organizationId,
          correlationId: deps.correlationId,
          summary: `Ingested from CT.gov: ${study.nctId} — ${study.title.slice(0, 100)}`,
        },
        rawPayload: study.rawPayload,
        externalUrl: study.externalUrl,
      });

      ingested.push({
        nctId: study.nctId,
        kadarnSiteId: siteId,
        evidenceNodeId: evidenceNode.id,
        claimId: mapping?.claimTypeId ?? null,
      });
    }
  }

  return {
    totalFound: studies.length,
    ingested,
    unresolved,
    duplicatesSkipped,
    ingestedAt: new Date().toISOString(),
  };
}
