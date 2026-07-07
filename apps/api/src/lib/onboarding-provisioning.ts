import { ApiError, createServiceClient } from '@/lib/supabase-server'
import {
  createCorrelationId,
  emitDomainEvent,
  emitOrganizationCreated,
  evaluateCreateOrgPolicy,
  recordOrganizationProvenance,
} from '@/lib/onboarding'
import {
  ASSET_PERSISTENCE,
  ORGANIZATION_ACTOR_TYPE,
  buildOrganizationProvisioningPlan,
  type ActorAssetPlan,
  type OrganizationProvisioningRequest,
  type PrimaryWorkspacePlan,
} from './onboarding-provisioning-plan'

interface OrganizationRecord {
  id: string
  name: string
  country: string
  created_at?: string
}

interface MembershipRecord {
  id: string
}

interface RoleRecord {
  id: string
}

interface CapabilityTypeRecord {
  id: string
  key: string
}

interface InitializedAsset {
  key: string
  label: string
  persistence: string
  status: 'initialized'
}

export interface OrganizationProvisioningResult {
  user: {
    id: string
    email: string
  }
  organization: {
    id: string
    name: string
    country: string
    actor_type: string
  }
  membership: {
    id: string
    role: 'org_admin'
  }
  capabilities: string[]
  primary_workspace: PrimaryWorkspacePlan
  initialized_assets: InitializedAsset[]
  correlation_id: string
}

interface RollbackState {
  authUserId?: string
  organizationId?: string
}

export async function provisionOrganizationFirst(
  input: OrganizationProvisioningRequest,
): Promise<OrganizationProvisioningResult> {
  const db = createServiceClient()
  const correlationId = createCorrelationId()
  const rollback: RollbackState = {}
  const plan = buildOrganizationProvisioningPlan(input.actor_type)
  const fullName = `${input.administrator.first_name} ${input.administrator.last_name}`

  try {
    const authUser = await createAuthUser(input, fullName)
    rollback.authUserId = authUser.id

    await ensureUserProfile(authUser.id, input.administrator.email, fullName)

    const organization = await createOrganization(input, authUser.id, plan.primaryWorkspace.kind)
    rollback.organizationId = organization.id

    const membership = await createMembership(organization.id, authUser.id)
    await assignOwnerRole(membership.id, authUser.id)
    await assignCapabilities(organization.id, authUser.id, plan.capabilityKeys)
    await setActiveOrganization(authUser.id, organization)
    const initializedAssets = await initializeActorAssets(
      input,
      organization,
      authUser.id,
      plan.actorAssets,
    )

    emitOrganizationCreated(organization, authUser.id, correlationId)
    void recordOrganizationProvenance(organization, correlationId)
    void evaluateCreateOrgPolicy(authUser.id, 'org_admin', organization.id, correlationId)
    emitDomainEvent('OrganizationProvisioned', {
      organizationId: organization.id,
      actorType: input.actor_type,
      primaryWorkspace: plan.primaryWorkspace.kind,
      initializedAssets: initializedAssets.map(asset => asset.key),
    }, {
      actorId: authUser.id,
      organizationId: organization.id,
      correlationId,
    })

    return {
      user: {
        id: authUser.id,
        email: input.administrator.email,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        country: organization.country,
        actor_type: input.actor_type,
      },
      membership: {
        id: membership.id,
        role: 'org_admin',
      },
      capabilities: plan.capabilityKeys,
      primary_workspace: plan.primaryWorkspace,
      initialized_assets: initializedAssets,
      correlation_id: correlationId,
    }
  } catch (error) {
    await rollbackProvisioning(rollback)
    throw error
  }
}

async function createAuthUser(
  input: OrganizationProvisioningRequest,
  fullName: string,
): Promise<{ id: string }> {
  const db = createServiceClient()
  const { data, error } = await db.auth.admin.createUser({
    email: input.administrator.email,
    password: input.administrator.password,
    email_confirm: false,
    user_metadata: {
      full_name: fullName,
      first_name: input.administrator.first_name,
      last_name: input.administrator.last_name,
      kadarn_role: 'org_admin',
      onboarding_actor_type: input.actor_type,
    },
  })

  if (error || !data.user) {
    throw new ApiError(409, 'Failed to create auth user', error?.message)
  }

  return { id: data.user.id }
}

async function ensureUserProfile(
  userId: string,
  email: string,
  fullName: string,
): Promise<void> {
  const db = createServiceClient()
  const { error } = await db
    .from('user_profiles')
    .upsert({
      id: userId,
      email,
      full_name: fullName,
      is_active: true,
    }, { onConflict: 'id' })

  if (error) {
    throw new ApiError(500, 'Failed to create user profile', error.message)
  }
}

async function createOrganization(
  input: OrganizationProvisioningRequest,
  userId: string,
  primaryWorkspaceKind: string,
): Promise<OrganizationRecord> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('organizations')
    .insert({
      name: input.organization.name,
      country: input.organization.country,
      website: input.organization.website,
      email: input.administrator.email,
      created_by: userId,
      visibility_scope: 'organization',
      metadata: {
        actor_type: input.actor_type,
        primary_workspace: primaryWorkspaceKind,
        provisioning_source: 'pcp-1.1d',
      },
    })
    .select('id, name, country, created_at')
    .single()

  if (error || !data) {
    if (error?.code === '23505') {
      throw new ApiError(409, 'An organization with this name already exists in this country')
    }
    throw new ApiError(500, 'Failed to create organization', error?.message)
  }

  return data as OrganizationRecord
}

async function createMembership(
  organizationId: string,
  userId: string,
): Promise<MembershipRecord> {
  const db = createServiceClient()
  const now = new Date().toISOString()
  const { data, error } = await db
    .from('organization_memberships')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      status: 'active',
      invited_by: userId,
      invited_at: now,
      joined_at: now,
      metadata: {
        provisioning_source: 'pcp-1.1d',
        first_owner: true,
      },
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new ApiError(500, 'Failed to create organization membership', error?.message)
  }

  return data as MembershipRecord
}

async function assignOwnerRole(
  membershipId: string,
  userId: string,
): Promise<void> {
  const db = createServiceClient()
  const role = await readRole('org_admin')
  const { error } = await db
    .from('membership_roles')
    .insert({
      membership_id: membershipId,
      role_id: role.id,
      assigned_by: userId,
    })

  if (error) {
    throw new ApiError(500, 'Failed to assign organization owner role', error.message)
  }
}

async function readRole(key: string): Promise<RoleRecord> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('organization_roles')
    .select('id')
    .eq('key', key)
    .single()

  if (error || !data) {
    throw new ApiError(500, `Missing required organization role: ${key}`, error?.message)
  }

  return data as RoleRecord
}

async function assignCapabilities(
  organizationId: string,
  userId: string,
  capabilityKeys: string[],
): Promise<void> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('organization_capability_types')
    .select('id, key')
    .in('key', capabilityKeys)

  if (error || !data) {
    throw new ApiError(500, 'Failed to read organization capability types', error?.message)
  }

  const capabilityTypes = data as CapabilityTypeRecord[]
  const foundKeys = new Set(capabilityTypes.map(type => type.key))
  const missingKeys = capabilityKeys.filter(key => !foundKeys.has(key))
  if (missingKeys.length > 0) {
    throw new ApiError(500, `Missing required capability types: ${missingKeys.join(', ')}`)
  }

  const { error: insertError } = await db
    .from('organization_capabilities')
    .insert(capabilityTypes.map(type => ({
      organization_id: organizationId,
      capability_type_id: type.id,
      is_primary: true,
      created_by: userId,
    })))

  if (insertError) {
    throw new ApiError(500, 'Failed to assign organization capabilities', insertError.message)
  }
}

async function setActiveOrganization(
  userId: string,
  organization: OrganizationRecord,
): Promise<void> {
  const db = createServiceClient()
  const { error } = await db.auth.admin.updateUserById(userId, {
    user_metadata: {
      active_org_id: organization.id,
      active_org_name: organization.name,
      kadarn_role: 'org_admin',
    },
  })

  if (error) {
    throw new ApiError(500, 'Failed to set active organization', error.message)
  }
}

async function initializeActorAssets(
  input: OrganizationProvisioningRequest,
  organization: OrganizationRecord,
  userId: string,
  assets: ActorAssetPlan[],
): Promise<InitializedAsset[]> {
  const initialized: InitializedAsset[] = []

  for (const asset of assets) {
    if (asset.persistence === ASSET_PERSISTENCE.SITE_CONTINUITY_PROFILE) {
      await ensureInstitutionProfile(input, organization, userId)
    }
    if (asset.persistence === ASSET_PERSISTENCE.SPONSOR_PORTFOLIO) {
      await ensureSponsorPortfolio(organization, userId)
    }
    initialized.push({
      key: asset.key,
      label: asset.label,
      persistence: asset.persistence,
      status: 'initialized',
    })
  }

  return initialized
}

async function ensureInstitutionProfile(
  input: OrganizationProvisioningRequest,
  organization: OrganizationRecord,
  userId: string,
): Promise<void> {
  if (input.actor_type !== ORGANIZATION_ACTOR_TYPE.INSTITUTION) return

  const db = createServiceClient()
  const { error } = await db
    .from('site_continuity_profiles')
    .upsert({
      organization_id: organization.id,
      status: 'draft',
      site_type: 'clinical_site',
      headline: organization.name,
      summary: 'Draft institution portfolio initialized during organization-first onboarding.',
      passport_visibility: 'private',
      source_type: 'self_reported',
      created_by: userId,
      updated_by: userId,
    }, { onConflict: 'organization_id' })

  if (error) {
    throw new ApiError(500, 'Failed to initialize institution portfolio', error.message)
  }
}

async function ensureSponsorPortfolio(
  organization: OrganizationRecord,
  userId: string,
): Promise<void> {
  const db = createServiceClient()
  const { error } = await db
    .from('sponsor_portfolios')
    .insert({
      sponsor_org_id: organization.id,
      name: 'Sponsor Portfolio',
      status: 'active',
      created_by: userId,
      metadata: {
        provisioning_source: 'pcp-1.1d',
        starts_empty: true,
      },
    })

  if (error) {
    throw new ApiError(500, 'Failed to initialize sponsor portfolio', error.message)
  }
}

async function rollbackProvisioning(state: RollbackState): Promise<void> {
  const db = createServiceClient()

  if (state.organizationId) {
    const { error } = await db.from('organizations').delete().eq('id', state.organizationId)
    if (error) console.error('[onboarding] organization rollback failed:', error.message)
  }

  if (state.authUserId) {
    const { error } = await db.auth.admin.deleteUser(state.authUserId)
    if (error) console.error('[onboarding] auth user rollback failed:', error.message)
  }
}
