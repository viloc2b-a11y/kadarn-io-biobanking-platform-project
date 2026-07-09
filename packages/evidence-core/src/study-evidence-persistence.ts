// ==========================================================================
// KTP-1.4 — Study Experience Evidence Persistence Service
// ==========================================================================
// Prepares and (when DB is available) persists StudyEvidenceNodePayloads
// as real evidence_nodes in the database. Handles idempotency, claim
// creation prerequisites, and provenance.
//
// Current state: generates DB-ready INSERT payloads with idempotency keys
// and provenance. Actual DB writes require:
//   1. Running Supabase (Docker)
//   2. Migration 045 executed (evidence_nodes table exists)
//   3. Claims created for each claim family (claim_id FK requirement)
// ==========================================================================

// Self-contained input types — mirrors study-experience-record without cross-package dependency.
// In production, these types should live in a shared @kadarn/types package.

export interface StudyEvidenceNodePayloadInput {
  proposedId: string
  claimId: string
  evidenceClass: 'B' | 'C'
  content: string
  source: string
  sourceType: 'institution_upload' | 'sponsor_correspondence' | 'public_registry_anchor'
  effectiveDate: string | null
  captureDate: string
  studyExperienceRecordId: string
  studyDocumentId: string
  supportedComponent: string
  organizationId: string | null
  assertedBy: string | null
  provenanceSummary: string
  readyForPersistence: boolean
  warnings: string[]
}

export interface StudyExperienceEvidenceLinkInput {
  studyExperienceRecordId: string
  studyDocumentId: string
  uploadedDocLabel: string | null
  evidenceNodeId: string | null
  supportedComponent: string
  supportLevel: string
  evidenceBasis: string
  reviewStatus: string
  limitations: string[]
}

export interface StudyExperienceRecordInput {
  id: string
  studyTitle: string
  protocolNumber: string
  clinicaltrialsGovNct: string | null
  documents: { id: string; documentType: string; isUploaded: boolean }[]
}

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface EvidenceNodeInsertPayload {
  /** UUID — generated client-side or server-side */
  id: string
  /** FK to claims table — must exist before insert */
  claim_id: string
  /** Evidence class A-F */
  evidence_class: string
  /** Human-readable content */
  content: string
  /** Source description */
  source: string
  /** Date evidence was produced */
  node_date: string
  /** Always 'active' on creation */
  status: string
  /** Weight (0-1) — conservative: 0.5 for Class B */
  weight: number
  /** Provenance JSONB */
  provenance: Record<string, unknown>
  /** Visibility JSONB */
  visibility: Record<string, unknown>
  /** Idempotency key stored in metadata */
  _idempotency_key: string
  /** Study metadata */
  _study_metadata: {
    study_experience_record_id: string
    study_document_id: string
    supported_component: string
    document_type: string
    source_type: string
    warnings: string[]
  }
  /** KTP-1.5: Document handling metadata */
  _handling_metadata?: {
    handling_mode: string
    evidence_basis: string
    disclosure_status: string
    redaction_status: string
    retained: boolean
  }
}

export interface PersistEvidenceNodesResult {
  /** Successfully prepared payloads (ready for DB insert) */
  prepared: EvidenceNodeInsertPayload[]
  /** Payloads skipped (not ready for persistence) */
  skipped: StudyEvidenceNodePayloadInput[]
  /** Idempotency key → payload mapping */
  idempotencyKeys: Map<string, EvidenceNodeInsertPayload>
  /** Warnings about the persistence attempt */
  warnings: string[]
  /** Prerequisites not yet met */
  missingPrerequisites: string[]
}

// --------------------------------------------------------------------------
// Claim ID → evidence_class weight mapping (conservative)
// --------------------------------------------------------------------------

const EVIDENCE_CLASS_WEIGHTS: Record<string, number> = {
  A: 0.8, B: 0.5, C: 0.7, D: 0.0, E: 0.0, F: 1.0,
}

// --------------------------------------------------------------------------
// Idempotency key generation
// --------------------------------------------------------------------------

/**
 * Generate a deterministic idempotency key from payload components.
 * Same study document + same component → same key → no duplicates.
 */
export function generateIdempotencyKey(
  organizationId: string,
  studyRecordId: string,
  studyDocumentId: string,
  supportedComponent: string,
): string {
  return `study-evidence:${organizationId}:${studyRecordId}:${studyDocumentId}:${supportedComponent}`
}

// --------------------------------------------------------------------------
// Persistence service
// --------------------------------------------------------------------------

/**
 * Prepare EvidenceNode INSERT payloads from StudyEvidenceNodePayloads.
 *
 * Does NOT write to database. Returns DB-ready payloads that can be
 * inserted into the evidence_nodes table via Supabase client.
 *
 * Prerequisites for actual DB insert:
 *   1. claims must exist for each claim_id referenced
 *   2. evidence_nodes table must exist (migration 045)
 *   3. organization_id must reference a valid organization
 */
export function prepareEvidenceNodeInserts(
  organizationId: string,
  recordId: string,
  payloads: StudyEvidenceNodePayloadInput[],
  visibilityScope: string = 'organization',
): PersistEvidenceNodesResult {
  const prepared: EvidenceNodeInsertPayload[] = []
  const skipped: StudyEvidenceNodePayloadInput[] = []
  const idempotencyKeys = new Map<string, EvidenceNodeInsertPayload>()
  const warnings: string[] = []
  const missingPrerequisites: string[] = []

  // Check if payloads reference claims that need to exist
  if (payloads.length > 0) {
    missingPrerequisites.push(
      'Claims must exist for: ' +
      [...new Set(payloads.map(p => p.claimId))].filter(Boolean).join(', ') +
      '. Use createClaim() from @kadarn/evidence-core then insert via Supabase.'
    )
  }

  for (const payload of payloads) {
    if (!payload.readyForPersistence) {
      skipped.push(payload)
      continue
    }

    if (!payload.claimId) {
      skipped.push(payload)
      warnings.push(`Payload ${payload.proposedId} has no claimId — cannot persist without claim linkage.`)
      continue
    }

    const nodeDate = payload.effectiveDate || payload.captureDate.split('T')[0]
    const idempotencyKey = generateIdempotencyKey(
      organizationId, recordId, payload.studyDocumentId, payload.supportedComponent,
    )

    // Check for duplicates within this batch
    if (idempotencyKeys.has(idempotencyKey)) {
      warnings.push(`Duplicate payload skipped for key: ${idempotencyKey}`)
      continue
    }

    const insertPayload: EvidenceNodeInsertPayload = {
      id: payload.proposedId,
      claim_id: payload.claimId,
      evidence_class: payload.evidenceClass,
      content: payload.content,
      source: payload.source,
      node_date: nodeDate,
      status: 'active',
      weight: EVIDENCE_CLASS_WEIGHTS[payload.evidenceClass] || 0.5,
      provenance: {
        asserted_by: payload.assertedBy || 'system',
        source_actor: organizationId,
        source_type: payload.sourceType,
        verification_actor: null,
        verification_method: 'upload_classification',
        capture_date: payload.captureDate,
        effective_date: payload.effectiveDate,
        transformation_history: [
          'study_experience_document_created',
          'payload_generated',
          'evidence_node_prepared',
        ],
        summary: payload.provenanceSummary,
      },
      visibility: {
        owning_organization_id: organizationId,
        scope: visibilityScope,
        authorized_sponsor_ids: [],
      },
      _idempotency_key: idempotencyKey,
      _study_metadata: {
        study_experience_record_id: recordId,
        study_document_id: payload.studyDocumentId,
        supported_component: payload.supportedComponent,
        document_type: payload.sourceType,
        source_type: payload.sourceType,
        warnings: payload.warnings,
      },
    }

    prepared.push(insertPayload)
    idempotencyKeys.set(idempotencyKey, insertPayload)
  }

  if (prepared.length === 0 && payloads.length > 0) {
    warnings.push('All payloads were skipped. Check readyForPersistence and claimId fields.')
  }

  return { prepared, skipped, idempotencyKeys, warnings, missingPrerequisites }
}

/**
 * Update evidence links with persisted evidence node IDs.
 * Called after successful DB insert to link StudyExperienceEvidenceLink
 * entries with their evidence_node IDs.
 */
export function linkPersistedEvidenceNodes(
  links: StudyExperienceEvidenceLinkInput[],
  persistedNodeIds: Map<string, string>, // idempotencyKey → evidenceNodeId
  organizationId: string,
  recordId: string,
): StudyExperienceEvidenceLinkInput[] {
  return links.map(link => {
    const key = generateIdempotencyKey(
      organizationId, recordId, link.studyDocumentId, link.supportedComponent,
    )
    const nodeId = persistedNodeIds.get(key)
    if (nodeId) {
      return { ...link, evidenceNodeId: nodeId, reviewStatus: 'under_review' as const }
    }
    return link
  })
}

// --------------------------------------------------------------------------
// DB insert helper (pseudo-code — requires Supabase client at runtime)
// --------------------------------------------------------------------------

/**
 * Insert prepared evidence nodes into the database.
 *
 * Requires Supabase client. Use in API route handler:
 *
 *   const supabase = await createRouteClient()
 *   const result = prepareEvidenceNodeInserts(orgId, record)
 *   const { data, error } = await supabase
 *     .from('evidence_nodes')
 *     .insert(result.prepared.map(p => ({
 *       id: p.id,
 *       claim_id: p.claim_id,
 *       evidence_class: p.evidence_class,
 *       content: p.content,
 *       source: p.source,
 *       node_date: p.node_date,
 *       status: p.status,
 *       weight: p.weight,
 *       provenance: p.provenance,
 *       visibility: p.visibility,
 *     })))
 *     .select('id')
 *
 * NOTE: claim_id must reference existing claims. Create claims first via:
 *   supabase.from('claims').insert({...})
 */
export function getEvidenceNodeInsertStatements(
  prepared: EvidenceNodeInsertPayload[],
): string[] {
  return prepared.map(p => {
    // Escape single quotes in text fields
    const esc = (s: string) => s.replace(/'/g, "''")
    return `INSERT INTO evidence_nodes (id, claim_id, evidence_class, content, source, node_date, status, weight, provenance, visibility)
VALUES (
  '${p.id}',
  '${esc(p.claim_id)}',
  '${p.evidence_class}',
  '${esc(p.content)}',
  '${esc(p.source)}',
  '${p.node_date}',
  'active',
  ${p.weight},
  '${esc(JSON.stringify(p.provenance))}'::jsonb,
  '${esc(JSON.stringify(p.visibility))}'::jsonb
);`
  })
}
