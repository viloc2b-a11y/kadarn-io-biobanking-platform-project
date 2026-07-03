// ==========================================================================
// Phase 8 Contracts — Entity resolution (28B)
// ==========================================================================

import type { IsoDateTime } from './common.js'

export interface NormalizedEntity {
  canonical_identity_id: string
  entity_type: 'institution' | 'site' | 'investigator' | 'laboratory' | 'other'
  display_name: string
  org_id?: string
  aliases: string[]
  external_refs: Record<string, string>
  created_at: IsoDateTime
}

export interface ResolutionRun {
  resolution_run_id: string
  input_name: string
  input_context: Record<string, unknown>
  canonical_identity_id?: string
  aliases_considered: string[]
  engine_version: string
  created_at: IsoDateTime
}
