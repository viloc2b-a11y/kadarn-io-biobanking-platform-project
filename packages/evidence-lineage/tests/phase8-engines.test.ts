import { describe, it, expect, beforeEach } from 'vitest'
import { ReviewLifecycleEngine } from '../src/review-lifecycle.js'
import { ConfidenceStateEngine } from '../src/confidence-state.js'
import { PublishedViewEngine } from '../src/published-view.js'
import { EvidencePackEngine } from '../src/evidence-pack.js'

// ==========================================================================
// 28E — Review & Evidence Lifecycle
// ==========================================================================

describe('ReviewLifecycleEngine (28E)', () => {
  let engine: ReviewLifecycleEngine
  beforeEach(() => { engine = new ReviewLifecycleEngine() })

  it('requests review for a claim', () => {
    const event = engine.requestReview('claim:1', 'system')
    expect(event.eventType).toBe('review_requested')
    expect(event.claimId).toBe('claim:1')
  })

  it('approves a claim', () => {
    engine.requestReview('claim:1', 'system')
    const event = engine.approve('claim:1', 'reviewer', 'Evidence verified')
    expect(event.eventType).toBe('review_approved')
    expect(event.justification).toBe('Evidence verified')
  })

  it('rejects a claim', () => {
    engine.requestReview('claim:2', 'system')
    const event = engine.reject('claim:2', 'reviewer', 'Insufficient evidence')
    expect(event.eventType).toBe('review_rejected')
  })

  it('adds counter evidence', () => {
    const event = engine.addCounterEvidence('claim:3', 'institution', 'Data contradicts claim')
    expect(event.eventType).toBe('counter_evidence')
  })

  it('records right of response', () => {
    const event = engine.rightOfResponse('claim:4', 'institution', 'We dispute this finding')
    expect(event.eventType).toBe('right_of_response')
  })

  it('getEvents returns all events for a claim', () => {
    engine.requestReview('claim:5', 'system')
    engine.approve('claim:5', 'reviewer')
    expect(engine.getEvents('claim:5')).toHaveLength(2)
  })

  it('getStatus returns latest event type', () => {
    engine.requestReview('claim:6', 'system')
    expect(engine.getStatus('claim:6')).toBe('review_requested')
    engine.reject('claim:6', 'reviewer')
    expect(engine.getStatus('claim:6')).toBe('review_rejected')
  })

  it('getStatus returns none for unknown claim', () => {
    expect(engine.getStatus('unknown')).toBe('none')
  })
})

// ==========================================================================
// 28F — Confidence State Evolution
// ==========================================================================

describe('ConfidenceStateEngine (28F)', () => {
  let engine: ConfidenceStateEngine
  beforeEach(() => { engine = new ConfidenceStateEngine() })

  it('computes high confidence with strong supporting evidence', () => {
    engine.addNode({ nodeId: 'claim:1', type: 'claim', weight: 1 })
    engine.addNode({ nodeId: 'ev:1', type: 'evidence', weight: 5 })
    engine.addNode({ nodeId: 'ev:2', type: 'evidence', weight: 4 })
    engine.addEdge({ edgeId: 'e1', fromId: 'ev:1', toId: 'claim:1', relationship: 'supports', weight: 5 })
    engine.addEdge({ edgeId: 'e2', fromId: 'ev:2', toId: 'claim:1', relationship: 'supports', weight: 4 })

    const state = engine.compute('claim:1')
    expect(state.level).toBe('high')
    expect(state.value).toBeGreaterThanOrEqual(80)
  })

  it('computes low confidence with contradicting evidence', () => {
    engine.addNode({ nodeId: 'claim:2', type: 'claim', weight: 1 })
    engine.addNode({ nodeId: 'ev:3', type: 'evidence', weight: 1 })
    engine.addNode({ nodeId: 'ev:4', type: 'evidence', weight: 5 })
    engine.addEdge({ edgeId: 'e3', fromId: 'ev:3', toId: 'claim:2', relationship: 'supports', weight: 1 })
    engine.addEdge({ edgeId: 'e4', fromId: 'ev:4', toId: 'claim:2', relationship: 'contradicts', weight: 5 })

    const state = engine.compute('claim:2')
    expect(state.level === 'low' || state.level === 'insufficient').toBe(true)
    expect(state.value).toBeLessThan(60)
  })

  it('returns insufficient for unknown claim', () => {
    const state = engine.compute('nonexistent')
    expect(state.level).toBe('insufficient')
    expect(state.value).toBe(0)
  })

  it('getState retrieves computed state', () => {
    engine.addNode({ nodeId: 'claim:3', type: 'claim', weight: 1 })
    engine.addNode({ nodeId: 'ev:5', type: 'evidence', weight: 3 })
    engine.addEdge({ edgeId: 'e5', fromId: 'ev:5', toId: 'claim:3', relationship: 'supports', weight: 3 })

    engine.compute('claim:3')
    const state = engine.getState('claim:3')
    expect(state).toBeDefined()
    expect(state!.level).toBeDefined()
  })

  it('confidence inputs track contributions', () => {
    engine.addNode({ nodeId: 'claim:4', type: 'claim', weight: 1 })
    engine.addNode({ nodeId: 'ev:6', type: 'evidence', weight: 2 })
    engine.addEdge({ edgeId: 'e6', fromId: 'ev:6', toId: 'claim:4', relationship: 'supports', weight: 2 })

    const state = engine.compute('claim:4')
    expect(state.inputs.length).toBeGreaterThanOrEqual(1)
    expect(state.inputs[0].nodeId).toBe('ev:6')
  })
})

// ==========================================================================
// 28G — Published View Architecture
// ==========================================================================

describe('PublishedViewEngine (28G)', () => {
  let engine: PublishedViewEngine
  beforeEach(() => { engine = new PublishedViewEngine() })

  it('publishes canonical view with all fields', () => {
    const content = { statement: 'Test', internal_notes: 'secret', contact: 'email@test.com' }
    const view = engine.publish('claim:1', content, 'canonical', 'v1', PublishedViewEngine.defaultFilter)
    expect(view.viewType).toBe('canonical')
    expect(view.content.statement).toBe('Test')
    expect(view.content.internal_notes).toBe('secret') // canonical keeps everything
  })

  it('publishes public view with private fields filtered', () => {
    const content = { statement: 'Test', internal_notes: 'secret', contact: 'email@test.com', private_data: 'hidden' }
    const view = engine.publish('claim:2', content, 'public', 'v1', PublishedViewEngine.defaultFilter)
    expect(view.content.statement).toBe('Test')
    expect(view.content.internal_notes).toBeUndefined()
    expect(view.content.contact).toBeUndefined()
    expect(view.content.private_data).toBeUndefined()
    expect(view.filteredFields).toContain('internal_notes')
  })

  it('institution view removes internal_notes only', () => {
    const content = { statement: 'Test', internal_notes: 'secret', contact: 'email@test.com' }
    const view = engine.publish('claim:3', content, 'institution', 'v1', PublishedViewEngine.defaultFilter)
    expect(view.content.statement).toBe('Test')
    expect(view.content.internal_notes).toBeUndefined()
    expect(view.content.contact).toBe('email@test.com') // institution keeps contact
  })

  it('sponsor view keeps all fields', () => {
    const content = { statement: 'Test', internal_notes: 'secret' }
    const view = engine.publish('claim:4', content, 'sponsor', 'v1', PublishedViewEngine.defaultFilter)
    expect(view.content.internal_notes).toBe('secret')
  })

  it('getViews returns all views for a claim', () => {
    engine.publish('claim:5', { x: 1 }, 'canonical', 'v1', PublishedViewEngine.defaultFilter)
    engine.publish('claim:5', { x: 1 }, 'public', 'v1', PublishedViewEngine.defaultFilter)
    expect(engine.getViews('claim:5')).toHaveLength(2)
  })

  it('getCanonicalView returns the canonical view', () => {
    engine.publish('claim:6', { x: 1 }, 'canonical', 'v1', PublishedViewEngine.defaultFilter)
    engine.publish('claim:6', { x: 1 }, 'public', 'v1', PublishedViewEngine.defaultFilter)
    const canonical = engine.getCanonicalView('claim:6')
    expect(canonical).toBeDefined()
    expect(canonical!.viewType).toBe('canonical')
  })
})

// ==========================================================================
// 28H — Evidence Pack Engine
// ==========================================================================

describe('EvidencePackEngine (28H)', () => {
  let engine: EvidencePackEngine
  beforeEach(() => { engine = new EvidencePackEngine() })

  it('generates evidence pack with all sections', () => {
    const pack = engine.generate(
      'claim:1',
      'Institution provides biospecimen collection',
      [{ id: 'fact:1', content: { name: '500 samples' } }],
      { value: 85, level: 'high' },
      ['2024: First collection', '2025: Expanded'],
      ['Reviewed and approved'],
      ['PubMed:12345', 'CT.gov:NCT001'],
    )

    expect(pack.claimId).toBe('claim:1')
    expect(pack.claimStatement).toContain('biospecimen')
    expect(pack.supportingFacts).toHaveLength(1)
    expect(pack.confidence.level).toBe('high')
    expect(pack.timeline).toContain('2024: First collection')
    expect(pack.reviewHistory).toContain('Reviewed and approved')
    expect(pack.sources).toContain('PubMed:12345')
    expect(pack.evidenceGraph.nodes).toBe(2)
    expect(pack.evidenceGraph.edges).toBe(1)
  })

  it('getPack retrieves generated pack', () => {
    engine.generate('claim:2', 'Test', [], { value: 50, level: 'moderate' }, [], [], [])
    const pack = engine.getPack('claim:2')
    expect(pack).toBeDefined()
    expect(pack!.claimId).toBe('claim:2')
  })

  it('getPack returns undefined for unknown', () => {
    expect(engine.getPack('unknown')).toBeUndefined()
  })

  it('pack IDs are unique', () => {
    const p1 = engine.generate('c1', 'S1', [], { value: 50, level: 'moderate' }, [], [], [])
    const p2 = engine.generate('c2', 'S2', [], { value: 50, level: 'moderate' }, [], [], [])
    expect(p1.packId).not.toBe(p2.packId)
  })

  it('evidence graph reflects fact count', () => {
    const pack = engine.generate(
      'c3', 'S3',
      [{ id: 'f1', content: {} }, { id: 'f2', content: {} }, { id: 'f3', content: {} }],
      { value: 90, level: 'high' }, [], [], [],
    )
    expect(pack.evidenceGraph.nodes).toBe(4) // claim + 3 facts
    expect(pack.evidenceGraph.edges).toBe(3)
  })
})
