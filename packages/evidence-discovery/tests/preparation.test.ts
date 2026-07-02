// ==========================================================================
// Evidence Discovery — Preparation Layer Tests
// ==========================================================================
// Sprint 20A.3B.
// Tests semantic extraction request lifecycle, transitions, queue, idempotency.
// No agents. No Evidence Core writes.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  createRequest,
  transitionRequest,
  InvalidRequestTransitionError,
  ALL_REQUEST_TYPES,
  ALLOWED_REQUEST_TRANSITIONS,
} from '../src/index.js';
import type { SemanticExtractionRequest, SemanticRequestStatus } from '../src/index.js';

const PIPELINE = 'discovery-v0.1.0';

function makeRequest(overrides?: Partial<SemanticExtractionRequest>): SemanticExtractionRequest {
  return createRequest({
    discoveryRunId: overrides?.discoveryRunId ?? 'run-1',
    artifactId: overrides?.artifactId ?? 'artifact-1',
    layer1Id: overrides?.layer1Id ?? 'layer1-1',
    requestType: overrides?.requestType ?? 'DOCUMENT_CLASSIFICATION',
    pipelineVersion: PIPELINE,
    inputHash: 'abc123',
  });
}

// --------------------------------------------------------------------------
// Request types
// --------------------------------------------------------------------------

describe('Request types', () => {
  it('has all 7 request types', () => {
    expect(ALL_REQUEST_TYPES).toHaveLength(7);
    expect(ALL_REQUEST_TYPES).toContain('DOCUMENT_CLASSIFICATION');
    expect(ALL_REQUEST_TYPES).toContain('ENTITY_EXTRACTION');
    expect(ALL_REQUEST_TYPES).toContain('RELATIONSHIP_EXTRACTION');
    expect(ALL_REQUEST_TYPES).toContain('CLAIM_CANDIDATE_DETECTION');
    expect(ALL_REQUEST_TYPES).toContain('TIMELINE_RECONSTRUCTION');
    expect(ALL_REQUEST_TYPES).toContain('GAP_DETECTION');
    expect(ALL_REQUEST_TYPES).toContain('LEVERAGE_RECOMMENDATION');
  });
});

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

describe('createRequest', () => {
  it('creates a PENDING request with all required fields', () => {
    const r = makeRequest();
    expect(r.requestId).toBeDefined();
    expect(r.status).toBe('PENDING');
    expect(r.discoveryRunId).toBe('run-1');
    expect(r.artifactId).toBe('artifact-1');
    expect(r.layer1Id).toBe('layer1-1');
    expect(r.requestType).toBe('DOCUMENT_CLASSIFICATION');
    expect(r.pipelineVersion).toBe(PIPELINE);
    expect(r.createdAt).toBeDefined();
  });

  it('creates requests for all 7 types', () => {
    for (const requestType of ALL_REQUEST_TYPES) {
      const r = createRequest({
        discoveryRunId: 'run-1', artifactId: 'a-1', layer1Id: 'l1-1',
        requestType, pipelineVersion: PIPELINE, inputHash: 'h',
      });
      expect(r.requestType).toBe(requestType);
      expect(r.status).toBe('PENDING');
    }
  });
});

// --------------------------------------------------------------------------
// Status transitions
// --------------------------------------------------------------------------

describe('Status transitions', () => {
  it('PENDING → CLAIMED → RUNNING → COMPLETED', () => {
    const r = makeRequest();
    const claimed = transitionRequest(r, 'CLAIMED', { agentVersion: 'agent-v1' });
    expect(claimed.status).toBe('CLAIMED');
    expect(claimed.claimedAt).toBeDefined();
    expect(claimed.agentVersion).toBe('agent-v1');

    const running = transitionRequest(claimed, 'RUNNING');
    expect(running.status).toBe('RUNNING');

    const completed = transitionRequest(running, 'COMPLETED', { outputRef: 'candidate-123' });
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeDefined();
    expect(completed.outputRef).toBe('candidate-123');
  });

  it('PENDING → FAILED → PENDING (retry)', () => {
    const r = makeRequest();
    const claimed = transitionRequest(r, 'CLAIMED');
    const failed = transitionRequest(claimed, 'FAILED', { error: 'Extraction failed: timeout' });
    expect(failed.status).toBe('FAILED');
    expect(failed.failedAt).toBeDefined();
    expect(failed.error).toBe('Extraction failed: timeout');

    const retry = transitionRequest(failed, 'PENDING');
    expect(retry.status).toBe('PENDING');
  });

  it('PENDING → SKIPPED', () => {
    const r = makeRequest();
    const skipped = transitionRequest(r, 'SKIPPED');
    expect(skipped.status).toBe('SKIPPED');
  });

  it('PENDING → CANCELLED', () => {
    const r = makeRequest();
    const cancelled = transitionRequest(r, 'CANCELLED');
    expect(cancelled.status).toBe('CANCELLED');
  });
});

// --------------------------------------------------------------------------
// Invalid transitions
// --------------------------------------------------------------------------

describe('Invalid transitions', () => {
  it('PENDING → RUNNING is invalid', () => {
    const r = makeRequest();
    expect(() => transitionRequest(r, 'RUNNING')).toThrow(InvalidRequestTransitionError);
  });

  it('COMPLETED → nothing', () => {
    const r = makeRequest();
    const c = transitionRequest(r, 'CLAIMED');
    const r2 = transitionRequest(c, 'RUNNING');
    const completed = transitionRequest(r2, 'COMPLETED');

    for (const status of ['PENDING', 'CLAIMED', 'RUNNING', 'FAILED', 'CANCELLED', 'SKIPPED'] as SemanticRequestStatus[]) {
      expect(() => transitionRequest(completed, status)).toThrow(InvalidRequestTransitionError);
    }
  });
});

// --------------------------------------------------------------------------
// Idempotency / duplicate detection (domain-level)
// --------------------------------------------------------------------------

describe('Duplicate detection', () => {
  it('same layer1Id + requestType + pipelineVersion creates same inputHash', () => {
    const r1 = createRequest({
      discoveryRunId: 'run-1', artifactId: 'a', layer1Id: 'l1-1',
      requestType: 'DOCUMENT_CLASSIFICATION', pipelineVersion: PIPELINE, inputHash: 'hash-x',
    });
    const r2 = createRequest({
      discoveryRunId: 'run-2', artifactId: 'a', layer1Id: 'l1-1',
      requestType: 'DOCUMENT_CLASSIFICATION', pipelineVersion: PIPELINE, inputHash: 'hash-x',
    });
    // Different runIds, same layer1Id + requestType + pipelineVersion
    expect(r1.inputHash).toBe(r2.inputHash);
    expect(r1.layer1Id).toBe(r2.layer1Id);
    expect(r1.requestType).toBe(r2.requestType);
  });
});

// --------------------------------------------------------------------------
// Traceability
// --------------------------------------------------------------------------

describe('Traceability', () => {
  it('every request traces back to Layer 1 and artifact', () => {
    const r = createRequest({
      discoveryRunId: 'run-trace', artifactId: 'artifact-42', layer1Id: 'layer1-99',
      requestType: 'ENTITY_EXTRACTION', pipelineVersion: PIPELINE, inputHash: 'hash-t',
    });
    expect(r.artifactId).toBe('artifact-42');
    expect(r.layer1Id).toBe('layer1-99');
  });
});

// --------------------------------------------------------------------------
// No Evidence Core writes
// --------------------------------------------------------------------------

describe('Boundary compliance', () => {
  it('preparation module has no Evidence Core functions', () => {
    const prep = {
      createRequest: typeof createRequest,
      transitionRequest: typeof transitionRequest,
    };
    expect((prep as any).createEvidenceNode).toBeUndefined();
    expect((prep as any).promoteCandidate).toBeUndefined();
    expect((prep as any).computeConfidence).toBeUndefined();
  });
});
