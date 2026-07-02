// ==========================================================================
// FDA — EvidenceConnector Adapter
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
// Implements EvidenceConnector for the ConnectorOrchestrator.
// ==========================================================================

import type { EvidenceConnector, ConnectorManifest, ConnectorSearchParams, ExternalRecord, NormalizedRecord } from '../framework/types.js';
import type { FDAApiClient } from './client.js';
import type { FDAInspection, FDAForm483, FDAWarningLetter } from './types.js';
import type { IdentityResolution } from '../../identity/types.js';
import { buildProvenance } from '../framework/provenance.js';

export const FDA_MANIFEST: ConnectorManifest = {
  name: 'fda',
  evidenceClass: 'A',
  identityRequired: true,
  supportsIncremental: true,
  supportsRetry: true,
  supportsBackfill: true,
  supportsWebhook: false,
  description: 'FDA Inspection Classification, Form 483, and Warning Letters.',
};

export function createFDAAdapter(
  client: FDAApiClient,
  deps: { actorId: string; organizationId: string },
): EvidenceConnector {
  return {
    manifest: FDA_MANIFEST,

    async search(params: ConnectorSearchParams): Promise<ExternalRecord[]> {
      const results: ExternalRecord[] = [];

      // Search inspections
      const inspections = await client.searchInspections({
        fei: params.fei,
        facilityName: params.institutionName,
        city: params.city,
        state: params.state,
        country: params.country,
        limit: params.maxResults,
      });
      for (const insp of inspections) {
        results.push(inspectionToRecord(insp));
      }

      // Search Form 483s
      const form483s = await client.searchForm483({
        fei: params.fei,
        facilityName: params.institutionName,
        city: params.city,
        state: params.state,
        limit: params.maxResults,
      });
      for (const f483 of form483s) {
        results.push(form483ToRecord(f483));
      }

      // Search warning letters
      const wls = await client.searchWarningLetters({
        fei: params.fei,
        facilityName: params.institutionName,
        city: params.city,
        state: params.state,
        limit: params.maxResults,
      });
      for (const wl of wls) {
        results.push(warningLetterToRecord(wl));
      }

      return results;
    },

    async fetch(sourceRecordId: string): Promise<ExternalRecord | null> {
      // sourceRecordId format: "fda-inspection-{fei}-{date}" or "fda-form483-{id}" or "fda-wl-{id}"
      return null; // Cannot fetch a single mixed-type record
    },

    normalize(record: ExternalRecord, _resolution: IdentityResolution | null): NormalizedRecord {
      const provenance = buildProvenance({
        sourceRecordId: record.sourceRecordId,
        source: 'fda',
        actorId: deps.actorId,
        organizationId: deps.organizationId,
        correlationId: record.attributes.correlationId as string ?? '',
        summary: `FDA: ${record.content.slice(0, 100)}`,
      });

      return {
        sourceRecordId: record.sourceRecordId,
        siteId: _resolution?.site?.siteId ?? '',
        evidenceClass: (record.attributes.evidenceClass as 'A' | 'B') ?? 'A',
        content: record.content,
        source: record.source,
        date: record.date,
        isCounterEvidence: record.isNegativeFinding,
        provenance,
        rawPayload: record.rawPayload,
        externalUrl: record.externalUrl,
      };
    },
  };
}

function inspectionToRecord(insp: FDAInspection): ExternalRecord {
  return {
    sourceRecordId: `fda-inspection-${insp.fei}-${insp.inspectionDate}`,
    content: `FDA ${insp.classification} inspection at ${insp.facilityName} on ${insp.inspectionDate}: ${insp.productType}`,
    source: 'fda_inspection',
    date: insp.inspectionDate,
    institutionName: insp.facilityName,
    institutionCity: insp.facilityCity,
    institutionState: insp.facilityState,
    institutionCountry: insp.facilityCountry,
    attributes: { fei: insp.fei, classification: insp.classification, productType: insp.productType, inspectionDate: insp.inspectionDate, evidenceClass: 'A', correlationId: '' },
    rawPayload: insp.rawPayload,
    externalUrl: insp.externalUrl,
    isNegativeFinding: insp.classification === 'OAI',
  };
}

function form483ToRecord(f483: FDAForm483): ExternalRecord {
  return {
    sourceRecordId: `fda-form483-${f483.observationId}`,
    content: `FDA Form 483 at ${f483.facilityName}: ${f483.observationText.slice(0, 200)}`,
    source: 'fda_form483',
    date: f483.inspectionDate,
    institutionName: f483.facilityName,
    institutionCity: f483.facilityCity,
    institutionState: f483.facilityState,
    institutionCountry: f483.facilityCountry,
    attributes: { fei: f483.fei, observationId: f483.observationId, observationArea: f483.observationArea, evidenceClass: 'B', correlationId: '' },
    rawPayload: f483.rawPayload,
    externalUrl: f483.externalUrl,
    isNegativeFinding: false,
  };
}

function warningLetterToRecord(wl: FDAWarningLetter): ExternalRecord {
  return {
    sourceRecordId: `fda-wl-${wl.warningLetterId}`,
    content: `FDA Warning Letter ${wl.warningLetterId}: ${wl.subject}`,
    source: 'fda_warning_letter',
    date: wl.issueDate,
    institutionName: wl.facilityName,
    institutionCity: wl.facilityCity,
    institutionState: wl.facilityState,
    institutionCountry: wl.facilityCountry,
    attributes: { fei: wl.fei, warningLetterId: wl.warningLetterId, evidenceClass: 'A', correlationId: '' },
    rawPayload: wl.rawPayload,
    externalUrl: wl.externalUrl,
    isNegativeFinding: true,
  };
}
