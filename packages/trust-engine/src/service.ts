// ==========================================================================
// Kadarn Trust Engine — Service Layer
// ==========================================================================
// State management: record events, get scores (with decay), file challenges.
//
// NOTE: This is an interface definition. The concrete implementation
// depends on the database adapter (Supabase, direct PostgreSQL, etc.).
// The types and pure functions in engine.ts are the portable core.
// ==========================================================================

import type {
  OrganizationTrust,
  TrustEvent,
  TrustChallenge,
  ChallengeResolution,
  DimensionScoreMap,
  TrustDimension,
  TrajectoryPoint,
  DecayConfig,
} from './types.js';

import {
  computeOverall,
  applyDecayToAll,
  computeImpact,
  applyImpact,
  getSourceDescription,
  getDefaultScore,
  buildTrajectory,
  daysBetween,
} from './engine.js';

// --------------------------------------------------------------------------
// TrustEngineService — interface for trust score state management
// --------------------------------------------------------------------------

export interface TrustEngineAdapter {
  getOrganizationTrust(organizationId: string): Promise<OrganizationTrust | null>;
  upsertOrganizationTrust(trust: Partial<OrganizationTrust> & { organizationId: string }): Promise<void>;
  insertTrustEvent(event: TrustEvent): Promise<string>;
  getTrustEvents(organizationId: string, dimension?: TrustDimension): Promise<TrustEvent[]>;
  insertChallenge(challenge: TrustChallenge): Promise<string>;
  getChallenge(id: string): Promise<TrustChallenge | null>;
  updateChallenge(id: string, updates: Partial<TrustChallenge>): Promise<void>;
}

export class TrustEngineService {
  constructor(private readonly adapter: TrustEngineAdapter) {}

  // ------------------------------------------------------------------------
  // recordEvent — record a trust-affecting event and update scores
  // ------------------------------------------------------------------------
  async recordEvent(event: {
    organizationId: string;
    dimension: TrustDimension;
    source: string;
    severity?: 'low' | 'normal' | 'high' | 'critical';
    evidenceRef: string;
    description?: string;
    customImpact?: number;
  }): Promise<{ eventId: string; scoreBefore: number; scoreAfter: number }> {
    // Get current trust state
    const current = await this.adapter.getOrganizationTrust(event.organizationId);
    const scores: DimensionScoreMap = {
      operational: current?.operationalScore ?? 0.5,
      regulatory: current?.regulatoryScore ?? 0.5,
      financial: current?.financialScore ?? 0.5,
      technical: current?.technicalScore ?? 0.5,
    };

    // Apply decay if days have passed
    if (current?.lastDecayAt) {
      const daysSince = daysBetween(new Date(current.lastDecayAt));
      if (daysSince > 0) {
        const decayed = applyDecayToAll(scores, daysSince);
        Object.assign(scores, decayed);
      }
    }

    const scoreBefore = scores[event.dimension];

    // Compute impact
    const impact = event.customImpact ?? computeImpact(event.source, event.severity ?? 'normal');

    // Apply impact
    const scoreAfter = applyImpact(scoreBefore, impact);
    scores[event.dimension] = scoreAfter;

    // Compute overall
    const overall = computeOverall(scores);

    // Persist event
    const eventId = await this.adapter.insertTrustEvent({
      organizationId: event.organizationId,
      dimension: event.dimension,
      impact,
      evidenceRef: event.evidenceRef,
      source: event.source,
      severity: event.severity ?? 'normal',
      description: event.description ?? getSourceDescription(event.source),
      scoreBefore,
      scoreAfter,
    });

    // Update organization trust record
    await this.adapter.upsertOrganizationTrust({
      organizationId: event.organizationId,
      [dimensionToColumn(event.dimension)]: scoreAfter,
      overallScore: overall,
      lastEventAt: new Date().toISOString(),
      lastDecayAt: new Date().toISOString(),
    });

    return { eventId, scoreBefore, scoreAfter };
  }

  // ------------------------------------------------------------------------
  // getScores — get current trust scores (with decay applied on read)
  // ------------------------------------------------------------------------
  async getScores(
    organizationId: string,
    decayConfig?: Partial<Record<TrustDimension, DecayConfig>>,
  ): Promise<OrganizationTrust> {
    const current = await this.adapter.getOrganizationTrust(organizationId);

    if (!current) {
      // Organization not yet registered — return neutral scores
      return {
        organizationId,
        operationalScore: 0.5,
        regulatoryScore: 0.5,
        financialScore: 0.5,
        technicalScore: 0.5,
        overallScore: 0.5,
        lastEventAt: null,
        lastDecayAt: new Date().toISOString(),
        totalFulfillments: 0,
        successfulFulfillments: 0,
        incidentCount: 0,
      };
    }

    // Apply decay
    const daysSince = daysBetween(new Date(current.lastDecayAt));
    if (daysSince <= 0) {
      return current;
    }

    const scores: DimensionScoreMap = {
      operational: current.operationalScore,
      regulatory: current.regulatoryScore,
      financial: current.financialScore,
      technical: current.technicalScore,
    };

    const decayed = applyDecayToAll(scores, daysSince, decayConfig);

    return {
      ...current,
      operationalScore: decayed.operational,
      regulatoryScore: decayed.regulatory,
      financialScore: decayed.financial,
      technicalScore: decayed.technical,
      overallScore: computeOverall(decayed),
    };
  }

  // ------------------------------------------------------------------------
  // getTrajectory — get score history over time
  // ------------------------------------------------------------------------
  async getTrajectory(organizationId: string): Promise<TrajectoryPoint[]> {
    const events = await this.adapter.getTrustEvents(organizationId);
    return buildTrajectory(events);
  }

  // ------------------------------------------------------------------------
  // fileChallenge — file a trust score challenge
  // ------------------------------------------------------------------------
  async fileChallenge(challenge: {
    organizationId: string;
    dimension: TrustDimension;
    evidenceRef: string;
    reason: string;
    proposedScore?: number;
  }): Promise<string> {
    const current = await this.adapter.getOrganizationTrust(challenge.organizationId);
    const challengedScore = current
      ? current[`${challenge.dimension}Score` as keyof OrganizationTrust] as number
      : 0.5;

    return this.adapter.insertChallenge({
      organizationId: challenge.organizationId,
      dimension: challenge.dimension,
      challengedScore,
      proposedScore: challenge.proposedScore,
      evidenceRef: challenge.evidenceRef,
      reason: challenge.reason,
      status: 'filed',
    });
  }

  // ------------------------------------------------------------------------
  // resolveChallenge — accept or reject a challenge
  // ------------------------------------------------------------------------
  async resolveChallenge(resolution: ChallengeResolution): Promise<void> {
    await this.adapter.updateChallenge(resolution.challengeId, {
      status: resolution.status,
      reviewedBy: resolution.reviewedBy,
      reviewedAt: resolution.reviewedAt,
      resolutionNotes: resolution.resolutionNotes,
    });

    // If accepted, update the score to the proposed value
    if (resolution.status === 'accepted' && resolution.newScore !== undefined) {
      const challenge = await this.adapter.getChallenge(resolution.challengeId);
      if (challenge) {
        await this.adapter.upsertOrganizationTrust({
          organizationId: challenge.organizationId,
          [dimensionToColumn(challenge.dimension)]: resolution.newScore,
          overallScore: computeOverall({
            operational: challenge.dimension === 'operational' ? resolution.newScore : 0.5,
            regulatory: challenge.dimension === 'regulatory' ? resolution.newScore : 0.5,
            financial: challenge.dimension === 'financial' ? resolution.newScore : 0.5,
            technical: challenge.dimension === 'technical' ? resolution.newScore : 0.5,
          }),
        });
      }
    }
  }
}

// --------------------------------------------------------------------------
// Helper: dimension to column name
// --------------------------------------------------------------------------

function dimensionToColumn(dim: TrustDimension): string {
  switch (dim) {
    case 'operational': return 'operationalScore';
    case 'regulatory':  return 'regulatoryScore';
    case 'financial':   return 'financialScore';
    case 'technical':   return 'technicalScore';
  }
}
