// ==========================================================================
// Input Validator — Sprint 25E
// ==========================================================================
// Request body validation for API endpoints.
// Prevents malformed payloads from reaching engine logic.
// ==========================================================================

import { z } from 'zod'

// --------------------------------------------------------------------------
// Sponsor Search
// --------------------------------------------------------------------------

export const sponsorSearchSchema = z.object({
  capabilities: z.array(z.string()).max(20).default([]),
  research_assets: z.array(z.string()).max(20).default([]),
  therapeutic_areas: z.array(z.string()).max(10).default([]),
  geography: z.array(z.string()).max(10).default([]),
  operational_features: z.array(z.string()).max(10).default([]),
})

// --------------------------------------------------------------------------
// Report
// --------------------------------------------------------------------------

export const reportQuerySchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
})

// --------------------------------------------------------------------------
// Generic
// --------------------------------------------------------------------------

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (result.success) return { success: true, data: result.data }
  return { success: false, error: result.error.issues.map((i) => i.message).join('; ') }
}

export function validateQuery(schema: z.ZodSchema<Record<string, string>>, params: URLSearchParams): { success: true; data: Record<string, string> } | { success: false; error: string } {
  const obj: Record<string, string> = {}
  params.forEach((v, k) => { obj[k] = v })
  const result = schema.safeParse(obj)
  if (result.success) return { success: true, data: result.data as Record<string, string> }
  return { success: false, error: result.error.issues.map((i) => i.message).join('; ') }
}
