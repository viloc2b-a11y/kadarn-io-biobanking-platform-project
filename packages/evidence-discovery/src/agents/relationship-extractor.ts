// ==========================================================================
// Evidence Discovery — Relationship Extractor Agent
// ==========================================================================
// Sprint 20A.4B.
//
// Links entities detected by EntityExtractorAgent into typed relationships.
// May consume prior entity extraction output for context.
// Deterministic, pattern-based. No LLM.
// ==========================================================================

import type { DiscoveryAgent, AgentContext, AgentResult, AgentProvenance } from './framework/types.js';
import type { SemanticRequestType } from '../preparation/types.js';
import type { ExtractedEntity } from './entity-extractor.js';
import crypto from 'node:crypto';

// --------------------------------------------------------------------------
// Relationship types
// --------------------------------------------------------------------------

export type RelationshipType =
  | 'INVESTIGATOR_AT_INSTITUTION'
  | 'STUDY_SPONSORED_BY'
  | 'STUDY_MANAGED_BY_CRO'
  | 'EQUIPMENT_SUPPORTS_CAPABILITY'
  | 'DOCUMENT_REFERENCES_STUDY'
  | 'DOCUMENT_EFFECTIVE_ON_DATE'
  | 'CALIBRATION_FOR_EQUIPMENT'
  | 'TRAINING_COMPLETED_BY'
  | 'SHIPMENT_RELATED_TO_STUDY'
  | 'LOCATION_ASSOCIATED_WITH_INSTITUTION'
  | 'UNKNOWN_RELATIONSHIP';

export interface ExtractedRelationship {
  relationshipId: string;
  type: RelationshipType;
  sourceEntityId: string;
  targetEntityId: string;
  confidence: number;
  sourceSpan: string;
  rationale: string;
  requiresHumanReview: boolean;
}

export interface RelationshipExtractorOutput {
  relationships: ExtractedRelationship[];
  /** Entities used for extraction context */
  entityCount: number;
}

// --------------------------------------------------------------------------
// Relationship rules
// --------------------------------------------------------------------------

interface RelationshipRule {
  type: RelationshipType;
  /** Entity types that must exist as source */
  sourceTypes: string[];
  /** Entity types that must exist as target */
  targetTypes: string[];
  /** Signal keywords in the markdown that suggest this relationship */
  signals: string[];
  weight: number;
}

const RELATIONSHIP_RULES: RelationshipRule[] = [
  {
    type: 'INVESTIGATOR_AT_INSTITUTION',
    sourceTypes: ['INVESTIGATOR'],
    targetTypes: ['INSTITUTION'],
    signals: ['at the', 'department of', 'institution', 'university of', 'hospital', 'clinic'],
    weight: 0.3,
  },
  {
    type: 'STUDY_SPONSORED_BY',
    sourceTypes: ['STUDY', 'PROTOCOL_ID'],
    targetTypes: ['SPONSOR'],
    signals: ['sponsored by', 'sponsor', 'funding', 'funded by'],
    weight: 0.3,
  },
  {
    type: 'STUDY_MANAGED_BY_CRO',
    sourceTypes: ['STUDY', 'PROTOCOL_ID'],
    targetTypes: ['CRO'],
    signals: ['cro', 'laboratory', 'central lab', 'managed by'],
    weight: 0.25,
  },
  {
    type: 'DOCUMENT_REFERENCES_STUDY',
    sourceTypes: ['DOCUMENT_VERSION'],
    targetTypes: ['STUDY', 'PROTOCOL_ID'],
    signals: ['protocol', 'study', 'nct', 'clinical trial'],
    weight: 0.2,
  },
  {
    type: 'DOCUMENT_EFFECTIVE_ON_DATE',
    sourceTypes: ['DOCUMENT_VERSION'],
    targetTypes: ['DATE'],
    signals: ['effective', 'issued', 'approved', 'date'],
    weight: 0.2,
  },
  {
    type: 'CALIBRATION_FOR_EQUIPMENT',
    sourceTypes: ['DATE'],
    targetTypes: ['EQUIPMENT'],
    signals: ['calibration', 'calibrated', 'certificate', 'due date'],
    weight: 0.25,
  },
  {
    type: 'SHIPMENT_RELATED_TO_STUDY',
    sourceTypes: ['DATE'],
    targetTypes: ['STUDY', 'PROTOCOL_ID'],
    signals: ['shipment', 'shipped', 'sample', 'specimen'],
    weight: 0.2,
  },
  {
    type: 'LOCATION_ASSOCIATED_WITH_INSTITUTION',
    sourceTypes: ['LOCATION'],
    targetTypes: ['INSTITUTION'],
    signals: [','],
    weight: 0.2,
  },
];

export class RelationshipExtractorAgent implements DiscoveryAgent {
  readonly name = 'relationship-extractor';
  readonly version = '0.1.0';

  supports(requestType: SemanticRequestType): boolean {
    return requestType === 'RELATIONSHIP_EXTRACTION';
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    const markdown = context.layer1Markdown.toLowerCase();

    // For deterministic extraction without prior entity output,
    // run a lightweight extraction inline
    const { EntityExtractorAgent } = await import('./entity-extractor.js');
    const tempExtractor = new EntityExtractorAgent();
    const tempResult = await tempExtractor.run(context);
    const entities = (tempResult.output as any).entities as ExtractedEntity[] ?? [];

    // Build lookup by type
    const byType = new Map<string, ExtractedEntity[]>();
    for (const entity of entities) {
      if (!byType.has(entity.type)) byType.set(entity.type, []);
      byType.get(entity.type)!.push(entity);
    }

    const relationships: ExtractedRelationship[] = [];
    const seen = new Set<string>();

    for (const rule of RELATIONSHIP_RULES) {
      const sources = rule.sourceTypes.flatMap(t => byType.get(t) ?? []);
      const targets = rule.targetTypes.flatMap(t => byType.get(t) ?? []);

      // Check if signal keywords exist in document
      const hasSignal = rule.signals.some(s => markdown.includes(s));
      if (!hasSignal && rule.signals.length > 0) continue;

      for (const source of sources) {
        for (const target of targets) {
          if (source.entityId === target.entityId) continue;

          const key = `${rule.type}:${source.entityId}:${target.entityId}`;
          if (seen.has(key)) continue;
          seen.add(key);

          // Check proximity: entities found near each other in text
          const sourceIdx = markdown.indexOf(source.value.toLowerCase());
          const targetIdx = markdown.indexOf(target.value.toLowerCase());
          const proximityOk = sourceIdx === -1 || targetIdx === -1 ||
            Math.abs(sourceIdx - targetIdx) < 2000;

          if (!proximityOk) continue;

          relationships.push({
            relationshipId: `rel-${crypto.randomUUID().slice(0, 8)}`,
            type: rule.type,
            sourceEntityId: source.entityId,
            targetEntityId: target.entityId,
            confidence: rule.weight * (source.confidence + target.confidence) / 2,
            sourceSpan: `${source.value} → ${target.value}`,
            rationale: `${source.type} "${source.value}" related to ${target.type} "${target.value}" (${rule.type})`,
            requiresHumanReview: rule.weight < 0.2,
          });
        }
      }
    }

    const output: RelationshipExtractorOutput = {
      relationships,
      entityCount: entities.length,
    };

    const confidence = relationships.length > 0
      ? Math.min(relationships.reduce((s, r) => s + r.confidence, 0) / relationships.length, 0.85)
      : 0;

    const completedAt = new Date().toISOString();
    const provenance: AgentProvenance = {
      agentName: this.name, agentVersion: this.version,
      pipelineVersion: context.pipelineVersion, modelVersion: null,
      startedAt, completedAt,
      inputHash: crypto.createHash('sha256').update(markdown).digest('hex').slice(0, 16),
      layer1Id: context.layer1Id, artifactId: context.artifactId,
    };

    return {
      requestId: context.requestId, agentName: this.name, agentVersion: this.version,
      status: 'COMPLETED',
      output: output as unknown as Record<string, unknown>,
      confidence,
      warnings: [],
      provenance,
    };
  }
}
