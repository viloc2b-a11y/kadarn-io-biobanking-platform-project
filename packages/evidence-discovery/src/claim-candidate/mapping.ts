// ==========================================================================
// Claim Candidate Detection — Mapping Rules
// ==========================================================================
// Sprint 20B.3.
//
// Defines how detected capabilities map to suggested claim taxonomy paths
// and what evidence is required to consider a claim candidate valid.
// No Claims. No Evidence Core writes. No promotion.
// ==========================================================================

import type { MissingEvidenceItem } from './types';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface ClaimMappingRule {
  /** Source capability claimTypeId */
  sourceCapabilityId: string;
  /** Suggested taxonomy path for the claim */
  suggestedTaxonomy: string;
  /** Template for the claim summary */
  summaryTemplate: string;
  /** Entity types required to support this claim */
  requiredEntityTypes: string[];
  /** Document types required */
  requiredDocumentTypes: string[];
  /** Relationship types required */
  requiredRelationshipTypes: string[];
  /** Timeline event categories that are relevant */
  relevantEventCategories: string[];
  /** Minimum evidence coverage to be 'candidate' vs 'insufficient_evidence' */
  minCoverageForCandidate: number;
}

// --------------------------------------------------------------------------
// Default mapping rules — 1:1 capability → claim taxonomy
// --------------------------------------------------------------------------

const CLAIM_MAPPING_RULES: ClaimMappingRule[] = [
  // ── Processing ──
  {
    sourceCapabilityId: 'biospecimen.processing.pbmc',
    suggestedTaxonomy: 'biospecimen.processing.pbmc',
    summaryTemplate: 'Site demonstrates PBMC processing capability',
    requiredEntityTypes: ['EQUIPMENT', 'TEMPERATURE'],
    requiredDocumentTypes: ['SOP', 'LAB_MANUAL'],
    requiredRelationshipTypes: ['CALIBRATION_FOR_EQUIPMENT'],
    relevantEventCategories: ['capability_milestone', 'equipment_acquisition'],
    minCoverageForCandidate: 0.5,
  },
  {
    sourceCapabilityId: 'biospecimen.processing.ffpe',
    suggestedTaxonomy: 'biospecimen.processing.ffpe',
    summaryTemplate: 'Site demonstrates FFPE tissue processing capability',
    requiredEntityTypes: ['EQUIPMENT'],
    requiredDocumentTypes: ['SOP', 'PROTOCOL'],
    requiredRelationshipTypes: [],
    relevantEventCategories: ['capability_milestone'],
    minCoverageForCandidate: 0.4,
  },
  {
    sourceCapabilityId: 'biospecimen.processing.pk_samples',
    suggestedTaxonomy: 'biospecimen.processing.pk_samples',
    summaryTemplate: 'Site demonstrates PK sample processing capability',
    requiredEntityTypes: ['EQUIPMENT'],
    requiredDocumentTypes: ['SOP'],
    requiredRelationshipTypes: ['CALIBRATION_FOR_EQUIPMENT'],
    relevantEventCategories: ['clinical_trial', 'study_activity'],
    minCoverageForCandidate: 0.4,
  },
  {
    sourceCapabilityId: 'biospecimen.processing.nucleic_extraction',
    suggestedTaxonomy: 'biospecimen.processing.nucleic_extraction',
    summaryTemplate: 'Site demonstrates nucleic acid extraction capability',
    requiredEntityTypes: ['EQUIPMENT'],
    requiredDocumentTypes: ['SOP', 'PROTOCOL'],
    requiredRelationshipTypes: [],
    relevantEventCategories: ['capability_milestone'],
    minCoverageForCandidate: 0.4,
  },

  // ── Storage ──
  {
    sourceCapabilityId: 'biospecimen.storage.freezer_minus_80c',
    suggestedTaxonomy: 'biospecimen.storage.freezer_minus_80c',
    summaryTemplate: 'Site maintains -80°C freezer storage capability',
    requiredEntityTypes: ['EQUIPMENT', 'TEMPERATURE'],
    requiredDocumentTypes: ['CALIBRATION_RECORD', 'SOP'],
    requiredRelationshipTypes: ['CALIBRATION_FOR_EQUIPMENT'],
    relevantEventCategories: ['equipment_acquisition', 'capability_milestone'],
    minCoverageForCandidate: 0.5,
  },
  {
    sourceCapabilityId: 'biospecimen.storage.cryogenic',
    suggestedTaxonomy: 'biospecimen.storage.cryogenic',
    summaryTemplate: 'Site maintains cryogenic (liquid nitrogen) storage capability',
    requiredEntityTypes: ['EQUIPMENT', 'TEMPERATURE'],
    requiredDocumentTypes: ['CALIBRATION_RECORD'],
    requiredRelationshipTypes: ['CALIBRATION_FOR_EQUIPMENT'],
    relevantEventCategories: ['equipment_acquisition'],
    minCoverageForCandidate: 0.5,
  },
  {
    sourceCapabilityId: 'biospecimen.storage.refrigerated_2_8c',
    suggestedTaxonomy: 'biospecimen.storage.refrigerated_2_8c',
    summaryTemplate: 'Site maintains refrigerated storage (2-8°C) capability',
    requiredEntityTypes: ['TEMPERATURE'],
    requiredDocumentTypes: ['CALIBRATION_RECORD'],
    requiredRelationshipTypes: [],
    relevantEventCategories: ['equipment_acquisition'],
    minCoverageForCandidate: 0.3,
  },

  // ── Shipping ──
  {
    sourceCapabilityId: 'biospecimen.shipping.cold_chain',
    suggestedTaxonomy: 'biospecimen.shipping.cold_chain',
    summaryTemplate: 'Site demonstrates cold chain shipping capability',
    requiredEntityTypes: ['TEMPERATURE', 'EQUIPMENT'],
    requiredDocumentTypes: ['SHIPMENT_LOG'],
    requiredRelationshipTypes: ['SHIPMENT_RELATED_TO_STUDY'],
    relevantEventCategories: ['study_activity'],
    minCoverageForCandidate: 0.5,
  },
  {
    sourceCapabilityId: 'biospecimen.shipping.dry_ice',
    suggestedTaxonomy: 'biospecimen.shipping.dry_ice',
    summaryTemplate: 'Site demonstrates dry ice shipping capability',
    requiredEntityTypes: ['TEMPERATURE'],
    requiredDocumentTypes: ['SHIPMENT_LOG'],
    requiredRelationshipTypes: ['SHIPMENT_RELATED_TO_STUDY'],
    relevantEventCategories: ['study_activity'],
    minCoverageForCandidate: 0.4,
  },

  // ── Regulatory ──
  {
    sourceCapabilityId: 'biospecimen.regulatory.gcp_staff',
    suggestedTaxonomy: 'biospecimen.regulatory.gcp_staff',
    summaryTemplate: 'Site has GCP-trained research staff',
    requiredEntityTypes: ['INVESTIGATOR'],
    requiredDocumentTypes: ['TRAINING_RECORD'],
    requiredRelationshipTypes: ['TRAINING_COMPLETED_BY'],
    relevantEventCategories: ['training_completed', 'certification'],
    minCoverageForCandidate: 0.5,
  },
  {
    sourceCapabilityId: 'biospecimen.regulatory.sop_governance',
    suggestedTaxonomy: 'biospecimen.regulatory.sop_governance',
    summaryTemplate: 'Site demonstrates SOP governance framework',
    requiredEntityTypes: [],
    requiredDocumentTypes: ['SOP'],
    requiredRelationshipTypes: [],
    relevantEventCategories: ['certification', 'regulatory_event'],
    minCoverageForCandidate: 0.3,
  },
  {
    sourceCapabilityId: 'biospecimen.regulatory.inspection_ready',
    suggestedTaxonomy: 'biospecimen.regulatory.inspection_ready',
    summaryTemplate: 'Site demonstrates regulatory inspection readiness',
    requiredEntityTypes: ['REGULATORY_BODY'],
    requiredDocumentTypes: ['FDA_LETTER'],
    requiredRelationshipTypes: [],
    relevantEventCategories: ['regulatory_event'],
    minCoverageForCandidate: 0.3,
  },

  // ── Operations ──
  {
    sourceCapabilityId: 'biospecimen.operations.phase_i_experience',
    suggestedTaxonomy: 'biospecimen.operations.phase_i_experience',
    summaryTemplate: 'Site has Phase I clinical trial experience',
    requiredEntityTypes: ['SPONSOR', 'STUDY'],
    requiredDocumentTypes: ['PROTOCOL', 'STUDY_CLOSEOUT_LETTER'],
    requiredRelationshipTypes: ['STUDY_SPONSORED_BY'],
    relevantEventCategories: ['clinical_trial', 'study_activity'],
    minCoverageForCandidate: 0.5,
  },
  {
    sourceCapabilityId: 'biospecimen.operations.study_completion_history',
    suggestedTaxonomy: 'biospecimen.operations.study_completion_history',
    summaryTemplate: 'Site has study completion track record',
    requiredEntityTypes: ['STUDY', 'SPONSOR'],
    requiredDocumentTypes: ['STUDY_CLOSEOUT_LETTER'],
    requiredRelationshipTypes: ['STUDY_SPONSORED_BY'],
    relevantEventCategories: ['study_activity'],
    minCoverageForCandidate: 0.4,
  },
  {
    sourceCapabilityId: 'biospecimen.operations.recruitment_therapeutic_area',
    suggestedTaxonomy: 'biospecimen.operations.recruitment_therapeutic_area',
    summaryTemplate: 'Site demonstrates patient recruitment capability',
    requiredEntityTypes: ['INSTITUTION', 'SPONSOR'],
    requiredDocumentTypes: ['PROTOCOL'],
    requiredRelationshipTypes: ['STUDY_SPONSORED_BY'],
    relevantEventCategories: ['study_activity'],
    minCoverageForCandidate: 0.4,
  },

  // ── Therapeutic Areas ──
  {
    sourceCapabilityId: 'biospecimen.therapeutic_area.oncology',
    suggestedTaxonomy: 'biospecimen.therapeutic_area.oncology',
    summaryTemplate: 'Site has oncology research experience',
    requiredEntityTypes: ['SPONSOR'],
    requiredDocumentTypes: ['PROTOCOL'],
    requiredRelationshipTypes: ['STUDY_SPONSORED_BY'],
    relevantEventCategories: ['clinical_trial', 'publication'],
    minCoverageForCandidate: 0.4,
  },
];

// --------------------------------------------------------------------------
// Registry
// --------------------------------------------------------------------------

export const DEFAULT_CLAIM_MAPPINGS = CLAIM_MAPPING_RULES;

export class ClaimMappingRegistry {
  private rules: Map<string, ClaimMappingRule>;

  constructor(rules?: ClaimMappingRule[]) {
    this.rules = new Map();
    const entries = rules ?? CLAIM_MAPPING_RULES;
    for (const rule of entries) {
      this.rules.set(rule.sourceCapabilityId, rule);
    }
  }

  /** Get mapping rule for a capability ID */
  getRule(sourceCapabilityId: string): ClaimMappingRule | undefined {
    return this.rules.get(sourceCapabilityId);
  }

  /** Get all registered rules */
  getAllRules(): ClaimMappingRule[] {
    return Array.from(this.rules.values());
  }
}
