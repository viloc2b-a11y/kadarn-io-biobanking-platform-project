// ==========================================================================
// Connector Layer — Public API (Sprint 23A)
// ==========================================================================

export { BaseConnectorAdapter } from './base/adapter'
export { ConnectorRegistry, connectorRegistry } from './registry/registry'

export type {
  ConnectorAdapter,
  ConnectorHealth,
  ConnectorHealthStatus,
  ConnectorMetadata,
  ConnectorRegistryEntry,
  ConnectorResponse,
  ProviderId,
} from './types/types'
