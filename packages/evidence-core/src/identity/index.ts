// ==========================================================================
// Institution Identity — Public API
// ==========================================================================
// Baseline AF-1.0. Sprint 19.0A.
// ACR-001: Institution → Site hierarchy enforced.
// ==========================================================================

export {
  resolveIdentity,
  resolveTier1,
  resolveTier2,
  resolveTier3,
  resolveTier4,
  normalizeName,
  normalizeForMatching,
  expandAbbreviations,
} from './resolver.js';

export {
  detectConflicts,
  detectMergeCandidates,
  detectSplitCandidates,
  requireSiteId,
  requireKadarnId,
} from './conflicts.js';

export type {
  InstitutionIdentity,
  SiteIdentity,
  InstitutionAlias,
  ExternalIdentifier,
  ExternalIdentifierType,
  ExternalIdentifierHistoryEntry,
  IdentifierHistoryEvent,
  UnresolvedIdentity,
  IdentityResolution,
  IdentityConflict,
  IdentityConfidence,
  MergeCandidate,
  SplitCandidate,
  IdentityPipelineResult,
  IdentityStatus,
  SiteStatus,
  IdentityTier,
} from './types.js';

export { TIER_NAMES } from './types.js';
