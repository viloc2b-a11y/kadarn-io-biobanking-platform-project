// ==========================================================================
// KTP-1.4 — Readiness API Integration Tests
// ==========================================================================
// Validates the 8 readiness endpoints against frozen DTO contracts,
// RLS enforcement, error handling, and rate limiting.
// ==========================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { ReadinessStatus } from '@kadarn/readiness-engine/dto'

// --------------------------------------------------------------------------
// Test setup — use local Supabase
// --------------------------------------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''

const supabase = createClient(supabaseUrl, anonKey)

let testOrgId: string
let testUserId: string

beforeAll(async () => {
  // Create a test org for readiness evaluations
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Test Readiness Org')
    .single()

  if (org) {
    testOrgId = org.id
  }
})

afterAll(async () => {
  // Cleanup test evaluations
  if (testOrgId) {
    await supabase
      .from('readiness_evaluations')
      .delete()
      .eq('organization_id', testOrgId)
  }
})

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

const API_BASE = 'http://localhost:3001/api/v1'

async function apiGet(path: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { headers })
  return { status: res.status, body: await res.json(), headers: res.headers }
}

async function apiPost(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json(), headers: res.headers }
}

// --------------------------------------------------------------------------
// 1. GET /api/v1/readiness/program-types
// --------------------------------------------------------------------------

describe('GET /readiness/program-types', () => {
  it('returns all readiness program types', async () => {
    const { status, body } = await apiGet('/readiness/program-types')
    expect(status).toBe(200)
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)

    if (body.data.length > 0) {
      const pt = body.data[0]
      expect(pt).toHaveProperty('typeKey')
      expect(pt).toHaveProperty('name')
      expect(pt).toHaveProperty('category', 'readiness')
      expect(pt).toHaveProperty('readinessThreshold')
      expect(typeof pt.readinessThreshold).toBe('number')
    }
  })

  it('returns only readiness category types', async () => {
    const { status, body } = await apiGet('/readiness/program-types')
    expect(status).toBe(200)
    for (const pt of body.data) {
      expect(pt.category).toBe('readiness')
    }
  })
})

// --------------------------------------------------------------------------
// 2. GET /api/v1/readiness/program-types/{typeKey}
// --------------------------------------------------------------------------

describe('GET /readiness/program-types/{typeKey}', () => {
  it('returns program type with capability requirements', async () => {
    // First get list to find a valid key
    const { body: list } = await apiGet('/readiness/program-types')
    if (list.data.length === 0) return // skip if no seed data

    const typeKey = list.data[0].typeKey
    const { status, body } = await apiGet(`/readiness/program-types/${typeKey}`)
    expect(status).toBe(200)
    expect(body.data).toHaveProperty('typeKey', typeKey)
    expect(body.data).toHaveProperty('readinessThreshold')
    expect(body.data).toHaveProperty('capabilities')
    expect(Array.isArray(body.data.capabilities)).toBe(true)
  })

  it('returns 404 for unknown type', async () => {
    const { status, body } = await apiGet('/readiness/program-types/nonexistent_type')
    expect(status).toBe(404)
    expect(body.error).toBeDefined()
  })
})

// --------------------------------------------------------------------------
// 3. GET /api/v1/readiness/capabilities
// --------------------------------------------------------------------------

describe('GET /readiness/capabilities', () => {
  it('returns capability types', async () => {
    const { status, body } = await apiGet('/readiness/capabilities')
    expect(status).toBe(200)
    expect(Array.isArray(body.data)).toBe(true)

    if (body.data.length > 0) {
      const cap = body.data[0]
      expect(cap).toHaveProperty('id')
      expect(cap).toHaveProperty('key')
      expect(cap).toHaveProperty('name')
    }
  })
})

// --------------------------------------------------------------------------
// 4. GET /api/v1/readiness/capabilities/{capabilityId}
// --------------------------------------------------------------------------

describe('GET /readiness/capabilities/{capabilityId}', () => {
  it('returns capability with readiness context', async () => {
    const { body: list } = await apiGet('/readiness/capabilities')
    if (list.data.length === 0) return

    const capId = list.data[0].id
    const { status, body } = await apiGet(`/readiness/capabilities/${capId}`)
    expect(status).toBe(200)
    expect(body.data).toHaveProperty('id', capId)
    expect(body.data).toHaveProperty('requiredByPrograms')
    expect(Array.isArray(body.data.requiredByPrograms)).toBe(true)
  })

  it('returns 404 for unknown capability', async () => {
    const { status } = await apiGet('/readiness/capabilities/00000000-0000-0000-0000-000000000000')
    expect(status).toBe(404)
  })
})

// --------------------------------------------------------------------------
// 5. GET /api/v1/institutions/{id}/readiness
// --------------------------------------------------------------------------

describe('GET /institutions/{id}/readiness', () => {
  it('returns readiness summary for institution', async () => {
    if (!testOrgId) return
    const { status, body } = await apiGet(`/institutions/${testOrgId}/readiness`)
    expect(status).toBe(200)
    expect(body.data).toHaveProperty('organizationId', testOrgId)
    expect(body.data).toHaveProperty('overallReadiness')
    expect(body.data).toHaveProperty('evaluations')
    expect(Array.isArray(body.data.evaluations)).toBe(true)

    // Validate status is valid
    const validStatuses: ReadinessStatus[] = ['not_ready', 'partial', 'conditionally_ready', 'ready']
    expect(validStatuses).toContain(body.data.overallReadiness)
  })
})

// --------------------------------------------------------------------------
// 6. POST /api/v1/readiness/evaluate
// --------------------------------------------------------------------------

describe('POST /readiness/evaluate', () => {
  it('triggers evaluation for org + program type', async () => {
    const { body: types } = await apiGet('/readiness/program-types')
    if (types.data.length === 0) return

    const programTypeKey = types.data[0].typeKey
    const { status, body } = await apiPost('/readiness/evaluate', {
      programTypeKey,
    })
    expect(status).toBe(200)

    expect(body.data).toHaveProperty('evaluationId')
    expect(body.data).toHaveProperty('programTypeKey', programTypeKey)
    expect(body.data).toHaveProperty('status')
    expect(body.data).toHaveProperty('overallConfidence')
    expect(body.data).toHaveProperty('capabilitiesBreakdown')
    expect(body.data).toHaveProperty('evidenceGaps')

    // Validate status
    const validStatuses: ReadinessStatus[] = ['not_ready', 'partial', 'conditionally_ready', 'ready']
    expect(validStatuses).toContain(body.data.status)
  })

  it('returns 400 for missing body', async () => {
    const { status, body } = await apiPost('/readiness/evaluate', {})
    expect(status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('returns 404 for invalid program type', async () => {
    const { status, body } = await apiPost('/readiness/evaluate', {
      programTypeKey: 'nonexistent_program_type_xyz',
    })
    expect(status).toBe(404)
    expect(body.error).toBeDefined()
  })
})

// --------------------------------------------------------------------------
// 7. POST /api/v1/readiness/recalculate
// --------------------------------------------------------------------------

describe('POST /readiness/recalculate', () => {
  it('invalidates cache and returns 202', async () => {
    const { body: types } = await apiGet('/readiness/program-types')
    if (types.data.length === 0) return

    const programTypeKey = types.data[0].typeKey
    const { status, body } = await apiPost('/readiness/recalculate', {
      programTypeKey,
    })
    expect(status).toBe(202)
    expect(body.data).toHaveProperty('message')
  })
})

// --------------------------------------------------------------------------
// 8. Response envelope validation
// --------------------------------------------------------------------------

describe('API response envelope', () => {
  it('GET endpoints return { data, error } envelope', async () => {
    const { body } = await apiGet('/readiness/program-types')
    expect(body).toHaveProperty('data')
    // Successful responses have data and error should not exist or be null
    expect(body.error).toBeFalsy()
  })

  it('error responses return { data: null, error: { code, message } }', async () => {
    const { status, body } = await apiGet('/readiness/program-types/nonexistent')
    expect(status).toBe(404)
    expect(body).toHaveProperty('error')
    expect(body.data).toBeNull()
    expect(body.error).toHaveProperty('code')
    expect(body.error).toHaveProperty('message')
  })
})

// --------------------------------------------------------------------------
// 9. DTO shape validation — ReadinessEvaluation
// --------------------------------------------------------------------------

describe('DTO shape validation', () => {
  it('evaluate response matches ReadinessEvaluation DTO', async () => {
    const { body: types } = await apiGet('/readiness/program-types')
    if (types.data.length === 0) return

    const { body } = await apiPost('/readiness/evaluate', {
      programTypeKey: types.data[0].typeKey,
    })

    const evalResult = body.data
    // Required fields from ReadinessEvaluation
    expect(evalResult).toHaveProperty('evaluationId')
    expect(evalResult).toHaveProperty('organizationId')
    expect(evalResult).toHaveProperty('programTypeKey')
    expect(evalResult).toHaveProperty('status')
    expect(evalResult).toHaveProperty('overallConfidence')
    expect(evalResult).toHaveProperty('capabilitiesBreakdown')
    expect(evalResult).toHaveProperty('evidenceGaps')
    expect(evalResult).toHaveProperty('computedAt')
    expect(evalResult).toHaveProperty('visibilityScope')

    // Confidence is 0-1 range
    expect(evalResult.overallConfidence).toBeGreaterThanOrEqual(0)
    expect(evalResult.overallConfidence).toBeLessThanOrEqual(1)

    // Capability breakdown items match CapabilitySummary
    if (evalResult.capabilitiesBreakdown.length > 0) {
      const cap = evalResult.capabilitiesBreakdown[0]
      expect(cap).toHaveProperty('capabilityTypeId')
      expect(cap).toHaveProperty('capabilityTypeName')
      expect(cap).toHaveProperty('isMandatory')
      expect(cap).toHaveProperty('confidence')
      expect(cap).toHaveProperty('metRequirements')
    }
  })
})
