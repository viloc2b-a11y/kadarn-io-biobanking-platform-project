// ==========================================================================
// Kadarn Trust Engine — Public API
// ==========================================================================

export {
  computeOverall,
  applyDecay,
  applyDecayToAll,
  computeImpact,
  applyImpact,
  getSourceDescription,
  getDefaultScore,
  computeScoreFromEvents,
  buildTrajectory,
  daysBetween,
} from './engine.js';

export { TrustEngineService } from './service.js';

export type { TrustEngineAdapter } from './service.js';

export type {
  OrganizationTrust,
  TrustEvent,
  TrustChallenge,
  ChallengeResolution,
  DimensionScoreMap,
  TrustDimension,
  TrustEventSeverity,
  ChallengeStatus,
  DecayConfig,
  TrajectoryPoint,
  ImpactConfig,
} from './types.js';

export {
  ALL_DIMENSIONS,
  SEVERITY_MULTIPLIERS,
  DEFAULT_DECAY_CONFIG,
  DEFAULT_IMPACT_SOURCES,
} from './types.js';
