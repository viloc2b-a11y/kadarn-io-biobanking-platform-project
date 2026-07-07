// ==========================================================================
// OCP-5 — Document Auto-Classification
// ==========================================================================
// Pure, deterministic classifier. Takes an uploaded document and returns
// its evidence classification, domain mapping, review status, and Passport
// impact. Respects OCP-3 conditional rules.
//
// Design contract:
// - Pure function: same input → same output
// - Deterministic: label-based matching, no randomness
// - Stateless: no side effects
// ==========================================================================

// ==========================================================================
// Document Categories
// ==========================================================================

export type DocumentCategory =
  | 'legal_entity_document'
  | 'pi_medical_license'
  | 'cv'
  | 'gcp_training'
  | 'iata_training'
  | 'clia_certificate'
  | 'irb_relationship_or_approval'
  | 'sop'
  | 'calibration_record'
  | 'equipment_record'
  | 'temperature_log'
  | 'insurance'
  | 'delegation_log'
  | 'financial_disclosure'
  | 'study_history_evidence'
  | 'audit_or_inspection_evidence'
  | 'other'

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  legal_entity_document: 'Legal entity document',
  pi_medical_license: 'PI medical license',
  cv: 'CV / resume',
  gcp_training: 'GCP training',
  iata_training: 'IATA training',
  clia_certificate: 'CLIA certificate',
  irb_relationship_or_approval: 'IRB relationship or approval',
  sop: 'Standard operating procedure',
  calibration_record: 'Calibration record',
  equipment_record: 'Equipment record',
  temperature_log: 'Temperature log',
  insurance: 'Insurance',
  delegation_log: 'Delegation log',
  financial_disclosure: 'Financial disclosure',
  study_history_evidence: 'Study history evidence',
  audit_or_inspection_evidence: 'Audit or inspection evidence',
  other: 'Other document',
}

// ==========================================================================
// Domain Mapping
// ==========================================================================

export type OnboardingEvidenceDomain =
  | 'Institution Identity'
  | 'People / Roles'
  | 'Infrastructure'
  | 'Capabilities'
  | 'Documents / Evidence'
  | 'Historical Portfolio'
  | 'Regulatory / Quality'
  | 'Passport'

export const CATEGORY_DOMAIN_MAP: Record<DocumentCategory, OnboardingEvidenceDomain[]> = {
  legal_entity_document: ['Institution Identity', 'Passport'],
  pi_medical_license: ['People / Roles', 'Capabilities', 'Passport'],
  cv: ['People / Roles', 'Historical Portfolio'],
  gcp_training: ['People / Roles', 'Regulatory / Quality', 'Passport'],
  iata_training: ['Infrastructure', 'Capabilities', 'Regulatory / Quality'],
  clia_certificate: ['Infrastructure', 'Capabilities', 'Regulatory / Quality', 'Passport'],
  irb_relationship_or_approval: ['Regulatory / Quality', 'Historical Portfolio'],
  sop: ['Regulatory / Quality', 'Infrastructure', 'Capabilities'],
  calibration_record: ['Infrastructure', 'Capabilities', 'Regulatory / Quality'],
  equipment_record: ['Infrastructure', 'Capabilities'],
  temperature_log: ['Infrastructure', 'Capabilities'],
  insurance: ['Institution Identity', 'Regulatory / Quality'],
  delegation_log: ['People / Roles', 'Regulatory / Quality'],
  financial_disclosure: ['People / Roles', 'Regulatory / Quality'],
  study_history_evidence: ['Historical Portfolio', 'Capabilities'],
  audit_or_inspection_evidence: ['Regulatory / Quality', 'Historical Portfolio', 'Passport'],
  other: ['Documents / Evidence'],
}

// ==========================================================================
// Review Status
// ==========================================================================

export type DocumentReviewStatus =
  | 'uploaded'
  | 'classified'
  | 'needs_review'
  | 'accepted'
  | 'rejected'
  | 'expired_or_outdated'
  | 'restricted'
  | 'linked_to_passport'

export const DOCUMENT_REVIEW_LABELS: Record<DocumentReviewStatus, string> = {
  uploaded: 'Uploaded — not yet classified',
  classified: 'Classified',
  needs_review: 'Needs review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired_or_outdated: 'Expired or outdated',
  restricted: 'Restricted access',
  linked_to_passport: 'Linked to Passport',
}

// ==========================================================================
// Passport Impact
// ==========================================================================

export type PassportImpact =
  | 'strengthens_passport'
  | 'supports_declared_capability'
  | 'fills_required_evidence_gap'
  | 'optional_supporting_evidence'
  | 'needs_review_before_impact'
  | 'no_current_passport_impact'

export const PASSPORT_IMPACT_LABELS: Record<PassportImpact, string> = {
  strengthens_passport: 'Strengthens your Institution Passport',
  supports_declared_capability: 'Supports a declared capability',
  fills_required_evidence_gap: 'Fills a required evidence gap',
  optional_supporting_evidence: 'Optional supporting evidence',
  needs_review_before_impact: 'Needs review before Passport impact can be determined',
  no_current_passport_impact: 'No current Passport impact',
}

// ==========================================================================
// Classification Result
// ==========================================================================

export interface DocumentClassification {
  category: DocumentCategory
  categoryLabel: string
  domains: OnboardingEvidenceDomain[]
  reviewStatus: DocumentReviewStatus
  reviewStatusLabel: string
  /** Whether this document has a known expiration */
  hasExpiration: boolean
  /** Expiration date if known, null if unknown */
  expiresAt: string | null
  /** Expiration description for display */
  expirationNote: string
  passportImpact: PassportImpact
  passportImpactLabel: string
  /** Whether this is a conditional requirement (OCP-3) */
  isConditionalRequirement: boolean
  /** The conditional requirement this satisfies, if any */
  conditionalRequirement?: string
}

// ==========================================================================
// Classification Input
// ==========================================================================

export interface ClassifyDocumentInput {
  label: string
  type: string
  /** Uploaded document metadata — expiration if provided by user */
  expiresAt?: string
  /** OCP-3: Whether lab/testing capability is declared */
  hasLabDeclared?: boolean
  /** OCP-3: Whether biospecimen/shipping capability is declared */
  hasShippingDeclared?: boolean
  /** OCP-3: Whether biospecimen operations are declared */
  hasBiospecimenDeclared?: boolean
  /** OCP-3: Whether early phase capability is declared */
  hasEarlyPhaseDeclared?: boolean
  /** Whether the document has already been reviewed */
  hasBeenReviewed?: boolean
}

// ==========================================================================
// Classification Rules
// ==========================================================================

interface ClassificationRule {
  keywords: string[]
  category: DocumentCategory
  /** Default Passport impact when condition is met */
  impact: PassportImpact
  /** Whether this is a conditional requirement */
  conditional: boolean
  /** The condition key for OCP-3 rules */
  conditionKey?: 'lab' | 'shipping' | 'biospecimen' | 'earlyPhase'
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    keywords: ['license', 'business license', 'registration', 'legal entity', 'incorporation'],
    category: 'legal_entity_document',
    impact: 'strengthens_passport',
    conditional: false,
  },
  {
    keywords: ['medical license', 'pi license', 'physician license', 'md license', 'doctor license'],
    category: 'pi_medical_license',
    impact: 'supports_declared_capability',
    conditional: false,
  },
  {
    keywords: ['cv', 'resume', 'curriculum vitae', 'biosketch'],
    category: 'cv',
    impact: 'optional_supporting_evidence',
    conditional: false,
  },
  {
    keywords: ['gcp', 'good clinical practice', 'ich gcp', 'gcp training', 'gcp certificate'],
    category: 'gcp_training',
    impact: 'strengthens_passport',
    conditional: false,
  },
  {
    keywords: ['iata', 'dangerous goods', 'shipping training', 'iata training', 'iata certificate'],
    category: 'iata_training',
    impact: 'fills_required_evidence_gap',
    conditional: true,
    conditionKey: 'shipping',
  },
  {
    keywords: ['clia', 'clinical laboratory improvement', 'cap', 'cola', 'lab certification', 'laboratory certification'],
    category: 'clia_certificate',
    impact: 'fills_required_evidence_gap',
    conditional: true,
    conditionKey: 'lab',
  },
  {
    keywords: ['irb', 'institutional review board', 'ethics committee', 'irb approval', 'irb letter'],
    category: 'irb_relationship_or_approval',
    impact: 'supports_declared_capability',
    conditional: false,
  },
  {
    keywords: ['sop', 'standard operating procedure', 'protocol', 'procedure', 'work instruction'],
    category: 'sop',
    impact: 'supports_declared_capability',
    conditional: false,
  },
  {
    keywords: ['calibration', 'calibrated', 'calibration record', 'calibration certificate', 'calibration log'],
    category: 'calibration_record',
    impact: 'supports_declared_capability',
    conditional: false,
  },
  {
    keywords: ['equipment', 'iq/oq/pq', 'qualification', 'equipment record', 'equipment log', 'instrument'],
    category: 'equipment_record',
    impact: 'supports_declared_capability',
    conditional: false,
  },
  {
    keywords: ['temperature', 'temp log', 'temperature log', 'monitoring', 'freezer log', 'storage log'],
    category: 'temperature_log',
    impact: 'supports_declared_capability',
    conditional: false,
  },
  {
    keywords: ['insurance', 'liability', 'malpractice', 'coverage'],
    category: 'insurance',
    impact: 'strengthens_passport',
    conditional: false,
  },
  {
    keywords: ['delegation', 'delegation log', 'site delegation', 'staff delegation'],
    category: 'delegation_log',
    impact: 'supports_declared_capability',
    conditional: false,
  },
  {
    keywords: ['financial disclosure', 'fda 1572', '1572', 'disclosure', 'financial interest'],
    category: 'financial_disclosure',
    impact: 'supports_declared_capability',
    conditional: false,
  },
  {
    keywords: ['study history', 'trial history', 'study list', 'prior studies', 'research history', 'clinical trial history'],
    category: 'study_history_evidence',
    impact: 'optional_supporting_evidence',
    conditional: false,
  },
  {
    keywords: ['audit', 'inspection', 'fda audit', 'ema inspection', 'regulatory audit', 'inspection report', 'audit report'],
    category: 'audit_or_inspection_evidence',
    impact: 'strengthens_passport',
    conditional: false,
  },
]

// ==========================================================================
// Classifier
// ==========================================================================

/**
 * Classifies an uploaded document into an evidence category, maps it to
 * onboarding domains, and determines review status, expiration, and
 * Passport impact. Respects OCP-3 conditional rules.
 */
export function classifyDocument(input: ClassifyDocumentInput): DocumentClassification {
  const label = input.label.toLowerCase()
  const type = (input.type ?? '').toLowerCase()

  // Match against classification rules
  let matchedRule: ClassificationRule | undefined
  let bestScore = 0

  for (const rule of CLASSIFICATION_RULES) {
    let score = 0
    for (const keyword of rule.keywords) {
      if (label.includes(keyword)) score += keyword.length
      if (type.includes(keyword)) score += keyword.length / 2
    }
    if (score > bestScore) {
      bestScore = score
      matchedRule = rule
    }
  }

  const category: DocumentCategory = matchedRule?.category ?? 'other'
  const domains = CATEGORY_DOMAIN_MAP[category]

  // Determine if this is a conditional requirement (OCP-3)
  let isConditionalRequirement = matchedRule?.conditional ?? false
  let conditionalRequirement: string | undefined

  if (isConditionalRequirement && matchedRule?.conditionKey) {
    switch (matchedRule.conditionKey) {
      case 'lab':
        isConditionalRequirement = input.hasLabDeclared === true
        conditionalRequirement = 'CLIA certificate — required because lab/testing capability is declared'
        break
      case 'shipping':
        isConditionalRequirement = (input.hasShippingDeclared === true || input.hasBiospecimenDeclared === true)
        conditionalRequirement = 'IATA training — required because biospecimen/shipping capability is declared'
        break
      case 'biospecimen':
        isConditionalRequirement = input.hasBiospecimenDeclared === true
        conditionalRequirement = 'Required because biospecimen operations are declared'
        break
      case 'earlyPhase':
        isConditionalRequirement = input.hasEarlyPhaseDeclared === true
        conditionalRequirement = 'Required because early phase capability is declared'
        break
    }
  }

  // Determine review status
  let reviewStatus: DocumentReviewStatus = 'classified'
  if (input.hasBeenReviewed) {
    reviewStatus = 'linked_to_passport'
  } else if (isConditionalRequirement && !input.hasBeenReviewed) {
    reviewStatus = 'needs_review'
  }

  // Determine expiration
  let hasExpiration = false
  let expiresAt: string | null = input.expiresAt ?? null
  let expirationNote = 'Unknown — add date if available'

  const expirableCategories: DocumentCategory[] = [
    'pi_medical_license', 'gcp_training', 'iata_training',
    'clia_certificate', 'insurance', 'calibration_record',
  ]

  if (expirableCategories.includes(category)) {
    hasExpiration = true
    if (expiresAt) {
      const expDate = new Date(expiresAt)
      if (expDate < new Date()) {
        reviewStatus = 'expired_or_outdated'
        expirationNote = `Expired ${expDate.toLocaleDateString()}`
      } else if (expDate < new Date(Date.now() + 90 * 86_400_000)) {
        reviewStatus = 'needs_review'
        expirationNote = `Expires ${expDate.toLocaleDateString()} (within 90 days)`
      } else {
        expirationNote = `Valid until ${expDate.toLocaleDateString()}`
      }
    }
  } else {
    expirationNote = 'Not expirable'
  }

  // Determine Passport impact
  let passportImpact: PassportImpact = matchedRule?.impact ?? 'no_current_passport_impact'
  if (reviewStatus === 'needs_review' && passportImpact !== 'fills_required_evidence_gap') {
    passportImpact = 'needs_review_before_impact'
  }

  return {
    category,
    categoryLabel: DOCUMENT_CATEGORY_LABELS[category],
    domains,
    reviewStatus,
    reviewStatusLabel: DOCUMENT_REVIEW_LABELS[reviewStatus],
    hasExpiration,
    expiresAt,
    expirationNote,
    passportImpact,
    passportImpactLabel: PASSPORT_IMPACT_LABELS[passportImpact],
    isConditionalRequirement,
    ...(conditionalRequirement ? { conditionalRequirement } : {}),
  }
}

/**
 * Classifies multiple documents in batch. Returns a summary of classifications.
 */
export function classifyDocuments(
  docs: ClassifyDocumentInput[],
): DocumentClassification[] {
  return docs.map((doc) => classifyDocument(doc))
}

/**
 * Builds classification guidance text for display to the user.
 */
export function buildClassificationGuidance(
  classification: DocumentClassification,
): { summary: string; impact: string; action: string } {
  const summary = `This document has been classified as ${classification.categoryLabel}.`
  const impact = classification.passportImpact === 'no_current_passport_impact'
    ? 'It currently has no direct Passport impact.'
    : `It ${PASSPORT_IMPACT_LABELS[classification.passportImpact].toLowerCase()}.`

  let action = ''
  if (classification.reviewStatus === 'needs_review') {
    action = 'It needs review because it may be expiring or is a conditional requirement.'
  } else if (classification.reviewStatus === 'expired_or_outdated') {
    action = 'It is expired or outdated. Upload a current version to restore Passport impact.'
  } else if (classification.hasExpiration && !classification.expiresAt) {
    action = 'Expiration unknown — add date if available.'
  } else if (classification.isConditionalRequirement) {
    action = `This is a conditional requirement: ${classification.conditionalRequirement ?? ''}`
  }

  return { summary, impact, action }
}
