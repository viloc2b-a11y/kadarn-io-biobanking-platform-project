// ==========================================================================
// KTP-1.5 — Document Upload Router (LOOP 10A)
// ==========================================================================
// Routes every uploaded document to an owner entity before it can count
// as evidence. Replaces the generic "upload anything anywhere" pattern
// with an Evidence Intake Router that answers:
//
//   - What is it?         → documentType
//   - Where does it belong? → routingTarget
//   - What does it support? → claimCandidates + evidencePurpose
//   - How is it handled?   → handlingMode
//   - Can it be used for feasibility? → feasibilityEligible
//
// Unassigned documents do NOT count as evidence-backed.
// ==========================================================================

import type { DocumentHandlingMode } from '@kadarn/types/document-handling'
import { evaluateFeasibilitySuggestion } from '@kadarn/types/document-handling'

// --------------------------------------------------------------------------
// Routing Target Types
// --------------------------------------------------------------------------

export type DocumentRoutingTargetType =
  | 'organization'
  | 'person'
  | 'facility'
  | 'equipment'
  | 'study_experience'
  | 'capability'
  | 'quality_system'
  | 'feasibility_folder'
  | 'unassigned'

export interface DocumentRoutingTarget {
  targetType: DocumentRoutingTargetType
  targetId?: string
  targetLabel?: string
  /** Which onboarding section this relates to */
  section?:
    | 'organization'
    | 'people'
    | 'infrastructure'
    | 'equipment'
    | 'study_experience'
    | 'quality'
    | 'documents'
    | 'feasibility_folder'
  /** How the routing was determined */
  confidence: 'suggested' | 'user_selected' | 'needs_review'
}

export type DocumentRoutingStatus =
  | 'unassigned'
  | 'suggested'
  | 'assigned'
  | 'needs_review'
  | 'rejected'

export type EvidencePurpose =
  | 'staff_qualification'
  | 'facility_certification'
  | 'equipment_readiness'
  | 'study_participation'
  | 'study_startup'
  | 'biospecimen_handling'
  | 'quality_system'
  | 'organization_identity'
  | 'feasibility_package'

export type EvidenceReadiness =
  | 'ready'
  | 'not_ready_unassigned'
  | 'not_ready_needs_document_type'
  | 'not_ready_needs_owner'
  | 'not_ready_needs_review'
  | 'not_ready_private'
  | 'not_ready_incompatible_mode'

// --------------------------------------------------------------------------
// Routed Document (extends upload/doc records)
// --------------------------------------------------------------------------

export interface RoutedDocument {
  documentId: string
  filename?: string
  documentType?: string
  /** Current routing status */
  routingStatus: DocumentRoutingStatus
  /** Primary owner entity */
  primaryTarget?: DocumentRoutingTarget
  /** Secondary targets (e.g., a doc relevant to both a person and a study) */
  secondaryTargets?: DocumentRoutingTarget[]
  /** Claim families this document can support */
  claimCandidates?: string[]
  /** What this evidence proves */
  evidencePurpose?: EvidencePurpose
  /** Whether this document is ready to become evidence */
  evidenceReadiness: EvidenceReadiness
  /** Feasibility Folder eligibility */
  feasibilityEligible: boolean
  /** Handling mode */
  handlingMode?: DocumentHandlingMode
  /** Warning if the document needs attention */
  warning?: string
}

// --------------------------------------------------------------------------
// Routing Suggestion Map
// --------------------------------------------------------------------------

interface RoutingSuggestion {
  targetType: DocumentRoutingTargetType
  section: NonNullable<DocumentRoutingTarget['section']>
  evidencePurpose: EvidencePurpose
  claimCandidates: string[]
  feasibilityEligible: boolean
  handlingMode: DocumentHandlingMode
}

const ROUTING_MAP: Record<string, RoutingSuggestion> = {
  // Staff qualifications
  cv:                 { targetType: 'person', section: 'people', evidencePurpose: 'staff_qualification', claimCandidates: ['staff.qualification'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  medical_license:    { targetType: 'person', section: 'people', evidencePurpose: 'staff_qualification', claimCandidates: ['staff.qualification', 'regulatory.license'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  gcp_certificate:    { targetType: 'person', section: 'people', evidencePurpose: 'staff_qualification', claimCandidates: ['staff.training', 'regulatory.gcp'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  iata_certificate:   { targetType: 'person', section: 'people', evidencePurpose: 'staff_qualification', claimCandidates: ['staff.training', 'biospecimen.shipping'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  nursing_license:    { targetType: 'person', section: 'people', evidencePurpose: 'staff_qualification', claimCandidates: ['staff.qualification'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  delegation_log:     { targetType: 'person', section: 'people', evidencePurpose: 'staff_qualification', claimCandidates: ['staff.delegation', 'study.startup'], feasibilityEligible: false, handlingMode: 'stored_evidence' },

  // Facility
  clia_certificate:   { targetType: 'facility', section: 'infrastructure', evidencePurpose: 'facility_certification', claimCandidates: ['facility.certification', 'lab.operations'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  facility_license:   { targetType: 'facility', section: 'infrastructure', evidencePurpose: 'facility_certification', claimCandidates: ['facility.certification'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  floor_plan:         { targetType: 'facility', section: 'infrastructure', evidencePurpose: 'facility_certification', claimCandidates: ['facility.layout'], feasibilityEligible: false, handlingMode: 'private_restricted' },

  // Equipment
  calibration_record: { targetType: 'equipment', section: 'equipment', evidencePurpose: 'equipment_readiness', claimCandidates: ['equipment.calibration'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  temperature_log:    { targetType: 'equipment', section: 'equipment', evidencePurpose: 'equipment_readiness', claimCandidates: ['equipment.monitoring', 'biospecimen.cold_chain'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  maintenance_record: { targetType: 'equipment', section: 'equipment', evidencePurpose: 'equipment_readiness', claimCandidates: ['equipment.maintenance'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },

  // Study Experience
  irb_approval_letter:   { targetType: 'study_experience', section: 'study_experience', evidencePurpose: 'study_participation', claimCandidates: ['study.participation', 'regulatory.irb_pathway'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  activation_letter:     { targetType: 'study_experience', section: 'study_experience', evidencePurpose: 'study_startup', claimCandidates: ['study.participation', 'startup.activation'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  closeout_letter:       { targetType: 'study_experience', section: 'study_experience', evidencePurpose: 'study_participation', claimCandidates: ['study.participation', 'closeout.completed'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  protocol_document:     { targetType: 'study_experience', section: 'study_experience', evidencePurpose: 'study_participation', claimCandidates: ['study.participation'], feasibilityEligible: false, handlingMode: 'stored_evidence' },
  enrollment_summary:    { targetType: 'study_experience', section: 'study_experience', evidencePurpose: 'study_participation', claimCandidates: ['patient_recruitment.enrollment_history'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  lab_manual:            { targetType: 'study_experience', section: 'study_experience', evidencePurpose: 'biospecimen_handling', claimCandidates: ['biospecimen.study_handling'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  shipment_logs:         { targetType: 'study_experience', section: 'study_experience', evidencePurpose: 'biospecimen_handling', claimCandidates: ['biospecimen.study_handling'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },

  // Quality System
  sop_index:             { targetType: 'quality_system', section: 'quality', evidencePurpose: 'quality_system', claimCandidates: ['quality.sop_governance'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  quality_manual:        { targetType: 'quality_system', section: 'quality', evidencePurpose: 'quality_system', claimCandidates: ['quality.system'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  capa_report:           { targetType: 'quality_system', section: 'quality', evidencePurpose: 'quality_system', claimCandidates: ['quality.capa'], feasibilityEligible: false, handlingMode: 'private_restricted' },

  // Organization
  business_license:      { targetType: 'organization', section: 'organization', evidencePurpose: 'organization_identity', claimCandidates: ['organization.legal_entity'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  w9:                    { targetType: 'organization', section: 'organization', evidencePurpose: 'organization_identity', claimCandidates: ['organization.legal_entity'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  insurance_certificate: { targetType: 'organization', section: 'organization', evidencePurpose: 'organization_identity', claimCandidates: ['organization.insurance'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },
  org_chart:             { targetType: 'organization', section: 'organization', evidencePurpose: 'organization_identity', claimCandidates: ['organization.structure'], feasibilityEligible: true, handlingMode: 'feasibility_folder' },

  // Sponsor/External (sensitive)
  sponsor_correspondence: { targetType: 'study_experience', section: 'study_experience', evidencePurpose: 'study_participation', claimCandidates: ['study.participation'], feasibilityEligible: false, handlingMode: 'private_restricted' },
  cro_correspondence:     { targetType: 'study_experience', section: 'study_experience', evidencePurpose: 'study_participation', claimCandidates: ['study.participation'], feasibilityEligible: false, handlingMode: 'private_restricted' },
}

// --------------------------------------------------------------------------
// Routing Suggestion Engine
// --------------------------------------------------------------------------

export interface RoutingSuggestionResult {
  suggestedTarget: DocumentRoutingTarget
  routingStatus: DocumentRoutingStatus
  evidencePurpose: EvidencePurpose
  claimCandidates: string[]
  feasibilityEligible: boolean
  handlingMode: DocumentHandlingMode
  /** Whether auto-suggestion had high confidence */
  autoSuggested: boolean
  warning?: string
}

/**
 * Suggest routing for a document based on its type and the current context.
 *
 * @param documentType - Known document type from taxonomy
 * @param filename - Original filename (fallback for type detection)
 * @param currentSection - Where the user is uploading from (pre-fills target)
 * @param containsSensitiveInfo - Whether the doc is flagged as sensitive
 */
export function suggestDocumentRouting(params: {
  documentType?: string
  filename?: string
  currentSection?: DocumentRoutingTarget['section']
  containsSensitiveInfo?: boolean
}): RoutingSuggestionResult {
  const { documentType, filename, currentSection, containsSensitiveInfo } = params

  // Try exact match by document type
  const suggestion = documentType ? ROUTING_MAP[documentType] : undefined

  // Try fuzzy match by filename keywords
  const fuzzyMatch = !suggestion && filename ? findFuzzyMatch(filename) : undefined

  const match = suggestion || fuzzyMatch

  if (match) {
    // Respect current section context: if user is in People section, pre-fill person target
    const sectionTarget: DocumentRoutingTargetType | undefined =
      currentSection === 'people' ? 'person' :
      currentSection === 'infrastructure' ? 'facility' :
      currentSection === 'equipment' ? 'equipment' :
      currentSection === 'study_experience' ? 'study_experience' :
      currentSection === 'quality' ? 'quality_system' :
      currentSection === 'organization' ? 'organization' :
      undefined

    // If section context matches the suggestion, boost confidence
    const confidence: DocumentRoutingTarget['confidence'] =
      sectionTarget && sectionTarget === match.targetType ? 'user_selected' : 'suggested'

    // If document is sensitive, override to private
    const effectiveHandlingMode = containsSensitiveInfo ? 'private_restricted' : match.handlingMode
    const effectiveFeasibility = containsSensitiveInfo ? false : match.feasibilityEligible

    return {
      suggestedTarget: {
        targetType: match.targetType,
        section: match.section,
        confidence,
      },
      routingStatus: 'suggested',
      evidencePurpose: match.evidencePurpose,
      claimCandidates: match.claimCandidates,
      feasibilityEligible: effectiveFeasibility,
      handlingMode: effectiveHandlingMode,
      autoSuggested: true,
      warning: containsSensitiveInfo ? 'Document flagged as sensitive. Routing set to private/restricted.' : undefined,
    }
  }

  // No match found — needs manual review
  return {
    suggestedTarget: { targetType: 'unassigned', confidence: 'needs_review' },
    routingStatus: 'needs_review',
    evidencePurpose: 'staff_qualification', // safe default
    claimCandidates: [],
    feasibilityEligible: false,
    handlingMode: 'reference_only',
    autoSuggested: false,
    warning: 'Document type not recognized. Please assign manually.',
  }
}

function findFuzzyMatch(filename: string): RoutingSuggestion | undefined {
  const lower = filename.toLowerCase()
  const keywords: [string, string][] = [
    ['cv', 'cv'], ['resume', 'cv'], ['curriculum', 'cv'],
    ['license', 'medical_license'], ['medical', 'medical_license'],
    ['gcp', 'gcp_certificate'], ['iata', 'iata_certificate'],
    ['clia', 'clia_certificate'], ['calibration', 'calibration_record'],
    ['temperature', 'temperature_log'], ['temp', 'temperature_log'],
    ['irb', 'irb_approval_letter'], ['approval', 'irb_approval_letter'],
    ['activation', 'activation_letter'], ['closeout', 'closeout_letter'],
    ['sop', 'sop_index'], ['manual', 'quality_manual'],
    ['protocol', 'protocol_document'], ['enrollment', 'enrollment_summary'],
    ['lab', 'lab_manual'], ['shipment', 'shipment_logs'],
    ['insurance', 'insurance_certificate'], ['w9', 'w9'], ['w-9', 'w9'],
    ['business', 'business_license'], ['chart', 'org_chart'],
    ['capa', 'capa_report'], ['budget', 'capa_report'],
    ['sponsor', 'sponsor_correspondence'], ['cro', 'cro_correspondence'],
  ]
  for (const [kw, type] of keywords) {
    if (lower.includes(kw)) return ROUTING_MAP[type]
  }
  return undefined
}

// --------------------------------------------------------------------------
// Evidence Gating
// --------------------------------------------------------------------------

/**
 * Determine if a routed document is ready to become evidence.
 * Unassigned documents, those without document type, or those in incompatible
 * handling modes are NOT evidence-ready.
 */
export function checkEvidenceReadiness(doc: RoutedDocument): EvidenceReadiness {
  if (doc.handlingMode === 'private_restricted') return 'not_ready_private'
  if (doc.handlingMode === 'reference_only') return 'not_ready_incompatible_mode'
  if (doc.routingStatus === 'unassigned') return 'not_ready_unassigned'
  if (doc.routingStatus === 'needs_review') return 'not_ready_needs_review'
  if (!doc.documentType) return 'not_ready_needs_document_type'
  if (!doc.primaryTarget || doc.primaryTarget.targetType === 'unassigned') return 'not_ready_needs_owner'
  return 'ready'
}

/**
 * Check if a document can generate an evidence node.
 * Requires: assigned routing, document type, compatible handling mode, claim candidates.
 */
export function canGenerateEvidenceNode(doc: RoutedDocument): { canGenerate: boolean; reason?: string } {
  const readiness = checkEvidenceReadiness(doc)
  if (readiness !== 'ready') {
    const reasons: Record<EvidenceReadiness, string> = {
      ready: '',
      not_ready_unassigned: 'Document has no owner entity. Assign to a person, facility, equipment, or study.',
      not_ready_needs_document_type: 'Document type is unknown. Classify the document before generating evidence.',
      not_ready_needs_owner: 'Primary target is unassigned. Route the document to an entity.',
      not_ready_needs_review: 'Document routing needs manual review.',
      not_ready_private: 'Document is private/restricted and cannot generate evidence nodes.',
      not_ready_incompatible_mode: 'Document is reference-only and cannot generate evidence nodes.',
    }
    return { canGenerate: false, reason: reasons[readiness] }
  }
  if (!doc.claimCandidates || doc.claimCandidates.length === 0) {
    return { canGenerate: false, reason: 'No claim candidates identified. Assign an evidence purpose.' }
  }
  return { canGenerate: true }
}

// --------------------------------------------------------------------------
// Bulk Upload Triage
// --------------------------------------------------------------------------

export interface TriageItem extends RoutedDocument {
  /** Action required before this document can become evidence */
  actionRequired: string
  /** Priority for triage */
  triagePriority: 'high' | 'medium' | 'low'
}

/**
 * Process a batch of uploaded files into triage items.
 * Each file gets initial routing suggestions but remains unassigned
 * until the user explicitly assigns it.
 */
export function createTriageBatch(params: {
  files: Array<{ id: string; filename: string; documentType?: string }>
  currentSection?: DocumentRoutingTarget['section']
  containsSensitiveInfo?: boolean
}): TriageItem[] {
  return params.files.map(file => {
    const routing = suggestDocumentRouting({
      documentType: file.documentType,
      filename: file.filename,
      currentSection: params.currentSection,
      containsSensitiveInfo: params.containsSensitiveInfo,
    })

    const doc: RoutedDocument = {
      documentId: file.id,
      filename: file.filename,
      documentType: file.documentType,
      routingStatus: routing.routingStatus,
      primaryTarget: routing.suggestedTarget,
      claimCandidates: routing.claimCandidates,
      evidencePurpose: routing.evidencePurpose,
      evidenceReadiness: 'not_ready_unassigned',
      feasibilityEligible: routing.feasibilityEligible,
      handlingMode: routing.handlingMode,
      warning: routing.warning,
    }

    const actionRequired = routing.autoSuggested
      ? 'Review suggested routing and confirm assignment.'
      : 'Document type not recognized. Classify and assign manually.'

    return {
      ...doc,
      actionRequired,
      triagePriority: routing.autoSuggested ? 'low' : 'high',
    }
  })
}

// --------------------------------------------------------------------------
// Section-aware upload presets
// --------------------------------------------------------------------------

export function getSectionRoutingPreset(section: DocumentRoutingTarget['section']): {
  defaultTargetType: DocumentRoutingTargetType
  defaultSection: NonNullable<DocumentRoutingTarget['section']>
} {
  const map: Record<string, { defaultTargetType: DocumentRoutingTargetType; defaultSection: NonNullable<DocumentRoutingTarget['section']> }> = {
    people:           { defaultTargetType: 'person', defaultSection: 'people' },
    infrastructure:   { defaultTargetType: 'facility', defaultSection: 'infrastructure' },
    equipment:        { defaultTargetType: 'equipment', defaultSection: 'equipment' },
    study_experience: { defaultTargetType: 'study_experience', defaultSection: 'study_experience' },
    quality:          { defaultTargetType: 'quality_system', defaultSection: 'quality' },
    organization:     { defaultTargetType: 'organization', defaultSection: 'organization' },
    documents:        { defaultTargetType: 'unassigned', defaultSection: 'documents' },
    feasibility_folder: { defaultTargetType: 'feasibility_folder', defaultSection: 'feasibility_folder' },
  }
  return map[section || 'documents'] || { defaultTargetType: 'unassigned', defaultSection: 'documents' }
}
