// ==========================================================================
// Identity Resolution Engine — Core (Sprint 23B)
// ==========================================================================
// Canonical identity layer. Consumes Connector Layer only.
// Never evaluates evidence. Never computes confidence on evidence.
// Uses deterministic matching. No automatic merge under ambiguity.
// ==========================================================================

import type {
  AffiliationEntry,
  CanonicalIdentity,
  EntityType,
  ExternalIdSource,
  ExternalIdentifier,
  IdentityAlias,
  IdentityMatch,
  IdentityState,
  IdentityTimelineEvent,
  ResolutionInput,
  ReviewItem,
} from './types'

// --------------------------------------------------------------------------
// Normalization helpers
// --------------------------------------------------------------------------

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function generateCanonicalId(entityType: EntityType, name: string): string {
  const slug = normalizeName(name).replace(/\s+/g, '-').slice(0, 60)
  return `${entityType}:${slug}`
}

// --------------------------------------------------------------------------
// Alias generation from names
// --------------------------------------------------------------------------

function generateAliases(names: string[], existingAliases: IdentityAlias[] = []): IdentityAlias[] {
  const normSet = new Set(existingAliases.map((a) => normalizeName(a.name)))
  const aliases: IdentityAlias[] = [...existingAliases]

  for (const name of names) {
    const norm = normalizeName(name)
    if (!normSet.has(norm)) {
      normSet.add(norm)
      aliases.push({
        name,
        type: 'alternate',
        active_from: null,
        active_until: null,
        source: 'identity_resolution',
      })
    }
  }

  return aliases
}

// --------------------------------------------------------------------------
// Identity state determination
// --------------------------------------------------------------------------

function determineState(ids: ExternalIdentifier[], aliases: IdentityAlias[]): IdentityState {
  const uniqueSources = new Set(ids.map((id) => id.source))
  const verifiedIds = ids.filter((id) => id.verified).length

  if (uniqueSources.size >= 2 && verifiedIds >= 1) return 'resolved'
  if (uniqueSources.size === 1 && verifiedIds >= 1) return 'partially_resolved'
  if (uniqueSources.size >= 2 && aliases.length > 1) return 'needs_review'
  if (aliases.length > 2) return 'ambiguous'
  return 'unresolved'
}

// --------------------------------------------------------------------------
// Review queue generation
// --------------------------------------------------------------------------

function generateReviewItems(
  candidates: IdentityMatch[],
  current: CanonicalIdentity,
): ReviewItem[] {
  const items: ReviewItem[] = []
  const now = new Date().toISOString()

  const ambiguous = candidates.filter((c) => c.state === 'ambiguous')
  if (ambiguous.length > 0) {
    items.push({
      id: `review:ambiguous:${current.canonical_id}`,
      reason: 'ambiguous_identity',
      identities: [current.canonical_id, ...ambiguous.map((c) => c.canonical_id)],
      description: `${ambiguous.length} potential duplicate(s) found for ${current.display_name}`,
      created_at: now,
      status: 'open',
    })
  }

  const duplicates = candidates.filter(
    (c) => c.confidence > 0.7 && c.canonical_id !== current.canonical_id,
  )
  if (duplicates.length > 0) {
    items.push({
      id: `review:duplicate:${current.canonical_id}`,
      reason: 'duplicate_candidate',
      identities: [current.canonical_id, ...duplicates.map((c) => c.canonical_id)],
      description: `${duplicates.length} high-confidence duplicate(s) found`,
      created_at: now,
      status: 'open',
    })
  }

  return items
}

// --------------------------------------------------------------------------
// Identity Resolution Engine
// --------------------------------------------------------------------------

export class IdentityResolutionEngine {
  private identities = new Map<string, CanonicalIdentity>()
  private reviewQueue: ReviewItem[] = []

  /**
   * Resolve an institutional or investigator identity from external identifiers.
   * Consumes Connector Layer output — never calls providers directly.
   */
  resolve(input: ResolutionInput): CanonicalIdentity {
    const { entity_type, external_ids, names, metadata } = input
    const now = new Date().toISOString()

    // Check if any external ID already maps to an existing identity
    const existing = this.findByIdentifier(external_ids)
    if (existing) {
      // Update with new info
      existing.external_identifiers = this.mergeIds(existing.external_identifiers, external_ids)
      existing.aliases = generateAliases(names, existing.aliases)
      existing.historical_names = this.updateHistoricalNames(existing, names)
      existing.identity_state = determineState(existing.external_identifiers, existing.aliases)
      existing.last_updated = now
      if (metadata) existing.metadata = { ...existing.metadata, ...metadata }
      return existing
    }

    // New identity
    const primaryName = names[0] ?? 'Unknown'
    const canonicalId = generateCanonicalId(entity_type, primaryName)
    const aliases = generateAliases(names)
    const state = determineState(external_ids, aliases)

    const identity: CanonicalIdentity = {
      canonical_id: canonicalId,
      entity_type,
      display_name: primaryName,
      aliases,
      external_identifiers: external_ids,
      historical_names: [],
      current_status: 'active',
      identity_state: state,
      timeline: [],
      metadata: metadata ?? {},
      last_updated: now,
    }

    this.identities.set(canonicalId, identity)

    // Check for ambiguous matches
    const candidates = this.findCandidates(identity)
    if (candidates.length > 0) {
      this.reviewQueue.push(...generateReviewItems(candidates, identity))
    }

    return identity
  }

  /**
   * Find potential identity matches (not auto-merged — review only).
   */
  findCandidates(identity: CanonicalIdentity): IdentityMatch[] {
    const candidates: IdentityMatch[] = []

    for (const [, existing] of this.identities) {
      if (existing.canonical_id === identity.canonical_id) continue

      const matchScore = this.computeMatchScore(identity, existing)
      if (matchScore.confidence > 0.5) {
        candidates.push(matchScore)
      }
    }

    return candidates
  }

  /**
   * Compute match score between two identities. Deterministic, not ML.
   */
  computeMatchScore(a: CanonicalIdentity, b: CanonicalIdentity): IdentityMatch {
    const matchedOn: string[] = []
    let score = 0

    // Same external IDs → high confidence
    const aIds = new Set(a.external_identifiers.map((id) => `${id.source}:${id.identifier}`))
    for (const id of b.external_identifiers) {
      if (aIds.has(`${id.source}:${id.identifier}`)) {
        score += 0.4
        matchedOn.push(`external_id:${id.source}`)
      }
    }

    // Name similarity
    const aNorm = normalizeName(a.display_name)
    const bNorm = normalizeName(b.display_name)
    if (aNorm === bNorm) {
      score += 0.3
      matchedOn.push('exact_name_match')
    } else if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) {
      score += 0.15
      matchedOn.push('partial_name_match')
    }

    // Alias overlap
    const aAliasNorms = new Set(a.aliases.map((al) => normalizeName(al.name)))
    for (const alias of b.aliases) {
      if (aAliasNorms.has(normalizeName(alias.name))) {
        score += 0.1
        matchedOn.push('alias_overlap')
        break
      }
    }

    const state: IdentityState = score >= 0.7 ? 'ambiguous' : 'unresolved'

    return {
      canonical_id: b.canonical_id,
      confidence: Math.min(score, 0.95),
      matched_on: matchedOn,
      state,
    }
  }

  /**
   * Record affiliation history.
   */
  addAffiliation(identityId: string, affiliation: AffiliationEntry): void {
    const identity = this.identities.get(identityId)
    if (identity) {
      identity.affiliations = [...(identity.affiliations ?? []), affiliation]
      identity.last_updated = new Date().toISOString()
    }
  }

  /**
   * Record timeline event.
   */
  addTimelineEvent(identityId: string, event: IdentityTimelineEvent): void {
    const identity = this.identities.get(identityId)
    if (identity) {
      identity.timeline = [...identity.timeline, event]
      identity.last_updated = new Date().toISOString()
    }
  }

  getIdentity(canonicalId: string): CanonicalIdentity | undefined {
    return this.identities.get(canonicalId)
  }

  getReviewQueue(): ReviewItem[] {
    return [...this.reviewQueue]
  }

  resolveReviewItem(reviewId: string): void {
    const item = this.reviewQueue.find((r) => r.id === reviewId)
    if (item) item.status = 'resolved'
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private findByIdentifier(ids: ExternalIdentifier[]): CanonicalIdentity | undefined {
    for (const id of ids) {
      for (const [, identity] of this.identities) {
        if (identity.external_identifiers.some(
          (existing) => existing.source === id.source && existing.identifier === id.identifier,
        )) {
          return identity
        }
      }
    }
    return undefined
  }

  private mergeIds(existing: ExternalIdentifier[], incoming: ExternalIdentifier[]): ExternalIdentifier[] {
    const merged = [...existing]
    for (const inc of incoming) {
      if (!existing.some((e) => e.source === inc.source && e.identifier === inc.identifier)) {
        merged.push(inc)
      }
    }
    return merged
  }

  private updateHistoricalNames(identity: CanonicalIdentity, newNames: string[]): string[] {
    const existing = new Set(identity.historical_names.map(normalizeName))
    const current = normalizeName(identity.display_name)
    const updated = [...identity.historical_names]

    for (const name of newNames) {
      const norm = normalizeName(name)
      if (norm !== current && !existing.has(norm)) {
        updated.push(name)
        existing.add(norm)
      }
    }

    return updated
  }
}
