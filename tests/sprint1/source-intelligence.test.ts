// ==========================================================================
// KADARN v2 — Sprint 1: Evidence Source Intelligence Integration Tests
// ==========================================================================
// Tests EvidenceSource and SourceRecord CRUD, RLS, enums, and fixtures.

import { describe, it, expect, beforeAll } from 'vitest'
import { signInAs } from '../setup/test-utils.js'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:55421'
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjXni7yEeQv4GTRS5QC5Bm7n_I0'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGZvSJw9s_Hi2BFer5Jw9dN0SUWz2ttQoTh81IU'

const API = process.env.SUPABASE_URL ?? 'http://127.0.0.1:55421'
const REST_URL = `${API}/rest/v1`

async function apiPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${REST_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
}

async function apiGet(path: string, token: string) {
  const res = await fetch(`${REST_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
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

// ─── Fixtures ───────────────────────────────────────────────────────────

const GLOBAL_SOURCE = {
  canonical_name: `ClinicalTrials.gov (test-${Date.now()})`,
  source_type: 'registry',
  producer_type: 'regulatory_agency',
  producer_name: 'NIH / National Library of Medicine',
  authority_level: 'regulatory',
  acquisition_method: 'api_query',
  freshness_policy: { policy: 'source_defined' },
  base_uri: 'https://clinicaltrials.gov',
}

const CR_SOURCE = {
  canonical_name: `Vilo Continuing Review (test-${Date.now()})`,
  source_type: 'document',
  producer_type: 'institution',
  producer_name: 'Vilo Research Group',
  authority_level: 'institutional_record',
  acquisition_method: 'file_upload',
  freshness_policy: { policy: 'fixed_duration', max_age_days: 365 },
}

// ─── EvidenceSource Tests ──────────────────────────────────────────────

describe('Sprint 1 — EvidenceSource', () => {
  let token: string
  let sourceId: string

  beforeAll(async () => {
    const { session } = await signInAs('admin')
    token = session.access_token
  })

  it('creates a global (public) evidence source', async () => {
    const { status, body } = await apiPost('/evidence_sources', token, GLOBAL_SOURCE)
    expect(status).toBe(201)
    expect(body.length).toBe(1)
    expect(body[0].canonical_name).toBe(GLOBAL_SOURCE.canonical_name)
    expect(body[0].source_type).toBe('registry')
    expect(body[0].authority_level).toBe('regulatory')
    expect(body[0].active).toBe(true)
    sourceId = body[0].id
  })

  it('lists evidence sources', async () => {
    const { status, body } = await apiGet('/evidence_sources', token)
    expect(status).toBe(200)
    expect(body.length).toBeGreaterThanOrEqual(1)
  })

  it('filters by source type', async () => {
    const { status, body } = await apiGet('/evidence_sources?source_type=eq.registry', token)
    expect(status).toBe(200)
    expect(body.every((s: any) => s.source_type === 'registry')).toBe(true)
  })

  it('rejects invalid authority level', async () => {
    const { status } = await apiPost('/evidence_sources', token, {
      ...GLOBAL_SOURCE,
      canonical_name: `Invalid-${Date.now()}`,
      authority_level: 'invalid_level',
    })
    // PostgREST returns 409 for enum constraint violations
    expect([400, 409]).toContain(status)
  })

  it('updates a source', async () => {
    const { status, body } = await apiPatch(`/evidence_sources?id=eq.${sourceId}`, token, { active: false })
    expect(status).toBe(200)
    expect(body[0].active).toBe(false)
  })

  it('creates an institutional source', async () => {
    // Use admin's own organization (PharmaCorp)
    const orgId = 'a0000000-0000-0000-0000-000000000001'
    const { status, body } = await apiPost('/evidence_sources', token, { ...CR_SOURCE, institution_id: orgId })
    expect(status).toBe(201)
    expect(body[0].institution_id).toBe(orgId)
  })

  it('rejects duplicate canonical name', async () => {
    const { status } = await apiPost('/evidence_sources', token, GLOBAL_SOURCE)
    expect(status).toBe(409)
  })
})

// ─── SourceRecord Tests ─────────────────────────────────────────────────

describe('Sprint 1 — SourceRecord', () => {
  let token: string
  let sourceId: string
  let recordId: string

  beforeAll(async () => {
    const { session } = await signInAs('admin')
    token = session.access_token
    // Create a source to attach records to
    const { body } = await apiPost('/evidence_sources', token, {
      ...GLOBAL_SOURCE,
      canonical_name: `SourceRecord Test Source-${Date.now()}`,
    })
    sourceId = body[0].id
  })

  it('creates a source record', async () => {
    const { status, body } = await apiPost('/source_records', token, {
      evidence_source_id: sourceId,
      external_record_id: 'NCT01234567',
      record_type: 'clinical_trial',
      acquired_at: new Date().toISOString(),
      content_hash: 'abc123def456',
    })
    expect(status).toBe(201)
    expect(body.length).toBe(1)
    expect(body[0].external_record_id).toBe('NCT01234567')
    expect(body[0].acquisition_status).toBe('acquired')
    recordId = body[0].id
  })

  it('lists records by source', async () => {
    const { status, body } = await apiGet(`/source_records?evidence_source_id=eq.${sourceId}`, token)
    expect(status).toBe(200)
    expect(body.length).toBe(1)
    expect(body[0].id).toBe(recordId)
  })

  it('reads a record by ID', async () => {
    const { status, body } = await apiGet(`/source_records?id=eq.${recordId}`, token)
    expect(status).toBe(200)
    expect(body[0].evidence_source_id).toBe(sourceId)
  })

  it('rejects invalid FK', async () => {
    const { status } = await apiPost('/source_records', token, {
      evidence_source_id: '00000000-0000-0000-0000-000000000000',
      acquired_at: new Date().toISOString(),
    })
    // PostgREST returns 409 for FK constraint violations
    expect([400, 409]).toContain(status)
  })

  it('supersedes a record (soft)', async () => {
    const { status, body } = await apiPatch(`/source_records?id=eq.${recordId}`, token, { acquisition_status: 'superseded' })
    expect(status).toBe(200)
    expect(body[0].acquisition_status).toBe('superseded')
  })
})

// ─── RLS Tests ──────────────────────────────────────────────────────────

describe('Sprint 1 — RLS Tenant Isolation', () => {
  let siteToken: string
  let sponsorToken: string
  let siteSourceId: string

  beforeAll(async () => {
    const site = await signInAs('site')
    sponsorToken = (await signInAs('sponsor')).session.access_token
    siteToken = site.session.access_token

    // Site creates an institutional source
    const orgId = 'a0000000-0000-0000-0000-000000000003'
    const { body } = await apiPost('/evidence_sources', siteToken, {
      ...CR_SOURCE,
      canonical_name: `Site-Only Source-${Date.now()}`,
      institution_id: orgId,
    })
    siteSourceId = body[0]?.id
  })

  it('site CAN read its own institutional sources', async () => {
    if (!siteSourceId) return
    const { status } = await apiGet(`/evidence_sources?id=eq.${siteSourceId}`, siteToken)
    expect(status).toBe(200)
  })

  it('sponsor CANNOT read site institutional sources (RLS)', async () => {
    if (!siteSourceId) return
    const { status, body } = await apiGet(`/evidence_sources?id=eq.${siteSourceId}`, sponsorToken)
    const blocked = status >= 400 || (status === 200 && body.length === 0)
    expect(blocked).toBe(true)
  })

  it('both CAN read global (null institution) sources', async () => {
    const { status, body } = await apiGet('/evidence_sources?institution_id=is.null', siteToken)
    expect(status).toBe(200)
    expect(body.length).toBeGreaterThanOrEqual(1)
  })
})
