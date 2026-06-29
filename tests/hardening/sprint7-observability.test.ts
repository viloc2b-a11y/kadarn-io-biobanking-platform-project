// ==========================================================================
// Sprint 7 — Observability: static integration gate
// ==========================================================================

import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  incrementCounter,
  observeHistogram,
  renderPrometheusText,
  resetMetrics,
  logInfo,
  initObservability,
  resetObservability,
  getObservabilityStatus,
  METRIC_PIPELINE_RUNS,
  SPAN_PIPELINE_STAGE,
} from '../../packages/telemetry/src/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const API_ROOT = path.join(REPO_ROOT, 'apps/api/src')
const TELEMETRY_ROOT = path.join(REPO_ROOT, 'packages/telemetry/src')

describe('Sprint 7 — telemetry package', () => {
  it('exports structured logger, metrics, and observability init', () => {
    const index = fs.readFileSync(path.join(TELEMETRY_ROOT, 'index.ts'), 'utf-8')
    expect(index).toContain('./logger')
    expect(index).toContain('./metrics')
    expect(index).toContain('./observability')
    expect(index).toContain('SPAN_PIPELINE_STAGE')
    expect(index).toContain('METRIC_PIPELINE_RUNS')
  })

  it('metrics render Prometheus text format', () => {
    resetMetrics()
    incrementCounter('kadarn_test_counter', { env: 'test' })
    observeHistogram('kadarn_test_hist', 42, { env: 'test' })
    const text = renderPrometheusText()
    expect(text).toContain('# TYPE kadarn_test_counter counter')
    expect(text).toContain('kadarn_test_counter{env="test"} 1')
    expect(text).toContain('# TYPE kadarn_test_hist histogram')
  })

  it('structured logs emit JSON lines', () => {
    const lines: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
      lines.push(msg)
    })
    logInfo('test.event', { correlationId: 'corr-1' })
    spy.mockRestore()
    expect(lines.length).toBeGreaterThan(0)
    const parsed = JSON.parse(lines[0]!)
    expect(parsed.msg).toBe('test.event')
    expect(parsed.correlationId).toBe('corr-1')
    expect(parsed.level).toBe('info')
  })

  it('observability init is idempotent', () => {
    resetObservability()
    const a = initObservability()
    const b = initObservability()
    expect(a.metrics).toBe('enabled')
    expect(b.logging).toBe('structured')
    expect(getObservabilityStatus().tracing).toBeDefined()
    resetObservability()
  })
})

describe('Sprint 7 — API health and metrics endpoints', () => {
  it('liveness endpoint reports hardening version and observability', () => {
    const source = fs.readFileSync(path.join(API_ROOT, 'app/api/health/route.ts'), 'utf-8')
    expect(source).toMatch(/1\.0\.0-hardening\.\d+/)
    expect(source).toContain('getObservabilityStatus')
    expect(source).toContain('uptime_seconds')
  })

  it('readiness endpoint exists with dependency checks', () => {
    const source = fs.readFileSync(path.join(API_ROOT, 'app/api/health/ready/route.ts'), 'utf-8')
    expect(source).toContain('runReadinessChecks')
    expect(source).toContain('SPAN_HEALTH_CHECK')
  })

  it('metrics endpoint exposes Prometheus exposition', () => {
    const source = fs.readFileSync(path.join(API_ROOT, 'app/api/metrics/route.ts'), 'utf-8')
    expect(source).toContain('renderPrometheusText')
    expect(source).toContain('text/plain')
    expect(source).toContain('authorizeMetricsScrape')
  })

  it('instrumentation bootstraps observability on startup', () => {
    const source = fs.readFileSync(path.join(API_ROOT, 'instrumentation.ts'), 'utf-8')
    expect(source).toContain('initObservability')
  })
})

describe('Sprint 7 — pipeline telemetry wired', () => {
  it('stage handlers record metrics and structured logs', () => {
    const source = fs.readFileSync(
      path.join(API_ROOT, 'lib/orchestration/stage-handlers.ts'),
      'utf-8',
    )
    expect(source).toContain('observeHistogram')
    expect(source).toContain('METRIC_PIPELINE_STAGE_DURATION')
    expect(source).toContain('logInfo')
    expect(source).toContain('pipeline.completed')
  })

  it('orchestrator increments pipeline run counter', () => {
    const source = fs.readFileSync(path.join(API_ROOT, 'lib/engine-orchestrator.ts'), 'utf-8')
    expect(source).toContain('METRIC_PIPELINE_RUNS')
  })

  it('event runtime increments domain event counter', () => {
    const source = fs.readFileSync(path.join(API_ROOT, 'lib/event-runtime.ts'), 'utf-8')
    expect(source).toContain('METRIC_DOMAIN_EVENTS')
  })
})

describe('Sprint 7 — observability stack artifacts', () => {
  it('technology evaluation document exists', () => {
    const doc = fs.readFileSync(path.join(REPO_ROOT, 'observability/EVALUATION.md'), 'utf-8')
    expect(doc).toContain('OpenTelemetry')
    expect(doc).toContain('Grafana')
    expect(doc).toContain('Prometheus')
    expect(doc).toContain('Loki')
    expect(doc).toContain('Tempo')
  })

  it('optional docker compose includes Prometheus and Grafana', () => {
    const compose = fs.readFileSync(path.join(REPO_ROOT, 'observability/docker-compose.yml'), 'utf-8')
    expect(compose).toContain('prometheus')
    expect(compose).toContain('grafana')
  })

  it('alert rules define readiness and latency alerts', () => {
    const alerts = fs.readFileSync(path.join(REPO_ROOT, 'observability/prometheus/alerts.yml'), 'utf-8')
    expect(alerts).toContain('KadarnNotReady')
    expect(alerts).toContain('KadarnHighPipelineLatency')
  })

  it('Grafana dashboard JSON exists', () => {
    const dash = fs.readFileSync(
      path.join(REPO_ROOT, 'observability/grafana/dashboards/kadarn-platform.json'),
      'utf-8',
    )
    expect(dash).toContain('kadarn_pipeline_runs_total')
    expect(dash).toContain('kadarn_health_checks_total')
  })
})