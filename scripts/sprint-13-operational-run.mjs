#!/usr/bin/env node
/**
 * Sprint 13 — Operational validation runner (no product code changes).
 * Executes 5 Kadarn pilots via API using Supabase SSR cookie sessions.
 */
import { createServerClient } from '@supabase/ssr'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SUPABASE_URL = 'http://localhost:54321'
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const API = 'http://localhost:3001'
const PASS = 'test-password-123'

const ORG = {
  sponsor: 'a1000000-0000-0000-0000-000000000030',
  biobank: 'a1000000-0000-0000-0000-000000000010',
  hospital: 'a1000000-0000-0000-0000-000000000020',
  lab: 'a1000000-0000-0000-0000-000000000040',
  courier: 'a1000000-0000-0000-0000-000000000050',
}

const reportDir = join(process.env.TEMP || '/tmp', 'kadarn-execution-gate')
mkdirSync(reportDir, { recursive: true })

async function signIn(email) {
  const cookies = []
  const supabase = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => cookies,
      setAll: (toSet) => {
        for (const c of toSet) {
          const i = cookies.findIndex((x) => x.name === c.name)
          if (i >= 0) cookies[i] = { name: c.name, value: c.value }
          else cookies.push({ name: c.name, value: c.value })
        }
      },
    },
  })
  const { error } = await supabase.auth.signInWithPassword({ email, password: PASS })
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`)
  await supabase.auth.getUser()
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ')
}

async function api(cookie, path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Cookie: cookie,
    },
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  return { status: res.status, json, ok: res.ok }
}

function idFrom(json) {
  return json?.data?.id ?? json?.id ?? null
}

async function runPilot(num, name, fn) {
  const lines = [`Pilot ${num} — ${name}`]
  const log = (msg) => {
    console.log(msg)
    lines.push(msg)
  }
  const ok = (msg) => log(`OK: ${msg}`)
  const fail = (msg) => {
    log(`FAIL: ${msg}`)
    throw new Error(msg)
  }

  console.log(`\n========== Pilot ${num}: ${name} ==========`)
  try {
    await fn({ log, ok, fail, api: (cookie, path, opts) => api(cookie, path, opts), idFrom })
    lines.push('RESULT: PASS')
    writeFileSync(join(reportDir, `pilot${num}-report.txt`), lines.join('\n'))
    return true
  } catch (e) {
    lines.push(`RESULT: FAIL — ${e.message}`)
    writeFileSync(join(reportDir, `pilot${num}-report.txt`), lines.join('\n'))
    console.error(`❌ Pilot ${num} FAILED:`, e.message)
    return false
  }
}

// ─── Pilot 1: Prospective Biospecimen Collection ───────────────────────────
async function pilot1(ctx) {
  const cookie = await signIn('sponsor.pm@demo.kadarn.io')
  ctx.ok('Authenticated sponsor.pm@demo.kadarn.io')

  const profile = await ctx.api(cookie, '/api/v1/workspace/profile')
  if (profile.status !== 200) ctx.fail(`Profile ${profile.status}`)
  ctx.ok('Workspace profile loaded')

  const prog = await ctx.api(cookie, '/api/v1/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'S13 — NSCLC Biomarker Validation',
      short_name: 'S13-NSCLC',
      description: 'Prospective collection of NSCLC FFPE specimens.',
      status: 'active',
      sponsor_org_id: ORG.sponsor,
      default_data_scope: 'de_identified',
    }),
  })
  const progId = ctx.idFrom(prog.json)
  if (!progId) ctx.fail(`Create program: ${prog.status} ${JSON.stringify(prog.json).slice(0, 120)}`)
  ctx.ok(`Program ${progId}`)

  for (const p of [
    { organization_id: ORG.hospital, role: 'contributor' },
    { organization_id: ORG.biobank, role: 'contributor' },
    { organization_id: ORG.lab, role: 'processor' },
    { organization_id: ORG.courier, role: 'processor' },
  ]) {
    const r = await ctx.api(cookie, `/api/v1/programs/${progId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    if (!r.ok) ctx.fail(`Participant ${p.organization_id}: ${r.status}`)
  }
  ctx.ok('4 participants added')

  for (const ms of [
    { milestone_type: 'irb_submission', title: 'IRB Submission', planned_end_date: '2026-08-01' },
    { milestone_type: 'collection_start', title: 'Collection Start', planned_end_date: '2026-10-01' },
    { milestone_type: 'data_delivery', title: 'Data Delivery', planned_end_date: '2027-02-01' },
  ]) {
    const r = await ctx.api(cookie, `/api/v1/programs/${progId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ms),
    })
    if (!r.ok) ctx.fail(`Milestone: ${r.status}`)
  }
  ctx.ok('Milestones created')

  const col = await ctx.api(cookie, '/api/v1/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      program_id: progId,
      name: 'S13 NSCLC Collection',
      target_enrollment: 50,
      status: 'active',
    }),
  })
  const colId = ctx.idFrom(col.json)
  if (!colId) ctx.fail(`Collection: ${col.status}`)
  ctx.ok(`Collection ${colId}`)

  for (let i = 1; i <= 3; i++) {
    const r = await ctx.api(cookie, '/api/v1/specimens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_id: `S13-SPEC-${String(i).padStart(4, '0')}`,
        specimen_type: 'ffpe',
        collection_id: colId,
        program_id: progId,
        organization_id: ORG.hospital,
        status: 'collected',
        properties: { tissue_type: 'lung' },
      }),
    })
    if (!r.ok) ctx.fail(`Specimen ${i}: ${r.status}`)
  }
  ctx.ok('3 specimens created')

  const prov = await ctx.api(cookie, '/api/v1/operations/provenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      program_id: progId,
      nodes: [
        { node_type: 'organization', external_id: 'COL-S13-001', label: 'Collection event' },
        { node_type: 'shipment', external_id: 'SH-S13-001', label: 'Shipment to lab' },
      ],
      edges: [
        { edge_type: 'shipped_via', source_external_id: 'COL-S13-001', target_external_id: 'SH-S13-001' },
      ],
    }),
  })
  if (!prov.ok) ctx.fail(`Provenance: ${prov.status}`)
  ctx.ok('Provenance recorded')

  const ship = await ctx.api(cookie, '/api/v1/shipments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      program_id: progId,
      organization_id: ORG.courier,
      shipment_name: 'S13 Shipment 001',
      shipment_type: 'ffpe_blocks',
      carrier: 'FedEx',
      status: 'pending',
    }),
  })
  const shipId = ctx.idFrom(ship.json)
  if (!shipId) ctx.fail(`Shipment: ${ship.status}`)
  const delivered = await ctx.api(cookie, `/api/v1/shipments/${shipId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'delivered', temperature_excursion: false }),
  })
  if (!delivered.ok) ctx.fail(`Deliver shipment: ${delivered.status}`)
  ctx.ok(`Shipment ${shipId} delivered`)

  const kpe = await ctx.api(cookie, `/api/v1/programs/${progId}/kpe`)
  if (!kpe.ok) ctx.fail(`KPE: ${kpe.status}`)
  ctx.ok(`KPE score: ${kpe.json?.data?.kpe_score ?? 'n/a'}`)

  const req = await ctx.api(cookie, '/api/v1/marketplace/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'S13 Settlement Request',
      target_org_ids: [ORG.biobank],
      requested_sample_count: 50,
      program_id: progId,
    }),
  })
  const reqId = ctx.idFrom(req.json)
  if (!reqId) ctx.fail(`Request: ${req.status}`)

  const deal = await ctx.api(cookie, '/api/v1/exchange/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: reqId,
      sponsor_org_id: ORG.sponsor,
      provider_org_id: ORG.biobank,
      program_id: progId,
      title: 'S13 Agreement',
      total_value: 150000,
      sample_count_expected: 50,
    }),
  })
  const dealId = ctx.idFrom(deal.json)
  if (!dealId) ctx.fail(`Deal: ${deal.status}`)
  const settle = await ctx.api(cookie, `/api/v1/exchange/deals/${dealId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed', escrow_action: 'release_full' }),
  })
  if (!settle.ok) ctx.fail(`Settlement: ${settle.status}`)
  ctx.ok(`Deal ${dealId} settled`)

  const activity = await ctx.api(cookie, '/api/v1/koc/activity')
  ctx.ok(`Activity feed: ${activity.json?.data?.length ?? 0} events`)
}

// ─── Pilot 2: Retrospective FFPE Request ─────────────────────────────────────
async function pilot2(ctx) {
  const cookie = await signIn('sponsor.pm@demo.kadarn.io')
  ctx.ok('Authenticated')

  const search = await ctx.api(cookie, '/api/v1/marketplace/specimens?q=ffpe&limit=5')
  if (!search.ok) ctx.fail(`Search: ${search.status}`)
  const count = search.json?.data?.results?.length ?? 0
  if (count === 0) ctx.fail('No FFPE marketplace results')
  const firstItem = search.json.data.results[0].id
  ctx.ok(`Search: ${count} results`)

  const feas = await ctx.api(cookie, '/api/v1/marketplace/feasibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      program_name: 'S13 FFPE Cohort',
      therapeutic_area: 'Oncology',
      disease_label: 'Breast cancer',
      required_sample_types: ['ffpe'],
      estimated_sample_count: 100,
    }),
  })
  if (!feas.ok) ctx.fail(`Feasibility: ${feas.status}`)
  ctx.ok(`Feasibility ${ctx.idFrom(feas.json)}`)

  const req = await ctx.api(cookie, '/api/v1/marketplace/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'S13 FFPE Access',
      supply_item_id: firstItem,
      target_org_ids: [ORG.biobank],
      requested_sample_count: 50,
    }),
  })
  const reqId = ctx.idFrom(req.json)
  if (!reqId) ctx.fail(`Request: ${req.status}`)
  ctx.ok(`Request ${reqId}`)

  const deal = await ctx.api(cookie, '/api/v1/exchange/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: reqId,
      sponsor_org_id: ORG.sponsor,
      provider_org_id: ORG.biobank,
      title: 'S13 FFPE Agreement',
      total_value: 75000,
      sample_count_expected: 50,
    }),
  })
  const dealId = ctx.idFrom(deal.json)
  if (!dealId) ctx.fail(`Deal: ${deal.status}`)
  const active = await ctx.api(cookie, `/api/v1/exchange/deals/${dealId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mta_signed: true, status: 'active' }),
  })
  if (!active.ok) ctx.fail(`MTA: ${active.status}`)
  ctx.ok(`Deal ${dealId} active`)

  const ship = await ctx.api(cookie, '/api/v1/shipments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: ORG.courier,
      shipment_name: 'S13 FFPE Shipment',
      shipment_type: 'ffpe_blocks',
      carrier: 'FedEx',
      status: 'pending',
    }),
  })
  const shipId = ctx.idFrom(ship.json)
  if (!shipId) ctx.fail(`Shipment: ${ship.status}`)
  await ctx.api(cookie, `/api/v1/shipments/${shipId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'delivered' }),
  })
  ctx.ok(`Shipment ${shipId} delivered`)

  const prov = await ctx.api(cookie, '/api/v1/operations/provenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodes: [{ node_type: 'specimen', external_id: 'FFPE-S13-001', label: 'FFPE block' }],
      edges: [],
    }),
  })
  if (!prov.ok) ctx.fail(`Provenance: ${prov.status}`)
  ctx.ok('Provenance recorded')

  const policy = await ctx.api(cookie, '/api/v1/koc/policy')
  ctx.ok(`Policy dashboard: ${policy.status}`)
}

// ─── Pilot 3: Hospital Onboarding ──────────────────────────────────────────
async function pilot3(ctx) {
  const cookie = await signIn('hospital.coordinator@demo.kadarn.io')
  ctx.ok('Authenticated hospital coordinator')

  const org = await ctx.api(cookie, '/api/v1/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'S13 District General Hospital',
      legal_name: 'S13 District General NHS Trust',
      country: 'GB',
      region: 'North West England',
      description: 'New hospital onboarding pilot',
    }),
  })
  const orgId = ctx.idFrom(org.json)
  if (!orgId) ctx.fail(`Create org: ${org.status} ${JSON.stringify(org.json).slice(0, 120)}`)
  ctx.ok(`Organization ${orgId}`)

  const profile = await ctx.api(cookie, '/api/v1/workspace/profile')
  if (profile.status !== 200) ctx.fail(`Profile: ${profile.status}`)
  const memCount = profile.json?.data?.memberships?.length ?? 0
  if (memCount === 0) ctx.fail('Auto-membership missing')
  ctx.ok(`Memberships: ${memCount}`)

  const caps = await ctx.api(cookie, `/api/v1/organizations/${orgId}/capabilities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capability_keys: ['clinical_site', 'biobank'] }),
  })
  if (!caps.ok) ctx.fail(`Capabilities: ${caps.status}`)
  ctx.ok('Capabilities assigned')

  const invite = await ctx.api(cookie, `/api/v1/organizations/${orgId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pathologist.s13@demo.kadarn.io', role: 'member' }),
  })
  if (!invite.ok) ctx.fail(`Invite: ${invite.status}`)
  ctx.ok(`Invite ${ctx.idFrom(invite.json)}`)

  const nav = await ctx.api(cookie, '/api/v1/workspace/navigation')
  ctx.ok(`Navigation: ${nav.json?.data?.sections?.length ?? 0} sections`)

  const supply = await ctx.api(cookie, '/api/v1/marketplace/supply-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'prospective_collection',
      title: 'S13 Colorectal Collection',
      sample_types: ['ffpe'],
      disease_label: 'Colorectal Cancer',
      country: 'GB',
    }),
  })
  if (!supply.ok) ctx.fail(`Supply item: ${supply.status}`)
  ctx.ok('Marketplace supply item published')

  const dash = await ctx.api(cookie, '/api/v1/koc/platform-health')
  ctx.ok(`Platform health: ${dash.status}`)
}

// ─── Pilot 4: Biobank Onboarding ─────────────────────────────────────────────
async function pilot4(ctx) {
  const cookie = await signIn('biobank.admin@demo.kadarn.io')
  ctx.ok('Authenticated biobank admin')

  const org = await ctx.api(cookie, '/api/v1/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'S13 Regional Biorepository',
      legal_name: 'S13 Regional Biorepository Foundation',
      country: 'DE',
      region: 'Bavaria',
    }),
  })
  const orgId = ctx.idFrom(org.json)
  if (!orgId) ctx.fail(`Create org: ${org.status}`)
  ctx.ok(`Organization ${orgId}`)

  const caps = await ctx.api(cookie, `/api/v1/organizations/${orgId}/capabilities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capability_keys: ['biobank'] }),
  })
  if (!caps.ok) ctx.fail(`Capability: ${caps.status}`)
  ctx.ok('Biobank capability')

  const invite = await ctx.api(cookie, `/api/v1/organizations/${orgId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'curator.s13@demo.kadarn.io', role: 'member' }),
  })
  if (!invite.ok) ctx.fail(`Invite: ${invite.status}`)
  ctx.ok('Staff invited')

  for (const item of [
    {
      type: 'existing_collection',
      title: 'S13 Leukemia Whole Blood Cohort',
      sample_types: ['whole_blood'],
      disease_label: 'Acute Myeloid Leukemia',
      country: 'DE',
    },
    {
      type: 'laboratory_service',
      title: 'S13 Flow Cytometry Panel',
      service_categories: ['flow_cytometry'],
      country: 'DE',
    },
  ]) {
    const r = await ctx.api(cookie, '/api/v1/marketplace/supply-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (!r.ok) ctx.fail(`Supply item: ${r.status}`)
  }
  ctx.ok('Supply items published')

  const search = await ctx.api(cookie, '/api/v1/marketplace/specimens?q=leukemia&country=DE')
  ctx.ok(`Marketplace search: ${search.json?.data?.results?.length ?? 0} hits`)

  const trust = await ctx.api(cookie, '/api/v1/operations/trust')
  ctx.ok(`Trust endpoint: ${trust.status}`)

  const eco = await ctx.api(cookie, '/api/v1/koc/ecosystem')
  ctx.ok(`Ecosystem dashboard: ${eco.status}`)
}

// ─── Pilot 5: Research Sponsor Program ─────────────────────────────────────
async function pilot5(ctx) {
  const cookie = await signIn('sponsor.pm@demo.kadarn.io')
  ctx.ok('Authenticated sponsor')

  const org = await ctx.api(cookie, '/api/v1/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'S13 NovaBio Therapeutics',
      legal_name: 'S13 NovaBio Therapeutics Inc.',
      country: 'US',
      region: 'Massachusetts',
    }),
  })
  const orgId = ctx.idFrom(org.json)
  if (!orgId) ctx.fail(`Create org: ${org.status}`)
  ctx.ok(`Organization ${orgId}`)

  const caps = await ctx.api(cookie, `/api/v1/organizations/${orgId}/capabilities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capability_keys: ['sponsor'] }),
  })
  if (!caps.ok) ctx.fail(`Capability: ${caps.status}`)
  ctx.ok('Sponsor capability')

  const invite = await ctx.api(cookie, `/api/v1/organizations/${orgId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cra.s13@demo.kadarn.io', role: 'member' }),
  })
  if (!invite.ok) ctx.fail(`Invite: ${invite.status}`)
  ctx.ok('Team invited')

  const prog = await ctx.api(cookie, '/api/v1/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'S13 Liquid Biopsy Trial',
      short_name: 'S13-LB-001',
      status: 'active',
      sponsor_org_id: orgId,
      default_data_scope: 'pseudonymized',
    }),
  })
  const progId = ctx.idFrom(prog.json)
  if (!progId) ctx.fail(`Program: ${prog.status}`)
  ctx.ok(`Program ${progId}`)

  for (const p of [
    { organization_id: ORG.hospital, role: 'contributor' },
    { organization_id: ORG.biobank, role: 'contributor' },
    { organization_id: ORG.lab, role: 'processor' },
  ]) {
    const r = await ctx.api(cookie, `/api/v1/programs/${progId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    if (!r.ok) ctx.fail(`Participant: ${r.status}`)
  }
  ctx.ok('Participants added')

  for (const ms of [
    { milestone_type: 'irb_submission', title: 'IRB', planned_end_date: '2026-09-01' },
    { milestone_type: 'collection_start', title: 'Enrollment', planned_end_date: '2026-11-15' },
  ]) {
    const r = await ctx.api(cookie, `/api/v1/programs/${progId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ms),
    })
    if (!r.ok) ctx.fail(`Milestone: ${r.status}`)
  }
  ctx.ok('Milestones created')

  const kpe = await ctx.api(cookie, `/api/v1/programs/${progId}/kpe`)
  if (!kpe.ok) ctx.fail(`KPE: ${kpe.status}`)
  ctx.ok(`KPE: ${kpe.json?.data?.kpe_score ?? 'n/a'}`)

  const req = await ctx.api(cookie, '/api/v1/marketplace/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'S13 Specimen Access',
      target_org_ids: [ORG.biobank],
      requested_sample_count: 240,
      program_id: progId,
    }),
  })
  const reqId = ctx.idFrom(req.json)
  if (!reqId) ctx.fail(`Request: ${req.status}`)

  const deal = await ctx.api(cookie, '/api/v1/exchange/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: reqId,
      sponsor_org_id: orgId,
      provider_org_id: ORG.biobank,
      program_id: progId,
      title: 'S13 Supply Agreement',
      total_value: 320000,
      sample_count_expected: 240,
    }),
  })
  const dealId = ctx.idFrom(deal.json)
  if (!dealId) ctx.fail(`Deal: ${deal.status}`)
  const mta = await ctx.api(cookie, `/api/v1/exchange/deals/${dealId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mta_signed: true, status: 'active' }),
  })
  if (!mta.ok) ctx.fail(`MTA: ${mta.status}`)
  ctx.ok(`Deal ${dealId} active`)

  const detail = await ctx.api(cookie, `/api/v1/programs/${progId}`)
  const parts = await ctx.api(cookie, `/api/v1/programs/${progId}/participants`)
  ctx.ok(`Program visible, participants: ${parts.json?.data?.length ?? 0}`)
}

const pilots = [
  [1, 'Prospective Biospecimen Collection', pilot1],
  [2, 'Retrospective FFPE Request', pilot2],
  [3, 'Hospital Onboarding', pilot3],
  [4, 'New Biobank Onboarding', pilot4],
  [5, 'Research Sponsor Program', pilot5],
]

const health = await fetch(`${API}/api/health`)
if (!health.ok) {
  console.error('API not reachable on', API)
  process.exit(1)
}
console.log('API health:', await health.json())

const results = []
for (const [num, name, fn] of pilots) {
  results.push(await runPilot(num, name, fn))
}

console.log('\n========== SCORECARD ==========')
pilots.forEach(([num, name], i) => {
  console.log(`${num}. ${name}: ${results[i] ? 'PASS' : 'FAIL'}`)
})
const pass = results.filter(Boolean).length
console.log(`Total: ${pass}/5 passed`)
console.log('Reports:', reportDir)

process.exit(pass === 5 ? 0 : 1)
