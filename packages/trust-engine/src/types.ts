// ==========================================================================
// Kadarn Trust Engine — Type Definitions
// ==========================================================================
// ADR-011: Evidence-Based Trust Computation
// KRM-RAO §2.7 (Trust), §4.4 (Trust Graph), §5.4 (Trust Engine)
// ==========================================================================

// --------------------------------------------------------------------------
// Trust dimensions
// --------------------------------------------------------------------------

export type TrustDimension = 'operational' | 'regulatory' | 'financial' | 'technical';

export const ALL_DIMENSIONS: TrustDimension[] = [
  'operational',
  'regulatory',
  'financial',
  'technical',
];

// --------------------------------------------------------------------------
// Organization trust scores
// --------------------------------------------------------------------------

export interface OrganizationTrust {
  organizationId: string;
  operationalScore: number;
  regulatoryScore: number;
  financialScore: number;
  technicalScore: number;
  overallScore: number;
  lastEventAt: string | null;
  lastDecayAt: string;
  totalFulfillments: number;
  successfulFulfillments: number;
  incidentCount: number;
}

export type DimensionScoreMap = Record<TrustDimension, number>;

// --------------------------------------------------------------------------
// Trust events
// --------------------------------------------------------------------------

export type TrustEventSeverity = 'low' | 'normal' | 'high' | 'critical';

export const SEVERITY_MULTIPLIERS: Record<TrustEventSeverity, number> = {
  low: 0.5,
  normal: 1.0,
  high: 1.5,
  critical: 2.0,
};

export interface TrustEvent {
  id?: string;
  organizationId: string;
  dimension: TrustDimension;
  /** Raw impact before any multipliers (-1.0 to +1.0) */
  impact: number;
  /** Reference to supporting evidence */
  evidenceRef: string;
  /** Canonical source, e.g. 'fulfillment.completed' */
  source: string;
  severity: TrustEventSeverity;
  description?: string;
  scoreBefore?: number;
  scoreAfter?: number;
  createdBy?: string;
}

// --------------------------------------------------------------------------
// Trust challenges
// --------------------------------------------------------------------------

export type ChallengeStatus = 'filed' | 'under_review' | 'accepted' | 'rejected' | 'escalated';

export interface TrustChallenge {
  id?: string;
  organizationId: string;
  dimension: TrustDimension;
  challengedScore: number;
  proposedScore?: number;
  evidenceRef: string;
  reason: string;
  status: ChallengeStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionNotes?: string;
}

// --------------------------------------------------------------------------
// Decay configuration
// --------------------------------------------------------------------------

export interface DecayConfig {
  /** Daily decay rate (0.0-1.0). Higher = faster decay. */
  rate: number;
}

export const DEFAULT_DECAY_CONFIG: Record<TrustDimension, DecayConfig> = {
  operational: { rate: 0.01 },   // 1%/day — recent performance matters most
  regulatory:  { rate: 0.005 },  // 0.5%/day — certifications last 1-2 years
  financial:   { rate: 0.005 },  // 0.5%/day
  technical:   { rate: 0.002 },  // 0.2%/day — system quality is persistent
};

// --------------------------------------------------------------------------
// Score computation configuration
// --------------------------------------------------------------------------

export interface ImpactConfig {
  /** Base impact for this source before any multipliers */
  baseImpact: number;
  /** Human-readable description template */
  description: string;
}

/**
 * Default impact values for known event sources.
 * These are initial estimates — tune as the platform matures.
 */
export const DEFAULT_IMPACT_SOURCES: Record<string, ImpactConfig> = {
  'fulfillment.completed':       { baseImpact: 0.02,  description: 'Fulfillment completed successfully' },
  'fulfillment.partial':         { baseImpact: 0.005, description: 'Partial fulfillment accepted' },
  'fulfillment.disputed':        { baseImpact: -0.05, description: 'Fulfillment disputed by recipient' },
  'temperature.breach':          { baseImpact: -0.10, description: 'Temperature breach during shipment' },
  'temperature.compliant':       { baseImpact: 0.01,  description: 'Shipment maintained temperature throughout' },
  'qc.passed':                   { baseImpact: 0.01,  description: 'QC passed' },
  'qc.failed':                   { baseImpact: -0.03, description: 'QC failed' },
  'accreditation.verified':      { baseImpact: 0.05,  description: 'Accreditation verified (CAP, CLIA, ISO)' },
  'accreditation.expired':       { baseImpact: -0.08, description: 'Accreditation expired' },
  'compliance.incident':         { baseImpact: -0.15, description: 'Compliance incident recorded' },
  'compliance.resolved':         { baseImpact: 0.04,  description: 'Compliance incident resolved' },
  'regulatory.action':           { baseImpact: -0.25, description: 'Regulatory action (FDA, EMA, etc.)' },
  'payment.on_time':             { baseImpact: 0.01,  description: 'Payment completed on time' },
  'payment.late':                { baseImpact: -0.02, description: 'Payment was late' },
  'payment.default':             { baseImpact: -0.15, description: 'Payment default' },
  'integration.healthy':         { baseImpact: 0.005, description: 'Integration health check passed' },
  'integration.outage':          { baseImpact: -0.03, description: 'Integration experienced outage' },
};

// --------------------------------------------------------------------------
// Challenge result
// --------------------------------------------------------------------------

export interface ChallengeResolution {
  challengeId: string;
  status: ChallengeStatus;
  newScore?: number;
  reviewedBy: string;
  reviewedAt: string;
  resolutionNotes: string;
}

// --------------------------------------------------------------------------
// Trajectory point
// --------------------------------------------------------------------------

export interface TrajectoryPoint {
  date: string;
  score: number;
  dimension: TrustDimension;
  eventSource?: string;
  eventDescription?: string;
}
