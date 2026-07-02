// ==========================================================================
// Connector Framework — Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  ConnectorOrchestrator,
  withRetry,
  RateLimiter,
  buildProvenance,
  InMemoryIdempotencyStore,
} from '../../src/index.js';
import type { EvidenceConnector, ExternalRecord, NormalizedRecord, IdentityResolution } from '../../src/index.js';

// --------------------------------------------------------------------------
// Mock connector
// --------------------------------------------------------------------------

function createTestConnector(records: ExternalRecord[]): EvidenceConnector {
  return {
    manifest: {
      name: 'test', evidenceClass: 'A', identityRequired: true,
      supportsIncremental: false, supportsRetry: true, supportsBackfill: false,
      supportsWebhook: false, description: 'Test connector',
    },
    async search() { return records; },
    async fetch(id: string) { return records.find(r => r.sourceRecordId === id) ?? null; },
    normalize(record: ExternalRecord, resolution: IdentityResolution | null): NormalizedRecord {
      return {
        sourceRecordId: record.sourceRecordId,
        siteId: resolution?.site?.siteId ?? 'unknown',
        evidenceClass: 'A', content: record.content, source: record.source,
        date: record.date, isCounterEvidence: record.isNegativeFinding,
        provenance: {
          createdByActorId: 'actor-1', createdByOrganizationId: 'org-1',
          correlationId: 'corr-1', summary: `Test: ${record.sourceRecordId}`,
        },
        rawPayload: record.rawPayload, externalUrl: record.externalUrl,
      };
    },
  };
}

// --------------------------------------------------------------------------
// Retry
// --------------------------------------------------------------------------

describe('withRetry', () => {
  it('succeeds on first attempt', async () => {
    const result = await withRetry(async () => 'ok');
    expect(result).toBe('ok');
  });

  it('retries on failure', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error('ECONNRESET');
      return 'recovered';
    });
    expect(result).toBe('recovered');
    expect(attempts).toBe(3);
  });

  it('throws on non-retryable error', async () => {
    await expect(withRetry(async () => { throw new Error('400 Bad Request'); })).rejects.toThrow();
  });
});

// --------------------------------------------------------------------------
// Rate limiter
// --------------------------------------------------------------------------

describe('RateLimiter', () => {
  it('allows burst requests', async () => {
    const limiter = new RateLimiter('test');
    await limiter.acquire();
    // Should not throw
    expect(true).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Provenance builder
// --------------------------------------------------------------------------

describe('buildProvenance', () => {
  it('builds standardized provenance', () => {
    const p = buildProvenance({
      sourceRecordId: 'NCT001', source: 'clinicaltrials', actorId: 'a',
      organizationId: 'o', correlationId: 'c', summary: 'Test record',
    });
    expect(p.createdByActorId).toBe('a');
    expect(p.summary).toContain('clinicaltrials');
  });
});

// --------------------------------------------------------------------------
// Idempotency
// --------------------------------------------------------------------------

describe('InMemoryIdempotencyStore', () => {
  it('detects duplicates', async () => {
    const store = new InMemoryIdempotencyStore();
    expect(await store.isImported('NCT001')).toBe(false);
    await store.markImported('NCT001');
    expect(await store.isImported('NCT001')).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Orchestrator — full pipeline
// --------------------------------------------------------------------------

describe('ConnectorOrchestrator', () => {
  it('ingests records through the framework', async () => {
    const records: ExternalRecord[] = [{
      sourceRecordId: 'NCT001', content: 'Test study',
      source: 'clinicaltrials', date: '2025-01-01',
      institutionName: 'Mayo Clinic Rochester', institutionCity: 'Rochester',
      institutionState: 'MN', institutionCountry: 'US',
      attributes: {}, rawPayload: {}, externalUrl: 'https://example.com',
      isNegativeFinding: false,
    }];

    const connector = createTestConnector(records);
    const identityResolver = {
      async resolve() {
        return {
          institution: { kadarnId: 'inst-1', canonicalName: 'Mayo Clinic' } as any,
          site: { siteId: 'site-1', siteName: 'Research Unit' } as any,
          resolutionTier: 1, unresolved: null, identityConfidence: 'high', explanation: 'Match',
        };
      },
    };
    let evidenceCreated = false;
    let counterEvidenceCreated = false;
    let staged = false;

    const orch = new ConnectorOrchestrator({
      identityResolver: identityResolver as any,
      evidenceCreator: { async createEvidenceNode(p: any) { evidenceCreated = true; return { id: 'ev-1' }; } },
      counterEvidenceCreator: { async createCounterEvidence(p: any) { counterEvidenceCreated = true; return { id: 'ce-1' }; } },
      stager: { async stage(p: any) { staged = true; return { stagingId: 's-1' }; } },
      actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    const result = await orch.ingest(connector, { institutionName: 'Mayo Clinic' });

    expect(result.totalFound).toBe(1);
    expect(result.ingested).toBe(1);
    expect(evidenceCreated).toBe(true);
    expect(result.duplicatesSkipped).toBe(0);
    expect(orch.getLogs().length).toBeGreaterThan(0);
  });

  it('stages unresolved records', async () => {
    const records: ExternalRecord[] = [{
      sourceRecordId: 'NCT999', content: 'Unknown study',
      source: 'clinicaltrials', date: '2025-01-01',
      institutionName: 'Unknown Institution', institutionCity: '', institutionState: '', institutionCountry: '',
      attributes: {}, rawPayload: {}, externalUrl: '', isNegativeFinding: false,
    }];

    const connector = createTestConnector(records);
    let staged = false;

    const orch = new ConnectorOrchestrator({
      identityResolver: {
        async resolve() {
          return { institution: null, site: null, resolutionTier: null, unresolved: null, identityConfidence: 'low', explanation: 'No match' };
        },
      } as any,
      evidenceCreator: { async createEvidenceNode(p: any) { return { id: 'x' }; } },
      counterEvidenceCreator: { async createCounterEvidence(p: any) { return { id: 'x' }; } } as any,
      stager: { async stage(p: any) { staged = true; return { stagingId: 's-1' }; } },
      actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    const result = await orch.ingest(connector, { institutionName: 'Unknown' });

    expect(result.totalFound).toBe(1);
    expect(result.ingested).toBe(0);
    expect(result.unresolved).toBe(1);
    expect(staged).toBe(true);
  });

  it('handles counter evidence records', async () => {
    const records: ExternalRecord[] = [{
      sourceRecordId: 'OAI-001', content: 'FDA OAI inspection',
      source: 'fda', date: '2025-01-01',
      institutionName: 'Mayo Clinic Rochester', institutionCity: 'Rochester',
      institutionState: 'MN', institutionCountry: 'US',
      attributes: {}, rawPayload: {}, externalUrl: '', isNegativeFinding: true,
    }];

    const connector = createTestConnector(records);
    let ceCreated = false;

    const orch = new ConnectorOrchestrator({
      identityResolver: {
        async resolve() { return { institution: { kadarnId: 'i1', canonicalName: 'Mayo' } as any, site: { siteId: 's1', siteName: 'Unit' } as any, resolutionTier: 1, unresolved: null, identityConfidence: 'high', explanation: 'Match' }; },
      } as any,
      evidenceCreator: { async createEvidenceNode(p: any) { return { id: 'x' }; } },
      counterEvidenceCreator: { async createCounterEvidence(p: any) { ceCreated = true; return { id: 'ce-1' }; } } as any,
      stager: { async stage(p: any) { return { stagingId: 's' }; } },
      actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    const result = await orch.ingest(connector, { institutionName: 'Mayo' });
    expect(result.counterEvidenceCreated).toBe(1);
    expect(ceCreated).toBe(true);
  });
});

describe('No forbidden operations', () => {
  it('no trust terminology in framework', () => {
    const fs = require('fs');
    const path = require('path');
    const files = ['types.ts', 'retry.ts', 'rate-limiter.ts', 'provenance.ts', 'idempotency.ts', 'orchestrator.ts'];
    const retired = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
      'gold_site', 'silver_site', 'bronze_site'];
    for (const file of files) {
      const content = fs.readFileSync(path.resolve(__dirname, '../../src/connectors/framework', file), 'utf-8').toLowerCase();
      for (const term of retired) {
        expect(content).not.toContain(term);
      }
    }
  });
});
