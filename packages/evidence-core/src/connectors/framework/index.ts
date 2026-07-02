// ==========================================================================
// Connector Framework — Public API
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
// ==========================================================================

export { ConnectorOrchestrator } from './orchestrator.js';
export { withRetry, DEFAULT_RETRY_POLICY } from './retry.js';
export type { RetryPolicy } from './retry.js';
export { RateLimiter, SOURCE_RATE_LIMITS } from './rate-limiter.js';
export type { RateLimitConfig } from './rate-limiter.js';
export { buildProvenance } from './provenance.js';
export type { ProvenanceInput, BuiltProvenance } from './provenance.js';
export { InMemoryIdempotencyStore } from './idempotency.js';
export { MetricsCollector } from './metrics.js';
export type { ConnectorMetrics } from './metrics.js';
export type { IdempotencyStore } from './idempotency.js';
export type {
  EvidenceConnector,
  ConnectorManifest,
  ConnectorSearchParams,
  ExternalRecord,
  NormalizedRecord,
  ConnectorIngestResult,
} from './types.js';
export type { ConnectorLogEntry, OrchestratorDeps } from './orchestrator.js';
