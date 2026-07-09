// ==========================================================================
// KTP-1.3 — Hybrid Trial Readiness Derivation
// ==========================================================================
// Pure function: derives hybrid trial readiness claims from onboarding
// answers. Respects UNKNOWN, N/A, DECLARED_ONLY, SUPPORTED_BY_EVIDENCE.
//
// Design contract:
//   - Pure function: same input → same output
//   - Stateless: no side effects
//   - Deterministic: no Date.now(), no randomness
//   - Non-persistent: returns data, never writes to state
// ==========================================================================

import type { EvidenceSupport } from './derived-read-models/types'
import {
  computeEvidenceSupportLevel,
  filterActiveClaims,
  isClaimMet,
} from '@kadarn/readiness-engine'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface HybridClaimResult {
  claimId: string
  claimLabel: string
  evidenceSupport: EvidenceSupport
  confidence: number
  isMandatory: boolean
  canBeNA: boolean
  responses: Record<string, unknown>
  gaps: string[]
}

export interface HybridReadinessOutput {
  claims: HybridClaimResult[]
  mandatoryMet: number
  mandatoryTotal: number
  optionalMet: number
  optionalTotal: number
  overallConfidence: number
  readinessStatus: 'not_ready' | 'partial' | 'conditionally_ready' | 'ready'
  summary: string
}

// --------------------------------------------------------------------------
// Claim definitions mapped to interview question IDs
// --------------------------------------------------------------------------

interface ClaimMapping {
  claimId: string
  claimLabel: string
  isMandatory: boolean
  canBeNA: boolean
  /** Questions that provide Class B evidence (documentary) */
  classBQuestions: string[]
  /** Questions that provide Class C evidence (operational) */
  classCQuestions: string[]
  /** Gate question — if 'no', entire claim is N/A */
  gateQuestion?: string
}

const CLAIM_MAPPINGS: ClaimMapping[] = [
  {
    claimId: 'clinical_trials.hybrid.site_execution',
    claimLabel: 'Site-Based Execution',
    isMandatory: true,
    canBeNA: false,
    classBQuestions: ['ht_site_visit_sop'],
    classCQuestions: ['ht_site_dedicated_space', 'ht_site_exam_rooms', 'ht_site_staff_deployed'],
  },
  {
    claimId: 'clinical_trials.hybrid.at_home_coordination',
    claimLabel: 'At-Home Coordination',
    isMandatory: true,
    canBeNA: true,
    gateQuestion: 'ht_has_home_visits',
    classBQuestions: ['ht_home_resp_matrix', 'ht_home_workflow_sop', 'ht_home_comm_workflow', 'ht_home_escalation_pathway'],
    classCQuestions: ['ht_home_providers_contracted', 'ht_home_patient_comm'],
  },
  {
    claimId: 'clinical_trials.hybrid.data_integrity',
    claimLabel: 'Hybrid Data Integrity',
    isMandatory: true,
    canBeNA: false,
    classBQuestions: ['ht_data_source_doc_sop', 'ht_data_integrity_sop', 'ht_data_workflow_documented', 'ht_data_query_process', 'ht_data_review_workflow'],
    classCQuestions: ['ht_data_audit_trail', 'ht_data_ehr_edc_platforms'],
  },
  {
    claimId: 'clinical_trials.hybrid.patient_access_diversity',
    claimLabel: 'Patient Access & Diversity',
    isMandatory: true,
    canBeNA: true,
    classBQuestions: ['ht_patient_panel_documented', 'ht_language_access_doc'],
    classCQuestions: ['ht_patient_panel_size', 'ht_geo_reach', 'ht_languages', 'ht_underserved_access', 'ht_retention_tracked'],
  },
  {
    claimId: 'clinical_trials.hybrid.biospecimen_at_home',
    claimLabel: 'Biospecimen-at-Home',
    isMandatory: true,
    canBeNA: true,
    gateQuestion: 'ht_has_bio_home',
    classBQuestions: ['ht_bio_collection_sop', 'ht_custody_sop', 'ht_ship_courier_workflow', 'ht_bio_sample_workflow'],
    classCQuestions: ['ht_bio_specimen_types_home', 'ht_temp_monitoring_home', 'ht_temp_excursion_process', 'ht_temp_packaging_validated', 'ht_custody_documentation', 'ht_ship_provider_count'],
  },
  {
    claimId: 'clinical_trials.hybrid.remote_monitoring',
    claimLabel: 'Remote Monitoring',
    isMandatory: false,
    canBeNA: true,
    gateQuestion: 'ht_has_remote_mon',
    classBQuestions: ['ht_rm_monitoring_sop', 'ht_rm_device_sop', 'ht_rm_patient_training'],
    classCQuestions: ['ht_rm_data_ingestion', 'ht_rm_alert_mgmt', 'ht_rm_device_types'],
  },
  {
    claimId: 'clinical_trials.hybrid.vendor_nurse_coordination',
    claimLabel: 'Vendor / Home Nurse Coordination',
    isMandatory: true,
    canBeNA: true,
    gateQuestion: 'ht_has_home_visits',
    classBQuestions: ['ht_vendor_qual_sop', 'ht_vendor_training_sop'],
    classCQuestions: ['ht_vendor_perf_tracking'],
  },
  {
    claimId: 'clinical_trials.hybrid.protocol_compliance',
    claimLabel: 'Protocol Compliance Documentation',
    isMandatory: true,
    canBeNA: false,
    classBQuestions: ['ht_compliance_deviation_sop', 'ht_compliance_monitoring_sop'],
    classCQuestions: ['ht_compliance_capa_linked'],
  },
  {
    claimId: 'clinical_trials.hybrid.safety_escalation',
    claimLabel: 'Safety Escalation',
    isMandatory: true,
    canBeNA: false,
    classBQuestions: ['ht_safety_escalation_sop', 'ht_safety_emergency_sop'],
    classCQuestions: ['ht_safety_drills', 'ht_safety_drill_freq', 'ht_safety_ae_reporting'],
  },
  {
    claimId: 'clinical_trials.hybrid.historical_experience',
    claimLabel: 'Hybrid Trial Historical Experience',
    isMandatory: false,
    canBeNA: true,
    gateQuestion: 'ht_has_hybrid_exp',
    classBQuestions: [],
    classCQuestions: ['ht_hybrid_exp_count', 'ht_hybrid_exp_phases', 'ht_hybrid_exp_components', 'ht_hybrid_exp_therapeutic'],
  },
]

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

function isExplicitNA(value: unknown): boolean {
  return value === 'na' || value === 'no'
}

function isYesOrUploaded(value: unknown): boolean {
  if (typeof value === 'string') {
    return value === 'yes' || value === 'yes_uploaded'
  }
  return false
}

function computeClaimResult(
  mapping: ClaimMapping,
  answers: Record<string, unknown>,
  uploadedDocLabels: string[] = [],
): HybridClaimResult {
  const { claimId, claimLabel, isMandatory, canBeNA, gateQuestion, classBQuestions, classCQuestions } = mapping

  // Check gate for N/A
  if (gateQuestion && canBeNA) {
    const gateAnswer = answers[gateQuestion]
    if (isExplicitNA(gateAnswer)) {
      return {
        claimId, claimLabel,
        evidenceSupport: 'NOT_APPLICABLE',
        confidence: 1.0,
        isMandatory, canBeNA,
        responses: { [gateQuestion]: gateAnswer },
        gaps: [],
      }
    }
    // Gate not answered → UNKNOWN
    if (!isAnswered(gateAnswer)) {
      return {
        claimId, claimLabel,
        evidenceSupport: 'UNKNOWN',
        confidence: 0,
        isMandatory, canBeNA,
        responses: {},
        gaps: [`Gate question '${gateQuestion}' not answered`],
      }
    }
  }

  // Count answered questions per evidence class
  const bAnswered = classBQuestions.filter((q) => isAnswered(answers[q])).length
  const bTotal = classBQuestions.length
  const cAnswered = classCQuestions.filter((q) => isAnswered(answers[q])).length
  const cTotal = classCQuestions.length

  // No evidence at all → UNKNOWN
  if (bAnswered === 0 && cAnswered === 0) {
    return {
      claimId, claimLabel,
      evidenceSupport: 'UNKNOWN',
      confidence: 0,
      isMandatory, canBeNA,
      responses: {},
      gaps: ['No evidence collected for this claim'],
    }
  }

  // Determine evidence support
  let evidenceSupport: EvidenceSupport
  let confidence: number
  const gaps: string[] = []

  if (bAnswered > 0 && cAnswered === 0) {
    // Class B only → DECLARED_ONLY, cap at 0.40
    evidenceSupport = 'DECLARED_ONLY'
    confidence = Math.min(0.40, (bAnswered / Math.max(bTotal, 1)) * 0.50)
    if (bAnswered < bTotal) {
      gaps.push(`${bTotal - bAnswered} of ${bTotal} Class B evidence items missing`)
    }
    gaps.push('No operational (Class C) evidence — confidence capped at 0.40')
  } else if (bAnswered > 0 && cAnswered > 0) {
    // Class B + C — PARTIALLY_SUPPORTED, cap at 0.65
    evidenceSupport = 'PARTIALLY_SUPPORTED'
    const bScore = (bAnswered / Math.max(bTotal, 1)) * 0.35
    const cScore = (cAnswered / Math.max(cTotal, 1)) * 0.30
    confidence = Math.min(0.65, bScore + cScore)
    if (bAnswered < bTotal) {
      gaps.push(`${bTotal - bAnswered} of ${bTotal} Class B evidence items missing`)
    }
    if (cAnswered < cTotal) {
      gaps.push(`${cTotal - cAnswered} of ${cTotal} Class C evidence items missing`)
    }
  } else if (bAnswered === 0 && cAnswered > 0) {
    // Class C only (no B) — valid for historical experience and operational claims
    // Some claims (e.g., historical_experience) require A or C, not B
    if (claimId === 'clinical_trials.hybrid.historical_experience') {
      evidenceSupport = 'PARTIALLY_SUPPORTED'
      confidence = Math.min(0.65, (cAnswered / Math.max(cTotal, 1)) * 0.65)
    } else {
      evidenceSupport = 'NEEDS_EVIDENCE'
      confidence = Math.min(0.35, (cAnswered / Math.max(cTotal, 1)) * 0.40)
      gaps.push('No Class B evidence — upload SOPs and documentation')
    }
  } else {
    evidenceSupport = 'UNKNOWN'
    confidence = 0
  }

  // Collect responses for traceability
  const responses: Record<string, unknown> = {}
  for (const q of [...classBQuestions, ...classCQuestions]) {
    if (isAnswered(answers[q])) {
      responses[q] = answers[q]
    }
  }

  return {
    claimId, claimLabel,
    evidenceSupport,
    confidence: Math.round(confidence * 100) / 100,
    isMandatory, canBeNA,
    responses,
    gaps,
  }
}

// --------------------------------------------------------------------------
// Main derivation function
// --------------------------------------------------------------------------

export function deriveHybridTrialReadiness(
  answers: Record<string, unknown>,
  uploadedDocLabels: string[] = [],
): HybridReadinessOutput {
  const claims = CLAIM_MAPPINGS.map((mapping) => computeClaimResult(mapping, answers, uploadedDocLabels))

  // Count mandatory/optional, excluding N/A and UNKNOWN
  let mandatoryMet = 0
  let mandatoryTotal = 0
  let optionalMet = 0
  let optionalTotal = 0

  for (const claim of claims) {
    if (claim.evidenceSupport === 'NOT_APPLICABLE' || claim.evidenceSupport === 'UNKNOWN') {
      continue // Excluded from counts
    }

    const met = claim.evidenceSupport === 'SUPPORTED_BY_EVIDENCE' || claim.confidence >= 0.50

    if (claim.isMandatory) {
      mandatoryTotal++
      if (met) mandatoryMet++
    } else {
      optionalTotal++
      if (met) optionalMet++
    }
  }

  // Compute readiness status
  let readinessStatus: HybridReadinessOutput['readinessStatus']
  if (mandatoryTotal === 0) {
    readinessStatus = optionalTotal === 0 || optionalMet === optionalTotal ? 'ready' : 'partial'
  } else if (mandatoryMet < mandatoryTotal) {
    readinessStatus = 'not_ready'
  } else if (optionalMet === optionalTotal) {
    readinessStatus = 'ready'
  } else if (optionalMet > 0) {
    readinessStatus = 'conditionally_ready'
  } else {
    readinessStatus = 'partial'
  }

  // Overall confidence: average of non-N/A, non-UNKNOWN claims
  const active = claims.filter(
    (c) => c.evidenceSupport !== 'NOT_APPLICABLE' && c.evidenceSupport !== 'UNKNOWN',
  )
  const overallConfidence =
    active.length > 0
      ? Math.round((active.reduce((s, c) => s + c.confidence, 0) / active.length) * 100) / 100
      : 0

  return {
    claims,
    mandatoryMet,
    mandatoryTotal,
    optionalMet,
    optionalTotal,
    overallConfidence,
    readinessStatus,
    summary: `${mandatoryMet}/${mandatoryTotal} mandatory met, ${optionalMet}/${optionalTotal} optional. Status: ${readinessStatus}. Confidence: ${overallConfidence}`,
  }
}
