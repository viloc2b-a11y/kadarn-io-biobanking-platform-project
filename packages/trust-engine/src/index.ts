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
} from './engine';

export { TrustEngineService } from './service';

export type { TrustEngineAdapter } from './service';

export { InMemoryTrustAdapter } from './adapters/memory-adapter';

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
} from './types';

export {
  ALL_DIMENSIONS,
  SEVERITY_MULTIPLIERS,
  DEFAULT_DECAY_CONFIG,
  DEFAULT_IMPACT_SOURCES,
} from './types';
