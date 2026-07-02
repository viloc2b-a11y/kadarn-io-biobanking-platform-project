// ==========================================================================
// Evidence Core — Lifecycle Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 17.3.
// Tests every lifecycle operation + forbidden mutations.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  createClaim,
  submitEvidence,
  linkEvidenceToClaim,
  submitCounterEvidence,
  submitRightOfResponse,
  updateProcessState,
} from '../src/index.js';
import type { DbClient } from '../src/db.js';

// --------------------------------------------------------------------------
// In-memory fake DbClient
// --------------------------------------------------------------------------

function createFakeDb(): DbClient & { _tables: Record<string, Record<string, Record<string, unknown>>> } {
  const tables: Record<string, Record<string, Record<string, unknown>>> = {
    audit_events: {},
    claims: {},
    evidence_nodes: {},
    evidence_relationships: {},
    right_of_response: {},
  };

  const db: ReturnType<typeof createFakeDb> = {
    _tables: tables,
    from(table: string) {
      if (!tables[table]) tables[table] = {};
      const rows = tables[table];
      return {
        async insert(data) {
          const record = Array.isArray(data) ? data[0] : data;
          const id = (record.id as string) ?? crypto.randomUUID();
          rows[id] = { ...record, id };
          return { data: rows[id], error: null };
        },
        select(_columns: string) {
          return {
            async eq(col: string, val: unknown) {
              const results = Object.values(rows).filter(r => r[col] === val);
              return { data: results, error: null };
            },
          };
        },
      };
    },
    async rpc(_fn: string, _params: Record<string, unknown>) {
      return { data: null, error: null };
    },
  };
  return db;
}

const ctx = { actorId: 'actor-1', organizationId: 'org-1', correlationId: 'corr-test-1' };
const ctx2 = { actorId: 'actor-2', organizationId: 'org-2', correlationId: 'corr-test-2' };

// --------------------------------------------------------------------------
// Lifecycle: Create Claim
// --------------------------------------------------------------------------

describe('createClaim', () => {
  it('creates a claim with provenance and audit', async () => {
    const db = createFakeDb();
    const claim = await createClaim(db, ctx, {
      claimTypeId: 'biospecimen.storage.freezer_minus_80c',
      name: '-80°C Freezer Storage',
      description: 'Capability to store biospecimens at -80°C.',
      domain: 'biospecimen',
      validEvidenceClasses: ['B', 'C'] as any,
      requiredEvidenceClasses: ['B'] as any,
      decays: true,
      decayPeriodMonths: 6,
    });

    expect(claim).toBeDefined();
    expect((claim as any).claim_type_id).toBe('biospecimen.storage.freezer_minus_80c');

    // Audit trail recorded
    expect(Object.keys(db._tables.audit_events).length).toBeGreaterThan(0);
  });

  it('rejects claim with no valid evidence classes', async () => {
    const db = createFakeDb();
    await expect(createClaim(db, ctx, {
      claimTypeId: 'invalid',
      name: 'Bad Claim',
      description: 'Test',
      domain: 'biospecimen',
      validEvidenceClasses: [],
      requiredEvidenceClasses: [],
      decays: false,
      decayPeriodMonths: null,
    })).rejects.toThrow('Claim validation failed');
  });

  it('audit records actor and organization', async () => {
    const db = createFakeDb();
    await createClaim(db, ctx2, {
      claimTypeId: 'biospecimen.regulatory.gcp_staff',
      name: 'GCP-Trained Staff',
      description: 'Capability to maintain current GCP training.',
      domain: 'biospecimen',
      validEvidenceClasses: ['B'] as any,
      requiredEvidenceClasses: ['B'] as any,
      decays: true,
      decayPeriodMonths: 24,
    });

    const auditRows = Object.values(db._tables.audit_events);
    expect(auditRows.length).toBe(1);
    expect((auditRows[0] as any).actor_id).toBe('actor-2');
    expect((auditRows[0] as any).organization_id).toBe('org-2');
  });
});

// --------------------------------------------------------------------------
// Lifecycle: Submit Evidence
// --------------------------------------------------------------------------

describe('submitEvidence', () => {
  it('submits evidence linked to a claim', async () => {
    const db = createFakeDb();
    const claim = await createClaim(db, ctx, {
      claimTypeId: 'biospecimen.storage.freezer_minus_80c',
      name: '-80°C Freezer Storage',
      description: 'Capability to store biospecimens at -80°C.',
      domain: 'biospecimen',
      validEvidenceClasses: ['B', 'C'] as any,
      requiredEvidenceClasses: ['B'] as any,
      decays: true,
      decayPeriodMonths: 6,
    });

    const node = await submitEvidence(db, ctx, {
      claimId: (claim as any).id,
      evidenceClass: 'B' as any,
      content: 'Freezer calibration certificate, valid until 2027-06',
      source: 'site-submission',
      date: '2026-07-01',
      weight: 0.5,
    });

    expect(node).toBeDefined();
    expect((node as any).claim_id).toBe((claim as any).id);
  });

  it('rejects evidence for non-existent claim', async () => {
    const db = createFakeDb();
    await expect(submitEvidence(db, ctx, {
      claimId: 'non-existent',
      evidenceClass: 'B' as any,
      content: 'Test',
      source: 'test',
      date: '2026-07-01',
      weight: 0.5,
    })).rejects.toThrow('Claim not found');
  });
});

// --------------------------------------------------------------------------
// Lifecycle: Link Evidence to Claim
// --------------------------------------------------------------------------

describe('linkEvidenceToClaim', () => {
  it('creates a supports relationship', async () => {
    const db = createFakeDb();
    const claim = await createClaim(db, ctx, {
      claimTypeId: 'biospecimen.processing.pk_samples',
      name: 'PK Sample Processing',
      description: 'Capability to process PK samples.',
      domain: 'biospecimen',
      validEvidenceClasses: ['B', 'C'] as any,
      requiredEvidenceClasses: ['B'] as any,
      decays: true,
      decayPeriodMonths: 12,
    });

    const node = await submitEvidence(db, ctx, {
      claimId: (claim as any).id,
      evidenceClass: 'B' as any,
      content: 'Processing SOP v3.2',
      source: 'site-submission',
      date: '2026-06-15',
      weight: 0.5,
    });

    const rel = await linkEvidenceToClaim(db, ctx, node.id, (claim as any).id);
    expect(rel).toBeDefined();
    expect((rel as any).relationship_type).toBe('supports');
  });
});

// --------------------------------------------------------------------------
// Lifecycle: Submit Counter Evidence
// --------------------------------------------------------------------------

describe('submitCounterEvidence', () => {
  it('submits counter evidence with negative weight', async () => {
    const db = createFakeDb();
    const claim = await createClaim(db, ctx, {
      claimTypeId: 'biospecimen.storage.freezer_minus_80c',
      name: '-80°C Freezer Storage',
      description: 'Test',
      domain: 'biospecimen',
      validEvidenceClasses: ['C'] as any,
      requiredEvidenceClasses: ['C'] as any,
      decays: true,
      decayPeriodMonths: 6,
    });

    const ce = await submitCounterEvidence(db, ctx, {
      claimId: (claim as any).id,
      evidenceClass: 'C' as any,
      content: 'Temperature excursion: -65°C for 4 hours on 2026-06-15',
      source: 'iot-monitoring',
      date: '2026-06-15',
      weight: 0.3,
    });

    expect(ce).toBeDefined();
    expect((ce as any).is_counter_evidence).toBe(true);
    expect((ce as any).weight).toBeLessThan(0);
    expect((ce as any).has_response).toBe(false);
  });
});

// --------------------------------------------------------------------------
// Lifecycle: Submit Right of Response
// --------------------------------------------------------------------------

describe('submitRightOfResponse', () => {
  it('attaches response without modifying counter evidence', async () => {
    const db = createFakeDb();
    const claim = await createClaim(db, ctx, {
      claimTypeId: 'biospecimen.shipping.cold_chain',
      name: 'Cold Chain Shipping',
      description: 'Capability to ship temperature-sensitive biospecimens.',
      domain: 'biospecimen',
      validEvidenceClasses: ['C'] as any,
      requiredEvidenceClasses: ['C'] as any,
      decays: true,
      decayPeriodMonths: 6,
    });

    const ce = await submitCounterEvidence(db, ctx, {
      claimId: (claim as any).id,
      evidenceClass: 'C' as any,
      content: 'Temperature excursion during shipment',
      source: 'iot',
      date: '2026-06-15',
      weight: 0.3,
    });

    const ror = await submitRightOfResponse(db, ctx, {
      counterEvidenceId: ce.id,
      description: 'Temperature logger replaced. Validation passed.',
      resolutionDate: '2026-06-20',
    });

    expect(ror).toBeDefined();
    expect((ror as any).counter_evidence_id).toBe(ce.id);
    // Verify: counter evidence is not modified
    expect((ce as any).has_response).toBe(false);
  });
});

// --------------------------------------------------------------------------
// Lifecycle: Update Process State
// --------------------------------------------------------------------------

describe('updateProcessState', () => {
  it('updates process state with audit trail', async () => {
    const db = createFakeDb();

    await updateProcessState(db, ctx, {
      entityType: 'claim',
      entityId: 'claim-1',
      newStatus: 'deprecated',
      reason: 'Claim superseded by updated capability model',
    });

    // Audit entry should be recorded
    const auditRows = Object.values(db._tables.audit_events);
    expect(auditRows.length).toBe(1);
    expect((auditRows[0] as any).action).toBe('process_state.updated');
  });

  it('rejects invalid status transitions', async () => {
    const db = createFakeDb();
    await expect(updateProcessState(db, ctx, {
      entityType: 'evidence_node',
      entityId: 'node-1',
      newStatus: 'nonexistent',
      reason: 'Test',
    })).rejects.toThrow('Invalid status');
  });
});

// --------------------------------------------------------------------------
// Forbidden mutations
// --------------------------------------------------------------------------

describe('Forbidden mutations', () => {
  it('no updateEvidenceNode function exists in lifecycle', async () => {
    const lifecycle = await import('../src/lifecycle.js');
    expect((lifecycle as any).updateEvidenceNode).toBeUndefined();
    expect((lifecycle as any).deleteEvidenceNode).toBeUndefined();
  });

  it('no confidence computation function exists in lifecycle', async () => {
    const lifecycle = await import('../src/lifecycle.js');
    expect((lifecycle as any).computeConfidence).toBeUndefined();
    expect((lifecycle as any).calculateConfidence).toBeUndefined();
  });

  it('no trust terminology in lifecycle service', () => {
    const { readFileSync } = require('fs');
    const { resolve } = require('path');
    const content = readFileSync(resolve(__dirname, '../src/lifecycle.ts'), 'utf-8');
    const retiredTerms = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
      'gold_site', 'silver_site', 'bronze_site'];
    for (const term of retiredTerms) {
      expect(content.toLowerCase()).not.toContain(term);
    }
  });
});

// --------------------------------------------------------------------------
// Multi-tenant isolation
// --------------------------------------------------------------------------

describe('Multi-tenant isolation', () => {
  it('creates claim with correct owning organization', async () => {
    const db = createFakeDb();
    const claim = await createClaim(db, ctx2, {
      claimTypeId: 'biospecimen.storage.liquid_nitrogen',
      name: 'LN2 Storage',
      description: 'Capability to store in liquid nitrogen.',
      domain: 'biospecimen',
      validEvidenceClasses: ['B', 'C'] as any,
      requiredEvidenceClasses: ['B'] as any,
      decays: true,
      decayPeriodMonths: 6,
    });

    expect((claim as any).owning_org_id).toBe('org-2');
  });
});
