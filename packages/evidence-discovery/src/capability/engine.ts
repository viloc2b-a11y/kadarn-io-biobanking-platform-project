// ==========================================================================
// Capability Detection — Engine
// ==========================================================================
// Sprint 20B.2.
//
// Analyzes Discovery entities, relationships, document types, and timeline
// to detect candidate institutional capabilities.
// No Claims. No Confidence Graph modification. No promotion.
// Every detection is explainable.
// ==========================================================================

import type { CandidateCapability, CapabilityCategory, CapabilityStatus, CapabilityDetectionResult } from './types';
import type { Entity, Relationship, DiscoveryResult } from '../orchestrator.js';
import type { InstitutionalTimeline, TimelineEvent } from '../timeline/types.js';

// --------------------------------------------------------------------------
// Capability detection rules
// --------------------------------------------------------------------------

interface CapabilityRule {
  claimTypeId: string;
  name: string;
  category: CapabilityCategory;
  /** Entity types that suggest this capability */
  entitySignals: { type: string; keywordPattern?: string }[];
  /** Document types that suggest this capability */
  documentSignals: string[];
  /** Relationship types that suggest this capability */
  relationshipSignals: string[];
  /** Entity value patterns (e.g. "-80°C" for freezer storage) */
  valuePatterns?: RegExp[];
  /** Minimum entity count to consider this detected vs suspected */
  minEntityCount?: number;
  /** Override minimum score to reach 'suspected' (default: 0.25).
   *  Use for rules that rely on a single signal type (e.g. document-only). */
  minScore?: number;
  /** Timeline event categories that suggest this capability */
  timelineEventCategories?: string[];
}

const CAPABILITY_RULES: CapabilityRule[] = [
  // ── Processing ──
  {
    claimTypeId: 'biospecimen.processing.pk_samples',
    name: 'PK Sample Processing',
    category: 'processing',
    entitySignals: [{ type: 'EQUIPMENT', keywordPattern: 'centrifuge' }],
    documentSignals: ['SOP', 'LAB_MANUAL'],
    relationshipSignals: ['CALIBRATION_FOR_EQUIPMENT'],
    valuePatterns: [/centrifuge/i, /pk/i, /pharmacokinetic/i],
    timelineEventCategories: ['clinical_trial', 'study_activity'],
  },
  {
    claimTypeId: 'biospecimen.processing.pbmc',
    name: 'PBMC Processing',
    category: 'processing',
    entitySignals: [{ type: 'EQUIPMENT' }, { type: 'TEMPERATURE' }],
    documentSignals: ['SOP', 'LAB_MANUAL'],
    relationshipSignals: [],
    valuePatterns: [/pbmc/i, /peripheral blood/i, /mononuclear/i],
    timelineEventCategories: ['clinical_trial', 'capability_milestone'],
  },
  {
    claimTypeId: 'biospecimen.processing.ffpe',
    name: 'FFPE Tissue Processing',
    category: 'processing',
    entitySignals: [{ type: 'EQUIPMENT' }],
    documentSignals: ['SOP', 'LAB_MANUAL', 'PROTOCOL'],
    relationshipSignals: [],
    valuePatterns: [/ffpe/i, /paraffin/i, /formalin/i, /tissue/i],
    timelineEventCategories: ['capability_milestone', 'equipment_acquisition'],
  },
  {
    claimTypeId: 'biospecimen.processing.dna_extraction',
    name: 'DNA Extraction',
    category: 'processing',
    entitySignals: [{ type: 'EQUIPMENT' }],
    documentSignals: ['SOP', 'LAB_MANUAL', 'PROTOCOL'],
    relationshipSignals: [],
    valuePatterns: [/dna/i, /extraction/i, /nucleic/i],
    timelineEventCategories: ['capability_milestone'],
  },
  {
    claimTypeId: 'biospecimen.processing.rna_extraction',
    name: 'RNA Extraction',
    category: 'processing',
    entitySignals: [{ type: 'EQUIPMENT' }],
    documentSignals: ['SOP', 'LAB_MANUAL', 'PROTOCOL'],
    relationshipSignals: [],
    valuePatterns: [/rna/i, /extraction/i, /nucleic/i],
    timelineEventCategories: ['capability_milestone'],
  },

  // ── Storage ──
  {
    claimTypeId: 'biospecimen.storage.freezer_minus_80c',
    name: '-80°C Freezer Storage',
    category: 'storage',
    entitySignals: [{ type: 'EQUIPMENT' }, { type: 'TEMPERATURE' }],
    documentSignals: ['CALIBRATION_RECORD', 'SOP'],
    relationshipSignals: ['CALIBRATION_FOR_EQUIPMENT'],
    valuePatterns: [/-80/i, /minus\s*80/i, /freezer/i],
    timelineEventCategories: ['equipment_acquisition', 'capability_milestone'],
  },
  {
    claimTypeId: 'biospecimen.storage.liquid_nitrogen',
    name: 'Liquid Nitrogen Storage',
    category: 'storage',
    entitySignals: [{ type: 'EQUIPMENT' }, { type: 'TEMPERATURE' }],
    documentSignals: ['CALIBRATION_RECORD', 'SOP'],
    relationshipSignals: ['CALIBRATION_FOR_EQUIPMENT'],
    valuePatterns: [/liquid nitrogen/i, /ln2/i, /vapor phase/i],
    timelineEventCategories: ['equipment_acquisition', 'capability_milestone'],
  },
  {
    claimTypeId: 'biospecimen.storage.refrigerated_2_8c',
    name: 'Refrigerated Storage (2-8°C)',
    category: 'storage',
    entitySignals: [{ type: 'TEMPERATURE' }],
    documentSignals: ['CALIBRATION_RECORD', 'SOP'],
    relationshipSignals: [],
    valuePatterns: [/2-8/i, /2to8/i, /refrigerat/i, /4°\s*c/i],
    timelineEventCategories: ['equipment_acquisition'],
  },

  // ── Shipping ──
  {
    claimTypeId: 'biospecimen.shipping.cold_chain',
    name: 'Cold Chain Shipping',
    category: 'shipping',
    entitySignals: [{ type: 'TEMPERATURE' }, { type: 'EQUIPMENT' }],
    documentSignals: ['SHIPMENT_LOG'],
    relationshipSignals: ['SHIPMENT_RELATED_TO_STUDY'],
    valuePatterns: [/cold chain/i, /shipment/i, /shipped/i, /temperature.*log/i],
    timelineEventCategories: ['study_activity'],
  },
  {
    claimTypeId: 'biospecimen.shipping.dry_ice',
    name: 'Dry Ice Shipping',
    category: 'shipping',
    entitySignals: [{ type: 'TEMPERATURE' }],
    documentSignals: ['SHIPMENT_LOG'],
    relationshipSignals: ['SHIPMENT_RELATED_TO_STUDY'],
    valuePatterns: [/dry ice/i, /dryice/i],
    timelineEventCategories: ['study_activity'],
  },

  // ── Regulatory ──
  {
    claimTypeId: 'biospecimen.regulatory.gcp_staff',
    name: 'GCP-Trained Staff',
    category: 'regulatory',
    entitySignals: [{ type: 'INVESTIGATOR' }],
    documentSignals: ['TRAINING_RECORD'],
    relationshipSignals: ['TRAINING_COMPLETED_BY'],
    valuePatterns: [/gcp/i, /training/i, /certificate/i],
    timelineEventCategories: ['training_completed', 'certification'],
  },
  {
    claimTypeId: 'biospecimen.regulatory.inspection_ready',
    name: 'Inspection Readiness',
    category: 'regulatory',
    entitySignals: [{ type: 'REGULATORY_BODY' }],
    documentSignals: ['FDA_LETTER'],
    relationshipSignals: [],
    valuePatterns: [/fda/i, /inspection/i, /audit/i, /regulatory/i],
    timelineEventCategories: ['regulatory_event'],
  },
  {
    claimTypeId: 'biospecimen.regulatory.sop_governance',
    name: 'SOP Governance',
    category: 'regulatory',
    entitySignals: [],
    documentSignals: ['SOP'],
    relationshipSignals: [],
    valuePatterns: [/standard operating procedure/i, /sop/i, /revision history/i],
    minScore: 0.15, // document-only signal — lower threshold
    timelineEventCategories: ['certification', 'regulatory_event'],
  },

  // ── Operations ──
  {
    claimTypeId: 'biospecimen.operations.phase_i_experience',
    name: 'Phase I Study Experience',
    category: 'operations',
    entitySignals: [{ type: 'SPONSOR' }, { type: 'STUDY' }],
    documentSignals: ['PROTOCOL', 'STUDY_CLOSEOUT_LETTER'],
    relationshipSignals: ['STUDY_SPONSORED_BY'],
    valuePatterns: [/phase\s*i/i, /phase\s*1/i, /first.in.human/i, /fih/i],
    timelineEventCategories: ['clinical_trial', 'study_activity'],
  },
  {
    claimTypeId: 'biospecimen.operations.study_completion_history',
    name: 'Study Completion History',
    category: 'operations',
    entitySignals: [{ type: 'STUDY' }, { type: 'SPONSOR' }],
    documentSignals: ['STUDY_CLOSEOUT_LETTER', 'PROTOCOL'],
    relationshipSignals: ['STUDY_SPONSORED_BY', 'STUDY_MANAGED_BY_CRO'],
    valuePatterns: [/study/i, /protocol/i, /clinical/i, /trial/i],
    timelineEventCategories: ['study_activity', 'clinical_trial'],
  },
  {
    claimTypeId: 'biospecimen.operations.recruitment_therapeutic_area',
    name: 'Patient Recruitment Capability',
    category: 'operations',
    entitySignals: [{ type: 'INSTITUTION' }, { type: 'SPONSOR' }],
    documentSignals: ['PROTOCOL', 'STUDY_CLOSEOUT_LETTER'],
    relationshipSignals: ['STUDY_SPONSORED_BY'],
    valuePatterns: [/recruit/i, /enroll/i, /patient/i, /subject/i],
    timelineEventCategories: ['study_activity'],
  },

  // ── Therapeutic Areas ──
  {
    claimTypeId: 'biospecimen.therapeutic_area.oncology',
    name: 'Oncology Research',
    category: 'therapeutic_area',
    entitySignals: [{ type: 'SPONSOR' }],
    documentSignals: ['PROTOCOL'],
    relationshipSignals: ['STUDY_SPONSORED_BY'],
    valuePatterns: [/oncology/i, /cancer/i, /tumor/i, /neoplasm/i],
    timelineEventCategories: ['clinical_trial', 'publication'],
  },
];

// --------------------------------------------------------------------------
// Detection engine
// --------------------------------------------------------------------------

export class CapabilityDetector {
  /**
   * Detect candidate capabilities from Discovery results.
   * No Claims. No Evidence Core writes. No promotion.
   */
  detect(
    result: DiscoveryResult,
    timeline?: InstitutionalTimeline,
  ): CapabilityDetectionResult {
    const capabilities: CandidateCapability[] = [];
    const entityMap = new Map(result.entities.map(e => [e.entityId, e]));
    const relationshipTypes = new Set(result.relationships.map(r => r.type));
    const classificationTypes = new Set(result.classifications.map(c => c.documentType));
    const classificationDocTypeValues = result.classifications.map(c => c.documentType);
    const entityValues = Array.from(entityMap.values()).map(e => e.value);
    const entityTypes = new Set(Array.from(entityMap.values()).map(e => e.type));

    // Build entity text for pattern matching
    const entityText = entityValues.join(' ').toLowerCase();
    // Also check classification document types as text signals
    const classificationText = classificationDocTypeValues.join(' ').toLowerCase();
    const allText = `${entityText} ${classificationText}`;

    for (const rule of CAPABILITY_RULES) {
      let score = 0;
      const supportingEntityIds: string[] = [];
      const supportingRelationshipIds: string[] = [];
      const supportingArtifactIds: string[] = [...result.artifacts.map(a => a.artifactId)];

      // Check entity type signals
      for (const signal of rule.entitySignals) {
        if (entityTypes.has(signal.type)) {
          score += 0.2;
          // Find matching entities
          for (const [id, entity] of entityMap) {
            if (entity.type === signal.type) {
              if (!supportingEntityIds.includes(id)) supportingEntityIds.push(id);
            }
          }
        }
      }

      // Check value patterns (against entity values AND classification document types)
      if (rule.valuePatterns) {
        for (const pattern of rule.valuePatterns) {
          if (pattern.test(allText)) {
            score += 0.25;
          }
        }
      }

      // Check document types
      for (const docType of rule.documentSignals) {
        if (classificationTypes.has(docType)) {
          score += 0.15;
        }
      }

      // Check relationship signals
      for (const relType of rule.relationshipSignals) {
        if (relationshipTypes.has(relType)) {
          score += 0.15;
          const matchingRels = result.relationships.filter(r => r.type === relType);
          for (const rel of matchingRels) {
            if (!supportingRelationshipIds.includes(rel.relationshipId)) {
              supportingRelationshipIds.push(rel.relationshipId);
            }
          }
        }
      }

      // Check timeline integration
      const supportingEventIds: string[] = [];
      if (timeline && rule.timelineEventCategories && rule.timelineEventCategories.length > 0) {
        for (const event of timeline.events) {
          let match = false;

          // Match by category
          if (rule.timelineEventCategories.includes(event.category)) {
            match = true;
          }

          // Match by value patterns in title/narrative
          if (!match && rule.valuePatterns) {
            const eventText = `${event.title} ${event.narrative}`.toLowerCase();
            for (const pattern of rule.valuePatterns) {
              if (pattern.test(eventText)) {
                match = true;
                break;
              }
            }
          }

          if (match) {
            supportingEventIds.push(event.eventId);
          }
        }

        if (supportingEventIds.length > 0) {
          score += 0.15;
        }
      }

      // Determine status using rule-specific minScore or default
      const suspectedThreshold = rule.minScore ?? 0.25;

      let status: CapabilityStatus;
      let confidence: number;

      if (score >= 0.6) {
        status = 'detected';
        confidence = Math.min(score, 0.9);
      } else if (score >= suspectedThreshold) {
        status = 'suspected';
        confidence = score;
      } else {
        continue; // skip — insufficient evidence
      }

      capabilities.push({
        capabilityId: `cap-${crypto.randomUUID().slice(0, 8)}`,
        claimTypeId: rule.claimTypeId,
        name: rule.name,
        category: rule.category,
        status,
        confidence: Math.round(confidence * 100) / 100,
        supportingEntityIds,
        supportingRelationshipIds,
        supportingArtifactIds,
        supportingEventIds,
        reasoning: buildReasoning(rule, score, status, supportingEventIds.length),
      });
    }

    const totalDetected = capabilities.filter(c => c.status === 'detected').length;
    const totalSuspected = capabilities.filter(c => c.status === 'suspected').length;

    return {
      capabilities,
      totalDetected,
      totalSuspected,
      generatedAt: new Date().toISOString(),
    };
  }
}

// --------------------------------------------------------------------------
// Reasoning builder
// --------------------------------------------------------------------------

function buildReasoning(rule: CapabilityRule, score: number, status: CapabilityStatus, timelineEventCount: number): string {
  const parts: string[] = [];
  parts.push(`Capability: ${rule.name}`);
  parts.push(`Detection score: ${(score * 100).toFixed(0)}%`);
  parts.push(`Status: ${status === 'detected' ? 'Detected' : 'Suspected'}`);

  if (rule.entitySignals.length > 0) {
    const entityTypes = rule.entitySignals.map(s => s.type).join(', ');
    parts.push(`Entity signals: ${entityTypes}`);
  }
  if (rule.documentSignals.length > 0) {
    parts.push(`Document types: ${rule.documentSignals.join(', ')}`);
  }
  if (rule.valuePatterns && rule.valuePatterns.length > 0) {
    parts.push(`Value patterns matched`);
  }
  if (timelineEventCount > 0) {
    parts.push(`Timeline events: ${timelineEventCount}`);
  }

  return parts.join('. ');
}
