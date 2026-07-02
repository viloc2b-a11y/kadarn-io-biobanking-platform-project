// ==========================================================================
// Institutional Profile — Builder
// ==========================================================================
// Sprint 20B.6.
//
// Combines Timeline + Capabilities + Claim Candidates + Gap Analysis + Narrative
// into a single structured InstitutionalProfile ready for human review.
// No Evidence Core promotion. Everything remains editable.
// ==========================================================================

import type { DiscoveryResult } from '../orchestrator.js';
import { TimelineEngine } from '../timeline/engine.js';
import { CapabilityDetector } from '../capability/engine.js';
import { ClaimCandidateDetector } from '../claim-candidate/detector.js';
import { EvidenceGapDetector } from '../gap-detection/detector.js';
import { NarrativeEngine } from '../narrative/engine.js';
import { ClaimMappingRegistry } from '../claim-candidate/mapping.js';
import type { InstitutionalProfile, ProfileSummary, ProfileStatus } from './types.js';

export interface ProfileBuilderOptions {
  /** Institution display name (defaults to siteId) */
  institutionName?: string;
  /** Profile version string */
  profileVersion?: string;
  /** Custom status override */
  status?: ProfileStatus;
}

const DEFAULT_OPTIONS: ProfileBuilderOptions = {
  profileVersion: '1.0.0',
};

// --------------------------------------------------------------------------
// Profile Builder
// --------------------------------------------------------------------------

export class ProfileBuilder {
  private timelineEngine: TimelineEngine;
  private capabilityDetector: CapabilityDetector;
  private claimDetector: ClaimCandidateDetector;
  private gapDetector: EvidenceGapDetector;
  private narrativeEngine: NarrativeEngine;

  constructor() {
    this.timelineEngine = new TimelineEngine();
    this.capabilityDetector = new CapabilityDetector();
    this.claimDetector = new ClaimCandidateDetector(new ClaimMappingRegistry());
    this.gapDetector = new EvidenceGapDetector(new ClaimMappingRegistry());
    this.narrativeEngine = new NarrativeEngine();
  }

  /**
   * Build a complete Institutional Profile from a DiscoveryResult.
   * Runs the full 20B pipeline: Timeline → Capabilities → Claims → Gaps → Narrative.
   */
  build(
    discoveryResult: DiscoveryResult,
    options?: ProfileBuilderOptions,
  ): InstitutionalProfile {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const siteId = `site-${crypto.randomUUID().slice(0, 8)}`;

    // Step 1: Timeline
    const rawTimeline = this.timelineEngine.reconstruct(discoveryResult);
    const timeline = { ...rawTimeline, siteId };

    // Step 2: Capabilities
    const capabilities = this.capabilityDetector.detect(discoveryResult, timeline);

    // Step 3: Claim Candidates
    const claims = this.claimDetector.detect(
      capabilities.capabilities,
      discoveryResult,
      timeline,
    );

    // Step 4: Gap Analysis
    const gapAnalysis = this.gapDetector.analyze(
      claims.candidates,
      discoveryResult,
      timeline,
    );

    // Step 5: Narrative
    const narrative = this.narrativeEngine.generate({
      timeline,
      capabilities: capabilities.capabilities,
      claims: claims.candidates,
      discoveryResult,
      siteId,
    });

    // Step 6: Summary
    const summary = this.buildSummary(
      timeline,
      capabilities,
      claims,
      gapAnalysis,
      narrative,
      opts,
    );

    return {
      siteId,
      profileVersion: opts.profileVersion!,
      generatedAt: new Date().toISOString(),
      institutionName: opts.institutionName ?? siteId,
      components: {
        timeline,
        capabilities,
        claims,
        gapAnalysis,
        narrative,
      },
      summary,
    };
  }

  /**
   * Analyze readiness state of a profile without rebuilding.
   * Useful for UI state checks and gates.
   */
  analyzeReadiness(profile: InstitutionalProfile): {
    status: ProfileStatus;
    blockers: string[];
    warnings: string[];
  } {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const { timeline, capabilities, claims, gapAnalysis } = profile.components;

    // Blockers
    if (timeline.events.length === 0) {
      blockers.push('No timeline events found — institution has no documented activity');
    }

    if (capabilities.totalDetected === 0 && capabilities.totalSuspected === 0) {
      blockers.push('No capabilities detected — insufficient evidence for institutional intelligence');
    }

    if (gapAnalysis.totalGaps > 10) {
      blockers.push(`Excessive evidence gaps (${gapAnalysis.totalGaps}) — profile quality is too low`);
    }

    // Warnings
    if (timeline.requiresReviewCount > 0) {
      warnings.push(`${timeline.requiresReviewCount} timeline events require human review`);
    }

    if (capabilities.totalSuspected > capabilities.totalDetected) {
      warnings.push('More suspected than confirmed capabilities — evidence may be weak');
    }

    if (claims.totalCandidates === 0) {
      warnings.push('No claim candidates reached candidate status');
    }

    if (gapAnalysis.averageCoverage < 50) {
      warnings.push(`Average evidence coverage (${gapAnalysis.averageCoverage}%) is below 50%`);
    }

    // Determine status
    let status: ProfileStatus;
    if (blockers.length > 0) {
      status = 'draft';
    } else if (warnings.length > 0) {
      status = 'needs_review';
    } else {
      status = 'ready';
    }

    return { status, blockers, warnings };
  }

  // ------------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------------

  private buildSummary(
    timeline: import('../timeline/types.js').InstitutionalTimeline,
    capabilities: import('../capability/types.js').CapabilityDetectionResult,
    claims: import('../claim-candidate/types.js').ClaimCandidateDetectionResult,
    gapAnalysis: import('../gap-detection/types.js').GapAnalysisReport,
    narrative: import('../narrative/types.js').InstitutionalNarrative,
    opts: ProfileBuilderOptions,
  ): ProfileSummary {
    const totalGaps = gapAnalysis.results.reduce((s, r) => s + r.gaps.length, 0);
    const criticalGaps = gapAnalysis.results.reduce(
      (s, r) => s + r.severityCounts.critical, 0,
    );

    let status: ProfileStatus;
    if (opts.status) {
      status = opts.status;
    } else if (timeline.events.length === 0 || capabilities.totalDetected + capabilities.totalSuspected === 0) {
      status = 'draft';
    } else if (totalGaps > 0 || timeline.requiresReviewCount > 0) {
      status = 'needs_review';
    } else {
      status = 'ready';
    }

    // Readiness score: weighted composite (0–100)
    const timelineScore = timeline.events.length > 0
      ? Math.min(timeline.events.length / 5, 1) * 25
      : 0;
    const capScore = capabilities.totalDetected > 0
      ? Math.min(capabilities.totalDetected / 5, 1) * 25
      : 0;
    const claimScore = claims.totalCandidates > 0
      ? Math.min(claims.totalCandidates / 3, 1) * 20
      : 0;
    const gapScore = gapAnalysis.totalGaps === 0
      ? 20
      : Math.max(0, 20 - (gapAnalysis.totalGaps / 10) * 20);
    const coverageScore = gapAnalysis.averageCoverage > 0
      ? (gapAnalysis.averageCoverage / 100) * 10
      : 0;

    const readinessScore = Math.round(timelineScore + capScore + claimScore + gapScore + coverageScore);

    return {
      institutionName: opts.institutionName ?? timeline.siteId,
      activeYears: timeline.yearRange,
      totalCapabilities: capabilities.totalDetected + capabilities.totalSuspected,
      confirmedCapabilities: capabilities.totalDetected,
      suspectedCapabilities: capabilities.totalSuspected,
      totalClaimCandidates: claims.totalCandidates,
      averageEvidenceCoverage: Math.round(gapAnalysis.averageCoverage),
      totalGaps,
      criticalGaps,
      narrativeSummary: narrative.summary,
      readinessScore,
      status,
    };
  }
}
