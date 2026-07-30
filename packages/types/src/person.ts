// ─── KAD-002A — Person Entity ───────────────────────────────────────────
// Authority: Foundation Library 016_CANONICAL_ENTITY_SPECIFICATIONS

import { z } from 'zod'

export const PersonStatus = z.enum([
  'active',
  'inactive',
  'suspended',
  'merged',
])
export type PersonStatus = z.infer<typeof PersonStatus>

export const PersonSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  middle_name: z.string().max(255).optional().nullable(),
  suffix: z.string().max(50).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  orcid: z.string().max(50).optional().nullable(),
  npi: z.string().max(50).optional().nullable(),
  profile_photo_url: z.string().url().optional().nullable(),
  status: PersonStatus.default('active'),
  auth_user_id: z.string().uuid().optional().nullable(),
  alias_resolution_attributes: z.any().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export type Person = z.infer<typeof PersonSchema>

export const CreatePersonSchema = PersonSchema.omit({
  id: true,
  status: true,
  auth_user_id: true,
  created_at: true,
  updated_at: true,
}).extend({
  status: PersonStatus.default('active').optional(),
})

export type CreatePerson = z.infer<typeof CreatePersonSchema>

export const UpdatePersonSchema = CreatePersonSchema.partial()

export type UpdatePerson = z.infer<typeof UpdatePersonSchema>
