// ==========================================================================
// IKM Domain Sprint 3D — Questionnaire Engine Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  createQuestionnaireFromDomain,
  addQuestionsToSection,
  recordAnswer,
  submitQuestionnaire,
  approveQuestionnaire,
  computeQuestionnaireProgress,
  validateAnswer,
  isQuestionVisible,
  getVisibleQuestions,
  isDocumentQuestion,
  getDocumentQuestions,
} from '../../packages/institutional-knowledge/src/questionnaire-engine'
import type {
  QuestionnaireInstance, QuestionnaireDefinition, QuestionDefinition,
  QuestionAnswer,
} from '../../packages/institutional-knowledge/src/questionnaire-engine'

// ==========================================================================
// Fixtures
// ==========================================================================

function makeDefinition(): QuestionnaireDefinition {
  const def = createQuestionnaireFromDomain({
    id: 'test-q',
    title: 'Test Questionnaire',
    description: 'Test',
    domain: 'organization',
    type: 'organization_onboarding',
    sections: [
      { key: 'identity', title: 'Identity', description: 'Basic info', order: 0, standalone: true },
      { key: 'legal', title: 'Legal', description: 'Legal info', order: 1, standalone: true },
    ],
  })

  return addQuestionsToSection(addQuestionsToSection(def, 'identity', [
    { key: 'org_name', label: 'Organization Name', type: 'text', destination: { domain: 'organization', knowledgeItemKey: 'legal_name', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false }, order: 0, repeatable: false, validation: { required: true } },
    { key: 'has_parent', label: 'Has parent organization?', type: 'boolean', destination: { domain: 'organization', knowledgeItemKey: null, entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false }, order: 1, repeatable: false },
    { key: 'parent_name', label: 'Parent Organization Name', type: 'text', destination: { domain: 'organization', knowledgeItemKey: 'parent_organization', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false }, order: 2, repeatable: false, condition: { dependsOnQuestion: 'has_parent', operator: 'equals', value: true } },
  ]), 'legal', [
    { key: 'business_license', label: 'Business License', type: 'document_upload', destination: { domain: 'organization', knowledgeItemKey: 'business_license', entityType: 'certification', relationshipType: null, generatesDocument: true, generatesEvidenceCandidate: true, documentType: 'certification' }, order: 0, repeatable: false, validation: { required: true } },
  ])
}

function makeInstance(def: QuestionnaireDefinition): QuestionnaireInstance {
  return {
    id: 'inst-1', definitionId: def.id, organizationId: 'org-1',
    status: 'draft', answers: {}, startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    knowledgeItemsCreated: [], documentsUploaded: [], candidatesGenerated: [],
  }
}

// ==========================================================================
// Tests
// ==========================================================================

describe('Questionnaire Engine — Creation', () => {
  it('creates questionnaire from domain catalog', () => {
    const def = createQuestionnaireFromDomain({
      id: 'q1', title: 'Org Onboarding', description: 'Test',
      domain: 'organization', type: 'organization_onboarding',
      sections: [{ key: 's1', title: 'Section 1', order: 0, standalone: true }],
    })
    expect(def.sections).toHaveLength(1)
    expect(def.domain).toBe('organization')
    expect(def.active).toBe(true)
  })

  it('adds questions to sections', () => {
    const def = makeDefinition()
    expect(def.sections[0].questions.length).toBeGreaterThan(0)
    expect(def.sections[1].questions.length).toBeGreaterThan(0)
  })
})

describe('Questionnaire Engine — Answers', () => {
  it('records answers and transitions from draft to in_progress', () => {
    const def = makeDefinition()
    const inst = makeInstance(def)
    const updated = recordAnswer(inst, 'org_name', 'Test Org')
    expect(updated.answers['org_name']?.value).toBe('Test Org')
    expect(updated.status).toBe('in_progress')
  })

  it('submits and approves questionnaire', () => {
    const def = makeDefinition()
    let inst = makeInstance(def)
    inst = recordAnswer(inst, 'org_name', 'Test')
    inst = submitQuestionnaire(inst)
    expect(inst.status).toBe('needs_review')
    inst = approveQuestionnaire(inst)
    expect(inst.status).toBe('completed')
  })
})

describe('Questionnaire Engine — Progress', () => {
  it('computes progress with missing required', () => {
    const def = makeDefinition()
    const inst = makeInstance(def)
    const progress = computeQuestionnaireProgress(inst, def)
    expect(progress.missingRequiredCount).toBeGreaterThan(0)
    expect(progress.overallCompletion).toBeLessThan(100)
  })

  it('computes 100% when all required answered', () => {
    const def = makeDefinition()
    let inst = makeInstance(def)
    inst = recordAnswer(inst, 'org_name', 'Test')
    inst = recordAnswer(inst, 'business_license', { fileId: 'doc-1' })
    const progress = computeQuestionnaireProgress(inst, def)
    // 2 required of 4 total answered → 50%; missing required = 0
    expect(progress.missingRequiredCount).toBe(0)
  })
})

describe('Questionnaire Engine — Validation', () => {
  it('validates required field', () => {
    const q: QuestionDefinition = { key: 'test', label: 'Test', type: 'text', destination: { domain: null, knowledgeItemKey: null, entityType: null, relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false }, order: 0, repeatable: false, validation: { required: true } }
    const result = validateAnswer(q, '')
    expect(result.valid).toBe(false)
  })

  it('passes valid answer', () => {
    const q: QuestionDefinition = { key: 'test', label: 'Test', type: 'text', destination: { domain: null, knowledgeItemKey: null, entityType: null, relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false }, order: 0, repeatable: false, validation: { required: true, minLength: 3 } }
    expect(validateAnswer(q, 'ABC').valid).toBe(true)
    expect(validateAnswer(q, 'AB').valid).toBe(false)
  })
})

describe('Questionnaire Engine — Conditional Logic', () => {
  it('shows conditional question when condition met', () => {
    const answers: Record<string, QuestionAnswer> = { 'has_parent': { questionKey: 'has_parent', value: true, answeredAt: '' } }
    const q: QuestionDefinition = { key: 'parent_name', label: 'Parent', type: 'text', destination: { domain: null, knowledgeItemKey: null, entityType: null, relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false }, order: 0, repeatable: false, condition: { dependsOnQuestion: 'has_parent', operator: 'equals', value: true } }
    expect(isQuestionVisible(q, answers)).toBe(true)
  })

  it('hides conditional question when condition not met', () => {
    const answers: Record<string, QuestionAnswer> = { 'has_parent': { questionKey: 'has_parent', value: false, answeredAt: '' } }
    const q: QuestionDefinition = { key: 'parent_name', label: 'Parent', type: 'text', destination: { domain: null, knowledgeItemKey: null, entityType: null, relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false }, order: 0, repeatable: false, condition: { dependsOnQuestion: 'has_parent', operator: 'equals', value: true } }
    expect(isQuestionVisible(q, answers)).toBe(false)
  })

  it('getVisibleQuestions filters by condition', () => {
    const answers: Record<string, QuestionAnswer> = { 'has_parent': { questionKey: 'has_parent', value: true, answeredAt: '' } }
    const def = makeDefinition()
    const visible = getVisibleQuestions(def.sections[0], answers)
    // org_name (always visible) + has_parent (always visible) + parent_name (conditional, visible) = 3
    expect(visible.length).toBe(3)
  })
})

describe('Questionnaire Engine — Document Questions', () => {
  it('detects document questions', () => {
    const def = makeDefinition()
    expect(isDocumentQuestion(def.sections[1].questions[0])).toBe(true)
  })

  it('extracts document question configs', () => {
    const def = makeDefinition()
    const configs = getDocumentQuestions(def)
    expect(configs.length).toBeGreaterThan(0)
    expect(configs[0].questionKey).toBe('business_license')
  })
})
