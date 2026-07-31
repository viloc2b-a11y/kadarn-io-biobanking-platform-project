// ==========================================================================
// KEMS-001 Aligned Types — Progressive Interview, Evidence Vault, RAG
// Authority: CANONICAL_MVP_SCOPE §A.4, KEMS-001 §1-§4
// Reference: realvibe-site-copilot models
// NOTE: Claim schema in claim.ts is the canonical LOOP-3 entity.
//       This file adds KEMS-001 progressive interview types for the new wizard.
// ==========================================================================

import { z } from 'zod'

// ─── Evidence Source ────────────────────────────────────────────────────

export const EvidenceSourceTypeEnum = z.enum([
  'document_upload',
  'external_registry',
  'api_ingestion',
  'manual_entry',
])
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeEnum>

export const ProcessingStatusEnum = z.enum([
  'pending', 'extracting', 'chunking', 'embedding', 'completed', 'failed',
])
export type ProcessingStatus = z.infer<typeof ProcessingStatusEnum>

export const KemsEvidenceSourceSchema = z.object({
  id: z.string().uuid(),
  institution_id: z.string().uuid(),
  source_type: EvidenceSourceTypeEnum,
  label: z.string(),
  description: z.string().nullable().optional(),
  file_path: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
  file_type: z.string().nullable().optional(),
  file_size: z.number().nullable().optional(),
  file_hash: z.string().nullable().optional(),
  page_count: z.number().default(1),
  text_content: z.string().nullable().optional(),
  processing_status: ProcessingStatusEnum.default('pending'),
  created_at: z.string(),
  updated_at: z.string(),
})
export type KemsEvidenceSource = z.infer<typeof KemsEvidenceSourceSchema>

// ─── Document Chunk (RAG) ────────────────────────────────────────────────

export const DocumentChunkSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  chunk_index: z.number(),
  chunk_text: z.string(),
  token_count: z.number().nullable().optional(),
  similarity: z.number().optional(),
  created_at: z.string(),
})
export type DocumentChunk = z.infer<typeof DocumentChunkSchema>

// ─── KEMS Confidence Level ───────────────────────────────────────────────

export const KemsConfidenceLevel = z.enum([
  'declared',       // Site said "yes" but no evidence uploaded
  'documented',     // Evidence uploaded but not externally verified
  'verified',       // Externally confirmed
  'expired',        // Cert expired
  'contradicted',   // Counter-evidence exists
  'unknown',        // N/A
])
export type KemsConfidenceLevel = z.infer<typeof KemsConfidenceLevel>

// ─── KEMS Claim (Progressive Interview version) ─────────────────────────

export const AnswerTypeEnum = z.enum(['text', 'boolean', 'numeric', 'select', 'multi_select', 'date'])
export type AnswerType = z.infer<typeof AnswerTypeEnum>

export const KemsClaimCategory = z.enum(['identity', 'experience', 'infrastructure', 'quality', 'other'])
export type KemsClaimCategory = z.infer<typeof KemsClaimCategory>

export const KemsClaimSchema = z.object({
  id: z.string().uuid(),
  institution_id: z.string().uuid(),
  claim_hash: z.string(),
  question_text: z.string(),
  answer_value: z.string(),
  answer_type: AnswerTypeEnum.default('text'),
  category: KemsClaimCategory,
  confidence_level: KemsConfidenceLevel.default('declared'),
  confidence_score: z.number().min(0).max(1).default(0),
  evidence_count: z.number().default(0),
  has_unresolved_counter_evidence: z.boolean().default(false),
  is_counter_evidence: z.boolean().default(false),
  response_to_claim_id: z.string().uuid().nullable().optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  superseded_by: z.string().uuid().nullable().optional(),
  version: z.number().default(1),
  created_at: z.string(),
  updated_at: z.string(),
})
export type KemsClaim = z.infer<typeof KemsClaimSchema>

// ─── Claim Evidence Link ─────────────────────────────────────────────────

export const EvidenceRelationshipTypeEnum = z.enum([
  'supports', 'contradicts', 'corroborates', 'qualifies', 'supersedes',
])
export type EvidenceRelationshipType = z.infer<typeof EvidenceRelationshipTypeEnum>

export const EvidenceClassKemsEnum = z.enum(['A', 'B', 'C', 'D', 'E', 'F'])
export type EvidenceClassKems = z.infer<typeof EvidenceClassKemsEnum>

export const KemsClaimEvidenceLinkSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  source_id: z.string().uuid().nullable().optional(),
  chunk_id: z.string().uuid().nullable().optional(),
  relationship_type: EvidenceRelationshipTypeEnum,
  weight: z.number().min(-1).max(1).default(0.5),
  evidence_class: EvidenceClassKemsEnum.nullable().optional(),
  evidence_page: z.number().nullable().optional(),
  evidence_span: z.object({ start: z.number(), end: z.number() }).nullable().optional(),
  reviewer_notes: z.string().nullable().optional(),
  created_at: z.string(),
})
export type KemsClaimEvidenceLink = z.infer<typeof KemsClaimEvidenceLinkSchema>

// ─── Confidence State (KEMS-001 §2 Component D) ──────────────────────────

export interface ConfidenceContribution {
  nodeId: string
  evidenceClass: string
  weight: number
  description: string
}

export interface ConfidenceState {
  claimId: string
  value: number
  level: 'high' | 'moderate' | 'low' | 'insufficient'
  lastUpdated: string
  explanation: string
  contributions: ConfidenceContribution[]
  hasUnresolvedCounterEvidence: boolean
}

// ─── Questionnaire Template ──────────────────────────────────────────────

export interface QuestionnaireField {
  id: string
  type: 'text' | 'textarea' | 'boolean' | 'select' | 'multi_select' | 'numeric' | 'date' | 'file'
  label: string
  required?: boolean
  options?: string[]
  placeholder?: string
  activates_evidence?: boolean
  help_text?: string
}

export interface QuestionnaireSection {
  id: string
  title: string
  description?: string
  fields: QuestionnaireField[]
}

export interface QuestionnaireTemplate {
  id: string
  template_name: string
  level: 1 | 2 | 3 | 4
  module_key: string
  schema_definition: { sections: QuestionnaireSection[] }
  activation_condition?: { depends_on: string; expected_value: unknown }
  is_required: boolean
  sort_order: number
}

// ─── API Types ───────────────────────────────────────────────────────────

export interface DocumentUploadResponse {
  source_id: string
  file_name: string
  file_size: number
  page_count: number
  text_length: number
  processing_status: string
}

export interface VectorSearchRequest {
  query: string
  institution_id: string
  limit?: number
  threshold?: number
}

export interface VectorSearchResult {
  chunk_id: string
  source_id: string
  file_name: string
  chunk_text: string
  chunk_index: number
  similarity: number
  evidence_page?: number
}

export interface ClaimCreationRequest {
  institution_id: string
  question_text: string
  answer_value: string
  answer_type?: AnswerType
  category: KemsClaimCategory
  evidence_source_id?: string
  evidence_chunk_id?: string
}

// ─── Evidence Classes Reference (KEMS-001 §3) ────────────────────────────

export const EVIDENCE_CLASSES = {
  A: { name: 'Public Independent Evidence', decay_months: 60, default_weight: 0.80 },
  B: { name: 'Institutional Documentary Evidence', decay_months: 24, default_weight: 0.50 },
  C: { name: 'Operational Evidence', decay_months: 12, default_weight: 0.70 },
  D: { name: 'Cross-Source Corroboration', decay_months: null, default_weight: 0.00 },
  E: { name: 'Temporal Continuity Evidence', decay_months: null, default_weight: 0.00 },
  F: { name: 'External Confirmation', decay_months: 36, default_weight: 1.00 },
} as const

// ─── Confidence Level Labels ─────────────────────────────────────────────

export const CONFIDENCE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  declared:     { label: 'Declared',      color: 'text-amber-600 bg-amber-50',     icon: '📝' },
  documented:   { label: 'Documented',    color: 'text-blue-600 bg-blue-50',       icon: '📄' },
  verified:     { label: 'Verified',      color: 'text-green-600 bg-green-50',     icon: '✅' },
  expired:      { label: 'Expired',       color: 'text-red-600 bg-red-50',         icon: '⏰' },
  contradicted: { label: 'Contradicted',  color: 'text-orange-600 bg-orange-50',   icon: '⚠️' },
  unknown:      { label: 'N/A',           color: 'text-gray-400 bg-gray-50',       icon: '—' },
}
