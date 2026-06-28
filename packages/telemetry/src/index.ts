// ==========================================================================
// Kadarn Telemetry — Public API
// ==========================================================================
// Minimal tracing abstraction. No-op by default.
// Replace setTracer() with a real OpenTelemetry tracer when ready.
// ==========================================================================

export {
  getTracer,
  setTracer,
  resetTracer,
  withTracing,
  withAsyncTracing,
  getTraceContext,
  createChildContext,
} from './tracer.js';

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
} from './types.js';

// --------------------------------------------------------------------------
// Predefined span names for the 4 KPE-08 trace points
// --------------------------------------------------------------------------

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
