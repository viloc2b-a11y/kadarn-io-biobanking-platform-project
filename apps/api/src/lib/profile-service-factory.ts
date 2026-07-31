// ==========================================================================
// KEMS-SITE-PROFILE — ProfileService Factory
// ==========================================================================
// Creates a ProfileService wired to Supabase-backed repositories.
// Used by site-profile API routes under /api/v1/site-profiles/**.
// ==========================================================================

import { createServiceClient } from '@/lib/supabase-server'
import {
  ProfileService,
  ProfileServiceError,
  type ProfileRepositoryLike,
  type ProfileVersionRepositoryLike,
  type ProfileAttestationRepositoryLike,
  type ProfilePublicationRepositoryLike,
} from '@kadarn/platform-services'
import type {
  SiteProfile,
  CreateSiteProfile,
  UpdateSiteProfile,
  ProfileState,
  SiteProfileVersion,
  ProfileAttestation,
  ProfilePublication,
} from '@kadarn/types'
import { SupabaseClient } from '@supabase/supabase-js'

// Local type (matches the interface in profile-service.ts — not yet exported
// from the public barrel of @kadarn/platform-services)
interface RepositoryResult<T> {
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
}

// ─── Supabase-backed ProfileRepository ────────────────────────────────────

function createProfileRepo(
  supabase: SupabaseClient,
): ProfileRepositoryLike {
  return {
    async findById(id: string): Promise<RepositoryResult<SiteProfile>> {
      const { data, error } = await supabase
        .from('site_profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return { data: null, error: { code: 'NOT_FOUND', message: 'Profile not found' } }
        return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      }
      return { data: data as unknown as SiteProfile, error: null }
    },

    async create(input: CreateSiteProfile): Promise<RepositoryResult<SiteProfile>> {
      const { data, error } = await supabase
        .from('site_profiles')
        .insert({
          organization_id: input.organization_id,
          name: input.name,
          description: input.description ?? null,
          profile_type: input.profile_type ?? null,
          content: input.content ?? {},
          tags: input.tags ?? [],
          metadata: input.metadata ?? null,
        })
        .select('*')
        .single()

      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      return { data: data as unknown as SiteProfile, error: null }
    },

    async update(
      id: string,
      patch: UpdateSiteProfile,
    ): Promise<RepositoryResult<SiteProfile>> {
      const { data, error } = await supabase
        .from('site_profiles')
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        if (error.code === 'PGRST116') return { data: null, error: { code: 'NOT_FOUND', message: 'Profile not found' } }
        return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      }
      return { data: data as unknown as SiteProfile, error: null }
    },

    async list(
      filters?: { organizationId?: string; state?: ProfileState },
      page: number = 1,
      limit: number = 50,
    ): Promise<RepositoryResult<SiteProfile[]>> {
      const offset = (page - 1) * limit
      let query = supabase
        .from('site_profiles')
        .select('*', { count: 'exact' })

      if (filters?.organizationId) {
        query = query.eq('organization_id', filters.organizationId)
      }
      if (filters?.state) {
        query = query.eq('state', filters.state)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      return { data: (data as unknown as SiteProfile[]) ?? [], error: null }
    },
  }
}

// ─── Supabase-backed ProfileVersionRepository ─────────────────────────────

function createProfileVersionRepo(
  supabase: SupabaseClient,
): ProfileVersionRepositoryLike {
  return {
    async create(snapshot): Promise<RepositoryResult<SiteProfileVersion>> {
      const { data, error } = await supabase
        .from('site_profile_versions')
        .insert(snapshot)
        .select('*')
        .single()

      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      return { data: data as unknown as SiteProfileVersion, error: null }
    },

    async listByProfile(
      profileId: string,
    ): Promise<RepositoryResult<SiteProfileVersion[]>> {
      const { data, error } = await supabase
        .from('site_profile_versions')
        .select('*')
        .eq('profile_id', profileId)
        .order('version', { ascending: false })

      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      return { data: (data as unknown as SiteProfileVersion[]) ?? [], error: null }
    },

    async getCurrentVersion(
      profileId: string,
    ): Promise<RepositoryResult<SiteProfileVersion | null>> {
      const { data, error } = await supabase
        .from('site_profile_versions')
        .select('*')
        .eq('profile_id', profileId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return { data: null, error: null }
        return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      }
      return { data: data as unknown as SiteProfileVersion, error: null }
    },
  }
}

// ─── Supabase-backed ProfileAttestationRepository ─────────────────────────

function createProfileAttestationRepo(
  supabase: SupabaseClient,
): ProfileAttestationRepositoryLike {
  return {
    async create(attestation): Promise<RepositoryResult<ProfileAttestation>> {
      const { data, error } = await supabase
        .from('profile_attestations')
        .insert({
          profile_version_id: attestation.profile_version_id,
          profile_id: attestation.profile_id,
          organization_id: attestation.organization_id,
          attester_id: attestation.attester_id,
          attester_role: attestation.attester_role ?? null,
          attestation_type: attestation.attestation_type,
          statement: attestation.statement ?? null,
          signature_ref: attestation.signature_ref ?? null,
          verified_by: attestation.verified_by ?? null,
        })
        .select('*')
        .single()

      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      return { data: data as unknown as ProfileAttestation, error: null }
    },

    async listByProfile(
      profileId: string,
    ): Promise<RepositoryResult<ProfileAttestation[]>> {
      const { data, error } = await supabase
        .from('profile_attestations')
        .select('*')
        .eq('profile_id', profileId)
        .order('attested_at', { ascending: false })

      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      return { data: (data as unknown as ProfileAttestation[]) ?? [], error: null }
    },

    async countByProfile(profileId: string): Promise<RepositoryResult<number>> {
      const { count, error } = await supabase
        .from('profile_attestations')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId)

      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      return { data: count ?? 0, error: null }
    },
  }
}

// ─── Supabase-backed ProfilePublicationRepository ─────────────────────────

function createProfilePublicationRepo(
  supabase: SupabaseClient,
): ProfilePublicationRepositoryLike {
  return {
    async create(publication): Promise<RepositoryResult<ProfilePublication>> {
      const { data, error } = await supabase
        .from('profile_publications')
        .insert({
          profile_id: publication.profile_id,
          profile_version_id: publication.profile_version_id,
          organization_id: publication.organization_id,
          visibility: publication.visibility,
          published_by: publication.published_by ?? null,
          public_uri: publication.public_uri ?? null,
          registry_id: publication.registry_id ?? null,
        })
        .select('*')
        .single()

      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      return { data: data as unknown as ProfilePublication, error: null }
    },

    async getLatestByProfile(
      profileId: string,
    ): Promise<RepositoryResult<ProfilePublication | null>> {
      const { data, error } = await supabase
        .from('profile_publications')
        .select('*')
        .eq('profile_id', profileId)
        .order('published_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return { data: null, error: null }
        return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } }
      }
      return { data: data as unknown as ProfilePublication, error: null }
    },
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────

let _profileService: ProfileService | null = null
let _serviceClient: ReturnType<typeof createServiceClient> | null = null

export function getServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createServiceClient()
  }
  return _serviceClient
}

export function getProfileService(): ProfileService {
  if (!_profileService) {
    const supabase = getServiceClient()
    _profileService = new ProfileService(
      createProfileRepo(supabase),
      createProfileVersionRepo(supabase),
      createProfileAttestationRepo(supabase),
      createProfilePublicationRepo(supabase),
    )
  }
  return _profileService
}
