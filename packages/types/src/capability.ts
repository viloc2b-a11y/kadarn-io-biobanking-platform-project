// ─── KAD-003 — Capability Entity ─────────────────────────────────────────
// Authority: Foundation Library, KEMS-001

import { z } from 'zod'

export const InstitutionCapabilityStatus = z.enum([
  'declared',
  'evidence_submitted',
  'under_review',
  'verified',
  'published',
  'deprecated',
])
export type InstitutionCapabilityStatus = z.infer<typeof InstitutionCapabilityStatus>

export const InstitutionCapabilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  capability_type_id: z.string().uuid().optional().nullable(),
  domain: z.string().optional().nullable(),
  organization_id: z.string().uuid(),
  primary_claim_id: z.string().uuid().optional().nullable(),
  status: InstitutionCapabilityStatus.default('declared'),
  confidence_score: z.number().min(0).max(1).optional().nullable(),
  first_declared_at: z.string().datetime({ offset: true }),
  last_verified_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export type InstitutionCapability = z.infer<typeof InstitutionCapabilitySchema>

export const CreateInstitutionCapabilitySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  capability_type_id: z.string().uuid().optional(),
  domain: z.string().optional(),
  organization_id: z.string().uuid(),
  primary_claim_id: z.string().uuid().optional(),
})

export type CreateInstitutionCapability = z.infer<typeof CreateInstitutionCapabilitySchema>

export const UpdateInstitutionCapabilitySchema = CreateInstitutionCapabilitySchema.partial().extend({
  status: InstitutionCapabilityStatus.optional(),
  confidence_score: z.number().min(0).max(1).optional(),
})

export type UpdateInstitutionCapability = z.infer<typeof UpdateInstitutionCapabilitySchema>
