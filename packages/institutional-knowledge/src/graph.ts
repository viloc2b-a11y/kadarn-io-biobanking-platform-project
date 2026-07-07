// ==========================================================================
// Institutional Knowledge — Graph Runtime (IKM/EVM Sprint 3)
// ==========================================================================

import type { KnowledgeGraph, KnowledgeItem, KnowledgeRelationship } from './types'
import { getItemsByOrg } from './runtime'

/**
 * Build the knowledge graph for an organization.
 * Identifies: orphans, isolates, hub items, evidence candidates.
 */
export function buildKnowledgeGraph(organizationId: string): KnowledgeGraph {
  const items = getItemsByOrg(organizationId)

  // Items with relationships
  const connected = new Set<string>()
  for (const item of items) {
    for (const rel of item.relationships) {
      connected.add(rel.sourceId)
      connected.add(rel.targetId)
    }
  }

  // Orphans: items that have relationships but all relationships point to items
  // that don't exist anymore (or only one-way connections)
  const hasDocs = new Set(items.filter((i) => i.documentRefs.length > 0).map((i) => i.id))
  const hasRels = new Set(items.filter((i) => i.relationships.length > 0).map((i) => i.id))

  // Isolates: no documents AND no relationships
  const isolates = items.filter((i) => !hasDocs.has(i.id) && !hasRels.has(i.id))

  // Orphans: items with relationships but no documents
  const orphans = items.filter((i) => hasRels.has(i.id) && !hasDocs.has(i.id))

  // Hub items: items with the most connections (top 25%)
  const connectionCounts = items.map((i) => ({
    item: i,
    connections: i.relationships.length + i.documentRefs.length,
  }))
  connectionCounts.sort((a, b) => b.connections - a.connections)
  const hubThreshold = Math.max(1, Math.ceil(items.length * 0.25))
  const hubItems = connectionCounts.slice(0, hubThreshold).map((c) => c.item)

  // All relationships
  const allRelationships: KnowledgeRelationship[] = []
  for (const item of items) {
    allRelationships.push(...item.relationships)
  }

  // Evidence candidates
  const allCandidates = items.flatMap((i) => i.evidenceCandidates)

  return {
    organizationId,
    items,
    relationships: allRelationships,
    orphans,
    isolates,
    hubItems,
    evidenceCandidates: allCandidates,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Find duplicate knowledge items (same statement, same org).
 */
export function findDuplicates(organizationId: string): KnowledgeItem[][] {
  const items = getItemsByOrg(organizationId)
  const groups = new Map<string, KnowledgeItem[]>()

  for (const item of items) {
    const key = `${item.statement.toLowerCase().trim()}|${item.itemType}`
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }

  return Array.from(groups.values()).filter((g) => g.length > 1)
}

/**
 * Suggest missing relationships for knowledge items.
 */
export function suggestRelationships(item: KnowledgeItem, allItems: KnowledgeItem[]): {
  suggestedRelationshipType: string
  suggestedTargetId: string
  suggestedTargetStatement: string
  reason: string
}[] {
  const suggestions: ReturnType<typeof suggestRelationships> = []

  for (const other of allItems) {
    if (other.id === item.id) continue

    // Equipment operated by person
    if (item.itemType === 'equipment' && other.itemType === 'person') {
      const alreadyLinked = item.relationships.some(
        (r) => r.targetId === other.id && r.relationshipType === 'operated_by'
      )
      if (!alreadyLinked) {
        suggestions.push({
          suggestedRelationshipType: 'operated_by',
          suggestedTargetId: other.id,
          suggestedTargetStatement: other.statement,
          reason: `${item.statement} may be operated by ${other.statement}`,
        })
      }
    }

    // Facility located_in → facility
    if (
      (item.itemType === 'equipment' || item.itemType === 'person') &&
      other.itemType === 'facility'
    ) {
      const alreadyLinked = item.relationships.some(
        (r) => r.targetId === other.id && r.relationshipType === 'located_in'
      )
      if (!alreadyLinked) {
        suggestions.push({
          suggestedRelationshipType: 'located_in',
          suggestedTargetId: other.id,
          suggestedTargetStatement: other.statement,
          reason: `${item.statement} may be located in ${other.statement}`,
        })
      }
    }

    // Process governed_by → policy
    if (item.itemType === 'process' && other.itemType === 'policy') {
      const alreadyLinked = item.relationships.some(
        (r) => r.targetId === other.id && r.relationshipType === 'governed_by'
      )
      if (!alreadyLinked) {
        suggestions.push({
          suggestedRelationshipType: 'governed_by',
          suggestedTargetId: other.id,
          suggestedTargetStatement: other.statement,
          reason: `${item.statement} may be governed by ${other.statement}`,
        })
      }
    }
  }

  return suggestions
}
