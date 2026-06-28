// ==========================================================================
// KPV-09 — Performance Validation Benchmarks
// ==========================================================================
// This is a measurement sprint, not an optimization sprint.
// These tests measure current baseline performance without changing code.
//
// All benchmarks run offline (no DB, no server).
// Results are printed to stdout for analysis.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { evaluate } from '../../packages/policy-engine/src/engine.js';
import { toProvDocument, toProvRelation, getProvCategory } from '../../packages/provenance/src/index.js';
import { withTracing, withAsyncTracing, setTracer, resetTracer } from '../../packages/telemetry/src/index.js';
import { createExchangeRequestWorkflow, processSignal, runExchangeRequestWorkflow } from '../../packages/workflow-engine/src/temporal/exchange-request-workflow.js';
import { executeActivity } from '../../packages/workflow-engine/src/temporal/activities.js';


// ---------------------------------------------------------------------------
// Benchmark helpers
// ---------------------------------------------------------------------------

function benchmark(fn: () => void, iterations: number = 1000): { meanMs: number; minMs: number; maxMs: number; totalMs: number } {
  const times: number[] = []

  // Warmup
  for (let i = 0; i < 100; i++) fn()

  // Measure
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    const end = performance.now()
    times.push(end - start)
  }

  const totalMs = times.reduce((a, b) => a + b, 0)
  const meanMs = totalMs / times.length
  const minMs = Math.min(...times)
  const maxMs = Math.max(...times)

  return { meanMs, minMs, maxMs, totalMs }
}

async function benchmarkAsync(fn: () => Promise<void>, iterations: number = 100): Promise<{ meanMs: number; minMs: number; maxMs: number }> {
  const times: number[] = []

  // Warmup
  for (let i = 0; i < 10; i++) await fn()

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await fn()
    const end = performance.now()
    times.push(end - start)
  }

  const meanMs = times.reduce((a, b) => a + b, 0) / times.length
  const minMs = Math.min(...times)
  const maxMs = Math.max(...times)

  return { meanMs, minMs, maxMs }
}

function log(label: string, result: { meanMs: number; minMs: number; maxMs: number; totalMs?: number }, iterations: number): void {
  console.log(`[BENCHMARK] ${label}: ${result.meanMs.toFixed(4)}ms avg (${result.minMs.toFixed(4)}ms min / ${result.maxMs.toFixed(4)}ms max) over ${iterations} iterations`)
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const SAMPLE_POLICY = {
  id: 'org.membership',
  name: 'Org Membership',
  domain: 'governance' as const,
  status: 'active' as const,
  version: 1,
  priority: 100,
  rules: [
    { id: 'r1', condition: { eq: [{ var: 'actor.role' }, 'kadarn_internal'] } as Record<string, unknown>, effect: 'allow' as const, reason: 'Internal' },
    { id: 'r2', condition: { eq: [{ var: 'organization.membership_status' }, 'active'] } as Record<string, unknown>, effect: 'allow' as const, reason: 'Active member' },
  ],
  metadata: {},
}

const COMPLEX_POLICY = {
  id: 'complex.policy',
  name: 'Complex Policy',
  domain: 'governance' as const,
  status: 'active' as const,
  version: 1,
  priority: 100,
  rules: [
    { id: 'r1', condition: { all: [
      { eq: [{ var: 'actor.role' }, 'org_member'] },
      { any: [
        { eq: [{ var: 'organization.membership_status' }, 'active'] },
        { in: [{ var: 'actor.departments' }, ['pathology', 'oncology']] },
      ]},
      { not: { eq: [{ var: 'organization.restricted' }, true] } },
    ]} as Record<string, unknown>, effect: 'allow' as const, reason: 'Complex allow' },
    { id: 'r2', condition: { eq: [{ var: 'actor.role' }, 'kadarn_internal'] } as Record<string, unknown>, effect: 'allow' as const, reason: 'Internal bypass' },
  ],
  metadata: {},
}

const SAMPLE_CONTEXT = {
  actor: { role: 'org_member', departments: ['pathology'] },
  organization: { membership_status: 'active', restricted: false },
}

const LARGE_PROVENANCE_NODES = Array.from({ length: 100 }, (_, i) => ({
  node_type: (i % 3 === 0 ? 'specimen' : i % 3 === 1 ? 'aliquot' : 'processing_event') as 'specimen' | 'aliquot' | 'processing_event',
  external_id: `node-${i}`,
  label: `Node ${i}`,
  organization_id: 'org-1',
}))

const LARGE_PROVENANCE_EDGES = Array.from({ length: 95 }, (_, i) => ({
  edge_type: 'derived_from' as const,
  source_node_type: (i % 2 === 0 ? 'aliquot' : 'dataset') as 'aliquot' | 'dataset',
  source_external_id: `node-${i + 5}`,
  target_node_type: 'specimen' as const,
  target_external_id: `node-${i % 5}`,
}))

// ---------------------------------------------------------------------------
// 1. Policy evaluation latency
// ---------------------------------------------------------------------------

describe('KPV-09: Policy evaluation', () => {
  it('simple policy evaluation (1000 iterations)', () => {
    // already imported

    const result = benchmark(() => {
      evaluate(SAMPLE_POLICY, SAMPLE_CONTEXT)
    }, 1000)

    log('simple policy evaluation', result, 1000)
    // Expect: well under 1ms per evaluation
    expect(result.meanMs).toBeLessThan(1)
  })

  it('complex policy evaluation (1000 iterations)', () => {
    // already imported

    const result = benchmark(() => {
      evaluate(COMPLEX_POLICY, SAMPLE_CONTEXT)
    }, 1000)

    log('complex policy evaluation', result, 1000)
    // Complex policies should still be sub-millisecond
    expect(result.meanMs).toBeLessThan(1)
  })

  it('policy evaluation with unmatch (deny path) (1000 iterations)', () => {
    // already imported

    const denyContext = { actor: { role: 'external' }, organization: { membership_status: 'inactive' } }

    const result = benchmark(() => {
      evaluate(SAMPLE_POLICY, denyContext)
    }, 1000)

    log('policy evaluation (no match path)', result, 1000)
    expect(result.meanMs).toBeLessThan(1)
  })
})

// ---------------------------------------------------------------------------
// 2. Provenance mapping latency
// ---------------------------------------------------------------------------

describe('KPV-09: Provenance mapping', () => {
  it('small provenance document (<10 nodes)', () => {
    // already imported

    const nodes = [{ node_type: 'specimen' as const, external_id: 'S-001', label: 'Test', organization_id: 'org-1' }]
    const edges: Array<any> = []

    const result = benchmark(() => {
      toProvDocument(nodes, edges)
    }, 1000)

    log('small provenance document (1 node)', result, 1000)
    expect(result.meanMs).toBeLessThan(1)
  })

  it('large provenance document (100 nodes, 95 edges)', () => {
    // already imported

    const result = benchmark(() => {
      toProvDocument(LARGE_PROVENANCE_NODES, LARGE_PROVENANCE_EDGES)
    }, 100)

    log('large provenance document (100 nodes, 95 edges)', result, 100)
    // Should be well under 10ms even for large documents
    expect(result.meanMs).toBeLessThan(10)
  })

  it('provenance relation mapping', () => {
    // already imported

    const result = benchmark(() => {
      toProvRelation('derived_from', 'specimen', 'S-001', 'specimen', 'S-002', { relation: 'wasRevisionOf' })
    }, 1000)

    log('provenance relation mapping', result, 1000)
    expect(result.meanMs).toBeLessThan(1)
  })

  it('provenance category lookup', () => {
    // already imported

    const result = benchmark(() => {
      getProvCategory('specimen')
      getProvCategory('processing_event')
      getProvCategory('organization')
    }, 1000)

    log('provenance category lookup (3 types)', result, 1000)
    expect(result.meanMs).toBeLessThan(1)
  })
})

// ---------------------------------------------------------------------------
// 3. Telemetry overhead
// ---------------------------------------------------------------------------

describe('KPV-09: Telemetry overhead', () => {
  it('raw function call (no tracing)', () => {
    const fn = () => 42

    const result = benchmark(() => {
      fn()
    }, 1000)

    log('raw function call', result, 1000)
  })

  it('withTracing (noop tracer — actual overhead in production)', () => {
    // already imported
    resetTracer()

    const fn = () => 42
    const traced = withTracing(fn, 'test.bench')

    const result = benchmark(() => {
      traced()
    }, 1000)

    log('withTracing (noop tracer)', result, 1000)
    // Noop tracer should have near-zero overhead
  })

  it('withTracing (real tracer — full span overhead)', () => {
    // already imported

    const spans: string[] = []
    const mockTracer = {
      startActiveSpan: (_name: string, fn: Function) => fn(),
      startSpan: (name: string) => {
        spans.push(name)
        return { setAttribute() {}, setAttributes() {}, recordException() {}, setStatus() {}, end() {}, isRecording() { return true } }
      },
    }
    setTracer(mockTracer as any)

    const fn = () => 42
    const traced = withTracing(fn, 'test.real')

    const result = benchmark(() => {
      traced()
      spans.length = 0 // reset for next iteration
    }, 1000)

    log('withTracing (real tracer — span created)', result, 1000)

    resetTracer()
  })

  it('withAsyncTracing overhead vs raw async function', async () => {
    // already imported
    resetTracer()

    const fn = async () => 42
    const traced = withAsyncTracing(fn, 'test.async')

    const result = await benchmarkAsync(async () => {
      await traced()
    }, 100)

    log('withAsyncTracing (noop tracer, async)', result, 100)
  })
})

// ---------------------------------------------------------------------------
// 4. Workflow execution
// ---------------------------------------------------------------------------

describe('KPV-09: Workflow execution', () => {
  it('createExchangeRequestWorkflow', () => {
    // already imported

    const result = benchmark(() => {
      createExchangeRequestWorkflow('req-1', 'org-r', 'org-p', 'Dr. X')
    }, 1000)

    log('createExchangeRequestWorkflow', result, 1000)
    expect(result.meanMs).toBeLessThan(1)
  })

  it('processSignal', () => {
    // already imported

    const state = createExchangeRequestWorkflow('req-1', 'org-r', 'org-p', 'Dr. X')
    const signal = { type: 'reviewerAction' as const, payload: { action: 'approve', reason: 'OK' }, receivedAt: new Date().toISOString() }

    const result = benchmark(() => {
      processSignal(state, signal)
    }, 1000)

    log('processSignal (approve)', result, 1000)
    expect(result.meanMs).toBeLessThan(1)
  })
})

// ---------------------------------------------------------------------------
// 5. Activity execution
// ---------------------------------------------------------------------------

describe('KPV-09: Activity execution', () => {
  it('executeActivity (notify_reviewer)', async () => {
    // already imported

    const result = await benchmarkAsync(async () => {
      await executeActivity('notify_reviewer', {
        organizationId: 'org-1',
        requestId: 'req-1',
        requesterName: 'Dr. X',
        submittedAt: new Date().toISOString(),
      }, {})
    }, 100)

    log('executeActivity (notify_reviewer)', result, 100)
  })

  it('executeActivity (assess_request_timeout)', async () => {
    // already imported

    const future = new Date(Date.now() + 86400000).toISOString()
    const result = await benchmarkAsync(async () => {
      await executeActivity('assess_request_timeout', {
        requestId: 'req-1',
        deadline: future,
        currentStatus: 'under_review',
      }, {})
    }, 100)

    log('executeActivity (assess_request_timeout)', result, 100)
  })
})

// ---------------------------------------------------------------------------
// 6. Full workflow execution (end-to-end)
// ---------------------------------------------------------------------------

describe('KPV-09: Full workflow execution', () => {
  it('runExchangeRequestWorkflow (happy path)', async () => {
    // already imported

    const initialState = createExchangeRequestWorkflow('req-bench-1', 'org-r', 'org-p', 'Dr. X')
    const signals = [
      { type: 'reviewerAction' as const, payload: { action: 'approve', reason: 'OK' }, receivedAt: new Date().toISOString() },
      { type: 'mtaSigned' as const, payload: { organizationId: 'org-p' }, receivedAt: new Date().toISOString() },
    ]

    const result = await benchmarkAsync(async () => {
      const s = createExchangeRequestWorkflow('req-bench-1', 'org-r', 'org-p', 'Dr. X')
      await runExchangeRequestWorkflow(s, signals)
    }, 50)

    log('runExchangeRequestWorkflow (happy path)', result, 50)
  })

  it('runExchangeRequestWorkflow (declined path)', async () => {
    // already imported

    const signals = [
      { type: 'reviewerAction' as const, payload: { action: 'decline', reason: 'N/A' }, receivedAt: new Date().toISOString() },
    ]

    const result = await benchmarkAsync(async () => {
      const s = createExchangeRequestWorkflow('req-bench-2', 'org-r', 'org-p', 'Dr. X')
      await runExchangeRequestWorkflow(s, signals)
    }, 50)

    log('runExchangeRequestWorkflow (declined path)', result, 50)
  })
})
