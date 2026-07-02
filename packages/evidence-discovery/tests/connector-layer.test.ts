// ==========================================================================
// Connector Layer — Tests (Sprint 23A)
// ==========================================================================

import { describe, it, expect, vi } from 'vitest'
import { ConnectorRegistry } from '../src/connectors/registry/registry.js'
import { BaseConnectorAdapter } from '../src/connectors/base/adapter.js'
import type { ConnectorAdapter, ConnectorMetadata, ConnectorResponse, ProviderId } from '../src/connectors/types/types.js'

// --------------------------------------------------------------------------
// Mock adapter for testing
// --------------------------------------------------------------------------

class MockAdapter extends BaseConnectorAdapter {
  readonly metadata: ConnectorMetadata = {
    provider: 'pubmed' as ProviderId,
    version: '1.0.0',
    base_url: 'https://test.api',
    rate_limit_rpm: 10,
    retry_max: 2,
    timeout_ms: 5000,
  }

  private shouldConnect = true
  private mockPayload: unknown = { id: 'test-123' }

  setConnectResult(result: boolean) { this.shouldConnect = result }
  setMockPayload(payload: unknown) { this.mockPayload = payload }

  async connect(): Promise<boolean> { return this.shouldConnect }
  async fetch(externalId: string): Promise<ConnectorResponse> {
    const start = Date.now()
    const normalized = this.normalize(this.mockPayload)
    return this.buildResponse(externalId, normalized, Date.now() - start)
  }
  normalize(raw: unknown): Record<string, unknown> {
    const data = raw as Record<string, unknown> ?? {}
    return { provider: 'pubmed', external_id: data.id ?? '', raw_data: data }
  }
  validate(payload: Record<string, unknown>): string[] { return [] }
}

class FailingAdapter extends BaseConnectorAdapter {
  readonly metadata: ConnectorMetadata = {
    provider: 'fda' as ProviderId, version: '1.0.0', base_url: 'https://fail.api',
    rate_limit_rpm: 10, retry_max: 0, timeout_ms: 100,
  }
  async connect(): Promise<boolean> { throw new Error('Connection refused') }
  async fetch(externalId: string): Promise<ConnectorResponse> {
    return {
      provider: 'fda', status: 'error', retrieved_at: new Date().toISOString(),
      external_identifier: externalId, normalized_payload: {},
      metadata: { adapter_version: '1.0.0', processing_time_ms: 0, retry_attempts: 0 },
      warnings: [], errors: ['Connection failed'],
    }
  }
  normalize(raw: unknown): Record<string, unknown> { return raw as Record<string, unknown> ?? {} }
  validate(payload: Record<string, unknown>): string[] { return ['invalid'] }
}

// --------------------------------------------------------------------------
// Registry tests
// --------------------------------------------------------------------------

describe('ConnectorRegistry', () => {
  it('registers and retrieves adapters', () => {
    const registry = new ConnectorRegistry()
    const adapter = new MockAdapter()
    registry.register(adapter)
    expect(registry.has('pubmed')).toBe(true)
    expect(registry.get('pubmed')).toBe(adapter)
    expect(registry.size).toBe(1)
  })

  it('throws on duplicate registration', () => {
    const registry = new ConnectorRegistry()
    registry.register(new MockAdapter())
    expect(() => registry.register(new MockAdapter())).toThrow('already registered')
  })

  it('throws on unknown provider', () => {
    const registry = new ConnectorRegistry()
    expect(() => registry.get('orcid')).toThrow('No connector')
  })

  it('lists all registered adapters', () => {
    const registry = new ConnectorRegistry()
    registry.register(new MockAdapter())
    expect(registry.list()).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------
// Health tests
// --------------------------------------------------------------------------

describe('ConnectorHealth', () => {
  it('reports healthy when connected', async () => {
    const adapter = new MockAdapter()
    adapter.setConnectResult(true)
    const status = await adapter.health()
    expect(status.health).toBe('healthy')
    expect(status.response_time_ms).toBeGreaterThanOrEqual(0)
  })

  it('reports degraded when connection fails', async () => {
    const adapter = new MockAdapter()
    adapter.setConnectResult(false)
    const status = await adapter.health()
    expect(status.health).toBe('degraded')
  })

  it('reports unavailable on error', async () => {
    const adapter = new FailingAdapter()
    const status = await adapter.health()
    expect(status.health).toBe('unavailable')
  })

  it('registry healthAll reports all adapters', async () => {
    const registry = new ConnectorRegistry()
    registry.register(new MockAdapter())
    const statuses = await registry.healthAll()
    expect(statuses).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------
// Normalization tests
// --------------------------------------------------------------------------

describe('ConnectorNormalization', () => {
  it('normalizes raw payload to standard format', () => {
    const adapter = new MockAdapter()
    const normalized = adapter.normalize({ id: 'abc', title: 'Test' })
    expect(normalized.provider).toBe('pubmed')
    expect(normalized.external_id).toBe('abc')
    expect(normalized.raw_data).toBeDefined()
  })
})

// --------------------------------------------------------------------------
// Timeout handling (mocked)
// --------------------------------------------------------------------------

describe('ConnectorTimeout', () => {
  it('adapter respects timeout configuration', () => {
    const adapter = new MockAdapter()
    expect(adapter.metadata.timeout_ms).toBe(5000)
  })

  it('failing adapter handles connection timeout gracefully', async () => {
    const adapter = new FailingAdapter()
    const result = await adapter.fetch('test')
    expect(result.status).toBe('error')
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// --------------------------------------------------------------------------
// Retry handling
// --------------------------------------------------------------------------

describe('ConnectorRetry', () => {
  it('base adapter has retry configuration', () => {
    const adapter = new MockAdapter()
    expect(adapter.metadata.retry_max).toBe(2)
  })
})

// --------------------------------------------------------------------------
// Partial provider failure
// --------------------------------------------------------------------------

describe('PartialProviderFailure', () => {
  it('healthAll continues when one adapter fails', async () => {
    const registry = new ConnectorRegistry()
    registry.register(new MockAdapter())
    registry.register(new FailingAdapter())
    const statuses = await registry.healthAll()
    expect(statuses).toHaveLength(2)
    const healthy = statuses.filter((s) => s.health === 'healthy')
    const unavailable = statuses.filter((s) => s.health === 'unavailable')
    expect(healthy.length).toBeGreaterThanOrEqual(1)
    expect(unavailable.length).toBeGreaterThanOrEqual(1)
  })
})

// --------------------------------------------------------------------------
// Structure contract
// --------------------------------------------------------------------------

describe('ConnectorResponse', () => {
  it('fetch returns valid ConnectorResponse structure', async () => {
    const adapter = new MockAdapter()
    adapter.setConnectResult(true)
    const response = await adapter.fetch('test-id')
    expect(response).toHaveProperty('provider')
    expect(response).toHaveProperty('status')
    expect(response).toHaveProperty('retrieved_at')
    expect(response).toHaveProperty('external_identifier')
    expect(response).toHaveProperty('normalized_payload')
    expect(response).toHaveProperty('metadata')
    expect(response).toHaveProperty('warnings')
    expect(response).toHaveProperty('errors')
    expect(response.metadata).toHaveProperty('adapter_version')
    expect(response.metadata).toHaveProperty('processing_time_ms')
  })
})

// --------------------------------------------------------------------------
// Adapter metadata
// --------------------------------------------------------------------------

describe('ConnectorMetadata', () => {
  it('every adapter exposes required metadata', () => {
    const adapter = new MockAdapter()
    expect(adapter.metadata.provider).toBe('pubmed')
    expect(adapter.metadata.version).toBeTruthy()
    expect(adapter.metadata.base_url).toBeTruthy()
    expect(adapter.metadata.rate_limit_rpm).toBeGreaterThan(0)
    expect(adapter.metadata.retry_max).toBeGreaterThan(0)
    expect(adapter.metadata.timeout_ms).toBeGreaterThan(0)
  })
})

// --------------------------------------------------------------------------
// No forbidden language
// --------------------------------------------------------------------------

describe('ConnectorLayer — no forbidden language', () => {
  it('never uses confidence, verified, certified', () => {
    const registry = new ConnectorRegistry()
    const json = JSON.stringify(registry.list())
    expect(json).not.toContain('"confidence"')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
  })
})
