process.env.LEGACY_PASSPORT_ENABLED = 'false'

/**
 * Phase 8 staging cutover smoke — full DB validation when Supabase is running.
 *
 * Usage:
 *   SUPABASE_URL=http://127.0.0.1:55421 SUPABASE_ANON_KEY=... npm run staging:cutover-smoke -w tests
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PublishedViewService,
  buildAllEngineOutputs,
  buildDiscoveryReportDirect,
  VIEW_PENDING_ROUTES,
  type AgentOutputMap,
  type LegacyPassportBundle,
} from '@kadarn/published-view'
import { stripVolatileTimestamps } from '../phase8/legacy-equivalence/gate-runner.js'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../phase8/legacy-equivalence/fixtures')
const API_URL = process.env.STAGING_API_URL ?? 'http://127.0.0.1:3001'
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:55421'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const STAGING_ORG = 'a0000000-0000-0000-0000-000000000004'
const STAGING_SESSION = '00000000-0000-4000-8000-000000000401'
const STAGING_PASSPORT_SLUG = 'national-biobank-staging'

interface SmokeResult {
  check: string
  passed: boolean
  detail: string
}

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf8')) as T
}

async function signInBiobank(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email: 'biobank@kadarn.test', password: 'Test123!' }),
  })
  if (!res.ok) {
    throw new Error(`auth failed: ${res.status} ${await res.text()}`)
  }
  const json = await res.json() as { access_token?: string }
  if (!json.access_token) throw new Error('no access_token from auth')
  return json.access_token
}

async function setActiveOrg(token: string, orgId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/workspace/active-org`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ org_id: orgId }),
  })
  if (!res.ok && res.status !== 409) {
    throw new Error(`active-org failed: ${res.status} ${await res.text()}`)
  }
  // JWT metadata is refreshed on re-login after admin metadata update.
  return signInBiobank()
}

function runInProcessSmoke(): SmokeResult[] {
  const results: SmokeResult[] = []
  const svc = new PublishedViewService({ legacyAdapterEnabled: false })

  results.push({
    check: 'cutover_flag_disabled',
    passed: !svc.isLegacyAdapterEnabled(),
    detail: `legacyAdapterEnabled=${svc.isLegacyAdapterEnabled()}`,
  })

  const passportFixture = loadJson<{ input: LegacyPassportBundle }>('staging-passport.json')
  const passport = svc.getPassportResponse(passportFixture.input)
  results.push({
    check: 'inprocess_passport_non_empty',
    passed: passport.claims.length > 0,
    detail: `claims=${passport.claims.length}`,
  })

  const instFixture = loadJson<{
    input: {
      org: { id: string, name: string, city?: string, state?: string, description?: string }
      slug: string
      sessionId: string
      agentOutputs: AgentOutputMap
    }
  }>('staging-institution-public.json')
  const inst = svc.getInstitutionPublicResponse(instFixture.input)
  const legacyInst = buildAllEngineOutputs(instFixture.input.agentOutputs)
  results.push({
    check: 'inprocess_institution_parity',
    passed: JSON.stringify(stripVolatileTimestamps(inst.capabilities))
      === JSON.stringify(stripVolatileTimestamps(legacyInst.capabilityIntelligence)),
    detail: inst.institution_name,
  })

  const dashFixture = loadJson<{
    input: { orgId: string, sessionId: string, agentOutputs: AgentOutputMap, candidates: Array<Record<string, unknown>> }
  }>('staging-discovery-dashboard.json')
  const before = JSON.parse(JSON.stringify(dashFixture.input.agentOutputs)) as AgentOutputMap
  const dash = svc.adaptDiscoveryDashboard({ ...dashFixture.input, agentOutputs: before })
  results.push({
    check: 'inprocess_dashboard_parity',
    passed: JSON.stringify(dash.agentOutputs['capability_detector']?.output)
      === JSON.stringify(before['capability_detector']?.output),
    detail: `views=${dash.views.length}`,
  })

  const repFixture = loadJson<{
    input: {
      orgId: string
      sessionId: string
      institutionName: string
      artifactsProcessed: number
      sessionCount: number
      agentOutputs: AgentOutputMap
    }
  }>('staging-discovery-report.json')
  const repInput = {
    ...repFixture.input,
    agentOutputs: JSON.parse(JSON.stringify(repFixture.input.agentOutputs)) as AgentOutputMap,
  }
  const report = svc.getDiscoveryReport(repInput)
  const legacyReport = buildDiscoveryReportDirect(repInput)
  results.push({
    check: 'inprocess_report_parity',
    passed: JSON.stringify(stripVolatileTimestamps(report))
      === JSON.stringify(stripVolatileTimestamps(legacyReport)),
    detail: repFixture.input.institutionName,
  })

  results.push({
    check: 'institution_profile_deferred',
    passed: VIEW_PENDING_ROUTES.includes('/api/v1/institution/profile'),
    detail: VIEW_PENDING_ROUTES.join(', '),
  })

  return results
}

async function runHttpSmoke(): Promise<SmokeResult[]> {
  const results: SmokeResult[] = []

  try {
    const statusRes = await fetch(`${API_URL}/api/v1/operations/phase8-cutover`)
    const statusJson = JSON.parse(await statusRes.text()) as {
      data?: { legacy_passport_enabled?: boolean, published_view_path?: string }
    }
    results.push({
      check: 'http_ops_endpoint_200',
      passed: statusRes.status === 200,
      detail: `status=${statusRes.status}`,
    })
    results.push({
      check: 'http_published_view_path_active',
      passed: statusJson.data?.published_view_path === 'active'
        && statusJson.data?.legacy_passport_enabled === false,
      detail: JSON.stringify(statusJson.data ?? {}),
    })

    const instRes = await fetch(`${API_URL}/api/v1/institution/public/${STAGING_ORG}`)
    const instJson = JSON.parse(await instRes.text()) as {
      data?: { institution_name?: string, capabilities?: unknown }
      error?: unknown
    }
    const caps = instJson.data?.capabilities as { capabilities?: unknown[] } | undefined
    const capCount = Array.isArray(caps?.capabilities) ? caps.capabilities.length : 0
    results.push({
      check: 'http_institution_public',
      passed: instRes.status === 200 && capCount > 0,
      detail: `status=${instRes.status} caps=${capCount} org=${instJson.data?.institution_name ?? 'n/a'}`,
    })

    let token = await signInBiobank()
    token = await setActiveOrg(token, STAGING_ORG)
    const authHeaders = { Authorization: `Bearer ${token}` }

    const passRes = await fetch(`${API_URL}/api/v1/continuity/passport/${STAGING_PASSPORT_SLUG}`, {
      headers: authHeaders,
    })
    const passJson = JSON.parse(await passRes.text()) as { data?: { claims?: unknown[] } }
    const claimCount = passJson.data?.claims?.length ?? 0
    results.push({
      check: 'http_passport',
      passed: passRes.status === 200 && claimCount > 0,
      detail: `status=${passRes.status} claims=${claimCount}`,
    })

    const dashRes = await fetch(
      `${API_URL}/api/v1/discovery/dashboard?sessionId=${STAGING_SESSION}`,
      { headers: authHeaders },
    )
    const dashJson = JSON.parse(await dashRes.text()) as {
      data?: { agentOutputs?: Record<string, unknown> }
    }
    const hasCaps = Boolean(dashJson.data?.agentOutputs?.['capability_detector'])
    results.push({
      check: 'http_discovery_dashboard',
      passed: dashRes.status === 200 && hasCaps,
      detail: `status=${dashRes.status} capability_detector=${hasCaps}`,
    })

    const repRes = await fetch(
      `${API_URL}/api/v1/discovery/report?sessionId=${STAGING_SESSION}`,
      { headers: authHeaders },
    )
    const repJson = JSON.parse(await repRes.text()) as { data?: { executive_summary?: string } }
    results.push({
      check: 'http_discovery_report',
      passed: repRes.status === 200 && Boolean(repJson.data?.executive_summary),
      detail: `status=${repRes.status} summary=${Boolean(repJson.data?.executive_summary)}`,
    })
  }
  catch (e) {
    results.push({
      check: 'http_smoke_error',
      passed: false,
      detail: e instanceof Error ? e.message : String(e),
    })
  }

  return results
}

async function main() {
  console.log('Phase 8 Staging Cutover Smoke (full DB validation)')
  console.log(`API=${API_URL} SUPABASE=${SUPABASE_URL}`)
  console.log(`LEGACY_PASSPORT_ENABLED=${process.env.LEGACY_PASSPORT_ENABLED ?? '(unset)'}`)
  console.log('')

  const inProcess = runInProcessSmoke()
  const http = await runHttpSmoke()
  const all = [...inProcess, ...http]

  for (const r of all) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'}  ${r.check}  —  ${r.detail}`)
  }

  const failed = all.filter(r => !r.passed)
  console.log('')
  if (failed.length === 0) {
    console.log('STAGING CUTOVER: PASS')
    process.exit(0)
  }

  console.log(`STAGING CUTOVER: FAIL (${failed.length} checks)`)
  process.exit(1)
}

main()
