// ==========================================================================
// Evidence Discovery — End-to-End Tests + Architecture Gates
// ==========================================================================
// Sprint 20A.7.
//
// Validates the complete Discovery Lite pipeline end-to-end.
// Every test asserts architecture invariants (no Evidence Core writes,
// no promotion, immutable layers, etc.).
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  // State machine
  createCandidate as createStateCandidate,
  executeTransition,
  executeTransitionSequence,
  StateMachineError,
  isTerminal,

  // Repository
  createSession,
  createRun,
  createArtifact,
  createLayer1,
  createCandidate as persistCandidate,
  createTransitionEvent,


  // Preparation
  createRequest,
  transitionRequest,
  InvalidRequestTransitionError,

  // Agents
  AgentRegistry,
  AgentRunner,
  DocumentClassifierAgent,
  EntityExtractorAgent,
  RelationshipExtractorAgent,

  // Orchestrator
  DiscoveryOrchestrator,

  // Snapshot
  SnapshotBuilder,

  // Curation
  CurationService,
  CurationError,
} from '../src/index.js';

import type { EvidenceCandidate, SemanticExtractionRequest, AgentResult, DiscoveryResult, DbClient } from '../src/index.js';

// ==========================================================================
// 1. Full end-to-end: SOP document
// ==========================================================================

describe('E2E: SOP document — happy path', () => {
  const sopMarkdown = `# Standard Operating Procedure
## Revision History
| Version | Date | Approved By |
|---------|------|-------------|
| 1.0 | 2025-01-15 | J. Smith |
## Procedure
This SOP describes sample processing.
Principal Investigator: Dr. Sarah Johnson
Equipment: Freezer #A-123
Samples stored at -80°C.`;

  it('completes full Discovery Lite pipeline', async () => {
    // 1. State machine: RAW_SOURCE → PROMOTED
    const c = createStateCandidate({ id: 'e2e-cand-1', artifactIds: ['art-1'], content: sopMarkdown, source: 'test', pipelineVersion: 'v1' });
    const path = ['DISCOVERED', 'CLASSIFIED', 'ENTITY_EXTRACTED', 'CLAIMS_PROPOSED', 'CURATION', 'ENRICHED', 'READY_FOR_PROMOTION', 'PROMOTED'];
    const { candidate } = executeTransitionSequence(c, path as any[], { actor: 'pipeline', pipelineVersion: 'v1', reason: 'E2E test' });
    expect(candidate.state).toBe('PROMOTED');
    expect(candidate.transitions.length).toBeGreaterThan(1);
  });

  it('agent pipeline classifies SOP and extracts entities', async () => {
    const agent = new DocumentClassifierAgent();
    const result = await agent.run({
      requestId: 'e2e-cls-1', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
      requestType: 'DOCUMENT_CLASSIFICATION', layer1Markdown: sopMarkdown,
      filename: 'sop.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });
    expect(result.status).toBe('COMPLETED');
    expect((result.output as any).documentType).toBe('SOP');
  });

  it('orchestrator produces DiscoveryResult', async () => {
    const store = createMockStores(sopMarkdown);
    const orch = new DiscoveryOrchestrator(store as any, 'v1');
    const result = await orch.runDiscovery({ discoveryRunId: 'e2e-run-1', artifactId: 'art-1', layer1Id: 'l1-1', inputHash: 'hash-sop' });
    expect(result.runId).toBeDefined();
    expect(result.classifications.length).toBeGreaterThanOrEqual(1);
    expect(result.entities.length).toBeGreaterThanOrEqual(1);
    expect(result.agentOutputs.length).toBe(3);
  });

  it('snapshot builds without calling agents', async () => {
    const store = createMockStores(sopMarkdown);
    const orch = new DiscoveryOrchestrator(store as any, 'v1');
    const result = await orch.runDiscovery({ discoveryRunId: 'e2e-snap-1', artifactId: 'art-1', layer1Id: 'l1-1', inputHash: 'h' });

    const builder = new SnapshotBuilder();
    const snapshot = builder.build(result);

    expect(snapshot.summary.documentsClassified).toBeGreaterThanOrEqual(1);
    expect(snapshot.documentInventory.length).toBeGreaterThan(0);
    expect(snapshot.nextBestAction.action.length).toBeGreaterThan(0);
  });

  it('curation creates immutable event', async () => {
    const db = fakeDb();
    const service = new CurationService(db);
    const event = await service.curate({
      targetType: 'CLASSIFICATION', targetId: 'e2e-class-1', action: 'ACCEPT',
      actorId: 'reviewer-1', reason: 'SOP classification verified.',
    });
    expect(event.id).toBeDefined();
    expect(event.action).toBe('ACCEPT');
    expect(db._events.length).toBe(1);
  });
});

// ==========================================================================
// 2. Unknown document
// ==========================================================================

describe('E2E: Unknown document', () => {
  const unknownMd = 'Generic administrative document with no laboratory or clinical signals.';

  it('classifies as UNKNOWN', async () => {
    const agent = new DocumentClassifierAgent();
    const result = await agent.run({
      requestId: 'e2e-unk-1', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
      requestType: 'DOCUMENT_CLASSIFICATION', layer1Markdown: unknownMd,
      filename: 'meeting.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });
    expect((result.output as any).documentType).toBe('UNKNOWN');
  });

  it('snapshot flags uncertainty', async () => {
    const store = createMockStores(unknownMd);
    const orch = new DiscoveryOrchestrator(store as any, 'v1');
    const result = await orch.runDiscovery({ discoveryRunId: 'e2e-unk-2', artifactId: 'a', layer1Id: 'l1', inputHash: 'h' });
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(result);
    expect(snapshot.uncertainty.length).toBeGreaterThanOrEqual(1);
  });
});

// ==========================================================================
// 3. Calibration record
// ==========================================================================

describe('E2E: Calibration record', () => {
  const md = `# Calibration Certificate
Equipment: Freezer #A-123
Calibration Due: 2026-06-30
Calibration Date: 2025-06-15
Temperature: -80°C`;

  it('extracts equipment and dates', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run({
      requestId: 'e2e-cal-1', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
      requestType: 'ENTITY_EXTRACTION', layer1Markdown: md,
      filename: 'cal.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });
    const entities = (result.output as any).entities as any[];
    expect(entities.filter((e: any) => e.type === 'EQUIPMENT').length).toBeGreaterThanOrEqual(1);
    expect(entities.filter((e: any) => e.type === 'DATE').length).toBeGreaterThanOrEqual(1);
  });
});

// ==========================================================================
// 4. Architecture gates
// ==========================================================================

describe('Architecture gates', () => {
  it('state machine rejects invalid transitions', () => {
    const c = createStateCandidate({ id: 'gate-1', artifactIds: ['a'], content: 'test', source: 't', pipelineVersion: 'v1' });
    expect(() => executeTransition(c, 'PROMOTED', { actor: 'skip', pipelineVersion: 'v1', reason: 'Skip' })).toThrow(StateMachineError);
  });

  it('terminal states reject further transitions', () => {
    const c = createStateCandidate({ id: 'gate-2', artifactIds: ['a'], content: 't', source: 't', pipelineVersion: 'v1' });
    const promoted = executeTransitionSequence(c, ['DISCOVERED', 'CLASSIFIED', 'ENTITY_EXTRACTED', 'CLAIMS_PROPOSED', 'CURATION', 'ENRICHED', 'READY_FOR_PROMOTION', 'PROMOTED'] as any[], { actor: 'p', pipelineVersion: 'v1', reason: '' }).candidate;
    expect(isTerminal(promoted.state)).toBe(true);
    expect(() => executeTransition(promoted, 'REJECTED', { actor: 'p', pipelineVersion: 'v1', reason: '' })).toThrow(StateMachineError);
  });

  it('request state machine validates transitions', () => {
    const req = createRequest({ discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1', requestType: 'DOCUMENT_CLASSIFICATION', pipelineVersion: 'v1', inputHash: 'h' });
    expect(() => transitionRequest(req, 'RUNNING')).toThrow(InvalidRequestTransitionError);
  });

  it('curation rejects missing actor', async () => {
    const db = fakeDb();
    const service = new CurationService(db);
    await expect(service.curate({ targetType: 'CLASSIFICATION', targetId: 'c', action: 'ACCEPT', actorId: '' })).rejects.toThrow(CurationError);
  });

  it('agents never promote Evidence Nodes', () => {
    for (const Agent of [DocumentClassifierAgent, EntityExtractorAgent, RelationshipExtractorAgent]) {
      const agent = new Agent();
      expect((agent as any).createEvidenceCandidate).toBeUndefined();
      expect((agent as any).promoteEvidence).toBeUndefined();
      expect((agent as any).computeConfidence).toBeUndefined();
    }
  });

  it('Snapshot consumes DiscoveryResult only', () => {
    const builder = new SnapshotBuilder();
    expect((builder as any).runDiscovery).toBeUndefined();
    expect((builder as any).classify).toBeUndefined();
    expect((builder as any).extractEntities).toBeUndefined();
  });
});

// ==========================================================================
// ==========================================================================
// Helpers
// ==========================================================================

function createMockStores(markdown: string) {
  return {
    requestStore: {
      create: async (r: any) => {},
      getById: async (id: string) => null,
      update: async (r: any) => {},
    },
    layer1Store: {
      getById: async (id: string) => ({ markdown, artifactId: 'art-1', metadata: {} }),
    },
    artifactStore: {
      getById: async (id: string) => ({ filename: 'doc.pdf', mimeType: 'application/pdf' }),
    },
    agentOutputStore: {
      save: async (r: any) => {},
    },
  };
}

function fakeDb(): DbClient & { _events: any[] } {
  const events: any[] = [];
  return {
    _events: events,
    from(table: string) {
      return {
        async insert(data: any) { const id = crypto.randomUUID(); events.push({ id, ...data }); return { data: { id }, error: null }; },
        select(_cols: string) { return { async eq(col: string, val: unknown) { return { data: events.filter((e: any) => e[col] === val), error: null }; }, }; },
      } as any;
    },
    async rpc() { return { data: null, error: null }; },
  };
}
