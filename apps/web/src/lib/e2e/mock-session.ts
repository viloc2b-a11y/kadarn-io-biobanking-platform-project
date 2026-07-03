import type { User } from '@supabase/supabase-js'
import type { OrganizationMembership } from '@kadarn/types'

/** E2E-only — enabled when Playwright webServer sets these vars (never in production). */
export const E2E_SESSION_COOKIE = 'kadarn-e2e-session'
export const E2E_SESSION_VALUE = 'workspace'

export function isE2EAuthClientEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_KADARN_E2E_AUTH === 'true') return true
  if (typeof document !== 'undefined') {
    return document.cookie.split(';').some((part) => {
      const [name, value] = part.trim().split('=')
      return name === E2E_SESSION_COOKIE && value === E2E_SESSION_VALUE
    })
  }
  return false
}

export function isE2EAuthServerEnabled(): boolean {
  return process.env.KADARN_E2E_AUTH === 'true'
}

const E2E_USER_ID = 'e2e-user-00000000-0000-4000-8000-000000000001'
const E2E_ORG_ID = 'e2e-org-00000000-0000-4000-8000-000000000001'

export function createE2EMockUser(): User {
  return {
    id: E2E_USER_ID,
    email: 'e2e-workspace@kadarn.test',
    app_metadata: {},
    user_metadata: {
      kadarn_role: 'org_admin',
      active_org_id: E2E_ORG_ID,
      full_name: 'E2E Workspace User',
    },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
  } as User
}

export const E2E_MOCK_MEMBERSHIP: OrganizationMembership = {
  user_id: E2E_USER_ID,
  org_id: E2E_ORG_ID,
  org_name: 'E2E Biobank',
  org_type: 'biobank',
  role: 'admin',
  capabilities: [],
  joined_at: '2026-01-01T00:00:00.000Z',
}

export const E2E_WORKSPACE_PROFILE = {
  user: {
    full_name: 'E2E Workspace User',
    email: 'e2e-workspace@kadarn.test',
    role: 'org_admin',
  },
  active_org: {
    org_id: E2E_ORG_ID,
    org_name: 'E2E Biobank',
    role: 'admin',
    capabilities: ['evidence_management'],
    applications: ['workspace'],
  },
  memberships: [E2E_MOCK_MEMBERSHIP],
  allowed_experiences: ['workspace'],
  default_redirect: '/workspace',
}

export const E2E_WORKSPACE_NAV = [
  {
    label: 'Operations',
    items: [{ id: 'delivery', label: 'Delivery', href: '/workspace/delivery' }],
  },
]
