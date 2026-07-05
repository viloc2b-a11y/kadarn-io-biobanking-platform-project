// ==========================================================================
// Evidence Core — Persistence Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 17.2.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  insertClaim,
  getClaimById,
  insertEvidenceNode,
  getEvidenceNodesByClaim,
  insertCounterEvidence,
  insertRightOfResponse,
  insertRelationship,
  createProvenance,
  siteVisibility,
  validateClaim,
} from '../src/index.js';
import { createClaim } from '../src/claim.js';
import type { DbClient } from '../src/db.js';

// --------------------------------------------------------------------------
// In-memory fake DbClient
// --------------------------------------------------------------------------

function createFakeDb(): DbClient {
  const tables: Record<string, Record<string, Record<string, unknown>>> = {};

  return {
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
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('Persistence — Claim repository', () => {
  it('inserts a Claim and retrieves it by ID', async () => {
    const db = createFakeDb();
    const claim = await insertClaim(db, {
      claimTypeId: 'biospecimen.storage.freezer_minus_80c',
      name: '-80°C Freezer Storage',
      description: 'Capability to store biospecimens at -80°C.',
      organizationId: 'org-1',
      domain: 'biospecimen',
      validEvidenceClasses: ['B', 'C'] as any,
      requiredEvidenceClasses: ['B'] as any,
      decays: true,
      decayPeriodMonths: 6,
      provenance: {
        createdByActorId: 'actor-1',
        createdByOrganizationId: 'org-1',
        correlationId: 'corr-1',
        summary: 'Initial claim',
      },
    });

    expect(claim).toBeDefined();
    expect((claim as any).name).toBe('-80°C Freezer Storage');

    const retrieved = await getClaimById(db, (claim as any).id);
    expect(retrieved).not.toBeNull();
  });

  it('rejects Claims with no valid Evidence Classes via domain invariant', () => {
    const invalid = createClaim({
      id: 'claim-invalid',
      claimTypeId: 'invalid',
      name: 'No Evidence',
      description: 'Test',
      organizationId: 'org-1',
      domain: 'biospecimen',
      validEvidenceClasses: [],
      requiredEvidenceClasses: [],
      decays: false,
      decayPeriodMonths: null,
      provenance: {
        createdByActorId: 'actor-1',
        createdByOrganizationId: 'org-1',
        correlationId: 'corr-3',
        summary: 'Invalid',
      },
    });

    expect(validateClaim(invalid).valid).toBe(false);
  });
});

describe('Persistence — Evidence Node repository', () => {
  it('inserts and retrieves Evidence Nodes by Claim', async () => {
    const db = createFakeDb();
    const prov = createProvenance({
      actorId: 'actor-1', organizationId: 'org-1',
      correlationId: 'corr-1', summary: 'Test evidence',
    });

    await insertEvidenceNode(db, {
      claimId: 'claim-1', evidenceClass: 'B' as any,
      content: 'Calibration certificate', source: 'site-submission',
      date: '2026-07-01', weight: 0.5, provenance: prov,
      visibility: siteVisibility('org-1'),
    });

    const nodes = await getEvidenceNodesByClaim(db, 'claim-1');
    expect(nodes.length).toBe(1);
  });
});

describe('Persistence — Counter Evidence', () => {
  it('inserts Counter Evidence with negative weight', async () => {
    const db = createFakeDb();
    const ce = await insertCounterEvidence(db, {
      claimId: 'claim-1', evidenceClass: 'C' as any,
      content: 'Temperature excursion', source: 'iot-monitoring',
      date: '2026-06-15', weight: 0.3,
      provenance: createProvenance({ actorId: 'actor-2', organizationId: 'org-1', correlationId: 'corr-2', summary: 'CE' }),
      visibility: siteVisibility('org-1'),
    });

    expect((ce as any).is_counter_evidence).toBe(true);
    expect((ce as any).weight).toBeLessThan(0);
  });
});

describe('Persistence — Right of Response', () => {
  it('inserts Right of Response referencing Counter Evidence', async () => {
    const db = createFakeDb();
    const ror = await insertRightOfResponse(db, {
      counterEvidenceId: 'ce-1',
      description: 'Freezer maintenance completed',
      resolutionDate: '2026-06-20',
      provenance: createProvenance({ actorId: 'actor-1', organizationId: 'org-1', correlationId: 'corr-3', summary: 'Response' }),
      visibility: siteVisibility('org-1'),
    });

    expect(ror).toBeDefined();
    expect((ror as any).counter_evidence_id).toBe('ce-1');
  });
});

describe('Persistence — Evidence Relationship', () => {
  it('inserts a relationship', async () => {
    const db = createFakeDb();
    const prov = createProvenance({ actorId: 'actor-1', organizationId: 'org-1', correlationId: 'corr-4', summary: 'Rel' });

    const nodeA = await insertEvidenceNode(db, {
      claimId: 'claim-1', evidenceClass: 'B' as any, content: 'A', source: 't', date: '2026-07-01', weight: 0.5, provenance: prov, visibility: siteVisibility('org-1'),
    });
    const nodeB = await insertEvidenceNode(db, {
      claimId: 'claim-1', evidenceClass: 'C' as any, content: 'B', source: 't', date: '2026-07-01', weight: 0.5, provenance: prov, visibility: siteVisibility('org-1'),
    });

    const rel = await insertRelationship(db, {
      sourceNodeId: nodeA.id, targetNodeId: nodeB.id,
      relationshipType: 'supports',
      provenance: { correlationId: 'corr-5', summary: 'Test rel' },
    });

    expect(rel).toBeDefined();
    expect((rel as any).relationship_type).toBe('supports');
    expect((rel as any).source_node_id).toBe(nodeA.id);
    expect((rel as any).target_node_id).toBe(nodeB.id);
  });
});

describe('Persistence — Append-only invariant', () => {
  it('Evidence Nodes cannot be updated (no update function in repository)', async () => {
    // The append-only constraint is enforced at the database level by
    // triggers (migration 045). In the application layer, no update
    // functions exist in the repository — immutability is structural.
    const db = createFakeDb();
    const prov = createProvenance({ actorId: 'actor-1', organizationId: 'org-1', correlationId: 'corr-6', summary: 'Test' });

    const node = await insertEvidenceNode(db, {
      claimId: 'claim-1', evidenceClass: 'B' as any,
      content: 'Original immutable content', source: 'test',
      date: '2026-07-01', weight: 0.5, provenance: prov,
      visibility: siteVisibility('org-1'),
    });

    expect(node).toBeDefined();
    expect((node as any).content).toBe('Original immutable content');
    // Verify: repository exports no updateEvidenceNode function
    const repo = await import('../src/repository.js');
    expect((repo as any).updateEvidenceNode).toBeUndefined();
  });
});

describe('Persistence — Organization read queries (RC-11.2)', () => {
  it('getClaimsByOrganizationId returns mapped claims for one org', async () => {
    const db = createFakeDb();
    const provenance = {
      createdByActorId: 'actor-1',
      createdByOrganizationId: 'org-site-1',
      correlationId: 'corr-org-1',
      summary: 'Claim A',
    };

    await insertClaim(db, {
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC processing',
      description: 'On-site PBMC isolation',
      organizationId: 'org-site-1',
      domain: 'biospecimen',
      validEvidenceClasses: ['B'] as any,
      requiredEvidenceClasses: ['B'] as any,
      decays: true,
      decayPeriodMonths: 6,
      provenance,
    });

    await insertClaim(db, {
      claimTypeId: 'logistics.cold_chain.storage',
      name: 'Cold-chain storage',
      description: 'Monitored storage',
      organizationId: 'org-site-1',
      domain: 'logistics',
      validEvidenceClasses: ['B', 'C'] as any,
      requiredEvidenceClasses: ['B'] as any,
      decays: true,
      decayPeriodMonths: 12,
      provenance: { ...provenance, correlationId: 'corr-org-2', summary: 'Claim B' },
    });

    await insertClaim(db, {
      claimTypeId: 'experience.oncology.phase_ii',
      name: 'Oncology experience',
      description: 'Other org claim',
      organizationId: 'org-site-2',
      domain: 'experience',
      validEvidenceClasses: ['A'] as any,
      requiredEvidenceClasses: ['A'] as any,
      decays: false,
      decayPeriodMonths: null,
      provenance: { ...provenance, createdByOrganizationId: 'org-site-2', summary: 'Other org' },
    });

    const { getClaimsByOrganizationId } = await import('../src/repository.js');
    const claims = await getClaimsByOrganizationId(db, 'org-site-1');

    expect(claims).toHaveLength(2);
    expect(claims.every((c) => c.organizationId === 'org-site-1')).toBe(true);
    expect(claims.map((c) => c.claimTypeId).sort()).toEqual([
      'biospecimen.processing.pbmc',
      'logistics.cold_chain.storage',
    ]);
  });

  it('getOrganizationEvidenceRead returns claims and evidence nodes for org', async () => {
    const db = createFakeDb();
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: 'org-site-1',
      correlationId: 'corr-read-1',
      summary: 'Seed claim',
    });

    const claim = await insertClaim(db, {
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC processing',
      description: 'On-site PBMC isolation',
      organizationId: 'org-site-1',
      domain: 'biospecimen',
      validEvidenceClasses: ['B'] as any,
      requiredEvidenceClasses: ['B'] as any,
      decays: true,
      decayPeriodMonths: 6,
      provenance,
    });

    const claimId = (claim as { id: string }).id;

    await insertEvidenceNode(db, {
      claimId,
      evidenceClass: 'B' as any,
      content: 'SOP excerpt',
      source: 'site-submission',
      date: '2026-07-01',
      weight: 0.5,
      provenance,
      visibility: siteVisibility('org-site-1'),
    });

    const { getOrganizationEvidenceRead } = await import('../src/repository.js');
    const read = await getOrganizationEvidenceRead(db, 'org-site-1');

    expect(read.organizationId).toBe('org-site-1');
    expect(read.claims).toHaveLength(1);
    expect(read.claims[0].id).toBe(claimId);
    expect(read.evidenceNodes).toHaveLength(1);
    expect(read.evidenceNodes[0].claimId).toBe(claimId);
    expect(read.evidenceNodes[0].content).toBe('SOP excerpt');
  });

  it('getEvidenceNodesByClaimIds returns empty array for no claim ids', async () => {
    const db = createFakeDb();
    const { getEvidenceNodesByClaimIds } = await import('../src/repository.js');
    await expect(getEvidenceNodesByClaimIds(db, [])).resolves.toEqual([]);
  });
});
