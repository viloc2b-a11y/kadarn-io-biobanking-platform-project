// ─── KAD-008 — Knowledge Publication ──────────────────────────────────────
// Authority: KADARN Product Constitution

import { z } from 'zod'

export const KnowledgeType = z.enum([
  'capability_profile',
  'institution_profile',
  'evidence_passport',
  'sponsor_brochure',
  'feasibility_response',
  'trust_page',
  'sponsor_package',
])
export type KnowledgeType = z.infer<typeof KnowledgeType>

export const PublicationStatus = z.enum(['draft', 'published', 'archived'])

export const PublishedKnowledgeSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  knowledge_type: KnowledgeType.default('capability_profile'),
  title: z.string().min(1),
  summary: z.string().optional().nullable(),
  content: z.any(),
  source_claim_id: z.string().uuid().optional().nullable(),
  source_capability_id: z.string().uuid().optional().nullable(),
  status: PublicationStatus.default('draft'),
  published_at: z.string().datetime({ offset: true }).optional().nullable(),
  archived_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export type PublishedKnowledge = z.infer<typeof PublishedKnowledgeSchema>

export const CreatePublishedKnowledgeSchema = z.object({
  knowledge_type: KnowledgeType.default('capability_profile'),
  title: z.string().min(1),
  summary: z.string().optional(),
  content: z.any(),
  source_claim_id: z.string().uuid().optional(),
  source_capability_id: z.string().uuid().optional(),
})
export type CreatePublishedKnowledge = z.infer<typeof CreatePublishedKnowledgeSchema>

export const UpdatePublishedKnowledgeSchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().optional(),
  content: z.any().optional(),
  status: PublicationStatus.optional(),
}).optional()
