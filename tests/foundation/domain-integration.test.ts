// ==========================================================================
// KAD-002G — Foundation Domain Integration Tests
// ==========================================================================
// Tests Person, Location, Membership, and Role entities end-to-end
// through their API surfaces. Verifies CRUD, RLS, and tenant isolation.
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest'
import { signInAs, getConfig } from '../setup/test-utils.js'

// Supabase local development default keys
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:55421'
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjXni7yEeQv4GTRS5QC5Bm7n_I0'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGZvSJw9s_Hi2BFer5Jw9dN0SUWz2ttQoTh81IU'

const API = process.env.SUPABASE_URL ?? 'http://127.0.0.1:55421'
const REST_URL = `${API}/rest/v1`

async function apiGet(path: string, token: string) {
  const res = await fetch(`${REST_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
  })
  return { status: res.status, body: await res.json() }
}

async function apiPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${REST_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
}

async function apiPatch(path: string, token: string, body: unknown) {
  const res = await fetch(`${REST_URL}${path}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
}

describe('Foundation Domain — Person', () => {
  let token: string
  let personId: string
  const newEmail = `test-${Date.now()}@kadarn.test`

  beforeAll(async () => {
    const { session } = await signInAs('admin')
    token = session.access_token
  })

  it('POST /people — creates a person', async () => {
    const { status, body } = await apiPost('/people', token, {
      email: newEmail,
      first_name: 'Test',
      last_name: 'User',
    })
    expect(status).toBe(201)
    expect(body.length).toBe(1)
    expect(body[0].email).toBe(newEmail)
    expect(body[0].status).toBe('active')
    personId = body[0].id
  })

  it('GET /people?id= — reads a person by id', async () => {
    const { status, body } = await apiGet(`/people?id=eq.${personId}`, token)
    expect(status).toBe(200)
    expect(body.length).toBe(1)
    expect(body[0].email).toBe(newEmail)
  })

  it('GET /people?email= — finds a person by email', async () => {
    const { status, body } = await apiGet(`/people?email=eq.${newEmail}`, token)
    expect(status).toBe(200)
    expect(body.length).toBe(1)
    expect(body[0].first_name).toBe('Test')
  })

  it('POST /people — rejects duplicate email', async () => {
    const { status } = await apiPost('/people', token, {
      email: newEmail,
      first_name: 'Duplicate',
      last_name: 'User',
    })
    expect(status).toBe(409)
  })

  it('PATCH /people — updates a person', async () => {
    const { status, body } = await apiPatch(`/people?id=eq.${personId}`, token, { phone: '+1-555-0100' })
    expect(status).toBe(200)
    expect(body[0].phone).toBe('+1-555-0100')
  })

  it('PATCH /people — soft-deletes (suspends) a person', async () => {
    const { status, body } = await apiPatch(`/people?id=eq.${personId}`, token, { status: 'suspended' })
    expect(status).toBe(200)
    expect(body[0].status).toBe('suspended')
  })
})

describe('Foundation Domain — Location', () => {
  let token: string
  let locationId: string
  const orgId = 'a0000000-0000-0000-0000-000000000003' // Univ Medical Center
  const locName = `Test Lab ${Date.now()}`

  beforeAll(async () => {
    const { session } = await signInAs('site') // site role belongs to Univ Medical Center
    token = session.access_token
  })

  it('POST /locations — creates a location', async () => {
    const { status, body } = await apiPost('/locations', token, {
      name: locName,
      location_type: 'laboratory',
      institution_id: orgId,
      address_line1: '123 Test Street',
      city: 'Testville',
      state_province: 'TS',
      postal_code: '12345',
      country: 'US',
    })
    expect(status).toBe(201)
    expect(body.length).toBe(1)
    expect(body[0].name).toBe(locName)
    locationId = body[0].id
  })

  it('GET /locations?institution_id= — lists locations for institution', async () => {
    const { status, body } = await apiGet(`/locations?institution_id=eq.${orgId}`, token)
    expect(status).toBe(200)
    expect(body.some((l: any) => l.id === locationId)).toBe(true)
  })

  it('PATCH /locations — updates a location', async () => {
    const { status, body } = await apiPatch(`/locations?id=eq.${locationId}`, token, { phone: '+1-555-0200' })
    expect(status).toBe(200)
    expect(body[0].phone).toBe('+1-555-0200')
  })
})

describe('Foundation Domain — RLS Tenant Isolation', () => {
  let siteToken: string
  let sponsorToken: string
  const orgId = 'a0000000-0000-0000-0000-000000000003' // Univ Medical Center

  beforeAll(async () => {
    const site = await signInAs('site')
    const sponsor = await signInAs('sponsor')
    siteToken = site.session.access_token
    sponsorToken = sponsor.session.access_token
  })

  it('site CAN read its own organization memberships', async () => {
    const { status, body } = await apiGet(`/organization_memberships?organization_id=eq.${orgId}`, siteToken)
    expect(status).toBe(200)
  })

  it('sponsor CANNOT read site organization memberships (RLS)', async () => {
    const { status, body } = await apiGet(`/organization_memberships?organization_id=eq.${orgId}`, sponsorToken)
    // RLS should filter out — either empty or 403
    expect(status === 200 ? body.length === 0 : status >= 400).toBe(true)
  })

  it('site CAN read its own locations', async () => {
    const { status, body } = await apiGet(`/locations?institution_id=eq.${orgId}`, siteToken)
    expect(status).toBe(200)
  })

  it('sponsor CANNOT read site locations (RLS)', async () => {
    const { status, body } = await apiGet(`/locations?institution_id=eq.${orgId}`, sponsorToken)
    const blocked = status >= 400 || (status === 200 && body.length === 0)
    expect(blocked).toBe(true)
  })
})

describe('Foundation Domain — Role Catalog', () => {
  let token: string

  beforeAll(async () => {
    const { session } = await signInAs('admin')
    token = session.access_token
  })

  it('GET /organization_roles — lists governed roles', async () => {
    const { status, body } = await apiGet('/organization_roles', token)
    expect(status).toBe(200)
    expect(body.length).toBeGreaterThanOrEqual(6)
    const keys = body.map((r: any) => r.key)
    expect(keys).toContain('org_admin')
    expect(keys).toContain('org_member')
    expect(keys).toContain('site_pi')
    expect(keys).toContain('reviewer')
  })
})

describe('Protected Vertical Slice', () => {
  let token: string

  beforeAll(async () => {
    const { session } = await signInAs('admin')
    token = session.access_token
  })

  it('evidence-core tables exist', async () => {
    const res = await fetch(`${REST_URL}/claims?select=id&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.ok).toBe(true)
  })

  it('passport tables exist', async () => {
    const res = await fetch(`${REST_URL}/passport_entries?select=id&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.ok).toBe(true)
  })

  it('review workflow tables exist', async () => {
    const res = await fetch(`${REST_URL}/review_tasks?select=id&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.ok).toBe(true)
  })
})
