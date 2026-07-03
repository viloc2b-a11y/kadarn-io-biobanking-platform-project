// ==========================================================================
// Kadarn Document Intake Engine — Classification Types
// ==========================================================================
// Sprint 26C.
//
// Deterministic document classification. No AI, no generative models.
// Pure rule-based matching against filename, markdown headings, and content.
// ==========================================================================

// --------------------------------------------------------------------------
// Classification categories
// --------------------------------------------------------------------------

/**
 * Document classification categories.
 *
 * These represent the minimum viable taxonomy for biospecimen and clinical
 * research documents entering the Kadarn platform.
 */
export type ClassificationLabel =
  | 'protocol'
  | 'investigator-brochure'
  | 'icf'
  | 'sop'
  | 'cv'
  | 'certification'
  | 'inspection'
  | 'lab-manual'
  | 'publication'
  | 'unknown'

// --------------------------------------------------------------------------
// Classification result
// --------------------------------------------------------------------------

/** Evidence that contributed to the classification decision. */
export interface ClassificationMatch {
  /** The rule or source that produced this match */
  rule: string
  /** What was matched (e.g., keyword, heading, filename pattern) */
  matched: string
  /** Where the match was found */
  location: 'filename' | 'heading' | 'content' | 'metadata'
}

/**
 * The result of classifying a normalized document.
 */
export interface DocumentClassification {
  /** The document artifact this classification applies to */
  artifactId: string
  /** The assigned classification label */
  label: ClassificationLabel
  /** Confidence score: 0.0 (none) to 1.0 (certain) */
  confidence: number
  /** The evidence that led to this classification */
  matches: ClassificationMatch[]
  /** Alternative labels considered, with their scores */
  alternatives: Array<{ label: ClassificationLabel; score: number }>
  /** ISO timestamp when classification was performed */
  classifiedAt: string
}
