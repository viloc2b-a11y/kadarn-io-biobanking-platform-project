// ─── KAD-SITE-PROFILE — Site Profile & Publication Types ────────────────
// Authority: KEMS Site Profile Production Spec
//
// Describes an institution's site profile — a structured, versioned
// declaration of institutional identity, capabilities, and attestations.
// Profiles are published through a review-and-attestation pipeline,
// producing immutable ProfileVersion snapshots and ProfileAttestation
// signatures. Completion metrics provide a roll-up of profile completeness.

import { z } from 'zod'

// ─── Enums ──────────────────────────────────────────────────────────────

/**
 * Profile state — the publication/review lifecycle of a site profile.
 *
 * States:
 *   - draft           — being authored, not yet submitted
 *   - review          — submitted for review
 *   - attested        — review passed, attestations collected
 *   - published       — publicly visible via ProfilePublication
 *   - superseded      — replaced by a newer version
 *   - archived        — administratively retired
 *   - rejected        — review failed, returned to draft
 */
export const ProfileState = z.enum([
  'draft',
  'review',
  'attested',
  'published',
  'superseded',
  'archived',
  'rejected',
])
export type ProfileState = z.infer<typeof ProfileState>

// ─── SiteProfile ────────────────────────────────────────────────────────

export const SiteProfileSchema = z.object({
  id: z.string().uuid(),

  // Owning institution
  organization_id: z.string().uuid(),

  // Identity
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  profile_type: z.string().optional().nullable(),

  // State & versioning
  state: ProfileState.default('draft'),
  current_version: z.number().int().min(1).default(1),

  // Structured content (flexible schema for site-specific fields)
  content: z.record(z.string(), z.unknown()).default({}),

  // Metadata
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),

  // Audit
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type SiteProfile = z.infer<typeof SiteProfileSchema>

// ─── SiteProfileVersion ─────────────────────────────────────────────────

/**
 * Immutable snapshot of a site profile at a given version.
 * Every publication creates a new version row; the current version
 * is tracked by SiteProfile.current_version.
 */
export const SiteProfileVersionSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  version: z.number().int().min(1),

  // Snapshot of profile fields at freeze time
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  profile_type: z.string().optional().nullable(),
  content: z.record(z.string(), z.unknown()).default({}),
  state: ProfileState,

  // Publication link — set when this version was published
  publication_id: z.string().uuid().optional().nullable(),

  // Changelog
  change_summary: z.string().optional().nullable(),

  // Audit
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type SiteProfileVersion = z.infer<typeof SiteProfileVersionSchema>

// ─── ProfileAttestation ─────────────────────────────────────────────────

/**
 * A signed attestation by a reviewer/approver on a specific profile version.
 * Each attestation represents one actor's approval of the version's content.
 */
export const ProfileAttestationSchema = z.object({
  id: z.string().uuid(),
  profile_version_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  organization_id: z.string().uuid(),

  // Who attested
  attester_id: z.string().uuid(),
  attester_role: z.string().optional().nullable(),

  // What they attested
  attestation_type: z.string().min(1),
  statement: z.string().optional().nullable(),

  // Verification metadata
  signature_ref: z.string().optional().nullable(),
  verified_by: z.string().uuid().optional().nullable(),

  // Audit
  attested_at: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true }),
})
export type ProfileAttestation = z.infer<typeof ProfileAttestationSchema>

// ─── ProfilePublication ─────────────────────────────────────────────────

/**
 * A publication event for a site profile version.
 * Links a version to its published state and tracks visibility.
 */
export const ProfilePublicationSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  profile_version_id: z.string().uuid(),
  organization_id: z.string().uuid(),

  // Publication metadata
  published_at: z.string().datetime({ offset: true }),
  published_by: z.string().uuid().optional().nullable(),
  visibility: z.enum(['private', 'restricted', 'public']).default('restricted'),

  // URI / external identifier
  public_uri: z.string().url().optional().nullable(),
  registry_id: z.string().optional().nullable(),

  // Audit
  created_at: z.string().datetime({ offset: true }),
})
export type ProfilePublication = z.infer<typeof ProfilePublicationSchema>

// ─── ProfileCompletionMetrics ───────────────────────────────────────────

/**
 * Roll-up metrics quantifying how complete a site profile is.
 * Computed from the profile's content completeness, attestation
 * coverage, and evidence backing.
 */
export const ProfileCompletionMetricsSchema = z.object({
  profile_id: z.string().uuid(),

  // Field-level completeness
  required_fields_completed: z.number().int().min(0),
  required_fields_total: z.number().int().min(0),
  optional_fields_completed: z.number().int().min(0),
  optional_fields_total: z.number().int().min(0),

  // Attestation coverage
  attestations_collected: z.number().int().min(0),
  attestations_required: z.number().int().min(0),

  // Evidence backing
  evidence_count: z.number().int().min(0),
  evidence_weighted_score: z.number().min(0).max(1).optional().nullable(),

  // Computed scores
  completeness_pct: z.number().min(0).max(100),
  attestation_pct: z.number().min(0).max(100),

  // When this snapshot was computed
  computed_at: z.string().datetime({ offset: true }),
})
export type ProfileCompletionMetrics = z.infer<typeof ProfileCompletionMetricsSchema>

// ─── Create / Update DTOs ───────────────────────────────────────────────

export const CreateSiteProfileSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  profile_type: z.string().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type CreateSiteProfile = z.infer<typeof CreateSiteProfileSchema>

export const UpdateSiteProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  profile_type: z.string().optional().nullable(),
  state: ProfileState.optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})
export type UpdateSiteProfile = z.infer<typeof UpdateSiteProfileSchema>
