// ==========================================================================
// Evidence Maturity Model — Types
// ==========================================================================
// IKM/EVM Build Track — Sprint 1
// ==========================================================================

/** Evidence maturity levels from undocumented to continuously validated */
export enum EvidenceMaturityLevel {
  EM0_NOT_DOCUMENTED = 'EM0_NOT_DOCUMENTED',
  EM1_SELF_REPORTED = 'EM1_SELF_REPORTED',
  EM2_DOCUMENT_SUPPORTED = 'EM2_DOCUMENT_SUPPORTED',
  EM3_INTERNALLY_CORROBORATED = 'EM3_INTERNALLY_CORROBORATED',
  EM4_OPERATIONALLY_DEMONSTRATED = 'EM4_OPERATIONALLY_DEMONSTRATED',
  EM5_EXTERNALLY_CONFIRMED = 'EM5_EXTERNALLY_CONFIRMED',
  EM6_CONTINUOUSLY_VALIDATED = 'EM6_CONTINUOUSLY_VALIDATED',
}

/** Complete maturity assessment for a fact or claim */
export interface EvidenceMaturityAssessment {
  /** The fact or claim being assessed */
  subjectId: string
  /** Current maturity level */
  maturityLevel: EvidenceMaturityLevel
  /** Numeric representation: EM0=0, EM6=6 */
  maturityScore: number
  /** Evidence IDs that support this assessment */
  supportingEvidenceIds: string[]
  /** Evidence types that would improve maturity */
  missingEvidenceTypes: string[]
  /** Whether provenance chain is complete and verifiable */
  provenanceStatus: 'complete' | 'partial' | 'unavailable'
  /** Whether evidence is current or stale */
  freshnessStatus: 'current' | 'aging' | 'stale' | 'expired'
  /** Whether conflicting evidence exists */
  conflictStatus: 'none' | 'minor_conflict' | 'major_conflict'
  /** Human-readable explanation of the assessment */
  explanation: string
  /** Specific actions to improve maturity */
  nextBestActions: string[]
  /** When this assessment was computed */
  assessedAt: string
}

/** Input to the deterministic maturity evaluator */
export interface MaturityEvaluationInput {
  /** The fact/claim being evaluated */
  subjectId: string
  /** Self-reported information exists? */
  hasSelfReport: boolean
  /** Document evidence count */
  documentCount: number
  /** Number of independent internal sources corroborating */
  internalCorroborationCount: number
  /** Whether operational history supports the fact */
  hasOperationalHistory: boolean
  /** Number of external confirmations */
  externalConfirmationCount: number
  /** Number of times validated over time */
  repeatedValidationCount: number
  /** Whether provenance chain is complete */
  provenanceComplete: boolean
  /** Evidence age in days (365 = 1 year old, 730 = 2 years) */
  evidenceAgeDays: number
  /** Whether conflicting evidence exists */
  hasConflicts: boolean
  /** Severity of conflicts if present */
  conflictSeverity?: 'minor' | 'major'
  /** Supporting evidence IDs */
  evidenceIds: string[]
}

/** Maps maturity level to numeric score */
export const MATURITY_SCORE_MAP: Record<EvidenceMaturityLevel, number> = {
  [EvidenceMaturityLevel.EM0_NOT_DOCUMENTED]: 0,
  [EvidenceMaturityLevel.EM1_SELF_REPORTED]: 1,
  [EvidenceMaturityLevel.EM2_DOCUMENT_SUPPORTED]: 2,
  [EvidenceMaturityLevel.EM3_INTERNALLY_CORROBORATED]: 3,
  [EvidenceMaturityLevel.EM4_OPERATIONALLY_DEMONSTRATED]: 4,
  [EvidenceMaturityLevel.EM5_EXTERNALLY_CONFIRMED]: 5,
  [EvidenceMaturityLevel.EM6_CONTINUOUSLY_VALIDATED]: 6,
}
