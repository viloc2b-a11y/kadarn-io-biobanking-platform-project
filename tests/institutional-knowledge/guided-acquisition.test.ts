// ==========================================================================
// Sprint A6 — Guided Knowledge Acquisition Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  generateNextBestActions, buildProgressPath,
  generateCompletionRoadmap, determineGrowthPath,
  GUIDED_ACQUISITION,
  type NextBestAction, type PeopleRisk, type LabRisk, type DocumentGap,
} from '../../packages/institutional-knowledge/src/guided-acquisition'

// ==========================================================================
// Fixtures
// ==========================================================================

function makePeopleRisks(): PeopleRisk[] {
  return [
    {
      riskType: 'missing_license', personId: 'p-1', personName: 'Dr. Smith',
      severity: 'critical',
      description: 'No medical license recorded.',
      recommendedAction: 'Upload medical license for Dr. Smith.',
      detectedAt: new Date().toISOString(),
    },
    {
      riskType: 'expired_training', personId: 'p-2', personName: 'Nurse Jones',
      severity: 'high',
      description: 'GCP training expired.',
      recommendedAction: 'Renew GCP training for Nurse Jones.',
      detectedAt: new Date().toISOString(),
    },
  ]
}

function makeLabRisks(): LabRisk[] {
  return [
    {
      riskType: 'capacity_risk', labId: 'lab-1',
      severity: 'critical',
      description: 'Freezer at 97% capacity.',
      affectedUnitId: 'su-1', affectedWorkflowId: null,
      recommendedAction: 'Expand storage or archive specimens.',
      detectedAt: new Date().toISOString(),
    },
  ]
}

function makeDocumentGaps(): DocumentGap[] {
  return [
    {
      gapType: 'missing_required', documentId: null, documentLabel: 'clia_certificate',
      severity: 'critical',
      description: 'Required document type "clia_certificate" is not present.',
      recommendedAction: 'Upload CLIA certificate.',
      detectedAt: new Date().toISOString(),
    },
    {
      gapType: 'expired', documentId: 'doc-2', documentLabel: 'Old License',
      severity: 'critical',
      description: 'Document "Old License" expired.',
      recommendedAction: 'Renew Old License.',
      detectedAt: new Date().toISOString(),
    },
  ]
}

// ==========================================================================
// PART 1 — Next Best Actions
// ==========================================================================

describe('Guided Acquisition — Next Best Actions', () => {
  it('generates actions from people risks', () => {
    const actions = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: makePeopleRisks(),
      labRisks: [],
      documentGaps: [],
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 5, documents: 10, equipment: 5, facilities: 2, laboratories: 2, capabilities: 10, programs: 3, relationships: 15 },
    })

    expect(actions.length).toBeGreaterThan(0)
    const peopleActions = actions.filter((a) => a.domain === 'people')
    expect(peopleActions.length).toBeGreaterThanOrEqual(2)
  })

  it('generates actions from document gaps', () => {
    const actions = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: [],
      labRisks: [],
      documentGaps: makeDocumentGaps(),
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 5, documents: 10, equipment: 5, facilities: 2, laboratories: 2, capabilities: 10, programs: 3, relationships: 15 },
    })

    const docActions = actions.filter((a) => a.domain === 'documents')
    expect(docActions.length).toBeGreaterThanOrEqual(2)
  })

  it('generates actions from lab risks', () => {
    const actions = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: [],
      labRisks: makeLabRisks(),
      documentGaps: [],
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 5, documents: 10, equipment: 5, facilities: 2, laboratories: 2, capabilities: 10, programs: 3, relationships: 15 },
    })

    const labActions = actions.filter((a) => a.domain === 'laboratories')
    expect(labActions.length).toBeGreaterThan(0)
  })

  it('suggests structural actions for sparse institutions', () => {
    const actions = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: [],
      labRisks: [],
      documentGaps: [],
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 1, documents: 2, equipment: 0, facilities: 0, laboratories: 0, capabilities: 0, programs: 0, relationships: 0 },
    })

    // Should suggest adding people and documents
    const peopleAction = actions.find((a) => a.actionType === 'add_person')
    const docAction = actions.find((a) => a.actionType === 'upload_document')
    const labAction = actions.find((a) => a.actionType === 'add_laboratory')

    expect(peopleAction).toBeDefined()
    expect(docAction).toBeDefined()
    expect(labAction).toBeDefined()
  })

  it('actions are sorted by priority', () => {
    const actions = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: makePeopleRisks(),
      labRisks: makeLabRisks(),
      documentGaps: makeDocumentGaps(),
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 5, documents: 10, equipment: 5, facilities: 2, laboratories: 2, capabilities: 10, programs: 3, relationships: 15 },
    })

    for (let i = 1; i < actions.length; i++) {
      expect(actions[i].recommendedOrder).toBeGreaterThanOrEqual(actions[i - 1].recommendedOrder)
    }
  })

  it('every action has impact scores', () => {
    const actions = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: makePeopleRisks(),
      labRisks: [],
      documentGaps: makeDocumentGaps(),
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 5, documents: 10, equipment: 5, facilities: 2, laboratories: 2, capabilities: 10, programs: 3, relationships: 15 },
    })

    for (const action of actions) {
      expect(action.impact.overallScore).toBeGreaterThan(0)
    }
  })
})

// ==========================================================================
// PART 2 — Progress Path
// ==========================================================================

describe('Guided Acquisition — Progress Path', () => {
  it('builds progress path from actions', () => {
    const actions = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: makePeopleRisks(),
      labRisks: [],
      documentGaps: makeDocumentGaps(),
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 5, documents: 10, equipment: 5, facilities: 2, laboratories: 2, capabilities: 10, programs: 3, relationships: 15 },
    })

    const path = buildProgressPath({
      institutionId: 'org-test',
      actions,
      completedActionIds: [actions[0].actionId],
    })

    expect(path.totalSteps).toBe(actions.length)
    expect(path.completedSteps).toBe(1)
    expect(path.completionPercentage).toBeGreaterThan(0)
    expect(path.estimatedRemainingMinutes).toBeGreaterThan(0)
  })

  it('empty actions produces empty path', () => {
    const path = buildProgressPath({
      institutionId: 'org-test',
      actions: [],
      completedActionIds: [],
    })

    expect(path.totalSteps).toBe(0)
    expect(path.completionPercentage).toBe(0)
  })
})

// ==========================================================================
// PART 3 — Completion Roadmap
// ==========================================================================

describe('Guided Acquisition — Roadmap', () => {
  it('generates 5-phase roadmap', () => {
    const actions = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: makePeopleRisks(),
      labRisks: makeLabRisks(),
      documentGaps: makeDocumentGaps(),
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 1, documents: 2, equipment: 0, facilities: 0, laboratories: 0, capabilities: 0, programs: 0, relationships: 0 },
    })

    const roadmap = generateCompletionRoadmap({
      institutionId: 'org-test',
      actions,
    })

    expect(roadmap.phases).toHaveLength(5)
    expect(roadmap.phases[0].name).toContain('Foundation')
    expect(roadmap.phases[1].name).toContain('Infrastructure')
    expect(roadmap.phases[2].name).toContain('Capabilities')
    expect(roadmap.phases[3].name).toContain('Graph')
    expect(roadmap.phases[4].name).toContain('Excellence')
    expect(roadmap.criticalPath.length).toBeGreaterThan(0)
  })

  it('each phase has completion criteria', () => {
    const actions = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: makePeopleRisks(),
      labRisks: [],
      documentGaps: makeDocumentGaps(),
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 5, documents: 10, equipment: 5, facilities: 2, laboratories: 2, capabilities: 10, programs: 3, relationships: 15 },
    })

    const roadmap = generateCompletionRoadmap({
      institutionId: 'org-test', actions,
    })

    for (const phase of roadmap.phases) {
      expect(phase.completionCriteria.length).toBeGreaterThan(0)
      expect(phase.unlocks.length).toBeGreaterThan(0)
    }
  })
})

// ==========================================================================
// PART 4 — Growth Path
// ==========================================================================

describe('Guided Acquisition — Growth Path', () => {
  it('determines emerging stage for low scores', () => {
    const path = determineGrowthPath({
      institutionId: 'org-test',
      coverageScore: 15, documentHealth: 10, peopleHealth: 10,
      labHealth: 10, graphHealth: 10, hasEvidencePromotion: false,
    })

    expect(path.currentStage).toBe('emerging')
    expect(path.nextStage).toBe('developing')
    expect(path.recommendedFocus).toContain('documents')
  })

  it('determines advanced stage for high scores', () => {
    const path = determineGrowthPath({
      institutionId: 'org-test',
      coverageScore: 80, documentHealth: 85, peopleHealth: 80,
      labHealth: 75, graphHealth: 70, hasEvidencePromotion: true,
    })

    expect(path.currentStage).toBe('advanced')
    expect(path.nextStage).toBe('leading')
  })

  it('determines leading stage for near-perfect scores', () => {
    const path = determineGrowthPath({
      institutionId: 'org-test',
      coverageScore: 95, documentHealth: 95, peopleHealth: 95,
      labHealth: 95, graphHealth: 95, hasEvidencePromotion: true,
    })

    expect(path.currentStage).toBe('leading')
    expect(path.nextStage).toBeNull()
  })

  it('growth indicators show progress to targets', () => {
    const path = determineGrowthPath({
      institutionId: 'org-test',
      coverageScore: 45, documentHealth: 50, peopleHealth: 40,
      labHealth: 55, graphHealth: 30, hasEvidencePromotion: false,
    })

    expect(path.growthIndicators).toHaveLength(5)
    for (const indicator of path.growthIndicators) {
      expect(indicator.percentage).toBeGreaterThan(0)
      expect(indicator.targetValue).toBe(90)
    }
  })
})

// ==========================================================================
// PART 5 — Boundary
// ==========================================================================

describe('Guided Acquisition — Boundary', () => {
  it('no AI — all deterministic rules', () => {
    const actions1 = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: makePeopleRisks(),
      labRisks: [],
      documentGaps: makeDocumentGaps(),
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 5, documents: 10, equipment: 5, facilities: 2, laboratories: 2, capabilities: 10, programs: 3, relationships: 15 },
    })

    const actions2 = generateNextBestActions({
      institutionId: 'org-test',
      peopleRisks: makePeopleRisks(),
      labRisks: [],
      documentGaps: makeDocumentGaps(),
      graphHealth: null,
      coverage: null,
      existingCounts: { people: 5, documents: 10, equipment: 5, facilities: 2, laboratories: 2, capabilities: 10, programs: 3, relationships: 15 },
    })

    expect(actions1).toEqual(actions2)
  })

  it('no Sponsor Matching', () => {
    const exported = Object.keys(GUIDED_ACQUISITION)
    expect(exported).not.toContain('matchSponsors')
  })
})
