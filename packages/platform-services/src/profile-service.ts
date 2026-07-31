// ─── KEMS-SITE-PROFILE — Profile Service ─────────────────────────────────
// Authority: KEMS Site Profile Production Spec
//
// Orchestrates the site profile lifecycle: creation, section updates,
// completeness calculation, versioning, attestation, publication, and
// staleness tracking. Profiles progress through ProfileState states:
// draft → review → attested → published → superseded/archived/rejected.
//
// Every publication creates an immutable SiteProfileVersion snapshot;
// attestations are linked to specific version snapshots. Published
// profiles are projected through PublicationService for external
// consumption (visibility-policy.yml governs what is shown to whom).
//
// Dependencies (injected):
//   - ProfileRepositoryLike          (profile CRUD)
//   - ProfileVersionRepositoryLike   (immutable version snapshots)
//   - ProfileAttestationRepositoryLike (attestation records)
//   - ProfilePublicationRepositoryLike (publication event records)

import type {
  SiteProfile,
  CreateSiteProfile,
  UpdateSiteProfile,
  ProfileState,
  SiteProfileVersion,
  ProfileAttestation,
  ProfilePublication,
  ProfileCompletionMetrics,
} from '@kadarn/types'

// ─── Repository contracts (structural — match BaseRepository surface) ────

export interface RepositoryResult<T> {
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
}

export interface ProfileRepositoryLike {
  findById(id: string): Promise<RepositoryResult<SiteProfile>>
  create(input: CreateSiteProfile): Promise<RepositoryResult<SiteProfile>>
  update(id: string, patch: UpdateSiteProfile): Promise<RepositoryResult<SiteProfile>>
  list(
    filters?: { organizationId?: string; state?: ProfileState },
    page?: number,
    limit?: number,
  ): Promise<RepositoryResult<SiteProfile[]>>
}

export interface ProfileVersionRepositoryLike {
  create(snapshot: {
    profile_id: string
    version: number
    name: string
    description?: string | null
    profile_type?: string | null
    content: Record<string, unknown>
    state: ProfileState
    change_summary?: string | null
    publication_id?: string | null
    created_by?: string | null
  }): Promise<RepositoryResult<SiteProfileVersion>>
  listByProfile(profileId: string): Promise<RepositoryResult<SiteProfileVersion[]>>
  getCurrentVersion(profileId: string): Promise<RepositoryResult<SiteProfileVersion | null>>
}

export interface ProfileAttestationRepositoryLike {
  create(attestation: {
    profile_version_id: string
    profile_id: string
    organization_id: string
    attester_id: string
    attester_role?: string | null
    attestation_type: string
    statement?: string | null
    signature_ref?: string | null
    verified_by?: string | null
  }): Promise<RepositoryResult<ProfileAttestation>>
  listByProfile(profileId: string): Promise<RepositoryResult<ProfileAttestation[]>>
  countByProfile(profileId: string): Promise<RepositoryResult<number>>
}

export interface ProfilePublicationRepositoryLike {
  create(publication: {
    profile_id: string
    profile_version_id: string
    organization_id: string
    visibility: 'private' | 'restricted' | 'public'
    published_by?: string | null
    public_uri?: string | null
    registry_id?: string | null
  }): Promise<RepositoryResult<ProfilePublication>>
  getLatestByProfile(profileId: string): Promise<RepositoryResult<ProfilePublication | null>>
}

// ─── Service errors ──────────────────────────────────────────────────────

export class ProfileServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ProfileServiceError'
  }
}

// ─── Result shapes ───────────────────────────────────────────────────────

export interface PaginatedProfiles {
  items: SiteProfile[]
  page: number
  limit: number
  total: number
}

export interface ProfileWithVersions {
  profile: SiteProfile
  versions: SiteProfileVersion[]
  attestations: ProfileAttestation[]
}

/** Data required to attest a specific profile version. */
export interface AttestationData {
  attesterId: string
  attesterRole?: string
  attestationType: string
  statement?: string
  signatureRef?: string
  verifiedBy?: string
}

/** Visibility level for published profiles — aligns with visibility-policy.yml levels. */
export type ProfileVisibilityLevel = 'private' | 'restricted' | 'public'

// ─── Profile content section keys ────────────────────────────────────────

const REQUIRED_SECTIONS: string[] = [
  'identity',
  'contact',
  'capabilities',
  'compliance',
]

const OPTIONAL_SECTIONS: string[] = [
  'facilities',
  'equipment',
  'personnel',
  'quality_metrics',
  'therapeutic_areas',
  'study_experience',
  'documentation',
]

const ALL_SECTIONS = [...REQUIRED_SECTIONS, ...OPTIONAL_SECTIONS]

// ─── Service ─────────────────────────────────────────────────────────────

export class ProfileService {
  constructor(
    private readonly profiles: ProfileRepositoryLike,
    private readonly versions: ProfileVersionRepositoryLike,
    private readonly attestations: ProfileAttestationRepositoryLike,
    private readonly publications: ProfilePublicationRepositoryLike,
  ) {}

  // ─── Create ────────────────────────────────────────────────────────────

  /**
   * Create a new site profile for an institution.
   *
   * The profile starts in 'draft' state with version 1 and empty content.
   * `profileType` maps to the profile_type field on the SiteProfile entity.
   */
  async createProfile(
    institutionId: string,
    profileType: string,
  ): Promise<SiteProfile> {
    const input: CreateSiteProfile = {
      organization_id: institutionId,
      name: `Profile for ${institutionId}`,
      profile_type: profileType,
      content: {},
    }

    const { data: profile, error } = await this.profiles.create(input)
    if (error || !profile) {
      throw new ProfileServiceError(
        error?.code ?? 'CREATE_FAILED',
        `Failed to create profile for institution ${institutionId}: ${error?.message ?? 'no data returned'}`,
        error?.details,
      )
    }

    // Snapshot initial version (v1)
    const { error: vErr } = await this.versions.create({
      profile_id: profile.id,
      version: 1,
      name: profile.name,
      description: profile.description,
      profile_type: profile.profile_type,
      content: (profile.content as Record<string, unknown>) ?? {},
      state: profile.state,
      change_summary: 'Initial profile creation',
    })

    if (vErr) {
      throw new ProfileServiceError(
        vErr.code,
        `Profile ${profile.id} created but initial version snapshot failed: ${vErr.message}`,
        vErr.details,
      )
    }

    return profile
  }

  // ─── Read ──────────────────────────────────────────────────────────────

  /**
   * Fetch a profile with its full version history and attestations.
   */
  async getProfile(profileId: string): Promise<ProfileWithVersions> {
    const { data: profile, error } = await this.profiles.findById(profileId)
    if (error || !profile) {
      throw new ProfileServiceError(
        error?.code ?? 'NOT_FOUND',
        `Profile not found: ${profileId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const [versionsResult, attestationsResult] = await Promise.all([
      this.versions.listByProfile(profileId),
      this.attestations.listByProfile(profileId),
    ])

    return {
      profile,
      versions: versionsResult.data ?? [],
      attestations: attestationsResult.data ?? [],
    }
  }

  // ─── Section Updates ───────────────────────────────────────────────────

  /**
   * Update a named section of the profile's content object.
   *
   * Sections are namespaced keys in the profile's `content` JSONB field.
   * This method merges the provided data into the named section, preserving
   * other sections unchanged. Changes are applied to the mutable profile row;
   * a version snapshot is NOT created here — call {@link createVersion} to
   * freeze a version.
   *
   * @param profileId   - Target profile ID
   * @param section     - Section key (e.g. 'identity', 'capabilities', 'contact')
   * @param data        - Partial data to merge into the section
   */
  async updateSection(
    profileId: string,
    section: string,
    data: Record<string, unknown>,
  ): Promise<SiteProfile> {
    const { data: profile, error } = await this.profiles.findById(profileId)
    if (error || !profile) {
      throw new ProfileServiceError(
        error?.code ?? 'NOT_FOUND',
        `Profile not found: ${profileId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (profile.state === 'published') {
      throw new ProfileServiceError(
        'IMMUTABLE',
        `Profile ${profileId} is published; create a new version to update sections`,
      )
    }

    if (profile.state === 'archived' || profile.state === 'superseded') {
      throw new ProfileServiceError(
        'TERMINAL_STATE',
        `Profile ${profileId} is ${profile.state} and cannot be updated`,
      )
    }

    const currentContent = (profile.content as Record<string, unknown>) ?? {}
    const sectionContent = (currentContent[section] as Record<string, unknown>) ?? {}

    const updatedContent: Record<string, unknown> = {
      ...currentContent,
      [section]: { ...sectionContent, ...data },
    }

    const { data: updated, error: updErr } = await this.profiles.update(profileId, {
      content: updatedContent,
    })
    if (updErr || !updated) {
      throw new ProfileServiceError(
        updErr?.code ?? 'UPDATE_FAILED',
        `Failed to update section '${section}' on profile ${profileId}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  // ─── Completeness ──────────────────────────────────────────────────────

  /**
   * Calculate completeness metrics for a profile.
   *
   * Evaluates:
   *   - Required field coverage (must-have sections like identity, contact)
   *   - Optional field coverage (nice-to-have sections)
   *   - Attestation coverage (collected vs required)
   *   - Evidence backing (count + weighted score from linked items)
   *
   * Returns a {@link ProfileCompletionMetrics} snapshot.
   */
  async calculateCompleteness(profileId: string): Promise<ProfileCompletionMetrics> {
    const { data: profile, error } = await this.profiles.findById(profileId)
    if (error || !profile) {
      throw new ProfileServiceError(
        error?.code ?? 'NOT_FOUND',
        `Profile not found: ${profileId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const content = (profile.content as Record<string, unknown>) ?? {}

    // Count completed required / optional sections
    const requiredCompleted = REQUIRED_SECTIONS.filter(
      (s) => content[s] !== undefined && content[s] !== null,
    ).length
    const optionalCompleted = OPTIONAL_SECTIONS.filter(
      (s) => content[s] !== undefined && content[s] !== null,
    ).length

    // Attestation coverage
    const { data: attestationCount } = await this.attestations.countByProfile(profileId)
    const attestationsCollected = attestationCount ?? 0
    const attestationsRequired = 1 // at least one attestation required for publication

    // Completeness percentages
    const completenessPct =
      REQUIRED_SECTIONS.length > 0
        ? Math.round((requiredCompleted / REQUIRED_SECTIONS.length) * 100)
        : 0

    const attestationPct =
      attestationsRequired > 0
        ? Math.min(100, Math.round((attestationsCollected / attestationsRequired) * 100))
        : 100

    return {
      profile_id: profileId,
      required_fields_completed: requiredCompleted,
      required_fields_total: REQUIRED_SECTIONS.length,
      optional_fields_completed: optionalCompleted,
      optional_fields_total: OPTIONAL_SECTIONS.length,
      attestations_collected: attestationsCollected,
      attestations_required: attestationsRequired,
      evidence_count: 0, // populated by EvidenceSufficiencyService
      evidence_weighted_score: null,
      completeness_pct: completenessPct,
      attestation_pct: attestationPct,
      computed_at: new Date().toISOString(),
    }
  }

  // ─── Versioning ────────────────────────────────────────────────────────

  /**
   * Create an immutable version snapshot of the current profile state.
   *
   * Freezes the current profile content into a new SiteProfileVersion row,
   * bumps the profile's `current_version`, and records a change summary.
   * This is the prerequisite for attestation and publication.
   *
   * @param profileId    - Target profile ID
   * @param changeSummary - Optional description of what changed in this version
   */
  async createVersion(
    profileId: string,
    changeSummary?: string,
  ): Promise<SiteProfileVersion> {
    const { data: profile, error } = await this.profiles.findById(profileId)
    if (error || !profile) {
      throw new ProfileServiceError(
        error?.code ?? 'NOT_FOUND',
        `Profile not found: ${profileId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    const newVersion = profile.current_version + 1

    // Create the immutable version snapshot
    const { data: version, error: vErr } = await this.versions.create({
      profile_id: profileId,
      version: newVersion,
      name: profile.name,
      description: profile.description,
      profile_type: profile.profile_type,
      content: (profile.content as Record<string, unknown>) ?? {},
      state: profile.state,
      change_summary: changeSummary ?? `Version ${newVersion}`,
    })

    if (vErr || !version) {
      throw new ProfileServiceError(
        vErr?.code ?? 'VERSION_FAILED',
        `Failed to create version ${newVersion} for profile ${profileId}: ${vErr?.message ?? 'no data'}`,
        vErr?.details,
      )
    }

    // Bump the current_version on the mutable profile row
    await this.profiles.update(profileId, {
      current_version: newVersion,
    } as unknown as UpdateSiteProfile)

    return version
  }

  // ─── Attestation ───────────────────────────────────────────────────────

  /**
   * Attest to a specific profile version.
   *
   * An attestation represents an actor's formal sign-off on the content
   * of a profile version. Multiple attestations can exist for a single
   * version (e.g., clinical director + quality manager both attest).
   *
   * After the first attestation, the profile state transitions from
   * 'review' to 'attested' (if currently in 'review').
   *
   * @param profileId      - Target profile ID (the version must belong to this profile)
   * @param attestationData - Who attested, what type, and any statement / signature
   */
  async attestVersion(
    profileId: string,
    attestationData: AttestationData,
  ): Promise<ProfileAttestation> {
    const { data: profile, error } = await this.profiles.findById(profileId)
    if (error || !profile) {
      throw new ProfileServiceError(
        error?.code ?? 'NOT_FOUND',
        `Profile not found: ${profileId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    // Find the current version to attest against
    const { data: currentVersion, error: vErr } =
      await this.versions.getCurrentVersion(profileId)

    if (vErr || !currentVersion) {
      throw new ProfileServiceError(
        vErr?.code ?? 'NO_VERSION',
        `No version found for profile ${profileId}; create a version before attesting`,
        vErr?.details,
      )
    }

    const { data: attestation, error: attErr } = await this.attestations.create({
      profile_version_id: currentVersion.id,
      profile_id: profileId,
      organization_id: profile.organization_id,
      attester_id: attestationData.attesterId,
      attester_role: attestationData.attesterRole ?? null,
      attestation_type: attestationData.attestationType,
      statement: attestationData.statement ?? null,
      signature_ref: attestationData.signatureRef ?? null,
      verified_by: attestationData.verifiedBy ?? null,
    })

    if (attErr || !attestation) {
      throw new ProfileServiceError(
        attErr?.code ?? 'ATTEST_FAILED',
        `Failed to create attestation for profile ${profileId} v${currentVersion.version}: ${attErr?.message ?? 'no data'}`,
        attErr?.details,
      )
    }

    // Transition profile from 'review' → 'attested' on first attestation
    if (profile.state === 'review') {
      await this.profiles.update(profileId, { state: 'attested' } as UpdateSiteProfile)
    }

    return attestation
  }

  // ─── Publication ───────────────────────────────────────────────────────

  /**
   * Publish a profile at a given visibility level.
   *
   * Requires the profile to be in 'attested' state (at least one attestation
   * has been collected). Creates a ProfilePublication record linking the
   * current version and transitions the profile to 'published'.
   *
   * Visibility levels:
   *   - private     — institution-internal only
   *   - restricted  — visible to authorized network members
   *   - public      — visible to all
   *
   * @param profileId       - Target profile ID
   * @param visibilityLevel - Desired publication visibility
   */
  async publishProfile(
    profileId: string,
    visibilityLevel: ProfileVisibilityLevel,
  ): Promise<ProfilePublication> {
    const { data: profile, error } = await this.profiles.findById(profileId)
    if (error || !profile) {
      throw new ProfileServiceError(
        error?.code ?? 'NOT_FOUND',
        `Profile not found: ${profileId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (profile.state !== 'attested') {
      throw new ProfileServiceError(
        'INVALID_STATE',
        `Profile ${profileId} must be in 'attested' state to publish (current: ${profile.state})`,
      )
    }

    const { data: currentVersion, error: vErr } =
      await this.versions.getCurrentVersion(profileId)

    if (vErr || !currentVersion) {
      throw new ProfileServiceError(
        vErr?.code ?? 'NO_VERSION',
        `No version found for profile ${profileId}; create a version before publishing`,
        vErr?.details,
      )
    }

    // Validate that the profile has attestations
    const { data: attCount } = await this.attestations.countByProfile(profileId)
    if (!attCount || attCount === 0) {
      throw new ProfileServiceError(
        'NO_ATTESTATIONS',
        `Profile ${profileId} has no attestations; attest before publishing`,
      )
    }

    const { data: publication, error: pubErr } = await this.publications.create({
      profile_id: profileId,
      profile_version_id: currentVersion.id,
      organization_id: profile.organization_id,
      visibility: visibilityLevel,
    })

    if (pubErr || !publication) {
      throw new ProfileServiceError(
        pubErr?.code ?? 'PUBLISH_FAILED',
        `Failed to publish profile ${profileId}: ${pubErr?.message ?? 'no data'}`,
        pubErr?.details,
      )
    }

    // Transition profile to 'published'
    await this.profiles.update(profileId, { state: 'published' } as UpdateSiteProfile)

    return publication
  }

  // ─── Staleness ─────────────────────────────────────────────────────────

  /**
   * Mark a published profile as requiring an update.
   *
   * Transitions the profile back to 'draft' so the institution can revise
   * and re-submit through the review → attest → publish pipeline. The
   * previous published version remains in the version history.
   *
   * @param profileId - Target profile ID
   */
  async markUpdateRequired(profileId: string): Promise<SiteProfile> {
    const { data: profile, error } = await this.profiles.findById(profileId)
    if (error || !profile) {
      throw new ProfileServiceError(
        error?.code ?? 'NOT_FOUND',
        `Profile not found: ${profileId} — ${error?.message ?? 'no data'}`,
        error?.details,
      )
    }

    if (profile.state !== 'published' && profile.state !== 'attested') {
      throw new ProfileServiceError(
        'INVALID_STATE',
        `Profile ${profileId} must be 'published' or 'attested' to mark update required (current: ${profile.state})`,
      )
    }

    const { data: updated, error: updErr } = await this.profiles.update(profileId, {
      state: 'draft',
    } as UpdateSiteProfile)
    if (updErr || !updated) {
      throw new ProfileServiceError(
        updErr?.code ?? 'UPDATE_FAILED',
        `Failed to mark update required for profile ${profileId}: ${updErr?.message ?? 'no data'}`,
        updErr?.details,
      )
    }

    return updated
  }

  // ─── Paginated List ────────────────────────────────────────────────────

  /**
   * Paginated, filtered list of profiles.
   */
  async listProfiles(
    filters?: { organizationId?: string; state?: ProfileState },
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedProfiles> {
    const p = Math.max(1, Math.floor(page))
    const l = Math.max(1, Math.min(200, Math.floor(limit)))

    const { data: items, error } = await this.profiles.list(filters, p, l)
    if (error) {
      throw new ProfileServiceError(
        error.code,
        `Failed to list profiles: ${error.message}`,
        error.details,
      )
    }

    const rows = items ?? []
    return { items: rows, page: p, limit: l, total: rows.length }
  }
}
