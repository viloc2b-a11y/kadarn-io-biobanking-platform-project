// ==========================================================================
// Kadarn Telemetry — Unit Tests
// ==========================================================================
//
// Core invariant: instrumentation never alters behavior.
// Every test runs a function TWICE:
//   1. Without tracing (raw function)
//   2. With tracing (wrapped function)
// And asserts the results are identical.
// ==========================================================================

import { describe, it, expect, vi } from 'vitest';
import {
  withTracing,
  withAsyncTracing,
  getTracer,
  setTracer,
  resetTracer,
  SPAN_API_REQUEST,
  SPAN_POLICY_EVALUATION,
  SPAN_PROVENANCE_CORRECTION,
  SPAN_INTEGRITY_RESOLUTION,
} from '../src/index.js';
import type { Tracer, Span } from '../src/types.js';

// ---------------------------------------------------------------------------
// Noop mode: withTracing does not change behavior
// ---------------------------------------------------------------------------

describe('NoopTracer — withTracing does not alter behavior', () => {
  it('returns the same result as the original function', () => {
    const fn = (x: number, y: number) => x + y;
    const traced = withTracing(fn, 'test.add');

    expect(traced(2, 3)).toBe(fn(2, 3));
    expect(traced(-1, 1)).toBe(fn(-1, 1));
    expect(traced(0, 0)).toBe(fn(0, 0));
  });

  it('throws the same error as the original function', () => {
    const fn = (_x: number) => { throw new Error('test error'); };
    const traced = withTracing(fn, 'test.error');

    expect(() => fn(1)).toThrow('test error');
    expect(() => traced(1)).toThrow('test error');
  });

  it('preserves the return type', () => {
    const fn = (name: string): { greeting: string } => ({ greeting: `Hello, ${name}!` });
    const traced = withTracing(fn, 'test.greet');

    const originalResult = fn('World');
    const tracedResult = traced('World');

    expect(typeof tracedResult).toBe(typeof originalResult);
    expect(tracedResult.greeting).toBe(originalResult.greeting);
  });

  it('handles undefined and null return values', () => {
    const returnsUndefined = () => undefined;
    const returnsNull = () => null;

    const tracedUndefined = withTracing(returnsUndefined, 'test.undefined');
    const tracedNull = withTracing(returnsNull, 'test.null');

    expect(tracedUndefined()).toBe(undefined);
    expect(tracedNull()).toBe(null);
  });

  it('handles object reference equality for the same input', () => {
    const obj = { key: 'value' };
    const fn = (o: Record<string, string>) => o;
    const traced = withTracing(fn, 'test.ref');

    expect(traced(obj)).toBe(fn(obj)); // Same reference
  });

  it('handles variadic arguments', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (...args: any[]) => args.reduce((sum: number, n: number) => sum + n, 0);
    const traced = withTracing(fn, 'test.variadic');

    expect(traced(1, 2, 3)).toBe(fn(1, 2, 3));
    expect(traced()).toBe(fn());
  });
});

describe('NoopTracer — withAsyncTracing does not alter behavior', () => {
  it('resolves to the same value as the original async function', async () => {
    const fn = async (x: number, y: number) => x * y;
    const traced = withAsyncTracing(fn, 'test.async-mul');

    await expect(traced(3, 4)).resolves.toBe(await fn(3, 4));
    await expect(traced(0, 100)).resolves.toBe(await fn(0, 100));
  });

  it('rejects with the same error as the original async function', async () => {
    const fn = async () => { throw new Error('async error'); };
    const traced = withAsyncTracing(fn, 'test.async-error');

    await expect(fn()).rejects.toThrow('async error');
    await expect(traced()).rejects.toThrow('async error');
  });

  it('preserves Promise return type', async () => {
    const fn = async (id: string): Promise<{ id: string; found: boolean }> => {
      return { id, found: true };
    };
    const traced = withAsyncTracing(fn, 'test.async-type');

    const original = await fn('abc');
    const tracedResult = await traced('abc');

    expect(tracedResult.id).toBe(original.id);
    expect(tracedResult.found).toBe(original.found);
  });
});

// ---------------------------------------------------------------------------
// Real tracer mode: spans are created but behavior still unchanged
// ---------------------------------------------------------------------------

describe('Real tracer — behavior unchanged, spans created', () => {
  it('withTracing still returns correct result when tracer records spans', () => {
    // Create a simple mock tracer that records spans
    const spans: Array<{ name: string; status?: string }> = [];
    const mockTracer: Tracer = {
      startActiveSpan(_name, fn) {
        return fn();
      },
      startSpan(name) {
        const span: Span = {
          setAttribute() { /* no-op */ },
          setAttributes() { /* no-op */ },
          recordException() { /* no-op */ },
          setStatus(status) { spans.push({ name, status: status.code }); },
          end() { /* no-op */ },
          isRecording() { return true; },
        };
        return span;
      },
    };

    setTracer(mockTracer);

    const fn = (x: number) => x * 2;
    const traced = withTracing(fn, 'test.mock');

    expect(traced(5)).toBe(10);
    expect(traced(0)).toBe(0);

    // Two calls = two spans with 'ok' status
    expect(spans).toHaveLength(2);
    expect(spans[0].name).toBe('test.mock');
    expect(spans[0].status).toBe('ok');

    resetTracer();
  });

  it('withAsyncTracing records error spans on rejection', async () => {
    const events: Array<{ name: string; error?: string }> = [];
    const mockTracer: Tracer = {
      startActiveSpan(_name, fn) { return fn(); },
      startSpan(name) {
        const span: Span = {
          setAttribute() { /* no-op */ },
          setAttributes() { /* no-op */ },
          recordException(e) { events.push({ name, error: (e as Error).message }); },
          setStatus() { /* no-op */ },
          end() { /* no-op */ },
          isRecording() { return true; },
        };
        return span;
      },
    };

    setTracer(mockTracer);

    const fn = async () => { throw new Error('fail'); };
    const traced = withAsyncTracing(fn, 'test.async-fail');

    await expect(traced()).rejects.toThrow('fail');

    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('test.async-fail');
    expect(events[0].error).toBe('fail');

    resetTracer();
  });
});

// ---------------------------------------------------------------------------
// withTracing + setTracer idempotency
// ---------------------------------------------------------------------------

describe('withTracing idempotency', () => {
  it('nested withTracing preserves behavior', () => {
    const fn = (s: string) => s.toUpperCase();
    const tracedOnce = withTracing(fn, 'level1');
    const tracedTwice = withTracing(tracedOnce, 'level2');

    expect(tracedTwice('hello')).toBe(fn('hello'));
    expect(tracedTwice('hello')).toBe(tracedOnce('hello'));
  });
});

// ---------------------------------------------------------------------------
// Span name constants
// ---------------------------------------------------------------------------

describe('Predefined span names', () => {
  it('SPAN_API_REQUEST matches expected value', () => {
    expect(SPAN_API_REQUEST).toBe('kadarn.api.request');
  });
  it('SPAN_POLICY_EVALUATION matches expected value', () => {
    expect(SPAN_POLICY_EVALUATION).toBe('kadarn.policy.evaluation');
  });
  it('SPAN_PROVENANCE_CORRECTION matches expected value', () => {
    expect(SPAN_PROVENANCE_CORRECTION).toBe('kadarn.provenance.correction');
  });
  it('SPAN_INTEGRITY_RESOLUTION matches expected value', () => {
    expect(SPAN_INTEGRITY_RESOLUTION).toBe('kadarn.provenance.integrity');
  });
});

// ---------------------------------------------------------------------------
// Console co-existence: tracing does not replace or break console-based logging
// ---------------------------------------------------------------------------

describe('Co-existence with console-based logging', () => {
  it('tracing does not suppress console output when it exists', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { /* no-op */ });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* no-op */ });

    const fn = (x: number) => {
      console.log(`Processing ${x}`);
      if (x < 0) console.error('Negative value!');
      return x * 2;
    };

    const traced = withTracing(fn, 'test.console');

    expect(traced(5)).toBe(10);
    expect(logSpy).toHaveBeenCalledWith('Processing 5');

    // Negative value triggers console.error but still returns a result
    expect(traced(-1)).toBe(-2);
    expect(errorSpy).toHaveBeenCalledWith('Negative value!');

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
