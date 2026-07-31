// ─── KAD-EVIDENCE-GOVERNANCE — Evidence Governance Types ────────────────
// Authority: KEMS Site Profile Production Spec, Evidence Core
//
// Extends the canonical evidence model (evidence.ts) with governance
// types: authenticity signals, entity relationships, conflict tracking,
// review events, and support classification. These types are used in
// the evidence governance pipeline for KEMS publication workflows.

import { z } from 'zod'

// ─── Enums ──────────────────────────────────────────────────────────────

/**
 * SupportType — how evidence supports (or doesn't support) a claim.
 *
 * Values:
 *   - DIRECT         — evidence directly proves the claim
 *   - PARTIAL        — evidence partially supports the claim
 *   - CONTEXTUAL     — evidence provides context but doesn't prove
 *   - CONTRADICTORY  — evidence contradicts the claim
 *   - OBSOLETE       — evidence is no longer relevant/valid
 */
export const SupportType = z.enum([
  'DIRECT',
  'PARTIAL',
  'CONTEXTUAL',
  'CONTRADICTORY',
  'OBSOLETE',
])
export type SupportType = z.infer<typeof SupportType>

/**
 * Authenticity signal type — the kind of verification signal.
 */
export const AuthenticitySignalType = z.enum([
  'digital_signature',
  'hash_verification',
  'chain_of_custody',
  'issuer_verification',
  'timestamp_verification',
  'source_attestation',
  'external_registry',
  'manual_review',
])
export type AuthenticitySignalType = z.infer<typeof AuthenticitySignalType>

/**
 * Authenticity verification result.
 */
export const AuthenticityResult = z.enum([
  'verified',
  'unverified',
  'failed',
  'expired',
  'pending',
  'not_applicable',
])
export type AuthenticityResult = z.infer<typeof AuthenticityResult>

/**
 * Evidence conflict resolution status.
 */
export const EvidenceConflictStatus = z.enum([
  'open',
  'under_review',
  'resolved_favoring_source',
  'resolved_favoring_target',
  'dismissed',
  'escalated',
])
export type EvidenceConflictStatus = z.infer<typeof EvidenceConflictStatus>

/**
 * Evidence review event type.
 */
export const EvidenceReviewEventType = z.enum([
  'submitted',
  'assigned',
  'started',
  'comment_added',
  'evidence_requested',
  'evidence_provided',
  'approved',
  'rejected',
  'escalated',
  'closed',
])
export type EvidenceReviewEventType = z.infer<typeof EvidenceReviewEventType>

// ─── EvidenceAuthenticitySignal ─────────────────────────────────────────

/**
 * A verification signal asserting (or failing to assert) the authenticity
 * of an evidence item. Each signal represents a single verification check.
 */
export const EvidenceAuthenticitySignalSchema = z.object({
  id: z.string().uuid(),
  evidence_id: z.string().uuid(),
  organization_id: z.string().uuid(),

  // Signal identity
  signal_type: AuthenticitySignalType,
  result: AuthenticityResult.default('pending'),

  // Verification details
  verified_by: z.string().uuid().optional().nullable(),
  verification_method: z.string().optional().nullable(),
  verification_details: z.record(z.string(), z.unknown()).optional().nullable(),

  // Signature / hash reference
  signature_ref: z.string().optional().nullable(),
  hash_value: z.string().optional().nullable(),
  hash_algorithm: z.string().optional().nullable(),

  // Issuer information (for issuer_verification, source_attestation)
  issuer_id: z.string().uuid().optional().nullable(),
  issuer_name: z.string().optional().nullable(),

  // Temporal
  verified_at: z.string().datetime({ offset: true }).optional().nullable(),
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),

  // Notes
  rationale: z.string().optional().nullable(),

  // Audit
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type EvidenceAuthenticitySignal = z.infer<typeof EvidenceAuthenticitySignalSchema>

// ─── EvidenceEntityRelationship ─────────────────────────────────────────

/**
 * A typed relationship between an evidence item and a domain entity
 * (claim, capability, site profile, person, location, etc.).
 * Supports the evidence governance pipeline's entity linkage model.
 */
export const EvidenceEntityRelationshipSchema = z.object({
  id: z.string().uuid(),
  evidence_id: z.string().uuid(),

  // Target entity
  entity_type: z.string().min(1),
  entity_id: z.string().uuid(),

  // Relationship classification
  relationship_type: z.string().min(1),
  support_type: SupportType.default('CONTEXTUAL'),

  // Weight for confidence aggregation
  weight: z.number().min(0).max(1).default(0.5),

  // Context
  rationale: z.string().optional().nullable(),
  locator_ref: z.string().optional().nullable(),

  // Provenance
  derived_from_observation_id: z.string().uuid().optional().nullable(),
  generation_rule_id: z.string().uuid().optional().nullable(),

  // Temporal
  valid_from: z.string().datetime({ offset: true }).optional().nullable(),
  valid_until: z.string().datetime({ offset: true }).optional().nullable(),

  // Audit
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type EvidenceEntityRelationship = z.infer<typeof EvidenceEntityRelationshipSchema>

// ─── EvidenceConflict ───────────────────────────────────────────────────

/**
 * A recorded conflict between two evidence items.
 * Used when evidence items contradict each other, requiring
 * governance resolution.
 */
export const EvidenceConflictSchema = z.object({
  id: z.string().uuid(),
  source_evidence_id: z.string().uuid(),
  target_evidence_id: z.string().uuid(),
  organization_id: z.string().uuid(),

  // Conflict classification
  conflict_type: z.string().min(1),
  description: z.string().optional().nullable(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),

  // Status
  status: EvidenceConflictStatus.default('open'),

  // Detection
  detected_by: z.string().uuid().optional().nullable(),
  detection_method: z.string().optional().nullable(),
  detected_at: z.string().datetime({ offset: true }),

  // Resolution
  resolved_by: z.string().uuid().optional().nullable(),
  resolved_at: z.string().datetime({ offset: true }).optional().nullable(),
  resolution_notes: z.string().optional().nullable(),
  resolution_rationale: z.string().optional().nullable(),

  // Audit
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type EvidenceConflict = z.infer<typeof EvidenceConflictSchema>

// ─── EvidenceReviewEvent ────────────────────────────────────────────────

/**
 * An event in the evidence review lifecycle.
 * Tracks the full audit trail of evidence review activities.
 */
export const EvidenceReviewEventSchema = z.object({
  id: z.string().uuid(),
  evidence_id: z.string().uuid(),
  review_id: z.string().uuid().optional().nullable(),
  organization_id: z.string().uuid(),

  // Event identity
  event_type: EvidenceReviewEventType,
  sequence_number: z.number().int().min(1),

  // Who did what
  actor_id: z.string().uuid().optional().nullable(),
  actor_role: z.string().optional().nullable(),

  // Event content
  comment: z.string().optional().nullable(),
  previous_state: z.record(z.string(), z.unknown()).optional().nullable(),
  new_state: z.record(z.string(), z.unknown()).optional().nullable(),

  // Linked items
  linked_claim_id: z.string().uuid().optional().nullable(),
  linked_capability_id: z.string().uuid().optional().nullable(),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),

  // Audit
  created_at: z.string().datetime({ offset: true }),
})
export type EvidenceReviewEvent = z.infer<typeof EvidenceReviewEventSchema>

// ─── Create DTOs ────────────────────────────────────────────────────────

export const CreateEvidenceAuthenticitySignalSchema = z.object({
  evidence_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  signal_type: AuthenticitySignalType,
  verification_method: z.string().optional(),
  verification_details: z.record(z.string(), z.unknown()).optional(),
  signature_ref: z.string().optional(),
  hash_value: z.string().optional(),
  hash_algorithm: z.string().optional(),
  issuer_id: z.string().uuid().optional(),
  issuer_name: z.string().optional(),
  rationale: z.string().optional(),
})
export type CreateEvidenceAuthenticitySignal = z.infer<typeof CreateEvidenceAuthenticitySignalSchema>

export const CreateEvidenceEntityRelationshipSchema = z.object({
  evidence_id: z.string().uuid(),
  entity_type: z.string().min(1),
  entity_id: z.string().uuid(),
  relationship_type: z.string().min(1),
  support_type: SupportType.optional(),
  weight: z.number().min(0).max(1).optional(),
  rationale: z.string().optional(),
  locator_ref: z.string().optional(),
  derived_from_observation_id: z.string().uuid().optional(),
  generation_rule_id: z.string().uuid().optional(),
  valid_from: z.string().datetime({ offset: true }).optional(),
  valid_until: z.string().datetime({ offset: true }).optional(),
})
export type CreateEvidenceEntityRelationship = z.infer<typeof CreateEvidenceEntityRelationshipSchema>

export const CreateEvidenceConflictSchema = z.object({
  source_evidence_id: z.string().uuid(),
  target_evidence_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  conflict_type: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  detection_method: z.string().optional(),
})
export type CreateEvidenceConflict = z.infer<typeof CreateEvidenceConflictSchema>
