// ─── KEMS-SITE-PROFILE — Profile Service Unit Tests ────────────────────
// Authority: KEMS Site Profile Production Spec
//
// Tests the ProfileService class with mock repositories.
// Covers: createProfile, getProfile, calculateCompleteness, attestVersion,
// publishProfile, updateSection, markUpdateRequired, and state transitions
// (draft → review → attested → published).

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ProfileService,
  ProfileServiceError,
} from '../profile-service'
import type {
  ProfileRepositoryLike,
  ProfileVersionRepositoryLike,
  ProfileAttestationRepositoryLike,
  ProfilePublicationRepositoryLike,
  RepositoryResult,
  AttestationData,
} from '../profile-service'

// ─── Test IDs ───────────────────────────────────────────────────────────

const ID = {
  profile: '550e8400-e29b-41d4-a716-446655440100',
  org: '550e8400-e29b-41d4-a716-446655440200',
  version: '550e8400-e29b-41d4-a716-446655440300',
  attestation: '550e8400-e29b-41d4-a716-446655440400',
  publication: '550e8400-e29b-41d4-a716-446655440500',
  attester: '550e8400-e29b-41d4-a716-446655440600',
} as const

const NOW = '2026-07-30T14:00:00.000Z'

// ─── Mock factories ─────────────────────────────────────────────────────

function success<T>(data: T): RepositoryResult<T> {
  return { data, error: null }
}

function notFound(code = 'NOT_FOUND'): RepositoryResult<null> {
  return { data: null, error: { code, message: 'Not found' } }
}

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.profile,
    organization_id: ID.org,
    name: 'Test Profile',
    description: null,
    profile_type: 'clinical_site',
    state: 'draft' as const,
    current_version: 1,
    content: {},
    tags: [],
    metadata: null,
    created_by: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

function makeVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.version,
    profile_id: ID.profile,
    version: 1,
    name: 'Test Profile',
    description: null,
    profile_type: 'clinical_site',
    content: {},
    state: 'draft' as const,
    publication_id: null,
    change_summary: 'Initial profile creation',
    created_by: null,
    created_at: NOW,
    ...overrides,
  }
}

function makeAttestation(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.attestation,
    profile_version_id: ID.version,
    profile_id: ID.profile,
    organization_id: ID.org,
    attester_id: ID.attester,
    attester_role: 'quality_manager',
    attestation_type: 'full_attestation',
    statement: 'I attest the content is accurate.',
    signature_ref: null,
    verified_by: null,
    attested_at: NOW,
    created_at: NOW,
    ...overrides,
  }
}

function makePublication(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.publication,
    profile_id: ID.profile,
    profile_version_id: ID.version,
    organization_id: ID.org,
    published_at: NOW,
    published_by: null,
    visibility: 'private' as const,
    public_uri: null,
    registry_id: null,
    created_at: NOW,
    ...overrides,
  }
}

// ─── Mock repositories ──────────────────────────────────────────────────

function createMockRepos() {
  const profiles = {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
  } as unknown as ProfileRepositoryLike & {
    findById: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    list: ReturnType<typeof vi.fn>
  }

  const versions = {
    create: vi.fn(),
    listByProfile: vi.fn(),
    getCurrentVersion: vi.fn(),
  } as unknown as ProfileVersionRepositoryLike & {
    create: ReturnType<typeof vi.fn>
    listByProfile: ReturnType<typeof vi.fn>
    getCurrentVersion: ReturnType<typeof vi.fn>
  }

  const attestations = {
    create: vi.fn(),
    listByProfile: vi.fn(),
    countByProfile: vi.fn(),
  } as unknown as ProfileAttestationRepositoryLike & {
    create: ReturnType<typeof vi.fn>
    listByProfile: ReturnType<typeof vi.fn>
    countByProfile: ReturnType<typeof vi.fn>
  }

  const publications = {
    create: vi.fn(),
    getLatestByProfile: vi.fn(),
  } as unknown as ProfilePublicationRepositoryLike & {
    create: ReturnType<typeof vi.fn>
    getLatestByProfile: ReturnType<typeof vi.fn>
  }

  return { profiles, versions, attestations, publications }
}

function createService(repos = createMockRepos()) {
  return new ProfileService(
    repos.profiles,
    repos.versions,
    repos.attestations,
    repos.publications,
  )
}

// ─── Test suites ────────────────────────────────────────────────────────

describe('ProfileService', () => {
  let repos: ReturnType<typeof createMockRepos>
  let service: ProfileService

  beforeEach(() => {
    repos = createMockRepos()
    service = createService(repos)
  })

  // ═══════════════════════════════════════════════════════════════════════
  // createProfile
  // ═══════════════════════════════════════════════════════════════════════
  describe('createProfile', () => {
    it('creates a profile in draft state and snapshots v1', async () => {
      const profile = makeProfile()
      const version = makeVersion()

      repos.profiles.create.mockResolvedValue(success(profile))
      repos.versions.create.mockResolvedValue(success(version))

      const result = await service.createProfile(ID.org, 'clinical_site')

      expect(result).toEqual(profile)
      expect(repos.profiles.create).toHaveBeenCalledTimes(1)
      expect(repos.versions.create).toHaveBeenCalledTimes(1)

      // Verify the version snapshot
      const vCall = repos.versions.create.mock.calls[0][0]
      expect(vCall.profile_id).toBe(ID.profile)
      expect(vCall.version).toBe(1)
      expect(vCall.state).toBe('draft')
      expect(vCall.change_summary).toBe('Initial profile creation')
    })

    it('throws ProfileServiceError when profile creation fails', async () => {
      repos.profiles.create.mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'database offline' },
      })

      await expect(
        service.createProfile(ID.org, 'clinical_site'),
      ).rejects.toThrow(ProfileServiceError)

      await expect(
        service.createProfile(ID.org, 'clinical_site'),
      ).rejects.toMatchObject({ code: 'DB_ERROR' })
    })

    it('throws when version snapshot fails after profile creation', async () => {
      const profile = makeProfile()
      repos.profiles.create.mockResolvedValue(success(profile))
      repos.versions.create.mockResolvedValue({
        data: null,
        error: { code: 'VERSION_FAILED', message: 'snapshot write failed' },
      })

      await expect(
        service.createProfile(ID.org, 'clinical_site'),
      ).rejects.toMatchObject({ code: 'VERSION_FAILED' })
    })

    it('starts with empty content object', async () => {
      const profile = makeProfile({ content: {} })
      const version = makeVersion()
      repos.profiles.create.mockResolvedValue(success(profile))
      repos.versions.create.mockResolvedValue(success(version))

      await service.createProfile(ID.org, 'clinical_site')

      const createCall = repos.profiles.create.mock.calls[0][0]
      expect(createCall.content).toEqual({})
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // getProfile
  // ═══════════════════════════════════════════════════════════════════════
  describe('getProfile', () => {
    it('returns profile with versions and attestations', async () => {
      const profile = makeProfile()
      const version = makeVersion()
      const attestation = makeAttestation()

      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.listByProfile.mockResolvedValue(success([version]))
      repos.attestations.listByProfile.mockResolvedValue(success([attestation]))

      const result = await service.getProfile(ID.profile)

      expect(result.profile).toEqual(profile)
      expect(result.versions).toHaveLength(1)
      expect(result.attestations).toHaveLength(1)
    })

    it('throws when profile not found', async () => {
      repos.profiles.findById.mockResolvedValue(notFound())

      await expect(service.getProfile(ID.profile)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('handles empty versions and attestations gracefully', async () => {
      const profile = makeProfile()
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.listByProfile.mockResolvedValue({ data: null, error: null })
      repos.attestations.listByProfile.mockResolvedValue({ data: null, error: null })

      const result = await service.getProfile(ID.profile)

      expect(result.versions).toEqual([])
      expect(result.attestations).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // calculateCompleteness
  // ═══════════════════════════════════════════════════════════════════════
  describe('calculateCompleteness', () => {
    it('returns 0% when content is empty', async () => {
      const profile = makeProfile({ content: {} })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.attestations.countByProfile.mockResolvedValue(success(0))

      const metrics = await service.calculateCompleteness(ID.profile)

      expect(metrics.completeness_pct).toBe(0)
      expect(metrics.required_fields_completed).toBe(0)
      expect(metrics.attestations_collected).toBe(0)
    })

    it('returns 100% when all required sections are filled', async () => {
      const profile = makeProfile({
        content: {
          identity: { name: 'Site A' },
          contact: { email: 'a@test.com' },
          capabilities: { areas: ['clinical'] },
          compliance: { gcp: true },
        },
      })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.attestations.countByProfile.mockResolvedValue(success(1))

      const metrics = await service.calculateCompleteness(ID.profile)

      expect(metrics.completeness_pct).toBe(100)
      expect(metrics.required_fields_completed).toBe(4)
      expect(metrics.required_fields_total).toBe(4)
      expect(metrics.attestation_pct).toBe(100)
    })

    it('returns partial completeness for partially filled sections', async () => {
      const profile = makeProfile({
        content: {
          identity: { name: 'Site A' },
          // contact missing
          capabilities: { areas: ['clinical'] },
          // compliance missing
        },
      })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.attestations.countByProfile.mockResolvedValue(success(0))

      const metrics = await service.calculateCompleteness(ID.profile)

      expect(metrics.completeness_pct).toBe(50)
      expect(metrics.required_fields_completed).toBe(2)
      expect(metrics.attestation_pct).toBe(0)
    })

    it('includes optional sections count', async () => {
      const profile = makeProfile({
        content: { identity: { name: 'Site A' }, contact: { email: 'a@test.com' }, capabilities: { areas: ['clinical'] }, compliance: { gcp: true }, facilities: { building: 'A' }, equipment: { mri: true } },
      })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.attestations.countByProfile.mockResolvedValue(success(1))

      const metrics = await service.calculateCompleteness(ID.profile)

      expect(metrics.optional_fields_completed).toBe(2)
      expect(metrics.optional_fields_total).toBe(7)
    })

    it('throws when profile not found', async () => {
      repos.profiles.findById.mockResolvedValue(notFound())

      await expect(
        service.calculateCompleteness(ID.profile),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // attestVersion
  // ═══════════════════════════════════════════════════════════════════════
  describe('attestVersion', () => {
    const attestData: AttestationData = {
      attesterId: ID.attester,
      attesterRole: 'quality_manager',
      attestationType: 'full_attestation',
      statement: 'I attest the content is accurate.',
    }

    it('creates an attestation and transitions review → attested', async () => {
      const profile = makeProfile({ state: 'review' })
      const version = makeVersion({ version: 2, state: 'review' })
      const attestation = makeAttestation()

      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(success(version))
      repos.attestations.create.mockResolvedValue(success(attestation))
      repos.profiles.update.mockResolvedValue(
        success(makeProfile({ state: 'attested' })),
      )

      const result = await service.attestVersion(ID.profile, attestData)

      expect(result).toEqual(attestation)
      expect(repos.attestations.create).toHaveBeenCalledTimes(1)

      // Should have transitioned state
      expect(repos.profiles.update).toHaveBeenCalledWith(ID.profile, {
        state: 'attested',
      })
    })

    it('does not transition if already attested', async () => {
      const profile = makeProfile({ state: 'attested' })
      const version = makeVersion({ version: 2, state: 'attested' })
      const attestation = makeAttestation()

      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(success(version))
      repos.attestations.create.mockResolvedValue(success(attestation))

      await service.attestVersion(ID.profile, attestData)

      // Should NOT call update since already attested
      expect(repos.profiles.update).not.toHaveBeenCalled()
    })

    it('throws when no version exists', async () => {
      const profile = makeProfile({ state: 'review' })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(notFound('NO_VERSION'))

      await expect(
        service.attestVersion(ID.profile, attestData),
      ).rejects.toMatchObject({ code: 'NO_VERSION' })
    })

    it('throws when attestation creation fails', async () => {
      const profile = makeProfile({ state: 'review' })
      const version = makeVersion()
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(success(version))
      repos.attestations.create.mockResolvedValue({
        data: null,
        error: { code: 'ATTEST_FAILED', message: 'db error' },
      })

      await expect(
        service.attestVersion(ID.profile, attestData),
      ).rejects.toMatchObject({ code: 'ATTEST_FAILED' })
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // publishProfile
  // ═══════════════════════════════════════════════════════════════════════
  describe('publishProfile', () => {
    it('publishes an attested profile and transitions to published', async () => {
      const profile = makeProfile({ state: 'attested' })
      const version = makeVersion({ version: 2, state: 'attested' })
      const publication = makePublication({ visibility: 'public' })

      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(success(version))
      repos.attestations.countByProfile.mockResolvedValue(success(1))
      repos.publications.create.mockResolvedValue(success(publication))
      repos.profiles.update.mockResolvedValue(
        success(makeProfile({ state: 'published' })),
      )

      const result = await service.publishProfile(ID.profile, 'public')

      expect(result).toEqual(publication)
      expect(result.visibility).toBe('public')
      expect(repos.profiles.update).toHaveBeenCalledWith(ID.profile, {
        state: 'published',
      })
    })

    it('rejects publishing a draft profile', async () => {
      const profile = makeProfile({ state: 'draft' })
      repos.profiles.findById.mockResolvedValue(success(profile))

      await expect(
        service.publishProfile(ID.profile, 'private'),
      ).rejects.toMatchObject({ code: 'INVALID_STATE' })
    })

    it('rejects publishing a review profile (not attested)', async () => {
      const profile = makeProfile({ state: 'review' })
      repos.profiles.findById.mockResolvedValue(success(profile))

      await expect(
        service.publishProfile(ID.profile, 'private'),
      ).rejects.toMatchObject({ code: 'INVALID_STATE' })
    })

    it('rejects publishing without attestations', async () => {
      const profile = makeProfile({ state: 'attested' })
      const version = makeVersion({ version: 2, state: 'attested' })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(success(version))
      repos.attestations.countByProfile.mockResolvedValue(success(0))

      await expect(
        service.publishProfile(ID.profile, 'private'),
      ).rejects.toMatchObject({ code: 'NO_ATTESTATIONS' })
    })

    it('throws when publication creation fails', async () => {
      const profile = makeProfile({ state: 'attested' })
      const version = makeVersion({ version: 2, state: 'attested' })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(success(version))
      repos.attestations.countByProfile.mockResolvedValue(success(1))
      repos.publications.create.mockResolvedValue({
        data: null,
        error: { code: 'PUBLISH_FAILED', message: 'db error' },
      })

      await expect(
        service.publishProfile(ID.profile, 'private'),
      ).rejects.toMatchObject({ code: 'PUBLISH_FAILED' })
    })

    it('supports all visibility levels', async () => {
      const profile = makeProfile({ state: 'attested' })
      const version = makeVersion({ version: 2, state: 'attested' })

      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(success(version))
      repos.attestations.countByProfile.mockResolvedValue(success(1))
      repos.profiles.update.mockResolvedValue(success(makeProfile({ state: 'published' })))

      for (const visibility of ['private', 'restricted', 'public'] as const) {
        repos.publications.create.mockResolvedValue(
          success(makePublication({ visibility })),
        )
        const result = await service.publishProfile(ID.profile, visibility)
        expect(result.visibility).toBe(visibility)
      }
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // updateSection
  // ═══════════════════════════════════════════════════════════════════════
  describe('updateSection', () => {
    it('updates a named section in profile content', async () => {
      const profile = makeProfile({ content: { identity: { name: 'Old' } } })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.profiles.update.mockResolvedValue(
        success(makeProfile({ content: { identity: { name: 'New', updated: true } } })),
      )

      const result = await service.updateSection(ID.profile, 'identity', {
        updated: true,
      })

      expect(repos.profiles.update).toHaveBeenCalledTimes(1)
      const updateCall = repos.profiles.update.mock.calls[0][1]
      expect(updateCall.content).toBeDefined()
    })

    it('preserves other sections when updating one section', async () => {
      const profile = makeProfile({
        content: { identity: { name: 'Site A' }, contact: { email: 'a@test.com' } },
      })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.profiles.update.mockResolvedValue(success(profile))

      await service.updateSection(ID.profile, 'identity', { name: 'Updated' })

      const updateCall = repos.profiles.update.mock.calls[0][1]
      const content = updateCall.content as Record<string, unknown>
      expect(content.contact).toBeDefined()
      expect(content.identity).toBeDefined()
    })

    it('rejects updates on published profiles', async () => {
      const profile = makeProfile({ state: 'published' })
      repos.profiles.findById.mockResolvedValue(success(profile))

      await expect(
        service.updateSection(ID.profile, 'identity', { name: 'New' }),
      ).rejects.toMatchObject({ code: 'IMMUTABLE' })
    })

    it('rejects updates on archived profiles', async () => {
      const profile = makeProfile({ state: 'archived' })
      repos.profiles.findById.mockResolvedValue(success(profile))

      await expect(
        service.updateSection(ID.profile, 'identity', { name: 'New' }),
      ).rejects.toMatchObject({ code: 'TERMINAL_STATE' })
    })

    it('rejects updates on superseded profiles', async () => {
      const profile = makeProfile({ state: 'superseded' })
      repos.profiles.findById.mockResolvedValue(success(profile))

      await expect(
        service.updateSection(ID.profile, 'identity', { name: 'New' }),
      ).rejects.toMatchObject({ code: 'TERMINAL_STATE' })
    })

    it('creates a new section if it does not exist', async () => {
      const profile = makeProfile({ content: {} })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.profiles.update.mockResolvedValue(
        success(makeProfile({ content: { facilities: { building: 'A' } } })),
      )

      await service.updateSection(ID.profile, 'facilities', { building: 'A' })
      expect(repos.profiles.update).toHaveBeenCalled()
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // markUpdateRequired
  // ═══════════════════════════════════════════════════════════════════════
  describe('markUpdateRequired', () => {
    it('transitions published profile back to draft', async () => {
      const profile = makeProfile({ state: 'published' })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.profiles.update.mockResolvedValue(
        success(makeProfile({ state: 'draft' })),
      )

      const result = await service.markUpdateRequired(ID.profile)

      expect(repos.profiles.update).toHaveBeenCalledWith(ID.profile, {
        state: 'draft',
      })
      expect(result.state).toBe('draft')
    })

    it('transitions attested profile back to draft', async () => {
      const profile = makeProfile({ state: 'attested' })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.profiles.update.mockResolvedValue(
        success(makeProfile({ state: 'draft' })),
      )

      const result = await service.markUpdateRequired(ID.profile)
      expect(result.state).toBe('draft')
    })

    it('rejects transition from draft', async () => {
      const profile = makeProfile({ state: 'draft' })
      repos.profiles.findById.mockResolvedValue(success(profile))

      await expect(
        service.markUpdateRequired(ID.profile),
      ).rejects.toMatchObject({ code: 'INVALID_STATE' })
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // State transitions
  // ═══════════════════════════════════════════════════════════════════════
  describe('state transitions', () => {
    it('DRAFT → REVIEW: attestVersion transitions review to attested', async () => {
      const profile = makeProfile({ state: 'review' })
      const version = makeVersion({ version: 2, state: 'review' })
      const attestation = makeAttestation()

      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(success(version))
      repos.attestations.create.mockResolvedValue(success(attestation))
      repos.profiles.update.mockResolvedValue(
        success(makeProfile({ state: 'attested' })),
      )

      await service.attestVersion(ID.profile, {
        attesterId: ID.attester,
        attestationType: 'full_attestation',
      })

      expect(repos.profiles.update).toHaveBeenCalledWith(ID.profile, {
        state: 'attested',
      })
    })

    it('ATTESTED → PUBLISHED: publishProfile transitions attested to published', async () => {
      const profile = makeProfile({ state: 'attested' })
      const version = makeVersion({ version: 2, state: 'attested' })
      const publication = makePublication()

      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.versions.getCurrentVersion.mockResolvedValue(success(version))
      repos.attestations.countByProfile.mockResolvedValue(success(1))
      repos.publications.create.mockResolvedValue(success(publication))
      repos.profiles.update.mockResolvedValue(
        success(makeProfile({ state: 'published' })),
      )

      await service.publishProfile(ID.profile, 'private')

      expect(repos.profiles.update).toHaveBeenCalledWith(ID.profile, {
        state: 'published',
      })
    })

    it('PUBLISHED → DRAFT: markUpdateRequired returns published to draft', async () => {
      const profile = makeProfile({ state: 'published' })
      repos.profiles.findById.mockResolvedValue(success(profile))
      repos.profiles.update.mockResolvedValue(
        success(makeProfile({ state: 'draft' })),
      )

      await service.markUpdateRequired(ID.profile)
      expect(repos.profiles.update).toHaveBeenCalledWith(ID.profile, {
        state: 'draft',
      })
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // listProfiles
  // ═══════════════════════════════════════════════════════════════════════
  describe('listProfiles', () => {
    it('returns paginated profiles', async () => {
      const profiles = [makeProfile(), makeProfile({ id: 'another-id' })]
      repos.profiles.list.mockResolvedValue(success(profiles))

      const result = await service.listProfiles()

      expect(result.items).toHaveLength(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(50)
    })

    it('handles empty list', async () => {
      repos.profiles.list.mockResolvedValue(success([]))

      const result = await service.listProfiles()

      expect(result.items).toHaveLength(0)
    })

    it('clamps page and limit values', async () => {
      repos.profiles.list.mockResolvedValue(success([]))

      const result = await service.listProfiles(undefined, -5, 300)

      expect(result.page).toBe(1)
      expect(result.limit).toBe(200)
    })
  })
})
