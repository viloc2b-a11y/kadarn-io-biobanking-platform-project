// ==========================================================================
// FDA Inspection Connector — Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 19.3.
// Three evidence types: classification, Form 483, warning letter.
// OAI → CounterEvidence. NAI/VAI → regular EvidenceNode.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { ingestFDA, createMockFDAClient } from '../../src/index.js';
import type { IdentityResolver, EvidenceNodeCreator, CounterEvidenceCreator, Stager, DuplicateChecker } from '../../src/index.js';
import type { InstitutionIdentity, SiteIdentity } from '../../src/index.js';
import type { FDAInspection, FDAForm483, FDAWarningLetter } from '../../src/index.js';

// --------------------------------------------------------------------------
// Sample data
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

function makeInspection(overrides: Partial<FDAInspection> = {}): FDAInspection {
  return {
    fei: overrides.fei ?? 'FEI-12345',
    classification: overrides.classification ?? 'NAI',
    inspectionDate: overrides.inspectionDate ?? '2025-03-15',
    inspectingAgency: overrides.inspectingAgency ?? 'FDA',
    productType: overrides.productType ?? 'Sterile Products',
    facilityName: overrides.facilityName ?? 'Mayo Clinic Rochester',
    facilityCity: overrides.facilityCity ?? 'Rochester',
    facilityState: overrides.facilityState ?? 'MN',
    facilityCountry: overrides.facilityCountry ?? 'US',
    isNegativeFinding: overrides.isNegativeFinding ?? false,
    rawPayload: overrides.rawPayload ?? { fei: 'FEI-12345' },
    externalUrl: overrides.externalUrl ?? 'https://www.fda.gov/inspections/12345',
  };
}

function makeForm483(overrides: Partial<FDAForm483> = {}): FDAForm483 {
  return {
    fei: overrides.fei ?? 'FEI-12345', observationId: overrides.observationId ?? 'OBS-001',
    observationText: overrides.observationText ?? 'Temperature monitoring records incomplete',
    observationArea: overrides.observationArea ?? 'Temperature Control',
    inspectionDate: overrides.inspectionDate ?? '2025-03-15',
    facilityName: overrides.facilityName ?? 'Mayo Clinic Rochester',
    facilityCity: overrides.facilityCity ?? 'Rochester',
    facilityState: overrides.facilityState ?? 'MN',
    facilityCountry: overrides.facilityCountry ?? 'US',
    resolved: overrides.resolved ?? false,
    rawPayload: overrides.rawPayload ?? { observationId: 'OBS-001' },
    externalUrl: overrides.externalUrl ?? 'https://www.fda.gov/form483/OBS-001',
  };
}

function makeWarningLetter(overrides: Partial<FDAWarningLetter> = {}): FDAWarningLetter {
  return {
    fei: overrides.fei ?? 'FEI-12345', warningLetterId: overrides.warningLetterId ?? 'WL-2025-001',
    issueDate: overrides.issueDate ?? '2025-06-01',
    subject: overrides.subject ?? 'Significant deviations from GMP',
    facilityName: overrides.facilityName ?? 'Mayo Clinic Rochester',
    facilityCity: overrides.facilityCity ?? 'Rochester',
    facilityState: overrides.facilityState ?? 'MN',
    facilityCountry: overrides.facilityCountry ?? 'US',
    closed: overrides.closed ?? false,
    rawPayload: overrides.rawPayload ?? { warningLetterId: 'WL-2025-001' },
    externalUrl: overrides.externalUrl ?? 'https://www.fda.gov/warning-letters/WL-2025-001',
  };
}

function createDeps() {
  const createdEvidence: any[] = [];
  const createdCounterEvidence: any[] = [];
  const stagedRecords: any[] = [];
  const seenKeys = new Set<string>();

  return {
    identityResolver: {
      async resolve(params: any) {
        return { institution: mayoInst, site: mayoOncology, resolutionTier: 1, unresolved: null, identityConfidence: 'high', explanation: 'Match' };
      },
    } as IdentityResolver,
    evidenceCreator: {
      async createEvidenceNode(p: any) { const id = `ev-${Date.now()}`; createdEvidence.push({ id, ...p }); return { id }; },
    } as EvidenceNodeCreator,
    counterEvidenceCreator: {
      async createCounterEvidence(p: any) { const id = `ce-${Date.now()}`; createdCounterEvidence.push({ id, ...p }); return { id }; },
    } as unknown as CounterEvidenceCreator,
    stager: {
      async stage(p: any) { const id = `staging-${Date.now()}`; stagedRecords.push({ stagingId: id, ...p }); return { stagingId: id }; },
    } as Stager,
    duplicateChecker: {
      async isDuplicate(key: string) { if (seenKeys.has(key)) return true; seenKeys.add(key); return false; },
    } as DuplicateChecker,
    createdEvidence, createdCounterEvidence, stagedRecords,
  };
}

describe('FDA — NAI inspection creates EvidenceNode', () => {
  it('creates regular evidence for NAI inspection', async () => {
    const inspections = [makeInspection({ classification: 'NAI' })];
    const client = createMockFDAClient(inspections, [], []);
    const deps = createDeps();

    const result = await ingestFDA(client, { facilityName: 'Mayo Clinic' }, {
      ...deps, actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    expect(result.inspectionsIngested).toBe(1);
    expect(result.counterEvidenceCreated).toBe(0);
    expect(deps.createdEvidence.length).toBe(1);
    expect(deps.createdCounterEvidence.length).toBe(0);
  });
});

describe('FDA — OAI creates CounterEvidence', () => {
  it('creates counter evidence for OAI inspection', async () => {
    const inspections = [makeInspection({ classification: 'OAI' })];
    const client = createMockFDAClient(inspections, [], []);
    const deps = createDeps();

    const result = await ingestFDA(client, { facilityName: 'Mayo Clinic' }, {
      ...deps, actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    expect(result.inspectionsIngested).toBe(1);
    expect(result.counterEvidenceCreated).toBe(1);
    expect(deps.createdEvidence.length).toBe(0);
    expect(deps.createdCounterEvidence.length).toBe(1);
  });
});

describe('FDA — Form 483 creates evidence', () => {
  it('creates Class B evidence for Form 483', async () => {
    const forms = [makeForm483({ observationId: 'OBS-001' })];
    const client = createMockFDAClient([], forms, []);
    const deps = createDeps();

    const result = await ingestFDA(client, { facilityName: 'Mayo Clinic' }, {
      ...deps, actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    expect(result.form483Ingested).toBe(1);
    expect(deps.createdEvidence.length).toBe(1);
    expect(deps.createdEvidence[0].evidenceClass).toBe('B');
  });
});

describe('FDA — Warning Letter creates CounterEvidence', () => {
  it('creates counter evidence for warning letter', async () => {
    const wls = [makeWarningLetter({ warningLetterId: 'WL-001' })];
    const client = createMockFDAClient([], [], wls);
    const deps = createDeps();

    const result = await ingestFDA(client, { facilityName: 'Mayo Clinic' }, {
      ...deps, actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    expect(result.warningLettersIngested).toBe(1);
    expect(result.counterEvidenceCreated).toBe(1);
    expect(deps.createdCounterEvidence.length).toBe(1);
  });
});

describe('FDA — duplicate handling', () => {
  it('skips duplicate records', async () => {
    const inspections = [
      makeInspection({ classification: 'NAI', inspectionDate: '2025-03-15' }),
      makeInspection({ classification: 'NAI', inspectionDate: '2025-03-15' }),
    ];
    const client = createMockFDAClient(inspections, [], []);
    const deps = createDeps();

    const result = await ingestFDA(client, { facilityName: 'Mayo Clinic' }, {
      ...deps, actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    expect(result.duplicatesSkipped).toBe(1);
    expect(result.inspectionsIngested).toBe(1);
  });
});

describe('FDA — unresolved identity', () => {
  it('counts unresolved when identity resolution fails', async () => {
    const inspections = [makeInspection({ classification: 'NAI', facilityName: 'Mayo Clinic Rochester' })];
    const client = createMockFDAClient(inspections, [], []);

    const identityResolver: IdentityResolver = {
      async resolve() {
        return { institution: null, site: null, resolutionTier: null, unresolved: null, identityConfidence: 'low', explanation: 'No match' };
      },
    };

    const result = await ingestFDA(client, { facilityName: 'Mayo Clinic' }, {
      identityResolver, evidenceCreator: { async createEvidenceNode(p: any) { return { id: 'x' }; } },
      counterEvidenceCreator: { async createCounterEvidence(p: any) { return { id: 'x' }; } } as any,
      stager: { async stage(p: any) { return { stagingId: 's' }; } },
      duplicateChecker: { async isDuplicate() { return false; } },
      actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    expect(result.unresolved).toBeGreaterThan(0);
    expect(result.inspectionsIngested).toBe(0);
  });
});

describe('No forbidden operations', () => {
  it('no confidence or AI in pipeline', async () => {
    const p = await import('../../src/connectors/fda/pipeline.js');
    const forbidden = ['computeConfidence', 'scoreInstitution', 'rankSite', 'recommendSite', 'inferCapability', 'generateJudgment'];
    for (const fn of forbidden) {
      expect((p as any)[fn]).toBeUndefined();
    }
  });

  it('no retired terminology', () => {
    const fs = require('fs');
    const path = require('path');
    const files = ['types.ts', 'client.ts', 'pipeline.ts'];
    const retired = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
      'gold_site', 'silver_site', 'bronze_site'];
    for (const file of files) {
      const content = fs.readFileSync(path.resolve(__dirname, '../../src/connectors/fda', file), 'utf-8').toLowerCase();
      for (const term of retired) {
        expect(content).not.toContain(term);
      }
    }
  });
});
