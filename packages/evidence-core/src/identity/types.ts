// ==========================================================================
// Institution Identity — Domain Types
// ==========================================================================
// Baseline AF-1.0. Sprint 19.0A.
//
// Identity is infrastructure, not Evidence.
// Institution = legal entity. Site = operational unit.
// No evidence connector may create an EvidenceNode with a raw external identifier.
// ==========================================================================

// --------------------------------------------------------------------------
// Identity Confidence (separate from Evidence Class)
// --------------------------------------------------------------------------

export type IdentityConfidence = 'high' | 'medium' | 'low';

// --------------------------------------------------------------------------
// External identifier types
// --------------------------------------------------------------------------

export type ExternalIdentifierType = 'fei' | 'clia' | 'cap' | 'nct_id' | 'pubmed_affiliation' | 'clinicaltrials_org' | 'ror' | 'grid' | 'custom';

export interface ExternalIdentifier {
  type: ExternalIdentifierType;
  value: string;
  label: string;
  /** Identity confidence for this specific identifier match */
  confidence: IdentityConfidence;
  /** When this identifier was last verified */
  verifiedAt: string | null;
  /** How this was verified */
  verifiedBy: 'automated' | 'manual' | 'site_confirmed';
}

// --------------------------------------------------------------------------
// External identifier history (append-only)
// --------------------------------------------------------------------------

export type IdentifierHistoryEvent = 'confidence_changed' | 'verified_at_changed' | 'manual_correction' | 'site_confirmation' | 'created';

export interface ExternalIdentifierHistoryEntry {
  id: string;
  kadarnId: string;
  identifierType: ExternalIdentifierType;
  identifierValue: string;
  event: IdentifierHistoryEvent;
  previousConfidence: IdentityConfidence | null;
  newConfidence: IdentityConfidence | null;
  timestamp: string;
  changedBy: string;
  reason: string;
}

// --------------------------------------------------------------------------
// Institution alias
// --------------------------------------------------------------------------

export interface InstitutionAlias {
  alias: string;
  source: string;
  confidence: IdentityConfidence;
  createdAt: string;
}

// --------------------------------------------------------------------------
// Identity resolution tiers
// --------------------------------------------------------------------------

export type IdentityTier = 1 | 2 | 3 | 4;

export const TIER_NAMES: Record<IdentityTier, string> = {
  1: 'Exact External Identifier Match',
  2: 'Normalized Name + Address Fuzzy Match',
  3: 'Cross-Source Bootstrap',
  4: 'Site-Confirmed Identity',
};

// --------------------------------------------------------------------------
// InstitutionIdentity — legal/corporate entity
// --------------------------------------------------------------------------

export type IdentityStatus = 'active' | 'merged' | 'conflict' | 'unresolved';

export interface InstitutionIdentity {
  /** Kadarn internal ID */
  kadarnId: string;
  /** Canonical institution name */
  canonicalName: string;
  /** Legal entity type */
  institutionType: 'site' | 'biobank' | 'laboratory' | 'smo' | 'hospital' | 'academic' | 'other';
  /** Whether this identity is active */
  active: boolean;

  /** All known external identifiers */
  externalIds: ExternalIdentifier[];
  /** Alternative names for Tier 2 matching */
  aliases: InstitutionAlias[];
  /** Current resolution tier */
  resolvedAtTier: IdentityTier | null;
  /** Identity lifecycle status */
  status: IdentityStatus;

  /** Legal address */
  address?: {
    city: string;
    state: string;
    country: string;
    zip?: string;
  };

  // -- Provenance (added in 19.0A)
  identityCreatedBy: string;
  identitySource: string;
  identityLastVerified: string | null;
  identityVersion: number;

  // -- Temporal
  createdAt: string;
  updatedAt: string;

  /** If merged, points to the surviving kadarn_id */
  mergedInto: string | null;
}

// --------------------------------------------------------------------------
// SiteIdentity — operational unit
// --------------------------------------------------------------------------

export type SiteStatus = 'active' | 'inactive' | 'pending_confirmation';

export interface SiteIdentity {
  /** Kadarn site ID */
  siteId: string;
  /** Parent institution */
  kadarnId: string;
  /** Site name */
  siteName: string;
  /** Site type */
  siteType: 'research_unit' | 'biobank' | 'laboratory' | 'clinic' | 'other';
  /** Operational address (may differ from legal address) */
  address?: {
    city: string;
    state: string;
    country: string;
    zip?: string;
  };
  /** Status */
  status: SiteStatus;
  /** Identity confidence for this site */
  identityConfidence: IdentityConfidence;
  /** Provenance */
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// --------------------------------------------------------------------------
// UnresolvedIdentity — staging model
// --------------------------------------------------------------------------

export interface UnresolvedIdentity {
  stagingId: string;
  externalId: ExternalIdentifier;
  source: string;
  sourceName: string;
  context: Record<string, unknown>;
  stagedAt: string;
  attemptCount: number;
  lastReason: string;
}

// --------------------------------------------------------------------------
// Resolution result
// --------------------------------------------------------------------------

export interface IdentityResolution {
  institution: InstitutionIdentity | null;
  site: SiteIdentity | null;
  resolutionTier: IdentityTier | null;
  unresolved: UnresolvedIdentity | null;
  identityConfidence: IdentityConfidence;
  explanation: string;
}

// --------------------------------------------------------------------------
// Conflict & merge/split candidates
// --------------------------------------------------------------------------

export interface IdentityConflict {
  externalId: ExternalIdentifier;
  existingIds: string[];
  description: string;
}

export interface MergeCandidate {
  primaryId: string;
  secondaryIds: string[];
  reason: string;
  confidence: number;
}

export interface SplitCandidate {
  kadarnId: string;
  suggestedIds: string[];
  reason: string;
  confidence: number;
}

// --------------------------------------------------------------------------
// Identity resolution pipeline result
// --------------------------------------------------------------------------

export interface IdentityPipelineResult {
  institution: InstitutionIdentity | null;
  site: SiteIdentity | null;
  unresolved: UnresolvedIdentity | null;
  conflicts: IdentityConflict[];
  mergeCandidates: MergeCandidate[];
  splitCandidates: SplitCandidate[];
  tier: IdentityTier | null;
  identityConfidence: IdentityConfidence;
  explanation: string;
}
