// ==========================================================================
// Connector Layer — Types (Sprint 23A)
// ==========================================================================
// Canonical integration layer between Kadarn and external data providers.
// Infrastructure only — no business intelligence, no assessment.
// ==========================================================================

export type ProviderId =
  | 'clinicaltrials.gov'
  | 'pubmed'
  | 'crossref'
  | 'openalex'
  | 'orcid'
  | 'ror'
  | 'fda'

export type ConnectorHealth = 'healthy' | 'degraded' | 'unavailable'

export interface ConnectorMetadata {
  provider: ProviderId
  version: string
  base_url: string
  rate_limit_rpm: number
  retry_max: number
  timeout_ms: number
}

export interface ConnectorHealthStatus {
  provider: ProviderId
  health: ConnectorHealth
  response_time_ms: number
  last_success_at: string | null
  last_error_at: string | null
  last_error_message: string | null
  retry_count: number
  checked_at: string
}

export interface ConnectorResponse<T = Record<string, unknown>> {
  provider: ProviderId
  status: 'success' | 'degraded' | 'error'
  retrieved_at: string
  external_identifier: string
  normalized_payload: T
  metadata: {
    adapter_version: string
    processing_time_ms: number
    retry_attempts: number
  }
  warnings: string[]
  errors: string[]
}

export interface ConnectorAdapter {
  readonly metadata: ConnectorMetadata
  connect(): Promise<boolean>
  fetch(externalId: string, options?: Record<string, string>): Promise<ConnectorResponse>
  normalize(raw: unknown): Record<string, unknown>
  validate(payload: Record<string, unknown>): string[]
  health(): Promise<ConnectorHealthStatus>
}

export interface ConnectorRegistryEntry {
  provider: ProviderId
  adapter: ConnectorAdapter
  registered_at: string
}
