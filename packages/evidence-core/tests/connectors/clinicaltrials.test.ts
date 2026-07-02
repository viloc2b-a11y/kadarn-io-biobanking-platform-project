// ==========================================================================
// ClinicalTrials.gov Connector — Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 19.1.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { ingestClinicalTrials, createMockClient, mapStudyToClaims } from '../../src/index.js';
import type { CTGovStudy, CTGovIngestionResult } from '../../src/index.js';
import type { IdentityResolver, EvidenceNodeCreator, UnresolvedStager, DuplicateChecker } from '../../src/index.js';
import type { InstitutionIdentity, SiteIdentity, ExternalIdentifier } from '../../src/index.js';

// --------------------------------------------------------------------------
// Sample CT.gov study records
// --------------------------------------------------------------------------

function makeStudy(overrides: Partial<CTGovStudy> = {}): CTGovStudy {
  return {
    nctId: overrides.nctId ?? 'NCT00000001',
    title: overrides.title ?? 'A Phase 1 Study of Drug X in Patients with Solid Tumors',
    sponsor: overrides.sponsor ?? 'PharmaCorp',
    conditions: overrides.conditions ?? ['Solid Tumor', 'Metastatic Cancer'],
    therapeuticAreas: overrides.therapeuticAreas ?? ['Oncology'],
    facilityName: overrides.facilityName ?? 'Mayo Clinic Rochester',
    facilityCity: overrides.facilityCity ?? 'Rochester',
    facilityState: overrides.facilityState ?? 'MN',
    facilityCountry: overrides.facilityCountry ?? 'US',
    recruitmentStatus: overrides.recruitmentStatus ?? 'Completed',
    studyPhase: overrides.studyPhase ?? 'Phase 1',
    startDate: overrides.startDate ?? '2023-01-01',
    completionDate: overrides.completionDate ?? '2025-06-30',
    principalInvestigator: overrides.principalInvestigator ?? null,
    rawPayload: overrides.rawPayload ?? { nctId: 'NCT00000001' },
    externalUrl: overrides.externalUrl ?? `https://clinicaltrials.gov/study/${overrides.nctId ?? 'NCT00000001'}`,
    mentionsBiospecimen: overrides.mentionsBiospecimen ?? false,
  };
}

// --------------------------------------------------------------------------
// Mock dependencies
// --------------------------------------------------------------------------

function createMockDeps(knownInstitutions: InstitutionIdentity[], knownSites: SiteIdentity[]) {
  const createdEvidenceNodes: any[] = [];
  const stagedRecords: any[] = [];
  const ingestedIds = new Set<string>();

  const identityResolver: IdentityResolver = {
    async resolve(params) {
      // Try to match by institution name
      const inst = knownInstitutions.find(i =>
        i.canonicalName.toLowerCase().includes(params.name.toLowerCase()) ||
        params.name.toLowerCase().includes(i.canonicalName.toLowerCase()),
      );
      if (!inst) {
        return { institution: null, site: null, resolutionTier: null, unresolved: null, identityConfidence: 'low', explanation: 'No match' };
      }
      // Find site under this institution
      const site = knownSites.find(s => s.kadarnId === inst.kadarnId);
      return {
        institution: inst,
        site: site ?? null,
        resolutionTier: 1,
        unresolved: null,
        identityConfidence: 'high',
        explanation: 'Mock match',
      };
    },
  };

  const evidenceCreator: EvidenceNodeCreator = {
    async createEvidenceNode(params) {
      const id = `ev-${params.siteId}-${params.externalUrl?.split('/').pop() ?? Date.now()}`;
      createdEvidenceNodes.push({ id, ...params });
      return { id };
    },
  };

  const unresolvedStager: UnresolvedStager = {
    async stage(params) {
      const stagingId = `staging-${params.externalId}-${Date.now()}`;
      stagedRecords.push({ stagingId, ...params });
      return { stagingId };
    },
  };

  const duplicateChecker: DuplicateChecker = {
    async isDuplicate(nctId) {
      if (ingestedIds.has(nctId)) return true;
      ingestedIds.add(nctId);
      return false;
    },
  };

  return { identityResolver, evidenceCreator, unresolvedStager, duplicateChecker, createdEvidenceNodes, stagedRecords };
}

// --------------------------------------------------------------------------
// Sample known identities
// --------------------------------------------------------------------------

const mayoInst: InstitutionIdentity = {
  kadarnId: 'inst-mayo', canonicalName: 'Mayo Clinic Rochester', institutionType: 'hospital', active: true,
  externalIds: [{ type: 'fei', value: 'FEI-12345', label: 'FEI', confidence: 'high', verifiedAt: null, verifiedBy: 'automated' }],
  aliases: [], resolvedAtTier: null, status: 'active',
  address: { city: 'Rochester', state: 'MN', country: 'US' },
  identityCreatedBy: 'system', identitySource: 'test', identityLastVerified: null, identityVersion: 1,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', mergedInto: null,
};

const mayoOncology: SiteIdentity = {
  siteId: 'site-mayo-oncology', kadarnId: 'inst-mayo', siteName: 'Oncology Research Unit',
  siteType: 'research_unit', status: 'active', identityConfidence: 'high',
  address: { city: 'Rochester', state: 'MN', country: 'US' },
  createdBy: 'system', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

const unknownInst: InstitutionIdentity = {
  kadarnId: 'inst-unknown', canonicalName: 'NeverHeardOf Research Center', institutionType: 'site', active: true,
  externalIds: [], aliases: [], resolvedAtTier: null, status: 'active',
  identityCreatedBy: 'system', identitySource: 'test', identityLastVerified: null, identityVersion: 1,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', mergedInto: null,
};

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('CTGov connector — successful ingestion', () => {
  it('ingests a completed Phase 1 study with identity resolved', async () => {
    const studies = [makeStudy({
      nctId: 'NCT001', title: 'Phase 1 Study of Drug X',
      recruitmentStatus: 'Completed', studyPhase: 'Phase 1',
    })];
    const client = createMockClient(studies);
    const deps = createMockDeps([mayoInst], [mayoOncology]);

    const result = await ingestClinicalTrials(client, { name: 'Mayo Clinic' }, {
      ...deps,
      actorId: 'actor-1', organizationId: 'org-1', correlationId: 'corr-ctgov-1',
    });

    expect(result.totalFound).toBe(1);
    expect(result.ingested.length).toBeGreaterThanOrEqual(1);
    expect(result.unresolved.length).toBe(0);
    expect(deps.createdEvidenceNodes.length).toBeGreaterThan(0);

    // Verify evidence node properties
    const ev = deps.createdEvidenceNodes[0];
    expect(ev.evidenceClass).toBe('A');
    expect(ev.source).toBe('clinicaltrials.gov');
    expect(ev.externalUrl).toContain('clinicaltrials.gov');
  });

  it('preserves provenance on created evidence', async () => {
    const studies = [makeStudy({ nctId: 'NCT002' })];
    const client = createMockClient(studies);
    const deps = createMockDeps([mayoInst], [mayoOncology]);

    await ingestClinicalTrials(client, { name: 'Mayo Clinic' }, {
      ...deps,
      actorId: 'actor-provenance', organizationId: 'org-provenance', correlationId: 'corr-prov',
    });

    const ev = deps.createdEvidenceNodes[0];
    expect(ev.provenance.createdByActorId).toBe('actor-provenance');
    expect(ev.provenance.correlationId).toBe('corr-prov');
  });
});

describe('CTGov connector — unresolved identity', () => {
  it('stages unresolved records without creating evidence', async () => {
    const studies = [makeStudy({
      nctId: 'NCT003',
      facilityName: 'Unknown Institution NeverHeardOf',
      facilityCity: 'Nowhere', facilityState: 'XX',
    })];
    const client = createMockClient(studies);
    const deps = createMockDeps([mayoInst], [mayoOncology]);

    const result = await ingestClinicalTrials(client, { name: 'NeverHeardOf' }, {
      ...deps,
      actorId: 'actor-1', organizationId: 'org-1', correlationId: 'corr-ctgov-2',
    });

    expect(result.totalFound).toBe(1);
    expect(result.ingested.length).toBe(0);
    expect(result.unresolved.length).toBe(1);
    expect(result.unresolved[0].nctId).toBe('NCT003');
    expect(deps.createdEvidenceNodes.length).toBe(0);
    expect(deps.stagedRecords.length).toBe(1);
  });
});

describe('CTGov connector — duplicate handling', () => {
  it('skips duplicate NCT IDs', async () => {
    const studies = [
      makeStudy({ nctId: 'NCT004' }),
      makeStudy({ nctId: 'NCT004' }), // duplicate
    ];
    const client = createMockClient(studies);
    const deps = createMockDeps([mayoInst], [mayoOncology]);

    const result = await ingestClinicalTrials(client, { name: 'Mayo Clinic' }, {
      ...deps,
      actorId: 'actor-1', organizationId: 'org-1', correlationId: 'corr-dup',
    });

    expect(result.duplicatesSkipped).toBe(1);
  });
});

describe('Claim mapping', () => {
  it('maps completed study to study_completion_history', () => {
    const study = makeStudy({ recruitmentStatus: 'Completed' });
    const mappings = mapStudyToClaims(study);
    expect(mappings.some(m => m.claimTypeId.includes('study_completion_history'))).toBe(true);
  });

  it('maps Phase 1 study to phase_i_experience', () => {
    const study = makeStudy({ studyPhase: 'Phase 1' });
    const mappings = mapStudyToClaims(study);
    expect(mappings.some(m => m.claimTypeId.includes('phase_i_experience'))).toBe(true);
  });

  it('does not map biospecimen Claims without protocol evidence', () => {
    const study = makeStudy({ mentionsBiospecimen: false, title: 'A Generic Drug Study', conditions: ['Hypertension'], studyPhase: '', recruitmentStatus: 'Completed' });
    const mappings = mapStudyToClaims(study);
    const processingMappings = mappings.filter(m => m.claimTypeId.startsWith('biospecimen.processing'));
    expect(processingMappings.length).toBe(0);
  });

  it('maps biospecimen Claim when protocol mentions it', () => {
    const study = makeStudy({ mentionsBiospecimen: true, title: 'Biospecimen Collection Study' });
    const mappings = mapStudyToClaims(study);
    expect(mappings.some(m => m.claimTypeId.startsWith('biospecimen'))).toBe(true);
  });
});

describe('No forbidden operations', () => {
  it('pipeline module has no confidence or AI functions', async () => {
    const pipeline = await import('../../src/connectors/clinicaltrials/pipeline.js');
    const forbidden = ['computeConfidence', 'calculateConfidence', 'scoreInstitution',
      'rankSite', 'recommendSite', 'inferCapability', 'generateJudgment'];
    for (const fn of forbidden) {
      expect((pipeline as any)[fn]).toBeUndefined();
    }
  });

  it('no retired terminology in connector', () => {
    const fs = require('fs');
    const path = require('path');
    const files = ['types.ts', 'client.ts', 'pipeline.ts', 'claim-mapper.ts'];
    const retired = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
      'gold_site', 'silver_site', 'bronze_site'];
    for (const file of files) {
      const content = fs.readFileSync(path.resolve(__dirname, '../../src/connectors/clinicaltrials', file), 'utf-8').toLowerCase();
      for (const term of retired) {
        expect(content).not.toContain(term);
      }
    }
  });
});
