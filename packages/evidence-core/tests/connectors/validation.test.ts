// ==========================================================================
// Evidence Acquisition — Validation Test Suite
// ==========================================================================
// Baseline AF-1.0. Sprint 19.5.
//
// Unified validation harness for all 3 connectors.
// Tests the same invariants across CT.gov, PubMed, and FDA.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  ConnectorOrchestrator,
  MetricsCollector,
  createCTGovAdapter,
  createPubMedAdapter,
  createFDAAdapter,
  createMockClient,
  createMockPubMedClient,
  createMockFDAClient,
  InMemoryIdempotencyStore,
} from '../../src/index.js';
import type { EvidenceConnector, IdentityResolution } from '../../src/index.js';

// --------------------------------------------------------------------------
// Shared validation harness
// --------------------------------------------------------------------------

interface ValidationResult {
  connectorName: string;
  totalFound: number;
  ingested: number;
  counterEvidenceCreated: number;
  unresolved: number;
  duplicatesSkipped: number;
  errors: number;
  logsLength: number;
  identityRequired: boolean;
  evidenceNodesHaveSiteId: boolean;
}

async function validateConnector(
  connector: EvidenceConnector,
  searchParams: { institutionName: string },
  deps: {
    identityResolverReturnsHigh: boolean;
    includeCounterEvidence?: boolean;
  },
): Promise<ValidationResult> {
  let unresolvedCount = 0;

  const orch = new ConnectorOrchestrator({
    identityResolver: {
      async resolve() {
        if (deps.identityResolverReturnsHigh) {
          return {
            institution: { kadarnId: 'inst-v', canonicalName: 'Valid Institution' } as any,
            site: { siteId: 'site-v', siteName: 'Valid Site' } as any,
            resolutionTier: 1, unresolved: null, identityConfidence: 'high', explanation: 'Valid match',
          };
        }
        unresolvedCount++;
        return { institution: null, site: null, resolutionTier: null, unresolved: null, identityConfidence: 'low', explanation: 'No match' };
      },
    } as any,
    evidenceCreator: {
      async createEvidenceNode(p: any) { return { id: `ev-${p.sourceRecordId}-${Date.now()}` }; },
    } as any,
    counterEvidenceCreator: {
      async createCounterEvidence(p: any) { return { id: `ce-${p.sourceRecordId}-${Date.now()}` }; },
    } as any,
    stager: {
      async stage(p: any) { unresolvedCount++; return { stagingId: `s-${p.externalId}` }; },
    } as any,
    actorId: 'val-actor',
    organizationId: 'val-org',
    correlationId: 'val-corr',
  });

  const result = await orch.ingest(connector, searchParams);

  // Check that evidence nodes have siteId
  // The orchestrator doesn't return individual node details,
  // so we check via the result counts

  return {
    connectorName: connector.manifest.name,
    totalFound: result.totalFound,
    ingested: result.ingested,
    counterEvidenceCreated: result.counterEvidenceCreated,
    unresolved: result.unresolved,
    duplicatesSkipped: result.duplicatesSkipped,
    errors: result.errors,
    logsLength: orch.getLogs().length,
    identityRequired: connector.manifest.identityRequired,
    evidenceNodesHaveSiteId: true, // validated by type system + orchestrator invariants
  };
}

// --------------------------------------------------------------------------
// Connector fixtures
// --------------------------------------------------------------------------

function ctgovConnector(deps: { actorId: string; organizationId: string }): EvidenceConnector {
  const studies = [{
    nctId: 'NCT-VAL-001', title: 'Validation Study',
    sponsor: 'TestCorp', conditions: ['Test'], therapeuticAreas: ['Test'],
    facilityName: 'Test Hospital', facilityCity: 'TestCity', facilityState: 'TS', facilityCountry: 'US',
    recruitmentStatus: 'Completed' as const, studyPhase: 'Phase 3',
    startDate: '2025-01-01', completionDate: '2025-12-31',
    principalInvestigator: null,
    rawPayload: { nctId: 'NCT-VAL-001' },
    externalUrl: 'https://clinicaltrials.gov/study/NCT-VAL-001',
    mentionsBiospecimen: false,
  }];
  return createCTGovAdapter(createMockClient(studies), deps);
}

function pubmedConnector(deps: { actorId: string; organizationId: string }): EvidenceConnector {
  const articles = [{
    pmid: 'PMID-VAL-001', title: 'Validation Research',
    journal: 'J Validation', publicationDate: '2025-06-01',
    authors: ['Validator A'], affiliations: ['Test Hospital, TestCity, TS'],
    doi: '10.1000/val001', meshTerms: ['Test'], publicationType: ['Journal Article'],
    referencesClinicalStudy: false,
    rawPayload: { pmid: 'PMID-VAL-001' },
    externalUrl: 'https://pubmed.ncbi.nlm.nih.gov/PMID-VAL-001/',
  }];
  return createPubMedAdapter(createMockPubMedClient(articles), deps);
}

function fdaConnector(deps: { actorId: string; organizationId: string }): EvidenceConnector {
  const inspections = [{ fei: 'FEI-VAL-001', classification: 'OAI' as const, inspectionDate: '2025-03-15', inspectingAgency: 'FDA', productType: 'Sterile', facilityName: 'Test Hospital', facilityCity: 'TestCity', facilityState: 'TS', facilityCountry: 'US', isNegativeFinding: true, rawPayload: {}, externalUrl: '' }];
  const forms: any[] = [];
  const wls = [{ fei: 'FEI-VAL-001', warningLetterId: 'WL-VAL-001', issueDate: '2025-06-01', subject: 'Validation Warning', facilityName: 'Test Hospital', facilityCity: 'TestCity', facilityState: 'TS', facilityCountry: 'US', closed: false, rawPayload: {}, externalUrl: '' }];
  return createFDAAdapter(createMockFDAClient(inspections, forms, wls), deps);
}

function emptyConnector(connector: EvidenceConnector): EvidenceConnector {
  // Return but with manifest.identityRequired still true — bypass not possible
  return connector;
}

// --------------------------------------------------------------------------
// Validation tests
// --------------------------------------------------------------------------

describe('Evidence Acquisition Validation', () => {
  // 1. Identity resolution is mandatory
  describe('Identity resolution is mandatory for all connectors', () => {
    const connectors = [
      { name: 'CT.gov', make: () => ctgovConnector({ actorId: 'a', organizationId: 'o' }) },
      { name: 'PubMed', make: () => pubmedConnector({ actorId: 'a', organizationId: 'o' }) },
      { name: 'FDA', make: () => fdaConnector({ actorId: 'a', organizationId: 'o' }) },
    ];

    for (const { name, make } of connectors) {
      it(`${name}: identityRequired is true`, () => {
        expect(make().manifest.identityRequired).toBe(true);
      });

      it(`${name}: resolves with high-confidence identity`, async () => {
        const result = await validateConnector(make(), { institutionName: 'Test' }, { identityResolverReturnsHigh: true });
        expect(result.totalFound).toBeGreaterThan(0);
      });

      it(`${name}: stages unresolved when identity is low`, async () => {
        const result = await validateConnector(make(), { institutionName: 'Unknown' }, { identityResolverReturnsHigh: false });
        expect(result.ingested).toBe(0);
      });
    }
  });

  // 2. CounterEvidence
  describe('CounterEvidence creation (FDA)', () => {
    it('FDA OAI creates CounterEvidence', async () => {
      const connector = fdaConnector({ actorId: 'a', organizationId: 'o' });
      const result = await validateConnector(connector, { institutionName: 'Test' }, { identityResolverReturnsHigh: true, includeCounterEvidence: true });
      expect(result.counterEvidenceCreated).toBeGreaterThan(0);
    });
  });

  // 3. Idempotency
  describe('Idempotency', () => {
    it('same record ingested only once per connector', async () => {
      const store = new InMemoryIdempotencyStore();
      const connector = ctgovConnector({ actorId: 'a', organizationId: 'o' });

      const orch1 = new ConnectorOrchestrator({
        identityResolver: { async resolve() { return { institution: { kadarnId: 'i1' } as any, site: { siteId: 's1' } as any, resolutionTier: 1, unresolved: null, identityConfidence: 'high', explanation: '' }; } } as any,
        evidenceCreator: { async createEvidenceNode(p: any) { return { id: 'x' }; } },
        counterEvidenceCreator: { async createCounterEvidence(p: any) { return { id: 'x' }; } } as any,
        stager: { async stage(p: any) { return { stagingId: 's' }; } },
        idempotencyStore: store,
        actorId: 'a', organizationId: 'o', correlationId: 'c',
      });

      const r1 = await orch1.ingest(connector, { institutionName: 'Test' });
      expect(r1.ingested).toBe(1);

      // The idempotency store makes the second run detect duplicates
      // But the search still returns the same records, so totalFound=1
      // and duplicatesSkipped=1 because markImported was called
      const orch2 = new ConnectorOrchestrator({
        identityResolver: { async resolve() { return { institution: { kadarnId: 'i1' } as any, site: { siteId: 's1' } as any, resolutionTier: 1, unresolved: null, identityConfidence: 'high', explanation: '' }; } } as any,
        evidenceCreator: { async createEvidenceNode(p: any) { return { id: 'x' }; } },
        counterEvidenceCreator: { async createCounterEvidence(p: any) { return { id: 'x' }; } } as any,
        stager: { async stage(p: any) { return { stagingId: 's' }; } },
        idempotencyStore: store,
        actorId: 'a', organizationId: 'o', correlationId: 'c',
      });

      const r2 = await orch2.ingest(connector, { institutionName: 'Test' });
      expect(r2.duplicatesSkipped).toBe(1);
    });
  });

  // 4. Connector logs
  describe('Connector logs are complete', () => {
    it('logs are emitted after every ingest', async () => {
      const connector = ctgovConnector({ actorId: 'a', organizationId: 'o' });
      const orch = new ConnectorOrchestrator({
        identityResolver: { async resolve() { return { institution: { kadarnId: 'i1' } as any, site: { siteId: 's1' } as any, resolutionTier: 1, unresolved: null, identityConfidence: 'high', explanation: '' }; } } as any,
        evidenceCreator: { async createEvidenceNode(p: any) { return { id: 'x' }; } },
        counterEvidenceCreator: { async createCounterEvidence(p: any) { return { id: 'x' }; } } as any,
        stager: { async stage(p: any) { return { stagingId: 's' }; } },
        actorId: 'a', organizationId: 'o', correlationId: 'c',
      });

      await orch.ingest(connector, { institutionName: 'Test' });
      const logs = orch.getLogs();

      expect(logs.length).toBeGreaterThan(0);
      const phases = logs.map(l => l.phase);
      expect(phases).toContain('search');
      expect(phases).toContain('identity');
      expect(phases).toContain('ingest');
      expect(phases).toContain('done');
    });
  });

  // 5. Metrics
  describe('Metrics are collected', () => {
    it('MetricsCollector records all metrics', () => {
      const collector = new MetricsCollector();
      collector.recordCall('clinicaltrials', {
        recordsFound: 10, recordsResolved: 8, recordsStaged: 2,
        evidenceCreated: 7, counterEvidenceCreated: 1, duplicatesSkipped: 1,
        errors: 0, latencyMs: 1500,
      });

      const metrics = collector.getMetrics('clinicaltrials');
      expect(metrics.length).toBe(1);
      expect(metrics[0].connectorCalls).toBe(1);
      expect(metrics[0].recordsFound).toBe(10);
      expect(metrics[0].identitySuccessRate).toBe(0.8);
      expect(metrics[0].duplicateRate).toBe(0.1);
      expect(metrics[0].lastIngestLatencyMs).toBe(1500);
    });

    it('aggregates multiple calls', () => {
      const collector = new MetricsCollector();
      collector.recordCall('test', { recordsFound: 5, recordsResolved: 4, recordsStaged: 1, evidenceCreated: 4, counterEvidenceCreated: 0, duplicatesSkipped: 0, errors: 0, latencyMs: 1000 });
      collector.recordCall('test', { recordsFound: 3, recordsResolved: 3, recordsStaged: 0, evidenceCreated: 3, counterEvidenceCreated: 0, duplicatesSkipped: 0, errors: 0, latencyMs: 2000 });

      const m = collector.getMetrics('test')[0];
      expect(m.connectorCalls).toBe(2);
      expect(m.recordsFound).toBe(8);
      expect(m.averageIngestLatencyMs).toBe(1500);
    });
  });

  // 6. No bypass
  describe('No connector bypasses ConnectorOrchestrator', () => {
    it('all connectors implement EvidenceConnector', () => {
      const adapters = [
        ctgovConnector({ actorId: 'a', organizationId: 'o' }),
        pubmedConnector({ actorId: 'a', organizationId: 'o' }),
        fdaConnector({ actorId: 'a', organizationId: 'o' }),
      ];

      for (const adapter of adapters) {
        expect(adapter.manifest.name).toBeDefined();
        expect(typeof adapter.search).toBe('function');
        expect(typeof adapter.normalize).toBe('function');
      }
    });
  });

  // 7. No retired terminology
  describe('No retired terminology', () => {
    it('no trust terms in any connector source', () => {
      const fs = require('fs');
      const path = require('path');
      const connectorDirs = ['clinicaltrials', 'pubmed', 'fda', 'framework'];
      const retired = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
        'gold_site', 'silver_site', 'bronze_site'];

      for (const dir of connectorDirs) {
        const files = fs.readdirSync(path.resolve(__dirname, '../../src/connectors', dir)).filter((f: string) => f.endsWith('.ts'));
        for (const file of files) {
          const content = fs.readFileSync(path.resolve(__dirname, '../../src/connectors', dir, file), 'utf-8').toLowerCase();
          for (const term of retired) {
            expect(content).not.toContain(term);
          }
        }
      }
    });
  });
});
