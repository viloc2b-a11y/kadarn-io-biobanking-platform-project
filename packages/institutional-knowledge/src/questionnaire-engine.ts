// ==========================================================================
// IKM Domain Sprint 3D — Questionnaires & Knowledge Acquisition Engine
// ==========================================================================
// Metadata-driven questionnaire engine. No hardcoded forms.
// Every question declares its destination: knowledge domain, item, entity, doc.
// ==========================================================================

import type { KnowledgeItemType, KnowledgeDomainId, DocumentReference } from '../types'

// ==========================================================================
// QUESTION MODEL
// ==========================================================================

export type QuestionType =
  | 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'boolean'
  | 'single_choice' | 'multiple_choice' | 'dropdown' | 'checklist'
  | 'document_upload' | 'entity_selector' | 'knowledge_item_selector'
  | 'table' | 'repeating_section'

export interface QuestionOption {
  value: string; label: string; description?: string
}

export interface QuestionValidation {
  required?: boolean
  minLength?: number; maxLength?: number
  min?: number; max?: number
  pattern?: string
  minSelections?: number; maxSelections?: number
  allowedFileTypes?: string[]
  maxFileSizeMB?: number
  customMessage?: string
}

export interface QuestionCondition {
  /** Question key that triggers this condition */
  dependsOnQuestion: string
  /** Operator: equals, not_equals, contains, greater_than, less_than, is_answered, is_empty */
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_answered' | 'is_empty'
  /** Value to compare against */
  value?: string | number | boolean
}

// ==========================================================================
// QUESTION DESTINATION — Where the answer goes
// ==========================================================================

export interface QuestionDestination {
  /** Knowledge domain this answer populates */
  domain: KnowledgeDomainId | null
  /** Knowledge item key this answer maps to */
  knowledgeItemKey: string | null
  /** Entity type being created/updated */
  entityType: KnowledgeItemType | null
  /** Relationship to create from this answer */
  relationshipType: string | null
  /** Whether this answer generates a document reference */
  generatesDocument: boolean
  /** Document type if generatesDocument is true */
  documentType?: string
  /** Whether this answer generates an evidence candidate */
  generatesEvidenceCandidate: boolean
  /** Custom metadata property path (dot notation) */
  customProperty?: string
}

// ==========================================================================
// QUESTION DEFINITION
// ==========================================================================

export interface QuestionDefinition {
  /** Unique key within the questionnaire */
  key: string
  /** Display label */
  label: string
  /** Help text or description */
  description?: string
  /** Question type */
  type: QuestionType
  /** Options for choice/dropdown questions */
  options?: QuestionOption[]
  /** Validation rules */
  validation?: QuestionValidation
  /** Conditional visibility */
  condition?: QuestionCondition
  /** Where the answer goes */
  destination: QuestionDestination
  /** Default value */
  defaultValue?: unknown
  /** Display order within section */
  order: number
  /** Whether this question is repeatable (creates multiple knowledge items) */
  repeatable: boolean
  /** For repeating_section: child questions */
  children?: QuestionDefinition[]
  /** Placeholder text */
  placeholder?: string
  /** Source hint for the answer */
  answerSource?: 'user' | 'imported' | 'api' | 'existing_knowledge' | 'document_extraction' | 'ai_extraction'
}

// ==========================================================================
// QUESTIONNAIRE SECTION
// ==========================================================================

export interface QuestionnaireSection {
  key: string
  title: string
  description?: string
  questions: QuestionDefinition[]
  order: number
  /** Whether this section can be completed independently */
  standalone: boolean
}

// ==========================================================================
// QUESTIONNAIRE DEFINITION
// ==========================================================================

export interface QuestionnaireDefinition {
  id: string
  title: string
  description: string
  /** Which knowledge domain this questionnaire populates */
  domain: KnowledgeDomainId
  /** Questionnaire type */
  type: QuestionnaireType
  sections: QuestionnaireSection[]
  /** Version for tracking changes */
  version: number
  /** Whether this questionnaire is active */
  active: boolean
  createdAt: string
  updatedAt: string
}

export type QuestionnaireType =
  | 'organization_onboarding' | 'people' | 'facilities' | 'equipment'
  | 'laboratory' | 'biospecimen_operations' | 'programs'
  | 'research_experience' | 'regulatory' | 'quality' | 'custom'

// ==========================================================================
// QUESTIONNAIRE INSTANCE (Runtime)
// ==========================================================================

export type QuestionnaireStatus = 'draft' | 'in_progress' | 'needs_review' | 'completed'

export interface QuestionAnswer {
  questionKey: string
  value: unknown
  answeredAt: string
  answeredBy?: string
  source?: string
}

export interface QuestionnaireInstance {
  id: string
  definitionId: string
  organizationId: string
  status: QuestionnaireStatus
  answers: Record<string, QuestionAnswer>
  startedAt: string
  completedAt?: string
  lastUpdatedAt: string
  /** IDs of knowledge items created from this questionnaire */
  knowledgeItemsCreated: string[]
  /** IDs of documents uploaded through this questionnaire */
  documentsUploaded: string[]
  /** IDs of evidence candidates generated */
  candidatesGenerated: string[]
}

// ==========================================================================
// QUESTIONNAIRE PROGRESS
// ==========================================================================

export interface SectionProgress {
  sectionKey: string
  title: string
  totalQuestions: number
  answeredQuestions: number
  requiredQuestions: number
  requiredAnswered: number
  completionPercent: number
  missingRequired: string[]
}

export interface QuestionnaireProgress {
  instanceId: string
  status: QuestionnaireStatus
  overallCompletion: number
  totalSections: number
  completedSections: number
  totalQuestions: number
  answeredQuestions: number
  missingRequiredCount: number
  documentsUploaded: number
  documentsExpected: number
  sections: SectionProgress[]
}

// ==========================================================================
// PROGRESS ENGINE
// ==========================================================================

export function computeQuestionnaireProgress(instance: QuestionnaireInstance, definition: QuestionnaireDefinition): QuestionnaireProgress {
  const sections: SectionProgress[] = []

  for (const section of definition.sections) {
    let answered = 0; let requiredTotal = 0; let requiredAnswered = 0
    const missingRequired: string[] = []

    for (const q of section.questions) {
      const isRequired = q.validation?.required ?? false
      const hasAnswer = instance.answers[q.key] !== undefined && instance.answers[q.key]?.value !== '' && instance.answers[q.key]?.value !== null && instance.answers[q.key]?.value !== undefined

      if (hasAnswer) answered++
      if (isRequired) {
        requiredTotal++
        if (hasAnswer) requiredAnswered++
        else missingRequired.push(q.key)
      }
    }

    const total = section.questions.length || 1
    sections.push({
      sectionKey: section.key,
      title: section.title,
      totalQuestions: total,
      answeredQuestions: answered,
      requiredQuestions: requiredTotal,
      requiredAnswered,
      completionPercent: Math.round((answered / total) * 100),
      missingRequired,
    })
  }

  const totalQ = definition.sections.reduce((sum, s) => sum + s.questions.length, 0)
  const answeredQ = sections.reduce((sum, s) => sum + s.answeredQuestions, 0)
  const completedSections = sections.filter((s) => s.missingRequired.length === 0).length
  const missingReq = sections.reduce((sum, s) => sum + s.missingRequired.length, 0)

  const docQuestions = definition.sections.flatMap((s) => s.questions.filter((q) => q.type === 'document_upload'))
  const docsExpected = docQuestions.length

  return {
    instanceId: instance.id,
    status: instance.status,
    overallCompletion: totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0,
    totalSections: definition.sections.length,
    completedSections,
    totalQuestions: totalQ,
    answeredQuestions: answeredQ,
    missingRequiredCount: missingReq,
    documentsUploaded: instance.documentsUploaded.length,
    documentsExpected: docsExpected,
    sections,
  }
}

// ==========================================================================
// QUESTION VALIDATION
// ==========================================================================

export interface ValidationResult {
  valid: boolean
  errors: { questionKey: string; message: string }[]
}

export function validateAnswer(question: QuestionDefinition, value: unknown): ValidationResult {
  const errors: { questionKey: string; message: string }[] = []
  const rules = question.validation
  if (!rules) return { valid: true, errors: [] }

  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push({ questionKey: question.key, message: rules.customMessage || `${question.label} is required` })
    return { valid: false, errors }
  }

  if (value === undefined || value === null || value === '') return { valid: true, errors: [] }

  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) errors.push({ questionKey: question.key, message: `Minimum ${rules.minLength} characters required` })
    if (rules.maxLength && value.length > rules.maxLength) errors.push({ questionKey: question.key, message: `Maximum ${rules.maxLength} characters allowed` })
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) errors.push({ questionKey: question.key, message: rules.customMessage || 'Invalid format' })
  }

  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) errors.push({ questionKey: question.key, message: `Minimum value is ${rules.min}` })
    if (rules.max !== undefined && value > rules.max) errors.push({ questionKey: question.key, message: `Maximum value is ${rules.max}` })
  }

  if (Array.isArray(value)) {
    if (rules.minSelections && value.length < rules.minSelections) errors.push({ questionKey: question.key, message: `Select at least ${rules.minSelections}` })
    if (rules.maxSelections && value.length > rules.maxSelections) errors.push({ questionKey: question.key, message: `Select at most ${rules.maxSelections}` })
  }

  return { valid: errors.length === 0, errors }
}

// ==========================================================================
// CONDITIONAL LOGIC
// ==========================================================================

export function isQuestionVisible(question: QuestionDefinition, answers: Record<string, QuestionAnswer>): boolean {
  if (!question.condition) return true

  const { dependsOnQuestion, operator, value } = question.condition
  const answer = answers[dependsOnQuestion]
  const answerValue = answer?.value

  switch (operator) {
    case 'is_answered': return answerValue !== undefined && answerValue !== null && answerValue !== ''
    case 'is_empty': return answerValue === undefined || answerValue === null || answerValue === ''
    case 'equals': return answerValue === value
    case 'not_equals': return answerValue !== value
    case 'contains': return typeof answerValue === 'string' && typeof value === 'string' && answerValue.includes(value)
    case 'greater_than': return typeof answerValue === 'number' && typeof value === 'number' && answerValue > value
    case 'less_than': return typeof answerValue === 'number' && typeof value === 'number' && answerValue < value
    default: return true
  }
}

export function getVisibleQuestions(section: QuestionnaireSection, answers: Record<string, QuestionAnswer>): QuestionDefinition[] {
  return section.questions.filter((q) => isQuestionVisible(q, answers))
}

// ==========================================================================
// DOCUMENT QUESTION RUNTIME
// ==========================================================================

export interface DocumentQuestionConfig {
  questionKey: string
  documentType: string
  relatedEntityType: string
  expires: boolean
  expirationMonths?: number
  required: boolean
}

export function isDocumentQuestion(question: QuestionDefinition): boolean {
  return question.type === 'document_upload'
}

export function getDocumentQuestions(definition: QuestionnaireDefinition): DocumentQuestionConfig[] {
  const configs: DocumentQuestionConfig[] = []
  for (const section of definition.sections) {
    for (const q of section.questions) {
      if (q.type === 'document_upload') {
        configs.push({
          questionKey: q.key,
          documentType: q.destination.documentType || 'document',
          relatedEntityType: q.destination.entityType || 'other',
          expires: q.validation?.required ? true : false,
          expirationMonths: 12,
          required: q.validation?.required ?? false,
        })
      }
    }
  }
  return configs
}

// ==========================================================================
// QUESTIONNAIRE FACTORY — Create from domain catalog
// ==========================================================================

export function createQuestionnaireFromDomain(params: {
  id: string; title: string; description: string
  domain: KnowledgeDomainId; type: QuestionnaireType
  sections: Omit<QuestionnaireSection, 'questions'>[]
}): QuestionnaireDefinition {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    domain: params.domain,
    type: params.type,
    sections: params.sections.map((s, i) => ({ ...s, questions: [], order: i, standalone: true })),
    version: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ==========================================================================
// QUESTION BUILDER — Add questions to sections
// ==========================================================================

export function addQuestionsToSection(
  definition: QuestionnaireDefinition,
  sectionKey: string,
  questions: QuestionDefinition[]
): QuestionnaireDefinition {
  const section = definition.sections.find((s) => s.key === sectionKey)
  if (!section) return definition
  section.questions.push(...questions)
  return definition
}

// ==========================================================================
// ANSWER PROCESSING
// ==========================================================================

export function recordAnswer(instance: QuestionnaireInstance, questionKey: string, value: unknown): QuestionnaireInstance {
  instance.answers[questionKey] = {
    questionKey,
    value,
    answeredAt: new Date().toISOString(),
  }
  instance.lastUpdatedAt = new Date().toISOString()
  if (instance.status === 'draft') instance.status = 'in_progress'
  return instance
}

export function submitQuestionnaire(instance: QuestionnaireInstance): QuestionnaireInstance {
  instance.status = 'needs_review'
  instance.completedAt = new Date().toISOString()
  return instance
}

export function approveQuestionnaire(instance: QuestionnaireInstance): QuestionnaireInstance {
  instance.status = 'completed'
  return instance
}
