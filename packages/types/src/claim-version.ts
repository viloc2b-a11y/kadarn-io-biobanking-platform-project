// ─── KAD-LOOP-003 — Immutable Claim Versioning (Phase 1) ────────────────
// Authority: KADARN Product Constitution, LOOP-3 Spec
//
// Every claim version is an immutable snapshot. Once a version is created
// it MUST NOT be destructively updated. The full lineage of a claim is
// reconstructable from the sequence of ClaimVersion rows for a given
// claim_id. Supersession is recorded by linking to the successor version.
//
// Relationship to ClaimSchema:
//   - ClaimSchema is the "current" mutable view of a claim (one row per
//     claim, updated in place).
//   - ClaimVersionSchema is the immutable append-only history (one row per
//     version, never updated).
//   - When a claim is edited, the service layer:
//       1. Snapshots the current state into a new ClaimVersion row.
//       2. Marks the previous current version's superseded_by.
//       3. Applies the edit to the Claim row and bumps its `version`.
//
// DB mapping: `claim_versions` table (to be created by a LOOP-3
// migration). The schema below is the canonical TS contract; the
// migration must match these fields.

import { z } from 'zod'
import {
  ClaimCategory,
  ClaimPriority,
  ClaimScope,
  ClaimLifecycleStatus,
  ClaimWorkflowState,
  ClaimReviewStatus,
  ClaimVerificationStatus,
} from './claim'

// ─── Immutable Claim Version Snapshot ───────────────────────────────────

export const ClaimVersionSchema = z.object({
  id: z.string().uuid(),

  // The claim this version belongs to, and the version number.
  // version numbers are monotonic per claim_id starting at 1.
  claim_id: z.string().uuid(),
  version: z.number().int().min(1),

  // Snapshot of the claim's content at this version.
  claim_type_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),

  // Snapshot of scope targets
  organization_id: z.string().uuid(),
  location_id: z.string().uuid().optional().nullable(),
  person_id: z.string().uuid().optional().nullable(),

  // Snapshot of LOOP-3 classification
  claim_category: ClaimCategory.optional().nullable(),
  claim_scope: ClaimScope.optional().nullable(),
  priority: ClaimPriority.optional().nullable(),

  // Snapshot of ownership & provenance
  owner_id: z.string().uuid().optional().nullable(),
  source_event_id: z.string().uuid().optional().nullable(),

  // Snapshot of all status dimensions at the time the version was frozen.
  // These are the values that were on the Claim row when this version was
  // captured — they do NOT change after insertion.
  workflow_state: ClaimWorkflowState,
  lifecycle_status: ClaimLifecycleStatus,
  review_status: ClaimReviewStatus,
  /** @deprecated Legacy verification pipeline snapshot. */
  verification_status: ClaimVerificationStatus.optional().nullable(),

  // Snapshot of evidence roll-up at freeze time
  evidence_count: z.number().int().min(0).default(0),

  // Snapshot of lifecycle expiry/supersession
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  /** ID of the ClaimVersion that superseded this one, if any. Null = current. */
  superseded_by: z.string().uuid().optional().nullable(),
  supersession_reason: z.string().optional().nullable(),

  // Snapshot of misc fields
  tags: z.string().optional().nullable(),

  // Audit
  created_by_actor_id: z.string().uuid().optional().nullable(),
  /** When this version was frozen. Immutable. */
  created_at: z.string().datetime({ offset: true }),
})

export type ClaimVersion = z.infer<typeof ClaimVersionSchema>

// ─── Create DTO ─────────────────────────────────────────────────────────
// Used by the service layer to snapshot the current state of a Claim into
// a new immutable version. The caller supplies the snapshot fields; the
// schema validates that they form a coherent version.

export const CreateClaimVersionSchema = z.object({
  claim_id: z.string().uuid(),
  version: z.number().int().min(1),

  claim_type_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),

  organization_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),

  claim_category: ClaimCategory.optional(),
  claim_scope: ClaimScope.optional(),
  priority: ClaimPriority.optional(),

  owner_id: z.string().uuid().optional(),
  source_event_id: z.string().uuid().optional(),

  workflow_state: ClaimWorkflowState,
  lifecycle_status: ClaimLifecycleStatus,
  review_status: ClaimReviewStatus,
  /** @deprecated Legacy. */
  verification_status: ClaimVerificationStatus.optional(),

  evidence_count: z.number().int().min(0).optional(),

  expires_at: z.string().datetime({ offset: true }).optional(),
  superseded_by: z.string().uuid().optional(),
  supersession_reason: z.string().optional(),

  tags: z.string().optional(),
  created_by_actor_id: z.string().uuid().optional(),
})
export type CreateClaimVersion = z.infer<typeof CreateClaimVersionSchema>

// ─── Lineage Query Helpers ──────────────────────────────────────────────
// Lightweight shapes for querying version lineage without loading full
// snapshots. Useful for rendering a version history tree in the UI.

export const ClaimVersionSummarySchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  version: z.number().int().min(1),
  lifecycle_status: ClaimLifecycleStatus,
  review_status: ClaimReviewStatus,
  superseded_by: z.string().uuid().optional().nullable(),
  created_by_actor_id: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type ClaimVersionSummary = z.infer<typeof ClaimVersionSummarySchema>

export const ClaimVersionLineageSchema = z.object({
  claim_id: z.string().uuid(),
  /** All versions of the claim, ordered by version ascending. */
  versions: z.array(ClaimVersionSummarySchema),
  /** ID of the current (non-superseded) version, if any. */
  current_version_id: z.string().uuid().optional().nullable(),
})
export type ClaimVersionLineage = z.infer<typeof ClaimVersionLineageSchema>
