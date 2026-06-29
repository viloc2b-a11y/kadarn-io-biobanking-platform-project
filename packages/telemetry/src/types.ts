// ==========================================================================
// Kadarn Telemetry — Type Definitions
// ==========================================================================
// OpenTelemetry-compatible types without the SDK dependency.
// The interface mirrors @opentelemetry/api at the conceptual level
// so migration to real OTel requires only replacing the factory.
// ==========================================================================

// --------------------------------------------------------------------------
// Span attributes
// --------------------------------------------------------------------------

export type SpanAttributeValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>;

export interface SpanAttributes {
  [key: string]: SpanAttributeValue | undefined;
}

// --------------------------------------------------------------------------
// Span kind
// --------------------------------------------------------------------------

export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

// --------------------------------------------------------------------------
// Span status
// --------------------------------------------------------------------------

export type SpanStatusCode = 'ok' | 'error' | 'unset';

export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

// --------------------------------------------------------------------------
// Span
// --------------------------------------------------------------------------
// A single traced operation. In the no-op implementation, spans are
// lightweight objects that do nothing. When connected to OpenTelemetry,
// they become real OTel spans.
// --------------------------------------------------------------------------

export interface Span {
  /** Set a named attribute on the span */
  setAttribute(key: string, value: SpanAttributeValue): void;
  /** Set multiple attributes at once */
  setAttributes(attrs: SpanAttributes): void;
  /** Record an exception on the span */
  recordException(error: Error): void;
  /** Set the span status */
  setStatus(status: SpanStatus): void;
  /** End the span (required — must be called to complete the span) */
  end(): void;
  /** Whether this span is actually recording (no-op returns false) */
  isRecording(): boolean;
}

// --------------------------------------------------------------------------
// Tracer
// --------------------------------------------------------------------------
// Creates spans. The default (getTracer()) returns a NoopTracer.
// When OpenTelemetry is configured, getTracer() returns a real tracer.
// --------------------------------------------------------------------------

export interface Tracer {
  /** Start a new span. The fn callback receives the span and returns the result. */
  startActiveSpan<F extends (...args: unknown[]) => unknown>(
    name: string,
    fn: F,
    options?: {
      kind?: SpanKind;
      attributes?: SpanAttributes;
    },
  ): ReturnType<F>;

  /** Create a standalone span (must be ended manually) */
  startSpan(name: string, options?: {
    kind?: SpanKind;
    attributes?: SpanAttributes;
  }): Span;
}

// --------------------------------------------------------------------------
// Trace context
// --------------------------------------------------------------------------
// Carries trace context across async boundaries. In no-op mode, this is
// a lightweight container. In real OTel, it carries traceId, spanId, etc.
// --------------------------------------------------------------------------

export interface TraceContext {
  /** Whether this context is active (no-op returns false) */
  isActive: boolean;
  /** W3C trace id when recording */
  traceId?: string;
  /** Current span id when recording */
  spanId?: string;
  /** Free-form metadata attached to the context */
  attributes: SpanAttributes;
}

// --------------------------------------------------------------------------
// Trace helpers — wrapped function result
// --------------------------------------------------------------------------

export type TraceableFunction<T extends (...args: Parameters<T>) => ReturnType<T>> =
  (...args: Parameters<T>) => ReturnType<T>;
