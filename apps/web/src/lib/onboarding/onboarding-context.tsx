'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { InstitutionalLocation } from '@/lib/onboarding/institutional-locations'
import type { InstitutionalMemoryEvent } from '@/lib/onboarding/institutional-memory'
import type { LocationInfrastructure } from '@/lib/onboarding/location-infrastructure'
import type { ResearchTeamMember } from '@/lib/onboarding/research-team'
import type { OnboardingDomain } from '@/lib/onboarding/onboarding-journey'
import { computeFastTrackProgress, type FastTrackProgress } from '@/lib/onboarding/fast-track'
import {
  isLegacyFlatProjectionKey,
  removeLegacyFlatProjectionAnswers,
} from '@/lib/onboarding/canonical-ownership'
import { getPrimaryLocation } from '@/lib/onboarding/institutional-locations'
import { LEGACY_GEOGRAPHIC_REACH_BY_COVERAGE } from '@/lib/onboarding/operational-footprint-taxonomy'
import { derivePassportReadModel } from '@/lib/onboarding/derived-read-models'
import type { PassportData } from '@/lib/onboarding/derived-read-models'

// ==========================================================================
// FIX CR-1: Shared state across all onboarding pages
// ==========================================================================

export type OnboardingAnswerValue = string | number | boolean | string[] | InstitutionalLocation[] | InstitutionalMemoryEvent[] | LocationInfrastructure[] | ResearchTeamMember[] | null
export type OnboardingAnswers = Record<string, OnboardingAnswerValue>

export interface OnboardingProgressSummary {
  answeredCount: number
  documentCount: number
  criticalCompleted: number
  criticalTotal: number
}

export interface OnboardingState {
  answers: OnboardingAnswers
  currentDomain: OnboardingDomain
  completedDomains: OnboardingDomain[]
  startedAt: string | null
  institutionId: string | null
  institutionName: string
  uploadedDocs: UploadedDoc[]
  updatedAt: string
}

export interface UploadedDoc {
  label: string
  type: string
  uploaded: boolean
  fileName?: string
  fileSize?: number
  status?: 'uploaded' | 'converting' | 'converted' | 'failed' | 'error'
  markdown?: string
  characterCount?: number
  uploadedAt?: string
  convertedAt?: string
  converter?: 'markitdown'
  error?: string
  expiresAt?: string
  evidenceClass?: 'A' | 'B' | 'C' | 'D'
  proves?: string[]
  pending?: boolean
  notApplicable?: boolean
}

interface OnboardingContextType {
  state: OnboardingState
  setAnswer: (questionId: string, value: OnboardingAnswerValue) => void
  setAnswers: (answers: OnboardingAnswers) => void
  setInstitutionName: (name: string) => void
  setCurrentDomain: (domain: OnboardingDomain) => void
  markDomainCompleted: (domain: OnboardingDomain) => void
  addDocument: (doc: UploadedDoc) => void
  removeDocument: (label: string) => void
  fastTrack: FastTrackProgress
  progress: OnboardingProgressSummary
  reset: () => void
}

const initialState: OnboardingState = {
  answers: {},
  currentDomain: 'welcome',
  completedDomains: [],
  startedAt: null,
  institutionId: null,
  institutionName: '',
  uploadedDocs: [],
  updatedAt: new Date(0).toISOString(),
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

// @compatibility — ORP-1.2 legacy projection bridge
// Projects canonical objects into legacy flat keys for compatibility.
// New code must use derived-read-models instead.
// Remove after all consumers migrate to canonical object reads (ORP-1.4).
function withDerivedAnswers(state: OnboardingState): OnboardingState {
  const canonicalAnswers = removeLegacyFlatProjectionAnswers(state.answers) as OnboardingAnswers
  const teamMembers = Array.isArray(canonicalAnswers.people_team_members)
    ? (canonicalAnswers.people_team_members as ResearchTeamMember[])
    : []
  const principalInvestigators = teamMembers.filter((member) => member.isPrincipalInvestigator)
  const leadInvestigator = principalInvestigators[0] ?? teamMembers[0] ?? null
  const first = String(leadInvestigator?.firstName ?? '').trim()
  const last = String(leadInvestigator?.lastName ?? '').trim()
  const piName = [first, last].filter(Boolean).join(' ').trim()
  const uploadedCount = state.uploadedDocs.filter((doc) => doc.uploaded).length
  const teamRoles = Array.from(new Set(teamMembers.flatMap((member) => member.researchRoles).filter(Boolean)))
  const teamLanguages = Array.from(new Set(teamMembers.flatMap((member) => member.languages).filter(Boolean)))
  const teamCertifications = Array.from(new Set(
    teamMembers
      .flatMap((member) => member.certifications ?? [])
      .map((certification) => certification.type)
      .filter(Boolean)
  ))
  const locationInfrastructure = Array.isArray(canonicalAnswers.infra_location_infrastructure)
    ? (canonicalAnswers.infra_location_infrastructure as LocationInfrastructure[])
    : []
  const locations = Array.isArray(canonicalAnswers.org_locations)
    ? (canonicalAnswers.org_locations as InstitutionalLocation[])
    : []
  const primaryLocation = getPrimaryLocation(locations)
  const locationsWithLab = locationInfrastructure.filter((item) => item.laboratoryPresent)
  const locationsWithBiospecimen = locationInfrastructure.filter((item) => item.biospecimenOperations.some((operation) => operation !== 'None'))
  const storageEquipment = Array.from(new Set(locationInfrastructure.flatMap((item) => item.storageEquipment)))
  const biospecimenOperations = Array.from(new Set(locationInfrastructure.flatMap((item) => item.biospecimenOperations).filter((operation) => operation !== 'None')))
  const hasStrongBackup = locationInfrastructure.some((item) => item.backupPower === 'Generator + UPS' || item.backupPower === 'Generator only')
  const hasMonitoring = locationInfrastructure.some((item) => item.temperatureMonitoring === 'Continuous logging with alarms')

  return {
    ...state,
    institutionName: state.institutionName || String(canonicalAnswers.org_name ?? '').trim(),
    answers: {
      ...canonicalAnswers,
      ...(primaryLocation?.street ? { org_street: primaryLocation.street } : {}),
      ...(primaryLocation?.city ? { org_city: primaryLocation.city } : {}),
      ...(primaryLocation?.state ? { org_state: primaryLocation.state } : {}),
      ...(primaryLocation?.country ? { org_country: primaryLocation.country } : {}),
      ...(primaryLocation?.zip ? { org_zip: primaryLocation.zip } : {}),
      ...(primaryLocation?.timeZone ? { org_time_zone: primaryLocation.timeZone } : {}),
      ...(canonicalAnswers.org_operational_coverage ? {
        org_geographic_reach: LEGACY_GEOGRAPHIC_REACH_BY_COVERAGE[String(canonicalAnswers.org_operational_coverage)] ?? '',
      } : {}),
      ...(piName ? { people_pi_name: piName } : {}),
      ...(leadInvestigator?.firstName ? { people_pi_first_name: leadInvestigator.firstName } : {}),
      ...(leadInvestigator?.lastName ? { people_pi_last_name: leadInvestigator.lastName } : {}),
      ...(leadInvestigator?.primaryRole ? { people_pi_title: leadInvestigator.primaryRole } : {}),
      ...(leadInvestigator?.email ? { people_pi_email: leadInvestigator.email } : {}),
      ...(leadInvestigator?.yearsExperience ? { people_pi_experience: leadInvestigator.yearsExperience } : {}),
      ...(leadInvestigator?.therapeuticExpertise.length ? { people_pi_ta: leadInvestigator.therapeuticExpertise } : {}),
      ...(teamMembers.length > 0 ? { people_total_team: teamMembers.length } : {}),
      ...(teamRoles.length > 0 ? { people_roles: teamRoles } : {}),
      ...(teamLanguages.length > 0 ? { people_languages: teamLanguages } : {}),
      ...(teamCertifications.length > 0 ? { people_certs: teamCertifications } : {}),
      ...(locationInfrastructure.length > 0 ? { infra_location_count: String(locationInfrastructure.length) } : {}),
      ...(locationInfrastructure[0]?.facilityType ? { infra_facility_type: locationInfrastructure[0].facilityType } : {}),
      ...(locationInfrastructure[0]?.dedicatedResearchSpace ? { infra_research_space: locationInfrastructure[0].dedicatedResearchSpace } : {}),
      ...(hasStrongBackup ? { infra_backup_power: 'generator' } : {}),
      ...(locationsWithLab.length > 0 ? { infra_has_lab: 'yes' } : {}),
      ...(locationsWithBiospecimen.length > 0 ? { infra_has_biospecimen: 'yes' } : {}),
      ...(storageEquipment.length > 0 ? { infra_storage_equip: storageEquipment } : {}),
      ...(hasMonitoring ? { infra_temp_monitoring: 'full' } : {}),
      ...(biospecimenOperations.length > 0 ? { infra_specimen_types: biospecimenOperations } : {}),
      ...(uploadedCount > 0 ? { docs_uploaded_count: uploadedCount } : {}),
    },
  }
}

export function createPersistedOnboardingState(state: OnboardingState): OnboardingState {
  return {
    ...state,
    answers: removeLegacyFlatProjectionAnswers(state.answers) as OnboardingAnswers,
  }
}

function createNextState(state: OnboardingState, patch: Partial<OnboardingState>): OnboardingState {
  return withDerivedAnswers({
    ...state,
    ...patch,
    updatedAt: new Date().toISOString(),
  })
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kadarn-onboarding')
      if (saved) {
        setState(withDerivedAnswers({ ...initialState, ...JSON.parse(saved) }))
      }
    } catch {
      localStorage.removeItem('kadarn-onboarding')
    } finally {
      setHasHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (hasHydrated) {
      localStorage.setItem('kadarn-onboarding', JSON.stringify(createPersistedOnboardingState(state)))
    }
  }, [hasHydrated, state])

  const setAnswer = (questionId: string, value: OnboardingAnswerValue) => {
    if (isLegacyFlatProjectionKey(questionId)) return

    setState((prev) => {
      const answers = {
        ...prev.answers,
        [questionId]: value,
      }
      const next = createNextState(prev, {
        answers,
        institutionName: questionId === 'org_name' ? String(value ?? '').trim() : prev.institutionName,
        startedAt: prev.startedAt ?? new Date().toISOString(),
      })
      return next
    })
  }

  const setAnswers = (answers: OnboardingAnswers) => {
    setState((prev) => createNextState(prev, {
      answers: {
        ...prev.answers,
        ...removeLegacyFlatProjectionAnswers(answers),
      },
      startedAt: prev.startedAt ?? new Date().toISOString(),
    }))
  }

  const setInstitutionName = (name: string) => {
    setState((prev) => createNextState(prev, {
      institutionName: name,
      answers: {
        ...prev.answers,
        org_name: name,
      },
    }))
  }

  const setCurrentDomain = (domain: OnboardingDomain) => {
    setState((prev) => {
      if (prev.currentDomain === domain) return prev
      return createNextState(prev, { currentDomain: domain })
    })
  }

  const markDomainCompleted = (domain: OnboardingDomain) => {
    setState((prev) => {
      if (prev.completedDomains.includes(domain)) return prev
      return createNextState(prev, {
        completedDomains: [...prev.completedDomains, domain],
      })
    })
  }

  const addDocument = (doc: UploadedDoc) => {
    setState((prev) => {
      const existing = prev.uploadedDocs.findIndex((d) => d.label === doc.label)
      const updated = [...prev.uploadedDocs]
      if (existing >= 0) {
        updated[existing] = doc
      } else {
        updated.push(doc)
      }
      return createNextState(prev, { uploadedDocs: updated })
    })
  }

  const removeDocument = (label: string) => {
    setState((prev) => {
      return createNextState(prev, {
        uploadedDocs: prev.uploadedDocs.filter((d) => d.label !== label),
      })
    })
  }

  const reset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kadarn-onboarding')
    }
    setState(initialState)
  }

  const fastTrack = computeFastTrackProgress(state.answers)
  const progress: OnboardingProgressSummary = {
    answeredCount: Object.values(state.answers).filter(
      (value) => value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0),
    ).length,
    documentCount: state.uploadedDocs.filter((doc) => doc.uploaded).length,
    criticalCompleted: fastTrack.criticalCompleted,
    criticalTotal: fastTrack.criticalTotal,
  }

  return (
    <OnboardingContext.Provider
      value={{
        state,
        setAnswer,
        setAnswers,
        setInstitutionName,
        setCurrentDomain,
        markDomainCompleted,
        addDocument,
        removeDocument,
        fastTrack,
        progress,
        reset,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding(): OnboardingContextType {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return ctx
}

/**
 * ORP-1.3 Derived Read Model hook.
 *
 * Computes the Passport read model once and memoizes it.
 * Replaces direct assemblePassport() calls across onboarding pages.
 *
 * Design contract:
 * - Pure derivation from canonical objects only
 * - No legacy flat-key reads
 * - No side effects, no state mutation
 * - UI output shapes remain identical to assemblePassport()
 */
export function useDerivedReadModel(): PassportData {
  const { state } = useOnboarding()

  return useMemo(
    () =>
      derivePassportReadModel({
        institutionId: state.institutionId ?? 'new',
        institutionName: state.institutionName,
        answers: state.answers,
        uploadedDocs: state.uploadedDocs,
      }),
    [
      state.institutionId,
      state.institutionName,
      state.answers,
      state.uploadedDocs,
    ],
  )
}
