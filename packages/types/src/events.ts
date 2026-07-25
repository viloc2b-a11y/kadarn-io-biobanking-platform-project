// ─── KADARN v2 — Institutional Event Ledger Types ───────────────────────
// Authority: Architecture Constitution v2.0, Migration 075
// KAD-LOOP-002: Converted from plain interface to Zod schema.

import { z } from 'zod'

export const ActorType = z.enum(['person', 'system', 'external'])
export type ActorType = z.infer<typeof ActorType>

export const InstitutionalEventSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  event_type: z.string().min(1),
  event_version: z.number().int().min(1),
  occurred_at: z.string().datetime({ offset: true }),
  recorded_at: z.string().datetime({ offset: true }),
  actor_id: z.string().uuid().optional().nullable(),
  actor_type: ActorType,
  subject_id: z.string().optional().nullable(),
  subject_type: z.string().optional().nullable(),
  correlation_id: z.string().optional().nullable(),
  causation_id: z.string().optional().nullable(),
  payload: z.record(z.string(), z.unknown()),
  idempotency_key: z.string().min(1),
  tenant_id: z.string().uuid(),
  created_at: z.string().datetime({ offset: true }),
})
export type InstitutionalEvent = z.infer<typeof InstitutionalEventSchema>

export const CreateInstitutionalEventSchema = z.object({
  organization_id: z.string().uuid(),
  event_type: z.string().min(1),
  event_version: z.number().int().min(1).default(1),
  occurred_at: z.string().datetime({ offset: true }).default(() => new Date().toISOString()),
  actor_id: z.string().uuid().optional(),
  actor_type: ActorType.default('system'),
  subject_id: z.string().optional(),
  subject_type: z.string().optional(),
  correlation_id: z.string().optional(),
  causation_id: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
  idempotency_key: z.string().min(1),
  tenant_id: z.string().uuid(),
})
export type CreateInstitutionalEvent = z.infer<typeof CreateInstitutionalEventSchema>
