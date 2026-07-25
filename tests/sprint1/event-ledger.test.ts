import { describe, it, expect } from 'vitest'
import { EventRepository } from '@kadarn/platform-services'
import type { InstitutionalEvent } from '@kadarn/types'

describe('Event Ledger (Package A)', () => {
  const repo = new EventRepository()

  const makeEvent = (): InstitutionalEvent => ({
    id: crypto.randomUUID(),
    organization_id: crypto.randomUUID(),
    event_type: 'test_event',
    event_version: 1,
    occurred_at: new Date().toISOString(),
    recorded_at: new Date().toISOString(),
    actor_type: 'system',
  })

  it('should append and retrieve an event', async () => {
    const event = makeEvent()
    const saved = await repo.appendEvent(event)
    expect(saved.id).toBe(event.id)

    const fetched = await repo.fetchEventById(event.id)
    expect(fetched).not.toBeNull()
    expect(fetched?.id).toBe(event.id)
  })

  it('should return null for non-existent event', async () => {
    const fetched = await repo.fetchEventById(crypto.randomUUID())
    expect(fetched).toBeNull()
  })

  it('should filter events by organization_id', async () => {
    const orgId = crypto.randomUUID()
    const e1 = { ...makeEvent(), organization_id: orgId }
    const e2 = { ...makeEvent(), organization_id: orgId }
    const e3 = { ...makeEvent(), organization_id: crypto.randomUUID() }

    await repo.appendEvent(e1)
    await repo.appendEvent(e2)
    await repo.appendEvent(e3)

    const results = await repo.fetchEvents(orgId, 50, 0)
    expect(results).toHaveLength(2)
    expect(results.every((e) => e.organization_id === orgId)).toBe(true)
  })
})
