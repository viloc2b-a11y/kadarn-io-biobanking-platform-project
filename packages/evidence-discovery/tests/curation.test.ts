// ==========================================================================
// Evidence Discovery — Curation Tests
// ==========================================================================
// Sprint 20A.6.
// Tests CurationService with all 8 actions.
// Curation does NOT write to Evidence Core.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { CurationService, CurationError, ALL_CURATION_ACTIONS } from '../src/index.js';
import type { DbClient } from '../src/repository.js';

// --------------------------------------------------------------------------
// Fake DbClient
// --------------------------------------------------------------------------

function fakeDb(): DbClient & { _events: any[] } {
  const events: any[] = [];
  return {
    _events: events,
    from(table: string) {
      return {
        async insert(data: any) {
          const id = crypto.randomUUID();
          events.push({ id, ...data });
          return { data: { id }, error: null };
        },
        select(_cols: string) {
          return {
            async eq(col: string, val: unknown) {
              return { data: events.filter((e: any) => e[col] === val), error: null };
            },
          };
        },
      } as any;
    },
    async rpc() { return { data: null, error: null }; },
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('CurationService — ACCEPT', () => {
  it('creates immutable curation event', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    const event = await service.curate({
      targetType: 'CLASSIFICATION',
      targetId: 'class-1',
      action: 'ACCEPT',
      actorId: 'reviewer-1',
      reason: 'Classification is correct based on document content.',
    });

    expect(event.targetType).toBe('CLASSIFICATION');
    expect(event.targetId).toBe('class-1');
    expect(event.action).toBe('ACCEPT');
    expect(event.actorId).toBe('reviewer-1');
    expect(event.id).toBeDefined();
    expect(db._events.length).toBe(1);
  });
});

describe('CurationService — REJECT', () => {
  it('creates immutable event with reason', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    const event = await service.curate({
      targetType: 'CLASSIFICATION',
      targetId: 'class-2',
      action: 'REJECT',
      actorId: 'reviewer-1',
      reason: 'Document is not an SOP — it is a meeting summary.',
    });

    expect(event.action).toBe('REJECT');
    expect(event.reason).toBe('Document is not an SOP — it is a meeting summary.');
    expect(event.newState).toBe('REJECTED');
  });
});

describe('CurationService — ENRICH', () => {
  it('stores structured enrichment payload', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    const event = await service.curate({
      targetType: 'ENTITY',
      targetId: 'ent-1',
      action: 'ENRICH',
      actorId: 'reviewer-1',
      enrichmentPayload: {
        correctedValue: 'Dr. Sarah M. Johnson, MD',
        notes: 'Middle initial verified from CV.',
      },
    });

    expect(event.action).toBe('ENRICH');
    expect(event.enrichmentPayload).toBeDefined();
    expect(event.enrichmentPayload!.correctedValue).toBe('Dr. Sarah M. Johnson, MD');
  });

  it('fails ENRICH without payload', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    await expect(service.curate({
      targetType: 'ENTITY', targetId: 'ent-2', action: 'ENRICH', actorId: 'reviewer-1',
    })).rejects.toThrow(CurationError);
  });
});

describe('CurationService — DEFER', () => {
  it('defers without losing provenance', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    const event = await service.curate({
      targetType: 'RELATIONSHIP',
      targetId: 'rel-1',
      action: 'DEFER',
      actorId: 'reviewer-1',
      reason: 'Need sponsor confirmation before accepting this relationship.',
    });

    expect(event.action).toBe('DEFER');
    expect(event.newState).toBe('DEFERRED');
  });
});

describe('CurationService — NEEDS_MORE_EVIDENCE', () => {
  it('records missing evidence request', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    const event = await service.curate({
      targetType: 'EVIDENCE_CANDIDATE',
      targetId: 'cand-1',
      action: 'NEEDS_MORE_EVIDENCE',
      actorId: 'reviewer-1',
      reason: 'A calibration certificate is needed to support this equipment capability claim.',
    });

    expect(event.action).toBe('NEEDS_MORE_EVIDENCE');
    expect(event.newState).toBe('NEEDS_MORE_EVIDENCE');
  });
});

describe('CurationService — MERGE', () => {
  it('preserves lineage with merge source IDs', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    const event = await service.curate({
      targetType: 'ENTITY',
      targetId: 'ent-main',
      action: 'MERGE',
      actorId: 'reviewer-1',
      reason: 'Duplicate investigator entries.',
      mergeSourceIds: ['ent-dup-1', 'ent-dup-2'],
    });

    expect(event.action).toBe('MERGE');
    expect(event.mergeSourceIds).toEqual(['ent-dup-1', 'ent-dup-2']);
  });

  it('fails MERGE without source IDs', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    await expect(service.curate({
      targetType: 'ENTITY', targetId: 'ent-3', action: 'MERGE', actorId: 'reviewer-1',
    })).rejects.toThrow(CurationError);
  });
});

describe('CurationService — SPLIT', () => {
  it('requires split child payloads', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    const event = await service.curate({
      targetType: 'RELATIONSHIP',
      targetId: 'rel-main',
      action: 'SPLIT',
      actorId: 'reviewer-1',
      reason: 'This relationship actually describes two separate studies.',
      splitChildPayloads: [{ name: 'Study A' }, { name: 'Study B' }],
    });

    expect(event.action).toBe('SPLIT');
  });

  it('fails SPLIT without child payloads', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    await expect(service.curate({
      targetType: 'ENTITY', targetId: 'ent-4', action: 'SPLIT', actorId: 'reviewer-1',
    })).rejects.toThrow(CurationError);
  });
});

describe('CurationService — ARCHIVE', () => {
  it('preserves audit history', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    const event = await service.curate({
      targetType: 'EVIDENCE_CANDIDATE',
      targetId: 'cand-old',
      action: 'ARCHIVE',
      actorId: 'reviewer-1',
      reason: 'Superseded by newer version.',
    });

    expect(event.action).toBe('ARCHIVE');
    expect(event.newState).toBe('ARCHIVED');
    expect(db._events.length).toBe(1);
  });
});

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

describe('CurationService — validation', () => {
  it('fails without actorId', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    await expect(service.curate({
      targetType: 'CLASSIFICATION', targetId: 'c', action: 'ACCEPT', actorId: '',
    })).rejects.toThrow(CurationError);
  });

  it('fails with invalid action', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    await expect(service.curate({
      targetType: 'CLASSIFICATION', targetId: 'c', action: 'INVALID' as any, actorId: 'reviewer',
    })).rejects.toThrow(CurationError);
  });

  it('fails without targetId', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    await expect(service.curate({
      targetType: 'CLASSIFICATION', targetId: '', action: 'ACCEPT', actorId: 'reviewer',
    })).rejects.toThrow(CurationError);
  });
});

// --------------------------------------------------------------------------
// Boundary compliance
// --------------------------------------------------------------------------

describe('CurationService — boundaries', () => {
  it('does not create EvidenceNodes', () => {
    const db = fakeDb();
    const service = new CurationService(db as any);
    expect((service as any).createEvidenceNode).toBeUndefined();
    expect((service as any).promoteCandidate).toBeUndefined();
  });

  it('has all 8 curation actions', () => {
    expect(ALL_CURATION_ACTIONS).toHaveLength(8);
    expect(ALL_CURATION_ACTIONS).toContain('ACCEPT');
    expect(ALL_CURATION_ACTIONS).toContain('REJECT');
    expect(ALL_CURATION_ACTIONS).toContain('ENRICH');
    expect(ALL_CURATION_ACTIONS).toContain('DEFER');
    expect(ALL_CURATION_ACTIONS).toContain('NEEDS_MORE_EVIDENCE');
    expect(ALL_CURATION_ACTIONS).toContain('MERGE');
    expect(ALL_CURATION_ACTIONS).toContain('SPLIT');
    expect(ALL_CURATION_ACTIONS).toContain('ARCHIVE');
  });

  it('every event has required fields', async () => {
    const db = fakeDb();
    const service = new CurationService(db);

    const event = await service.curate({
      targetType: 'SNAPSHOT_ITEM',
      targetId: 'snap-item-1',
      action: 'ACCEPT',
      actorId: 'reviewer-1',
      reason: 'Verified.',
    });

    expect(event.targetType).toBeDefined();
    expect(event.targetId).toBeDefined();
    expect(event.action).toBeDefined();
    expect(event.actorId).toBeDefined();
    expect(event.provenanceRef).toBeDefined();
    expect(event.createdAt).toBeDefined();
  });
});
