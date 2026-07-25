// ─── KADARN v2 — Evidence Source Intelligence Types ────────────────────
// Authority: Architecture Constitution v2.0, Ratified Minimal Schema
// Sprint 1 — Block A

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

// ─── SourceRecord ──────────────────────────────────────────────────────

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
