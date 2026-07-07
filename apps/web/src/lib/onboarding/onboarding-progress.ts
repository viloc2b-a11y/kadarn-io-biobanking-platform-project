// ==========================================================================
// MVP Sprint 1 — Onboarding Progress Tracker
// ==========================================================================
// Shared progress state for the onboarding journey.
// ==========================================================================

import type { OnboardingDomain } from './onboarding-journey'
import { ONBOARDING_JOURNEY } from './onboarding-journey'

export interface DomainProgress {
  domain: OnboardingDomain
  completed: boolean
  startedAt: string | null
  completedAt: string | null
  questionsAnswered: number
  totalQuestions: number
  documentsUploaded: number
  totalDocuments: number
}

export interface OnboardingProgress {
  institutionId: string | null
  currentDomain: OnboardingDomain
  domains: Record<OnboardingDomain, DomainProgress>
  overallPercentage: number
  estimatedMinutesRemaining: number
  startedAt: string | null
}

export function createOnboardingProgress(): OnboardingProgress {
  const domains = {} as Record<OnboardingDomain, DomainProgress>
  for (const step of ONBOARDING_JOURNEY) {
    domains[step.domain] = {
      domain: step.domain,
      completed: false,
      startedAt: null,
      completedAt: null,
      questionsAnswered: 0,
      totalQuestions: step.questionCount,
      documentsUploaded: 0,
      totalDocuments: step.requiresDocuments ? 1 : 0,
    }
  }

  return {
    institutionId: null,
    currentDomain: 'welcome',
    domains,
    overallPercentage: 0,
    estimatedMinutesRemaining: ONBOARDING_JOURNEY.reduce((sum, s) => sum + s.estimatedMinutes, 0),
    startedAt: null,
  }
}

export function computeOverallProgress(progress: OnboardingProgress): number {
  const domains = Object.values(progress.domains)
  const totalQuestions = domains.reduce((sum, d) => sum + d.totalQuestions, 0)
  const answeredQuestions = domains.reduce((sum, d) => sum + d.questionsAnswered, 0)
  if (totalQuestions === 0) return 0
  return Math.round((answeredQuestions / totalQuestions) * 100)
}

export function getNextDomain(current: OnboardingDomain): OnboardingDomain | null {
  const idx = ONBOARDING_JOURNEY.findIndex((s) => s.domain === current)
  if (idx < 0 || idx >= ONBOARDING_JOURNEY.length - 1) return null
  return ONBOARDING_JOURNEY[idx + 1].domain
}

export function getPreviousDomain(current: OnboardingDomain): OnboardingDomain | null {
  const idx = ONBOARDING_JOURNEY.findIndex((s) => s.domain === current)
  if (idx <= 0) return null
  return ONBOARDING_JOURNEY[idx - 1].domain
}

export function getDomainLabel(domain: OnboardingDomain): string {
  return ONBOARDING_JOURNEY.find((s) => s.domain === domain)?.label ?? domain
}
