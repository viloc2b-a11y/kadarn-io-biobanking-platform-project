// ==========================================================================
// MVP Sprint 4 — Guided Onboarding: Fast-Track to First Passport
// ==========================================================================
// Passport Level 1 = mínima información crítica para generar valor.
// Meta: ≤30 minutos hasta el primer Passport útil.
// ==========================================================================

import type { OnboardingDomain } from './onboarding-journey'

// ==========================================================================
// PASSPORT LEVEL 1 — Critical Questions Only
// ==========================================================================

export interface CriticalQuestion {
  domain: OnboardingDomain
  questionId: string
  question: string
  /** Why this question is critical for Passport Level 1 */
  unlocks: string
}

/**
 * The minimum set of questions needed for a Level 1 Passport.
 * Everything else can be completed later.
 */
export const PASSPORT_LEVEL1_CRITICAL: CriticalQuestion[] = [
  // Organization
  { domain: 'organization', questionId: 'org_type', question: 'What type of institution are you?', unlocks: 'Institutional identity on Passport' },
  { domain: 'organization', questionId: 'org_therapeutic_areas', question: 'Which therapeutic areas do you work in?', unlocks: 'Sponsor-relevant therapeutic focus' },
  { domain: 'organization', questionId: 'org_research_focus', question: 'Which research programs and operational capabilities does your institution actively perform?', unlocks: 'Capability derivation' },

  // People
  { domain: 'people', questionId: 'people_pi_name', question: 'Who is your Principal Investigator?', unlocks: 'PI identity on Passport — required by all sponsors' },
  { domain: 'people', questionId: 'people_pi_experience', question: 'How many years of research experience?', unlocks: 'PI experience on Passport' },
  { domain: 'people', questionId: 'people_roles', question: 'What research roles do you have?', unlocks: 'Team structure on Passport' },
  { domain: 'people', questionId: 'people_certs', question: 'Which certifications does your team hold?', unlocks: 'Certification compliance on Passport' },

  // Infrastructure
  { domain: 'infrastructure', questionId: 'infra_has_lab', question: 'Do you operate a laboratory?', unlocks: 'Laboratory readiness on Passport' },
  { domain: 'infrastructure', questionId: 'infra_has_biospecimen', question: 'Do you handle biospecimens?', unlocks: 'Biospecimen readiness on Passport' },
  { domain: 'infrastructure', questionId: 'infra_backup_power', question: 'Do you have backup power?', unlocks: 'Operational readiness on Passport' },

  // Documents
  { domain: 'documents', questionId: 'docs_uploaded_count', question: 'Upload at least 3 key documents', unlocks: 'Evidence section on Passport' },
]

export const PASSPORT_LEVEL1_QUESTION_COUNT = PASSPORT_LEVEL1_CRITICAL.length
export const PASSPORT_LEVEL1_ESTIMATED_MINUTES = 20

// ==========================================================================
// PASSPORT LEVELS
// ==========================================================================

export type PassportLevel = 0 | 1 | 2 | 3

export interface PassportLevelInfo {
  level: PassportLevel
  label: string
  description: string
  requiredCriticalQuestions: number
  requiredTotalQuestions: number
  estimatedMinutes: number
  whatYouGet: string
}

export const PASSPORT_LEVELS: Record<PassportLevel, PassportLevelInfo> = {
  0: {
    level: 0, label: 'No Passport',
    description: 'Start your institution profile to generate your first Passport.',
    requiredCriticalQuestions: 0, requiredTotalQuestions: 0,
    estimatedMinutes: 0,
    whatYouGet: 'Nothing yet — start the interview.',
  },
  1: {
    level: 1, label: 'Passport Level 1 — Identity',
    description: 'Essential institutional profile with basic capabilities and readiness.',
    requiredCriticalQuestions: 10, requiredTotalQuestions: 15,
    estimatedMinutes: 20,
    whatYouGet: 'Institutional identity, PI profile, basic capabilities, and readiness estimate.',
  },
  2: {
    level: 2, label: 'Passport Level 2 — Evidence',
    description: 'Evidence-backed profile with documented capabilities and readiness.',
    requiredCriticalQuestions: 10, requiredTotalQuestions: 25,
    estimatedMinutes: 35,
    whatYouGet: 'Full capabilities derived from evidence, documented readiness, and next steps.',
  },
  3: {
    level: 3, label: 'Passport Level 3 — Complete',
    description: 'Complete institutional profile with full evidence, capabilities, and readiness.',
    requiredCriticalQuestions: 10, requiredTotalQuestions: 35,
    estimatedMinutes: 60,
    whatYouGet: 'Complete Institution Passport — ready to share with sponsors.',
  },
}

// ==========================================================================
// FAST-TRACK PROGRESS
// ==========================================================================

export interface FastTrackProgress {
  currentLevel: PassportLevel
  nextLevel: PassportLevel | null
  criticalCompleted: number
  criticalTotal: number
  totalCompleted: number
  totalQuestions: number
  estimatedMinutesToNextLevel: number
  canGeneratePassport: boolean
}

export function computeFastTrackProgress(answers: Record<string, unknown>): FastTrackProgress {
  const criticalCompleted = PASSPORT_LEVEL1_CRITICAL.filter((q) => {
    const a = answers[q.questionId]
    return a !== undefined && a !== null && a !== '' && (!Array.isArray(a) || a.length > 0)
  }).length

  const totalCompleted = Object.values(answers).filter(
    (v) => v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0)
  ).length

  const canGeneratePassport = criticalCompleted >= 7 // At least 7 of 10 critical questions

  let currentLevel: PassportLevel = 0
  if (criticalCompleted >= 10 && totalCompleted >= 30) currentLevel = 3
  else if (criticalCompleted >= 10 && totalCompleted >= 20) currentLevel = 2
  else if (canGeneratePassport) currentLevel = 1

  const nextLevel: PassportLevel | null = currentLevel < 3 ? (currentLevel + 1) as PassportLevel : null
  const nextLevelInfo = nextLevel ? PASSPORT_LEVELS[nextLevel] : null
  const remainingForNext = nextLevelInfo ? nextLevelInfo.requiredTotalQuestions - totalCompleted : 0

  return {
    currentLevel,
    nextLevel,
    criticalCompleted,
    criticalTotal: PASSPORT_LEVEL1_CRITICAL.length,
    totalCompleted,
    totalQuestions: 35,
    estimatedMinutesToNextLevel: Math.max(0, remainingForNext * 2),
    canGeneratePassport,
  }
}

// ==========================================================================
// QUICK-START WIZARD (First 3 minutes)
// ==========================================================================

export interface QuickStartStep {
  step: number
  question: string
  why: string
  estimatedSeconds: number
  questionId: string
}

/**
 * The first 3 questions every institution answers.
 * After these 3, Kadarn already knows enough to start deriving value.
 */
export const QUICK_START: QuickStartStep[] = [
  {
    step: 1, questionId: 'org_type',
    question: 'What type of institution are you?',
    why: 'This tells Kadarn what programs and sponsors are relevant to you.',
    estimatedSeconds: 30,
  },
  {
    step: 2, questionId: 'org_therapeutic_areas',
    question: 'What therapeutic areas do you work in?',
    why: 'This is the #1 filter sponsors use to find institutions.',
    estimatedSeconds: 60,
  },
  {
    step: 3, questionId: 'people_pi_name',
    question: 'Who leads your research program?',
    why: 'Sponsors need to know who is responsible for research conduct.',
    estimatedSeconds: 30,
  },
]

// ==========================================================================
// SKIP PATTERNS
// ==========================================================================

export type SkipReason = 'not_applicable' | 'will_complete_later' | 'dont_know' | 'prefer_not_to_answer'

export interface SkipAction {
  questionId: string
  reason: SkipReason
  skippedAt: string
}

/**
 * Questions that can be skipped without blocking Passport Level 1.
 */
export function canSkipForLevel1(questionId: string): boolean {
  const critical = PASSPORT_LEVEL1_CRITICAL.map((q) => q.questionId)
  return !critical.includes(questionId)
}
