// ==========================================================================
// Sprint 6 — Engine Orchestration: static integration gate
// ==========================================================================

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runPipeline, createPipelineContext, ALL_PIPELINE_STAGES, PIPELINE_STAGES } from '../../apps/api/src/lib/engine-orchestrator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const API_ROUTES = path.join(REPO_ROOT, 'apps/api/src/app/api/v1')
const STAGE_HANDLERS = path.join(REPO_ROOT, 'apps/api/src/lib/orchestration/stage-handlers.ts')

/** Critical mutating routes — must delegate to runPipeline (no isolated engines) */
const ORCHESTRATED_ROUTES: Array<{ route: string; pipeline: string }> = [
  { route: 'exchange/route.ts', pipeline: 'exchange-request' },
  { route: 'marketplace/requests/route.ts', pipeline: 'exchange-request' },
  { route: 'exchange/deals/route.ts', pipeline: 'exchange-deal' },
  { route: 'exchange/deals/[id]/route.ts', pipeline: 'exchange-deal-update' },
  { route: 'feasibility/route.ts', pipeline: 'feasibility' },
  { route: 'marketplace/feasibility/route.ts', pipeline: 'feasibility' },
  { route: 'financial/settlements/route.ts', pipeline: 'settlement' },
  { route: 'financial/settlements/[id]/route.ts', pipeline: 'settlement-update' },
  { route: 'shipments/route.ts', pipeline: 'shipment' },
  { route: 'shipments/[id]/route.ts', pipeline: 'shipment-status' },
  { route: 'processing/aliquots/[id]/qc/route.ts', pipeline: 'qc' },
  { route: 'collections/route.ts', pipeline: 'collection-twin' },
  { route: 'specimens/route.ts', pipeline: 'specimen-twin' },
  { route: 'organizations/route.ts', pipeline: 'organization-onboard' },
]

const ENGINE_PACKAGES = [
  '@kadarn/policy-engine',
  '@kadarn/operational-twins',
  '@kadarn/telemetry',
]

/** Sprint 9+: trust/financial wired via API runtimes (not direct package imports in stage-handlers) */
/** Sprint 10+: knowledge wired via knowledge-runtime + graph-fabric-runtime */
const RUNTIME_ENGINE_WIRING: Array<{ runtimeFile: string; stageMarker: string }> = [
  { runtimeFile: 'apps/api/src/lib/trust-runtime.ts', stageMarker: 'evaluateTrustForPipeline' },
  { runtimeFile: 'apps/api/src/lib/financial-runtime.ts', stageMarker: 'scheduleFinancialRuntime' },
  { runtimeFile: 'apps/api/src/lib/knowledge-runtime.ts', stageMarker: 'runKnowledgeFabricStage' },
  { runtimeFile: 'apps/api/src/lib/knowledge-runtime.ts', stageMarker: 'runDiscoveryFabricStage' },
  { runtimeFile: 'apps/api/src/lib/graph-fabric-runtime.ts', stageMarker: 'enrichTwinWithKnowledge' },
]

function readRoute(relative: string): string {
  return fs.readFileSync(path.join(API_ROUTES, relative), 'utf-8')
}

describe('Sprint 6 — orchestrator module', () => {
  it('exports runPipeline and createPipelineContext', () => {
    expect(typeof runPipeline).toBe('function')
    expect(typeof createPipelineContext).toBe('function')
  })

  it('registers all 11 pipeline stages', () => {
    expect(ALL_PIPELINE_STAGES).toHaveLength(11)
    expect(ALL_PIPELINE_STAGES).toEqual(
      expect.arrayContaining([
        'discovery', 'exchange', 'policy', 'workflow', 'provenance',
        'trust', 'financial', 'analytics', 'knowledge', 'twins', 'telemetry',
      ]),
    )
  })

  it('every stage appears in at least one pipeline', () => {
    const used = new Set<string>()
    for (const stages of Object.values(PIPELINE_STAGES)) {
      for (const s of stages) used.add(s)
    }
    for (const stage of ALL_PIPELINE_STAGES) {
      expect(used.has(stage), `stage ${stage} unused`).toBe(true)
    }
  })
})

describe('Sprint 6 — stage handlers wire all engines', () => {
  const source = fs.readFileSync(STAGE_HANDLERS, 'utf-8')

  for (const pkg of ENGINE_PACKAGES) {
    it(`imports ${pkg}`, () => {
      expect(source).toContain(pkg)
    })
  }

  for (const { runtimeFile, stageMarker } of RUNTIME_ENGINE_WIRING) {
    it(`wires ${runtimeFile} through stage handlers`, () => {
      expect(fs.existsSync(path.join(REPO_ROOT, runtimeFile))).toBe(true)
      expect(source).toContain(stageMarker)
    })
  }

  it('workflow stage signals exchange-request workflow', () => {
    expect(source).toContain('signalExchangeRequestWorkflow')
    expect(source).toContain('WorkflowSignalRequested')
  })

  it('calls provenance recorders from provenance stage', () => {
    expect(source).toContain('runProvenanceStage')
    expect(source).toContain('recordExchangeRequestProvenance')
    expect(source).toContain('recordSettlementProvenance')
    expect(source).toContain('recordCollectionProvenance')
  })

  it('emits PipelineStageCompleted after each stage', () => {
    expect(source).toContain('PipelineStageCompleted')
  })

  it('telemetry stage logs pipeline completion', () => {
    expect(source).toContain('logInfo')
    expect(source).toContain('pipeline.completed')
  })
})

describe('Sprint 6 — critical routes use runPipeline', () => {
  for (const { route, pipeline } of ORCHESTRATED_ROUTES) {
    it(`${route} → ${pipeline}`, () => {
      const source = readRoute(route)
      expect(source).toContain('runPipeline')
      expect(source).toContain(`'${pipeline}'`)
      expect(source).toContain('createPipelineContext')
    })
  }
})

describe('Sprint 6 — no direct cross-engine helper calls in routes', () => {
  const bannedInRoutes = [
    /recordExchangeRequestProvenance/,
    /recordDealProvenance/,
    /recordFeasibilityProvenance/,
    /recordSettlementProvenance/,
    /recordShipmentProvenance/,
    /recordQcProvenance/,
    /recordCollectionProvenance/,
    /recordSpecimenTwinProvenance/,
    /emitAccessRequestSubmitted/,
    /emitExchangeDealCreated/,
    /emitShipmentCreated/,
    /signalExchangeRequestWorkflow/,
  ]

  for (const { route } of ORCHESTRATED_ROUTES) {
    it(`${route} delegates to orchestrator`, () => {
      const source = readRoute(route)
      for (const pattern of bannedInRoutes) {
        expect(source, `direct helper ${pattern}`).not.toMatch(pattern)
      }
    })
  }
})

describe('Sprint 6 — event-runtime initializes orchestration', () => {
  it('imports orchestration init side-effect', () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/lib/event-runtime.ts'),
      'utf-8',
    )
    expect(source).toContain('orchestration/init')
  })
})

describe('Sprint 6 — pipeline execution (in-memory)', () => {
  it('runs exchange-request pipeline with shared correlationId', () => {
    const correlationId = 'test-corr-s6'
    const result = runPipeline(
      'exchange-request',
      createPipelineContext({
        correlationId,
        actorId: 'user-1',
        organizationId: 'org-1',
      }),
      {
        requestId: 'req-1',
        title: 'Test Request',
        providerOrgId: 'org-2',
      },
    )

    expect(result.pipeline).toBe('exchange-request')
    expect(result.correlationId).toBe(correlationId)
    expect(result.stagesCompleted.length).toBeGreaterThan(0)
    expect(result.stagesCompleted).toEqual(PIPELINE_STAGES['exchange-request'])
  })
})
