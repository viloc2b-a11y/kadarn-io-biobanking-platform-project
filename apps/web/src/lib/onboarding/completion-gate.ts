// ==========================================================================
// OCP-1 — Completion Gate & Passport Handoff
// ==========================================================================
// Pure, deterministic completion gate. Determines onboarding completion
// status from canonical state without side effects.
//
// Design contract:
// - Pure function: same input → same output
// - Stateless: no side effects, no state mutation
// - Deterministic: no randomness, no Date.now() in logic
// - Non-persistent: returns data, never writes to state
// ==========================================================================

import type { OnboardingDomain } from './onboarding-journey'
import { INTERVIEW_DOMAINS, DERIVED_DOMAINS } from './onboarding-journey'

// ==========================================================================
// Completion Status
// ==========================================================================

export type CompletionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'NEEDS_EVIDENCE'
  | 'NEEDS_REVIEW'
  | 'READY_FOR_PASSPORT'
  | 'PASSPORT_GENERATED'

export const COMPLETION_STATUS_LABELS: Record<CompletionStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  NEEDS_EVIDENCE: 'Needs evidence',
  NEEDS_REVIEW: 'Needs review',
  READY_FOR_PASSPORT: 'Ready for Passport',
  PASSPORT_GENERATED: 'Passport generated',
}

export type DomainCompletion = 'complete' | 'partial' | 'empty'

export interface DomainStatus {
  domain: OnboardingDomain
  label: string
  completion: DomainCompletion
  isDerived: boolean
  questionsAnswered: number
  totalQuestions: number
  documentsUploaded: number
  documentsRequired: number
}

export interface MissingItem {
  type: 'question' | 'document' | 'evidence' | 'review'
  domain: OnboardingDomain
  label: string
  description: string
  isCritical: boolean
}

export interface NextBestAction {
  action: string
  description: string
  domain: OnboardingDomain
  priority: 'high' | 'medium' | 'low'
  href: string
}

export interface CompletionGateResult {
  status: CompletionStatus
  overallPercentage: number
  criticalCompleted: number
  criticalTotal: number
  completedDomains: DomainStatus[]
  incompleteDomains: DomainStatus[]
  missingItems: MissingItem[]
  nextBestAction: NextBestAction | null
  canGenerateDraftPassport: boolean
  canGenerateFullPassport: boolean
  passportLevel: number
}

// ==========================================================================
// Input
// ==========================================================================

export interface CompletionGateInput {
  answers: Record<string, unknown>
  uploadedDocs: { uploaded: boolean; label: string; type: string; pending?: boolean; notApplicable?: boolean; evidenceClass?: string }[]
  completedDomains: OnboardingDomain[]
  institutionName: string
  passportGenerated?: boolean
}

// ==========================================================================
// Gate Logic
// ==========================================================================

function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

export function computeCompletionGate(input: CompletionGateInput): CompletionGateResult {
  const { answers, uploadedDocs, completedDomains, passportGenerated } = input

  // ── Domain status ──
  const allDomains = [...INTERVIEW_DOMAINS, ...DERIVED_DOMAINS]

  const domainStatuses: DomainStatus[] = allDomains.map((step) => {
    const isInterview = !step.isDerived
    const completed = completedDomains.includes(step.domain)

    // Count answered questions for interview domains
    let questionsAnswered = 0
    if (isInterview) {
      // For interview domains, check if the domain has any relevant answers
      const domainAnswers = Object.entries(answers).filter(([, v]) => isAnswered(v))
      questionsAnswered = completed ? step.questionCount : Math.min(domainAnswers.length, step.questionCount)
    } else {
      // Derived domains are "complete" if their parent interview domains are done
      questionsAnswered = completed ? step.questionCount : 0
    }

    const docsInDomain = uploadedDocs.filter((d) => d.uploaded).length
    const docsRequired = step.requiresDocuments ? 1 : 0

    let completion: DomainCompletion
    if (!completed && questionsAnswered === 0) {
      completion = 'empty'
    } else if (completed || (isInterview && questionsAnswered > step.questionCount * 0.5)) {
      completion = 'complete'
    } else {
      completion = 'partial'
    }

    return {
      domain: step.domain,
      label: step.label,
      completion,
      isDerived: step.isDerived,
      questionsAnswered,
      totalQuestions: step.questionCount,
      documentsUploaded: docsInDomain,
      documentsRequired: docsRequired,
    }
  })

  // ── Critical questions (canonical object checks) ──
      const activeDocs = uploadedDocs.filter((d) => d.uploaded && !d.notApplicable)
  const teamMembers: unknown[] = Array.isArray(answers['people_team_members'])
    ? (answers['people_team_members'] as unknown[])
    : []
  const infrastructure: unknown[] = Array.isArray(answers['infra_location_infrastructure'])
    ? (answers['infra_location_infrastructure'] as unknown[])
    : []
  const locations: unknown[] = Array.isArray(answers['org_locations'])
    ? (answers['org_locations'] as unknown[])
    : []

  // Map legacy critical questions to canonical object checks
  const criticalChecks = [
    isAnswered(answers['org_type']),                           // org_type
    isAnswered(answers['org_therapeutic_areas']),              // org_therapeutic_areas
    isAnswered(answers['org_research_focus']),                 // org_research_focus
    teamMembers.length > 0,                                     // people_pi_name → has team
    teamMembers.length > 0,                                     // people_pi_experience → has team
    teamMembers.length > 0,                                     // people_roles → has team
    teamMembers.length > 0,                                     // people_certs → has team
    infrastructure.length > 0,                                  // infra_has_lab → has infra
    infrastructure.length > 0,                                  // infra_has_biospecimen → has infra
    infrastructure.length > 0,                                  // infra_backup_power → has infra
    activeDocs.length >= 1,                                     // docs_uploaded_count → has docs
  ]

  const criticalCompleted = criticalChecks.filter(Boolean).length
  const criticalTotal = criticalChecks.length

  // ── Overall percentage ──
  const interviewDomains = domainStatuses.filter((d) => !d.isDerived)
  const completedInterviewCount = interviewDomains.filter((d) => d.completion === 'complete').length
  const totalInterviewDomains = interviewDomains.length || 1
  const overallPercentage = Math.round((completedInterviewCount / totalInterviewDomains) * 100)

  // ── Missing items ──
  const missingItems: MissingItem[] = []

  // Missing critical canonical objects
  if (!isAnswered(answers['org_type'])) {
    missingItems.push({ type: 'question', domain: 'organization', label: 'What type of institution are you?', description: 'Institutional identity on Passport', isCritical: true })
  }
  if (!isAnswered(answers['org_therapeutic_areas'])) {
    missingItems.push({ type: 'question', domain: 'organization', label: 'Which therapeutic areas do you work in?', description: 'Sponsor-relevant therapeutic focus', isCritical: true })
  }
  if (!isAnswered(answers['org_research_focus'])) {
    missingItems.push({ type: 'question', domain: 'organization', label: 'Which research programs does your institution perform?', description: 'Capability derivation', isCritical: true })
  }
  if (teamMembers.length === 0) {
    missingItems.push({ type: 'question', domain: 'people', label: 'Add at least one team member (Principal Investigator)', description: 'PI identity on Passport — required by all sponsors', isCritical: true })
  }
  if (infrastructure.length === 0) {
    missingItems.push({ type: 'question', domain: 'infrastructure', label: 'Add at least one location with infrastructure', description: 'Laboratory and biospecimen readiness on Passport', isCritical: true })
  }

  // Missing documents
  if (activeDocs.length < 3) {
    missingItems.push({
      type: 'document',
      domain: 'documents',
      label: `${3 - activeDocs.length} more document${3 - activeDocs.length !== 1 ? 's' : ''} needed`,
      description: 'Upload at least 3 key documents to enable evidence-backed capabilities.',
      isCritical: true,
    })
  }

  // ── Passport generation checks ──
  const canGenerateDraftPassport = criticalCompleted >= 5
  const canGenerateFullPassport = criticalCompleted >= 7 && activeDocs.length >= 3 && completedInterviewCount >= 3

  // ── Passport level ──
  let passportLevel = 0
  if (criticalCompleted >= 10 && overallPercentage >= 80) passportLevel = 3
  else if (criticalCompleted >= 8 && overallPercentage >= 60) passportLevel = 2
  else if (criticalCompleted >= 5) passportLevel = 1

  // ── Status determination ──
  let status: CompletionStatus

  if (passportGenerated) {
    status = 'PASSPORT_GENERATED'
  } else if (overallPercentage === 0) {
    status = 'NOT_STARTED'
  } else if (canGenerateFullPassport && completedInterviewCount >= 4) {
    status = 'READY_FOR_PASSPORT'
  } else if (canGenerateDraftPassport && missingItems.filter((m) => m.type === 'document').length > 0) {
    status = 'NEEDS_EVIDENCE'
  } else if (canGenerateDraftPassport && missingItems.length > 0) {
    status = 'NEEDS_REVIEW'
  } else if (overallPercentage > 0) {
    status = 'IN_PROGRESS'
  } else {
    status = 'NOT_STARTED'
  }

  // ── Next best action ──
  let nextBestAction: NextBestAction | null = null

  if (status === 'NOT_STARTED') {
    nextBestAction = {
      action: 'Start your institution profile',
      description: 'Begin with Organization to tell Kadarn who you are.',
      domain: 'organization',
      priority: 'high',
      href: '/onboarding/organization',
    }
  } else if (status === 'IN_PROGRESS') {
    const firstIncomplete = domainStatuses.find((d) => d.completion !== 'complete' && !d.isDerived)
    if (firstIncomplete) {
      nextBestAction = {
        action: `Continue ${firstIncomplete.label}`,
        description: `${firstIncomplete.totalQuestions - firstIncomplete.questionsAnswered} questions remaining in ${firstIncomplete.label}.`,
        domain: firstIncomplete.domain,
        priority: 'high',
        href: `/onboarding/${firstIncomplete.domain}`,
      }
    }
  } else if (status === 'NEEDS_EVIDENCE') {
    nextBestAction = {
      action: 'Upload required documents',
      description: 'Upload at least 3 key documents to enable evidence-backed capabilities.',
      domain: 'documents',
      priority: 'high',
      href: '/onboarding/documents',
    }
  } else if (status === 'NEEDS_REVIEW') {
    nextBestAction = {
      action: 'Complete missing critical information',
      description: `${missingItems.length} item${missingItems.length !== 1 ? 's' : ''} still needed before Passport generation.`,
      domain: missingItems[0]?.domain ?? 'organization',
      priority: 'high',
      href: `/onboarding/${missingItems[0]?.domain ?? 'organization'}`,
    }
  } else if (status === 'READY_FOR_PASSPORT') {
    nextBestAction = {
      action: 'Review your Institution Passport',
      description: 'Your onboarding is complete. Review and generate your Institution Passport.',
      domain: 'passport',
      priority: 'high',
      href: '/onboarding/passport',
    }
  }

  // ── Split domains ──
  const completedDomainsList = domainStatuses.filter((d) => d.completion === 'complete')
  const incompleteDomainsList = domainStatuses.filter((d) => d.completion !== 'complete')

  return {
    status,
    overallPercentage,
    criticalCompleted,
    criticalTotal,
    completedDomains: completedDomainsList,
    incompleteDomains: incompleteDomainsList,
    missingItems,
    nextBestAction,
    canGenerateDraftPassport,
    canGenerateFullPassport,
    passportLevel,
  }
}
