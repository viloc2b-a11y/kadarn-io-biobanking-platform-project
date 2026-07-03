import { describe, it, expect } from 'vitest'
import {
  formatGateReport,
  runLegacyEquivalenceGate,
  runPassportGate,
  runInstitutionPublicGate,
  runDiscoveryDashboardGate,
  runDiscoveryReportGate,
  runCutoverReadinessCheck,
} from './gate-runner.js'
import { VIEW_PENDING_ROUTES } from '@kadarn/published-view'

/**
 * Phase 8 Legacy Equivalence Gate (28J → 28K)
 * Orchestrates staging golden fixtures across all migrated external surfaces.
 */
describe('Phase 8 Legacy Equivalence Gate 28J→28K', () => {
  it('passport surface passes staging golden fixture', () => {
    const result = runPassportGate()
    expect(result.errors, result.errors.join('\n')).toEqual([])
    expect(result.passed).toBe(true)
  })

  it('institution public surface passes staging golden fixture', () => {
    const result = runInstitutionPublicGate()
    expect(result.errors, result.errors.join('\n')).toEqual([])
    expect(result.passed).toBe(true)
  })

  it('discovery dashboard surface passes staging golden fixture', () => {
    const result = runDiscoveryDashboardGate()
    expect(result.errors, result.errors.join('\n')).toEqual([])
    expect(result.passed).toBe(true)
  })

  it('discovery report surface passes staging golden fixture', () => {
    const result = runDiscoveryReportGate()
    expect(result.errors, result.errors.join('\n')).toEqual([])
    expect(result.passed).toBe(true)
  })

  it('LEGACY_PASSPORT_ENABLED=false cutover readiness check passes', () => {
    const result = runCutoverReadinessCheck()
    expect(result.errors, result.errors.join('\n')).toEqual([])
    expect(result.passed).toBe(true)
  })

  it('/institution/profile remains explicitly deferred (not in gate scope)', () => {
    expect(VIEW_PENDING_ROUTES).toContain('/api/v1/institution/profile')
    expect(VIEW_PENDING_ROUTES).toHaveLength(1)
  })

  it('full gate report — all external surfaces PASS', () => {
    const report = runLegacyEquivalenceGate()

    expect(report.allPassed).toBe(true)
    expect(report.cutoverReady).toBe(true)
    expect(report.compatibilityLayerRetained).toBe(true)
    expect(report.deferredRoutes).toContain('/api/v1/institution/profile')
    expect(report.migratedRoutes).toHaveLength(4)

    const external = report.surfaces.filter(s => s.surface !== 'cutover_readiness')
    expect(external.every(s => s.passed)).toBe(true)

    // Visible in CI logs for gate sign-off
    console.log('\n' + formatGateReport(report))
  })
})
