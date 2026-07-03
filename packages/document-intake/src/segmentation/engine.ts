// ==========================================================================
// Kadarn Document Intake Engine — Evidence Segmentation Engine
// ==========================================================================
// Sprint 26D.
//
// Splits a NormalizedDocument into semantic segments at heading boundaries.
// Each section preserves its position, heading level, content, and full
// lineage back to the source document.
//
// Purpose: feed the Discovery Pipeline with focused, traceable sections
// instead of entire documents.
// ==========================================================================

import type { NormalizedDocument } from '../contracts.js'
import type {
  DocumentSection,
  SegmentationResult,
  SegmentationOptions,
} from './types.js'

// --------------------------------------------------------------------------
// Default options
// --------------------------------------------------------------------------

const DEFAULT_OPTIONS: Required<SegmentationOptions> = {
  minLevel: 1,
  maxLevel: 6,
  includePreamble: true,
}

// --------------------------------------------------------------------------
// Engine
// --------------------------------------------------------------------------

/**
 * Splits normalized markdown into evidence-ready semantic sections.
 *
 * Usage:
 *   const engine = new EvidenceSegmentationEngine()
 *   const result = engine.segment(normalizedDoc)
 *   // result.sections → DocumentSection[]
 */
export class EvidenceSegmentationEngine {
  private readonly options: Required<SegmentationOptions>

  constructor(options: SegmentationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Segment a normalized document into DocumentSection[].
   */
  segment(doc: NormalizedDocument): SegmentationResult {
    const lines = doc.markdown.split('\n')
    const sections = this.extractSections(doc.artifactId, doc.sourceHash, lines)

    return {
      documentId: doc.artifactId,
      sections,
      segmentedAt: new Date().toISOString(),
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  private extractSections(
    documentId: string,
    sourceHash: string,
    lines: string[],
  ): DocumentSection[] {
    const { minLevel, maxLevel, includePreamble } = this.options

    // Step 1: find all heading positions
    interface HeadingInfo {
      lineIndex: number
      level: number
      text: string
    }

    const headings: HeadingInfo[] = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(/^(#{1,6})\s+(.+)/)
      if (match) {
        const level = match[1].length
        if (level >= minLevel && level <= maxLevel) {
          headings.push({ lineIndex: i, level, text: match[2].trim() })
        }
      }
    }

    if (headings.length === 0) {
      // No headings found — entire document is one section
      return [{
        sectionId: `${documentId}/s0`,
        documentId,
        heading: '',
        headingLevel: 0,
        position: { startLine: 1, endLine: lines.length + 1, order: 0 },
        content: lines.join('\n'),
        lineage: [],
        sourceHash,
      }]
    }

    // Step 2: build sections by walking headings with a stack for lineage
    const sections: DocumentSection[] = []
    const stack: Array<{ level: number; sectionId: string }> = []
    let order = 0

    // Preamble: content before the first heading
    if (includePreamble && headings[0].lineIndex > 0) {
      const preambleLines = lines.slice(0, headings[0].lineIndex)
      const content = preambleLines.join('\n').trim()
      if (content.length > 0) {
        sections.push({
          sectionId: `${documentId}/s${order}`,
          documentId,
          heading: '',
          headingLevel: 0,
          position: { startLine: 1, endLine: headings[0].lineIndex, order },
          content,
          lineage: [],
          sourceHash,
        })
        order++
      }
    }

    // Process each heading
    for (let i = 0; i < headings.length; i++) {
      const current = headings[i]
      const nextHeading = headings[i + 1]

      // Pop stack until we match the current heading level (close parent sections)
      while (stack.length > 0 && stack[stack.length - 1].level >= current.level) {
        stack.pop()
      }

      // Build lineage from stack
      const lineage = stack.map(s => s.sectionId)
      const sectionId = `${documentId}/s${order}`

      // Push current heading onto stack
      stack.push({ level: current.level, sectionId })

      // Determine content range: from this heading line to the next heading line
      const startLine = current.lineIndex + 1 // 1-based
      const endLine = nextHeading ? nextHeading.lineIndex : lines.length
      const contentLines = lines.slice(current.lineIndex, endLine)
      const content = contentLines.join('\n').trim()

      sections.push({
        sectionId,
        documentId,
        heading: current.text,
        headingLevel: current.level,
        position: { startLine, endLine, order },
        content,
        lineage,
        sourceHash,
      })

      order++
    }

    return sections
  }
}
