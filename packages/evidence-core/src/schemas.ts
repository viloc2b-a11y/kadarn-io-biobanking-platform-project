// ==========================================================================
// Evidence Core — Zod Validation Schemas
// ==========================================================================
// Baseline AF-1.0. Sprint 17.5.
// ==========================================================================

import { z } from 'zod';

// Evidence Class enum values
const evidenceClassSchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F']);

// --------------------------------------------------------------------------
// Create Claim
// --------------------------------------------------------------------------

export const createClaimSchema = z.object({
  claimTypeId: z.string().min(1, 'claimTypeId is required').max(200),
  name: z.string().min(1, 'name is required').max(500),
  description: z.string().min(1, 'description is required').max(5000),
  domain: z.string().min(1, 'domain is required'),
  validEvidenceClasses: z.array(evidenceClassSchema).min(1, 'At least one valid evidence class is required'),
  requiredEvidenceClasses: z.array(evidenceClassSchema),
  decays: z.boolean(),
  decayPeriodMonths: z.number().int().positive().nullable(),
  organizationId: z.string().uuid('organizationId must be a valid UUID'),
  visibilityScope: z.enum(['site', 'sponsor_authorized', 'system']).optional().default('site'),
  authorizedSponsorIds: z.array(z.string().uuid()).optional().default([]),
});

export type CreateClaimRequest = z.infer<typeof createClaimSchema>;

// --------------------------------------------------------------------------
// Submit Evidence
// --------------------------------------------------------------------------

export const submitEvidenceSchema = z.object({
  claimId: z.string().uuid('claimId must be a valid UUID'),
  evidenceClass: evidenceClassSchema,
  content: z.string().min(1, 'content is required').max(10000),
  source: z.string().min(1, 'source is required').max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  weight: z.number().min(0).max(1),

  // Optional: allow sponsor authorization on submission
  authorizedSponsorIds: z.array(z.string().uuid()).optional().default([]),
});

export type SubmitEvidenceRequest = z.infer<typeof submitEvidenceSchema>;

// --------------------------------------------------------------------------
// Submit Counter Evidence
// --------------------------------------------------------------------------

export const submitCounterEvidenceSchema = z.object({
  claimId: z.string().uuid('claimId must be a valid UUID'),
  evidenceClass: evidenceClassSchema,
  content: z.string().min(1, 'content is required').max(10000),
  source: z.string().min(1, 'source is required').max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  weight: z.number().min(0).max(1), // positive input; service negates it
});

export type SubmitCounterEvidenceRequest = z.infer<typeof submitCounterEvidenceSchema>;

// --------------------------------------------------------------------------
// Submit Right of Response
// --------------------------------------------------------------------------

export const submitResponseSchema = z.object({
  counterEvidenceId: z.string().uuid('counterEvidenceId must be a valid UUID'),
  description: z.string().min(1, 'description is required').max(10000),
  resolutionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'resolutionDate must be YYYY-MM-DD'),
  supportingEvidenceIds: z.array(z.string().uuid()).optional().default([]),
});

export type SubmitResponseRequest = z.infer<typeof submitResponseSchema>;

// --------------------------------------------------------------------------
// Create Relationship
// --------------------------------------------------------------------------

export const createRelationshipSchema = z.object({
  sourceNodeId: z.string().uuid('sourceNodeId must be a valid UUID'),
  targetNodeId: z.string().uuid('targetNodeId must be a valid UUID'),
  relationshipType: z.enum(['supports', 'contradicts', 'corroborates', 'responds_to', 'supersedes']),
});

export type CreateRelationshipRequest = z.infer<typeof createRelationshipSchema>;

// --------------------------------------------------------------------------
// Update Process State
// --------------------------------------------------------------------------

export const updateProcessStateSchema = z.object({
  entityType: z.enum(['claim', 'evidence_node', 'right_of_response']),
  entityId: z.string().uuid('entityId must be a valid UUID'),
  newStatus: z.string().min(1),
  reason: z.string().min(1, 'reason is required').max(2000),
});

export type UpdateProcessStateRequest = z.infer<typeof updateProcessStateSchema>;

// --------------------------------------------------------------------------
// Query Parameters
// --------------------------------------------------------------------------

export const queryClaimParams = z.object({
  claimId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
});

export const queryEvidenceParams = z.object({
  claimId: z.string().uuid('claimId must be a valid UUID'),
});
