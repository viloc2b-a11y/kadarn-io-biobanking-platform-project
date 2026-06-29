// ==========================================================================
// Kadarn Telemetry — Recording tracer (OTel-compatible, no SDK dependency)
// ==========================================================================
// Emits structured span logs and propagates traceId/spanId via AsyncLocalStorage.
// Export to Tempo/OTel Collector when KADARN_OTEL_EXPORTER is configured.
// ==========================================================================

import { AsyncLocalStorage } from 'node:async_hooks';
import { logDebug } from './logger';
import type {
  Span,
  SpanAttributes,
  SpanAttributeValue,
  SpanKind,
  SpanStatus,
  Tracer,
  TraceContext,
} from './types';

interface ActiveTrace {
  traceId: string;
  spanId: string;
  spanName: string;
  attributes: SpanAttributes;
}

const traceStorage = new AsyncLocalStorage<ActiveTrace>();

function newId(bytes = 16): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, bytes);
}

class RecordingSpan implements Span {
  private ended = false;

  constructor(
    private readonly trace: ActiveTrace,
    private readonly name: string,
  ) {}

  setAttribute(key: string, value: SpanAttributeValue): void {
    this.trace.attributes[key] = value;
  }

  setAttributes(attrs: SpanAttributes): void {
    Object.assign(this.trace.attributes, attrs);
  }

  recordException(error: Error): void {
    this.trace.attributes['exception.message'] = error.message;
    this.trace.attributes['exception.type'] = error.name;
  }

  setStatus(status: SpanStatus): void {
    this.trace.attributes['span.status'] = status.code;
    if (status.message) {
      this.trace.attributes['span.status_message'] = status.message;
    }
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    logDebug('trace.span.end', {
      traceId: this.trace.traceId,
      spanId: this.trace.spanId,
      span: this.name,
      ...this.trace.attributes,
    });
  }

  isRecording(): boolean {
    return !this.ended;
  }
}

export class RecordingTracer implements Tracer {
  startActiveSpan<F extends (...args: unknown[]) => unknown>(
    name: string,
    fn: F,
    options?: { kind?: SpanKind; attributes?: SpanAttributes },
  ): ReturnType<F> {
    const parent = traceStorage.getStore();
    const trace: ActiveTrace = {
      traceId: parent?.traceId ?? newId(32),
      spanId: newId(16),
      spanName: name,
      attributes: { ...(options?.attributes ?? {}), 'span.kind': options?.kind ?? 'internal' },
    };

    logDebug('trace.span.start', {
      traceId: trace.traceId,
      spanId: trace.spanId,
      span: name,
      parentSpanId: parent?.spanId,
    });

    return traceStorage.run(trace, () => fn()) as ReturnType<F>;
  }

  startSpan(name: string, options?: { kind?: SpanKind; attributes?: SpanAttributes }): Span {
    const parent = traceStorage.getStore();
    const trace: ActiveTrace = {
      traceId: parent?.traceId ?? newId(32),
      spanId: newId(16),
      spanName: name,
      attributes: { ...(options?.attributes ?? {}), 'span.kind': options?.kind ?? 'internal' },
    };
    return new RecordingSpan(trace, name);
  }
}

export function getActiveTraceContext(): TraceContext {
  const active = traceStorage.getStore();
  if (!active) {
    return { isActive: false, attributes: {} };
  }
  return {
    isActive: true,
    traceId: active.traceId,
    spanId: active.spanId,
    attributes: { ...active.attributes },
  };
}

export function isTracingEnabled(): boolean {
  return process.env.KADARN_TRACING === 'enabled'
    || process.env.OTEL_EXPORTER_OTLP_ENDPOINT !== undefined;
}
