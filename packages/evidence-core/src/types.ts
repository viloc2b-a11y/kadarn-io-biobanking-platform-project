// ==========================================================================
// Kadarn Evidence Core — Canonical Domain Types
// ==========================================================================
// Baseline AF-1.0. No inference. No persistence. No confidence computation.
// ==========================================================================

import { EvidenceClass } from './evidence-class.js';

// --------------------------------------------------------------------------
// Temporal metadata (KEMS-001 §9)
// --------------------------------------------------------------------------

export interface TemporalMetadata {
  /** When this entity was created (ISO 8601) */
  createdAt: string;
  /** When this entity was last modified (ISO 8601) */
  updatedAt: string;
  /** Natural decay period in months. null = no decay. */
  decayPeriodMonths: number | null;
}

// --------------------------------------------------------------------------
// Provenance metadata (KEMS-001 §2 Component B)
// --------------------------------------------------------------------------

export interface ProvenanceMetadata {
  /** Actor who created this entity */
  createdByActorId: string;
  /** Organization under which this entity was created */
  createdByOrganizationId: string;
  /** Correlation ID linking related provenance events */
  correlationId: string;
  /** Human-readable summary of provenance action */
  summary: string;
  /** Optional reference to source event or prior version */
  sourceEventId?: string;
}

// --------------------------------------------------------------------------
// Actor visibility metadata (KEMS-001 §7)
// --------------------------------------------------------------------------

export type VisibilityScope = 'site' | 'sponsor_authorized' | 'system';

export interface VisibilityMetadata {
  /** Organization that owns this evidence */
  owningOrganizationId: string;
  /** Current visibility scope */
  scope: VisibilityScope;
  /** IDs of sponsors authorized to see this evidence (if scope = sponsor_authorized) */
  authorizedSponsorIds: string[];
}

// --------------------------------------------------------------------------
// Evidence Node (KEMS-001 §2 Component B)
// --------------------------------------------------------------------------

export type EvidenceNodeStatus = 'active' | 'superseded' | 'disputed' | 'resolved';

export interface EvidenceNode {
  /** Unique identifier */
  id: string;
  /** The Claim this evidence supports or contradicts */
  claimId: string;
  /** Evidence Class (A–F) */
  evidenceClass: EvidenceClass;
  /** Human-readable content summary */
  content: string;
  /** Structured source reference */
  source: string;
  /** Date evidence was produced (ISO 8601) */
  date: string;
  /** Node status in process lifecycle */
  status: EvidenceNodeStatus;
  /** Relative weight contribution (set by Evidence Class, may be modulated) */
  weight: number;
  /** Provenance chain */
  provenance: ProvenanceMetadata;
  /** Visibility and access control */
  visibility: VisibilityMetadata;
  /** Temporal metadata including decay */
  temporal: TemporalMetadata;
}

// --------------------------------------------------------------------------
// Claim (KEMS-001 §1)
// --------------------------------------------------------------------------

export type ClaimStatus = 'active' | 'archived' | 'deprecated';

export interface Claim {
  /** Unique identifier */
  id: string;
  /** Canonical Claim ID from taxonomy (e.g., "biospecimen.storage.freezer_minus_80c") */
  claimTypeId: string;
  /** Human-readable name */
  name: string;
  /** Claim description */
  description: string;
  /** Organization that owns this Claim */
  organizationId: string;
  /** Current lifecycle status */
  status: ClaimStatus;
  /** Domain this Claim belongs to (e.g., "biospecimen") */
  domain: string;
  /** Whether this Claim can decay without new evidence */
  decays: boolean;
  /** Natural decay period in months (null if no decay) */
  decayPeriodMonths: number | null;
  /** Evidence Classes that are valid for this Claim */
  validEvidenceClasses: EvidenceClass[];
  /** Minimum Evidence Classes required for baseline confidence */
  requiredEvidenceClasses: EvidenceClass[];
  /** Temporal metadata */
  temporal: TemporalMetadata;
  /** Provenance */
  provenance: ProvenanceMetadata;
  /** Visibility */
  visibility: VisibilityMetadata;
}

// --------------------------------------------------------------------------
// Evidence Relationship (KEMS-001 §2 Component C)
// --------------------------------------------------------------------------

export type RelationshipType = 'supports' | 'contradicts' | 'corroborates' | 'responds_to' | 'supersedes';

export interface EvidenceRelationship {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: RelationshipType;
  provenance: ProvenanceMetadata;
  temporal: TemporalMetadata;
}

// --------------------------------------------------------------------------
// Counter Evidence (KEMS-001 §4)
// --------------------------------------------------------------------------
// A Counter Evidence node follows the same structure as Evidence Node
// but carries negative weight and cannot be deleted.

export interface CounterEvidence extends EvidenceNode {
  /** Explicit marker — always true for Counter Evidence */
  isCounterEvidence: true;
  /** Whether a Right of Response has been submitted */
  hasResponse: boolean;
  /** ID of the Right of Response, if any */
  responseId: string | null;
}

// --------------------------------------------------------------------------
// Right of Response (KEMS-001 §8)
// --------------------------------------------------------------------------

export interface RightOfResponse {
  /** Unique identifier */
  id: string;
  /** The Counter Evidence this responds to */
  counterEvidenceId: string;
  /** Description of corrective action taken */
  description: string;
  /** Date of resolution */
  resolutionDate: string;
  /** Current resolution status */
  status: 'submitted' | 'accepted' | 'rejected' | 'confirmed';
  /** Evidence supporting the resolution */
  supportingEvidenceIds: string[];
  /** Provenance */
  provenance: ProvenanceMetadata;
  /** Temporal */
  temporal: TemporalMetadata;
  /** Visibility */
  visibility: VisibilityMetadata;
}
