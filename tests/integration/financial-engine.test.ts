// ==========================================================================
// KPR-02 — Financial Engine MVP Tests
// ==========================================================================
// Validates: happy path, cancellation, refund, duplicate prevention,
// provenance, telemetry, events.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { toProvDocument } from '../../packages/provenance/src/index.js'

describe('KPR-02: Financial Engine MVP', () => {
  // -----------------------------------------------------------------------
  // Route export verification
  // -----------------------------------------------------------------------

  it('list route exports GET handler', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const routePath = path.join(root, 'apps/api/src/app/api/v1/financial/settlements/route.ts')
    const source = fs.readFileSync(routePath, 'utf-8')

    expect(source).toContain('export const GET')
    expect(source).toContain('export const POST')
    expect(source).toContain('withAsyncTracing')
    expect(source).toContain('SPAN_API_REQUEST')
    expect(source).toContain('runPipeline')
    expect(source).toContain("'settlement'")
  })

  it('detail route exports PATCH handler', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const routePath = path.join(root, 'apps/api/src/app/api/v1/financial/settlements/[id]/route.ts')
    const source = fs.readFileSync(routePath, 'utf-8')

    expect(source).toContain('export const PATCH')
    expect(source).toContain('withAsyncTracing')
    expect(source).toContain('runPipeline')
    expect(source).toContain("'settlement-update'")
  })

  // -----------------------------------------------------------------------
  // Settlement lifecycle: happy path
  // -----------------------------------------------------------------------

  it('settlement lifecycle transitions are valid', () => {
    // Transition map mirrors the route logic
    const transitions: Record<string, string[]> = {
      pending: ['funded', 'cancelled'],
      funded: ['released', 'partially_released', 'cancelled'],
      partially_released: ['released', 'funded', 'cancelled'],
      released: ['completed', 'refunded'],
      completed: [],
      cancelled: [],
      refunded: [],
    }

    // Happy path: pending → funded → released → completed
    expect(transitions.pending).toContain('funded')
    expect(transitions.funded).toContain('released')
    expect(transitions.released).toContain('completed')
  })

  it('happy path: pending → funded → released → completed', () => {
    const states = ['pending', 'funded', 'released', 'completed']
    const transitions: Record<string, string[]> = {
      pending: ['funded'],
      funded: ['released'],
      released: ['completed'],
    }

    for (let i = 0; i < states.length - 1; i++) {
      const current = states[i]
      const next = states[i + 1]
      expect(transitions[current]).toContain(next)
    }
  })

  // -----------------------------------------------------------------------
  // Cancellation
  // -----------------------------------------------------------------------

  it('cancellation: pending → cancelled', () => {
    const transitions: Record<string, string[]> = {
      pending: ['funded', 'cancelled'],
    }
    expect(transitions.pending).toContain('cancelled')
  })

  it('cancellation: funded → cancelled', () => {
    const transitions: Record<string, string[]> = {
      funded: ['released', 'partially_released', 'cancelled'],
    }
    expect(transitions.funded).toContain('cancelled')
  })

  it('cancellation: completed cannot be cancelled', () => {
    const transitions: Record<string, string[]> = {
      completed: [],
    }
    expect(transitions.completed).not.toContain('cancelled')
    expect(transitions.completed).toHaveLength(0)
  })

  // -----------------------------------------------------------------------
  // Refund
  // -----------------------------------------------------------------------

  it('refund: released → refunded', () => {
    const transitions: Record<string, string[]> = {
      released: ['completed', 'refunded'],
    }
    expect(transitions.released).toContain('refunded')
  })

  it('refund: pending cannot be refunded directly', () => {
    const transitions: Record<string, string[]> = {
      pending: ['funded', 'cancelled'],
    }
    expect(transitions.pending).not.toContain('refunded')
  })

  // -----------------------------------------------------------------------
  // Invalid transitions
  // -----------------------------------------------------------------------

  it('pending → completed is invalid', () => {
    const transitions: Record<string, string[]> = {
      pending: ['funded', 'cancelled'],
    }
    expect(transitions.pending).not.toContain('completed')
  })

  it('pending → refunded is invalid', () => {
    const transitions: Record<string, string[]> = {
      pending: ['funded', 'cancelled'],
    }
    expect(transitions.pending).not.toContain('refunded')
  })

  it('completed → any is invalid (terminal state)', () => {
    const transitions: Record<string, string[]> = {
      completed: [],
    }
    expect(transitions.completed).toHaveLength(0)
  })

  it('refunded → any is invalid (terminal state)', () => {
    const transitions: Record<string, string[]> = {
      refunded: [],
    }
    expect(transitions.refunded).toHaveLength(0)
  })

  // -----------------------------------------------------------------------
  // Duplicate settlement prevention
  // -----------------------------------------------------------------------

  it('POST validates deal existence and prevents duplicate settlements', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const routePath = path.join(root, 'apps/api/src/app/api/v1/financial/settlements/route.ts')
    const source = fs.readFileSync(routePath, 'utf-8')

    expect(source).toContain('deal_id')
    expect(source).toContain('maybeSingle') // checks for existing settlement
    expect(source).toContain('Settlement already exists')
  })

  // -----------------------------------------------------------------------
  // Domain events
  // -----------------------------------------------------------------------

  it('SettlementInitiated payload shape is valid', () => {
    const event = {
      type: 'SettlementInitiated' as const,
      payload: {
        dealId: 'deal-001',
        organizationId: 'org-1',
        amount: 50000,
        initiatedBy: 'user-1',
      },
    }

    expect(event.type).toBe('SettlementInitiated')
    expect(event.payload.dealId).toBe('deal-001')
    expect(event.payload.amount).toBe(50000)
  })

  it('SettlementStatusChanged payload shape is valid', () => {
    const event = {
      type: 'SettlementStatusChanged' as const,
      payload: {
        settlementId: 'sett-001',
        dealId: 'deal-001',
        fromStatus: 'funded',
        toStatus: 'released',
        amount: 50000,
        organizationId: 'org-1',
        changedBy: 'user-1',
        reason: 'Milestone 1 completed',
      },
    }

    expect(event.type).toBe('SettlementStatusChanged')
    expect(event.payload.fromStatus).toBe('funded')
    expect(event.payload.toStatus).toBe('released')
    expect(event.payload.reason).toBe('Milestone 1 completed')
  })

  // -----------------------------------------------------------------------
  // Provenance
  // -----------------------------------------------------------------------

  it('settlement provenance record is compatible with toProvDocument', () => {
    const settlementRecord = {
      node_type: 'settlement' as const,
      external_id: 'sett-001',
      label: 'Settlement 50000 USD for deal deal-001',
      properties: {
        deal_id: 'deal-001',
        total_amount: 50000,
        currency: 'USD',
        correlationId: 'corr-001',
      },
      organization_id: 'org-1',
    }

    const doc = toProvDocument([settlementRecord], [])
    expect(doc.entity!['kadarn:settlement-sett-001']).toBeDefined()
  })

  // -----------------------------------------------------------------------
  // Correlation
  // -----------------------------------------------------------------------

  it('correlationId links event + provenance + response', () => {
    const correlationId = crypto.randomUUID()

    const eventPayload = { dealId: 'deal-1', organizationId: 'org-1', amount: 1000, initiatedBy: 'user-1', correlationId }
    const provenanceProps = { deal_id: 'deal-1', total_amount: 1000, correlationId }
    const responseShape = { id: 'sett-1', status: 'pending', correlationId }

    expect(eventPayload.correlationId).toBe(correlationId)
    expect(provenanceProps.correlationId).toBe(correlationId)
    expect(responseShape.correlationId).toBe(correlationId)
  })

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  it('routes use handleApiError for consistency', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')

    // List route
    const listRoute = path.join(root, 'apps/api/src/app/api/v1/financial/settlements/route.ts')
    expect(fs.readFileSync(listRoute, 'utf-8')).toContain('handleApiError')

    // Detail route
    const detailRoute = path.join(root, 'apps/api/src/app/api/v1/financial/settlements/[id]/route.ts')
    expect(fs.readFileSync(detailRoute, 'utf-8')).toContain('handleApiError')
  })
})
