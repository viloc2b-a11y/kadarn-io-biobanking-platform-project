// ==========================================================================
// ClinicalTrials.gov — EvidenceConnector Adapter
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
// Implements EvidenceConnector for the ConnectorOrchestrator.
// Wraps the existing API client and claim mapper.
// ==========================================================================

import type { EvidenceConnector, ConnectorManifest, ConnectorSearchParams, ExternalRecord, NormalizedRecord } from '../framework/types.js';
import type { CTGovApiClient } from './client.js';
import { mapStudyToClaims } from './claim-mapper.js';
import type { CTGovStudy } from './types.js';
import type { IdentityResolution } from '../../identity/types.js';
import { buildProvenance } from '../framework/provenance.js';

export const CTGOV_MANIFEST: ConnectorManifest = {
  name: 'clinicaltrials',
  evidenceClass: 'A',
  identityRequired: true,
  supportsIncremental: true,
  supportsRetry: true,
  supportsBackfill: true,
  supportsWebhook: false,
  description: 'ClinicalTrials.gov study registry — Class A evidence for study participation and recruitment capability.',
};

export function createCTGovAdapter(client: CTGovApiClient, deps: { actorId: string; organizationId: string }): EvidenceConnector {
  return {
    manifest: CTGOV_MANIFEST,

    async search(params: ConnectorSearchParams): Promise<ExternalRecord[]> {
      const studies = await client.searchStudies({
        name: params.institutionName ?? '',
        city: params.city,
        state: params.state,
        country: params.country,
        limit: params.maxResults ?? 50,
      });

      return studies.map(studyToExternalRecord);
    },

    async fetch(sourceRecordId: string): Promise<ExternalRecord | null> {
      const study = await client.getStudyById(sourceRecordId);
      return study ? studyToExternalRecord(study) : null;
    },

    normalize(record: ExternalRecord, _resolution: IdentityResolution | null): NormalizedRecord {
      const provenance = buildProvenance({
        sourceRecordId: record.sourceRecordId,
        source: 'clinicaltrials',
        actorId: deps.actorId,
        organizationId: deps.organizationId,
        correlationId: record.attributes.correlationId as string ?? '',
        summary: `CT.gov: ${record.content.slice(0, 100)}`,
      });

      return {
        sourceRecordId: record.sourceRecordId,
        siteId: _resolution?.site?.siteId ?? '',
        evidenceClass: 'A',
        content: record.content,
        source: 'clinicaltrials',
        date: record.date,
        isCounterEvidence: false,
        provenance,
        rawPayload: record.rawPayload,
        externalUrl: record.externalUrl,
      };
    },

    mapToClaim(record: NormalizedRecord): string | null {
      // The raw payload has the CTGovStudy — we need to re-map
      const study = record.rawPayload as unknown as CTGovStudy;
      if (!study) return null;
      const mappings = mapStudyToClaims(study);
      return mappings[0]?.claimTypeId ?? null;
    },
  };
}

function studyToExternalRecord(study: CTGovStudy): ExternalRecord {
  return {
    sourceRecordId: study.nctId,
    content: `CT.gov study ${study.nctId}: ${study.title}`,
    source: 'clinicaltrials',
    date: study.startDate,
    institutionName: study.facilityName,
    institutionCity: study.facilityCity,
    institutionState: study.facilityState,
    institutionCountry: study.facilityCountry,
    attributes: {
      nctId: study.nctId,
      title: study.title,
      sponsor: study.sponsor,
      conditions: study.conditions,
      recruitmentStatus: study.recruitmentStatus,
      studyPhase: study.studyPhase,
      completionDate: study.completionDate,
      principalInvestigator: study.principalInvestigator,
      mentionsBiospecimen: study.mentionsBiospecimen,
      correlationId: '',
    },
    rawPayload: study.rawPayload,
    externalUrl: study.externalUrl,
    isNegativeFinding: false,
  };
}
