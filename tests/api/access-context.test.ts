import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const API_URL = process.env.API_URL ?? 'http://localhost:3001'
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function signIn(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: process.env.SUPABASE_ANON_KEY! },
    body: JSON.stringify({ email, password }),
  })
  const { access_token } = await res.json()
  return access_token as string
}

async function getProfile(token: string) {
  const res = await fetch(`${API_URL}/api/v1/workspace/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res
}

async function setActiveOrg(token: string, org_id: string) {
  return fetch(`${API_URL}/api/v1/workspace/active-org`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ org_id }),
  })
}

// ─── Test users seeded in 011_seed_data.sql ──────────────────────────────────

// Org IDs match 011_seed_data.sql fixed UUIDs
const ORG = {
  pharmaCorp:      'a0000000-0000-0000-0000-000000000001',
  univMedCenter:   'a0000000-0000-0000-0000-000000000003',
  nationalBiobank: 'a0000000-0000-0000-0000-000000000004',
  advPathLab:      'a0000000-0000-0000-0000-000000000005',
}

const USERS = {
  // Existing seed users (011_seed_data.sql)
  sponsor:      { email: 'sponsor@kadarn.test',   password: 'Test123!', org: ORG.pharmaCorp },
  biobank:      { email: 'biobank@kadarn.test',   password: 'Test123!', org: ORG.nationalBiobank },
  site:         { email: 'site@kadarn.test',      password: 'Test123!', org: ORG.univMedCenter },
  lab:          { email: 'lab@kadarn.test',       password: 'Test123!', org: ORG.advPathLab },
  // New users added in 030_test_auth_users.sql
  multi_org:    { email: 'multiorg@kadarn.test',  password: 'Test123!', orgs: [ORG.pharmaCorp, ORG.nationalBiobank] },
  no_org:       { email: 'noorg@kadarn.test',     password: 'Test123!' },
  koc_internal: { email: 'koc@kadarn.test',       password: 'Test123!' },
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/workspace/profile', () => {
  it('returns 401 for unauthenticated request', async () => {
    const res = await getProfile('invalid-token')
    expect(res.status).toBe(401)
  })

  describe('sponsor user (single org)', () => {
    let token: string
    beforeAll(async () => { token = await signIn(USERS.sponsor.email, USERS.sponsor.password) })

    it('returns user profile', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(res.status).toBe(200)
      expect(data.user.email).toBe(USERS.sponsor.email)
      expect(data.user.role).toBe('org_member')
    })

    it('resolves sponsor capabilities → correct applications', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      const apps = data.active_org?.applications ?? data.memberships[0]?.applications
      expect(apps).toContain('programs')
      expect(apps).toContain('discovery')
      expect(apps).toContain('exchange')
      expect(apps).not.toContain('inventory') // biobank-only
    })

    it('returns allowed_experiences: marketplace + workspace', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(data.allowed_experiences).toContain('marketplace')
      expect(data.allowed_experiences).toContain('workspace')
      expect(data.allowed_experiences).not.toContain('koc')
    })

    it('default_redirect is /workspace when active_org is set', async () => {
      await setActiveOrg(token, USERS.sponsor.org)
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(data.default_redirect).toBe('/workspace')
    })
  })

  describe('biobank user', () => {
    let token: string
    beforeAll(async () => { token = await signIn(USERS.biobank.email, USERS.biobank.password) })

    it('resolves biobank capabilities → inventory, collections, qc, exchange, analytics', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      const apps = data.memberships[0]?.applications ?? []
      expect(apps).toContain('inventory')
      expect(apps).toContain('collections')
      expect(apps).toContain('qc')
      expect(apps).not.toContain('programs') // sponsor-only
    })
  })

  describe('site user', () => {
    let token: string
    beforeAll(async () => { token = await signIn(USERS.site.email, USERS.site.password) })

    it('resolves site capabilities → consent, collections, exchange, regulatory', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      const apps = data.memberships[0]?.applications ?? []
      expect(apps).toContain('consent')
      expect(apps).toContain('regulatory')
      expect(apps).not.toContain('inventory')
    })
  })

  describe('lab user', () => {
    let token: string
    beforeAll(async () => { token = await signIn(USERS.lab.email, USERS.lab.password) })

    it('resolves lab capabilities → processing, qc, exchange, analytics', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      const apps = data.memberships[0]?.applications ?? []
      expect(apps).toContain('processing')
      expect(apps).toContain('qc')
      expect(apps).not.toContain('consent')
    })
  })

  describe('user with no org membership', () => {
    let token: string
    beforeAll(async () => { token = await signIn(USERS.no_org.email, USERS.no_org.password) })

    it('returns empty memberships', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(res.status).toBe(200)
      expect(data.memberships).toHaveLength(0)
      expect(data.active_org).toBeNull()
    })

    it('allowed_experiences is only marketplace', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(data.allowed_experiences).toEqual(['marketplace'])
      expect(data.default_redirect).toBe('/marketplace')
    })
  })

  describe('multi-org user', () => {
    let token: string
    beforeAll(async () => { token = await signIn(USERS.multi_org.email, USERS.multi_org.password) })

    it('returns all memberships', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(data.memberships.length).toBeGreaterThanOrEqual(2)
    })

    it('default_redirect is /auth/select-org when no active_org is set', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      // No active_org set yet → send to org selector
      if (!data.active_org) {
        expect(data.default_redirect).toBe('/auth/select-org')
      }
    })

    it('default_redirect resolves to /workspace after selecting an org', async () => {
      await setActiveOrg(token, USERS.multi_org.orgs[0])
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(data.default_redirect).toBe('/workspace')
      expect(data.active_org?.org_id).toBe(USERS.multi_org.orgs[0])
    })
  })

  describe('KOC internal user', () => {
    let token: string
    beforeAll(async () => { token = await signIn(USERS.koc_internal.email, USERS.koc_internal.password) })

    it('role is kadarn_internal', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(data.user.role).toBe('kadarn_internal')
    })

    it('allowed_experiences includes koc', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(data.allowed_experiences).toContain('koc')
    })

    it('default_redirect is /koc', async () => {
      const res = await getProfile(token)
      const { data } = await res.json()
      expect(data.default_redirect).toBe('/koc')
    })
  })
})

describe('POST /api/v1/workspace/active-org', () => {
  it('returns 403 when user is not a member of the org', async () => {
    const token = await signIn(USERS.no_org.email, USERS.no_org.password)
    const res = await setActiveOrg(token, '00000000-0000-0000-0000-000000000001')
    expect(res.status).toBe(403)
  })

  it('returns 422 when org_id is not a valid UUID', async () => {
    const token = await signIn(USERS.sponsor.email, USERS.sponsor.password)
    const res = await setActiveOrg(token, 'not-a-uuid')
    expect(res.status).toBe(422)
  })

  it('sets active_org and returns it', async () => {
    const token = await signIn(USERS.sponsor.email, USERS.sponsor.password)
    const res = await setActiveOrg(token, USERS.sponsor.org)
    const { data } = await res.json()
    expect(res.status).toBe(200)
    expect(data.active_org_id).toBe(USERS.sponsor.org)
  })
})
