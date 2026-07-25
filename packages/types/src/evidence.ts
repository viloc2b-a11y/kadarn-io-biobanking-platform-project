// ─── KAD-005 — Canonical Evidence & Provenance ──────────────────────────
// Authority: KADARN Product Constitution, Evidence Core
// Canonical Evidence model. Aligns evidence-core with @kadarn/types.

import { z } from 'zod'

export const EvidenceClassEnum = z.enum([
  'regulatory',
  'contract',
  'cv',
  'training',
  'publication',
  'financial',
  'policy',
  'certification',
  'photo',
  'video',
  'document',
  'other',
])
export type EvidenceClass = z.infer<typeof EvidenceClassEnum>

export const EvidenceStatus = z.enum([
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'expired',
])
export type EvidenceStatus = z.infer<typeof EvidenceStatus>

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  evidence_class: EvidenceClassEnum,
  content: z.string(),
  metadata: z.any().optional().nullable(),
  status: EvidenceStatus.default('draft'),
  confidence_score: z.number().min(0).max(1).optional().nullable(),
  source_url: z.string().url().optional().nullable(),
  uploaded_by: z.string().uuid().optional().nullable(),
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type Evidence = z.infer<typeof EvidenceSchema>

export const CreateEvidenceSchema = z.object({
  claim_id: z.string().uuid(),
  evidence_class: EvidenceClassEnum,
  content: z.string().min(1),
  metadata: z.any().optional(),
  source_url: z.string().url().optional(),
  expires_at: z.string().datetime({ offset: true }).optional(),
})
export type CreateEvidence = z.infer<typeof CreateEvidenceSchema>

export const UpdateEvidenceSchema = z.object({
  evidence_class: EvidenceClassEnum.optional(),
  content: z.string().min(1).optional(),
  metadata: z.any().optional(),
  status: EvidenceStatus.optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  source_url: z.string().url().optional(),
})
export type UpdateEvidence = z.infer<typeof UpdateEvidenceSchema>

// ─── Provenance ─────────────────────────────────────────────────────────

export const ProvenanceAction = z.enum([
  'created',
  'updated',
  'submitted',
  'reviewed',
  'approved',
  'rejected',
  'expired',
  'linked',
  'unlinked',
  'published',
])
export type ProvenanceAction = z.infer<typeof ProvenanceAction>

export const ProvenanceRecordSchema = z.object({
  id: z.string().uuid(),
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  action: ProvenanceAction,
  actor_id: z.string().uuid().optional().nullable(),
  previous_state: z.any().optional().nullable(),
  new_state: z.any().optional().nullable(),
  metadata: z.any().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})
export type ProvenanceRecord = z.infer<typeof ProvenanceRecordSchema>
