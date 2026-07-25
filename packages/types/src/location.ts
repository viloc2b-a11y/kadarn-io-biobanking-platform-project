// ─── KAD-002B — Location Entity ───────────────────────────────────────────
// Authority: Foundation Library 016_CANONICAL_ENTITY_SPECIFICATIONS

import { z } from 'zod'

export const LocationType = z.enum([
  'clinic',
  'laboratory',
  'warehouse',
  'phase1_unit',
  'office',
  'pharmacy',
  'storage',
  'other',
])
export type LocationType = z.infer<typeof LocationType>

export const LocationStatus = z.enum([
  'active',
  'inactive',
  'under_maintenance',
  'decommissioned',
])
export type LocationStatus = z.infer<typeof LocationStatus>

export const LocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  location_type: LocationType.default('other'),
  institution_id: z.string().uuid(),
  address_line1: z.string().min(1).max(500),
  address_line2: z.string().max(500).optional().nullable(),
  city: z.string().min(1).max(255),
  state_province: z.string().min(1).max(255),
  postal_code: z.string().min(1).max(50),
  country: z.string().min(1).max(255),
  phone: z.string().max(50).optional().nullable(),
  timezone: z.string().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  status: LocationStatus.default('active'),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export type Location = z.infer<typeof LocationSchema>

export const CreateLocationSchema = LocationSchema.omit({
  id: true,
  status: true,
  created_at: true,
  updated_at: true,
}).extend({
  status: LocationStatus.default('active').optional(),
})

export type CreateLocation = z.infer<typeof CreateLocationSchema>

export const UpdateLocationSchema = CreateLocationSchema.partial()

export type UpdateLocation = z.infer<typeof UpdateLocationSchema>
