// ==========================================================================
// Evidence Discovery — Orchestrator Tests
// ==========================================================================
// Sprint 20A.4C.
// Tests the DiscoveryOrchestrator coordinating all agents end-to-end.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { DiscoveryOrchestrator } from '../src/index.js';
import type { SemanticExtractionRequest, AgentResult } from '../src/index.js';

const PIPELINE = 'discovery-v0.1.0';
const SOP_MARKDOWN = `# Standard Operating Procedure
## Revision History
| Version | Date | Approved By |
|---------|------|-------------|
| 1.0 | 2025-01-15 | J. Smith |

## Procedure
This standard operating procedure describes the process for sample handling.
Principal Investigator: Dr. Sarah Johnson at University of California
Samples stored at -80°C.`;

// --------------------------------------------------------------------------
// Mock stores
// --------------------------------------------------------------------------

function createMockStores() {
  const requests = new Map<string, SemanticExtractionRequest>();
  const agentOutputs: AgentResult[] = [];

  return {
    requestStore: {
      create: async (req: SemanticExtractionRequest) => { requests.set(req.requestId, req); },
      getById: async (id: string) => requests.get(id) ?? null,
      update: async (req: SemanticExtractionRequest) => { requests.set(req.requestId, req); },
    },
    layer1Store: {
      getById: async (id: string) => ({
        markdown: SOP_MARKDOWN,
        artifactId: 'artifact-1',
        metadata: { extractor: 'markitdown', pages: 3 },
      }),
    },
    artifactStore: {
      getById: async (id: string) => ({ filename: 'sop-v3.pdf', mimeType: 'application/pdf' }),
    },
    agentOutputStore: {
      save: async (result: AgentResult) => { agentOutputs.push(result); },
    },
    getAgentOutputs: () => agentOutputs,
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('DiscoveryOrchestrator', () => {
  it('runs full pipeline and produces DiscoveryResult', async () => {
    const stores = createMockStores();
    const orch = new DiscoveryOrchestrator(stores, PIPELINE);

    const result = await orch.runDiscovery({
      discoveryRunId: 'run-orch-1',
      artifactId: 'artifact-1',
      layer1Id: 'layer1-1',
      inputHash: 'hash-abc',
    });

    expect(result.runId).toBe('run-orch-1');
    expect(result.pipelineVersion).toBe(PIPELINE);
    expect(result.completedAt).toBeDefined();
    expect(result.agentOutputs.length).toBe(3);
  });

  it('produces classifications from DocumentClassifier', async () => {
    const stores = createMockStores();
    const orch = new DiscoveryOrchestrator(stores, PIPELINE);

    const result = await orch.runDiscovery({
      discoveryRunId: 'run-orch-2', artifactId: 'a', layer1Id: 'l1', inputHash: 'h',
    });

    expect(result.classifications.length).toBeGreaterThanOrEqual(1);
    expect(result.classifications[0].documentType).toBeDefined();
    expect(result.classifications[0].confidence).toBeGreaterThanOrEqual(0);
  });

  it('produces entities from EntityExtractor', async () => {
    const stores = createMockStores();
    const orch = new DiscoveryOrchestrator(stores, PIPELINE);

    const result = await orch.runDiscovery({
      discoveryRunId: 'run-orch-3', artifactId: 'a', layer1Id: 'l1', inputHash: 'h',
    });

    expect(result.entities.length).toBeGreaterThan(0);
    const investigators = result.entities.filter(e => e.type === 'INVESTIGATOR');
    const temps = result.entities.filter(e => e.type === 'TEMPERATURE');
    expect(investigators.length + temps.length).toBeGreaterThanOrEqual(1);
  });

  it('produces relationships from RelationshipExtractor', async () => {
    const stores = createMockStores();
    const orch = new DiscoveryOrchestrator(stores, PIPELINE);

    const result = await orch.runDiscovery({
      discoveryRunId: 'run-orch-4', artifactId: 'a', layer1Id: 'l1', inputHash: 'h',
    });

    expect(result.relationships).toBeDefined();
    // May be empty if no clear entity links, but should be an array
    expect(Array.isArray(result.relationships)).toBe(true);
  });

  it('includes artifact info', async () => {
    const stores = createMockStores();
    const orch = new DiscoveryOrchestrator(stores, PIPELINE);

    const result = await orch.runDiscovery({
      discoveryRunId: 'run-orch-5', artifactId: 'artifact-1', layer1Id: 'l1', inputHash: 'h',
    });

    expect(result.artifacts.length).toBeGreaterThanOrEqual(1);
    expect(result.artifacts[0].artifactId).toBe('artifact-1');
  });

  it('creates 3 requests (one per agent type)', async () => {
    const stores = createMockStores();
    const orch = new DiscoveryOrchestrator(stores, PIPELINE);

    const origCreate = stores.requestStore.create;
    let createCount = 0;
    stores.requestStore.create = async (req) => {
      createCount++;
      await origCreate(req);
    };

    await orch.runDiscovery({
      discoveryRunId: 'run-orch-6', artifactId: 'a', layer1Id: 'l1', inputHash: 'h',
    });

    expect(createCount).toBe(3); // DOCUMENT_CLASSIFICATION, ENTITY_EXTRACTION, RELATIONSHIP_EXTRACTION
  });
});
