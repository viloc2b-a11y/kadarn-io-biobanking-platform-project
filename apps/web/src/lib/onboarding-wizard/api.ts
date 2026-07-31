// ==========================================================================
// Onboarding Wizard API — Backend bridge
// ==========================================================================
// Calls existing KADARN API endpoints (apps/api/).
// Requires active Supabase session (handled by apiGet/apiPost).
// ==========================================================================

'use client'

import { apiGet, apiPost } from '@/lib/api-client'
import type { WizardDraft, WizardLocation, WizardPerson, WizardInfrastructure, WizardCapability } from './types'

// ── Institution ─────────────────────────────────────────────────

export interface InstitutionResponse {
  id: string
  name: string
  type: string
  description: string
  created_at: string
}

export async function createInstitution(draft: WizardDraft): Promise<InstitutionResponse> {
  return apiPost<InstitutionResponse>('/api/v1/institutions', {
    name: draft.identity_name,
    description: draft.identity_description,
    type: draft.institution_type,
    therapeutic_areas: draft.research_therapeuticAreas,
    research_modalities: draft.research_modalities,
    research_description: draft.research_description,
  })
}

// ── Locations ───────────────────────────────────────────────────

export async function createLocations(institutionId: string, locations: WizardLocation[]): Promise<void> {
  for (const loc of locations) {
    if (!loc.name.trim()) continue
    await apiPost(`/api/v1/institutions/${institutionId}/locations`, {
      name: loc.name,
      type: loc.type || undefined,
      street: loc.street || undefined,
      city: loc.city || undefined,
      state: loc.state || undefined,
      country: loc.country || undefined,
      postal_code: loc.zip || undefined,
      is_primary: loc.isPrimary,
    })
  }
}

// ── People ──────────────────────────────────────────────────────

export async function createPeople(institutionId: string, people: WizardPerson[]): Promise<void> {
  for (const person of people) {
    if (!person.firstName.trim() || !person.lastName.trim()) continue
    await apiPost(`/api/v1/institutions/${institutionId}/members`, {
      first_name: person.firstName,
      last_name: person.lastName,
      email: person.email || undefined,
      role: person.role || undefined,
      is_principal_investigator: person.isPI,
      years_experience: person.yearsExperience,
      therapeutic_expertise: person.therapeuticExpertise,
    })
  }
}

// ── Capabilities ────────────────────────────────────────────────

export async function createCapabilities(institutionId: string, capabilities: WizardCapability[]): Promise<void> {
  for (const cap of capabilities) {
    if (!cap.name.trim()) continue
    await apiPost(`/api/v1/institutions/${institutionId}/capabilities`, {
      name: cap.name,
      description: cap.description,
      confidence: cap.confidence.toLowerCase(),
    })
  }
}

// ── Evidence (Sources) ──────────────────────────────────────────

export async function createEvidence(
  institutionId: string,
  documents: Array<{ label: string; type: string; fileName: string }>,
): Promise<void> {
  for (const doc of documents) {
    if (!doc.label.trim()) continue
    await apiPost(`/api/v1/institutions/${institutionId}/knowledge`, {
      title: doc.label,
      source_type: 'document',
      description: doc.type,
      file_name: doc.fileName,
    })
  }
}

// ── Readiness ───────────────────────────────────────────────────

export interface ReadinessResponse {
  data: {
    overall_score: number
    dimensions: Array<{
      dimension: string
      score: number
      max_score: number
      label: string
    }>
    computed_at: string
  }
  cached: boolean
}

export async function fetchReadiness(institutionId: string): Promise<ReadinessResponse> {
  return apiGet<ReadinessResponse>(`/api/v1/institutions/${institutionId}/readiness`)
}

// ── Passport ────────────────────────────────────────────────────

export interface PassportResponse {
  data: {
    institution: {
      id: string
      name: string
      type: string
      description: string
    }
    capabilities: Array<{
      id: string
      name: string
      description: string
      confidence_level: string
    }>
    readiness: {
      overall_score: number
      dimensions: Array<{
        dimension: string
        score: number
        label: string
      }>
    } | null
    members_count: number
    locations_count: number
    evidence_count: number
  }
}

export async function fetchPassport(institutionId: string): Promise<PassportResponse> {
  return apiGet<PassportResponse>(`/api/v1/institutions/${institutionId}/passport-entries`)
}

// ── Full Submission ─────────────────────────────────────────────

export interface SubmissionResult {
  institution: InstitutionResponse
  readiness: ReadinessResponse | null
  passport: PassportResponse | null
}

export async function submitOnboarding(draft: WizardDraft): Promise<SubmissionResult> {
  // 1. Create institution
  const institution = await createInstitution(draft)
  const institutionId = institution.id

  // 2. Create locations (async, fire-and-forget for speed)
  const locationPromise = createLocations(institutionId, draft.locations)

  // 3. Create people
  const peoplePromise = createPeople(institutionId, draft.people)

  // 4. Create capabilities
  const capabilitiesPromise = createCapabilities(institutionId, draft.capabilities)

  // 5. Create evidence entries
  const evidencePromise = createEvidence(
    institutionId,
    draft.documents.filter((d) => d.uploaded).map((d) => ({
      label: d.label,
      type: d.type,
      fileName: d.fileName ?? '',
    })),
  )

  // Wait for all entity creation
  await Promise.all([locationPromise, peoplePromise, capabilitiesPromise, evidencePromise])

  // 6. Fetch derived products
  const [readiness, passport] = await Promise.all([
    fetchReadiness(institutionId).catch(() => null),
    fetchPassport(institutionId).catch(() => null),
  ])

  return { institution, readiness, passport }
}
