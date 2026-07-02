// ==========================================================================
// Evidence Discovery — Domain + State Machine Tests
// ==========================================================================
// Sprint 20A.1. KEMS-002A.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  executeTransition,
  createCandidate,
  assertState,
  isTerminal,
  executeTransitionSequence,
  StateMachineError,
  ALLOWED_TRANSITIONS,
} from '../src/index.js';
import type { EvidenceCandidate, DiscoveryState } from '../src/index.js';

const PIPELINE = 'discovery-v0.1.0';

function makeCandidate(overrides?: Partial<EvidenceCandidate>): EvidenceCandidate {
  return createCandidate({
    id: overrides?.id ?? 'candidate-1',
    artifactIds: ['artifact-1'],
    content: 'Test evidence content',
    source: 'upload',
    pipelineVersion: PIPELINE,
  });
}

// --------------------------------------------------------------------------
// State machine structure
// --------------------------------------------------------------------------

describe('State machine structure', () => {
  it('has all 16 states defined with transitions', () => {
    const requiredStates: DiscoveryState[] = [
      'RAW_SOURCE', 'DISCOVERED', 'CLASSIFIED', 'ENTITY_EXTRACTED',
      'CLAIMS_PROPOSED', 'CURATION', 'ENRICHED', 'NEEDS_MORE_EVIDENCE',
      'READY_FOR_PROMOTION', 'PROMOTED', 'REJECTED', 'MERGED', 'SPLIT',
      'ARCHIVED', 'DISCOVERY_FAILED', 'CLASSIFICATION_FAILED',
      'ENTITY_EXTRACTION_FAILED', 'CLAIM_DETECTION_FAILED',
    ];

    for (const state of requiredStates) {
      expect(ALLOWED_TRANSITIONS[state]).toBeDefined();
    }
  });
});

// --------------------------------------------------------------------------
// Candidate creation
// --------------------------------------------------------------------------

describe('createCandidate', () => {
  it('creates a candidate in RAW_SOURCE state', () => {
    const c = createCandidate({ id: 'c-1', artifactIds: ['a-1'], content: 'Test', source: 'upload', pipelineVersion: PIPELINE });
    expect(c.state).toBe('RAW_SOURCE');
    expect(c.transitions.length).toBe(1);
  });
});

// --------------------------------------------------------------------------
// Valid transitions
// --------------------------------------------------------------------------

describe('Valid transitions', () => {
  it('RAW_SOURCE → DISCOVERED', () => {
    const c = makeCandidate();
    const { candidate } = executeTransition(c, 'DISCOVERED', { actor: 'coordinator', pipelineVersion: PIPELINE, reason: 'Pipeline started' });
    expect(candidate.state).toBe('DISCOVERED');
  });

  it('DISCOVERED → CLASSIFIED', () => {
    const c = executeTransition(makeCandidate(), 'DISCOVERED', { actor: 'c', pipelineVersion: PIPELINE, reason: '' }).candidate;
    const { candidate } = executeTransition(c, 'CLASSIFIED', { actor: 'classifier', pipelineVersion: PIPELINE, modelVersion: 'claude-sonnet-4', reason: 'Classified as SOP' });
    expect(candidate.state).toBe('CLASSIFIED');
  });

  it('full happy path: RAW_SOURCE → PROMOTED', () => {
    const path: DiscoveryState[] = [
      'DISCOVERED', 'CLASSIFIED', 'ENTITY_EXTRACTED',
      'CLAIMS_PROPOSED', 'CURATION', 'ENRICHED', 'READY_FOR_PROMOTION', 'PROMOTED',
    ];
    const { candidate } = executeTransitionSequence(
      makeCandidate({ id: 'happy-1' }),
      path,
      { actor: 'pipeline', pipelineVersion: PIPELINE, reason: 'Happy path' },
    );
    expect(candidate.state).toBe('PROMOTED');
    expect(candidate.transitions.length).toBe(9); // 1 initial + 8 transitions
  });

  it('CURATION → REJECTED', () => {
    const path: DiscoveryState[] = ['DISCOVERED', 'CLASSIFIED', 'ENTITY_EXTRACTED', 'CLAIMS_PROPOSED', 'CURATION'];
    const c = executeTransitionSequence(makeCandidate(), path, { actor: 'p', pipelineVersion: PIPELINE, reason: '' }).candidate;
    const { candidate } = executeTransition(c, 'REJECTED', { actor: 'reviewer', pipelineVersion: PIPELINE, reason: 'Does not support any Claim' });
    expect(candidate.state).toBe('REJECTED');
  });

  it('CURATION → NEEDS_MORE_EVIDENCE → CURATION', () => {
    const path: DiscoveryState[] = ['DISCOVERED', 'CLASSIFIED', 'ENTITY_EXTRACTED', 'CLAIMS_PROPOSED', 'CURATION'];
    const c = executeTransitionSequence(makeCandidate(), path, { actor: 'p', pipelineVersion: PIPELINE, reason: '' }).candidate;
    const c2 = executeTransition(c, 'NEEDS_MORE_EVIDENCE', { actor: 'reviewer', pipelineVersion: PIPELINE, reason: 'Insufficient detail' }).candidate;
    expect(c2.state).toBe('NEEDS_MORE_EVIDENCE');
    const c3 = executeTransition(c2, 'CURATION', { actor: 'reviewer', pipelineVersion: PIPELINE, reason: 'Additional evidence uploaded' }).candidate;
    expect(c3.state).toBe('CURATION');
  });

  it('PROMOTED → nothing (terminal)', () => {
    const path: DiscoveryState[] = ['DISCOVERED', 'CLASSIFIED', 'ENTITY_EXTRACTED', 'CLAIMS_PROPOSED', 'CURATION', 'ENRICHED', 'READY_FOR_PROMOTION', 'PROMOTED'];
    const c = executeTransitionSequence(makeCandidate(), path, { actor: 'p', pipelineVersion: PIPELINE, reason: '' }).candidate;
    expect(() => executeTransition(c, 'REJECTED', { actor: 'p', pipelineVersion: PIPELINE, reason: '' })).toThrow(StateMachineError);
  });
});

// --------------------------------------------------------------------------
// Invalid transitions
// --------------------------------------------------------------------------

describe('Invalid transitions', () => {
  it('throws StateMachineError for invalid transition', () => {
    const c = makeCandidate(); // RAW_SOURCE
    expect(() => executeTransition(c, 'PROMOTED', { actor: 'bad', pipelineVersion: PIPELINE, reason: 'Skip everything' })).toThrow(StateMachineError);
  });

  it('throws on SKIP (RAW_SOURCE → CURATION)', () => {
    expect(() => executeTransition(makeCandidate(), 'CURATION', { actor: 'skip', pipelineVersion: PIPELINE, reason: '' })).toThrow(StateMachineError);
  });
});

// --------------------------------------------------------------------------
// assertState
// --------------------------------------------------------------------------

describe('assertState', () => {
  it('passes when state matches', () => {
    const c = makeCandidate();
    expect(() => assertState(c, 'RAW_SOURCE')).not.toThrow();
  });

  it('throws when state mismatches', () => {
    const c = makeCandidate();
    expect(() => assertState(c, 'PROMOTED')).toThrow();
  });
});

// --------------------------------------------------------------------------
// isTerminal
// --------------------------------------------------------------------------

describe('isTerminal', () => {
  it('PROMOTED is terminal', () => { expect(isTerminal('PROMOTED')).toBe(true); });
  it('REJECTED is terminal', () => { expect(isTerminal('REJECTED')).toBe(true); });
  it('ARCHIVED is terminal', () => { expect(isTerminal('ARCHIVED')).toBe(true); });
  it('RAW_SOURCE is not terminal', () => { expect(isTerminal('RAW_SOURCE')).toBe(false); });
  it('CURATION is not terminal', () => { expect(isTerminal('CURATION')).toBe(false); });
});

// --------------------------------------------------------------------------
// Transition event completeness
// --------------------------------------------------------------------------

describe('Transition events', () => {
  it('every transition records complete event', () => {
    const c = makeCandidate();
    const { event } = executeTransition(c, 'DISCOVERED', {
      actor: 'test-agent',
      pipelineVersion: 'v1',
      modelVersion: 'claude-sonnet-4',
      reason: 'Discovery started',
    });

    expect(event.candidateId).toBe('candidate-1');
    expect(event.fromState).toBe('RAW_SOURCE');
    expect(event.toState).toBe('DISCOVERED');
    expect(event.actor).toBe('test-agent');
    expect(event.pipelineVersion).toBe('v1');
    expect(event.modelVersion).toBe('claude-sonnet-4');
    expect(event.reason).toBe('Discovery started');
    expect(event.timestamp).toBeDefined();
  });
});
