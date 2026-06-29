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
// --------------------------------------------------------------------------
// Verification Workflow (Sprint 6)
// --------------------------------------------------------------------------

/**
 * Compute badge level based on evidence and confirmed references.
 * - self_reported: no evidence, no confirmed references
 * - evidence_backed: >=1 evidence item
 * - reference_confirmed: >=1 confirmed reference
 * - kadarn_verified: explicitly verified by Kadarn admin
 */
export function computeBadgeLevel(
  evidenceCount: number,
  confirmedReferenceCount: number,
  isVerifiedByAdmin: boolean,
): string {
  if (isVerifiedByAdmin) return 'kadarn_verified'
  if (confirmedReferenceCount >= 1) return 'reference_confirmed'
  if (evidenceCount >= 1) return 'evidence_backed'
  return 'self_reported'
}

/**
 * Submit a claim for admin review.
 * Transitions status from any state to 'under_review'.
 */
export async function submitForReview(
  db: ContinuityDbClient,
  context: ActorContext,
  claimId: string,
) {
  const { data: claim, error: fetchErr } = await db
    .from('continuity_experience_claims')
    .select('status, badge_level')
    .eq('id', claimId)
    .single()

  if (fetchErr) throw fetchErr
  if (!claim) throw new Error('Claim not found')
  if (claim.status === 'verified' || claim.status === 'rejected') {
    throw new Error('Cannot submit a ' + claim.status + ' claim for review')
  }

  const { error } = await db
    .from('continuity_experience_claims')
    .update({
      status: 'under_review',
      submitted_for_review_at: new Date().toISOString(),
    })
    .eq('id', claimId)
    .eq('organization_id', context.organizationId)

  if (error) throw error

  await publishContinuityEvent(db, 'ContinuityClaimSubmitted', context, claimId, {
    previousStatus: claim.status,
    badgeLevel: claim.badge_level,
  })

  return { claimId, status: 'under_review' }
}

/**
 * Admin review action: verify or reject a claim.
 * Sets reviewer info, computes badge, logs to verification_history.
 */
export async function reviewClaim(
  db: ContinuityDbClient,
  context: ActorContext,
  claimId: string,
  action: 'verify' | 'reject',
  reviewerNotes?: string,
) {
  // Fetch claim with evidence/reference counts
  const { data: claim, error: fetchErr } = await db
    .from('continuity_experience_claims')
    .select('*, continuity_evidence_items(id), continuity_references(id, status)')
    .eq('id', claimId)
    .single()

  if (fetchErr) throw fetchErr
  if (!claim) throw new Error('Claim not found')

  const evidenceCount = (claim.continuity_evidence_items ?? []).length
  const confirmedRefs = (claim.continuity_references ?? []).filter(
    (r: { status: string }) => r.status === 'confirmed',
  ).length
  const isVerifyAction = action === 'verify'
  const badgeLevel = computeBadgeLevel(evidenceCount, confirmedRefs, isVerifyAction)

  const newStatus = isVerifyAction ? 'verified' : 'rejected'

  const { error } = await db
    .from('continuity_experience_claims')
    .update({
      status: newStatus,
      badge_level: badgeLevel,
      reviewer_id: context.actorId,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes ?? null,
    })
    .eq('id', claimId)

  if (error) throw error

  const eventType = isVerifyAction ? 'ContinuityClaimVerified' : 'ContinuityClaimRejected'
  await publishContinuityEvent(db, eventType, context, claimId, {
    verificationStatus: newStatus,
    badgeLevel,
    confidenceScore: isVerifyAction ? 0.85 : 0,
    reason: reviewerNotes ?? '',
  })

  return { claimId, status: newStatus, badgeLevel }
}

/**
 * Get the admin verification queue.
 * Returns claims ordered by submission date.
 */
export async function getVerificationQueue(
  db: ContinuityDbClient,
  options?: {
    status?: string
    badgeLevel?: string
    limit?: number
    offset?: number
  },
) {
  let query = db
    .from('continuity_experience_claims')
    .select('*, continuity_evidence_items(id), continuity_references(id, status)', { count: 'exact' })
    .not('status', 'eq', 'draft')
    .order('submitted_for_review_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.badgeLevel) {
    query = query.eq('badge_level', options.badgeLevel)
  }

  const limit = Math.min(options?.limit ?? 50, 200)
  const offset = options?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error

  return {
    claims: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  }
}

/**
 * Promote a verified claim to the durable ledger.
 * Calls the RPC promote_claim_to_ledger and emits an event.
 */
export async function promoteToLedger(
  db: ContinuityDbClient,
  context: ActorContext,
  claimId: string,
) {
  const { data: ledgerId, error } = await db.rpc('promote_claim_to_ledger', {
    p_claim_id: claimId,
  })

  if (error) throw new Error('Failed to promote claim to ledger: ' + error.message)

  // Fetch the claim title for the event
  const { data: claim } = await db
    .from('continuity_experience_claims')
    .select('title, badge_level')
    .eq('id', claimId)
    .single()

  await publishContinuityEvent(db, 'ContinuityClaimPromotedToLedger', context, claimId, {
    ledgerEntryId: ledgerId,
    badgeLevel: claim?.badge_level ?? 'self_reported',
    claimTitle: claim?.title ?? '',
  })

  return { ledgerId, claimId }
}

// --------------------------------------------------------------------------
// Site Passport Score — executive summary
// --------------------------------------------------------------------------

/**
 * Compute the overall continuity score and executive summary for a site.
 * Aggregates all claims, evidence, and references into a single scorecard.
 */
export async function computeSiteScore(
  db: ContinuityDbClient,
  profileId: string,
) {
  const { data: claims } = await db
    .from('continuity_experience_claims')
    .select('*, continuity_evidence_items(id), continuity_references(id, status)')
    .eq('site_continuity_profile_id', profileId)

  const list = claims ?? []
  const total = list.length

  let totalEvidence = 0
  let totalConfirmedRefs = 0
  const therapeuticAreasSet = new Set<string>()
  let totalBiospecimens = 0
  let totalStudies = 0
  let earliestDate: string | null = null
  let verifiedCount = 0
  let hasEvidence = 0
  let hasConfirmedRef = 0
  let infraOk = false
  let regulatoryOk = false

  for (const c of list) {
    const evCount = (c.continuity_evidence_items ?? []).length
    totalEvidence += evCount
    if (evCount > 0) hasEvidence++

    const refs = (c.continuity_references ?? []) as Array<{ status: string }>
    const confirmed = refs.filter(r => r.status === 'confirmed').length
    totalConfirmedRefs += confirmed
    if (confirmed > 0) hasConfirmedRef++

    if (c.therapeutic_area) therapeuticAreasSet.add(c.therapeutic_area)
    if (c.quantity) totalBiospecimens += Number(c.quantity)
    if (c.claim_type === 'clinical_study' || c.category === 'clinical_study') totalStudies++

    if (c.start_date && (!earliestDate || c.start_date < earliestDate)) earliestDate = c.start_date
    if (c.verification_status === 'kadarn_verified' || c.status === 'verified' || c.badge_level === 'kadarn_verified') verifiedCount++
    if (c.claim_type === 'infrastructure' || c.category === 'infrastructure') infraOk = true
    if (c.claim_type === 'regulatory' || c.category === 'regulatory') regulatoryOk = true
  }

  const legacyYears = earliestDate
    ? Math.max(1, Math.round((Date.now() - new Date(earliestDate).getTime()) / (365.25 * 86400000)))
    : 0

  const evidenceCoverage = total > 0 ? Math.round((hasEvidence / total) * 100) : 0
  const referenceCoverage = total > 0 ? Math.round((hasConfirmedRef / total) * 100) : 0

  const components = {
    evidenceScore: evidenceCoverage * 0.25,
    referenceScore: referenceCoverage * 0.20,
    verificationScore: total > 0 ? (verifiedCount / total) * 100 * 0.25 : 0,
    coverageScore: Math.min(100, (total / Math.max(1, total + 3)) * 100) * 0.15,
    tenureScore: Math.min(100, legacyYears * 5) * 0.15,
  }
  const overallScore = Math.round(
    components.evidenceScore + components.referenceScore + components.verificationScore +
    components.coverageScore + components.tenureScore,
  )

  const trustLevel = verifiedCount > 0
    ? 'Kadarn Verified'
    : hasConfirmedRef > 0
      ? 'Reference Confirmed'
      : hasEvidence > 0
        ? 'Evidence Backed'
        : 'Self Reported'

  const continuityLevel = overallScore >= 80
    ? 'Advanced'
    : overallScore >= 50
      ? 'Established'
      : overallScore >= 20
        ? 'Developing'
        : 'Initial'

  return {
    overallScore,
    legacyYears,
    clinicalStudies: totalStudies || total,
    therapeuticAreas: therapeuticAreasSet.size || Math.min(total, 5),
    biospecimens: totalBiospecimens,
    trustLevel,
    continuityLevel,
    evidenceCoverage,
    referenceCoverage,
    infrastructure: infraOk ? 'Verified' : 'Not Verified',
    regulatoryReadiness: regulatoryOk ? 'Verified' : 'Not Verified',
  }
}

// --------------------------------------------------------------------------
// Missing Evidence Intelligence
// --------------------------------------------------------------------------

export async function generateRecommendations(
  db: ContinuityDbClient,
  profileId: string,
) {
  const { data: claims } = await db
    .from('continuity_experience_claims')
    .select('*, continuity_evidence_items(id), continuity_references(id, status)')
    .eq('site_continuity_profile_id', profileId)

  const list = claims ?? []
  const recommendations: Array<{ category: string; action: string; priority: string; estimatedTrustIncrease: number }> = []

  const therapeuticAreas = new Set<string>()
  let hasGcpEvidence = false
  let hasLabCapability = false
  let totalEvidence = 0
  let totalConfirmedRefs = 0

  for (const c of list) {
    if (c.therapeutic_area) therapeuticAreas.add(c.therapeutic_area)
    const evCount = (c.continuity_evidence_items ?? []).length
    totalEvidence += evCount
    const refs = (c.continuity_references ?? []) as Array<{ status: string }>
    totalConfirmedRefs += refs.filter(r => r.status === 'confirmed').length

    for (const ev of (c.continuity_evidence_items ?? []) as Array<{ evidence_type?: string }>) {
      if (ev.evidence_type?.toLowerCase().includes('gcp')) hasGcpEvidence = true
      if (ev.evidence_type?.toLowerCase().includes('lab') || ev.evidence_type?.toLowerCase().includes('capability')) hasLabCapability = true
    }
  }

  for (const ta of therapeuticAreas) {
    const claimsInTa = list.filter((c: { therapeutic_area: string }) => c.therapeutic_area === ta)
    const evInTa = claimsInTa.reduce((sum: number, c: { continuity_evidence_items?: Array<unknown> }) =>
      sum + (c.continuity_evidence_items ?? []).length, 0)
    if (evInTa === 0) {
      recommendations.push({ category: 'Evidence', action: 'Add evidence for ' + ta + ' experience', priority: 'high', estimatedTrustIncrease: 8 })
    }
    const refsInTa = claimsInTa.reduce((sum: number, c: { continuity_references?: Array<unknown> }) =>
      sum + (c.continuity_references ?? []).length, 0)
    if (refsInTa === 0) {
      recommendations.push({ category: 'References', action: 'Add references for ' + ta, priority: 'medium', estimatedTrustIncrease: 5 })
    }
  }

  if (!hasGcpEvidence) {
    recommendations.push({ category: 'Certification', action: 'Upload GCP certificates', priority: 'high', estimatedTrustIncrease: 12 })
  }
  if (!hasLabCapability) {
    recommendations.push({ category: 'Infrastructure', action: 'Verify laboratory capabilities', priority: 'medium', estimatedTrustIncrease: 7 })
  }

  const evCovered = list.filter((c: { continuity_evidence_items?: Array<unknown> }) => (c.continuity_evidence_items ?? []).length > 0).length
  if (list.length > 0 && evCovered / list.length < 0.5) {
    recommendations.push({ category: 'Evidence', action: 'Add evidence documents to existing claims', priority: 'high', estimatedTrustIncrease: 10 })
  }

  const refCovered = list.filter((c: { continuity_references?: Array<unknown> }) =>
    (c.continuity_references ?? []).filter((r: { status: string }) => r.status === 'confirmed').length > 0).length
  if (list.length > 0 && refCovered / list.length < 0.3) {
    recommendations.push({ category: 'References', action: 'Confirm pending references to boost credibility', priority: 'medium', estimatedTrustIncrease: 6 })
  }

  const evidenceScore = Math.min(40, (totalEvidence / Math.max(1, list.length * 2)) * 40)
  const refScore = Math.min(30, (totalConfirmedRefs / Math.max(1, list.length)) * 30)
  const coverageScore = Math.min(30, (list.length / 10) * 30)
  const completionPercent = Math.round(Math.min(100, evidenceScore + refScore + coverageScore))

  return { completionPercent, recommendations: recommendations.slice(0, 8) }
}

// --------------------------------------------------------------------------
// Opportunity Readiness
// --------------------------------------------------------------------------

export async function computeOpportunityReadiness(
  db: ContinuityDbClient,
  profileId: string,
) {
  const { data: claims } = await db
    .from('continuity_experience_claims')
    .select('*, continuity_evidence_items(id), continuity_references(id, status)')
    .eq('site_continuity_profile_id', profileId)

  const list = claims ?? []
  const therapeuticAreas = new Set<string>()
  let hasVerified = false
  let hasFrozenShipment = false
  let hasCapCert = false
  let totalConfirmedRefs = 0

  for (const c of list) {
    if (c.therapeutic_area) therapeuticAreas.add(c.therapeutic_area)
    if (c.badge_level === 'kadarn_verified' || c.verification_status === 'kadarn_verified') hasVerified = true
    const refs = (c.continuity_references ?? []) as Array<{ status: string }>
    totalConfirmedRefs += refs.filter(r => r.status === 'confirmed').length
    if (c.claim_type?.toLowerCase().includes('frozen') || c.title?.toLowerCase().includes('frozen')) hasFrozenShipment = true
    if (c.category?.toLowerCase().includes('cap') || c.claim_type?.toLowerCase().includes('cap')) hasCapCert = true
  }

  const readyFor: Array<{ area: string; status: string }> = []
  const common = ['Oncology', 'Obesity', 'Diabetes', 'Respiratory', 'Cardiovascular', 'Rare Disease', 'CNS', 'Infectious Disease', 'IVD', 'Immunology']

  for (const opp of common) {
    if (therapeuticAreas.has(opp)) readyFor.push({ area: opp, status: 'ready' })
  }
  for (const ta of therapeuticAreas) {
    if (!common.includes(ta)) readyFor.push({ area: ta, status: 'ready' })
  }

  const needs: string[] = []
  if (!hasCapCert) needs.push('CAP certification')
  if (!hasFrozenShipment) needs.push('Frozen shipment validation')
  if (totalConfirmedRefs < 2) needs.push('Two verified references')
  if (!hasVerified) needs.push('Kadarn verification')

  const readyCount = readyFor.filter(r => r.status === 'ready').length
  const totalOpps = Math.max(1, readyCount + needs.length)
  const readinessScore = Math.round((readyCount / totalOpps) * 100)

  return { readyFor, needs, readinessScore }
}

// --------------------------------------------------------------------------
// Sprint 5 — Continuity Intelligence
// --------------------------------------------------------------------------

/**
 * Build an institutional growth timeline from claims data.
 * Extracts key milestones: founding, first sponsor, first phase III,
 * certifications, verification events, etc.
 */
export async function buildGrowthTimeline(
  db: ContinuityDbClient,
  profileId: string,
) {
  const { data: claims } = await db
    .from('continuity_experience_claims')
    .select('*, continuity_evidence_items(id), continuity_references(id, status)')
    .eq('site_continuity_profile_id', profileId)
    .order('start_date', { ascending: true })

  const list = claims ?? []
  const milestones: Array<{ year: number; label: string; type: string; description: string }> = []

  // Track first occurrences
  let firstStudyYear: number | null = null
  let firstPhase3Year: number | null = null
  let firstBiospecimenYear: number | null = null
  let firstInfraYear: number | null = null
  let firstRegulatoryYear: number | null = null
  let firstIvdYear: number | null = null
  let verifiedYear: number | null = null
  let foundingYear: number | null = null

  for (const c of list) {
    if (!c.start_date) continue
    const year = new Date(c.start_date).getFullYear()
    if (isNaN(year)) continue

    // Track earliest claim as founding year
    if (!foundingYear || year < foundingYear) foundingYear = year

    const ct = (c.claim_type ?? '').toLowerCase()
    const cat = (c.category ?? '').toLowerCase()
    const title = (c.title ?? '').toLowerCase()

    if (!firstStudyYear && (ct === 'clinical_study' || cat === 'clinical_study' || title.includes('study') || title.includes('trial'))) {
      firstStudyYear = year
    }
    if (!firstPhase3Year && (title.includes('phase iii') || title.includes('phase 3') || c.study_phase === 'Phase III')) {
      firstPhase3Year = year
    }
    if (!firstBiospecimenYear && (ct === 'biospecimen' || cat === 'biospecimen' || c.biospecimen_type)) {
      firstBiospecimenYear = year
    }
    if (!firstInfraYear && (ct === 'infrastructure' || cat === 'infrastructure')) {
      firstInfraYear = year
    }
    if (!firstRegulatoryYear && (ct === 'regulatory' || cat === 'regulatory')) {
      firstRegulatoryYear = year
    }
    if (!firstIvdYear && (title.includes('ivd') || ct.includes('ivd') || cat.includes('ivd'))) {
      firstIvdYear = year
    }
    if (!verifiedYear && (c.badge_level === 'kadarn_verified' || c.verification_status === 'kadarn_verified')) {
      verifiedYear = year
    }

    // Add significant events based on verification history
    if (c.verification_history && Array.isArray(c.verification_history)) {
      for (const entry of c.verification_history) {
        const entryYear = new Date((entry as any).at).getFullYear()
        if (!isNaN(entryYear) && (entry as any).to === 'verified') {
          if (!verifiedYear || entryYear < verifiedYear) verifiedYear = entryYear
        }
      }
    }
  }

  // Build ordered timeline
  if (foundingYear) {
    let foundingDesc = 'Site established'
    if (firstStudyYear && firstStudyYear === foundingYear) foundingDesc = 'Founded and began clinical operations'
    milestones.push({ year: foundingYear, label: String(foundingYear), type: 'founding', description: foundingDesc })
  }

  if (firstStudyYear && firstStudyYear !== foundingYear) {
    milestones.push({ year: firstStudyYear, label: String(firstStudyYear), type: 'milestone', description: 'First clinical study / sponsor engagement' })
  }
  if (firstPhase3Year) {
    milestones.push({ year: firstPhase3Year, label: String(firstPhase3Year), type: 'growth', description: 'First Phase III trial' })
  }
  if (firstBiospecimenYear) {
    milestones.push({ year: firstBiospecimenYear, label: String(firstBiospecimenYear), type: 'capability', description: 'Biospecimen program initiated' })
  }
  if (firstInfraYear) {
    milestones.push({ year: firstInfraYear, label: String(firstInfraYear), type: 'infrastructure', description: 'Infrastructure / lab expansion' })
  }
  if (firstRegulatoryYear) {
    milestones.push({ year: firstRegulatoryYear, label: String(firstRegulatoryYear), type: 'regulatory', description: 'Regulatory certification achieved' })
  }
  if (firstIvdYear) {
    milestones.push({ year: firstIvdYear, label: String(firstIvdYear), type: 'ivd', description: 'IVD validation capability established' })
  }
  if (verifiedYear) {
    milestones.push({ year: verifiedYear, label: String(verifiedYear), type: 'verified', description: 'Kadarn Verified' })
  }

  // Add future projection
  const lastYear = milestones.length > 0 ? milestones[milestones.length - 1].year : new Date().getFullYear()
  milestones.push({ year: lastYear + 1, label: String(lastYear + 1), type: 'future', description: 'International Programs — projected growth' })

  // Sort by year
  milestones.sort((a, b) => a.year - b.year)

  return { milestones }
}

/**
 * Match a sponsor opportunity against all available site profiles.
 * Scores each site on therapeutic area match, population, specimen type, verification level.
 */
export async function matchOpportunity(
  db: ContinuityDbClient,
  criteria: {
    therapeuticArea?: string
    population?: string
    location?: string
    specimenType?: string
    minConfidence?: number
    limit?: number
  },
) {
  const limit = Math.min(criteria.limit ?? 10, 50)

  // Get all public profiles with claims
  const { data: profiles } = await db
    .from('site_continuity_profiles')
    .select('id, organization_id, headline, public_slug, passport_visibility')
    .in('passport_visibility', ['public', 'shared_link'])
    .limit(50)

  const profileList = profiles ?? []
  const results: Array<{
    siteName: string
    slug: string
    matchPercent: number
    opportunityScore: number
    reasoning: string[]
    badges: string[]
  }> = []

  for (const profile of profileList) {
    const { data: claims } = await db
      .from('continuity_experience_claims')
      .select('*, continuity_evidence_items(id), continuity_references(id, status)')
      .eq('site_continuity_profile_id', profile.id)
      .neq('verification_status', 'rejected')

    const claimList = claims ?? []
    if (claimList.length === 0) continue

    let score = 0
    const maxScore = 100
    const reasoning: string[] = []
    const badges = new Set<string>()
    let matchedAreas = 0
    let totalAreas = 0

    for (const c of claimList) {
      // Track badges
      if (c.badge_level) badges.add(c.badge_level)
      else if (c.verification_status === 'kadarn_verified') badges.add('kadarn_verified')

      // Therapeutic area match (highest weight)
      if (criteria.therapeuticArea) {
        totalAreas++
        const ta = (c.therapeutic_area ?? '').toLowerCase()
        const target = criteria.therapeuticArea.toLowerCase()
        if (ta === target || ta.includes(target) || target.includes(ta)) {
          score += 30
          matchedAreas++
        }
      }

      // Specimen type match
      if (criteria.specimenType) {
        const bst = (c.biospecimen_type ?? '').toLowerCase()
        const targetSpec = criteria.specimenType.toLowerCase()
        if (bst === targetSpec || bst.includes(targetSpec) || targetSpec.includes(bst)) {
          score += 15
          if (!reasoning.includes('Matched specimen type')) reasoning.push('Matched specimen type: ' + criteria.specimenType)
        }
      }

      // Population match (via claim type / therapeutic area context)
      if (criteria.population) {
        const pop = criteria.population.toLowerCase()
        if ((c.description ?? '').toLowerCase().includes(pop) || (c.title ?? '').toLowerCase().includes(pop)) {
          score += 10
          if (!reasoning.includes('Population match')) reasoning.push('Relevant ' + criteria.population + ' experience')
        }
      }

      // Verification bonus
      if (c.badge_level === 'kadarn_verified' || c.verification_status === 'kadarn_verified') {
        score += 15
      }

      // Evidence bonus
      const evCount = (c.continuity_evidence_items ?? []).length
      if (evCount > 0) score += Math.min(10, evCount * 2)

      // Reference bonus
      const refCount = (c.continuity_references ?? []).filter((r: { status: string }) => r.status === 'confirmed').length
      if (refCount > 0) score += Math.min(10, refCount * 3)
    }

    if (matchedAreas > 0 && criteria.therapeuticArea) {
      reasoning.push(String(matchedAreas) + ' verified ' + criteria.therapeuticArea + ' programs')
    }

    // Normalize score
    const matchPercent = Math.min(100, Math.round(score))
    const opportunityScore = Math.min(100, Math.round(
      matchPercent * 0.6 +
      (badges.has('kadarn_verified') ? 25 : 0) +
      Math.min(15, claimList.length * 2)
    ))

    results.push({
      siteName: profile.headline ?? 'Unnamed Site',
      slug: profile.public_slug,
      matchPercent,
      opportunityScore,
      reasoning: reasoning.slice(0, 4),
      badges: Array.from(badges),
    })
  }

  // Sort by match percent descending
  results.sort((a, b) => b.matchPercent - a.matchPercent || b.opportunityScore - a.opportunityScore)

  return { results: results.slice(0, limit), total: results.length }
}
