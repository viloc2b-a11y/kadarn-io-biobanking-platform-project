// ==========================================================================
// FDA Inspection — Ingestion Pipeline
// ==========================================================================
// Baseline AF-1.0. Sprint 19.3.
//
// Three distinct evidence types:
//   1. Inspection Classification (NAI/VAI/OAI) — Class A
//   2. Form 483 Observation — Class B (institutional documentary)
//   3. Warning Letter — Counter Evidence (if OAI) or Class A
//
// OAI classification → CounterEvidence node (per KEMS-001 §4)
// Site can respond via Right of Response (KEMS-001 §8)
// NAI → regular EvidenceNode
// ==========================================================================

import type { FDAApiClient } from './client.js';
import type { IdentityResolution, ExternalIdentifier } from '../../identity/types.js';
import type { FDAInspection, FDAForm483, FDAWarningLetter, FDASearchParams, FDAIngestionResult } from './types.js';

export interface IdentityResolver {
  resolve(params: { name: string; externalIds: ExternalIdentifier[]; city?: string; state?: string; country?: string }): Promise<IdentityResolution>;
}

export interface EvidenceNodeCreator {
  createEvidenceNode(params: {
    siteId: string; claimId: string | null; evidenceClass: 'A' | 'B';
    content: string; source: string; date: string; weight: number;
    provenance: { createdByActorId: string; createdByOrganizationId: string; correlationId: string; summary: string };
    rawPayload: Record<string, unknown>; externalUrl: string;
  }): Promise<{ id: string }>;
}

export interface CounterEvidenceCreator {
  createCounterEvidence(params: {
    siteId: string; claimId: string | null; evidenceClass: 'A' | 'B';
    content: string; source: string; date: string; weight: number;
    provenance: { createdByActorId: string; createdByOrganizationId: string; correlationId: string; summary: string };
    rawPayload: Record<string, unknown>; externalUrl: string;
  }): Promise<{ id: string }>;
}

export interface Stager {
  stage(params: { externalId: string; sourceName: string; source: string; context: Record<string, unknown> }): Promise<{ stagingId: string }>;
}

export interface DuplicateChecker {
  isDuplicate(key: string): Promise<boolean>;
}

export async function ingestFDA(
  apiClient: FDAApiClient,
  searchParams: FDASearchParams,
  deps: {
    identityResolver: IdentityResolver;
    evidenceCreator: EvidenceNodeCreator;
    counterEvidenceCreator: CounterEvidenceCreator;
    stager: Stager;
    duplicateChecker: DuplicateChecker;
    actorId: string; organizationId: string; correlationId: string;
  },
): Promise<FDAIngestionResult> {
  let inspectionsIngested = 0;
  let form483Ingested = 0;
  let warningLettersIngested = 0;
  let counterEvidenceCreated = 0;
  let unresolved = 0;
  let duplicatesSkipped = 0;

  // Helper: resolve identity
  async function resolve(name: string, fei: string | undefined, city: string, state: string, country: string): Promise<{ siteId: string } | null> {
    const extIds: ExternalIdentifier[] = [];
    if (fei) {
      extIds.push({ type: 'fei', value: fei, label: `FEI ${fei}`, confidence: 'high', verifiedAt: null, verifiedBy: 'automated' });
    }

    const resolution = await deps.identityResolver.resolve({
      name, externalIds: extIds, city, state, country,
    });

    if (resolution.identityConfidence === 'high' && resolution.institution && resolution.site) {
      return { siteId: resolution.site.siteId };
    }
    return null;
  }

  // 1. Process inspections
  const inspections = await apiClient.searchInspections(searchParams);
  for (const insp of inspections) {
    const dupKey = `fda-inspection-${insp.fei}-${insp.inspectionDate}`;
    if (await deps.duplicateChecker.isDuplicate(dupKey)) { duplicatesSkipped++; continue; }

    const resolved = await resolve(insp.facilityName, insp.fei, insp.facilityCity, insp.facilityState, insp.facilityCountry);
    if (!resolved) { unresolved++; continue; }

    if (insp.classification === 'OAI') {
      // OAI → Counter Evidence (negative finding)
      await deps.counterEvidenceCreator.createCounterEvidence({
        siteId: resolved.siteId, claimId: null, evidenceClass: 'A',
        content: `FDA OAI inspection at ${insp.facilityName} on ${insp.inspectionDate}: ${insp.productType}`,
        source: 'fda_inspection', date: insp.inspectionDate, weight: 0,
        provenance: { createdByActorId: deps.actorId, createdByOrganizationId: deps.organizationId, correlationId: deps.correlationId, summary: `FDA OAI inspection: ${insp.fei}` },
        rawPayload: insp.rawPayload, externalUrl: insp.externalUrl,
      });
      counterEvidenceCreated++;
    } else {
      // NAI/VAI → regular EvidenceNode
      await deps.evidenceCreator.createEvidenceNode({
        siteId: resolved.siteId, claimId: null, evidenceClass: 'A',
        content: `FDA ${insp.classification} inspection at ${insp.facilityName} on ${insp.inspectionDate}: ${insp.productType}`,
        source: 'fda_inspection', date: insp.inspectionDate, weight: 0,
        provenance: { createdByActorId: deps.actorId, createdByOrganizationId: deps.organizationId, correlationId: deps.correlationId, summary: `FDA ${insp.classification}: ${insp.fei}` },
        rawPayload: insp.rawPayload, externalUrl: insp.externalUrl,
      });
    }
    inspectionsIngested++;
  }

  // 2. Process Form 483 observations
  const form483s = await apiClient.searchForm483(searchParams);
  for (const f483 of form483s) {
    const dupKey = `fda-form483-${f483.observationId}`;
    if (await deps.duplicateChecker.isDuplicate(dupKey)) { duplicatesSkipped++; continue; }

    const resolved = await resolve(f483.facilityName, f483.fei, f483.facilityCity, f483.facilityState, f483.facilityCountry);
    if (!resolved) { unresolved++; continue; }

    await deps.evidenceCreator.createEvidenceNode({
      siteId: resolved.siteId, claimId: null, evidenceClass: 'B',
      content: `FDA Form 483 observation at ${f483.facilityName}: ${f483.observationText.slice(0, 200)}`,
      source: 'fda_form483', date: f483.inspectionDate, weight: 0,
      provenance: { createdByActorId: deps.actorId, createdByOrganizationId: deps.organizationId, correlationId: deps.correlationId, summary: `FDA Form 483: ${f483.observationId}` },
      rawPayload: f483.rawPayload, externalUrl: f483.externalUrl,
    });
    form483Ingested++;
  }

  // 3. Process warning letters
  const warningLetters = await apiClient.searchWarningLetters(searchParams);
  for (const wl of warningLetters) {
    const dupKey = `fda-warning-letter-${wl.warningLetterId}`;
    if (await deps.duplicateChecker.isDuplicate(dupKey)) { duplicatesSkipped++; continue; }

    const resolved = await resolve(wl.facilityName, wl.fei, wl.facilityCity, wl.facilityState, wl.facilityCountry);
    if (!resolved) { unresolved++; continue; }

    // Warning letters are Counter Evidence (regulatory action)
    await deps.counterEvidenceCreator.createCounterEvidence({
      siteId: resolved.siteId, claimId: null, evidenceClass: 'A',
      content: `FDA Warning Letter ${wl.warningLetterId}: ${wl.subject}`,
      source: 'fda_warning_letter', date: wl.issueDate, weight: 0,
      provenance: { createdByActorId: deps.actorId, createdByOrganizationId: deps.organizationId, correlationId: deps.correlationId, summary: `FDA Warning Letter: ${wl.warningLetterId}` },
      rawPayload: wl.rawPayload, externalUrl: wl.externalUrl,
    });
    counterEvidenceCreated++;
    warningLettersIngested++;
  }

  return {
    inspectionsIngested, form483Ingested, warningLettersIngested,
    counterEvidenceCreated, unresolved, duplicatesSkipped,
    ingestedAt: new Date().toISOString(),
  };
}
