import type { KadarnEventType } from '@kadarn/domain-events'

export type LegacyClaimStatus =
  | 'self_reported'
  | 'evidence_submitted'
  | 'reference_pending'
  | 'reference_confirmed'
  | 'kadarn_verified'
  | 'rejected'
  | 'expired'

export interface ContinuityDbClient {
  from(table: string): any
  rpc?: any
}

export interface ActorContext {
  actorId: string
  organizationId: string
}

export interface ExperienceClaimInput {
  siteContinuityProfileId: string
  claimType: string
  category: string
  title: string
  description?: string | null
  experienceSource?: 'legacy' | 'native'
  therapeuticArea?: string | null
  studyPhase?: string | null
  biospecimenType?: string | null
  startDate?: string | null
  endDate?: string | null
  quantity?: number | null
  isPublic?: boolean
  sponsorNamePolicy?: 'private' | 'masked' | 'permissioned' | 'public'
  maskedSponsorLabel?: string | null
}

export interface EvidenceInput {
  claimId: string
  evidenceType: string
  title: string
  description?: string | null
  fileUrl?: string | null
  externalUrl?: string | null
  documentId?: string | null
}

export interface ReferenceInput {
  claimId: string
  referenceType: string
  referenceName: string
  referenceOrganization?: string | null
  referenceEmail?: string | null
  referenceRole?: string | null
  relationshipContext?: string | null
}

export interface ConfidenceInput {
  status: LegacyClaimStatus
  evidenceCount?: number
  pendingReferenceCount?: number
  confirmedReferenceCount?: number
}

const forbiddenPhiKeys = [
  'patient',
  'patient_id',
  'subject',
  'subject_id',
  'donor',
  'donor_id',
  'mrn',
  'medical_record',
  'date_of_birth',
  'dob',
  'ssn',
]

const forbiddenPhiText = /\b(MRN|SSN|DOB|date of birth|patient id|subject id|donor id)\b/i

export function assertNoPhiPayload(payload: Record<string, unknown>): void {
  for (const key of Object.keys(payload)) {
    if (forbiddenPhiKeys.includes(key.toLowerCase())) {
      throw new Error(`PHI field is not allowed in continuity claims: ${key}`)
    }
  }

  for (const value of Object.values(payload)) {
    if (typeof value === 'string' && forbiddenPhiText.test(value)) {
      throw new Error('Potential PHI marker detected in continuity claim text')
    }
  }
}

export function calculateClaimConfidence(input: ConfidenceInput): number {
  if (input.status === 'rejected') return 0
  if (input.status === 'expired') return 30
  if (input.status === 'kadarn_verified') return 95

  const evidenceCount = input.evidenceCount ?? 0
  const pendingReferenceCount = input.pendingReferenceCount ?? 0
  const confirmedReferenceCount = input.confirmedReferenceCount ?? 0

  if (confirmedReferenceCount > 0 && evidenceCount > 1) return 90
  if (input.status === 'reference_confirmed' || confirmedReferenceCount > 0) return 80
  if (input.status === 'reference_pending' || pendingReferenceCount > 0) return 60
  if (input.status === 'evidence_submitted' || evidenceCount > 0) return 50
  return 25
}

export function canDisplayClaimOnPassport(claim: {
  is_public: boolean
  verification_status: LegacyClaimStatus
}): boolean {
  return claim.is_public === true && claim.verification_status !== 'rejected'
}

async function publishContinuityEvent(
  db: ContinuityDbClient,
  eventType: KadarnEventType,
  context: ActorContext,
  claimId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!db.rpc) return

  const eventId = crypto.randomUUID()
  const occurredAt = new Date().toISOString()

  await db.rpc('publish_domain_event', {
    p_event_type: eventType,
    p_payload: {
      eventId,
      organizationId: context.organizationId,
      claimId,
      actorId: context.actorId,
      occurredAt,
      payload,
    },
    p_actor_id: context.actorId,
    p_organization_id: context.organizationId,
    p_program_id: null,
    p_correlation_id: null,
    p_causation_id: null,
    p_idempotency_key: `${eventType}:${claimId}:${eventId}`,
    p_event_version: 1,
    p_metadata: { source: 'continuity-claim-service' },
  })
}

export async function createExperienceClaim(
  db: ContinuityDbClient,
  context: ActorContext,
  input: ExperienceClaimInput,
) {
  assertNoPhiPayload(input as unknown as Record<string, unknown>)

  const confidenceScore = calculateClaimConfidence({ status: 'self_reported' })
  const { data, error } = await db
    .from('continuity_experience_claims')
    .insert({
      organization_id: context.organizationId,
      site_continuity_profile_id: input.siteContinuityProfileId,
      claim_type: input.claimType,
      category: input.category,
      title: input.title,
      description: input.description ?? null,
      experience_source: input.experienceSource ?? 'legacy',
      therapeutic_area: input.therapeuticArea ?? null,
      study_phase: input.studyPhase ?? null,
      biospecimen_type: input.biospecimenType ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      quantity: input.quantity ?? null,
      verification_status: 'self_reported',
      confidence_score: confidenceScore,
      is_public: input.isPublic ?? false,
      sponsor_name_policy: input.sponsorNamePolicy ?? 'masked',
      masked_sponsor_label: input.maskedSponsorLabel ?? null,
      created_by: context.actorId,
      updated_by: context.actorId,
    })
    .select('*')
    .single()

  if (error) throw error
  await publishContinuityEvent(db, 'LegacyExperienceClaimCreated', context, data.id, {
    profileId: input.siteContinuityProfileId,
    claimType: input.claimType,
    category: input.category,
    title: input.title,
    experienceSource: input.experienceSource ?? 'legacy',
    verificationStatus: 'self_reported',
    confidenceScore,
    isPublic: input.isPublic ?? false,
  })
  return data
}

export async function updateExperienceClaim(
  db: ContinuityDbClient,
  context: ActorContext,
  claimId: string,
  changes: Partial<ExperienceClaimInput>,
) {
  assertNoPhiPayload(changes as Record<string, unknown>)

  const updatePayload = {
    claim_type: changes.claimType,
    category: changes.category,
    title: changes.title,
    description: changes.description,
    therapeutic_area: changes.therapeuticArea,
    study_phase: changes.studyPhase,
    biospecimen_type: changes.biospecimenType,
    start_date: changes.startDate,
    end_date: changes.endDate,
    quantity: changes.quantity,
    is_public: changes.isPublic,
    sponsor_name_policy: changes.sponsorNamePolicy,
    masked_sponsor_label: changes.maskedSponsorLabel,
    updated_by: context.actorId,
  }
  const compactPayload = Object.fromEntries(
    Object.entries(updatePayload).filter(([, value]) => value !== undefined),
  )

  const { data, error } = await db
    .from('continuity_experience_claims')
    .update(compactPayload)
    .eq('id', claimId)
    .eq('organization_id', context.organizationId)
    .select('*')
    .single()

  if (error) throw error
  await publishContinuityEvent(db, 'LegacyExperienceClaimUpdated', context, claimId, {
    changedFields: Object.keys(compactPayload),
    oldValues: {},
    newValues: compactPayload,
  })
  return data
}

export async function submitEvidence(
  db: ContinuityDbClient,
  context: ActorContext,
  input: EvidenceInput,
) {
  assertNoPhiPayload(input as unknown as Record<string, unknown>)

  const { data, error } = await db
    .from('continuity_evidence_items')
    .insert({
      organization_id: context.organizationId,
      claim_id: input.claimId,
      evidence_type: input.evidenceType,
      title: input.title,
      description: input.description ?? null,
      file_url: input.fileUrl ?? null,
      external_url: input.externalUrl ?? null,
      document_id: input.documentId ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  await setClaimStatus(db, context, input.claimId, 'evidence_submitted')
  await publishContinuityEvent(db, 'ContinuityEvidenceSubmitted', context, input.claimId, {
    evidenceItemId: data.id,
    evidenceType: input.evidenceType,
    title: input.title,
    hasFileUrl: Boolean(input.fileUrl),
    hasExternalUrl: Boolean(input.externalUrl),
    hasDocumentId: Boolean(input.documentId),
  })
  return data
}

export async function addReference(
  db: ContinuityDbClient,
  context: ActorContext,
  input: ReferenceInput,
) {
  assertNoPhiPayload(input as unknown as Record<string, unknown>)

  const { data, error } = await db
    .from('continuity_references')
    .insert({
      organization_id: context.organizationId,
      claim_id: input.claimId,
      reference_type: input.referenceType,
      reference_name: input.referenceName,
      reference_organization: input.referenceOrganization ?? null,
      reference_email: input.referenceEmail ?? null,
      reference_role: input.referenceRole ?? null,
      relationship_context: input.relationshipContext ?? null,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) throw error
  await setClaimStatus(db, context, input.claimId, 'reference_pending')
  await publishContinuityEvent(db, 'ContinuityReferenceAdded', context, input.claimId, {
    referenceId: data.id,
    referenceType: input.referenceType,
    referenceOrganization: input.referenceOrganization ?? null,
    referenceRole: input.referenceRole ?? null,
    status: 'pending',
  })
  return data
}

export async function markReferenceConfirmed(
  db: ContinuityDbClient,
  context: ActorContext,
  claimId: string,
  referenceId: string,
) {
  const confirmedAt = new Date().toISOString()
  const { data, error } = await db
    .from('continuity_references')
    .update({ status: 'confirmed', confirmed_at: confirmedAt })
    .eq('id', referenceId)
    .eq('claim_id', claimId)
    .eq('organization_id', context.organizationId)
    .select('*')
    .single()

  if (error) throw error
  const confidenceScore = await setClaimStatus(db, context, claimId, 'reference_confirmed')
  await publishContinuityEvent(db, 'ContinuityReferenceConfirmed', context, claimId, {
    referenceId,
    confirmedAt,
    confidenceScore,
  })
  return data
}

export async function markClaimVerified(
  db: ContinuityDbClient,
  context: ActorContext,
  claimId: string,
) {
  const confidenceScore = await setClaimStatus(db, context, claimId, 'kadarn_verified')
  await publishContinuityEvent(db, 'ContinuityClaimVerified', context, claimId, {
    verificationStatus: 'kadarn_verified',
    confidenceScore,
  })
  return { claimId, confidenceScore }
}

export async function rejectClaim(
  db: ContinuityDbClient,
  context: ActorContext,
  claimId: string,
  reason: string,
) {
  const confidenceScore = await setClaimStatus(db, context, claimId, 'rejected')
  await publishContinuityEvent(db, 'ContinuityClaimRejected', context, claimId, {
    verificationStatus: 'rejected',
    confidenceScore: 0,
    reason,
  })
  return { claimId, confidenceScore }
}

async function setClaimStatus(
  db: ContinuityDbClient,
  context: ActorContext,
  claimId: string,
  status: LegacyClaimStatus,
): Promise<number> {
  const confidenceScore = calculateClaimConfidence({ status })
  const { error } = await db
    .from('continuity_experience_claims')
    .update({
      verification_status: status,
      confidence_score: confidenceScore,
      updated_by: context.actorId,
    })
    .eq('id', claimId)
    .eq('organization_id', context.organizationId)

  if (error) throw error
  await publishContinuityEvent(db, 'ClaimConfidenceScoreUpdated', context, claimId, {
    previousScore: null,
    nextScore: confidenceScore,
    reason: `status:${status}`,
  })
  return confidenceScore
}

export async function listClaimsForSite(
  db: ContinuityDbClient,
  organizationId: string,
  profileId: string,
) {
  const { data, error } = await db
    .from('continuity_experience_claims')
    .select(`
      *,
      continuity_evidence_items(id),
      continuity_references(id, status)
    `)
    .eq('organization_id', organizationId)
    .eq('site_continuity_profile_id', profileId)
    .order('confidence_score', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function listPublicClaimsForPassport(
  db: ContinuityDbClient,
  profileIdOrSlug: string,
) {
  const { data, error } = await db
    .from('continuity_experience_claims')
    .select('*')
    .eq('is_public', true)
    .neq('verification_status', 'rejected')
    .order('confidence_score', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).filter((claim: { site_continuity_profile_id: string }) =>
    claim.site_continuity_profile_id === profileIdOrSlug,
  )
}
