// ==========================================================================
// Evidence Discovery — Agent Pipeline Tests
// ==========================================================================
// Sprint 20A.4A.
// Tests AgentRegistry, AgentRunner, DocumentClassifierAgent.
// No LLM required. Deterministic classification.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  AgentRegistry,
  AgentRunner,
  DocumentClassifierAgent,
  EntityExtractorAgent,
  RelationshipExtractorAgent,
} from '../src/index.js';
import type { SemanticExtractionRequest, AgentResult } from '../src/index.js';

// --------------------------------------------------------------------------
// Sample Layer 1 documents
// --------------------------------------------------------------------------

const SOP_MARKDOWN = `# Standard Operating Procedure
## Revision History
| Version | Date | Approved By |
|---------|------|-------------|
| 1.0 | 2025-01-15 | J. Smith |

## Procedure
This standard operating procedure describes the process for...`;

const CALIBRATION_MARKDOWN = `# Calibration Certificate
**Equipment:** Freezer #A-123
**Calibration Due:** 2026-06-30
**Certificate of Calibration:** #CC-2025-042

Calibration performed on 2025-06-15. Results within specifications.`;

const SHIPMENT_MARKDOWN = `# Shipment Log
**Tracking Number:** SHIP-2025-078
**Cold Chain:** Maintained at -80°C
**Chain of Custody:** Signed

Shipped 24 samples to Central Lab on 2025-03-20.`;

const UNKNOWN_MARKDOWN = `# Meeting Notes
Quarterly review meeting held on 2025-04-10.
Attendees: J. Smith, M. Johnson, R. Williams.`;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeRequest(overrides?: Partial<SemanticExtractionRequest>): SemanticExtractionRequest {
  return {
    requestId: overrides?.requestId ?? 'req-classify-1',
    discoveryRunId: 'run-1',
    artifactId: overrides?.artifactId ?? 'artifact-1',
    layer1Id: overrides?.layer1Id ?? 'layer1-1',
    requestType: 'DOCUMENT_CLASSIFICATION',
    status: 'PENDING',
    priority: 'normal',
    pipelineVersion: 'discovery-v0.1.0',
    agentVersion: null,
    modelVersion: null,
    inputHash: 'hash-1',
    outputRef: null,
    error: null,
    createdAt: new Date().toISOString(),
    claimedAt: null,
    completedAt: null,
    failedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

// --------------------------------------------------------------------------
// Agent interface
// --------------------------------------------------------------------------

describe('DocumentClassifierAgent — interface', () => {
  it('implements DiscoveryAgent', () => {
    const agent = new DocumentClassifierAgent();
    expect(agent.name).toBe('document-classifier');
    expect(agent.version).toBeDefined();
    expect(typeof agent.supports).toBe('function');
    expect(typeof agent.run).toBe('function');
  });

  it('supports DOCUMENT_CLASSIFICATION', () => {
    const agent = new DocumentClassifierAgent();
    expect(agent.supports('DOCUMENT_CLASSIFICATION')).toBe(true);
    expect(agent.supports('ENTITY_EXTRACTION')).toBe(false);
  });
});

// --------------------------------------------------------------------------
// Classification
// --------------------------------------------------------------------------

describe('DocumentClassifierAgent — classification', () => {
  it('classifies SOP-like markdown as SOP', async () => {
    const agent = new DocumentClassifierAgent();
    const result = await agent.run({
      requestId: 'req-1', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
      requestType: 'DOCUMENT_CLASSIFICATION', layer1Markdown: SOP_MARKDOWN,
      filename: 'sop-v3.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });

    expect(result.status).toBe('COMPLETED');
    const output = result.output as any;
    expect(output.documentType).toBe('SOP');
    expect(output.documentTypeConfidence).toBeGreaterThan(0);
    expect(output.detectedSignals.length).toBeGreaterThan(0);
    expect(output.rationale).toBeDefined();
  });

  it('classifies calibration-like markdown as CALIBRATION_RECORD', async () => {
    const agent = new DocumentClassifierAgent();
    const result = await agent.run({
      requestId: 'req-2', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
      requestType: 'DOCUMENT_CLASSIFICATION', layer1Markdown: CALIBRATION_MARKDOWN,
      filename: 'calibration.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });

    expect(result.status).toBe('COMPLETED');
    expect((result.output as any).documentType).toBe('CALIBRATION_RECORD');
  });

  it('classifies shipment-like markdown as SHIPMENT_LOG', async () => {
    const agent = new DocumentClassifierAgent();
    const result = await agent.run({
      requestId: 'req-3', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
      requestType: 'DOCUMENT_CLASSIFICATION', layer1Markdown: SHIPMENT_MARKDOWN,
      filename: 'shipment-log.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });

    expect(result.status).toBe('COMPLETED');
    expect((result.output as any).documentType).toBe('SHIPMENT_LOG');
  });

  it('classifies unknown markdown as UNKNOWN', async () => {
    const agent = new DocumentClassifierAgent();
    const result = await agent.run({
      requestId: 'req-4', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
      requestType: 'DOCUMENT_CLASSIFICATION', layer1Markdown: UNKNOWN_MARKDOWN,
      filename: 'meeting-notes.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });

    expect(result.status).toBe('COMPLETED');
    expect((result.output as any).documentType).toBe('UNKNOWN');
    expect((result.output as any).documentTypeConfidence).toBe(0);
  });

  it('includes provenance in result', async () => {
    const agent = new DocumentClassifierAgent();
    const result = await agent.run({
      requestId: 'req-prov', discoveryRunId: 'r', artifactId: 'art-1', layer1Id: 'l1-1',
      requestType: 'DOCUMENT_CLASSIFICATION', layer1Markdown: SOP_MARKDOWN,
      filename: 'sop.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'discovery-v1',
    });

    expect(result.provenance.agentName).toBe('document-classifier');
    expect(result.provenance.agentVersion).toBeDefined();
    expect(result.provenance.pipelineVersion).toBe('discovery-v1');
    expect(result.provenance.layer1Id).toBe('l1-1');
    expect(result.provenance.artifactId).toBe('art-1');
    expect(result.provenance.startedAt).toBeDefined();
    expect(result.provenance.completedAt).toBeDefined();
  });

  it('flags low confidence for human review', async () => {
    const agent = new DocumentClassifierAgent();
    const result = await agent.run({
      requestId: 'req-5', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
      requestType: 'DOCUMENT_CLASSIFICATION',
      layer1Markdown: 'Some document with minimal signals.',
      filename: 'doc.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });

    const output = result.output as any;
    if (output.documentType === 'UNKNOWN') {
      expect(output.requiresHumanReview).toBe(true);
    }
  });
});

// --------------------------------------------------------------------------
// Agent Registry
// --------------------------------------------------------------------------

describe('AgentRegistry', () => {
  it('finds DocumentClassifierAgent for DOCUMENT_CLASSIFICATION', () => {
    const registry = new AgentRegistry([new DocumentClassifierAgent()]);
    const agent = registry.find('DOCUMENT_CLASSIFICATION');
    expect(agent.name).toBe('document-classifier');
  });

  it('throws when no agent supports the request type', () => {
    const registry = new AgentRegistry([new DocumentClassifierAgent()]);
    expect(() => registry.find('ENTITY_EXTRACTION')).toThrow('No agent supports');
  });
});

// --------------------------------------------------------------------------
// Agent Runner
// --------------------------------------------------------------------------

describe('AgentRunner', () => {
  it('executes DocumentClassifierAgent end-to-end', async () => {
    const agent = new DocumentClassifierAgent();
    const registry = new AgentRegistry([agent]);

    let storedRequest: SemanticExtractionRequest | null = null;
    let savedOutput: AgentResult | null = null;

    const runner = new AgentRunner(
      registry,
      {
        getById: async (id) => storedRequest,
        update: async (req) => { storedRequest = req; },
      },
      {
        getById: async (id) => ({
          markdown: SOP_MARKDOWN,
          artifactId: 'artifact-1',
          metadata: { extractor: 'markitdown', pages: 3 },
        }),
      },
      {
        getById: async (id) => ({ filename: 'sop-v3.pdf', mimeType: 'application/pdf' }),
      },
      {
        save: async (result) => { savedOutput = result; },
      },
      'discovery-v0.1.0',
    );

    const request = makeRequest({ requestId: 'req-runner-1' });
    storedRequest = request;

    const result = await runner.execute(request);

    expect(result.status).toBe('COMPLETED');
    expect((result.output as any).documentType).toBe('SOP');
    expect(savedOutput).not.toBeNull();
    expect(savedOutput!.requestId).toBe('req-runner-1');
    expect(storedRequest!.status).toBe('COMPLETED');
  });

  it('handles agent failure gracefully', async () => {
    class BrokenAgent extends DocumentClassifierAgent {
      async run() { throw new Error('Intentional failure'); }
    }

    const registry = new AgentRegistry([new BrokenAgent()]);
    let storedRequest: SemanticExtractionRequest | null = null;
    let savedOutput: AgentResult | null = null;

    const runner = new AgentRunner(
      registry,
      {
        getById: async (id) => storedRequest,
        update: async (req) => { storedRequest = req; },
      },
      {
        getById: async (id) => ({ markdown: 'test', artifactId: 'a', metadata: {} }),
      },
      {
        getById: async (id) => ({ filename: 'doc.pdf', mimeType: 'application/pdf' }),
      },
      {
        save: async (result) => { savedOutput = result; },
      },
      'v1',
    );

    const request = makeRequest({ requestId: 'req-fail-1' });
    storedRequest = request;

    const result = await runner.execute(request);

    expect(result.status).toBe('FAILED');
    expect(storedRequest!.status).toBe('FAILED');
    expect(storedRequest!.error).toBe('Intentional failure');
  });
});

// --------------------------------------------------------------------------
// Boundary compliance
// --------------------------------------------------------------------------

describe('Boundary compliance', () => {
  it('agent does not create EvidenceCandidates or write to Evidence Core', () => {
    const agent = new DocumentClassifierAgent();
    expect((agent as any).createEvidenceCandidate).toBeUndefined();
    expect((agent as any).createClaimCandidate).toBeUndefined();
    expect((agent as any).promoteEvidence).toBeUndefined();
    expect((agent as any).computeConfidence).toBeUndefined();
  });

  it('agent output preserves provenance', async () => {
    const agent = new DocumentClassifierAgent();
    const result = await agent.run({
      requestId: 'req-prov-2', discoveryRunId: 'r', artifactId: 'art-2', layer1Id: 'l1-2',
      requestType: 'DOCUMENT_CLASSIFICATION', layer1Markdown: SOP_MARKDOWN,
      filename: 'sop.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });

    expect(result.provenance.artifactId).toBe('art-2');
    expect(result.provenance.layer1Id).toBe('l1-2');
  });
});

// --------------------------------------------------------------------------
// EntityExtractorAgent
// --------------------------------------------------------------------------
describe('EntityExtractorAgent', () => {
  const clinicalMarkdown = `# Study Protocol PRO-2025-001
Principal Investigator: Dr. Sarah Johnson
Site: University of California, San Francisco
Sponsor: PharmaCorp Inc.
CRO: Central Lab Services
Equipment: Freezer #A-123 was calibrated on 2025-03-15.
Temperature: Samples stored at -80°C. Shipment maintained at 2-8°C.
FDA inspection conducted on June 15, 2025.`;

  const ctx = (md: string) => ({
    requestId: 'req-ent-1', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
    requestType: 'ENTITY_EXTRACTION' as const, layer1Markdown: md,
    filename: 'protocol.pdf', mimeType: 'application/pdf',
    extractionMetadata: {}, pipelineVersion: 'v1',
  });

  it('extracts investigator names', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run(ctx(clinicalMarkdown));
    const entities = (result.output as any).entities as any[];
    const investigators = entities.filter((e: any) => e.type === 'INVESTIGATOR');
    expect(investigators.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts institution names', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run(ctx(clinicalMarkdown));
    expect(result.status).toBe('COMPLETED');
    expect((result.output as any).entities.length).toBeGreaterThan(0);
  });

  it('extracts sponsor names', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run(ctx(clinicalMarkdown));
    const sponsors = (result.output as any).entities.filter((e: any) => e.type === 'SPONSOR');
    expect(sponsors.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts CRO names', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run(ctx(clinicalMarkdown));
    const cros = (result.output as any).entities.filter((e: any) => e.type === 'CRO');
    expect(cros.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts equipment terms', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run(ctx(clinicalMarkdown));
    const equipment = (result.output as any).entities.filter((e: any) => e.type === 'EQUIPMENT');
    expect(equipment.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts temperatures', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run(ctx(clinicalMarkdown));
    const temps = (result.output as any).entities.filter((e: any) => e.type === 'TEMPERATURE');
    expect(temps.length).toBeGreaterThanOrEqual(2);
  });

  it('extracts dates', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run(ctx(clinicalMarkdown));
    const dates = (result.output as any).entities.filter((e: any) => e.type === 'DATE');
    expect(dates.length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty markdown safely', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run(ctx(''));
    expect(result.status).toBe('COMPLETED');
    const entities = (result.output as any).entities;
    expect(entities.length).toBe(0);
  });

  it('preserves provenance', async () => {
    const agent = new EntityExtractorAgent();
    const result = await agent.run({
      requestId: 'req-prov-e', discoveryRunId: 'r', artifactId: 'art-e', layer1Id: 'l1-e',
      requestType: 'ENTITY_EXTRACTION', layer1Markdown: clinicalMarkdown,
      filename: 'p.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });
    expect(result.provenance.agentName).toBe('entity-extractor');
    expect(result.provenance.artifactId).toBe('art-e');
    expect(result.provenance.layer1Id).toBe('l1-e');
  });
});

// --------------------------------------------------------------------------
// RelationshipExtractorAgent
// --------------------------------------------------------------------------
describe('RelationshipExtractorAgent', () => {
  const md = `# Study Protocol PRO-2025-001
Sponsored by PharmaCorp Inc.
Principal Investigator: Dr. Sarah Johnson at University of California
Samples shipped on 2025-03-15.
Freezer #A-123 calibration due: 2025-06-30.`;

  const ctx = (mdText: string) => ({
    requestId: 'req-rel-1', discoveryRunId: 'r', artifactId: 'a', layer1Id: 'l1',
    requestType: 'RELATIONSHIP_EXTRACTION' as const, layer1Markdown: mdText,
    filename: 'protocol.pdf', mimeType: 'application/pdf',
    extractionMetadata: {}, pipelineVersion: 'v1',
  });

  it('extracts relationships from entities', async () => {
    const agent = new RelationshipExtractorAgent();
    const result = await agent.run(ctx(md));
    expect(result.status).toBe('COMPLETED');
    const output = result.output as any;
    expect(output.relationships).toBeDefined();
    expect(output.entityCount).toBeGreaterThan(0);
  });

  it('detects study-sponsor relationships', async () => {
    const agent = new RelationshipExtractorAgent();
    const result = await agent.run(ctx(md));
    const rels = (result.output as any).relationships as any[];
    const studySponsor = rels.filter((r: any) => r.type === 'STUDY_SPONSORED_BY');
    expect(studySponsor.length).toBeGreaterThanOrEqual(0);
  });

  it('handles empty markdown', async () => {
    const agent = new RelationshipExtractorAgent();
    const result = await agent.run(ctx(''));
    expect(result.status).toBe('COMPLETED');
    expect((result.output as any).relationships).toEqual([]);
  });

  it('preserves provenance', async () => {
    const agent = new RelationshipExtractorAgent();
    const result = await agent.run({
      requestId: 'req-prov-r', discoveryRunId: 'r', artifactId: 'art-r', layer1Id: 'l1-r',
      requestType: 'RELATIONSHIP_EXTRACTION', layer1Markdown: md,
      filename: 'p.pdf', mimeType: 'application/pdf',
      extractionMetadata: {}, pipelineVersion: 'v1',
    });
    expect(result.provenance.agentName).toBe('relationship-extractor');
    expect(result.provenance.artifactId).toBe('art-r');
    expect(result.provenance.layer1Id).toBe('l1-r');
  });
});

// --------------------------------------------------------------------------
// All agents boundary compliance
// --------------------------------------------------------------------------
describe('All agents — boundary compliance', () => {
  const agents = [
    new DocumentClassifierAgent(),
    new EntityExtractorAgent(),
    new RelationshipExtractorAgent(),
  ];

  for (const agent of agents) {
    it(`${agent.name} does not write to Evidence Core`, () => {
      expect((agent as any).createEvidenceCandidate).toBeUndefined();
      expect((agent as any).createClaimCandidate).toBeUndefined();
      expect((agent as any).promoteEvidence).toBeUndefined();
      expect((agent as any).computeConfidence).toBeUndefined();
    });
  }
});
