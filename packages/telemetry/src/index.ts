// ==========================================================================
// Kadarn Telemetry — Public API
// ==========================================================================

export {
  getTracer,
  setTracer,
  resetTracer,
  withTracing,
  withAsyncTracing,
  getTraceContext,
  createChildContext,
} from './tracer';

export {
  log,
  logDebug,
  logInfo,
  logWarn,
  logError,
} from './logger';

export type { LogLevel, LogFields } from './logger';

export {
  incrementCounter,
  observeHistogram,
  renderPrometheusText,
  getMetricsSnapshot,
  resetMetrics,
} from './metrics';

export type { MetricLabels, MetricsSnapshot } from './metrics';

export {
  initObservability,
  getObservabilityStatus,
  resetObservability,
} from './observability';

export type { ObservabilityStatus } from './observability';

export { RecordingTracer, isTracingEnabled, getActiveTraceContext } from './recording-tracer';

export type {
  Span,
  SpanAttributes,
  SpanAttributeValue,
  SpanKind,
  SpanStatus,
  SpanStatusCode,
  Tracer,
  TraceContext,
  TraceableFunction,
} from './types';

/** Trace an API request handler. */
export const SPAN_API_REQUEST = 'kadarn.api.request' as const;

/** Trace a policy evaluation (shadow or enforcement). */
export const SPAN_POLICY_EVALUATION = 'kadarn.policy.evaluation' as const;

/** Trace a provenance correction. */
export const SPAN_PROVENANCE_CORRECTION = 'kadarn.provenance.correction' as const;

/** Trace a provenance integrity status resolution. */
export const SPAN_INTEGRITY_RESOLUTION = 'kadarn.provenance.integrity' as const;

/** Trace a workflow activity execution. */
export const SPAN_WORKFLOW_ACTIVITY = 'kadarn.workflow.activity' as const;

/** Trace an engine pipeline stage. */
export const SPAN_PIPELINE_STAGE = 'kadarn.pipeline.stage' as const;

/** Trace health/readiness checks. */
export const SPAN_HEALTH_CHECK = 'kadarn.health.check' as const;

/** Standard metric names */
export const METRIC_HTTP_REQUESTS = 'kadarn_http_requests_total' as const;
export const METRIC_PIPELINE_RUNS = 'kadarn_pipeline_runs_total' as const;
export const METRIC_PIPELINE_STAGE_DURATION = 'kadarn_pipeline_stage_duration_ms' as const;
export const METRIC_DOMAIN_EVENTS = 'kadarn_domain_events_published_total' as const;
export const METRIC_HEALTH_CHECKS = 'kadarn_health_checks_total' as const;
