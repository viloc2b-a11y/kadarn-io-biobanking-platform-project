// ==========================================================================
// Sprint 8 — Workflow Runtime: static integration gate
// ==========================================================================

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  dispatchWorkflowSignal,
  listRegisteredWorkflowTypes,
  resetExchangeRequestInstances,
  getExchangeRequestInstance,
  EXCHANGE_REQUEST_DEFINITION,
} from '../../packages/workflow-engine/src/runtime'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const ROOT_PKG = path.join(REPO_ROOT, 'package.json')
const LOCK = path.join(REPO_ROOT, 'package-lock.json')
const MIGRATION = path.join(REPO_ROOT, 'database/migrations/038_workflow_runtime.sql')

describe('Sprint 8 — runtime decision documented', () => {
  it('ADR-022 accepts Engine 2.0 and defers Temporal', () => {
    const adr = fs.readFileSync(
      path.join(REPO_ROOT, 'docs/adr/adr-022-workflow-runtime-decision.md'),
      'utf-8',
    )
    expect(adr).toContain('Accepted')
    expect(adr).toContain('Workflow Engine 2.0')
    expect(adr).toContain('Temporal is deferred')
    expect(adr).toMatch(/Do NOT.*@temporalio/s)
  })

  it('evaluation matrix compares Temporal vs own runtime', () => {
    const doc = fs.readFileSync(
      path.join(REPO_ROOT, 'docs/engineering/SPRINT-8-WORKFLOW-RUNTIME-EVALUATION.md'),
      'utf-8',
    )
    expect(doc).toContain('Temporal')
    expect(doc).toContain('Engine 2.0')
    expect(doc).toContain('Inngest')
    expect(doc).toContain('Re-evaluation triggers')
  })
})

describe('Sprint 8 — Temporal NOT installed', () => {
  it('root package.json has no @temporalio dependency', () => {
    const pkg = fs.readFileSync(ROOT_PKG, 'utf-8')
    expect(pkg).not.toContain('@temporalio')
  })

  it('package-lock has no @temporalio packages', () => {
    const lock = fs.readFileSync(LOCK, 'utf-8')
    expect(lock).not.toContain('@temporalio/')
  })
})

describe('Sprint 8 — workflow runtime module', () => {
  it('registers exchange-request-workflow handler', () => {
    expect(listRegisteredWorkflowTypes()).toContain('exchange-request-workflow')
  })

  it('dispatches submit signal and tracks instance state', async () => {
    resetExchangeRequestInstances()
    const result = await dispatchWorkflowSignal({
      workflowType: 'exchange-request-workflow',
      signal: 'submit',
      payload: {
        requestId: 'req-s8-1',
        requesterOrgId: 'org-a',
        providerOrgId: 'org-b',
        requesterName: 'User A',
      },
      correlationId: 'corr-s8',
      actorId: 'user-1',
      organizationId: 'org-a',
    })

    expect(result.status).toMatch(/started|completed/)
    expect(result.instanceKey).toBe('req-s8-1')
    expect(getExchangeRequestInstance('req-s8-1')).toBeDefined()
  })

  it('exchange-request Engine 2.0 definition has 8 steps', () => {
    expect(EXCHANGE_REQUEST_DEFINITION.steps).toHaveLength(8)
    expect(EXCHANGE_REQUEST_DEFINITION.status).toBe('active')
  })
})

describe('Sprint 8 — event bus dispatches workflow signals', () => {
  it('event-runtime calls dispatchWorkflowSignal for WorkflowSignalRequested', () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/lib/event-runtime.ts'),
      'utf-8',
    )
    expect(source).toContain('dispatchWorkflowSignal')
    expect(source).toContain('WorkflowSignalRequested')
  })
})

describe('Sprint 8 — migration 038 workflow runtime', () => {
  it('adds next_wake_at and seeds exchange-request definition', () => {
    const sql = fs.readFileSync(MIGRATION, 'utf-8')
    expect(sql).toContain('next_wake_at')
    expect(sql).toContain('exchange-request')
  })

  it('mirrors to supabase migrations', () => {
    const sb = fs.readFileSync(
      path.join(REPO_ROOT, 'supabase/migrations/038_workflow_runtime.sql'),
      'utf-8',
    )
    expect(sb).toBe(fs.readFileSync(MIGRATION, 'utf-8'))
  })
})
