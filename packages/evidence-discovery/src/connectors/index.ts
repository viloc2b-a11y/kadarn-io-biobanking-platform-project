// ==========================================================================
// Connector Layer — Public API (Sprint 23A)
// ==========================================================================

export { BaseConnectorAdapter } from './base/adapter.js'
export { ConnectorRegistry, connectorRegistry } from './registry/registry.js'

export type {
  ConnectorAdapter,
  ConnectorHealth,
  ConnectorHealthStatus,
  ConnectorMetadata,
  ConnectorRegistryEntry,
  ConnectorResponse,
  ProviderId,
} from './types/types.js'
