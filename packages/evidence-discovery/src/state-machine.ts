// ==========================================================================
// Evidence Discovery — State Machine Engine (KEMS-002A)
// ==========================================================================
// Sprint 20A.1.
//
// Governs all state transitions for Evidence Candidates.
// No transition occurs without an event.
// No AI agent bypasses this state machine.
// ==========================================================================

import type { DiscoveryState, TransitionEvent, EvidenceCandidate } from './types.js';
import { ALLOWED_TRANSITIONS } from './types.js';

// --------------------------------------------------------------------------
// State machine errors
// --------------------------------------------------------------------------

export class StateMachineError extends Error {
  constructor(candidateId: string, from: DiscoveryState, to: DiscoveryState) {
    super(
      `Invalid transition: ${from} → ${to} for candidate ${candidateId}. ` +
      `Allowed: ${(ALLOWED_TRANSITIONS[from] ?? []).join(', ') || 'none'}`,
    );
    this.name = 'StateMachineError';
  }
}

// --------------------------------------------------------------------------
// Transition execution
// --------------------------------------------------------------------------

export function executeTransition(
  candidate: EvidenceCandidate,
  toState: DiscoveryState,
  params: {
    actor: string;
    pipelineVersion: string;
    modelVersion?: string;
    reason: string;
  },
): { candidate: EvidenceCandidate; event: TransitionEvent } {
  const fromState = candidate.state;

  // Validate transition
  const allowed = ALLOWED_TRANSITIONS[fromState] ?? [];
  if (!allowed.includes(toState)) {
    throw new StateMachineError(candidate.id, fromState, toState);
  }

  // Create event
  const event: TransitionEvent = {
    candidateId: candidate.id,
    fromState,
    toState,
    timestamp: new Date().toISOString(),
    actor: params.actor,
    pipelineVersion: params.pipelineVersion,
    modelVersion: params.modelVersion,
    reason: params.reason,
  };

  // Return new candidate state (immutable — original not modified)
  return {
    candidate: {
      ...candidate,
      state: toState,
      transitions: [...candidate.transitions, event],
      updatedAt: event.timestamp,
    },
    event,
  };
}

// --------------------------------------------------------------------------
// Create initial candidate (RAW_SOURCE state)
// --------------------------------------------------------------------------

export function createCandidate(params: {
  id: string;
  artifactIds: string[];
  content: string;
  source: string;
  pipelineVersion: string;
  actor?: string;
}): EvidenceCandidate {
  const now = new Date().toISOString();
  const event: TransitionEvent = {
    candidateId: params.id,
    fromState: 'RAW_SOURCE',
    toState: 'RAW_SOURCE',
    timestamp: now,
    actor: params.actor ?? 'system',
    pipelineVersion: params.pipelineVersion,
    reason: 'Candidate created from raw source',
  };

  return {
    id: params.id,
    state: 'RAW_SOURCE',
    artifactIds: params.artifactIds,
    content: params.content,
    source: params.source,
    discoveryConfidence: 0,
    transitions: [event],
    provenanceChain: [],
    createdAt: now,
    updatedAt: now,
  };
}

// --------------------------------------------------------------------------
// Validate candidate is in expected state
// --------------------------------------------------------------------------

export function assertState(
  candidate: EvidenceCandidate,
  expectedState: DiscoveryState,
): void {
  if (candidate.state !== expectedState) {
    throw new StateMachineError(
      candidate.id,
      candidate.state,
      expectedState,
    );
  }
}

// --------------------------------------------------------------------------
// Check if state is terminal
// --------------------------------------------------------------------------

const TERMINAL_STATES = new Set<DiscoveryState>(['PROMOTED', 'REJECTED', 'ARCHIVED']);

export function isTerminal(state: DiscoveryState): boolean {
  return TERMINAL_STATES.has(state);
}

// --------------------------------------------------------------------------
// Batch: execute multiple transitions in sequence
// --------------------------------------------------------------------------

export function executeTransitionSequence(
  candidate: EvidenceCandidate,
  states: DiscoveryState[],
  params: {
    actor: string;
    pipelineVersion: string;
    reason: string;
  },
): { candidate: EvidenceCandidate; events: TransitionEvent[] } {
  let current = candidate;
  const events: TransitionEvent[] = [];

  for (const toState of states) {
    const result = executeTransition(current, toState, {
      ...params,
      reason: `${params.reason}: ${current.state} → ${toState}`,
    });
    current = result.candidate;
    events.push(result.event);
  }

  return { candidate: current, events };
}
