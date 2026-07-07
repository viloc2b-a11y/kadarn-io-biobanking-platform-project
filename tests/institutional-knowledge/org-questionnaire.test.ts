// ==========================================================================
// IKM Content Sprint 1 — Organization Questionnaire Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  ORGANIZATION_QUESTIONNAIRE,
  ORGANIZATION_QUESTIONNAIRE_STATS,
  buildOrganizationQuestionnaire,
} from '../../packages/institutional-knowledge/src/content/org-questionnaire'
import { computeQuestionnaireProgress } from '../../packages/institutional-knowledge/src/questionnaire-engine'

describe('Organization Questionnaire — Structure', () => {
  it('has 7 sections', () => {
    expect(ORGANIZATION_QUESTIONNAIRE.sections).toHaveLength(7)
  })

  it('section names are user-facing and progressive', () => {
    const names = ORGANIZATION_QUESTIONNAIRE.sections.map((s) => s.title)
    expect(names).toEqual([
      'Organization Identity',
      'Legal & Registration',
      'Locations & Facilities',
      'Key Contacts & Leadership',
      'Research Profile & Capabilities',
      'Networks & Affiliations',
      'Growth & Strategic Direction',
    ])
  })

  it('every section has questions', () => {
    for (const section of ORGANIZATION_QUESTIONNAIRE.sections) {
      expect(section.questions.length).toBeGreaterThan(0)
    }
  })

  it('has 30+ total questions', () => {
    expect(ORGANIZATION_QUESTIONNAIRE_STATS.totalQuestions).toBeGreaterThan(30)
  })

  it('has required questions for compliance-critical fields', () => {
    expect(ORGANIZATION_QUESTIONNAIRE_STATS.requiredQuestions).toBeGreaterThan(10)
  })

  it('has document upload questions for evidence generation', () => {
    expect(ORGANIZATION_QUESTIONNAIRE_STATS.documentQuestions).toBeGreaterThanOrEqual(2)
  })
})

describe('Organization Questionnaire — Downstream Value', () => {
  it('populates knowledge items', () => {
    const items = ORGANIZATION_QUESTIONNAIRE_STATS.downstreamValue.knowledgeItemsPopulated
    expect(items).toContain('legal_name')
    expect(items).toContain('organization_type')
    expect(items).toContain('therapeutic_focus')
    expect(items).toContain('service_portfolio')
    expect(items).toContain('leadership_team')
  })

  it('feeds 6 downstream engines', () => {
    const engines = ORGANIZATION_QUESTIONNAIRE_STATS.downstreamValue.enginesFed
    expect(engines).toContain('Sponsor Intelligence')
    expect(engines).toContain('Program Matching')
    expect(engines).toContain('Readiness')
    expect(engines).toContain('Compliance')
  })
})

describe('Organization Questionnaire — Conditional logic', () => {
  it('has no conditional questions — onboarding should be straightforward', () => {
    // Intentional: first questionnaire for new institutions should be linear,
    // not conditionally branching. Later questionnaires may add logic.
    const sections = ORGANIZATION_QUESTIONNAIRE.sections
    const conditional = sections.flatMap((s) => s.questions.filter((q) => q.condition))
    expect(conditional.length).toBe(0)
  })
})

describe('Organization Questionnaire — Progress', () => {
  it('starts at 0% completion with missing required', () => {
    const instance = {
      id: 'test', definitionId: ORGANIZATION_QUESTIONNAIRE.id,
      organizationId: 'org-1', status: 'draft' as const,
      answers: {}, startedAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString(),
      knowledgeItemsCreated: [], documentsUploaded: [], candidatesGenerated: [],
    }
    const progress = computeQuestionnaireProgress(instance, ORGANIZATION_QUESTIONNAIRE)
    expect(progress.overallCompletion).toBe(0)
    expect(progress.missingRequiredCount).toBeGreaterThan(0)
  })

  it('reports per-section progress', () => {
    const instance = {
      id: 'test', definitionId: ORGANIZATION_QUESTIONNAIRE.id,
      organizationId: 'org-1', status: 'draft' as const,
      answers: {}, startedAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString(),
      knowledgeItemsCreated: [], documentsUploaded: [], candidatesGenerated: [],
    }
    const progress = computeQuestionnaireProgress(instance, ORGANIZATION_QUESTIONNAIRE)
    expect(progress.sections).toHaveLength(7)
    for (const s of progress.sections) {
      expect(s.completionPercent).toBe(0)
    }
  })
})
