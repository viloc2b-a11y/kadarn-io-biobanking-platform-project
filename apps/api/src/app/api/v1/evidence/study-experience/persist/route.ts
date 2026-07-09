// ==========================================================================
// POST /api/v1/evidence/study-experience/persist
// ==========================================================================
// KTP-1.4 — Persists StudyExperienceDocument evidence as evidence_nodes.
// Accepts payloads from generateStudyEvidenceNodePayloads(), creates any
// missing claims, inserts evidence_nodes with idempotency, and returns
// evidenceNodeIds for linking back to StudyExperienceEvidenceLinks.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { z } from 'zod'
import { requireActiveOrg } from '@/lib/workspace'
import { DOCUMENT_HANDLING_MATRIX } from '@kadarn/types/document-handling'
import type { DocumentHandlingMode, EvidenceBasis, DisclosureStatus, RedactionStatus } from '@kadarn/types/document-handling'

// --------------------------------------------------------------------------
// Schema
// --------------------------------------------------------------------------

const evidenceNodePayloadSchema = z.object({
  proposedId: z.string(),
  claimId: z.string().min(1),
  evidenceClass: z.enum(['B', 'C']),
  content: z.string().min(1),
  source: z.string().min(1),
  sourceType: z.enum(['institution_upload', 'sponsor_correspondence', 'public_registry_anchor']),
  effectiveDate: z.string().nullable(),
  captureDate: z.string(),
  studyExperienceRecordId: z.string(),
  studyDocumentId: z.string(),
  supportedComponent: z.string(),
  provenanceSummary: z.string(),
  readyForPersistence: z.boolean(),
  warnings: z.array(z.string()).optional(),
  organizationId: z.string().nullable().optional(),
  assertedBy: z.string().nullable().optional(),
})

const persistSchema = z.object({
  studyExperienceRecordId: z.string().min(1),
  payloads: z.array(evidenceNodePayloadSchema).min(1),
})

// --------------------------------------------------------------------------
// Claim IDs that may need to be created
// --------------------------------------------------------------------------

const CLAIM_DEFAULTS: Record<string, { name: string; description: string; domain: string }> = {
  'study.participation': { name: 'Study Participation', description: 'Site participated in a clinical study', domain: 'clinical_trials' },
  'regulatory.irb_pathway_executed': { name: 'IRB Pathway Executed', description: 'Site obtained IRB approval for study participation', domain: 'regulatory' },
  'startup.activation_experience': { name: 'Site Activation Experience', description: 'Site completed startup and activation for clinical study', domain: 'clinical_trials' },
  'patient_recruitment.enrollment_history': { name: 'Enrollment History', description: 'Site enrolled patients in clinical study', domain: 'clinical_trials' },
  'biospecimen.study_handling_experience': { name: 'Biospecimen Handling Experience', description: 'Site handled biospecimens during clinical study', domain: 'biospecimen' },
  'study.existence': { name: 'Study Existence', description: 'Study exists with verifiable identifier', domain: 'clinical_trials' },
}

// --------------------------------------------------------------------------
// Idempotency key
// --------------------------------------------------------------------------

function generateKey(orgId: string, recordId: string, docId: string, component: string): string {
  return `study-evidence:${orgId}:${recordId}:${docId}:${component}`
}

// --------------------------------------------------------------------------
// Route Handler
// --------------------------------------------------------------------------

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const body = await request.json().catch(() => ({}))
    const parsed = persistSchema.safeParse(body)
    if (!parsed.success) throw new ApiError(400, 'Invalid request body', parsed.error.message)

    const { studyExperienceRecordId, payloads } = parsed.data
    const orgId = requireActiveOrg(user)

    // Filter to ready payloads only
    const ready = payloads.filter(p => p.readyForPersistence)
    if (ready.length === 0) {
      return Response.json({
        persisted: [], existing: [], skipped: payloads.length,
        warnings: ['No payloads marked readyForPersistence.'],
        errors: [],
      })
    }

    // 1. Ensure required claims exist
    const requiredClaimIds = [...new Set(ready.map(p => p.claimId).filter(Boolean))]
    const { data: existingClaims } = await supabase
      .from('claims')
      .select('id, claim_type_id')
      .in('claim_type_id', requiredClaimIds)

    const existingClaimIds = new Set((existingClaims ?? []).map((c: { claim_type_id: string }) => c.claim_type_id))
    const missingClaimIds = requiredClaimIds.filter(id => !existingClaimIds.has(id))

    // Create missing claims
    const createdClaims: string[] = []
    for (const claimId of missingClaimIds) {
      const defaults = CLAIM_DEFAULTS[claimId]
      if (defaults) {
        const { error: claimError } = await supabase.from('claims').insert({
          claim_type_id: claimId,
          name: defaults.name,
          description: defaults.description,
          organization_id: orgId,
          domain: defaults.domain,
          valid_evidence_classes: ['B', 'C'],
          required_evidence_classes: ['B'],
        })
        if (!claimError) createdClaims.push(claimId)
      }
    }

    // 2. Insert evidence nodes with idempotency
    const inserted: Array<{ evidenceNodeId: string; idempotencyKey: string }> = []
    const skipped: string[] = []
    const errors: string[] = []

    for (const p of ready) {
      const key = generateKey(orgId, studyExperienceRecordId, p.studyDocumentId, p.supportedComponent)

      // Check for existing node with same idempotency key
      const { data: existing } = await supabase
        .from('evidence_nodes')
        .select('id')
        .eq('idempotency_key', key)
        .maybeSingle()

      if (existing) {
        inserted.push({ evidenceNodeId: (existing as { id: string }).id, idempotencyKey: key })
        continue
      }

      const nodeDate = p.effectiveDate || p.captureDate.split('T')[0]
      const { data: newNode, error: insertError } = await supabase
        .from('evidence_nodes')
        .insert({
          claim_id: p.claimId,
          evidence_class: p.evidenceClass,
          content: p.content,
          source: p.source,
          node_date: nodeDate,
          status: 'active',
          weight: p.evidenceClass === 'C' ? 0.7 : 0.5,
          provenance: {
            asserted_by: p.assertedBy || user.id,
            source_actor: orgId,
            source_type: p.sourceType,
            verification_actor: null,
            verification_method: 'upload_classification',
            capture_date: p.captureDate,
            effective_date: p.effectiveDate,
            transformation_history: ['study_experience_document_created', 'payload_generated', 'evidence_node_persisted'],
            summary: p.provenanceSummary,
            // KTP-1.5: Document handling metadata
            handling_mode: p.handlingMode,
            evidence_basis: p.evidenceBasis || DOCUMENT_HANDLING_MATRIX[p.handlingMode || 'stored_evidence']?.evidenceBasis,
            disclosure_status: p.disclosureStatus || DOCUMENT_HANDLING_MATRIX[p.handlingMode || 'stored_evidence']?.defaultDisclosureStatus,
            redaction_status: p.redactionStatus || 'unknown',
            retained: p.handlingMode ? ['stored_evidence', 'feasibility_folder', 'private_restricted'].includes(p.handlingMode) : false,
          },
          visibility: {
            owning_organization_id: orgId,
            scope: 'organization',
            authorized_sponsor_ids: [],
          },
          idempotency_key: key,
        })
        .select('id')
        .single()

      if (insertError) {
        errors.push(`Failed to insert evidence node for ${p.studyDocumentId}/${p.supportedComponent}: ${insertError.message}`)
      } else if (newNode) {
        inserted.push({ evidenceNodeId: (newNode as { id: string }).id, idempotencyKey: key })
      }
    }

    return Response.json({
      persisted: inserted,
      existing: [],
      skipped: payloads.length - ready.length + skipped.length,
      createdClaims,
      missingClaims: missingClaimIds.filter(id => !createdClaims.includes(id)),
      warnings: payloads.flatMap(p => p.warnings || []),
      errors,
    }, { status: 200 })
  } catch (err) {
    return handleApiError(err)
  }
})
