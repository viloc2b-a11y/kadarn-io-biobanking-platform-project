import { z } from 'zod';

// ---------------------------------------------------------------------------
// Organization schemas
// ---------------------------------------------------------------------------
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  legal_name: z.string().max(200).optional(),
  tax_id: z.string().max(50).optional(),
  country: z.string().length(2, 'Country must be ISO 3166-1 alpha2').default('US'),
  region: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

// ---------------------------------------------------------------------------
// Program schemas
// ---------------------------------------------------------------------------
export const createProgramSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  short_name: z.string().max(20).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived', 'cancelled']).default('draft'),
  sponsor_org_id: z.string().uuid('Sponsor organization ID must be a valid UUID'),
  default_data_scope: z
    .enum(['no_sharing', 'metadata_only', 'aggregate_only', 'de_identified', 'pseudonymized', 'identified', 'full_access'])
    .default('metadata_only'),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;

// ---------------------------------------------------------------------------
// Query parameter schemas
// ---------------------------------------------------------------------------
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
});

// ---------------------------------------------------------------------------
// Exchange deal schemas
// ---------------------------------------------------------------------------
export const createExchangeDealSchema = z.object({
  request_id: z.string().uuid('Request ID must be a valid UUID'),
  sponsor_org_id: z.string().uuid('Sponsor organization ID must be a valid UUID'),
  provider_org_id: z.string().uuid('Provider organization ID must be a valid UUID'),
  program_id: z.string().uuid('Program ID must be a valid UUID').optional().nullable(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional().nullable(),
  total_value: z.number().positive('Total value must be positive').optional().nullable(),
  currency: z.string().length(3, 'Currency must be ISO 4217').default('USD'),
  expected_start_date: z.string().optional().nullable(),
  expected_end_date: z.string().optional().nullable(),
  sample_count_expected: z.number().int().positive('Sample count must be positive').optional().nullable(),
});

export type CreateExchangeDealInput = z.infer<typeof createExchangeDealSchema>;
