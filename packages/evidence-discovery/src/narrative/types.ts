// ==========================================================================
// Institutional Narrative — Domain Types
// ==========================================================================
// Sprint 20B.5.
//
// Converts Timeline + Capabilities + Candidate Claims into an institutional
// narrative. Every sentence is traceable to evidence.
// No invented information. No Evidence Core modification.
// ==========================================================================

export type NarrativeSectionType =
  | 'institution_overview'
  | 'timeline_chronology'
  | 'capability_summary'
  | 'research_activity'
  | 'regulatory_compliance';

export interface NarrativeCitation {
  /** Type of evidence being cited */
  type: 'document' | 'entity' | 'relationship' | 'event' | 'capability' | 'claim';
  /** ID of the evidence */
  id: string;
  /** Human-readable label */
  label: string;
}

export interface NarrativeParagraph {
  /** Paragraph text */
  text: string;
  /** Evidence citations for this paragraph */
  citations: NarrativeCitation[];
}

export interface NarrativeSection {
  /** Unique section ID */
  sectionId: string;
  /** Section title */
  title: string;
  /** Section type */
  type: NarrativeSectionType;
  /** Ordered paragraphs */
  paragraphs: NarrativeParagraph[];
  /** Display order */
  order: number;
}

export interface InstitutionalNarrative {
  /** Site/institution identifier */
  siteId: string;
  /** When this narrative was generated */
  generatedAt: string;
  /** Narrative sections */
  sections: NarrativeSection[];
  /** Executive summary (3-4 sentences) */
  summary: string;
  /** Total evidence citations across all paragraphs */
  totalCitations: number;
  /** Total paragraphs across all sections */
  totalParagraphs: number;
}
