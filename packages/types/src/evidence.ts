// ─── KAD-005 — Canonical Evidence & Provenance ──────────────────────────
// Authority: KADARN Product Constitution, Evidence Core
// Canonical Evidence model. Aligns evidence-core with @kadarn/types.
// KAD-LOOP-002: Reconciled EvidenceClassEnum to DB canonical 6-value model.

import { z } from 'zod'

// ─── Evidence Class (DB canonical — frozen by migration 045) ───────────
// A = Public Independent Evidence (decay 60mo, weight 0.80)
// B = Institutional Documentary Evidence (decay 24mo, weight 0.50)
// C = Operational Evidence (decay 12mo, weight 0.70)
// D = Cross-Source Corroboration (no decay, weight 0.00)
// E = Temporal Continuity Evidence (no decay, weight 0.00)
// F = External Confirmation (decay 36mo, weight 1.00)

export const EvidenceClassEnum = z.enum(['A', 'B', 'C', 'D', 'E', 'F'])
export type EvidenceClass = z.infer<typeof EvidenceClassEnum>

export const EvidenceClassRefSchema = z.object({
  id: EvidenceClassEnum,
  name: z.string(),
  description: z.string(),
  decay_months: z.number().int().nullable(),
  default_weight: z.number().min(0).max(1),
})
export type EvidenceClassRef = z.infer<typeof EvidenceClassRefSchema>

// ─── Evidence Lifecycle (KAD-LOOP-002, migration 080) ──────────────────
// 10-state canonical lifecycle per Loop 2 spec.
// Coexists with legacy evidence_node_status (045: active/superseded/disputed/resolved).

export const EvidenceLifecycleStatus = z.enum([
  'draft',
  'generated',
  'imported',
  'verified',
  'reviewed',
  'accepted',
  'rejected',
  'superseded',
  'archived',
  'invalidated',
])
export type EvidenceLifecycleStatus = z.infer<typeof EvidenceLifecycleStatus>

// Legacy status (frozen by migration 045 — kept for backward compat)
export const EvidenceNodeStatus = z.enum([
  'active',
  'superseded',
  'disputed',
  'resolved',
])
export type EvidenceNodeStatus = z.infer<typeof EvidenceNodeStatus>

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  evidence_class: EvidenceClassEnum,
  content: z.string(),
  metadata: z.any().optional().nullable(),
  status: EvidenceNodeStatus.default('active'),
  lifecycle_status: EvidenceLifecycleStatus.default('draft'),
  confidence_score: z.number().min(0).max(1).optional().nullable(),
  source_url: z.string().url().optional().nullable(),
  uploaded_by: z.string().uuid().optional().nullable(),
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  // Generation provenance (077 forward-port)
  generation_rule_id: z.string().uuid().optional().nullable(),
  input_hash: z.string().optional().nullable(),
  generator: z.string().optional().nullable(),
  generated_at: z.string().datetime({ offset: true }).optional().nullable(),
  source_record_id: z.string().uuid().optional().nullable(),
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
  lifecycle_status: EvidenceLifecycleStatus.default('draft'),
})
export type CreateEvidence = z.infer<typeof CreateEvidenceSchema>

export const UpdateEvidenceSchema = z.object({
  evidence_class: EvidenceClassEnum.optional(),
  content: z.string().min(1).optional(),
  metadata: z.any().optional(),
  lifecycle_status: EvidenceLifecycleStatus.optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  source_url: z.string().url().optional(),
})
export type UpdateEvidence = z.infer<typeof UpdateEvidenceSchema>

// ─── Generation Pipeline Schemas (KAD-LOOP-002) ────────────────────────

export const GenerateEvidenceSchema = z.object({
  source_record_id: z.string().uuid(),
  rule_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
})
export type GenerateEvidenceInput = z.infer<typeof GenerateEvidenceSchema>

export const ReplayResultSchema = z.object({
  evidence_id: z.string().uuid(),
  input_hash_matches: z.boolean(),
  output_matches: z.boolean(),
  replayed_content: z.string(),
  original_content: z.string(),
  replayed_at: z.string().datetime({ offset: true }),
})
export type ReplayResult = z.infer<typeof ReplayResultSchema>

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

// ─── Generation Provenance (KAD-LOOP-CANONICALIZATION-001, Package C) ───
export const GenerationProvenanceSchema = z.object({
  generation_rule_id: z.string().uuid().optional().nullable(),
  input_hash: z.string().optional().nullable(),
  generator: z.string().optional().nullable(),
  generated_at: z.string().datetime({ offset: true }).optional().nullable(),
  source_record_id: z.string().uuid().optional().nullable(),
})
export type GenerationProvenance = z.infer<typeof GenerationProvenanceSchema>

// ─── Lineage (KAD-LOOP-002, Phase 5) ────────────────────────────────────

export const LineageChainSchema = z.object({
  event: z.any().optional().nullable(),
  source_record: z.any().optional().nullable(),
  generation_rule: z.any().optional().nullable(),
  evidence: z.any().optional().nullable(),
  claim: z.any().optional().nullable(),
  review: z.any().optional().nullable(),
  passport: z.any().optional().nullable(),
})
export type LineageChain = z.infer<typeof LineageChainSchema>
