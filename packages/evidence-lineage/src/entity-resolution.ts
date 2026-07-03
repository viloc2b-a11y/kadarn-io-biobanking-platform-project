// ==========================================================================
// Kadarn Evidence Lineage — Entity Resolution Layer
// ==========================================================================
// Sprint 28B. Phase 8.
//
// Transforms extracted facts into persistent normalized entities.
// Same institution never exists duplicated. Identity is canonical.
//
// Pipeline: ExtractedFact → EntityResolution → NormalizedEntity
// ==========================================================================

// --------------------------------------------------------------------------
// Entity types
// --------------------------------------------------------------------------

export type EntityType = 'institution' | 'site' | 'pi' | 'laboratory' | 'organization'

export interface EntityTimelineEntry {
  period: { start: string; end?: string }
  name: string
  affiliation?: string
  role?: string
}

export interface EntityIdentifier {
  type: 'ror' | 'grid' | 'npi' | 'orcid' | 'scopus' | 'pubmed' | 'custom'
  value: string
  confidence: number  // 0.0 – 1.0
}

export interface NormalizedEntity {
  entityId: string          // Canonical ID: 'inst:{hash}', 'site:{hash}', etc.
  entityType: EntityType
  canonicalName: string
  aliases: string[]
  identifiers: EntityIdentifier[]
  timeline: EntityTimelineEntry[]
  parentEntityId?: string   // e.g., Site belongs to Institution
  resolvedAt: string
  version: number           // Increments on updates
}

// --------------------------------------------------------------------------
// Resolution input
// --------------------------------------------------------------------------

export interface ResolutionInput {
  /** Raw name extracted from fact */
  rawName: string
  /** Entity type hint from extraction */
  hintType: EntityType
  /** Identifiers found in the fact */
  identifiers: EntityIdentifier[]
  /** Associated facts that reference this entity */
  factIds: string[]
  /** Section context */
  sectionId?: string
}

// --------------------------------------------------------------------------
// Resolution result
// --------------------------------------------------------------------------

export interface ResolutionResult {
  entity: NormalizedEntity
  /** Whether this is a new entity or matched existing */
  matchType: 'exact_match' | 'fuzzy_match' | 'new_entity' | 'merged'
  /** If merged, the previous entity ID that was merged into this one */
  mergedFrom?: string
  /** Confidence in the resolution */
  confidence: number
}

// --------------------------------------------------------------------------
// Engine
// --------------------------------------------------------------------------

export class EntityResolutionEngine {
  private readonly entities = new Map<string, NormalizedEntity>()
  private readonly identifierIndex = new Map<string, string>()  // identifier value → entityId
  private readonly nameIndex = new Map<string, string>()        // lowercase canonical name → entityId
  private readonly aliasIndex = new Map<string, string>()       // lowercase alias → entityId
  private entityCounter = 0

  /**
   * Resolve an extracted fact into a normalized entity.
   *
   * If the entity already exists (matched by identifier or name),
   * it is returned with updated aliases and timeline.
   * If not, a new canonical entity is created.
   */
  resolve(input: ResolutionInput): ResolutionResult {
    // ── Step 1: Try exact match by identifier ──
    for (const id of input.identifiers) {
      const existingId = this.identifierIndex.get(id.value.toLowerCase())
      if (existingId) {
        const entity = this.entities.get(existingId)!
        return this.enrichExisting(entity, input, 'exact_match')
      }
    }

    // ── Step 2: Try match by canonical name ──
    const normalizedName = this.normalizeName(input.rawName)
    const nameMatch = this.nameIndex.get(normalizedName)
    if (nameMatch) {
      const entity = this.entities.get(nameMatch)!
      return this.enrichExisting(entity, input, 'exact_match')
    }

    // ── Step 3: Try fuzzy match by alias ──
    const aliasMatch = this.aliasIndex.get(normalizedName)
    if (aliasMatch) {
      const entity = this.entities.get(aliasMatch)!
      return this.enrichExisting(entity, input, 'fuzzy_match')
    }

    // ── Step 4: Check for potential duplicates by name similarity ──
    const potentialMerge = this.findPotentialMerge(normalizedName)
    if (potentialMerge) {
      // Merge: absorb old entity into new one
      return this.mergeEntities(potentialMerge, input)
    }

    // ── Step 5: Create new entity ──
    return this.createEntity(input)
  }

  /**
   * Get an entity by its canonical ID.
   */
  getEntity(entityId: string): NormalizedEntity | undefined {
    return this.entities.get(entityId)
  }

  /**
   * List all resolved entities.
   */
  listEntities(): NormalizedEntity[] {
    return [...this.entities.values()]
  }

  /**
   * Count of resolved entities.
   */
  get entityCount(): number {
    return this.entities.size
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  private enrichExisting(
    entity: NormalizedEntity,
    input: ResolutionInput,
    matchType: 'exact_match' | 'fuzzy_match',
  ): ResolutionResult {
    // Add new aliases
    const normalizedName = this.normalizeName(input.rawName)
    if (!entity.aliases.map(a => a.toLowerCase()).includes(normalizedName)) {
      entity.aliases.push(input.rawName)
      this.aliasIndex.set(normalizedName, entity.entityId)
    }

    // Add new identifiers
    for (const id of input.identifiers) {
      const key = id.value.toLowerCase()
      if (!entity.identifiers.some(i => i.value.toLowerCase() === key)) {
        entity.identifiers.push(id)
        this.identifierIndex.set(key, entity.entityId)
      }
    }

    // Increment version
    entity.version++

    return {
      entity,
      matchType,
      confidence: matchType === 'exact_match' ? 0.98 : 0.75,
    }
  }

  private createEntity(input: ResolutionInput): ResolutionResult {
    this.entityCounter++
    const entityId = `${input.hintType}:${this.entityCounter}:${this.shortHash(input.rawName)}`
    const normalizedName = this.normalizeName(input.rawName)

    const entity: NormalizedEntity = {
      entityId,
      entityType: input.hintType,
      canonicalName: normalizedName,
      aliases: input.rawName !== normalizedName ? [input.rawName] : [],
      identifiers: [...input.identifiers],
      timeline: [{ period: { start: new Date().toISOString() }, name: normalizedName }],
      resolvedAt: new Date().toISOString(),
      version: 1,
    }

    // Register indexes
    this.entities.set(entityId, entity)
    this.nameIndex.set(normalizedName, entityId)
    for (const alias of entity.aliases) {
      this.aliasIndex.set(alias.toLowerCase(), entityId)
    }
    for (const id of entity.identifiers) {
      this.identifierIndex.set(id.value.toLowerCase(), entityId)
    }

    return {
      entity,
      matchType: 'new_entity',
      confidence: 0.90,
    }
  }

  private mergeEntities(oldEntity: NormalizedEntity, input: ResolutionInput): ResolutionResult {
    // Create new entity absorbing old one's data
    const result = this.createEntity(input)
    result.matchType = 'merged'
    result.mergedFrom = oldEntity.entityId

    // Absorb old entity's identifiers and aliases
    const merged = result.entity
    for (const id of oldEntity.identifiers) {
      if (!merged.identifiers.some(i => i.value.toLowerCase() === id.value.toLowerCase())) {
        merged.identifiers.push(id)
        this.identifierIndex.set(id.value.toLowerCase(), merged.entityId)
      }
    }
    for (const alias of oldEntity.aliases) {
      if (!merged.aliases.map(a => a.toLowerCase()).includes(alias.toLowerCase())) {
        merged.aliases.push(alias)
        this.aliasIndex.set(alias.toLowerCase(), merged.entityId)
      }
    }
    merged.timeline.unshift(...oldEntity.timeline)
    merged.version++

    // Remove old entity from indexes (but keep in store for provenance)
    this.nameIndex.delete(oldEntity.canonicalName.toLowerCase())
    for (const alias of oldEntity.aliases) {
      this.aliasIndex.delete(alias.toLowerCase())
    }

    // Update old entity's identifiers to point to merged entity
    this.entities.set(merged.entityId, merged)

    return result
  }

  /**
   * Find an entity with a similar name that might be a duplicate.
   * Simple Jaccard-like word overlap for now.
   */
  private findPotentialMerge(normalizedName: string): NormalizedEntity | null {
    const inputWords = new Set(normalizedName.split(/\s+/).filter(w => w.length > 2))

    for (const entity of this.entities.values()) {
      const entityWords = new Set(entity.canonicalName.split(/\s+/).filter(w => w.length > 2))
      if (entityWords.size === 0 || inputWords.size === 0) continue

      // Jaccard similarity
      const intersection = new Set([...inputWords].filter(w => entityWords.has(w)))
      const union = new Set([...inputWords, ...entityWords])
      const similarity = intersection.size / union.size

      if (similarity > 0.7) {
        return entity
      }
    }

    return null
  }

  private normalizeName(raw: string): string {
    return raw
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[,\s]+(Inc\.?|Corp\.?|LLC|Ltd\.?|GmbH|SA|S\.A\.|S\.L\.)$/i, '')
  }

  private shortHash(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(36).slice(0, 6)
  }
}
