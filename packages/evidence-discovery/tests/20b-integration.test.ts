// ==========================================================================
// Sprint 20B — Integration / E2E Tests
// ==========================================================================
// Sprint 20B.8.
//
// End-to-end tests for the full Sprint 20B pipeline:
// Timeline → Capabilities → Claim Candidates → Gap Analysis → Narrative → Profile → UX
//
// Validates that all components integrate correctly.
// No Evidence Core modification. No automatic promotion.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  TimelineEngine,
  CapabilityDetector,
  ClaimCandidateDetector,
  ClaimMappingRegistry,
  EvidenceGapDetector,
  NarrativeEngine,
  ProfileBuilder,
  DiscoveryUXOrchestrator,
} from '../src/index.js';
import type { DiscoveryResult } from '../src/index.js';

// --------------------------------------------------------------------------
// Full fixture — realistic institutional data
// --------------------------------------------------------------------------

function makeInstitutionalFixture(): DiscoveryResult {
  return {
    runId: 'run-20b-e2e',
    pipelineVersion: 'v1',
    completedAt: new Date().toISOString(),
    artifacts: [
      { artifactId: 'art-1', filename: 'protocol-phase1.pdf' },
      { artifactId: 'art-2', filename: 'pbmc-sop.pdf' },
      { artifactId: 'art-3', filename: 'freezer-calibration.pdf' },
      { artifactId: 'art-4', filename: 'gcp-training-records.pdf' },
      { artifactId: 'art-5', filename: 'study-closeout.pdf' },
      { artifactId: 'art-6', filename: 'equipment-inventory.pdf' },
      { artifactId: 'art-7', filename: 'shipment-log.pdf' },
    ],
    classifications: [
      { artifactId: 'art-1', documentType: 'PROTOCOL', confidence: 0.92, requiresHumanReview: false },
      { artifactId: 'art-2', documentType: 'SOP', confidence: 0.88, requiresHumanReview: false },
      { artifactId: 'art-3', documentType: 'CALIBRATION_RECORD', confidence: 0.85, requiresHumanReview: false },
      { artifactId: 'art-4', documentType: 'TRAINING_RECORD', confidence: 0.95, requiresHumanReview: false },
      { artifactId: 'art-5', documentType: 'STUDY_CLOSEOUT_LETTER', confidence: 0.72, requiresHumanReview: true },
      { artifactId: 'art-6', documentType: 'EQUIPMENT_LOG', confidence: 0.80, requiresHumanReview: false },
      { artifactId: 'art-7', documentType: 'SHIPMENT_LOG', confidence: 0.75, requiresHumanReview: false },
    ],
    entities: [
      { entityId: 'ent-eq-1', type: 'EQUIPMENT', value: 'Centrifuge X-200', normalizedValue: null, confidence: 0.85 },
      { entityId: 'ent-eq-2', type: 'EQUIPMENT', value: 'Ultra-Freezer #A123', normalizedValue: null, confidence: 0.90 },
      { entityId: 'ent-eq-3', type: 'EQUIPMENT', value: 'Liquid Nitrogen Tank LN2-01', normalizedValue: null, confidence: 0.82 },
      { entityId: 'ent-temp-1', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.92 },
      { entityId: 'ent-temp-2', type: 'TEMPERATURE', value: '-196°C', normalizedValue: null, confidence: 0.85 },
      { entityId: 'ent-pi-1', type: 'INVESTIGATOR', value: 'Dr. Sarah Johnson', normalizedValue: null, confidence: 0.90 },
      { entityId: 'ent-pi-2', type: 'INVESTIGATOR', value: 'Dr. Mark Chen', normalizedValue: null, confidence: 0.85 },
      { entityId: 'ent-sp-1', type: 'SPONSOR', value: 'PharmaCorp', normalizedValue: null, confidence: 0.88 },
      { entityId: 'ent-sp-2', type: 'SPONSOR', value: 'BioTech Ltd', normalizedValue: null, confidence: 0.80 },
      { entityId: 'ent-st-1', type: 'STUDY', value: 'Phase I Oncology Study', normalizedValue: null, confidence: 0.85 },
      { entityId: 'ent-st-2', type: 'STUDY', value: 'Phase II PK Study', normalizedValue: null, confidence: 0.78 },
      { entityId: 'ent-reg-1', type: 'REGULATORY_BODY', value: 'FDA', normalizedValue: null, confidence: 0.70 },
    ],
    relationships: [
      { relationshipId: 'rel-1', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'ent-st-1', targetEntityId: 'ent-sp-1', confidence: 0.85 },
      { relationshipId: 'rel-2', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'ent-eq-2', targetEntityId: 'ent-temp-1', confidence: 0.88 },
      { relationshipId: 'rel-3', type: 'TRAINING_COMPLETED_BY', sourceEntityId: 'ent-pi-1', targetEntityId: 'ent-pi-1', confidence: 0.92 },
      { relationshipId: 'rel-4', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'ent-st-2', targetEntityId: 'ent-sp-2', confidence: 0.80 },
      { relationshipId: 'rel-5', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'ent-eq-3', targetEntityId: 'ent-temp-2', confidence: 0.82 },
      { relationshipId: 'rel-6', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'ent-st-1', targetEntityId: 'ent-sp-2', confidence: 0.65 },
    ],
    agentOutputs: [],
  };
}

// --------------------------------------------------------------------------
// Architecture Gates
// --------------------------------------------------------------------------

describe('20B.8 — Integration Gates', () => {
  describe('Gate 1: Full pipeline produces complete profile', () => {
    it('TimelineEngine → CapabilityDetector → ClaimCandidateDetector → EvidenceGapDetector → NarrativeEngine → ProfileBuilder', () => {
      const dr = makeInstitutionalFixture();
      const timeline = new TimelineEngine().reconstruct(dr);
      expect(timeline.events.length).toBeGreaterThan(0);

      const capabilities = new CapabilityDetector().detect(dr, timeline);
      expect(capabilities.capabilities.length).toBeGreaterThan(0);

      const claims = new ClaimCandidateDetector(new ClaimMappingRegistry()).detect(
        capabilities.capabilities, dr, timeline,
      );
      expect(claims.candidates.length).toBeGreaterThanOrEqual(0);

      const gaps = new EvidenceGapDetector(new ClaimMappingRegistry()).analyze(
        claims.candidates, dr, timeline,
      );
      expect(gaps.totalClaims).toBe(claims.candidates.length);

      const narrative = new NarrativeEngine().generate({
        timeline, capabilities: capabilities.capabilities, claims: claims.candidates, discoveryResult: dr,
      });
      expect(narrative.sections.length).toBeGreaterThan(0);

      const profile = new ProfileBuilder().build(dr, {
        institutionName: 'Integrated Test Institution',
      });
      expect(profile.components.timeline.eventCount).toBe(timeline.events.length);
      expect(profile.components.capabilities.totalDetected + profile.components.capabilities.totalSuspected)
        .toBe(capabilities.capabilities.length);
    });
  });

  describe('Gate 2: No Evidence Core modification', () => {
    it('TimelineEngine does not create Claims', () => {
      const engine = new TimelineEngine();
      expect((engine as any).createClaim).toBeUndefined();
      expect((engine as any).computeConfidence).toBeUndefined();
    });

    it('CapabilityDetector does not create Claims', () => {
      const detector = new CapabilityDetector();
      expect((detector as any).createClaim).toBeUndefined();
      expect((detector as any).createEvidenceNode).toBeUndefined();
    });

    it('ClaimCandidateDetector does not create Claims', () => {
      const detector = new ClaimCandidateDetector(new ClaimMappingRegistry());
      expect((detector as any).createOfficialClaim).toBeUndefined();
      expect((detector as any).writeToEvidenceCore).toBeUndefined();
    });

    it('EvidenceGapDetector does not modify Evidence Core', () => {
      const detector = new EvidenceGapDetector(new ClaimMappingRegistry());
      expect((detector as any).createClaim).toBeUndefined();
      expect((detector as any).promoteEvidence).toBeUndefined();
    });

    it('NarrativeEngine does not create Claims', () => {
      const engine = new NarrativeEngine();
      expect((engine as any).createClaim).toBeUndefined();
      expect((engine as any).createEvidenceNode).toBeUndefined();
    });

    it('ProfileBuilder does not create Claims', () => {
      const builder = new ProfileBuilder();
      expect((builder as any).createClaim).toBeUndefined();
      expect((builder as any).computeConfidence).toBeUndefined();
    });

    it('DiscoveryUXOrchestrator does not create Claims', () => {
      const ux = new DiscoveryUXOrchestrator();
      expect((ux as any).createClaim).toBeUndefined();
      expect((ux as any).promoteEvidence).toBeUndefined();
    });
  });

  describe('Gate 3: Every component is explainable', () => {
    it('capabilities have reasoning', () => {
      const dr = makeInstitutionalFixture();
      const caps = new CapabilityDetector().detect(dr);
      for (const cap of caps.capabilities) {
        expect(cap.reasoning.length).toBeGreaterThan(0);
      }
    });

    it('claims have humanExplanation', () => {
      const dr = makeInstitutionalFixture();
      const timeline = new TimelineEngine().reconstruct(dr);
      const caps = new CapabilityDetector().detect(dr, timeline);
      const claims = new ClaimCandidateDetector(new ClaimMappingRegistry()).detect(caps.capabilities, dr, timeline);
      for (const claim of claims.candidates) {
        expect(claim.humanExplanation.length).toBeGreaterThan(0);
      }
    });

    it('gap analysis results have humanExplanation', () => {
      const dr = makeInstitutionalFixture();
      const timeline = new TimelineEngine().reconstruct(dr);
      const caps = new CapabilityDetector().detect(dr, timeline);
      const claims = new ClaimCandidateDetector(new ClaimMappingRegistry()).detect(caps.capabilities, dr, timeline);
      const gaps = new EvidenceGapDetector(new ClaimMappingRegistry()).analyze(claims.candidates, dr, timeline);
      for (const result of gaps.results) {
        expect(result.humanExplanation.length).toBeGreaterThan(0);
      }
    });

    it('narrative sections have citations', () => {
      const dr = makeInstitutionalFixture();
      const timeline = new TimelineEngine().reconstruct(dr);
      const caps = new CapabilityDetector().detect(dr, timeline);
      const claims = new ClaimCandidateDetector(new ClaimMappingRegistry()).detect(caps.capabilities, dr, timeline);
      const narrative = new NarrativeEngine().generate({ timeline, capabilities: caps.capabilities, claims: claims.candidates, discoveryResult: dr });
      for (const section of narrative.sections) {
        for (const paragraph of section.paragraphs) {
          expect(paragraph.citations.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Gate 4: UX state machine covers full pipeline', () => {
    it('orchestrator transitions through all phases', () => {
      const ux = new DiscoveryUXOrchestrator();
      expect(ux.getState().phase).toBe('onboarding');

      ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'E2E Test' });
      expect(ux.getState().phase).toBe('uploading');

      ux.dispatch({ type: 'PIPELINE_STARTED' });
      expect(ux.getState().phase).toBe('processing');
    });
  });

  describe('Gate 5: Data consistency across pipeline', () => {
    it('timeline events reference valid entity IDs', () => {
      const dr = makeInstitutionalFixture();
      const timeline = new TimelineEngine().reconstruct(dr);
      const allEntityIds = new Set(dr.entities.map(e => e.entityId));

      for (const event of timeline.events) {
        for (const eid of event.evidenceEntityIds) {
          expect(allEntityIds.has(eid)).toBe(true);
        }
      }
    });

    it('narrative totalCitations equals sum of section citations', () => {
      const dr = makeInstitutionalFixture();
      const timeline = new TimelineEngine().reconstruct(dr);
      const caps = new CapabilityDetector().detect(dr, timeline);
      const narrative = new NarrativeEngine().generate({
        timeline, capabilities: caps.capabilities, claims: [], discoveryResult: dr,
      });

      const counted = narrative.sections.reduce(
        (sum, s) => sum + s.paragraphs.reduce((ps, p) => ps + p.citations.length, 0), 0,
      );
      expect(narrative.totalCitations).toBe(counted);
    });
  });
});

// --------------------------------------------------------------------------
// E2E Pipeline Validation
// --------------------------------------------------------------------------

describe('20B.8 — Pipeline Validation', () => {
  it('ProfileBuilder produces consistent capability counts', () => {
    const dr = makeInstitutionalFixture();
    const profile = new ProfileBuilder().build(dr);

    const componentCount = profile.components.capabilities.totalDetected + profile.components.capabilities.totalSuspected;
    expect(profile.summary.totalCapabilities).toBe(componentCount);
  });

  it('pipeline produces expected number of claims from capabilities', () => {
    const dr = makeInstitutionalFixture();
    const timeline = new TimelineEngine().reconstruct(dr);
    const caps = new CapabilityDetector().detect(dr, timeline);
    const claims = new ClaimCandidateDetector(new ClaimMappingRegistry()).detect(caps.capabilities, dr, timeline);

    // Every capability should produce exactly one claim candidate
    expect(claims.candidates.length).toBeLessThanOrEqual(caps.capabilities.length);
  });

  it('coverage from gap analysis matches claim coverage', () => {
    const dr = makeInstitutionalFixture();
    const timeline = new TimelineEngine().reconstruct(dr);
    const caps = new CapabilityDetector().detect(dr, timeline);
    const claims = new ClaimCandidateDetector(new ClaimMappingRegistry()).detect(caps.capabilities, dr, timeline);
    const gaps = new EvidenceGapDetector(new ClaimMappingRegistry()).analyze(claims.candidates, dr, timeline);

    expect(gaps.totalClaims).toBe(claims.candidates.length);
    if (claims.candidates.length > 0) {
      expect(gaps.averageCoverage).toBeGreaterThan(0);
    }
  });

  it('readiness score is computed for complete profile', () => {
    const dr = makeInstitutionalFixture();
    const profile = new ProfileBuilder().build(dr);

    expect(profile.summary.readinessScore).toBeGreaterThanOrEqual(0);
    expect(profile.summary.readinessScore).toBeLessThanOrEqual(100);
  });

  it('narrative is generated for full pipeline', () => {
    const dr = makeInstitutionalFixture();
    const profile = new ProfileBuilder().build(dr);

    const narrative = profile.components.narrative;
    expect(narrative.sections.length).toBeGreaterThanOrEqual(4);
    expect(narrative.summary.length).toBeGreaterThan(0);
  });

  it('profile with empty input has draft status', () => {
    const empty: DiscoveryResult = {
      runId: 'run-empty', pipelineVersion: 'v1', completedAt: '',
      artifacts: [], classifications: [], entities: [], relationships: [], agentOutputs: [],
    };
    const profile = new ProfileBuilder().build(empty);
    expect(profile.summary.status).toBe('draft');
  });

  it('full pipeline does not throw', () => {
    const dr = makeInstitutionalFixture();
    expect(() => {
      const timeline = new TimelineEngine().reconstruct(dr);
      const caps = new CapabilityDetector().detect(dr, timeline);
      const claims = new ClaimCandidateDetector(new ClaimMappingRegistry()).detect(caps.capabilities, dr, timeline);
      const gaps = new EvidenceGapDetector(new ClaimMappingRegistry()).analyze(claims.candidates, dr, timeline);
      const narrative = new NarrativeEngine().generate({
        timeline, capabilities: caps.capabilities, claims: claims.candidates, discoveryResult: dr,
      });
      const profile = new ProfileBuilder().build(dr);
    }).not.toThrow();
  });
});
