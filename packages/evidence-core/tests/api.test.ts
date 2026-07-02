// ==========================================================================
// Evidence Core — Internal API Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 17.5.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  apiCreateClaim,
  apiSubmitEvidence,
  apiSubmitCounterEvidence,
  apiSubmitResponse,
  apiCreateRelationship,
  apiUpdateProcessState,
  apiGetClaim,
  apiGetClaimEvidence,
} from '../src/index.js';


// --------------------------------------------------------------------------
// Helpers — reusable fake DB
// --------------------------------------------------------------------------

function fakeDb(): DbClient & { _tables: any } {
  const tables: Record<string, any> = {};

  const db: any = {
    _tables: tables,
    from(table: string) {
      if (!tables[table]) tables[table] = {};
      const rows = tables[table];
      return {
        async insert(data: any) {
          const record = Array.isArray(data) ? data[0] : data;
          const id = (record.id as string) ?? crypto.randomUUID();
          rows[id] = { ...record, id };
          return { data: rows[id], error: null };
        },
        select(_cols: string) {
          return {
            async eq(col: string, val: unknown) {
              const results = Object.values(rows).filter((r: any) => r[col] === val);
              return { data: results, error: null };
            },
          };
        },
      };
    },
    async rpc(_fn: string, _params: any) {
      return { data: null, error: null };
    },
  };
  return db;
}

const ctx = { actorId: '00000000-0000-0000-0000-000000000001', organizationId: '00000000-0000-0000-0000-000000000010', correlationId: 'corr-api-test' };

// --------------------------------------------------------------------------
// API: createClaim
// --------------------------------------------------------------------------

describe('apiCreateClaim', () => {
  it('creates a claim and returns it', async () => {
    const db = fakeDb();
    const result = await apiCreateClaim(db, ctx, {
      claimTypeId: 'biospecimen.storage.freezer_minus_80c',
      name: '-80°C Freezer Storage',
      description: 'Capability to store biospecimens at -80°C.',
      domain: 'biospecimen',
      validEvidenceClasses: ['B', 'C'],
      requiredEvidenceClasses: ['B'],
      decays: true,
      decayPeriodMonths: 6,
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it('fails with empty valid evidence classes', async () => {
    const db = fakeDb();
    await expect(apiCreateClaim(db, ctx, {
      claimTypeId: 'invalid',
      name: 'Bad',
      description: 'Bad',
      domain: 'test',
      validEvidenceClasses: [],
      requiredEvidenceClasses: [],
      decays: false,
      decayPeriodMonths: null,
    })).rejects.toThrow('Claim validation failed');
  });
});

// --------------------------------------------------------------------------
// API: submitEvidence
// --------------------------------------------------------------------------

describe('apiSubmitEvidence', () => {
  it('submits evidence for a claim', async () => {
    const db = fakeDb();
    const claim = await apiCreateClaim(db, ctx, {
      claimTypeId: 'biospecimen.processing.pk_samples',
      name: 'PK Sample Processing',
      description: 'Capability to process PK samples.',
      domain: 'biospecimen',
      validEvidenceClasses: ['B', 'C'],
      requiredEvidenceClasses: ['B'],
      decays: true,
      decayPeriodMonths: 12,
    });

    const result = await apiSubmitEvidence(db, ctx, {
      claimId: (claim.data as any).id,
      evidenceClass: 'B',
      content: 'Processing SOP v3.2, signed and versioned',
      source: 'site-submission',
      date: '2026-07-01',
      weight: 0.5,
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});

// --------------------------------------------------------------------------
// API: submitCounterEvidence
// --------------------------------------------------------------------------

describe('apiSubmitCounterEvidence', () => {
  it('submits counter evidence with negative weight', async () => {
    const db = fakeDb();
    const claim = await apiCreateClaim(db, ctx, {
      claimTypeId: 'biospecimen.shipping.cold_chain',
      name: 'Cold Chain Shipping',
      description: 'Capability to ship temperature-sensitive biospecimens.',
      domain: 'biospecimen',
      validEvidenceClasses: ['C'],
      requiredEvidenceClasses: ['C'],
      decays: true,
      decayPeriodMonths: 6,
    });

    const result = await apiSubmitCounterEvidence(db, ctx, {
      claimId: (claim.data as any).id,
      evidenceClass: 'C',
      content: 'Temperature excursion during shipment',
      source: 'iot',
      date: '2026-06-15',
      weight: 0.3,
    });

    expect(result.error).toBeNull();
    expect((result.data as any).is_counter_evidence).toBe(true);
    expect((result.data as any).weight).toBeLessThan(0);
  });
});

// --------------------------------------------------------------------------
// API: submitRightOfResponse
// --------------------------------------------------------------------------

describe('apiSubmitResponse', () => {
  it('attaches response to counter evidence', async () => {
    const db = fakeDb();
    const claim = await apiCreateClaim(db, ctx, {
      claimTypeId: 'biospecimen.regulatory.capa',
      name: 'CAPA Management',
      description: 'CAPA capability.',
      domain: 'biospecimen',
      validEvidenceClasses: ['B'],
      requiredEvidenceClasses: ['B'],
      decays: true,
      decayPeriodMonths: 12,
    });

    const ce = await apiSubmitCounterEvidence(db, ctx, {
      claimId: (claim.data as any).id,
      evidenceClass: 'B',
      content: 'CAPA finding',
      source: 'audit',
      date: '2026-05-01',
      weight: 0.2,
    });

    const ror = await apiSubmitResponse(db, ctx, {
      counterEvidenceId: (ce.data as any).id,
      description: 'CAPA resolved. New procedure implemented.',
      resolutionDate: '2026-06-01',
    });

    expect(ror.error).toBeNull();
    expect(ror.data).toBeDefined();
  });
});

// --------------------------------------------------------------------------
// API: createRelationship
// --------------------------------------------------------------------------

describe('apiCreateRelationship', () => {
  it('creates a relationship between two evidence nodes', async () => {
    const db = fakeDb();
    const claim = await apiCreateClaim(db, ctx, {
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC Processing',
      description: 'PBMC capability.',
      domain: 'biospecimen',
      validEvidenceClasses: ['B', 'C'],
      requiredEvidenceClasses: ['B'],
      decays: true,
      decayPeriodMonths: 12,
    });

    const n1 = await apiSubmitEvidence(db, ctx, {
      claimId: (claim.data as any).id, evidenceClass: 'B', content: 'SOP v1', source: 't', date: '2026-07-01', weight: 0.5,
    });
    const n2 = await apiSubmitEvidence(db, ctx, {
      claimId: (claim.data as any).id, evidenceClass: 'C', content: 'Op record', source: 't', date: '2026-07-01', weight: 0.6,
    });

    const rel = await apiCreateRelationship(db, ctx, {
      sourceNodeId: (n1.data as any).id,
      targetNodeId: (n2.data as any).id,
      relationshipType: 'corroborates',
    });

    expect(rel.error).toBeNull();
    expect(rel.data).toBeDefined();
  });
});

// --------------------------------------------------------------------------
// API: updateProcessState
// --------------------------------------------------------------------------

describe('apiUpdateProcessState', () => {
  it('updates claim status', async () => {
    const db = fakeDb();
    const result = await apiUpdateProcessState(db, ctx, {
      entityType: 'claim',
      entityId: 'claim-test-1',
      newStatus: 'deprecated',
      reason: 'Superseded by new capability model',
    });
    expect(result.error).toBeNull();
  });

  it('rejects invalid status', async () => {
    const db = fakeDb();
    await expect(apiUpdateProcessState(db, ctx, {
      entityType: 'evidence_node',
      entityId: 'node-1',
      newStatus: 'nonexistent',
      reason: 'Test',
    })).rejects.toThrow('Invalid status');
  });
});

// --------------------------------------------------------------------------
// API: query
// --------------------------------------------------------------------------

describe('apiGetClaim', () => {
  it('returns null for non-existent claim', async () => {
    const db = fakeDb();
    const result = await apiGetClaim(db, ctx, { claimId: '00000000-0000-0000-0000-000000000000' });
    expect(result.data).toBeNull();
  });
});

describe('apiGetClaimEvidence', () => {
  it('returns empty array for claim with no evidence', async () => {
    const db = fakeDb();
    const result = await apiGetClaimEvidence(db, ctx, { claimId: '00000000-0000-0000-0000-000000000000' });
    expect(result.data).toEqual([]);
  });
});

// --------------------------------------------------------------------------
// Forbidden operations — verification
// --------------------------------------------------------------------------

describe('API boundary enforcement', () => {
  it('no confidence computation function exists in API exports', async () => {
    const api = await import('../src/api.js');
    expect((api as any).computeConfidence).toBeUndefined();
    expect((api as any).calculateConfidence).toBeUndefined();
    expect((api as any).scoreInstitution).toBeUndefined();
    expect((api as any).rankSite).toBeUndefined();
    expect((api as any).recommendSite).toBeUndefined();
    expect((api as any).inferCapability).toBeUndefined();
    expect((api as any).generateJudgment).toBeUndefined();
  });

  it('no retired Trust terminology in API source', () => {
    const { readFileSync } = require('fs');
    const { resolve } = require('path');
    const content = readFileSync(resolve(__dirname, '../src/api.ts'), 'utf-8').toLowerCase();
    const retired = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
      'gold_site', 'silver_site', 'bronze_site'];
    for (const term of retired) {
      expect(content).not.toContain(term);
    }
  });
});
