// ==========================================================================
// Evidence Discovery — Snapshot Tests
// ==========================================================================
// Sprint 20A.5.
// Tests InstitutionalEvidenceSnapshot building from DiscoveryResult.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { SnapshotBuilder } from '../src/index.js';
import type { DiscoveryResult } from '../src/index.js';

// --------------------------------------------------------------------------
// Sample DiscoveryResult
// --------------------------------------------------------------------------

function makeResult(overrides?: Partial<DiscoveryResult>): DiscoveryResult {
  return {
    runId: overrides?.runId ?? 'run-test-1',
    pipelineVersion: 'discovery-v0.1.0',
    completedAt: new Date().toISOString(),
    artifacts: [
      { artifactId: 'artifact-1', filename: 'sop-v3.pdf' },
      { artifactId: 'artifact-2', filename: 'calibration.pdf' },
      { artifactId: 'artifact-3', filename: 'unknown.docx' },
    ],
    classifications: [
      { artifactId: 'artifact-1', documentType: 'SOP', confidence: 0.85, requiresHumanReview: false },
      { artifactId: 'artifact-2', documentType: 'CALIBRATION_RECORD', confidence: 0.72, requiresHumanReview: false },
      { artifactId: 'artifact-3', documentType: 'UNKNOWN', confidence: 0, requiresHumanReview: true },
    ],
    entities: [
      { entityId: 'e1', type: 'INVESTIGATOR', value: 'Dr. Sarah Johnson', normalizedValue: null, confidence: 0.8 },
      { entityId: 'e2', type: 'INSTITUTION', value: 'University of California', normalizedValue: null, confidence: 0.9 },
      { entityId: 'e3', type: 'SPONSOR', value: 'PharmaCorp Inc.', normalizedValue: null, confidence: 0.85 },
      { entityId: 'e4', type: 'EQUIPMENT', value: 'Freezer #A-123', normalizedValue: null, confidence: 0.75 },
      { entityId: 'e5', type: 'DATE', value: '2025-03-15', normalizedValue: null, confidence: 0.95 },
      { entityId: 'e6', type: 'DATE', value: '2025-06-30', normalizedValue: null, confidence: 0.9 },
      { entityId: 'e7', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.85 },
    ],
    relationships: [
      { relationshipId: 'r1', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'e3', targetEntityId: 'e2', confidence: 0.7 },
      { relationshipId: 'r2', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'e5', targetEntityId: 'e4', confidence: 0.65 },
    ],
    agentOutputs: [],
    ...overrides,
  };
}

function makeEmptyResult(): DiscoveryResult {
  return {
    runId: 'run-empty', pipelineVersion: 'v1', completedAt: new Date().toISOString(),
    artifacts: [], classifications: [], entities: [], relationships: [], agentOutputs: [],
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('SnapshotBuilder', () => {
  it('builds a complete snapshot from DiscoveryResult', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeResult());

    expect(snapshot.id).toBeDefined();
    expect(snapshot.generatedAt).toBeDefined();
    expect(snapshot.summary.artifactsProcessed).toBe(3);
    expect(snapshot.summary.documentsClassified).toBe(3);
    expect(snapshot.summary.entitiesDetected).toBe(7);
    expect(snapshot.summary.relationshipsDetected).toBe(2);
  });

  it('includes document inventory', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeResult());

    expect(snapshot.documentInventory.length).toBe(3);
    expect(snapshot.documentInventory[0].documentType).toBe('SOP');
    expect(snapshot.documentInventory[2].documentType).toBe('UNKNOWN');
  });

  it('groups entities by type', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeResult());

    const types = snapshot.entityGroups.map(g => g.type);
    expect(types).toContain('INVESTIGATOR');
    expect(types).toContain('INSTITUTION');
    expect(types).toContain('SPONSOR');
    expect(types).toContain('EQUIPMENT');
    expect(types).toContain('DATE');
    expect(types).toContain('TEMPERATURE');
  });

  it('includes relationship summary with resolved values', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeResult());

    expect(snapshot.relationshipSummary.length).toBe(2);
    expect(snapshot.relationshipSummary[0].type).toBe('STUDY_SPONSORED_BY');
  });

  it('builds timeline from DATE entities', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeResult());

    expect(snapshot.timeline.length).toBeGreaterThan(0);
    // Events sorted chronologically
    expect(snapshot.timeline[0].date).toBe('2025-03-15');
    expect(snapshot.timeline[1].date).toBe('2025-06-30');
  });

  it('flags unknown document types as uncertainty', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeResult());

    const unknownDocUncertainty = snapshot.uncertainty.filter(u => u.type === 'unknown_document');
    expect(unknownDocUncertainty.length).toBe(1);
    expect(unknownDocUncertainty[0].description).toContain('unknown.docx');
  });

  it('produces exactly one next best action', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeResult());

    expect(snapshot.nextBestAction).toBeDefined();
    expect(snapshot.nextBestAction.action.length).toBeGreaterThan(0);
    expect(snapshot.nextBestAction.rationale.length).toBeGreaterThan(0);
  });

  it('next best action prioritizes unknown docs', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeResult());

    // Has 1 unknown doc
    expect(snapshot.nextBestAction.action).toContain('unclassified');
    expect(snapshot.nextBestAction.priority).toBe('high');
  });

  it('handles empty result gracefully', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeEmptyResult());

    expect(snapshot.summary.artifactsProcessed).toBe(0);
    expect(snapshot.summary.entitiesDetected).toBe(0);
    expect(snapshot.documentInventory).toEqual([]);
    expect(snapshot.entityGroups).toEqual([]);
    expect(snapshot.timeline).toEqual([]);
    expect(snapshot.uncertainty).toEqual([]);
    expect(snapshot.nextBestAction.action).toContain('Upload a document');
  });

  it('does not create EvidenceNodes or write to Evidence Core', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeEmptyResult());

    expect((snapshot as any).evidenceNodes).toBeUndefined();
    expect((snapshot as any).claims).toBeUndefined();
    expect((snapshot as any).confidenceScores).toBeUndefined();
  });

  it('preserves provenance through snapshot', () => {
    const builder = new SnapshotBuilder();
    const snapshot = builder.build(makeResult());

    // Every inventory item references sourceArtifactId
    for (const item of snapshot.documentInventory) {
      expect(item.sourceArtifactId).toBeDefined();
    }
  });
});
