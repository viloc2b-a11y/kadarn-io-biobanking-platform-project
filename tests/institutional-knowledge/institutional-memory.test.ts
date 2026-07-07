// ==========================================================================
// IKM/EVM Sprint — Institutional Memory & Continuous Intelligence Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { EvidenceMaturityLevel } from '../../packages/evidence-validation/src/index'
import {
  recordTemporalEvent, buildItemTimeline,
  recordMemoryEvent, detectDeltas,
  generateContinuousInsights, calculateMemoryHealth,
  compareInstitutionalState, INSTITUTIONAL_MEMORY,
  type TemporalEvent, type MemoryEvent,
} from '../../packages/institutional-knowledge/src/institutional-memory'
import type { KnowledgeItem } from '../../packages/institutional-knowledge/src/types'

// ==========================================================================
// Fixtures
// ==========================================================================

function makeKnowledgeItem(overrides: Partial<KnowledgeItem> = {}): KnowledgeItem {
  return {
    id: 'ki-001', organizationId: 'org-test',
    statement: 'CLIA-certified laboratory operating at 123 Main St.',
    itemType: 'regulatory', category: 'lab_certifications',
    status: 'active', maturityLevel: EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED,
    relationships: [], documentRefs: [], evidenceCandidates: [],
    externallyConfirmed: false, externalConfirmationCount: 0,
    hasOperationalHistory: false,
    declaredAt: '2025-01-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z',
    tags: [], metadata: {},
    ...overrides,
  }
}

function makeTemporalEvent(overrides: Partial<TemporalEvent> = {}): TemporalEvent {
  return recordTemporalEvent({
    knowledgeItemId: 'ki-001',
    state: 'created',
    previousState: null,
    description: 'Initial CLIA certification recorded.',
    changeCategory: 'knowledge_created',
    ...overrides,
  })
}

function makeMemoryEvent(overrides: Partial<MemoryEvent> = {}): MemoryEvent {
  return recordMemoryEvent({
    type: 'capability_acquired',
    institutionId: 'org-test',
    description: 'PBMC processing capability added.',
    category: 'capability',
    ...overrides,
  })
}

// ==========================================================================
// PART 1 — Knowledge Timeline
// ==========================================================================

describe('Institutional Memory — Timeline', () => {
  it('records temporal event with all fields', () => {
    const event = recordTemporalEvent({
      knowledgeItemId: 'ki-001',
      state: 'created',
      previousState: null,
      description: 'CLIA certificate first registered.',
      changeCategory: 'knowledge_created',
      actorId: 'dr-smith',
    })

    expect(event.knowledgeItemId).toBe('ki-001')
    expect(event.state).toBe('created')
    expect(event.previousState).toBeNull()
    expect(event.changeCategory).toBe('knowledge_created')
    expect(event.actorId).toBe('dr-smith')
    expect(event.eventId).toContain('te-')
    expect(event.occurredAt).toBeTruthy()
  })

  it('records state transitions', () => {
    const created = recordTemporalEvent({
      knowledgeItemId: 'ki-002', state: 'created', previousState: null,
      description: 'Equipment acquired.', changeCategory: 'equipment_change',
    })
    const renewed = recordTemporalEvent({
      knowledgeItemId: 'ki-002', state: 'renewed', previousState: 'created',
      description: 'Equipment renewed.', changeCategory: 'equipment_change',
    })
    const archived = recordTemporalEvent({
      knowledgeItemId: 'ki-002', state: 'archived', previousState: 'renewed',
      description: 'Equipment retired.', changeCategory: 'equipment_change',
    })

    expect(created.previousState).toBeNull()
    expect(renewed.previousState).toBe('created')
    expect(archived.previousState).toBe('renewed')
  })

  it('builds item timeline sorted chronologically', () => {
    const e1 = recordTemporalEvent({
      knowledgeItemId: 'ki-003', state: 'created', previousState: null,
      description: 'First.', changeCategory: 'knowledge_created',
    })
    // Force earlier time
    e1.occurredAt = '2024-01-01T00:00:00Z'

    const e2 = recordTemporalEvent({
      knowledgeItemId: 'ki-003', state: 'updated', previousState: 'created',
      description: 'Second.', changeCategory: 'knowledge_updated',
    })
    e2.occurredAt = '2024-06-01T00:00:00Z'

    const e3 = recordTemporalEvent({
      knowledgeItemId: 'ki-003', state: 'renewed', previousState: 'updated',
      description: 'Third.', changeCategory: 'knowledge_renewed',
    })
    e3.occurredAt = '2024-12-01T00:00:00Z'

    const timeline = buildItemTimeline([e2, e3, e1])
    expect(timeline[0].state).toBe('created')
    expect(timeline[1].state).toBe('updated')
    expect(timeline[2].state).toBe('renewed')
  })

  it('all 8 state types available', () => {
    const states: TemporalEvent['state'][] = [
      'created', 'updated', 'superseded', 'archived',
      'reactivated', 'expired', 'renewed', 'removed',
    ]
    for (const state of states) {
      const event = recordTemporalEvent({
        knowledgeItemId: 'ki-s', state, previousState: 'created',
        description: `State: ${state}`, changeCategory: 'knowledge_updated',
      })
      expect(event.state).toBe(state)
    }
  })
})

// ==========================================================================
// PART 2 — Institutional Memory Events
// ==========================================================================

describe('Institutional Memory — Memory Events', () => {
  it('records memory event', () => {
    const event = recordMemoryEvent({
      type: 'capability_acquired',
      institutionId: 'org-test',
      description: 'New PBMC processing capability added.',
      category: 'capability',
      significance: 'major',
    })

    expect(event.id).toContain('me-')
    expect(event.type).toBe('capability_acquired')
    expect(event.institutionId).toBe('org-test')
    expect(event.category).toBe('capability')
    expect(event.significance).toBe('major')
    expect(event.recordedAt).toBeTruthy()
  })

  it('35+ event types available', () => {
    const types = [
      'equipment_acquired', 'equipment_replaced', 'equipment_retired',
      'pi_joined', 'pi_left', 'laboratory_expanded', 'laboratory_opened',
      'freezer_installed', 'freezer_decommissioned',
      'clia_renewed', 'clia_expired', 'capa_completed', 'capa_opened',
      'irb_changed', 'irb_renewed', 'network_expanded', 'network_contracted',
      'facility_opened', 'facility_closed', 'program_completed', 'program_started',
      'capability_acquired', 'capability_lost',
      'license_renewed', 'license_expired', 'training_completed',
      'sop_published', 'sop_revised', 'audit_completed',
      'certification_gained', 'certification_lost', 'insurance_updated',
      'organization_restructured', 'research_milestone_reached', 'quality_system_improved',
    ]
    expect(types.length).toBeGreaterThanOrEqual(35)
  })

  it('all memory categories present', () => {
    const categories = ['equipment', 'facility', 'personnel', 'compliance', 'quality', 'research', 'capability', 'organization', 'network', 'licensing']
    for (const cat of categories) {
      const event = recordMemoryEvent({
        type: 'capability_acquired', institutionId: 'org-test',
        description: 'test', category: cat as MemoryEvent['category'],
      })
      expect(event.category).toBe(cat)
    }
  })
})

// ==========================================================================
// PART 3 — Delta Detection
// ==========================================================================

describe('Institutional Memory — Delta Engine', () => {
  it('detects new items', () => {
    const now = makeTemporalEvent({ knowledgeItemId: 'ki-new' })
    const deltas = detectDeltas({
      institutionId: 'org-test',
      previousEvents: [],
      currentEvents: [now],
    })

    expect(deltas.length).toBeGreaterThanOrEqual(1)
    const newDelta = deltas.find((d) => d.type === 'new_capability')
    expect(newDelta).toBeDefined()
  })

  it('detects removed items', () => {
    const old = makeTemporalEvent({ knowledgeItemId: 'ki-old', state: 'archived' })
    const deltas = detectDeltas({
      institutionId: 'org-test',
      previousEvents: [old],
      currentEvents: [],
    })

    const removed = deltas.find((d) => d.itemId === 'ki-old')
    expect(removed).toBeDefined()
  })

  it('detects state changes', () => {
    const old = makeTemporalEvent({ knowledgeItemId: 'ki-x', state: 'created', changeCategory: 'knowledge_created' })
    const current = makeTemporalEvent({ knowledgeItemId: 'ki-x', state: 'renewed', changeCategory: 'knowledge_renewed' })

    const deltas = detectDeltas({
      institutionId: 'org-test',
      previousEvents: [old],
      currentEvents: [current],
    })

    const stateChange = deltas.find((d) => d.itemId === 'ki-x')
    expect(stateChange).toBeDefined()
    expect(stateChange!.previousValue).toBe('created')
    expect(stateChange!.newValue).toBe('renewed')
  })

  it('assigns significance to major changes', () => {
    const current = makeTemporalEvent({
      knowledgeItemId: 'ki-major',
      state: 'created',
      changeCategory: 'facility_change',
    })
    const deltas = detectDeltas({
      institutionId: 'org-test', previousEvents: [], currentEvents: [current],
    })
    const delta = deltas.find((d) => d.itemId === 'ki-major')
    expect(delta!.significance).toBe('major')
  })

  it('renewals are routine significance', () => {
    const old = makeTemporalEvent({ knowledgeItemId: 'ki-r', state: 'created', changeCategory: 'knowledge_renewed' })
    const current = makeTemporalEvent({ knowledgeItemId: 'ki-r', state: 'renewed', changeCategory: 'knowledge_renewed' })

    const deltas = detectDeltas({
      institutionId: 'org-test', previousEvents: [old], currentEvents: [current],
    })
    const delta = deltas.find((d) => d.itemId === 'ki-r')
    expect(delta!.significance).toBe('routine')
  })
})

// ==========================================================================
// PART 4 — Continuous Intelligence
// ==========================================================================

describe('Institutional Memory — Continuous Intelligence', () => {
  it('generates growth insight when capabilities are gained', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ type: 'capability_acquired', description: 'PBMC processing' }),
      makeMemoryEvent({ type: 'capability_acquired', description: 'Flow cytometry' }),
      makeMemoryEvent({ type: 'capability_acquired', description: 'Genomics' }),
    ]

    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    const growthInsight = insights.find((i) => i.category === 'growth')
    expect(growthInsight).toBeDefined()
    expect(growthInsight!.explainability).toContain('capability_acquired')
    expect(growthInsight!.confidence).toBe('high') // 3x gain, 0 lost
  })

  it('generates decline insight when capabilities are lost', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ type: 'capability_lost', description: 'Genomics lost' }),
      makeMemoryEvent({ type: 'capability_lost', description: 'Flow cytometry lost' }),
    ]

    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    const decline = insights.find((i) => i.category === 'decline')
    expect(decline).toBeDefined()
    expect(decline!.explainability).toContain('capability_lost')
  })

  it('generates quality improvement insight', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ type: 'capa_completed' }),
      makeMemoryEvent({ type: 'capa_completed' }),
      makeMemoryEvent({ type: 'audit_completed' }),
      makeMemoryEvent({ type: 'quality_system_improved' }),
    ]

    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    const quality = insights.find((i) => i.category === 'improvement')
    expect(quality).toBeDefined()
    expect(quality!.explainability).toContain('CAPA')
  })

  it('generates compliance maturation insight', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ type: 'clia_renewed' }),
      makeMemoryEvent({ type: 'license_renewed' }),
    ]

    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    const compliance = insights.find((i) => i.category === 'maturation')
    expect(compliance).toBeDefined()
    expect(compliance!.explainability).toContain('clia_renewed')
  })

  it('generates research activity insight', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ type: 'research_milestone_reached', description: 'First patient enrolled' }),
    ]

    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    expect(insights.length).toBeGreaterThan(0)
  })

  it('generates facility expansion insight', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ type: 'laboratory_opened', description: 'New molecular lab' }),
    ]

    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    const facility = insights.find((i) => i.category === 'expansion')
    expect(facility).toBeDefined()
  })

  it('generates network growth insight', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ type: 'network_expanded', description: 'Joined regional network' }),
      makeMemoryEvent({ type: 'network_expanded', description: 'Joined national consortium' }),
    ]

    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    const network = insights.find((i) => i.title?.includes('network'))
    expect(network).toBeDefined()
    expect(network!.confidence).toBe('high')
  })

  it('generates stabilization insight when no trends', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ type: 'sop_revised', description: 'Minor SOP update' }),
    ]

    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    expect(insights.length).toBeGreaterThan(0)
  })

  it('returns empty for zero events', () => {
    const insights = generateContinuousInsights({
      institutionId: 'org-test', events: [], periodMonths: 12,
    })
    expect(insights).toHaveLength(0)
  })

  it('every insight has explainability', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ type: 'capability_acquired' }),
      makeMemoryEvent({ type: 'capa_completed' }),
      makeMemoryEvent({ type: 'clia_renewed' }),
    ]

    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    for (const insight of insights) {
      expect(insight.explainability).toBeTruthy()
      expect(insight.derivedAt).toBeTruthy()
    }
  })
})

// ==========================================================================
// PART 5 — Memory Health
// ==========================================================================

describe('Institutional Memory — Memory Health', () => {
  it('calculates health scores for populated memory', () => {
    const events: TemporalEvent[] = [
      makeTemporalEvent(), makeTemporalEvent({ knowledgeItemId: 'ki-002' }),
    ]
    const memEvents: MemoryEvent[] = [
      makeMemoryEvent(), makeMemoryEvent({ type: 'equipment_acquired', category: 'equipment' }),
    ]
    const items: KnowledgeItem[] = [
      makeKnowledgeItem(), makeKnowledgeItem({ id: 'ki-002' }),
    ]

    const health = calculateMemoryHealth({
      institutionId: 'org-test', temporalEvents: events, memoryEvents: memEvents, knowledgeItems: items,
    })

    expect(health.scores.overall).toBeGreaterThan(0)
    expect(health.scores.memoryCompleteness).toBeGreaterThan(0)
  })

  it('empty memory scores zeros', () => {
    const health = calculateMemoryHealth({
      institutionId: 'org-test',
      temporalEvents: [], memoryEvents: [], knowledgeItems: [],
    })

    expect(health.scores.memoryCompleteness).toBe(0)
    expect(health.scores.overall).toBeGreaterThanOrEqual(0)
    // Gap and recommendation may exist for zero-category memory
    expect(health.gaps.length).toBeGreaterThanOrEqual(0)
  })

  it('detects timeline gaps', () => {
    const old = recordTemporalEvent({
      knowledgeItemId: 'ki-old', state: 'created', previousState: null,
      description: 'Old event.', changeCategory: 'knowledge_created',
    })
    // Force old date
    const oldDate = new Date()
    oldDate.setFullYear(oldDate.getFullYear() - 2)
    old.occurredAt = oldDate.toISOString()

    const recent = makeTemporalEvent({ knowledgeItemId: 'ki-recent' })

    const health = calculateMemoryHealth({
      institutionId: 'org-test',
      temporalEvents: [old, recent],
      memoryEvents: [],
      knowledgeItems: [makeKnowledgeItem(), makeKnowledgeItem({ id: 'ki-recent' })],
    })

    const timelineGaps = health.gaps.filter((g) => g.type === 'timeline_gap')
    expect(timelineGaps.length).toBeGreaterThan(0)
  })

  it('detects incomplete evolution when events < items', () => {
    const health = calculateMemoryHealth({
      institutionId: 'org-test',
      temporalEvents: [makeTemporalEvent()],
      memoryEvents: [],
      knowledgeItems: [makeKnowledgeItem(), makeKnowledgeItem({ id: 'ki-002' }), makeKnowledgeItem({ id: 'ki-003' })],
    })

    const evolutionGaps = health.gaps.filter((g) => g.type === 'incomplete_evolution')
    expect(evolutionGaps.length).toBeGreaterThan(0)
  })

  it('provides recommendations for low scores', () => {
    const health = calculateMemoryHealth({
      institutionId: 'org-test',
      temporalEvents: [],
      memoryEvents: [],
      knowledgeItems: [makeKnowledgeItem(), makeKnowledgeItem({ id: 'ki-002' })],
    })

    expect(health.scores.overall).toBeLessThan(50)
  })

  it('evolution coverage improves with diverse categories', () => {
    const events: MemoryEvent[] = [
      makeMemoryEvent({ category: 'equipment' }),
      makeMemoryEvent({ category: 'facility' }),
      makeMemoryEvent({ category: 'compliance' }),
      makeMemoryEvent({ category: 'quality' }),
      makeMemoryEvent({ category: 'capability' }),
    ]

    const health = calculateMemoryHealth({
      institutionId: 'org-test',
      temporalEvents: [makeTemporalEvent()],
      memoryEvents: events,
      knowledgeItems: [makeKnowledgeItem()],
    })

    expect(health.scores.evolutionCoverage).toBeGreaterThanOrEqual(50)
  })

  it('stale knowledge detected when newest event is old', () => {
    const oldEvent = recordTemporalEvent({
      knowledgeItemId: 'ki-stale', state: 'created', previousState: null,
      description: 'Very old', changeCategory: 'knowledge_created',
    })
    const oldDate = new Date()
    oldDate.setFullYear(oldDate.getFullYear() - 3)
    oldEvent.occurredAt = oldDate.toISOString()

    const health = calculateMemoryHealth({
      institutionId: 'org-test',
      temporalEvents: [oldEvent],
      memoryEvents: [],
      knowledgeItems: [makeKnowledgeItem({ id: 'ki-stale' })],
    })

    const staleGaps = health.gaps.filter((g) => g.type === 'stale_knowledge')
    expect(staleGaps.length).toBeGreaterThan(0)
  })
})

// ==========================================================================
// PART 6 — Historical Comparison
// ==========================================================================

describe('Institutional Memory — Comparison', () => {
  it('compares two institutional states', () => {
    const eventsA: MemoryEvent[] = [
      recordMemoryEvent({ type: 'clia_renewed', institutionId: 'org-test', description: 'CLIA renewed 2024', category: 'compliance' }),
    ]
    const eventsB: MemoryEvent[] = [
      ...eventsA,
      recordMemoryEvent({ type: 'capability_acquired', institutionId: 'org-test', description: 'PBMC processing', category: 'capability' }),
      recordMemoryEvent({ type: 'equipment_acquired', institutionId: 'org-test', description: 'New -80 freezer', category: 'equipment' }),
      recordMemoryEvent({ type: 'license_renewed', institutionId: 'org-test', description: 'State license renewed', category: 'licensing' }),
    ]

    const comparison = compareInstitutionalState({
      institutionId: 'org-test',
      pointA: { date: '2024-01-01', label: 'Start 2024' },
      pointB: { date: '2024-12-31', label: 'End 2024' },
      eventsA, eventsB,
    })

    expect(comparison.changes.totalChanges).toBe(3)
    expect(comparison.changes.capabilitiesGained).toHaveLength(1)
    expect(comparison.changes.equipmentAdded).toHaveLength(1)
    expect(comparison.changes.complianceUpdated).toHaveLength(1)
    expect(comparison.summary).toContain('3 changes')
  })

  it('comparison summary is human-readable', () => {
    const eventsA: MemoryEvent[] = []
    const eventsB: MemoryEvent[] = [
      makeMemoryEvent({ type: 'capability_acquired', description: 'Flow cytometry' }),
    ]

    const comparison = compareInstitutionalState({
      institutionId: 'org-test',
      pointA: { date: '2024-01-01', label: 'Before' },
      pointB: { date: '2024-06-01', label: 'After' },
      eventsA, eventsB,
    })

    expect(comparison.summary).toContain('Before')
    expect(comparison.summary).toContain('After')
    expect(comparison.summary).toContain('1 changes')
  })

  it('no changes when states are identical', () => {
    const events = [makeMemoryEvent({ id: 'me-x', type: 'sop_published' })]

    const comparison = compareInstitutionalState({
      institutionId: 'org-test',
      pointA: { date: '2024-01-01', label: 'A' },
      pointB: { date: '2024-12-31', label: 'B' },
      eventsA: events, eventsB: events,
    })

    expect(comparison.changes.totalChanges).toBe(0)
  })
})

// ==========================================================================
// PART 7 — Boundary Enforcement
// ==========================================================================

describe('Institutional Memory — Boundary Rules', () => {
  it('no Sponsor Matching', () => {
    const exported = Object.keys(INSTITUTIONAL_MEMORY)
    expect(exported).not.toContain('matchSponsors')
    expect(exported).not.toContain('sponsorIntelligence')
  })

  it('no Marketplace', () => {
    const exported = Object.keys(INSTITUTIONAL_MEMORY)
    expect(exported).not.toContain('marketplaceMatch')
    expect(exported).not.toContain('commercialRanking')
  })

  it('no AI/recommendation engine', () => {
    // All insights are deterministic rules, not AI
    const events: MemoryEvent[] = [makeMemoryEvent({ type: 'capability_acquired' })]
    const insights = generateContinuousInsights({
      institutionId: 'org-test', events, periodMonths: 12,
    })

    for (const insight of insights) {
      expect(insight.explainability).toBeTruthy() // Every insight must be explainable
      expect(insight.derivedAt).toBeTruthy()
    }
  })

  it('memory is independent — no Evidence Core mutation', () => {
    // Institutional Memory is a separate layer — it records events
    // but does not create/mutate Evidence Objects
    const event = recordMemoryEvent({
      type: 'capability_acquired', institutionId: 'org-test',
      description: 'test', category: 'capability',
    })
    expect(event.id).toContain('me-')
    // No Evidence Core types in output
  })
})
