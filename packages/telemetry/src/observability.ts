// ==========================================================================
// Kadarn Telemetry — Observability bootstrap
// ==========================================================================

import { setTracer, resetTracer } from './tracer';
import { RecordingTracer, isTracingEnabled } from './recording-tracer';
import { resetMetrics } from './metrics';
import { logInfo } from './logger';

export interface ObservabilityStatus {
  tracing: 'enabled' | 'noop';
  metrics: 'enabled';
  logging: 'structured';
  otelExporterConfigured: boolean;
}

let initialized = false;

export function initObservability(): ObservabilityStatus {
  if (initialized) {
    return getObservabilityStatus();
  }

  if (isTracingEnabled()) {
    setTracer(new RecordingTracer());
    logInfo('observability.tracing.enabled', {
      otelEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? null,
    });
  }

  initialized = true;
  logInfo('observability.initialized', getObservabilityStatus() as unknown as Record<string, unknown>);
  return getObservabilityStatus();
}

export function getObservabilityStatus(): ObservabilityStatus {
  return {
    tracing: isTracingEnabled() ? 'enabled' : 'noop',
    metrics: 'enabled',
    logging: 'structured',
    otelExporterConfigured: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
  };
}

/** Reset observability state (tests only). */
export function resetObservability(): void {
  resetTracer();
  resetMetrics();
  initialized = false;
}
