// ─── KADARN v2 — Evidence Generation Rule Types ─────────────────────────
// Authority: Architecture Constitution v2.0, Migration 077
// KAD-LOOP-002: Converted from plain type to Zod schema + rule_status.

import { z } from 'zod'

export const ReviewMode = z.enum(['manual', 'automatic', 'conditional'])
export type ReviewMode = z.infer<typeof ReviewMode>

export const RuleStatus = z.enum(['draft', 'active', 'deprecated', 'retired'])
export type RuleStatus = z.infer<typeof RuleStatus>

export const GenerationRuleSchema = z.object({
  id: z.string().uuid(),
  rule_name: z.string().min(1),
  rule_version: z.number().int().min(1),
  event_pattern: z.string(),
  required_inputs: z.record(z.string(), z.unknown()),
  output_evidence_type: z.string(),
  preconditions: z.record(z.string(), z.unknown()),
  review_mode: ReviewMode,
  confidence_policy: z.record(z.string(), z.unknown()),
  owner: z.string().uuid().optional().nullable(),
  active: z.boolean().default(true),
  rule_status: RuleStatus.default('draft'),
  effective_from: z.string().datetime({ offset: true }),
  effective_until: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type GenerationRule = z.infer<typeof GenerationRuleSchema>

export const CreateGenerationRuleSchema = z.object({
  rule_name: z.string().min(1),
  rule_version: z.number().int().min(1).default(1),
  event_pattern: z.string(),
  required_inputs: z.record(z.string(), z.unknown()),
  output_evidence_type: z.string(),
  preconditions: z.record(z.string(), z.unknown()).default({}),
  review_mode: ReviewMode.default('manual'),
  confidence_policy: z.record(z.string(), z.unknown()).default({}),
  owner: z.string().uuid().optional(),
  active: z.boolean().default(true),
  rule_status: RuleStatus.default('draft'),
  effective_from: z.string().datetime({ offset: true }).default(() => new Date().toISOString()),
  effective_until: z.string().datetime({ offset: true }).optional(),
})
export type CreateGenerationRule = z.infer<typeof CreateGenerationRuleSchema>

export const UpdateGenerationRuleSchema = z.object({
  rule_name: z.string().min(1).optional(),
  event_pattern: z.string().optional(),
  required_inputs: z.record(z.string(), z.unknown()).optional(),
  output_evidence_type: z.string().optional(),
  preconditions: z.record(z.string(), z.unknown()).optional(),
  review_mode: ReviewMode.optional(),
  confidence_policy: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().optional(),
  rule_status: RuleStatus.optional(),
  effective_until: z.string().datetime({ offset: true }).optional(),
})
export type UpdateGenerationRule = z.infer<typeof UpdateGenerationRuleSchema>
