// ─── KAD-009 — Passport ───────────────────────────────────────────────────
// Authority: KADARN Product Constitution

import { z } from 'zod'

export const AccessLevel = z.enum(['view', 'download', 'full'])
export type AccessLevel = z.infer<typeof AccessLevel>

export const PassportStatus = z.enum(['draft', 'published', 'archived'])
export type PassportStatus = z.infer<typeof PassportStatus>

export const PassportEntrySchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  claim_id: z.string().uuid(),
  title: z.string().optional().nullable(),
  version: z.number().int().min(1).default(1),
  status: PassportStatus.default('draft'),
  publication_date: z.string().datetime({ offset: true }).optional().nullable(),
  metadata: z.any().optional().nullable(),
  published_at: z.string().datetime({ offset: true }).optional().nullable(),
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type PassportEntry = z.infer<typeof PassportEntrySchema>

export const CreatePassportEntrySchema = z.object({
  claim_id: z.string().uuid(),
  title: z.string().optional(),
  metadata: z.any().optional(),
})
export type CreatePassportEntry = z.infer<typeof CreatePassportEntrySchema>

export const PassportShareSchema = z.object({
  id: z.string().uuid(),
  passport_entry_id: z.string().uuid(),
  sponsor_organization_id: z.string().uuid(),
  granted_by: z.string().uuid().optional().nullable(),
  access_level: AccessLevel.default('view'),
  permissions: z.any().optional().nullable(),
  access_token: z.string().uuid().optional().nullable(),
  granted_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }).optional().nullable(),
  revoked_at: z.string().datetime({ offset: true }).optional().nullable(),
  revoked_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type PassportShare = z.infer<typeof PassportShareSchema>

export const GrantPassportAccessSchema = z.object({
  sponsor_organization_id: z.string().uuid(),
  access_level: AccessLevel.default('view'),
  expires_at: z.string().datetime({ offset: true }).optional(),
})
export type GrantPassportAccess = z.infer<typeof GrantPassportAccessSchema>
