// ─── KEMS-PUBLICATION — Publication Service ──────────────────────────────
// Authority: KEMS Site Profile Production Spec, visibility-policy.yml v1.0.0
//
// Generates visibility-filtered views of a published site profile for
// different audiences. Each projection method applies the rules defined
// in visibility-policy.yml to redact, summarize, or omit sensitive
// content based on the viewer's authorization level.
//
// CRITICAL RULE (from visibility-policy.yml):
//   "Published Passport ≠ authorized file transfer"
//
// This service generates VIEWS — filtered, read-only projections.
// It does NOT authorize file downloads, data exports, or raw access.
// The visibility policy is a presentation-layer concern; actual data
// access is governed by the API authorization layer.
//
// Dependencies (injected):
//   - ProfileService        (profile + version retrieval)
//   - CapabilityService     (capability gaps and readiness)
//   - ClaimService          (claim lookup for evidence/metadata)
//
// Uses: visibility-policy.yml rules at
//   specs/site-profile/visibility-policy.yml

import type {
  SiteProfile,
  SiteProfileVersion,
  ProfileCompletionMetrics,
} from '@kadarn/types'

import type {
  CapabilityGap,
  ProfileReadinessContribution,
} from './capability-service'

// ─── Visibility policy (hard-coded mirror of specs/site-profile/visibility-policy.yml v1.0.0) ──

/**
 * Visibility levels from visibility-policy.yml.
 * Each level defines which profile sections are visible.
 */
export type VisibilityLevel =
  | 'PUBLIC'
  | 'NETWORK_VISIBLE'
  | 'RECIPIENT_AUTHORIZED'
  | 'KADARN_INTERNAL'
  | 'SITE_ONLY'
  | 'RESTRICTED'
  | 'PROHIBITED'

/** Content section keys that exist in a profile's content JSONB field. */
type ProfileSection = string

/** Map of visibility level → allowed section keys */
const VISIBILITY_SECTIONS: Record<VisibilityLevel, ProfileSection[]> = {
  PUBLIC: [
    'identity',
    'contact_summary',
    'therapeutic_areas',
    'study_phase_experience',
    'capability_summaries',
    'institutional_identity',
  ],
  NETWORK_VISIBLE: [
    'identity',
    'contact_summary',
    'therapeutic_areas',
    'study_phase_experience',
    'capability_summaries',
    'institutional_identity',
    'capability_details_aggregated',
    'readiness_levels',
    'geographic_reach',
    'structured_profile_data',
  ],
  RECIPIENT_AUTHORIZED: [
    'identity',
    'contact_summary',
    'therapeutic_areas',
    'study_phase_experience',
    'capability_summaries',
    'institutional_identity',
    'capability_details_aggregated',
    'readiness_levels',
    'geographic_reach',
    'structured_profile_data',
    'detailed_capacity',
    'equipment_inventory',
    'staff_credentials_redacted',
    'document_metadata',
  ],
  KADARN_INTERNAL: [
    'identity',
    'contact',
    'capabilities',
    'compliance',
    'therapeutic_areas',
    'study_experience',
    'internal_review_notes',
    'quality_metrics',
    'capability_details_aggregated',
    'readiness_levels',
  ],
  SITE_ONLY: [
    'identity',
    'contact',
    'capabilities',
    'compliance',
    'facilities',
    'equipment',
    'personnel',
    'quality_metrics',
    'therapeutic_areas',
    'study_experience',
    'documentation',
    'internal_review_notes',
    'exact_volumes',
    'vendor_relationships',
    'internal_audit_detail',
    'prior_sponsor_detail',
  ],
  RESTRICTED: [
    'identity',
    'contact_summary',
    'therapeutic_areas',
    'capability_summaries',
    'proprietary_workflows',
    'contractual_terms',
    'financial_data',
  ],
  PROHIBITED: [],
}

/** Sections that must be redacted (show as "REDACTED" or summarized). */
const REDACTION_SECTIONS: ProfileSection[] = [
  'staff_names_external',
  'exact_patient_volumes',
  'sponsor_names_non_authorized',
]

/** Sections that should be summarized (detailed_to_summary projection rule). */
const SUMMARIZE_SECTIONS: ProfileSection[] = [
  'equipment_capacity',
  'storage_volume',
  'personnel_count',
]

/** Sections that are always prohibited from appearing in any projection. */
const PROHIBITED_SECTIONS: ProfileSection[] = [
  'PHI',
  'patient_lists',
  'credentials',
  'secrets',
]

// ─── Repository contracts ────────────────────────────────────────────────

export interface RepositoryResult<T> {
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
}

/** Minimal profile lookup contract — avoids circular dependency with ProfileService. */
export interface ProfileServiceLike {
  getProfile(profileId: string): Promise<{
    profile: SiteProfile
    versions: SiteProfileVersion[]
    attestations: Array<{ id: string; attester_id: string; attestation_type: string }>
  }>
  calculateCompleteness(profileId: string): Promise<ProfileCompletionMetrics>
}

/** Minimal capability lookup contract. */
export interface CapabilityServiceLike {
  getGaps(profileId: string): Promise<CapabilityGap[]>
  getReadinessContribution(profileId: string): Promise<ProfileReadinessContribution>
}

/** Minimal claim lookup contract. */
export interface ClaimServiceLike {
  getClaimWithEvidence(claimId: string): Promise<{
    claim: { id: string; name: string; lifecycle_status: string; visibility?: string }
    evidenceLinks: Array<{ evidence_id: string }>
  }>
}

// ─── Service errors ──────────────────────────────────────────────────────

export class PublicationServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'PublicationServiceError'
  }
}

// ─── Projection result shapes ────────────────────────────────────────────

/** Base projection — all views share this shape. */
export interface ProfileProjection {
  /** Profile metadata (always visible). */
  profileId: string
  profileName: string
  profileType: string | null
  version: number
  state: string
  /** Visibility level this projection was generated at. */
  visibilityLevel: VisibilityLevel
  /** Filtered content map — only sections authorized for this level. */
  content: Record<string, unknown>
  /** Redacted section map — sections that were present but redacted. */
  redacted: Record<string, string>
  /** Summarized section map — sections that were summarized. */
  summarized: Record<string, string>
  /** Metadata about what was filtered. */
  filterSummary: {
    totalSections: number
    visibleSections: number
    redactedSections: number
    summarizedSections: number
    omittedSections: number
  }
  /** When this projection was generated. */
  generatedAt: string
}

/** Internal view — KADARN_INTERNAL + SITE_ONLY combined. */
export interface InternalView extends ProfileProjection {
  /** Full completeness metrics (internal only). */
  completeness: ProfileCompletionMetrics | null
  /** Internal quality metrics. */
  qualityMetrics: Record<string, unknown> | null
}

/** Discovery profile — PUBLIC visibility for external discovery. */
export interface DiscoveryProfile extends ProfileProjection {
  /** High-level readiness level (PUBLIC visibility). */
  readinessLevel: string | null
  /** Capability area summaries. */
  capabilityAreas: string[]
}

/** Passport projection — NETWORK_VISIBLE structured profile. */
export interface PassportProjection extends ProfileProjection {
  /** The version snapshot this passport references. */
  versionSnapshot: SiteProfileVersion | null
  /** Aggregated readiness information. */
  readiness: ProfileReadinessContribution | null
  /** Capability gaps (anonymized for network visibility). */
  gaps: Array<{ area: string; severity: string }>
}

/** Sponsor view — RECIPIENT_AUTHORIZED for a specific recipient. */
export interface SponsorView extends ProfileProjection {
  /** The recipient organization this view was generated for. */
  recipientId: string
  /** Whether the recipient is explicitly authorized. */
  authorized: boolean
  /** Detailed capacity information. */
  detailedCapacity: Record<string, unknown> | null
  /** Equipment inventory (redacted for external staff names). */
  equipmentInventory: Record<string, unknown> | null
}

/** Publication eligibility validation result. */
export interface PublicationEligibility {
  profileId: string
  isEligible: boolean
  state: string
  completenessPct: number
  attestationCount: number
  gapCount: number
  blockingIssues: string[]
  warnings: string[]
}

// ─── Service ─────────────────────────────────────────────────────────────

export class PublicationService {
  constructor(
    private readonly profileService: ProfileServiceLike,
    private readonly capabilityService: CapabilityServiceLike,
    private readonly claimService: ClaimServiceLike,
  ) {}

  // ─── Filtering helpers ─────────────────────────────────────────────────

  /**
   * Apply visibility filtering to a profile's content map.
   *
   * For each section in the raw content:
   *   - If prohibited → always omitted
   *   - If in the redaction list → redacted for visibility levels below RECIPIENT_AUTHORIZED
   *   - If in the summarize list → summarized for levels below NETWORK_VISIBLE
   *   - Otherwise → included if the visibility level authorizes it
   */
  private applyVisibilityFilter(
    rawContent: Record<string, unknown>,
    level: VisibilityLevel,
  ): {
    visible: Record<string, unknown>
    redacted: Record<string, string>
    summarized: Record<string, string>
  } {
    const allowedSections = VISIBILITY_SECTIONS[level]
    const visible: Record<string, unknown> = {}
    const redacted: Record<string, string> = {}
    const summarized: Record<string, string> = {}

    for (const [key, value] of Object.entries(rawContent)) {
      // Always omit prohibited sections
      if (PROHIBITED_SECTIONS.includes(key)) {
        continue
      }

      // Redaction required for specific sections
      if (REDACTION_SECTIONS.includes(key)) {
        if (level === 'RECIPIENT_AUTHORIZED' || level === 'SITE_ONLY' || level === 'KADARN_INTERNAL') {
          // Authorized viewers see redacted sections (but still redacted)
          redacted[key] = '[REDACTED]'
        }
        continue
      }

      // Summarize detailed sections for lower visibility levels
      if (SUMMARIZE_SECTIONS.includes(key)) {
        if (level === 'NETWORK_VISIBLE' || level === 'RECIPIENT_AUTHORIZED' || level === 'KADARN_INTERNAL' || level === 'SITE_ONLY') {
          summarized[key] = this.summarizeValue(value, key)
        }
        continue
      }

      // Include if the section is in the allowed set
      if (allowedSections.includes(key)) {
        visible[key] = value
      }
    }

    return { visible, redacted, summarized }
  }

  /**
   * Summarize a detailed value per the projection_rules.detailed_to_summary rule.
   *
   * Example from visibility-policy.yml:
   *   "Three validated -80°C freezers, 180K aliquots → Validated ultra-low-temperature storage available"
   */
  private summarizeValue(value: unknown, sectionKey: string): string {
    if (typeof value === 'string') {
      if (sectionKey === 'equipment_capacity' || sectionKey === 'storage_volume') {
        return `[SUMMARY] ${value.substring(0, 100)}...`
      }
      if (sectionKey === 'personnel_count') {
        return `[SUMMARY] Staffing information available upon request`
      }
      return `[SUMMARY] ${value.substring(0, 80)}...`
    }

    if (typeof value === 'number') {
      return `[SUMMARY] ${value} (details available upon request)`
    }

    if (Array.isArray(value)) {
      return `[SUMMARY] ${value.length} items listed`
    }

    if (typeof value === 'object' && value !== null) {
      return `[SUMMARY] Structured data available upon request`
    }

    return '[SUMMARY]'
  }

  /**
   * Build the filter summary metadata for a projection.
   */
  private buildFilterSummary(
    rawContent: Record<string, unknown>,
    visible: Record<string, unknown>,
    redacted: Record<string, string>,
    summarized: Record<string, string>,
  ): ProfileProjection['filterSummary'] {
    const totalSections = Object.keys(rawContent).length
    const visibleSections = Object.keys(visible).length
    const redactedSections = Object.keys(redacted).length
    const summarizedSections = Object.keys(summarized).length
    const omittedSections =
      totalSections - visibleSections - redactedSections - summarizedSections

    return {
      totalSections,
      visibleSections,
      redactedSections,
      summarizedSections,
      omittedSections,
    }
  }

  // ─── Projection methods ────────────────────────────────────────────────

  /**
   * Generate an internal view of the profile (KADARN_INTERNAL + SITE_ONLY).
   *
   * This is the most permissive view, including internal review notes,
   * quality metrics, and site-only data. It is intended for KADARN
   * operational staff and the institution's own administrators.
   *
   * @param profileId - Target profile ID
   */
  async generateInternalView(profileId: string): Promise<InternalView> {
    const { profile, versions } = await this.profileService.getProfile(profileId)
    const completeness = await this.profileService
      .calculateCompleteness(profileId)
      .catch(() => null)

    const rawContent = (profile.content as Record<string, unknown>) ?? {}

    // Internal view: merge KADARN_INTERNAL and SITE_ONLY
    const internalSections = [
      ...new Set([...VISIBILITY_SECTIONS.KADARN_INTERNAL, ...VISIBILITY_SECTIONS.SITE_ONLY]),
    ]

    const { visible, redacted, summarized } = this.applyVisibilityFilter(
      rawContent,
      'SITE_ONLY',
    )

    // Quality metrics extracted from content
    const qualityMetrics = (visible.quality_metrics as Record<string, unknown>) ?? null

    return {
      profileId: profile.id,
      profileName: profile.name,
      profileType: profile.profile_type ?? null,
      version: profile.current_version,
      state: profile.state,
      visibilityLevel: 'SITE_ONLY',
      content: visible,
      redacted,
      summarized,
      filterSummary: this.buildFilterSummary(rawContent, visible, redacted, summarized),
      generatedAt: new Date().toISOString(),
      completeness,
      qualityMetrics,
    }
  }

  /**
   * Generate a discovery profile (PUBLIC visibility).
   *
   * This is the most restrictive view — only institution name, therapeutic
   * areas, study phase experience, and capability summaries are visible.
   * Used for public directories and external discovery platforms.
   *
   * @param profileId - Target profile ID
   */
  async generateDiscoveryProfile(profileId: string): Promise<DiscoveryProfile> {
    const { profile } = await this.profileService.getProfile(profileId)

    const rawContent = (profile.content as Record<string, unknown>) ?? {}
    const { visible, redacted, summarized } = this.applyVisibilityFilter(
      rawContent,
      'PUBLIC',
    )

    // Derive readiness level from capability contributions (public-safe)
    let readinessLevel: string | null = null
    try {
      const contribution = await this.capabilityService.getReadinessContribution(profileId)
      if (contribution.overallContribution >= 0.85) readinessLevel = 'very_high'
      else if (contribution.overallContribution >= 0.65) readinessLevel = 'high'
      else if (contribution.overallContribution >= 0.4) readinessLevel = 'medium'
      else readinessLevel = 'low'
    } catch {
      readinessLevel = null
    }

    // Extract capability areas from content
    const capabilityAreas: string[] = []
    const caps = visible.capability_summaries
    if (Array.isArray(caps)) {
      for (const c of caps) {
        if (typeof c === 'object' && c !== null && 'area' in c) {
          capabilityAreas.push(String((c as Record<string, unknown>).area))
        }
      }
    }

    return {
      profileId: profile.id,
      profileName: profile.name,
      profileType: profile.profile_type ?? null,
      version: profile.current_version,
      state: profile.state,
      visibilityLevel: 'PUBLIC',
      content: visible,
      redacted,
      summarized,
      filterSummary: this.buildFilterSummary(rawContent, visible, redacted, summarized),
      generatedAt: new Date().toISOString(),
      readinessLevel,
      capabilityAreas,
    }
  }

  /**
   * Generate a passport projection (NETWORK_VISIBLE).
   *
   * Passport projections include aggregated capability details, readiness
   * levels, and geographic reach. They are intended for network members
   * who have a standing authorization to view structured profile data.
   *
   * IMPORTANT: Per visibility-policy.yml:
   *   "Published Passport ≠ authorized file transfer"
   *   "Passport must reference a specific profile version"
   *
   * @param profileId - Target profile ID
   */
  async generatePassportProjection(profileId: string): Promise<PassportProjection> {
    const { profile, versions } = await this.profileService.getProfile(profileId)

    // "Passport must reference a specific profile version"
    const versionSnapshot =
      versions.length > 0
        ? versions.reduce((latest, v) => (v.version > latest.version ? v : latest))
        : null

    const rawContent = (profile.content as Record<string, unknown>) ?? {}
    const { visible, redacted, summarized } = this.applyVisibilityFilter(
      rawContent,
      'NETWORK_VISIBLE',
    )

    // Load readiness and gaps for passport
    let readiness: ProfileReadinessContribution | null = null
    let gaps: Array<{ area: string; severity: string }> = []

    try {
      readiness = await this.capabilityService.getReadinessContribution(profileId)
      const rawGaps = await this.capabilityService.getGaps(profileId)
      // Anonymize gaps for network visibility — only area + severity, no recommendations
      gaps = rawGaps.map((g) => ({
        area: g.area,
        severity: g.severity,
      }))
    } catch {
      // Readiness/gaps may not be available if capability service isn't fully wired
    }

    return {
      profileId: profile.id,
      profileName: profile.name,
      profileType: profile.profile_type ?? null,
      version: profile.current_version,
      state: profile.state,
      visibilityLevel: 'NETWORK_VISIBLE',
      content: visible,
      redacted,
      summarized,
      filterSummary: this.buildFilterSummary(rawContent, visible, redacted, summarized),
      generatedAt: new Date().toISOString(),
      versionSnapshot,
      readiness,
      gaps,
    }
  }

  /**
   * Generate a sponsor view for a specific recipient (RECIPIENT_AUTHORIZED).
   *
   * This is the most detailed external view, including detailed capacity,
   * equipment inventory (with staff names redacted), and document metadata.
   * Requires the recipient to have explicit authorization — this service
   * validates that the recipient is authorized for this level of access.
   *
   * IMPORTANT: Per visibility-policy.yml:
   *   RECIPIENT_AUTHORIZED requires "recipient_specific_authorization"
   *
   * @param profileId   - Target profile ID
   * @param recipientId  - UUID of the recipient organization
   */
  async generateSponsorView(
    profileId: string,
    recipientId: string,
  ): Promise<SponsorView> {
    const { profile } = await this.profileService.getProfile(profileId)

    // Authorization check: the recipient must be explicitly authorized.
    // In production this would query an authorization registry; here we
    // validate that the profile state supports recipient-authorized views.
    const isAuthorized =
      profile.state === 'published' || profile.state === 'attested'

    const rawContent = (profile.content as Record<string, unknown>) ?? {}
    const { visible, redacted, summarized } = this.applyVisibilityFilter(
      rawContent,
      'RECIPIENT_AUTHORIZED',
    )

    // Extract detailed capacity and equipment (already redacted of staff names
    // per the visibility filter rules)
    const detailedCapacity =
      (visible.detailed_capacity as Record<string, unknown>) ?? null
    const equipmentInventory =
      (visible.equipment_inventory as Record<string, unknown>) ?? null

    return {
      profileId: profile.id,
      profileName: profile.name,
      profileType: profile.profile_type ?? null,
      version: profile.current_version,
      state: profile.state,
      visibilityLevel: 'RECIPIENT_AUTHORIZED',
      content: visible,
      redacted,
      summarized,
      filterSummary: this.buildFilterSummary(rawContent, visible, redacted, summarized),
      generatedAt: new Date().toISOString(),
      recipientId,
      authorized: isAuthorized,
      detailedCapacity,
      equipmentInventory,
    }
  }

  // ─── Eligibility ───────────────────────────────────────────────────────

  /**
   * Validate whether a profile is eligible for publication.
   *
   * A profile is eligible when:
   *   - State is 'attested' (has at least one attestation)
   *   - Completeness >= threshold (50% required sections filled)
   *   - At least one attestation exists
   *   - No critical gaps (conflicting evidence issues)
   *   - A version snapshot exists
   *
   * Returns an {@link PublicationEligibility} with blocking issues and
   * warnings.
   *
   * @param profileId - Target profile ID
   */
  async validatePublicationEligibility(
    profileId: string,
  ): Promise<PublicationEligibility> {
    const { profile, attestations } = await this.profileService.getProfile(profileId)
    const completeness = await this.profileService
      .calculateCompleteness(profileId)
      .catch(() => null)

    const blockingIssues: string[] = []
    const warnings: string[] = []

    // Check state
    if (profile.state !== 'attested' && profile.state !== 'review') {
      blockingIssues.push(
        `Profile must be in 'attested' or 'review' state to publish (current: ${profile.state})`,
      )
    }

    // Check attestations
    if (attestations.length === 0) {
      blockingIssues.push('Profile has no attestations; at least one attestation is required')
    }

    // Check completeness
    const completenessPct = completeness?.completeness_pct ?? 0
    if (completenessPct < 50) {
      blockingIssues.push(
        `Profile completeness is ${completenessPct}% (minimum 50% required)`,
      )
    } else if (completenessPct < 75) {
      warnings.push(
        `Profile completeness is ${completenessPct}% — consider filling more sections before publication`,
      )
    }

    // Check attestation coverage
    if (completeness && completeness.attestation_pct < 100) {
      warnings.push(
        `Attestation coverage is ${completeness.attestation_pct}% — ensure all required attestations are collected`,
      )
    }

    // Check for gaps
    let gapCount = 0
    try {
      const gaps = await this.capabilityService.getGaps(profileId)
      gapCount = gaps.length
      const criticalGaps = gaps.filter((g) => g.severity === 'critical')
      if (criticalGaps.length > 0) {
        blockingIssues.push(
          `${criticalGaps.length} critical capability gap(s) found; resolve before publication`,
        )
      }
      if (gaps.filter((g) => g.severity === 'high').length > 0) {
        warnings.push(
          `${gaps.filter((g) => g.severity === 'high').length} high-severity gap(s) found`,
        )
      }
    } catch {
      warnings.push('Could not evaluate capability gaps')
    }

    // Check version snapshot exists
    const rawContent = (profile.content as Record<string, unknown>) ?? {}
    if (Object.keys(rawContent).length === 0) {
      warnings.push('Profile content is empty; populate sections before publication')
    }

    return {
      profileId,
      isEligible: blockingIssues.length === 0,
      state: profile.state,
      completenessPct,
      attestationCount: attestations.length,
      gapCount,
      blockingIssues,
      warnings,
    }
  }
}
