// ==========================================================================
// Institutional Profile — Tests
// ==========================================================================
// Sprint 20B.6.
//
// Tests for ProfileBuilder: full pipeline orchestration, readiness analysis,
// summary generation, edge cases.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { ProfileBuilder } from '../src/index.js';
import type { DiscoveryResult } from '../src/index.js';

// --------------------------------------------------------------------------
// Fixture
// --------------------------------------------------------------------------

function makeFullDiscoveryResult(): DiscoveryResult {
  return {
    runId: 'run-profile-test',
    pipelineVersion: 'v1',
    completedAt: new Date().toISOString(),
    artifacts: [
      { artifactId: 'art-1', filename: 'protocol-phase1.pdf' },
      { artifactId: 'art-2', filename: 'pbmc-sop.pdf' },
      { artifactId: 'art-3', filename: 'freezer-calibration.pdf' },
      { artifactId: 'art-4', filename: 'gcp-training.pdf' },
      { artifactId: 'art-5', filename: 'study-closeout.pdf' },
    ],
    classifications: [
      { artifactId: 'art-1', documentType: 'PROTOCOL', confidence: 0.9, requiresHumanReview: false },
      { artifactId: 'art-2', documentType: 'SOP', confidence: 0.85, requiresHumanReview: false },
      { artifactId: 'art-3', documentType: 'CALIBRATION_RECORD', confidence: 0.8, requiresHumanReview: false },
      { artifactId: 'art-4', documentType: 'TRAINING_RECORD', confidence: 0.95, requiresHumanReview: false },
      { artifactId: 'art-5', documentType: 'STUDY_CLOSEOUT_LETTER', confidence: 0.7, requiresHumanReview: true },
    ],
    entities: [
      { entityId: 'ent-eq-1', type: 'EQUIPMENT', value: 'Centrifuge X-200', normalizedValue: null, confidence: 0.8 },
      { entityId: 'ent-eq-2', type: 'EQUIPMENT', value: 'Freezer #A-123', normalizedValue: null, confidence: 0.9 },
      { entityId: 'ent-temp-1', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      { entityId: 'ent-pi-1', type: 'INVESTIGATOR', value: 'Dr. Sarah Johnson', normalizedValue: null, confidence: 0.85 },
      { entityId: 'ent-sp-1', type: 'SPONSOR', value: 'PharmaCorp', normalizedValue: null, confidence: 0.85 },
      { entityId: 'ent-st-1', type: 'STUDY', value: 'Phase I Oncology Study', normalizedValue: null, confidence: 0.8 },
      { entityId: 'ent-st-2', type: 'STUDY', value: 'Phase II Oncology Study', normalizedValue: null, confidence: 0.7 },
    ],
    relationships: [
      { relationshipId: 'rel-1', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'ent-st-1', targetEntityId: 'ent-sp-1', confidence: 0.8 },
      { relationshipId: 'rel-2', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'ent-eq-2', targetEntityId: 'ent-temp-1', confidence: 0.85 },
      { relationshipId: 'rel-3', type: 'TRAINING_COMPLETED_BY', sourceEntityId: 'ent-pi-1', targetEntityId: 'ent-pi-1', confidence: 0.9 },
      { relationshipId: 'rel-4', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'ent-st-2', targetEntityId: 'ent-sp-1', confidence: 0.7 },
    ],
    agentOutputs: [],
  };
}

function makeEmptyDiscoveryResult(): DiscoveryResult {
  return {
    runId: 'run-empty',
    pipelineVersion: 'v1',
    completedAt: new Date().toISOString(),
    artifacts: [],
    classifications: [],
    entities: [],
    relationships: [],
    agentOutputs: [],
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('ProfileBuilder', () => {
  it('builds a complete profile from full discovery result', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult(), {
      institutionName: 'Vilo Research Center',
    });

    expect(profile.institutionName).toBe('Vilo Research Center');
    expect(profile.components.timeline).toBeDefined();
    expect(profile.components.capabilities).toBeDefined();
    expect(profile.components.claims).toBeDefined();
    expect(profile.components.gapAnalysis).toBeDefined();
    expect(profile.components.narrative).toBeDefined();
    expect(profile.summary).toBeDefined();
  });

  it('produces summary with capability counts', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    expect(profile.summary.totalCapabilities).toBeGreaterThan(0);
    expect(profile.summary.confirmedCapabilities + profile.summary.suspectedCapabilities)
      .toBe(profile.summary.totalCapabilities);
  });

  it('produces summary with gap information', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    expect(profile.summary.totalGaps).toBeGreaterThanOrEqual(0);
    expect(profile.summary.criticalGaps).toBeGreaterThanOrEqual(0);
  });

  it('produces summary with readiness score', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    expect(profile.summary.readinessScore).toBeGreaterThanOrEqual(0);
    expect(profile.summary.readinessScore).toBeLessThanOrEqual(100);
  });

  it('produces narrative summary in profile summary', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    expect(profile.summary.narrativeSummary.length).toBeGreaterThan(0);
  });

  it('profile has a version string', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    expect(profile.profileVersion).toBe('1.0.0');
  });

  it('accepts custom profile version', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult(), {
      profileVersion: '2.0.0',
    });

    expect(profile.profileVersion).toBe('2.0.0');
  });

  it('has generatedAt timestamp', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    const timestamp = new Date(profile.generatedAt);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  it('handles empty discovery result gracefully', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeEmptyDiscoveryResult());

    expect(profile.components.timeline.events.length).toBe(0);
    expect(profile.components.capabilities.capabilities.length).toBe(0);
    expect(profile.components.claims.candidates.length).toBe(0);
    expect(profile.summary.totalCapabilities).toBe(0);
  });

  it('empty result has draft status', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeEmptyDiscoveryResult());

    expect(profile.summary.status).toBe('draft');
  });

  it('full result has needs_review or ready status', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    expect(['needs_review', 'ready']).toContain(profile.summary.status);
  });

  it('analyzeReadiness returns blockers for empty profile', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeEmptyDiscoveryResult());

    const readiness = builder.analyzeReadiness(profile);
    expect(readiness.status).toBe('draft');
    expect(readiness.blockers.length).toBeGreaterThan(0);
  });

  it('analyzeReadiness blockers indicate real issues for full profile', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    const readiness = builder.analyzeReadiness(profile);
    // Blockers reflect actual data quality — if gaps > 10, that's a legitimate blocker
    if (profile.components.gapAnalysis.totalGaps > 10) {
      expect(readiness.blockers).toEqual(
        expect.arrayContaining([expect.stringContaining('Excessive evidence gaps')]),
      );
    }
    // All blockers must be actionable strings
    for (const blocker of readiness.blockers) {
      expect(typeof blocker).toBe('string');
      expect(blocker.length).toBeGreaterThan(10);
    }
  });

  it('analyzeReadiness reports warnings when there are gaps', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    const readiness = builder.analyzeReadiness(profile);
    // If there are gaps or review-needed events, warnings should report them
    if (profile.components.gapAnalysis.totalGaps > 0 || profile.components.timeline.requiresReviewCount > 0) {
      expect(readiness.warnings.length).toBeGreaterThan(0);
    }
  });

  it('custom status overrides automatic status', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeEmptyDiscoveryResult(), {
      status: 'ready',
    });

    expect(profile.summary.status).toBe('ready');
  });

  it('build pipeline runs without errors', () => {
    const builder = new ProfileBuilder();
    expect(() => builder.build(makeFullDiscoveryResult())).not.toThrow();
  });

  it('build is idempotent (same input produces same structure)', () => {
    const builder = new ProfileBuilder();
    const dr = makeFullDiscoveryResult();

    const profile1 = builder.build(dr);
    const profile2 = builder.build(dr);

    // siteId differs because of random UUID, but structure is consistent
    expect(profile1.components.capabilities.totalDetected)
      .toBe(profile2.components.capabilities.totalDetected);
    expect(profile1.components.timeline.eventCount)
      .toBe(profile2.components.timeline.eventCount);
  });

  it('profile contains all five component types', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult());

    expect(profile.components.timeline).toBeDefined();
    expect(profile.components.capabilities).toBeDefined();
    expect(profile.components.claims).toBeDefined();
    expect(profile.components.gapAnalysis).toBeDefined();
    expect(profile.components.narrative).toBeDefined();
  });

  it('summary references correct institution name', () => {
    const builder = new ProfileBuilder();
    const profile = builder.build(makeFullDiscoveryResult(), {
      institutionName: 'Vilo Research Center',
    });

    expect(profile.summary.institutionName).toBe('Vilo Research Center');
  });

  it('no Evidence Core modification', () => {
    const builder = new ProfileBuilder();
    expect((builder as any).createClaim).toBeUndefined();
    expect((builder as any).createEvidenceNode).toBeUndefined();
    expect((builder as any).computeConfidence).toBeUndefined();
  });
});
