// ─── KADARN v2 — Evidence Source Intelligence Types ────────────────────
// Authority: Architecture Constitution v2.0, Ratified Minimal Schema
// Sprint 1 — Block A
// KAD-LOOP-002: Added supersession fields + UpdateSourceRecordSchema.

import { z } from 'zod'

// ─── Enums ──────────────────────────────────────────────────────────────

export const SourceType = z.enum([
  'registry',          // Public registry (ClinicalTrials.gov, NPPES)
  'system',            // Operational system (CTMS, EDC, EMR)
  'document',          // Document collection (CR, CV, license)
  'declaration',       // Human declaration
  'device',           // Device or sensor
  'api_endpoint',     // External API
  'export',           // Data export from another system
  'other',
])
export type SourceType = z.infer<typeof SourceType>

export const ProducerType = z.enum([
  'regulatory_agency',
  'institution',
  'system',
  'person',
  'device',
  'external_service',
])
export type ProducerType = z.infer<typeof ProducerType>

export const AuthorityLevel = z.enum([
  'regulatory',              // T1 — Public independent evidence
  'authoritative_registry',  // T1 — Official registry
  'transactional_system',    // T2 — Execution system
  'institutional_record',    // T3 — Institutional documentary
  'human_attestation',       // T4 — Human declaration
  'inferred_or_generated',   // AI/derived
])
export type AuthorityLevel = z.infer<typeof AuthorityLevel>

export const AcquisitionMethod = z.enum([
  'api_query',       // Real-time API call
  'web_scrape',      // Web scraping
  'file_upload',     // Manual upload
  'system_push',     // System sends data
  'manual_entry',    // Human key-in
  'batch_import',    // Bulk import
  'periodic_export',  // Scheduled export
])
export type AcquisitionMethod = z.infer<typeof AcquisitionMethod>

export const FreshnessPolicy = z.enum([
  'no_expiration',
  'fixed_duration',
  'source_defined',
  'event_driven',
  'manual_review',
])
export type FreshnessPolicy = z.infer<typeof FreshnessPolicy>

export const AcquisitionStatus = z.enum([
  'pending',
  'acquired',
  'verified',
  'invalidated',
  'superseded',
])
export type AcquisitionStatus = z.infer<typeof AcquisitionStatus>

// ─── FreshnessPolicyConfig ──────────────────────────────────────────────

export const FreshnessPolicyConfigSchema = z.object({
  policy: FreshnessPolicy,
  max_age_days: z.number().int().positive().optional(),
  review_interval_days: z.number().int().positive().optional(),
  source_dependent: z.boolean().optional(),
}).optional().nullable()
export type FreshnessPolicyConfig = z.infer<typeof FreshnessPolicyConfigSchema>

// ─── EvidenceSource ─────────────────────────────────────────────────────

export const EvidenceSourceSchema = z.object({
  id: z.string().uuid(),
  institution_id: z.string().uuid().optional().nullable(),
  source_type: SourceType,
  canonical_name: z.string().min(1).max(255),
  producer_type: ProducerType,
  producer_name: z.string().min(1).max(255),
  producer_id: z.string().uuid().optional().nullable(),
  authority_level: AuthorityLevel,
  acquisition_method: AcquisitionMethod.default('manual_entry'),
  freshness_policy: FreshnessPolicyConfigSchema,
  verification_policy: z.string().optional().nullable(),
  base_uri: z.string().url().optional().nullable(),
  external_system_identifier: z.string().optional().nullable(),
  active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>

export const CreateEvidenceSourceSchema = z.object({
  institution_id: z.string().uuid().optional(),
  source_type: SourceType,
  canonical_name: z.string().min(1).max(255),
  producer_type: ProducerType,
  producer_name: z.string().min(1).max(255),
  producer_id: z.string().uuid().optional(),
  authority_level: AuthorityLevel,
  acquisition_method: AcquisitionMethod.default('manual_entry'),
  freshness_policy: FreshnessPolicyConfigSchema,
  verification_policy: z.string().optional(),
  base_uri: z.string().url().optional(),
  external_system_identifier: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type CreateEvidenceSource = z.infer<typeof CreateEvidenceSourceSchema>

export const UpdateEvidenceSourceSchema = CreateEvidenceSourceSchema.partial().extend({
  active: z.boolean().optional(),
})
export type UpdateEvidenceSource = z.infer<typeof UpdateEvidenceSourceSchema>

// ─── SourceRecord (KAD-LOOP-002: added supersession fields) ─────────────

export const SourceRecordSchema = z.object({
  id: z.string().uuid(),
  evidence_source_id: z.string().uuid(),
  institution_id: z.string().uuid().optional().nullable(),
  external_record_id: z.string().optional().nullable(),
  record_type: z.string().optional().nullable(),
  source_version: z.string().optional().nullable(),
  acquired_at: z.string().datetime({ offset: true }),
  observed_at: z.string().datetime({ offset: true }).optional().nullable(),
  valid_from: z.string().datetime({ offset: true }).optional().nullable(),
  valid_until: z.string().datetime({ offset: true }).optional().nullable(),
  content_hash: z.string().optional().nullable(),
  locator_uri: z.string().optional().nullable(),
  acquisition_status: AcquisitionStatus.default('acquired'),
  raw_metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  // Supersession fields (added by migration 076, exposed in types by LOOP-002)
  superseded_by: z.string().uuid().optional().nullable(),
  supersession_reason: z.string().optional().nullable(),
  invalidation_status: z.enum(['active', 'superseded', 'invalidated']).default('active'),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type SourceRecord = z.infer<typeof SourceRecordSchema>

export const CreateSourceRecordSchema = z.object({
  evidence_source_id: z.string().uuid(),
  institution_id: z.string().uuid().optional(),
  external_record_id: z.string().optional(),
  record_type: z.string().optional(),
  source_version: z.string().optional(),
  acquired_at: z.string().datetime({ offset: true }).default(() => new Date().toISOString()),
  observed_at: z.string().datetime({ offset: true }).optional(),
  valid_from: z.string().datetime({ offset: true }).optional(),
  valid_until: z.string().datetime({ offset: true }).optional(),
  content_hash: z.string().optional(),
  locator_uri: z.string().optional(),
  raw_metadata: z.record(z.string(), z.unknown()).optional(),
})
export type CreateSourceRecord = z.infer<typeof CreateSourceRecordSchema>

export const UpdateSourceRecordSchema = z.object({
  acquisition_status: AcquisitionStatus.optional(),
  invalidation_status: z.enum(['active', 'superseded', 'invalidated']).optional(),
  superseded_by: z.string().uuid().optional(),
  supersession_reason: z.string().optional(),
})
export type UpdateSourceRecord = z.infer<typeof UpdateSourceRecordSchema>

// ─── EvidenceSource v2 — extended with producer_id (Block 01-S) ────────────

export const UpdateEvidenceSourceV2Schema = CreateEvidenceSourceSchema.partial().extend({
  active: z.boolean().optional(),
  producer_id: z.string().uuid().optional().nullable(),
})
export type UpdateEvidenceSourceV2 = z.infer<typeof UpdateEvidenceSourceV2Schema>

// ─── Run Status ────────────────────────────────────────────────────────────

export const RunStatus = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
])
export type RunStatus = z.infer<typeof RunStatus>

// ─── Extractor Type ────────────────────────────────────────────────────────

export const ExtractorType = z.enum([
  'markitdown',
  'ocr',
  'api_extract',
  'manual_extract',
  'llm_extract',
  'other',
])
export type ExtractorType = z.infer<typeof ExtractorType>

// ─── EvidenceProducer ──────────────────────────────────────────────────────

export const EvidenceProducerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  producer_type: ProducerType,
  contact: z.string().optional().nullable(),
  institution_id: z.string().uuid().optional().nullable(),
  active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type EvidenceProducer = z.infer<typeof EvidenceProducerSchema>

export const CreateEvidenceProducerSchema = z.object({
  name: z.string().min(1).max(255),
  producer_type: ProducerType,
  contact: z.string().optional(),
  institution_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type CreateEvidenceProducer = z.infer<typeof CreateEvidenceProducerSchema>

export const UpdateEvidenceProducerSchema = CreateEvidenceProducerSchema.partial().extend({
  active: z.boolean().optional(),
})
export type UpdateEvidenceProducer = z.infer<typeof UpdateEvidenceProducerSchema>

// ─── AcquisitionRun ────────────────────────────────────────────────────────

export const AcquisitionRunSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  institution_id: z.string().uuid().optional().nullable(),
  started_at: z.string().datetime({ offset: true }).optional().nullable(),
  completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  status: RunStatus.default('pending'),
  record_count: z.number().int().nonnegative().default(0),
  error_message: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type AcquisitionRun = z.infer<typeof AcquisitionRunSchema>

export const CreateAcquisitionRunSchema = z.object({
  source_id: z.string().uuid(),
  institution_id: z.string().uuid().optional(),
  started_at: z.string().datetime({ offset: true }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type CreateAcquisitionRun = z.infer<typeof CreateAcquisitionRunSchema>

export const UpdateAcquisitionRunSchema = z.object({
  status: RunStatus.optional(),
  completed_at: z.string().datetime({ offset: true }).optional(),
  record_count: z.number().int().nonnegative().optional(),
  error_message: z.string().optional(),
})
export type UpdateAcquisitionRun = z.infer<typeof UpdateAcquisitionRunSchema>

// ─── ExtractionRun ─────────────────────────────────────────────────────────

export const ExtractionRunSchema = z.object({
  id: z.string().uuid(),
  source_record_id: z.string().uuid(),
  institution_id: z.string().uuid().optional().nullable(),
  started_at: z.string().datetime({ offset: true }).optional().nullable(),
  completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  extractor_type: ExtractorType.default('manual_extract'),
  status: RunStatus.default('pending'),
  extraction_count: z.number().int().nonnegative().default(0),
  error_message: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type ExtractionRun = z.infer<typeof ExtractionRunSchema>

export const CreateExtractionRunSchema = z.object({
  source_record_id: z.string().uuid(),
  institution_id: z.string().uuid().optional(),
  extractor_type: ExtractorType.default('manual_extract'),
  started_at: z.string().datetime({ offset: true }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type CreateExtractionRun = z.infer<typeof CreateExtractionRunSchema>

export const UpdateExtractionRunSchema = z.object({
  status: RunStatus.optional(),
  completed_at: z.string().datetime({ offset: true }).optional(),
  extraction_count: z.number().int().nonnegative().optional(),
  error_message: z.string().optional(),
})
export type UpdateExtractionRun = z.infer<typeof UpdateExtractionRunSchema>
