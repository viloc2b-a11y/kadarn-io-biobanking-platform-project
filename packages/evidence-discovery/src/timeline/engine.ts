// ==========================================================================
// Institutional Timeline — Reconstruction Engine
// ==========================================================================
// Sprint 20B.1.
//
// Chronological reconstruction from Discovery entities and relationships.
// No Claims. No Confidence computation. No Discovery modification.
// ==========================================================================

import type { TimelineEvent, TimelineDate, DatePrecision, EventCategory, InstitutionalTimeline } from './types.js';
import type { Entity, Relationship, DiscoveryResult } from '../orchestrator.js';

// --------------------------------------------------------------------------
// Event patterns — map entity + relationship combinations to timeline events
// --------------------------------------------------------------------------

interface EventPattern {
  category: EventCategory;
  titleTemplate: (entities: Map<string, Entity>, rels: Relationship[]) => string;
  narrativeTemplate: (entities: Map<string, Entity>, rels: Relationship[]) => string;
  /** Entity types that must exist for this pattern to fire */
  requiredEntityTypes?: string[];
  /** Relationship types that suggest this pattern */
  suggestedRelationshipTypes?: string[];
}

const EVENT_PATTERNS: EventPattern[] = [
  {
    category: 'clinical_trial',
    titleTemplate: () => 'Clinical trial activity detected',
    narrativeTemplate: (entities) => {
      const sponsors = byType(entities, 'SPONSOR');
      const studies = byType(entities, 'STUDY');
      const pis = byType(entities, 'INVESTIGATOR');
      const parts = [];
      if (studies.length) parts.push(`Study: ${studies[0].value}`);
      if (sponsors.length) parts.push(`Sponsor: ${sponsors[0].value}`);
      if (pis.length) parts.push(`PI: ${pis[0].value}`);
      return parts.length ? parts.join('. ') : 'Clinical trial activity detected.';
    },
    suggestedRelationshipTypes: ['STUDY_SPONSORED_BY'],
  },
  {
    category: 'investigator_joining',
    titleTemplate: (entities) => {
      const pis = byType(entities, 'INVESTIGATOR');
      return pis.length ? `Investigator: ${pis[0].value}` : 'Investigator detected';
    },
    narrativeTemplate: (entities) => {
      const pis = byType(entities, 'INVESTIGATOR');
      const insts = byType(entities, 'INSTITUTION');
      if (pis.length && insts.length) return `${pis[0].value} associated with ${insts[0].value}`;
      if (pis.length) return `${pis[0].value} detected in documents`;
      return 'Investigator activity detected';
    },
    requiredEntityTypes: ['INVESTIGATOR'],
  },
  {
    category: 'equipment_acquisition',
    titleTemplate: (entities) => {
      const eq = byType(entities, 'EQUIPMENT');
      return eq.length ? `Equipment: ${eq[0].value}` : 'Equipment acquired';
    },
    narrativeTemplate: (entities, rels) => {
      const eq = byType(entities, 'EQUIPMENT');
      const calRels = rels.filter(r => r.type === 'CALIBRATION_FOR_EQUIPMENT');
      if (eq.length && calRels.length) return `${eq[0].value} with calibration records`;
      if (eq.length) return `${eq[0].value} documented`;
      return 'Equipment documented';
    },
    requiredEntityTypes: ['EQUIPMENT'],
    suggestedRelationshipTypes: ['CALIBRATION_FOR_EQUIPMENT'],
  },
  {
    category: 'certification',
    titleTemplate: () => 'Regulatory or certification activity',
    narrativeTemplate: (entities) => {
      const regs = byType(entities, 'REGULATORY_BODY');
      return regs.length ? `Reference to: ${regs[0].value}` : 'Regulatory or certification document detected';
    },
    requiredEntityTypes: ['REGULATORY_BODY'],
  },
  {
    category: 'study_activity',
    titleTemplate: (entities) => {
      const studies = byType(entities, 'STUDY');
      const protos = byType(entities, 'PROTOCOL_ID');
      const val = studies[0]?.value ?? protos[0]?.value ?? 'Study';
      return `Study: ${val}`;
    },
    narrativeTemplate: (entities, rels) => {
      const sponsors = byType(entities, 'SPONSOR');
      const cros = byType(entities, 'CRO');
      const parts = [];
      if (sponsors.length) parts.push(`Sponsored by ${sponsors[0].value}`);
      if (cros.length) parts.push(`Managed by ${cros[0].value}`);
      return parts.length ? parts.join('. ') : 'Study activity detected';
    },
    requiredEntityTypes: ['STUDY', 'PROTOCOL_ID'],
    suggestedRelationshipTypes: ['STUDY_SPONSORED_BY', 'STUDY_MANAGED_BY_CRO'],
  },
  {
    category: 'publication',
    titleTemplate: () => 'Research publication',
    narrativeTemplate: (entities) => {
      const insts = byType(entities, 'INSTITUTION');
      return insts.length ? `Publication associated with ${insts[0].value}` : 'Research publication detected';
    },
    suggestedRelationshipTypes: ['INVESTIGATOR_AT_INSTITUTION'],
  },
  {
    category: 'training_completed',
    titleTemplate: () => 'Training completed',
    narrativeTemplate: (entities) => {
      const pis = byType(entities, 'INVESTIGATOR');
      return pis.length ? `Training documented for ${pis[0].value}` : 'Training record detected';
    },
    requiredEntityTypes: ['INVESTIGATOR'],
    suggestedRelationshipTypes: ['TRAINING_COMPLETED_BY'],
  },
  {
    category: 'facility_change',
    titleTemplate: () => 'Facility or location referenced',
    narrativeTemplate: (entities) => {
      const locs = byType(entities, 'LOCATION');
      const insts = byType(entities, 'INSTITUTION');
      if (locs.length && insts.length) return `Location ${locs[0].value} associated with ${insts[0].value}`;
      if (locs.length) return `Location: ${locs[0].value}`;
      return 'Facility referenced';
    },
    requiredEntityTypes: ['LOCATION'],
    suggestedRelationshipTypes: ['LOCATION_ASSOCIATED_WITH_INSTITUTION'],
  },
  {
    category: 'regulatory_event',
    titleTemplate: () => 'Regulatory document detected',
    narrativeTemplate: (entities) => {
      const regs = byType(entities, 'REGULATORY_BODY');
      return regs.length ? `Document referencing ${regs[0].value}` : 'Regulatory document';
    },
    requiredEntityTypes: ['REGULATORY_BODY'],
  },
];

function byType(entities: Map<string, Entity>, type: string): Entity[] {
  return Array.from(entities.values()).filter(e => e.type === type);
}

// --------------------------------------------------------------------------
// Date inference
// --------------------------------------------------------------------------

function inferDates(entities: Map<string, Entity>): { dates: TimelineDate[]; dateEntities: Entity[] } {
  const dateEntities = byType(entities, 'DATE');
  const dates: TimelineDate[] = [];

  for (const de of dateEntities) {
    // Try to parse as ISO or common date formats
    const val = de.value.trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      dates.push({ value: val, precision: 'exact', rationale: `Extracted date: ${val}` });
      continue;
    }

    // YYYY
    if (/^\d{4}$/.test(val)) {
      dates.push({ value: val, precision: 'estimated_year', rationale: `Year extracted: ${val}` });
      continue;
    }

    // Try to parse named months
    const monthMatch = val.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})/i);
    if (monthMatch) {
      const months: Record<string, string> = { January: '01', February: '02', March: '03', April: '04', May: '05', June: '06', July: '07', August: '08', September: '09', October: '10', November: '11', December: '12' };
      const month = months[monthMatch[1]] ?? '01';
      const day = monthMatch[2].padStart(2, '0');
      dates.push({ value: `${monthMatch[3]}-${month}-${day}`, precision: 'exact', rationale: `Parsed date: ${val}` });
      continue;
    }

    // Fallback: use as-is with estimated precision
    dates.push({ value: val, precision: 'estimated_year', rationale: `Date (unverified format): ${val}` });
  }

  return { dates, dateEntities };
}

// --------------------------------------------------------------------------
// Timeline Reconstruction Engine
// --------------------------------------------------------------------------

export class TimelineEngine {
  /**
   * Reconstruct an InstitutionalTimeline from a DiscoveryResult.
   * Deterministic. Traceable. No Claims. No Confidence computation.
   */
  reconstruct(result: DiscoveryResult): InstitutionalTimeline {
    const entityMap = new Map<string, Entity>();
    for (const e of result.entities) entityMap.set(e.entityId, e);

    const { dates, dateEntities } = inferDates(entityMap);
    const events: TimelineEvent[] = [];

    // For each date entity, find related entities and create events
    for (let i = 0; i < dateEntities.length; i++) {
      const de = dateEntities[i];
      const dateInfo = dates[i] ?? { value: de.value, precision: 'estimated_year' as DatePrecision, rationale: `Date entity: ${de.value}` };

      // Find relationships involving this date entity
      const relatedRels = result.relationships.filter(r =>
        r.sourceEntityId === de.entityId || r.targetEntityId === de.entityId,
      );

      // Find entities referenced by those relationships
      const relatedEntityIds = new Set<string>();
      for (const rel of relatedRels) {
        if (rel.sourceEntityId !== de.entityId) relatedEntityIds.add(rel.sourceEntityId);
        if (rel.targetEntityId !== de.entityId) relatedEntityIds.add(rel.targetEntityId);
      }

      const relatedEntities = new Map<string, Entity>();
      for (const id of relatedEntityIds) {
        const ent = entityMap.get(id);
        if (ent) relatedEntities.set(id, ent);
      }

      // Also include date entity itself
      relatedEntities.set(de.entityId, de);

      // Match against event patterns
      const matchedPatterns = findMatchingPatterns(relatedEntities, relatedRels, EVENT_PATTERNS);

      for (const pattern of matchedPatterns) {
        const eventId = `evt-${crypto.randomUUID().slice(0, 8)}`;
        events.push({
          eventId,
          date: dateInfo,
          category: pattern.category,
          title: pattern.titleTemplate(entityMap, relatedRels),
          narrative: pattern.narrativeTemplate(entityMap, relatedRels),
          confidence: de.confidence,
          evidenceEntityIds: [de.entityId, ...relatedEntityIds],
          evidenceRelationshipIds: relatedRels.map(r => r.relationshipId),
          sourceArtifactIds: result.artifacts.map(a => a.artifactId),
          requiresHumanReview: de.confidence < 0.4 || dateInfo.precision !== 'exact',
        });
      }

      // If no pattern matched but we have a date, create a generic event
      if (matchedPatterns.length === 0) {
        events.push({
          eventId: `evt-${crypto.randomUUID().slice(0, 8)}`,
          date: dateInfo,
          category: 'other',
          title: 'Activity recorded',
          narrative: `Date ${de.value} documented in institutional records.`,
          confidence: de.confidence,
          evidenceEntityIds: [de.entityId, ...relatedEntityIds],
          evidenceRelationshipIds: relatedRels.map(r => r.relationshipId),
          sourceArtifactIds: result.artifacts.map(a => a.artifactId),
          requiresHumanReview: true,
        });
      }
    }

    // Also create events from entities without explicit dates
    for (const entity of result.entities) {
      if (entity.type === 'DATE') continue;

      // Check if this entity is already referenced by a date-based event
      const alreadyReferenced = events.some(e => e.evidenceEntityIds.includes(entity.entityId));
      if (alreadyReferenced) continue;

      // Create a year-estimated event if possible
      const patterns = findMatchingPatterns(new Map([[entity.entityId, entity]]), [], EVENT_PATTERNS);
      for (const pattern of patterns) {
        events.push({
          eventId: `evt-est-${crypto.randomUUID().slice(0, 8)}`,
          date: { value: '', precision: 'approximate_range', rationale: 'No explicit date found in source documents.' },
          category: pattern.category,
          title: pattern.titleTemplate(entityMap, []),
          narrative: `${pattern.narrativeTemplate(entityMap, [])} (date not specified — review required)`,
          confidence: entity.confidence * 0.5,
          evidenceEntityIds: [entity.entityId],
          evidenceRelationshipIds: [],
          sourceArtifactIds: result.artifacts.map(a => a.artifactId),
          requiresHumanReview: true,
        });
      }
    }

    // Sort chronologically
    events.sort((a, b) => a.date.value.localeCompare(b.date.value));

    // Determine year range
    const years = events
      .map(e => {
        const y = parseInt(e.date.value.slice(0, 4), 10);
        return isNaN(y) ? null : y;
      })
      .filter((y): y is number => y !== null);

    const eventCount = events.length;
    const requiresReviewCount = events.filter(e => e.requiresHumanReview).length;

    return {
      siteId: result.runId,
      generatedAt: new Date().toISOString(),
      events,
      yearRange: {
        start: years.length > 0 ? Math.min(...years) : null,
        end: years.length > 0 ? Math.max(...years) : null,
      },
      eventCount,
      requiresReviewCount,
    };
  }
}

// --------------------------------------------------------------------------
// Pattern matching
// --------------------------------------------------------------------------

function findMatchingPatterns(
  entities: Map<string, Entity>,
  relationships: Relationship[],
  patterns: EventPattern[],
): EventPattern[] {
  const entityTypes = new Set(Array.from(entities.values()).map(e => e.type));
  const relationshipTypes = new Set(relationships.map(r => r.type));

  return patterns.filter(pattern => {
    // Check required entity types
    if (pattern.requiredEntityTypes) {
      const hasAll = pattern.requiredEntityTypes.every(t => entityTypes.has(t));
      if (!hasAll) return false;
    }

    // Check suggested relationship types (if none required, at least one should match)
    if (!pattern.requiredEntityTypes && pattern.suggestedRelationshipTypes) {
      const hasAny = pattern.suggestedRelationshipTypes.some(t => relationshipTypes.has(t));
      if (!hasAny) return false;
    }

    return true;
  });
}
