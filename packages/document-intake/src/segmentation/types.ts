// ==========================================================================
// Kadarn Document Intake Engine — Segmentation Types
// ==========================================================================
// Sprint 26D.
//
// DocumentSection represents a semantic segment of a normalized markdown
// document. Each section is bounded by a heading and carries full lineage
// for traceability back to the source document.
// ==========================================================================

import type { NormalizedDocument } from '../contracts.js'

// --------------------------------------------------------------------------
// Section position
// --------------------------------------------------------------------------

/** Line-level position of a section within the markdown document. */
export interface SectionPosition {
  /** 1-based line number where this section starts (the heading line). */
  startLine: number
  /** 1-based line number where this section ends (exclusive). */
  endLine: number
  /** Zero-based order within the flattened section list. */
  order: number
}

// --------------------------------------------------------------------------
// DocumentSection
// --------------------------------------------------------------------------

/**
 * A semantic segment of a markdown document.
 *
 * Each section is a contiguous block bounded by a markdown heading.
 * Sections preserve their heading hierarchy and full lineage so that
 * any piece of evidence can be traced back to its source.
 */
export interface DocumentSection {
  /** Unique identifier: `${documentId}/s${order}` */
  sectionId: string
  /** The document artifact this section belongs to */
  documentId: string
  /** The heading text (without # prefix). Empty for preamble before first heading. */
  heading: string
  /** Heading level: 1 = h1, 2 = h2, ..., 6 = h6. 0 for preamble. */
  headingLevel: number
  /** Position in the source markdown */
  position: SectionPosition
  /** The markdown content of this section */
  content: string
  /** Lineage chain: array of section IDs from root to the immediate parent */
  lineage: string[]
  /** SHA-256 of the source document for traceability */
  sourceHash: string
}

// --------------------------------------------------------------------------
// Segmentation result
// --------------------------------------------------------------------------

/** The result of segmenting a normalized document. */
export interface SegmentationResult {
  /** The source document id */
  documentId: string
  /** All extracted sections in document order */
  sections: DocumentSection[]
  /** ISO timestamp when segmentation was performed */
  segmentedAt: string
}

// --------------------------------------------------------------------------
// Segmentation options
// --------------------------------------------------------------------------

export interface SegmentationOptions {
  /** Minimum heading level to split on (default: 1 — all headings). */
  minLevel?: number
  /** Maximum heading level to consider (default: 6). */
  maxLevel?: number
  /** Whether to include the preamble (content before the first heading). */
  includePreamble?: boolean
}
