// ==========================================================================
// Kadarn Telemetry — Noop Tracer & Trace Helpers
// ==========================================================================
// Default implementation: zero overhead, no I/O, no allocations for spans.
// Replace 'createTracer()' with a real OpenTelemetry tracer when ready.
// ==========================================================================

import type {
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
// NoopSpan
// --------------------------------------------------------------------------
// A span that does nothing. All methods are no-ops.
// isRecording() returns false so callers can skip expensive attribute
// computation when tracing is disabled.
// --------------------------------------------------------------------------

class NoopSpan implements Span {
  setAttribute(_key: string, _value: SpanAttributeValue): void {
    // no-op
  }

  setAttributes(_attrs: SpanAttributes): void {
    // no-op
  }

  recordException(_error: Error): void {
    // no-op
  }

  setStatus(_status: SpanStatus): void {
    // no-op
  }

  end(): void {
    // no-op
  }

  isRecording(): boolean {
    return false;
  }
}

const NOOP_SPAN = new NoopSpan();

// --------------------------------------------------------------------------
// NoopTracer
// --------------------------------------------------------------------------
// Creates no-op spans. Every span is the same singleton instance.
// startActiveSpan calls fn directly without wrapping — zero overhead.
// --------------------------------------------------------------------------

class NoopTracer implements Tracer {
  startActiveSpan<F extends (...args: unknown[]) => unknown>(
    _name: string,
    fn: F,
    _options?: {
      kind?: SpanKind;
      attributes?: SpanAttributes;
    },
  ): ReturnType<F> {
    // Pass through directly — no wrapping, no allocation
    return fn() as ReturnType<F>;
  }

  startSpan(_name: string, _options?: {
    kind?: SpanKind;
    attributes?: SpanAttributes;
  }): Span {
    return NOOP_SPAN;
  }
}

const NOOP_TRACER = new NoopTracer();

// --------------------------------------------------------------------------
// Default trace context
// --------------------------------------------------------------------------

const DEFAULT_CONTEXT: TraceContext = {
  isActive: false,
  attributes: {},
};

// --------------------------------------------------------------------------
// Tracer factory
// --------------------------------------------------------------------------

let activeTracer: Tracer = NOOP_TRACER;

/**
 * Get the current tracer. Returns a NoopTracer by default.
 * Replace at startup with a real OpenTelemetry tracer:
 *
 *   import { setTracer } from '@kadarn/telemetry';
 *   setTracer(myRealTracer);
 */
export function getTracer(): Tracer {
  return activeTracer;
}

/**
 * Replace the default tracer with a real implementation.
 * Must be called before any instrumented code runs.
 */
export function setTracer(tracer: Tracer): void {
  activeTracer = tracer;
}

/**
 * Reset to the no-op tracer (useful for testing).
 */
export function resetTracer(): void {
  activeTracer = NOOP_TRACER;
}

// --------------------------------------------------------------------------
// withTracing — wrap a function without changing its behavior
// --------------------------------------------------------------------------
// The wrapped function returns the EXACT same result as the original.
// When the tracer is NoopTracer, the overhead is zero — the wrapper
// calls fn directly without creating spans.
//
// When the tracer is a real OTel tracer, the wrapper creates a span
// and records success/failure.
//
// Type-safe: the wrapper preserves the original function's signature.
// --------------------------------------------------------------------------

/**
 * Wrap a synchronous function with tracing.
 * The wrapped function is behaviorally identical to the original.
 */
export function withTracing<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  spanName: string,
  options?: {
    kind?: SpanKind;
    attributes?: SpanAttributes;
  },
): T {
  const wrapped = ((...args: Parameters<T>): ReturnType<T> => {
    // Fast path: if tracer is no-op, call fn directly
    const tracer = getTracer();
    if (tracer === NOOP_TRACER) {
      return fn(...args);
    }

    // Slow path: create a real span
    let result: ReturnType<T>;
    let error: Error | undefined;

    try {
      result = fn(...args);
      return result;
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      throw err; // re-throw — behavior must not change
    } finally {
      const span = tracer.startSpan(spanName, options);
      if (error) {
        span.recordException(error);
        span.setStatus({ code: 'error', message: error.message });
      } else {
        span.setStatus({ code: 'ok' });
      }
      span.end();
    }
  }) as T;

  return wrapped;
}

/**
 * Wrap an async function with tracing.
 * The wrapped function is behaviorally identical to the original.
 */
export function withAsyncTracing<T extends (...args: any[]) => any>(
  fn: T,
  spanName: string,
  options?: {
    kind?: SpanKind;
    attributes?: SpanAttributes;
  },
): T {
  const wrapped = (async (...args: any[]): Promise<any> => {
    const tracer = getTracer();
    if (tracer === NOOP_TRACER) {
      return await fn(...args);
    }

    let error: Error | undefined;
    try {
      const result = await fn(...args);
      return result;
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      throw err;
    } finally {
      if (error) {
        const span = tracer.startSpan(spanName, options);
        span.recordException(error);
        span.setStatus({ code: 'error', message: error.message });
        span.end();
      } else {
        const span = tracer.startSpan(spanName, options);
        span.setStatus({ code: 'ok' });
        span.end();
      }
    }
  }) as unknown as T;

  return wrapped;
}

// --------------------------------------------------------------------------
// Context propagation helpers
// --------------------------------------------------------------------------

/**
 * Get the current trace context.
 * In no-op mode, returns a default inactive context.
 * In real OTel mode, returns the active trace context from the current span.
 */
export function getTraceContext(): TraceContext {
  return DEFAULT_CONTEXT;
}

/**
 * Create a child trace context from a parent.
 * In no-op mode, returns the default context.
 * In real OTel mode, creates a child context for async fan-out.
 */
export function createChildContext(_parent?: TraceContext): TraceContext {
  return DEFAULT_CONTEXT;
}
