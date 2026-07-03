// ==========================================================================
// Kadarn Document Intake Engine — Metrics / Observability
// ==========================================================================
// Sprint 27A — Lightweight in-process metrics for KDIE operations.
// No external dependencies. Counters and timers exposed for health checks.
// ==========================================================================

// ---------------------------------------------------------------------------
// Metric types
// ---------------------------------------------------------------------------

export interface IntakeMetrics {
  documents_received: number
  documents_normalized: number
  documents_failed: number
  provider_used: Record<string, number>
  provider_failed: Record<string, number>
  provider_timeout: Record<string, number>
  provider_fallback: Record<string, number>
  normalization_time_ms_total: number
  normalization_time_ms_max: number
  last_intake_at: string | null
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const metrics: IntakeMetrics = {
  documents_received: 0,
  documents_normalized: 0,
  documents_failed: 0,
  provider_used: {},
  provider_failed: {},
  provider_timeout: {},
  provider_fallback: {},
  normalization_time_ms_total: 0,
  normalization_time_ms_max: 0,
  last_intake_at: null,
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

export function recordDocumentReceived(): void {
  metrics.documents_received++
}

export function recordDocumentNormalized(provider: string, durationMs: number): void {
  metrics.documents_normalized++
  metrics.provider_used[provider] = (metrics.provider_used[provider] ?? 0) + 1
  metrics.normalization_time_ms_total += durationMs
  if (durationMs > metrics.normalization_time_ms_max) {
    metrics.normalization_time_ms_max = durationMs
  }
  metrics.last_intake_at = new Date().toISOString()
}

export function recordDocumentFailed(provider: string): void {
  metrics.documents_failed++
  metrics.provider_failed[provider] = (metrics.provider_failed[provider] ?? 0) + 1
}

export function recordProviderTimeout(provider: string): void {
  metrics.provider_timeout[provider] = (metrics.provider_timeout[provider] ?? 0) + 1
}

export function recordProviderFallback(provider: string): void {
  metrics.provider_fallback[provider] = (metrics.provider_fallback[provider] ?? 0) + 1
}

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

/**
 * Return a read-only snapshot of current intake metrics.
 * Safe for health endpoint exposure.
 */
export function getIntakeMetrics(): Readonly<IntakeMetrics> {
  return {
    ...metrics,
    provider_used: { ...metrics.provider_used },
    provider_failed: { ...metrics.provider_failed },
    provider_timeout: { ...metrics.provider_timeout },
    provider_fallback: { ...metrics.provider_fallback },
  }
}

/**
 * Reset all metrics (for testing).
 */
export function resetIntakeMetrics(): void {
  metrics.documents_received = 0
  metrics.documents_normalized = 0
  metrics.documents_failed = 0
  metrics.provider_used = {}
  metrics.provider_failed = {}
  metrics.provider_timeout = {}
  metrics.provider_fallback = {}
  metrics.normalization_time_ms_total = 0
  metrics.normalization_time_ms_max = 0
  metrics.last_intake_at = null
}
