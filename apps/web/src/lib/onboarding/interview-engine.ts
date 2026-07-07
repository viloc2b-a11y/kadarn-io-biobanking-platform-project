// ==========================================================================
// MVP Sprint 2 — Adaptive Interview Engine
// ==========================================================================
// Questions only appear when relevant. Gating questions control subtrees.
// Target: 150-300 visible questions for an average institution.
// ==========================================================================

import type { OnboardingDomain } from './onboarding-journey'

// ==========================================================================
// QUESTION MODEL
// ==========================================================================

export type QuestionType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'date' | 'email' | 'url'

export interface InterviewQuestion {
  id: string
  domain: OnboardingDomain
  section: string
  number: number            // Display number (may differ from array index)
  question: string
  help: string
  type: QuestionType
  options?: { value: string; label: string; description?: string }[]
  required: boolean
  /** What claim this supports */
  generatesClaim: string | null
  /** What capability this feeds */
  feedsCapability: string | null
  /** What readiness dimension this affects */
  affectsReadiness: string | null
  /** Condition: only show this question if a previous answer matches */
  condition?: QuestionCondition
  /** If this is a gate question, answers control subtree visibility */
  isGate?: boolean
}

export interface QuestionCondition {
  questionId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'is_truthy' | 'is_falsy'
  value: string | boolean
}

export interface InterviewSection {
  id: string
  domain: OnboardingDomain
  title: string
  description: string
  questions: InterviewQuestion[]
  /** Only show this section if a gate condition is met */
  gateCondition?: QuestionCondition
}

export interface InterviewState {
  answers: Record<string, string | string[] | boolean | number | null>
  visibleQuestions: string[]       // question IDs currently visible
  hiddenQuestions: string[]        // question IDs hidden by conditions
  totalQuestions: number
  answeredQuestions: number
  currentDomain: OnboardingDomain
}

// ==========================================================================
// INTERVIEW ENGINE
// ==========================================================================

export function createInterviewState(domain: OnboardingDomain): InterviewState {
  return {
    answers: {},
    visibleQuestions: [],
    hiddenQuestions: [],
    totalQuestions: 0,
    answeredQuestions: 0,
    currentDomain: domain,
  }
}

/**
 * Determine which questions are visible based on current answers.
 * A question is visible if:
 * 1. It has no condition, OR
 * 2. Its condition is met by current answers
 * 3. Its parent section's gate is satisfied (if any)
 */
export function computeVisibleQuestions(
  sections: InterviewSection[],
  answers: Record<string, unknown>,
): { visible: InterviewQuestion[]; hidden: InterviewQuestion[] } {
  const visible: InterviewQuestion[] = []
  const hidden: InterviewQuestion[] = []

  for (const section of sections) {
    // Check if the section itself is gated
    if (section.gateCondition) {
      if (!evaluateCondition(section.gateCondition, answers)) {
        // Entire section is hidden
        hidden.push(...section.questions)
        continue
      }
    }

    for (const question of section.questions) {
      if (question.condition) {
        if (evaluateCondition(question.condition, answers)) {
          visible.push(question)
        } else {
          hidden.push(question)
        }
      } else {
        visible.push(question)
      }
    }
  }

  return { visible, hidden }
}

function evaluateCondition(condition: QuestionCondition, answers: Record<string, unknown>): boolean {
  const answer = answers[condition.questionId]
  if (answer === undefined || answer === null) return false

  switch (condition.operator) {
    case 'equals':
      return String(answer) === String(condition.value)
    case 'not_equals':
      return String(answer) !== String(condition.value)
    case 'contains':
      if (Array.isArray(answer)) return answer.includes(condition.value)
      return String(answer).includes(String(condition.value))
    case 'is_truthy':
      return !!answer && answer !== 'no' && answer !== 'false'
    case 'is_falsy':
      return !answer || answer === 'no' || answer === 'false'
    default:
      return false
  }
}

/**
 * Compute the question budget: how many questions are visible
 * vs hidden for this interview state.
 */
export function computeInterviewProgress(
  sections: InterviewSection[],
  state: InterviewState,
): { visible: number; hidden: number; answered: number; total: number; percentage: number } {
  const { visible, hidden } = computeVisibleQuestions(sections, state.answers)
  const answered = visible.filter((q) => {
    const a = state.answers[q.id]
    return a !== undefined && a !== null && a !== ''
  }).length

  const totalQuestions = visible.length + hidden.length

  return {
    visible: visible.length,
    hidden: hidden.length,
    answered,
    total: totalQuestions,
    percentage: visible.length > 0 ? Math.round((answered / visible.length) * 100) : 0,
  }
}

// ==========================================================================
// QUESTION VALIDATION — Rule 2: Every question must produce knowledge
// ==========================================================================

/**
 * Validate that a question passes the knowledge production rule.
 * If generatesClaim, feedsCapability, AND affectsReadiness are all null,
 * the question produces zero value and should be removed.
 */
export function validateQuestionValue(question: InterviewQuestion): { valid: boolean; reason: string } {
  if (!question.generatesClaim && !question.feedsCapability && !question.affectsReadiness) {
    return {
      valid: false,
      reason: `Question "${question.question}" produces no claim, capability, or readiness impact. Remove or justify.`,
    }
  }
  return { valid: true, reason: '' }
}

// ==========================================================================
// ADAPTIVE INTERVIEW BUILDER
// ==========================================================================

/**
 * Given a set of sections, filter out questions that have zero value
 * and return the validated, value-producing set.
 */
export function buildAdaptiveInterview(sections: InterviewSection[]): {
  sections: InterviewSection[]
  removedCount: number
  remainingCount: number
  violations: string[]
} {
  const violations: string[] = []
  let removedCount = 0
  let remainingCount = 0

  const validated = sections.map((section) => {
    const validQuestions = section.questions.filter((q) => {
      const validation = validateQuestionValue(q)
      if (!validation.valid) {
        violations.push(validation.reason)
        removedCount++
        return false
      }
      remainingCount++
      return true
    })
    return { ...section, questions: validQuestions }
  })

  return { sections: validated, removedCount, remainingCount, violations }
}
