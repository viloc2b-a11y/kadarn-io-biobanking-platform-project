// ==========================================================================
// ClinicalTrials.gov — Conservative Claim Mapper
// ==========================================================================
// Baseline AF-1.0. Sprint 19.1.
//
// Rules:
// - CT.gov participation is evidence of study participation, not operational
//   excellence.
// - Completed study → study completion history.
// - Recruiting status → current operational activity.
// - Do NOT infer biospecimen capability unless protocol explicitly mentions it.
// ==========================================================================

import type { CTGovStudy } from './types.js';

// --------------------------------------------------------------------------
// Biospecimen keywords — only these trigger biospecimen claim mapping
// --------------------------------------------------------------------------

const BIOSPECIMEN_KEYWORDS = [
  'biospecimen', 'tissue', 'biopsy', 'ffpe', 'paraffin',
  'frozen section', 'blood draw', 'plasma', 'serum',
  'biobank', 'specimen collection', 'tumor sample',
];

function mentionsBiospecimen(study: CTGovStudy): boolean {
  const searchText = `${study.title} ${study.conditions.join(' ')}`.toLowerCase();
  return BIOSPECIMEN_KEYWORDS.some(kw => searchText.includes(kw));
}

// --------------------------------------------------------------------------
// Claim mapping
// --------------------------------------------------------------------------

export interface ClaimMapping {
  claimTypeId: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Map a CT.gov study to relevant Claims.
 * Conservative by design — only map what is clearly supported.
 */
export function mapStudyToClaims(study: CTGovStudy): ClaimMapping[] {
  const mappings: ClaimMapping[] = [];

  // Study completion history: always if completed
  if (study.recruitmentStatus === 'Completed') {
    mappings.push({
      claimTypeId: 'biospecimen.operations.study_completion_history',
      confidence: 'high',
      reason: `Study ${study.nctId} completed. Supports study completion history.`,
    });
  }

  // Recruitment capability: always if currently recruiting
  if (study.recruitmentStatus === 'Recruiting' || study.recruitmentStatus === 'Active, not recruiting') {
    mappings.push({
      claimTypeId: 'biospecimen.operations.recruitment_therapeutic_area',
      confidence: 'medium',
      reason: `Study ${study.nctId} in "${study.recruitmentStatus}" status. Supports current recruitment capability.`,
    });
  }

  // Phase I experience
  if (study.studyPhase && (study.studyPhase.includes('Phase 1') || study.studyPhase.includes('Phase I'))) {
    mappings.push({
      claimTypeId: 'biospecimen.operations.phase_i_experience',
      confidence: 'high',
      reason: `Study ${study.nctId} is Phase ${study.studyPhase}. Supports Phase I experience.`,
    });
  }

  // Biospecimen capability — ONLY if protocol explicitly mentions biospecimens
  if (study.mentionsBiospecimen || mentionsBiospecimen(study)) {
    mappings.push({
      claimTypeId: 'biospecimen.processing.ffpe',
      confidence: 'low',
      reason: `Study ${study.nctId} mentions biospecimen-related terms. Supports biospecimen processing capability (low confidence without protocol detail).`,
    });
  }

  return mappings;
}
