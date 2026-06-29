// ==========================================================================
// Sprint 5 — Provenance Everywhere: static integration gate
// ==========================================================================

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROVENANCE_NODE_TYPES } from '../../apps/api/src/lib/provenance-recorder'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const API_ROUTES = path.join(REPO_ROOT, 'apps/api/src/app/api/v1')
const MIGRATION = path.join(REPO_ROOT, 'database/migrations/037_provenance_sprint5_types.sql')

/** Critical mutating operations — routes delegate to runPipeline; provenance in stage-handlers */
const CRITICAL_OPERATIONS: Array<{
  domain: string
  route: string
  pipeline: string
}> = [
  { domain: 'Exchange', route: 'exchange/route.ts', pipeline: 'exchange-request' },
  { domain: 'Exchange', route: 'exchange/deals/route.ts', pipeline: 'exchange-deal' },
  { domain: 'Exchange', route: 'exchange/deals/[id]/route.ts', pipeline: 'exchange-deal-update' },
  { domain: 'Exchange', route: 'feasibility/route.ts', pipeline: 'feasibility' },
  { domain: 'Exchange', route: 'marketplace/feasibility/route.ts', pipeline: 'feasibility' },
  { domain: 'Exchange', route: 'marketplace/requests/route.ts', pipeline: 'exchange-request' },
  { domain: 'QC', route: 'processing/aliquots/[id]/qc/route.ts', pipeline: 'qc' },
  { domain: 'Shipment', route: 'shipments/route.ts', pipeline: 'shipment' },
  { domain: 'Shipment', route: 'shipments/[id]/route.ts', pipeline: 'shipment-status' },
  { domain: 'Payments', route: 'financial/settlements/route.ts', pipeline: 'settlement' },
  { domain: 'Payments', route: 'financial/settlements/[id]/route.ts', pipeline: 'settlement-update' },
  { domain: 'Twins', route: 'collections/route.ts', pipeline: 'collection-twin' },
  { domain: 'Twins', route: 'specimens/route.ts', pipeline: 'specimen-twin' },
]

/** Read-only dashboards — intentionally no provenance recording */
const READ_ONLY_DASHBOARDS = [
  'koc/analytics/route.ts',
  'koc/knowledge/route.ts',
  'koc/twins/route.ts',
  'koc/workflow/route.ts',
  'workspace/analytics/route.ts',
]

function readRoute(relative: string): string {
  return fs.readFileSync(path.join(API_ROUTES, relative), 'utf-8')
}

describe('Sprint 5 — critical operations have provenance', () => {
  const stageHandlers = fs.readFileSync(
    path.join(REPO_ROOT, 'apps/api/src/lib/orchestration/stage-handlers.ts'),
    'utf-8',
  )

  for (const op of CRITICAL_OPERATIONS) {
    it(`${op.domain}: ${op.route} uses runPipeline('${op.pipeline}')`, () => {
      const source = readRoute(op.route)
      expect(source).toContain('runPipeline')
      expect(source).toContain(`'${op.pipeline}'`)
    })
  }

  it('stage-handlers provenance stage records all critical domains', () => {
    expect(stageHandlers).toContain('runProvenanceStage')
    expect(stageHandlers).toContain('recordExchangeRequestProvenance')
    expect(stageHandlers).toContain('recordDealProvenance')
    expect(stageHandlers).toContain('recordFeasibilityProvenance')
    expect(stageHandlers).toContain('recordQcProvenance')
    expect(stageHandlers).toContain('recordShipmentProvenance')
    expect(stageHandlers).toContain('recordSettlementProvenance')
    expect(stageHandlers).toContain('recordCollectionProvenance')
    expect(stageHandlers).toContain('recordSpecimenTwinProvenance')
    expect(stageHandlers).toContain('signalExchangeRequestWorkflow')
  })
})

describe('Sprint 5 — provenance recorder module', () => {
  const source = fs.readFileSync(
    path.join(REPO_ROOT, 'apps/api/src/lib/provenance-recorder.ts'),
    'utf-8',
  )

  it('emits ProvenanceRecordRequested and persists via upsert_provenance_node', () => {
    expect(source).toContain('ProvenanceRecordRequested')
    expect(source).toContain('upsert_provenance_node')
    expect(source).toContain('persistProvenanceNode')
  })

  it('exports domain recorders for all sprint scopes', () => {
    expect(source).toContain('recordWorkflowProvenance')
    expect(source).toContain('recordShipmentStatusProvenance')
    expect(source).toContain('recordSettlementProvenance')
    expect(source).toContain('recordSpecimenTwinProvenance')
    expect(source).toContain('recordPolicyEvaluationProvenance')
  })

  it('node types align with migration 037 enum extensions', () => {
    const migration = fs.readFileSync(MIGRATION, 'utf-8')
    for (const t of ['feasibility_assessment', 'exchange_deal', 'settlement', 'workflow_activity', 'twin_event']) {
      expect(migration).toContain(`'${t}'`)
      expect(PROVENANCE_NODE_TYPES).toContain(t)
    }
  })
})

describe('Sprint 5 — policy shadow records provenance', () => {
  it('policy-shadow-bridge calls recordPolicyEvaluationProvenance', () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/lib/policy-shadow-bridge.ts'),
      'utf-8',
    )
    expect(source).toContain('recordPolicyEvaluationProvenance')
  })
})

describe('Sprint 5 — read-only dashboards exempt', () => {
  for (const route of READ_ONLY_DASHBOARDS) {
    it(`${route} is GET-only (no mutation provenance required)`, () => {
      const source = readRoute(route)
      expect(source).toMatch(/export const GET/)
      expect(source).not.toMatch(/export const POST|export const PATCH|export const PUT|export const DELETE/)
    })
  }
})

describe('Sprint 5 — migration parity', () => {
  it('mirrors 037 to supabase migrations', () => {
    const db = fs.readFileSync(MIGRATION, 'utf-8')
    const sb = fs.readFileSync(
      path.join(REPO_ROOT, 'supabase/migrations/037_provenance_sprint5_types.sql'),
      'utf-8',
    )
    expect(sb).toBe(db)
  })
})

describe('Sprint 5 — helper node types valid for RPC', () => {
  it('exchange and logistics helpers use provenance-recorder', () => {
    const exchange = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/lib/exchange-helper.ts'),
      'utf-8',
    )
    const logistics = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/lib/logistics-helper.ts'),
      'utf-8',
    )
    expect(exchange).toContain('@/lib/provenance-recorder')
    expect(logistics).toContain('@/lib/provenance-recorder')
    expect(exchange).not.toContain('collection_twin')
    expect(exchange).not.toContain('discovery_search')
    expect(logistics).not.toContain('collection_twin')
  })
})
