// ==========================================================================
// Identity Resolution Engine — Types (Sprint 23B)
// ==========================================================================
// Canonical identity layer of Kadarn.
// Never evaluates evidence. Never computes confidence.
// No automatic merge under ambiguity.
// ==========================================================================

export type EntityType = 'institution' | 'investigator' | 'research_site' | 'sponsor'

export type IdentityState = 'resolved' | 'partially_resolved' | 'needs_review' | 'ambiguous' | 'unresolved'

export type ExternalIdSource = 'ror' | 'orcid' | 'npi' | 'grid' | 'clinicaltrials' | 'pubmed' | 'crossref' | 'openalex' | 'kadarn_internal'

export interface ExternalIdentifier {
  source: ExternalIdSource
  identifier: string
  verified: boolean
  last_synced: string
}

export interface IdentityAlias {
  name: string
  type: 'historical' | 'abbreviation' | 'alternate' | 'common' | 'merged_from'
  active_from: string | null
  active_until: string | null
  source: string
}

export interface IdentityTimelineEvent {
  event_type: 'name_change' | 'merger' | 'acquisition' | 'closure' | 'reopening' | 'founding' | 'affiliation_change'
  description: string
  occurred_at: string
  source: string
}

export interface AffiliationEntry {
  institution_id: string
  institution_name: string
  role: string
  started_at: string | null
  ended_at: string | null
}

export interface CanonicalIdentity {
  canonical_id: string
  entity_type: EntityType
  display_name: string
  aliases: IdentityAlias[]
  external_identifiers: ExternalIdentifier[]
  historical_names: string[]
  current_status: 'active' | 'inactive' | 'merged' | 'unknown'
  identity_state: IdentityState
  timeline: IdentityTimelineEvent[]
  affiliations?: AffiliationEntry[]
  metadata: Record<string, unknown>
  last_updated: string
}

export interface IdentityMatch {
  canonical_id: string
  confidence: number
  matched_on: string[]
  state: IdentityState
}

export interface ReviewItem {
  id: string
  reason: 'ambiguous_identity' | 'duplicate_candidate' | 'conflicting_identifiers' | 'unresolved_alias'
  identities: string[]
  description: string
  created_at: string
  status: 'open' | 'reviewed' | 'resolved'
}

export interface ResolutionInput {
  entity_type: EntityType
  external_ids: ExternalIdentifier[]
  names: string[]
  metadata?: Record<string, unknown>
}
