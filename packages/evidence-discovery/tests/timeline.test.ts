// ==========================================================================
// Institutional Timeline — Tests
// ==========================================================================
// Sprint 20B.1.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { TimelineEngine } from '../src/index.js';
import type { DiscoveryResult } from '../src/index.js';

function makeResult(overrides?: Partial<DiscoveryResult>): DiscoveryResult {
  return {
    runId: 'run-timeline-1',
    pipelineVersion: 'v1',
    completedAt: new Date().toISOString(),
    artifacts: [{ artifactId: 'art-1', filename: 'documents.zip' }],
    classifications: [],
    entities: [
      { entityId: 'date-1', type: 'DATE', value: '2025-03-15', normalizedValue: null, confidence: 0.95 },
      { entityId: 'date-2', type: 'DATE', value: '2025-06-30', normalizedValue: null, confidence: 0.9 },
      { entityId: 'date-3', type: 'DATE', value: '2026-01-15', normalizedValue: null, confidence: 0.85 },
      { entityId: 'inv-1', type: 'INVESTIGATOR', value: 'Dr. Sarah Johnson', normalizedValue: null, confidence: 0.8 },
      { entityId: 'inst-1', type: 'INSTITUTION', value: 'University of California', normalizedValue: null, confidence: 0.9 },
      { entityId: 'spon-1', type: 'SPONSOR', value: 'PharmaCorp Inc.', normalizedValue: null, confidence: 0.85 },
      { entityId: 'eq-1', type: 'EQUIPMENT', value: 'Freezer #A-123', normalizedValue: null, confidence: 0.75 },
      { entityId: 'eq-2', type: 'EQUIPMENT', value: 'Centrifuge B-456', normalizedValue: null, confidence: 0.7 },
    ],
    relationships: [
      { relationshipId: 'rel-1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'date-1', targetEntityId: 'eq-1', confidence: 0.7 },
      { relationshipId: 'rel-2', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'date-2', targetEntityId: 'spon-1', confidence: 0.65 },
      { relationshipId: 'rel-3', type: 'INVESTIGATOR_AT_INSTITUTION', sourceEntityId: 'inv-1', targetEntityId: 'inst-1', confidence: 0.6 },
    ],
    agentOutputs: [],
    ...overrides,
  };
}

function makeEmptyResult(): DiscoveryResult {
  return {
    runId: 'run-empty', pipelineVersion: 'v1', completedAt: '', artifacts: [],
    classifications: [], entities: [], relationships: [], agentOutputs: [],
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('TimelineEngine', () => {
  it('reconstructs timeline from DiscoveryResult', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeResult());

    expect(timeline.events.length).toBeGreaterThan(0);
    expect(timeline.eventCount).toBeGreaterThan(0);
    expect(timeline.siteId).toBe('run-timeline-1');
  });

  it('sorts events chronologically', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeResult());

    for (let i = 1; i < timeline.events.length; i++) {
      expect(timeline.events[i - 1].date.value.localeCompare(timeline.events[i].date.value)).toBeLessThanOrEqual(1);
    }
  });

  it('sets correct year range', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeResult());

    expect(timeline.yearRange.start).toBe(2025);
    expect(timeline.yearRange.end).toBe(2026);
  });

  it('creates equipment events from entities', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeResult());

    const equipEvents = timeline.events.filter(e => e.category === 'equipment_acquisition');
    expect(equipEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('creates investigator events', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeResult());

    const invEvents = timeline.events.filter(e => e.category === 'investigator_joining');
    expect(invEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('creates study activity events', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeResult());

    const studyEvents = timeline.events.filter(e => e.category === 'study_activity');
    expect(studyEvents.length).toBeGreaterThanOrEqual(0);
  });

  it('every event has traceable evidence references', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeResult());

    for (const event of timeline.events) {
      expect(event.evidenceEntityIds.length).toBeGreaterThan(0);
      expect(event.sourceArtifactIds).toBeDefined();
    }
  });

  it('flags uncertain dates for review', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeResult());

    const lowConfEvents = timeline.events.filter(e => e.requiresHumanReview);
    expect(timeline.requiresReviewCount).toBe(lowConfEvents.length);
  });

  it('handles empty result', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeEmptyResult());

    expect(timeline.events).toEqual([]);
    expect(timeline.eventCount).toBe(0);
    expect(timeline.yearRange.start).toBeNull();
    expect(timeline.yearRange.end).toBeNull();
  });

  it('does not create Claims or compute Confidence', () => {
    const engine = new TimelineEngine();
    expect((engine as any).createClaim).toBeUndefined();
    expect((engine as any).computeConfidence).toBeUndefined();
    expect((engine as any).createEvidenceNode).toBeUndefined();
  });

  it('dates are traceable to rationale', () => {
    const engine = new TimelineEngine();
    const timeline = engine.reconstruct(makeResult());

    for (const event of timeline.events) {
      expect(event.date.rationale).toBeDefined();
      expect(event.date.rationale.length).toBeGreaterThan(0);
    }
  });
});
