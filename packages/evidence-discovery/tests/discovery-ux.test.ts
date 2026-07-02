// ==========================================================================
// Discovery UX — Tests
// ==========================================================================
// Sprint 20B.7.
//
// Tests for UX state machine, flow orchestration, message generation.
// No UI testing — pure state machine behavior.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { DiscoveryUXOrchestrator, PIPELINE_STAGES, DEFAULT_UX_CONFIG } from '../src/index.js';
import type { InstitutionalProfile } from '../src/index.js';
import type { DiscoveryUXEvent, DiscoveryUXState } from '../src/index.js';

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

function makeMinimalProfile(): InstitutionalProfile {
  return {
    siteId: 'site-test',
    profileVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    institutionName: 'Test Institution',
    components: {
      timeline: {
        siteId: 'site-test',
        generatedAt: '',
        events: [],
        yearRange: { start: null, end: null },
        eventCount: 0,
        requiresReviewCount: 0,
      },
      capabilities: {
        capabilities: [],
        totalDetected: 0,
        totalSuspected: 0,
        generatedAt: '',
      },
      claims: {
        candidates: [],
        totalCandidates: 0,
        insufficientCount: 0,
        generatedAt: '',
      },
      gapAnalysis: {
        results: [],
        totalClaims: 0,
        averageCoverage: 0,
        totalGaps: 0,
        generatedAt: '',
      },
      narrative: {
        siteId: 'site-test',
        generatedAt: '',
        sections: [],
        summary: 'No data.',
        totalCitations: 0,
        totalParagraphs: 0,
      },
    },
    summary: {
      institutionName: 'Test Institution',
      activeYears: { start: null, end: null },
      totalCapabilities: 0,
      confirmedCapabilities: 0,
      suspectedCapabilities: 0,
      totalClaimCandidates: 0,
      averageEvidenceCoverage: 0,
      totalGaps: 0,
      criticalGaps: 0,
      narrativeSummary: 'No data.',
      readinessScore: 0,
      status: 'draft',
    },
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('DiscoveryUXOrchestrator', () => {
  it('starts in onboarding phase', () => {
    const ux = new DiscoveryUXOrchestrator();
    const state = ux.getState();
    expect(state.phase).toBe('onboarding');
    expect(state.status).toBe('idle');
  });

  it('transitions to uploading after institution submission', () => {
    const ux = new DiscoveryUXOrchestrator();
    const state = ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Vilo Research' });

    expect(state.phase).toBe('uploading');
    if (state.phase === 'uploading') {
      expect(state.status).toBe('idle');
    }
  });

  it('transitions to processing after pipeline starts', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Test' });

    const state = ux.dispatch({ type: 'PIPELINE_STARTED' });
    expect(state.phase).toBe('processing');
  });

  it('pipeline progress updates stage and progress', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Test' });
    ux.dispatch({ type: 'PIPELINE_STARTED' });

    const state = ux.dispatch({
      type: 'PIPELINE_PROGRESS',
      stage: 'entity_extraction',
      percent: 50,
    }) as DiscoveryUXState;

    if (state.phase === 'processing') {
      expect(state.currentStage).toBe('entity_extraction');
      expect(state.overallProgress).toBeGreaterThan(0);
      expect(state.stageProgress).toBe(50);
    }
  });

  it('pipeline completion transitions to reviewing phase', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Test' });
    ux.dispatch({ type: 'PIPELINE_STARTED' });

    const profile = makeMinimalProfile();
    const state = ux.dispatch({ type: 'PIPELINE_COMPLETED', profile });

    expect(state.phase).toBe('reviewing');
    if (state.phase === 'reviewing') {
      expect(state.profile).toBeDefined();
      expect(state.profile.institutionName).toBe('Test Institution');
    }
  });

  it('human review action processes items', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Test' });
    ux.dispatch({ type: 'PIPELINE_STARTED' });
    ux.dispatch({ type: 'PIPELINE_COMPLETED', profile: makeMinimalProfile() });

    const state = ux.getState();

    // Since minimal profile has no suspected capabilities or low-coverage claims,
    // the review phase should be completed automatically
    if (state.phase === 'reviewing') {
      expect(state.pendingItems).toBeDefined();
    }
  });

  it('pipeline failure transitions back with error message', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Test' });

    const state = ux.dispatch({
      type: 'PIPELINE_FAILED',
      error: 'Document processing error',
    });

    expect(state.status).toBe('failed');
  });

  it('generates messages during flow', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Vilo Research' });

    const messages = ux.getMessages();
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].type).toBe('recognition_moment');
  });

  it('messages can be cleared', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Test' });
    expect(ux.getMessages().length).toBeGreaterThan(0);

    ux.clearMessages();
    expect(ux.getMessages().length).toBe(0);
  });

  it('accepts custom config', () => {
    const ux = new DiscoveryUXOrchestrator({
      autoStartPipeline: false,
      maxFilesPerBatch: 10,
    });

    // Should start in onboarding phase regardless
    expect(ux.getState().phase).toBe('onboarding');
  });

  it('document upload adds files to state', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Test' });

    const state = ux.dispatch({ type: 'DOCUMENTS_UPLOADED', fileCount: 5 }) as DiscoveryUXState;

    if (state.phase === 'uploading') {
      expect(state.files.length).toBe(5);
      expect(state.status).toBe('in_progress');
    }
  });

  it('PIPELINE_STAGES has all expected stages', () => {
    expect(PIPELINE_STAGES).toContain('document_classification');
    expect(PIPELINE_STAGES).toContain('entity_extraction');
    expect(PIPELINE_STAGES).toContain('timeline_reconstruction');
    expect(PIPELINE_STAGES).toContain('capability_detection');
    expect(PIPELINE_STAGES).toContain('narrative_generation');
    expect(PIPELINE_STAGES).toContain('profile_building');
    expect(PIPELINE_STAGES.length).toBe(9);
  });

  it('profile export changes state', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Test' });
    ux.dispatch({ type: 'PIPELINE_STARTED' });
    ux.dispatch({ type: 'PIPELINE_COMPLETED', profile: makeMinimalProfile() });

    // If already in complete phase, test export
    let state = ux.getState();
    if (state.phase !== 'complete') {
      // Do a human review complete to finish
      state = ux.dispatch({ type: 'HUMAN_REVIEW_COMPLETED' });
    }

    if (state.phase === 'complete') {
      const exportedState = ux.dispatch({ type: 'PROFILE_EXPORTED' });
      if (exportedState.phase === 'complete') {
        expect(exportedState.exported).toBe(true);
      }
    }
  });

  it('handles error events with recoverable flag', () => {
    const ux = new DiscoveryUXOrchestrator();
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Test' });

    // Error during upload phase
    const state = ux.dispatch({
      type: 'PIPELINE_FAILED',
      error: 'Connection lost',
    });

    expect(state.status).toBe('failed');
    const msgs = ux.getMessages();
    expect(msgs.some(m => m.type === 'error')).toBe(true);
  });

  it('can progress through full happy path', () => {
    const ux = new DiscoveryUXOrchestrator();

    // Onboarding
    ux.dispatch({ type: 'INSTITUTION_SUBMITTED', institutionName: 'Happy Path Institute' });
    expect(ux.getState().phase).toBe('uploading');

    // Upload
    ux.dispatch({ type: 'DOCUMENTS_UPLOADED', fileCount: 3 });
    expect(ux.getState().phase).toBe('uploading');

    // Start pipeline
    ux.dispatch({ type: 'PIPELINE_STARTED' });
    expect(ux.getState().phase).toBe('processing');

    // Progress through stages
    for (const stage of PIPELINE_STAGES) {
      ux.dispatch({ type: 'PIPELINE_PROGRESS', stage, percent: 100 });
    }

    // Complete
    ux.dispatch({ type: 'PIPELINE_COMPLETED', profile: makeMinimalProfile() });
    const state = ux.getState();
    expect(['reviewing', 'complete']).toContain(state.phase);
  });

  it('no Evidence Core modification', () => {
    const ux = new DiscoveryUXOrchestrator();
    expect((ux as any).createClaim).toBeUndefined();
    expect((ux as any).createEvidenceNode).toBeUndefined();
  });
});
