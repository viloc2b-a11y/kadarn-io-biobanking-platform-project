// ==========================================================================
// Connector Layer — Registry (Sprint 23A)
// ==========================================================================

import type { ConnectorAdapter, ConnectorHealthStatus, ConnectorRegistryEntry, ProviderId } from '../types/types.js'

export class ConnectorRegistry {
  private adapters = new Map<ProviderId, ConnectorAdapter>()

  register(adapter: ConnectorAdapter): void {
    const provider = adapter.metadata.provider
    if (this.adapters.has(provider)) {
      throw new Error(`Connector already registered: ${provider}`)
    }
    this.adapters.set(provider, adapter)
  }

  get(provider: ProviderId): ConnectorAdapter {
    const adapter = this.adapters.get(provider)
    if (!adapter) throw new Error(`No connector registered for: ${provider}`)
    return adapter
  }

  has(provider: ProviderId): boolean {
    return this.adapters.has(provider)
  }

  list(): ConnectorRegistryEntry[] {
    return Array.from(this.adapters.entries()).map(([provider, adapter]) => ({
      provider,
      adapter,
      registered_at: new Date().toISOString(),
    }))
  }

  async healthAll(): Promise<ConnectorHealthStatus[]> {
    const statuses: ConnectorHealthStatus[] = []
    for (const [, adapter] of this.adapters) {
      try {
        statuses.push(await adapter.health())
      } catch {
        statuses.push({
          provider: adapter.metadata.provider,
          health: 'unavailable',
          response_time_ms: 0,
          last_success_at: null,
          last_error_at: new Date().toISOString(),
          last_error_message: 'Health check failed',
          retry_count: 0,
          checked_at: new Date().toISOString(),
        })
      }
    }
    return statuses
  }

  get size(): number {
    return this.adapters.size
  }
}

export const connectorRegistry = new ConnectorRegistry()
