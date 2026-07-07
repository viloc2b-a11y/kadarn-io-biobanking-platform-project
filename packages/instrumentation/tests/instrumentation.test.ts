import { describe, expect, it, beforeEach } from 'vitest'
import {
  resolveRequestContext,
  runWithContext,
  getCorrelationId,
  getRequestId,
  parseTraceId,
} from '../src/context.js'
import { MetricsRegistry } from '../src/metrics.js'
import { KadarnError, handleInstrumentedError } from '../src/index.js'
import { runWithContextAsync } from '../src/context.js'

describe('resolveRequestContext', () => {
  it('generates IDs when headers absent', () => {
    const req = new Request('http://localhost/api/test')
    const ctx = resolveRequestContext(req)
    expect(ctx.requestId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(ctx.correlationId).toBe(ctx.requestId)
  })

  it('preserves incoming headers', () => {
    const req = new Request('http://localhost/api/test', {
      headers: {
        'x-request-id': 'req-123',
        'x-correlation-id': 'corr-456',
        traceparent: '00-abc123def456789012345678901234-abcd1234-01',
      },
    })
    const ctx = resolveRequestContext(req)
    expect(ctx.requestId).toBe('req-123')
    expect(ctx.correlationId).toBe('corr-456')
    expect(ctx.traceId).toBe('abc123def456789012345678901234')
  })
})

describe('AsyncLocalStorage context', () => {
  it('propagates correlation ID within runWithContext', () => {
    const ctx = { requestId: 'r1', correlationId: 'c1', service: 'test' }
    runWithContext(ctx, () => {
      expect(getRequestId()).toBe('r1')
      expect(getCorrelationId()).toBe('c1')
    })
  })
})

describe('MetricsRegistry', () => {
  let registry: MetricsRegistry

  beforeEach(() => {
    registry = new MetricsRegistry()
  })

  it('exports prometheus text for HTTP counters', () => {
    registry.recordHttpRequest('GET', '/api/health', 200, 12)
    const text = registry.toPrometheusText()
    expect(text).toContain('kadarn_http_requests_total')
    expect(text).toContain('method="GET"')
  })

  it('records error counter for 4xx/5xx', () => {
    registry.recordHttpRequest('POST', '/api/v1/test', 500, 50)
    expect(registry.toPrometheusText()).toContain('kadarn_http_errors_total')
  })
})

describe('handleInstrumentedError', () => {
  it('returns unified envelope for KadarnError', async () => {
    const ctx = { requestId: 'r1', correlationId: 'c1', service: 'test' }
    await runWithContextAsync(ctx, async () => {
      const res = handleInstrumentedError(new KadarnError('AUTH_UNAUTHORIZED', 'Unauthorized'))
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.ok).toBe(false)
      expect(body.error.code).toBe('AUTH_UNAUTHORIZED')
      expect(body.request_id).toBe('r1')
      expect(body.correlation_id).toBe('c1')
    })
  })
})

describe('parseTraceId', () => {
  it('extracts trace id from W3C traceparent', () => {
    expect(parseTraceId('00-abc123def456789012345678901234-abcd1234-01')).toBe('abc123def456789012345678901234')
  })
})
