export const MEMORY_DOMAIN_OPTIONS = [
  'Institutional Timeline',
  'Research History',
  'Capability Evolution',
  'Document History',
  'People History',
  'Location / Infrastructure History',
] as const

export type MemoryDomain = (typeof MEMORY_DOMAIN_OPTIONS)[number]

export interface InstitutionalMemoryEvent {
  id: string
  date: string
  title: string
  domain: MemoryDomain
  description: string
  linkedEvidence: string[]
}

export function createInstitutionalMemoryEvent(index: number): InstitutionalMemoryEvent {
  return {
    id: `memory-event-${Date.now()}-${index}`,
    date: '',
    title: '',
    domain: 'Institutional Timeline',
    description: '',
    linkedEvidence: [],
  }
}

export function normalizeMemoryEvents(events: InstitutionalMemoryEvent[]): InstitutionalMemoryEvent[] {
  return events.map((event) => ({
    ...event,
    linkedEvidence: Array.isArray(event.linkedEvidence) ? event.linkedEvidence : [],
  }))
}
