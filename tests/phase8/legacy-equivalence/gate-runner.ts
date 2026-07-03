/**
 * Phase 8 Legacy Equivalence Gate runner (28J→28K).
 * Loads staging golden fixtures and validates legacy vs Published View parity.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LegacyReadAdapter,
  PublishedViewService,
  buildAllEngineOutputs,
  buildDiscoveryReportDirect,
  VIEW_MIGRATED_ROUTES,
  VIEW_PENDING_ROUTES,
  type AgentOutputMap,
  type LegacyPassportBundle,
} from '@kadarn/published-view'

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

export interface SurfaceResult {
  surface: string
  route: string
  passed: boolean
  errors: string[]
}

export interface GateReport {
  gateId: '28J-28K'
  timestamp: string
  fixtureSource: 'staging-anonymized'
  surfaces: SurfaceResult[]
  allPassed: boolean
  cutoverReady: boolean
  legacyAdapterDefault: true
  deferredRoutes: readonly string[]
  migratedRoutes: readonly string[]
  compatibilityLayerRetained: true
}

export function stripVolatileTimestamps<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, val) => {
      if (
        key === 'last_updated'
        || key === 'generated_at'
        || key === 'generation_timestamp'
      ) return '[timestamp]'
      if (key === 'provenance' && typeof val === 'string') return '[provenance]'
      return val
    }),
  ) as T
}

function loadFixture<T>(filename: string): T {
  const raw = readFileSync(join(FIXTURES_DIR, filename), 'utf8')
  return JSON.parse(raw) as T
}

export function runPassportGate(): SurfaceResult {
  const surface = 'passport'
  const route = '/api/v1/continuity/passport/:slug'
  const errors: string[] = []

  try {
    const fixture = loadFixture<{
      input: LegacyPassportBundle
      expected_legacy_response: {
        profile: { headline: string, summary: string, slug: string }
        claim_count: number
        claims_ordered_by_confidence_desc: boolean
        verification_labels: string[]
      }
    }>('staging-passport.json')

    const adapter = new LegacyReadAdapter()
    const views = adapter.adaptPassport(fixture.input, 'public')
    const response = adapter.toLegacyPassportResponse(fixture.input, views)
    const expected = fixture.expected_legacy_response

    if (response.profile.headline !== expected.profile.headline) {
      errors.push(`profile.headline: expected "${expected.profile.headline}", got "${response.profile.headline}"`)
    }
    if (response.profile.slug !== expected.profile.slug) {
      errors.push(`profile.slug mismatch`)
    }
    if (response.claims.length !== expected.claim_count) {
      errors.push(`claim count: expected ${expected.claim_count}, got ${response.claims.length}`)
    }

    if (expected.claims_ordered_by_confidence_desc) {
      for (let i = 1; i < response.claims.length; i++) {
        if ((response.claims[i - 1]?.confidence ?? 0) < (response.claims[i]?.confidence ?? 0)) {
          errors.push('claims not ordered by confidence descending')
          break
        }
      }
    }

    const labels = response.claims.map(c => c.verification)
    for (const label of expected.verification_labels) {
      if (!labels.includes(label)) {
        errors.push(`missing verification label: ${label}`)
      }
    }

    const svc = new PublishedViewService()
    const viaService = svc.getPassportResponse(fixture.input)
    if (viaService.claims.length !== response.claims.length) {
      errors.push('PublishedViewService passport claim count mismatch vs adapter')
    }
  }
  catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
  }

  return { surface, route, passed: errors.length === 0, errors }
}

export function runInstitutionPublicGate(): SurfaceResult {
  const surface = 'institution_public'
  const route = '/api/v1/institution/public/:slug'
  const errors: string[] = []

  try {
    const fixture = loadFixture<{
      input: {
        org: { id: string, name: string, city?: string, state?: string, description?: string }
        slug: string
        sessionId: string
        agentOutputs: AgentOutputMap
      }
    }>('staging-institution-public.json')

    const { org, slug, sessionId, agentOutputs } = fixture.input
    const legacyDirect = buildAllEngineOutputs(agentOutputs)

    const svc = new PublishedViewService()
    const viaViews = svc.getInstitutionPublicResponse({
      org,
      slug,
      agentOutputs: JSON.parse(JSON.stringify(agentOutputs)) as AgentOutputMap,
      sessionId,
    })

    if (viaViews.institution_name !== org.name) {
      errors.push('institution_name mismatch')
    }
    if (viaViews.institution_slug !== slug) {
      errors.push('institution_slug mismatch')
    }

    const expectedLocation = [org.city, org.state].filter(Boolean).join(', ')
    if (viaViews.location !== expectedLocation) {
      errors.push(`location: expected "${expectedLocation}", got "${viaViews.location}"`)
    }

    if (
      JSON.stringify(stripVolatileTimestamps(viaViews.capabilities))
      !== JSON.stringify(stripVolatileTimestamps(legacyDirect.capabilityIntelligence))
    ) {
      errors.push('capabilities section differs from direct engine output')
    }
    if (
      JSON.stringify(stripVolatileTimestamps(viaViews.assessment))
      !== JSON.stringify(stripVolatileTimestamps(legacyDirect.assessmentIntelligence))
    ) {
      errors.push('assessment section differs from direct engine output')
    }
    if (viaViews.gaps !== null) {
      errors.push('gaps must remain null on public institution surface')
    }
    if (viaViews.recommendations !== null) {
      errors.push('recommendations must remain null on public institution surface')
    }
  }
  catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
  }

  return { surface, route, passed: errors.length === 0, errors }
}

export function runDiscoveryDashboardGate(): SurfaceResult {
  const surface = 'discovery_dashboard'
  const route = '/api/v1/discovery/dashboard'
  const errors: string[] = []

  try {
    const fixture = loadFixture<{
      input: {
        orgId: string
        sessionId: string
        agentOutputs: AgentOutputMap
        candidates: Array<Record<string, unknown>>
      }
    }>('staging-discovery-dashboard.json')

    const { orgId, sessionId, agentOutputs, candidates } = fixture.input
    const before = JSON.parse(JSON.stringify(agentOutputs)) as AgentOutputMap
    const beforeCandidates = JSON.parse(JSON.stringify(candidates)) as Array<Record<string, unknown>>

    const svc = new PublishedViewService()
    const adapted = svc.adaptDiscoveryDashboard({
      orgId,
      sessionId,
      agentOutputs: before,
      candidates: beforeCandidates,
    })

    if (
      JSON.stringify(adapted.agentOutputs['capability_detector']?.output)
      !== JSON.stringify(before['capability_detector']?.output)
    ) {
      errors.push('capability_detector output mutated after view adaptation')
    }
    if (
      JSON.stringify(adapted.agentOutputs['claim_candidate_detector']?.output)
      !== JSON.stringify(before['claim_candidate_detector']?.output)
    ) {
      errors.push('claim_candidate_detector output mutated after view adaptation')
    }
    if (JSON.stringify(adapted.candidates) !== JSON.stringify(beforeCandidates)) {
      errors.push('candidates array mutated after view adaptation')
    }

    const capCount =
      (before['capability_detector']?.output as { capabilities?: unknown[] } | undefined)
        ?.capabilities?.length ?? 0
    const candCount =
      (before['claim_candidate_detector']?.output as { candidates?: unknown[] } | undefined)
        ?.candidates?.length ?? 0
    const candidateRowCount = beforeCandidates.length
    const expectedViewCount = capCount + candCount + candidateRowCount

    if (adapted.views.length !== expectedViewCount) {
      errors.push(`expected ${expectedViewCount} published views, got ${adapted.views.length}`)
    }
    if (!adapted.views.every(v => v.adapter_version === 'discovery-read:1.0.0')) {
      errors.push('discovery views missing expected adapter_version')
    }
  }
  catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
  }

  return { surface, route, passed: errors.length === 0, errors }
}

export function runDiscoveryReportGate(): SurfaceResult {
  const surface = 'discovery_report'
  const route = '/api/v1/discovery/report'
  const errors: string[] = []

  try {
    const fixture = loadFixture<{
      input: {
        orgId: string
        sessionId: string
        institutionName: string
        artifactsProcessed: number
        sessionCount: number
        agentOutputs: AgentOutputMap
      }
    }>('staging-discovery-report.json')

    const input = {
      ...fixture.input,
      agentOutputs: JSON.parse(JSON.stringify(fixture.input.agentOutputs)) as AgentOutputMap,
    }

    const legacyDirect = buildDiscoveryReportDirect(input)
    const viaPublishedView = new PublishedViewService().getDiscoveryReport(input)

    if (
      JSON.stringify(stripVolatileTimestamps(viaPublishedView))
      !== JSON.stringify(stripVolatileTimestamps(legacyDirect))
    ) {
      errors.push('report body differs from direct engine output after stripVolatileTimestamps')
    }
    if (!viaPublishedView.executive_summary.includes(input.institutionName)) {
      errors.push('executive_summary missing institution name')
    }
  }
  catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
  }

  return { surface, route, passed: errors.length === 0, errors }
}

/** Validates cutover flag behavior without removing Compatibility Layer code */
export function runCutoverReadinessCheck(): SurfaceResult {
  const surface = 'cutover_readiness'
  const route = 'LEGACY_PASSPORT_ENABLED=false'
  const errors: string[] = []

  try {
    const fixture = loadFixture<{ input: LegacyPassportBundle }>('staging-passport.json')
    const svcWithLegacy = new PublishedViewService({ legacyAdapterEnabled: true })
    const svcCutover = new PublishedViewService({ legacyAdapterEnabled: false })

    if (!svcWithLegacy.isLegacyAdapterEnabled()) {
      errors.push('default legacy adapter should be enabled when legacyAdapterEnabled=true')
    }
    if (svcCutover.isLegacyAdapterEnabled()) {
      errors.push('legacy adapter must disable when legacyAdapterEnabled=false')
    }

    const withLegacy = svcWithLegacy.getPassportResponse(fixture.input)
    const withoutLegacy = svcCutover.getPassportResponse(fixture.input)

    if (withLegacy.claims.length === 0) {
      errors.push('legacy-enabled path returned zero claims for staging fixture')
    }

    // Post-cutover native path may return empty until native views populated — document parity
    if (withoutLegacy.claims.length > withLegacy.claims.length) {
      errors.push('cutover path returned more claims than legacy adapter (unexpected)')
    }

    // Adapter code path must remain importable for rollback
    const adapter = new LegacyReadAdapter()
    const rollbackViews = adapter.adaptPassport(fixture.input, 'public')
    if (rollbackViews.length === 0) {
      errors.push('LegacyReadAdapter rollback path must still produce views')
    }
  }
  catch (e) {
    errors.push(e instanceof Error ? e.message : String(e))
  }

  return { surface, route, passed: errors.length === 0, errors }
}

export function runLegacyEquivalenceGate(): GateReport {
  const surfaces = [
    runPassportGate(),
    runInstitutionPublicGate(),
    runDiscoveryDashboardGate(),
    runDiscoveryReportGate(),
    runCutoverReadinessCheck(),
  ]

  const externalSurfaces = surfaces.filter(s => s.surface !== 'cutover_readiness')
  const allExternalPassed = externalSurfaces.every(s => s.passed)
  const cutoverCheck = surfaces.find(s => s.surface === 'cutover_readiness')

  return {
    gateId: '28J-28K',
    timestamp: new Date().toISOString(),
    fixtureSource: 'staging-anonymized',
    surfaces,
    allPassed: allExternalPassed && (cutoverCheck?.passed ?? false),
    cutoverReady: allExternalPassed && (cutoverCheck?.passed ?? false),
    legacyAdapterDefault: true,
    deferredRoutes: VIEW_PENDING_ROUTES,
    migratedRoutes: VIEW_MIGRATED_ROUTES,
    compatibilityLayerRetained: true,
  }
}

export function formatGateReport(report: GateReport): string {
  const lines: string[] = [
    `# Phase 8 Legacy Equivalence Gate Report — ${report.gateId}`,
    '',
    `**Timestamp:** ${report.timestamp}`,
    `**Fixture source:** ${report.fixtureSource}`,
    `**Overall:** ${report.allPassed ? 'PASS' : 'FAIL'}`,
    `**Cutover ready:** ${report.cutoverReady ? 'YES' : 'NO'}`,
    '',
    '## Surfaces',
    '',
    '| Surface | Route | Result | Errors |',
    '|---------|-------|--------|--------|',
  ]

  for (const s of report.surfaces) {
    const err = s.errors.length ? s.errors.join('; ') : '—'
    lines.push(`| ${s.surface} | ${s.route} | ${s.passed ? 'PASS' : 'FAIL'} | ${err} |`)
  }

  lines.push(
    '',
    '## Deferred (not in gate scope)',
    '',
    ...report.deferredRoutes.map(r => `- ${r} — internal authenticated, deferred past 28K gate`),
    '',
    '## Migrated external surfaces',
    '',
    ...report.migratedRoutes.map(r => `- ${r}`),
    '',
    `**Compatibility Layer retained:** ${report.compatibilityLayerRetained}`,
    '',
  )

  return lines.join('\n')
}
