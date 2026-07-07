/**
 * AF-4.0 Sprint 4 — API benchmark smoke tests
 * Run: npm run test:performance -w tests
 */

import { describe, expect, it } from 'vitest'
import { PublishedViewService } from '@kadarn/published-view'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../phase8/legacy-equivalence/fixtures')

function bench<T>(name: string, fn: () => T, iterations = 100): { name: string; avgMs: number; p95Ms: number } {
  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }
  times.sort((a, b) => a - b)
  const avgMs = times.reduce((a, b) => a + b, 0) / times.length
  const p95Ms = times[Math.floor(times.length * 0.95)]
  return { name, avgMs, p95Ms }
}

describe('Performance benchmarks (in-process)', () => {
  it('passport Published View under 50ms p95 (100 iter)', () => {
    const svc = new PublishedViewService({ legacyAdapterEnabled: false })
    const fixture = JSON.parse(readFileSync(join(FIXTURES, 'staging-passport.json'), 'utf8'))
    const result = bench('passport', () => svc.getPassportResponse(fixture.input))
    expect(result.p95Ms).toBeLessThan(50)
  })

  it('institution public under 50ms p95', () => {
    const svc = new PublishedViewService({ legacyAdapterEnabled: false })
    const fixture = JSON.parse(readFileSync(join(FIXTURES, 'staging-institution-public.json'), 'utf8'))
    const result = bench('institution', () => svc.getInstitutionPublicResponse(fixture.input))
    expect(result.p95Ms).toBeLessThan(50)
  })

  it('discovery report under 100ms p95', () => {
    const svc = new PublishedViewService({ legacyAdapterEnabled: false })
    const fixture = JSON.parse(readFileSync(join(FIXTURES, 'staging-discovery-report.json'), 'utf8'))
    const input = { ...fixture.input, agentOutputs: structuredClone(fixture.input.agentOutputs) }
    const result = bench('report', () => svc.getDiscoveryReport(input))
    expect(result.p95Ms).toBeLessThan(100)
  })
})
