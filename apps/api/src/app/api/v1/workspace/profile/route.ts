import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { rateLimit, WORKSPACE_RATE_LIMIT } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic';
// Capability key → application ID mapping
const CAPABILITY_APPLICATIONS: Record<string, string[]> = {
  biobank:              ['inventory', 'collections', 'qc', 'exchange', 'analytics'],
  processing_lab:       ['processing', 'qc', 'exchange', 'analytics'],
  storage_facility:     ['inventory', 'logistics', 'analytics'],
  sponsor:              ['programs', 'discovery', 'exchange', 'analytics', 'payments'],
  cro:                  ['programs', 'exchange', 'qc', 'logistics', 'analytics'],
  clinical_site:        ['consent', 'collections', 'exchange', 'regulatory'],
  logistics_vendor:     ['logistics', 'exchange', 'analytics'],
  irb:                  ['regulatory', 'programs', 'analytics'],
  regulatory_body:      ['regulatory', 'analytics'],
  diagnostic_lab:       ['processing', 'qc', 'exchange', 'analytics'],
  data_processor:       ['analytics', 'exchange'],
  technology_provider:  ['exchange', 'analytics'],
}

type CapabilityRelation = { organization_capability_types: { key: string } | { key: string }[] | null }
type OrganizationRelation = {
  id: string
  name: string
  organization_capabilities: CapabilityRelation[]
}
type MembershipRoleRelation = {
  organization_roles: { key: string; name: string; priority: number } | { key: string; name: string; priority: number }[] | null
}

const firstRelation = <T>(value: T | T[] | null): T | null => {
  return Array.isArray(value) ? value[0] ?? null : value
}

function resolveApplications(capabilityKeys: string[]): string[] {
  const apps = new Set<string>()
  for (const cap of capabilityKeys) {
    for (const app of CAPABILITY_APPLICATIONS[cap] ?? []) {
      apps.add(app)
    }
  }
  return [...apps]
}

function resolveKadarnRole(userMeta: Record<string, unknown>): string {
  const validRoles = ['kadarn_internal', 'org_admin', 'org_member', 'marketplace_user']
  const role = userMeta?.kadarn_role as string | undefined
  return role && validRoles.includes(role) ? role : 'marketplace_user'
}

function resolveAllowedExperiences(
  kadarnRole: string,
  memberships: { org_id: string }[],
): string[] {
  if (kadarnRole === 'kadarn_internal') return ['marketplace', 'workspace', 'koc']
  if (memberships.length > 0) return ['marketplace', 'workspace']
  return ['marketplace']
}

function resolveDefaultRedirect(
  kadarnRole: string,
  activeOrgId: string | null,
  memberships: { org_id: string }[],
): string {
  if (kadarnRole === 'kadarn_internal') return '/koc'
  if (activeOrgId && memberships.some(m => m.org_id === activeOrgId)) return '/workspace'
  if (memberships.length === 1) return '/workspace'
  if (memberships.length > 1) return '/auth/select-org'
  return '/marketplace'
}

export const GET = rateLimit(WORKSPACE_RATE_LIMIT, withAuth(async (_request, user) => {
  try {
    const supabase = await createRouteClient()

    // User profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, avatar_url, created_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return Response.json({ error: { code: 404, message: 'Profile not found' } }, { status: 404 })
    }

    // Memberships with org details and capabilities
    const { data: rawMemberships } = await supabase
      .from('organization_memberships')
      .select(`
        id,
        organization_id,
        status,
        joined_at,
        organizations (
          id,
          name,
          organization_capabilities (
            organization_capability_types ( key )
          )
        ),
        membership_roles (
          organization_roles ( key, name, priority )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')

    const memberships = (rawMemberships ?? []).map(m => {
      const org = firstRelation(m.organizations as OrganizationRelation | OrganizationRelation[] | null)

      const capabilityKeys = (org?.organization_capabilities ?? [])
        .map(c => firstRelation(c.organization_capability_types)?.key)
        .filter(Boolean) as string[]

      const roles = ((m.membership_roles ?? []) as MembershipRoleRelation[])
        .map(r => firstRelation(r.organization_roles))
        .filter(Boolean)
        .sort((a, b) => (b!.priority ?? 0) - (a!.priority ?? 0))

      const primaryRole = roles[0]?.key ?? 'org_member'

      return {
        membership_id: m.id,
        org_id: org?.id ?? m.organization_id,
        org_name: org?.name ?? '',
        role: primaryRole,
        capabilities: capabilityKeys,
        applications: resolveApplications(capabilityKeys),
        joined_at: m.joined_at,
      }
    })

    const kadarnRole = resolveKadarnRole(user.user_metadata)
    const activeOrgId = (user.user_metadata?.active_org_id as string | null) ?? null
    const activeMembership = memberships.find(m => m.org_id === activeOrgId) ?? null
    const allowedExperiences = resolveAllowedExperiences(kadarnRole, memberships)
    const defaultRedirect = resolveDefaultRedirect(kadarnRole, activeOrgId, memberships)

    return Response.json({
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: kadarnRole,
          created_at: profile.created_at,
        },
        memberships,
        active_org: activeMembership,
        allowed_experiences: allowedExperiences,
        default_redirect: defaultRedirect,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
}))
