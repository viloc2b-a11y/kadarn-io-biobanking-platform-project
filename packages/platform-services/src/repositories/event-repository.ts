import type { InstitutionalEvent } from '@kadarn/types'

export class EventRepository {
  private events: Map<string, InstitutionalEvent> = new Map()

  async appendEvent(event: InstitutionalEvent): Promise<InstitutionalEvent> {
    this.events.set(event.id, event)
    return event
  }

  async fetchEvents(organizationId: string, limit: number, offset: number): Promise<InstitutionalEvent[]> {
    const all = Array.from(this.events.values())
      .filter((e) => e.organization_id === organizationId)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    return all.slice(offset, offset + limit)
  }

  async fetchEventById(id: string): Promise<InstitutionalEvent | null> {
    return this.events.get(id) ?? null
  }
}
