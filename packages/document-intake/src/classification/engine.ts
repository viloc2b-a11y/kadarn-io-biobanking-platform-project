// ==========================================================================
// Kadarn Document Intake Engine — Classification Engine
// ==========================================================================
// Sprint 26C.
//
// Deterministic rule-based classifier for normalized documents.
// Uses filename, markdown headings, and content keyword analysis.
// No AI, no generative models, no external calls.
//
// Rules are additive: each rule contributes a score 0.0–1.0.
// The highest aggregate score wins. Ties broken by rule precedence.
// ==========================================================================

import type { NormalizedDocument } from '../contracts.js'
import type { DocumentArtifact } from '../contracts.js'
import type {
  ClassificationLabel,
  ClassificationMatch,
  DocumentClassification,
} from './types.js'

// --------------------------------------------------------------------------
// Rule definition
// --------------------------------------------------------------------------

interface ClassificationRule {
  label: ClassificationLabel
  /** Priority: lower = higher precedence in ties */
  priority: number
  /** Run all matchers and return matches + total score */
  evaluate(artifact: DocumentArtifact, doc: NormalizedDocument): {
    matches: ClassificationMatch[]
    score: number
  }
}

// --------------------------------------------------------------------------
// Engine
// --------------------------------------------------------------------------

/**
 * Deterministic document classifier.
 *
 * Usage:
 *   const engine = new DocumentClassificationEngine()
 *   const classification = engine.classify(artifact, normalizedDoc)
 */
export class DocumentClassificationEngine {
  private readonly rules: ClassificationRule[]

  constructor() {
    this.rules = buildRules()
  }

  /**
   * Classify a normalized document using rule-based matching.
   *
   * @param artifact — the original document artifact (for filename analysis)
   * @param doc — the normalized markdown document
   * @returns DocumentClassification with label, confidence, matches, and alternatives
   */
  classify(
    artifact: DocumentArtifact,
    doc: NormalizedDocument,
  ): DocumentClassification {
    // Run all rules and collect results
    const results = this.rules.map(rule => ({
      label: rule.label,
      priority: rule.priority,
      ...rule.evaluate(artifact, doc),
    }))

    // Sort: highest score first, then by priority (lower = higher precedence)
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.priority - b.priority
    })

    const winner = results[0]
    const alternatives = results
      .slice(1)
      .filter(r => r.score > 0)
      .map(r => ({ label: r.label, score: r.score }))

    // If no rule matched, classify as unknown
    const label = winner.score > 0 ? winner.label : ('unknown' as ClassificationLabel)
    const confidence = this.calibrateConfidence(
      label === 'unknown' ? 0 : winner.score,
      winner.matches.length,
    )

    return {
      artifactId: artifact.id,
      label,
      confidence,
      matches: label === 'unknown' ? [] : winner.matches,
      alternatives,
      classifiedAt: new Date().toISOString(),
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  /**
   * Calibrate raw score into a 0.0–1.0 confidence.
   *
   * Small number of matches with high scores = high confidence.
   * Many weak matches = moderate confidence.
   */
  private calibrateConfidence(rawScore: number, matchCount: number): number {
    if (rawScore <= 0) return 0

    // Strength from match quality (capped at 1.0)
    const quality = Math.min(rawScore / 3, 1.0)

    // Damping for many low-quality matches
    const quantityBonus = Math.min(matchCount / 3, 1.0) * 0.2

    return Math.min(quality + quantityBonus, 1.0)
  }
}

// --------------------------------------------------------------------------
// Rule builders
// --------------------------------------------------------------------------

function buildRules(): ClassificationRule[] {
  return [
    protocolRule(),
    investigatorBrochureRule(),
    icfRule(),
    sopRule(),
    cvRule(),
    certificationRule(),
    inspectionRule(),
    labManualRule(),
    publicationRule(),
  ]
}

// --------------------------------------------------------------------------
// Common helpers
// --------------------------------------------------------------------------

/** Extract the first heading (h1) from markdown. */
function firstHeading(doc: NormalizedDocument): string {
  const match = doc.markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

/** Extract all headings (h1–h3) from markdown. */
function allHeadings(doc: NormalizedDocument): string[] {
  const matches = doc.markdown.matchAll(/^#{1,3}\s+(.+)$/gm)
  return [...matches].map(m => m[1].trim())
}

/** Case-insensitive keyword match in text. */
function hasKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase())
}

/** Check if any of the keywords appear in text. */
function hasAnyKeyword(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return keywords.filter(k => lower.includes(k.toLowerCase()))
}

/** Check if text contains a regex pattern. */
function matchesPattern(text: string, pattern: RegExp): boolean {
  return pattern.test(text)
}

/** Normalize filename: lowercase, no extension. */
function baseFilename(artifact: DocumentArtifact): string {
  return artifact.filename.replace(/\.[^/.]+$/, '').toLowerCase()
}

// ==========================================================================
// Individual classification rules
// ==========================================================================

// --------------------------------------------------------------------------
// Protocol
// --------------------------------------------------------------------------

function protocolRule(): ClassificationRule {
  return {
    label: 'protocol',
    priority: 1,
    evaluate(artifact, doc) {
      const matches: ClassificationMatch[] = []
      let score = 0
      const filename = baseFilename(artifact)
      const heading = firstHeading(doc)
      const headings = allHeadings(doc)
      const content = doc.markdown

      // Filename signals (strong: +0.8 each)
      const filenameTerms = ['protocol', 'study-protocol', 'clinical-protocol', 'trial-protocol']
      for (const term of filenameTerms) {
        if (hasKeyword(filename, term)) {
          matches.push({ rule: 'protocol-filename', matched: term, location: 'filename' })
          score += 0.8
          break
        }
      }

      // Heading signals (strong: +0.7)
      const headingTerms = ['study protocol', 'clinical protocol', 'trial protocol', 'clinical study protocol', 'synopsis']
      for (const term of headingTerms) {
        if (hasKeyword(heading, term)) {
          matches.push({ rule: 'protocol-heading', matched: term, location: 'heading' })
          score += 0.7
          break
        }
      }

      // Content signals (moderate: +0.15 each, capped)
      const sectionPatterns = [
        'study objectives',
        'investigational product',
        'inclusion criteria',
        'exclusion criteria',
        'primary endpoint',
        'secondary endpoint',
        'study design',
        'dose and administration',
        'statistical analysis plan',
      ]
      let contentHits = 0
      for (const pattern of sectionPatterns) {
        if (hasKeyword(content, pattern)) {
          contentHits++
        }
      }
      if (contentHits >= 3) {
        matches.push({
          rule: 'protocol-content',
          matched: `${contentHits} section patterns matched`,
          location: 'content',
        })
        score += Math.min(contentHits * 0.15, 0.9)
      }

      return { matches, score }
    },
  }
}

// --------------------------------------------------------------------------
// Investigator Brochure
// --------------------------------------------------------------------------

function investigatorBrochureRule(): ClassificationRule {
  return {
    label: 'investigator-brochure',
    priority: 2,
    evaluate(artifact, doc) {
      const matches: ClassificationMatch[] = []
      let score = 0
      const filename = baseFilename(artifact)
      const heading = firstHeading(doc)
      const content = doc.markdown

      // Filename: +0.9
      if (hasKeyword(filename, 'investigator-brochure') || hasKeyword(filename, 'ib')) {
        matches.push({ rule: 'ib-filename', matched: filename, location: 'filename' })
        score += 0.9
      }

      // Heading: +0.8
      if (hasKeyword(heading, "investigator's brochure") || hasKeyword(heading, 'investigator brochure')) {
        matches.push({ rule: 'ib-heading', matched: heading, location: 'heading' })
        score += 0.8
      }

      // Content: +0.2 each, capped at 1.0
      const ibTerms = [
        'nonclinical studies',
        'clinical studies',
        'pharmacology',
        'toxicology',
        'pharmacokinetics',
        'pharmaceutical formulation',
        'summary of data',
        'guidance for the investigator',
      ]
      let ibHits = 0
      for (const term of ibTerms) {
        if (hasKeyword(content, term)) {
          ibHits++
        }
      }
      if (ibHits >= 3) {
        matches.push({
          rule: 'ib-content',
          matched: `${ibHits} IB terms matched`,
          location: 'content',
        })
        score += Math.min(ibHits * 0.2, 1.0)
      }

      return { matches, score }
    },
  }
}

// --------------------------------------------------------------------------
// ICF (Informed Consent Form)
// --------------------------------------------------------------------------

function icfRule(): ClassificationRule {
  return {
    label: 'icf',
    priority: 3,
    evaluate(artifact, doc) {
      const matches: ClassificationMatch[] = []
      let score = 0
      const filename = baseFilename(artifact)
      const heading = firstHeading(doc)
      const content = doc.markdown

      // Filename
      if (hasKeyword(filename, 'icf') || hasKeyword(filename, 'informed-consent') || hasKeyword(filename, 'consentimiento')) {
        matches.push({ rule: 'icf-filename', matched: filename, location: 'filename' })
        score += 0.85
      }

      // Heading
      if (hasKeyword(heading, 'informed consent') || hasKeyword(heading, 'consentimiento informado')) {
        matches.push({ rule: 'icf-heading', matched: heading, location: 'heading' })
        score += 0.8
      }

      // Content — consent-specific language
      const consentPhrases = [
        'you are being asked to participate',
        'voluntary participation',
        'risks and benefits',
        'your signature indicates',
        'i have read and understand',
      ]
      let consentHits = 0
      for (const phrase of consentPhrases) {
        if (hasKeyword(content, phrase)) {
          consentHits++
        }
      }
      if (consentHits >= 1) {
        matches.push({
          rule: 'icf-content',
          matched: `${consentHits} consent phrases matched`,
          location: 'content',
        })
        score += Math.min(consentHits * 0.3, 1.0)
      }

      return { matches, score }
    },
  }
}

// --------------------------------------------------------------------------
// SOP
// --------------------------------------------------------------------------

function sopRule(): ClassificationRule {
  return {
    label: 'sop',
    priority: 4,
    evaluate(artifact, doc) {
      const matches: ClassificationMatch[] = []
      let score = 0
      const filename = baseFilename(artifact)
      const heading = firstHeading(doc)
      const headings = allHeadings(doc)
      const content = doc.markdown

      // Filename
      if (hasKeyword(filename, 'sop') || hasKeyword(filename, 'standard-operating')) {
        matches.push({ rule: 'sop-filename', matched: filename, location: 'filename' })
        score += 0.85
      }

      // Heading
      if (hasKeyword(heading, 'standard operating procedure') || heading.toUpperCase() === 'SOP') {
        matches.push({ rule: 'sop-heading', matched: heading, location: 'heading' })
        score += 0.8
      }

      // SOP structure sections: purpose, scope, responsibilities, definitions, procedure, references
      const sopSections = ['purpose', 'scope', 'responsibilities', 'procedure']
      let sopHits = 0
      for (const section of sopSections) {
        if (headings.some(h => h.toLowerCase().includes(section))) {
          sopHits++
        }
      }
      if (sopHits >= 3) {
        matches.push({
          rule: 'sop-structure',
          matched: `${sopHits} SOP sections matched`,
          location: 'heading',
        })
        score += 0.7
      }

      // Content
      if (hasKeyword(content, 'standard operating procedure') || hasKeyword(content, 'revision history')) {
        matches.push({ rule: 'sop-content', matched: 'SOP language', location: 'content' })
        score += 0.2
      }

      return { matches, score }
    },
  }
}

// --------------------------------------------------------------------------
// CV
// --------------------------------------------------------------------------

function cvRule(): ClassificationRule {
  return {
    label: 'cv',
    priority: 5,
    evaluate(artifact, doc) {
      const matches: ClassificationMatch[] = []
      let score = 0
      const filename = baseFilename(artifact)
      const heading = firstHeading(doc)
      const content = doc.markdown

      // Filename
      if (hasKeyword(filename, 'cv') || hasKeyword(filename, 'curriculum') || hasKeyword(filename, 'resume')) {
        matches.push({ rule: 'cv-filename', matched: filename, location: 'filename' })
        score += 0.85
      }

      // Heading
      if (hasKeyword(heading, 'curriculum vitae') || hasKeyword(heading, 'resume') || hasKeyword(heading, 'cv')) {
        matches.push({ rule: 'cv-heading', matched: heading, location: 'heading' })
        score += 0.8
      }

      // Content
      const cvTerms = ['education', 'experience', 'publications', 'skills']
      let cvHits = 0
      for (const term of cvTerms) {
        if (hasKeyword(content, term)) {
          cvHits++
        }
      }
      if (cvHits >= 2) {
        matches.push({ rule: 'cv-content', matched: `${cvHits} CV sections`, location: 'content' })
        score += Math.min(cvHits * 0.25, 0.7)
      }

      return { matches, score }
    },
  }
}

// --------------------------------------------------------------------------
// Certification
// --------------------------------------------------------------------------

function certificationRule(): ClassificationRule {
  return {
    label: 'certification',
    priority: 6,
    evaluate(artifact, doc) {
      const matches: ClassificationMatch[] = []
      let score = 0
      const filename = baseFilename(artifact)
      const heading = firstHeading(doc)
      const content = doc.markdown

      if (hasKeyword(filename, 'certificate') || hasKeyword(filename, 'certification') || hasKeyword(filename, 'accreditation')) {
        matches.push({ rule: 'cert-filename', matched: filename, location: 'filename' })
        score += 0.85
      }

      if (hasKeyword(heading, 'certificate') || hasKeyword(heading, 'certification') || hasKeyword(heading, 'accreditation')) {
        matches.push({ rule: 'cert-heading', matched: heading, location: 'heading' })
        score += 0.8
      }

      if (hasKeyword(content, 'certifies that') || hasKeyword(content, 'hereby certify') || hasKeyword(content, 'certified by')) {
        matches.push({ rule: 'cert-content', matched: 'certification language', location: 'content' })
        score += 0.5
      }

      return { matches, score }
    },
  }
}

// --------------------------------------------------------------------------
// Inspection
// --------------------------------------------------------------------------

function inspectionRule(): ClassificationRule {
  return {
    label: 'inspection',
    priority: 7,
    evaluate(artifact, doc) {
      const matches: ClassificationMatch[] = []
      let score = 0
      const filename = baseFilename(artifact)
      const heading = firstHeading(doc)
      const content = doc.markdown

      if (hasKeyword(filename, 'inspection') || hasKeyword(filename, 'audit') || hasKeyword(filename, 'site-visit')) {
        matches.push({ rule: 'inspect-filename', matched: filename, location: 'filename' })
        score += 0.85
      }

      if (hasKeyword(heading, 'inspection report') || hasKeyword(heading, 'audit report') || hasKeyword(heading, 'site visit')) {
        matches.push({ rule: 'inspect-heading', matched: heading, location: 'heading' })
        score += 0.8
      }

      const inspectTerms = ['audit findings', 'non-conformance', 'corrective action', 'observations']
      let inspectHits = 0
      for (const term of inspectTerms) {
        if (hasKeyword(content, term)) {
          inspectHits++
        }
      }
      if (inspectHits >= 2) {
        matches.push({ rule: 'inspect-content', matched: `${inspectHits} inspection terms`, location: 'content' })
        score += 0.5
      }

      return { matches, score }
    },
  }
}

// --------------------------------------------------------------------------
// Lab Manual
// --------------------------------------------------------------------------

function labManualRule(): ClassificationRule {
  return {
    label: 'lab-manual',
    priority: 8,
    evaluate(artifact, doc) {
      const matches: ClassificationMatch[] = []
      let score = 0
      const filename = baseFilename(artifact)
      const heading = firstHeading(doc)
      const content = doc.markdown

      if (hasKeyword(filename, 'lab-manual') || hasKeyword(filename, 'laboratory-manual') || hasKeyword(filename, 'lab-procedure')) {
        matches.push({ rule: 'labman-filename', matched: filename, location: 'filename' })
        score += 0.85
      }

      if (hasKeyword(heading, 'laboratory manual') || hasKeyword(heading, 'lab manual') || hasKeyword(heading, 'lab procedures')) {
        matches.push({ rule: 'labman-heading', matched: heading, location: 'heading' })
        score += 0.8
      }

      const labTerms = ['specimen handling', 'sample processing', 'quality control', 'laboratory procedures']
      let labHits = 0
      for (const term of labTerms) {
        if (hasKeyword(content, term)) {
          labHits++
        }
      }
      if (labHits >= 2) {
        matches.push({ rule: 'labman-content', matched: `${labHits} lab terms`, location: 'content' })
        score += 0.5
      }

      return { matches, score }
    },
  }
}

// --------------------------------------------------------------------------
// Publication
// --------------------------------------------------------------------------

function publicationRule(): ClassificationRule {
  return {
    label: 'publication',
    priority: 9,
    evaluate(artifact, doc) {
      const matches: ClassificationMatch[] = []
      let score = 0
      const heading = firstHeading(doc)
      const headings = allHeadings(doc)
      const content = doc.markdown

      // Publication structure: Abstract, Introduction, Methods, Results, Discussion, References
      const pubSections = ['abstract', 'introduction', 'methods', 'results', 'discussion', 'references']
      let pubHits = 0
      for (const section of pubSections) {
        if (headings.some(h => h.toLowerCase().includes(section))) {
          pubHits++
        }
      }

      if (pubHits >= 4) {
        matches.push({
          rule: 'pub-structure',
          matched: `${pubHits} IMRaD sections`,
          location: 'heading',
        })
        score += 0.9
      } else if (pubHits >= 2) {
        matches.push({
          rule: 'pub-structure',
          matched: `${pubHits} IMRaD sections`,
          location: 'heading',
        })
        score += 0.4
      }

      // DOI pattern
      if (matchesPattern(content, /\b10\.\d{4,}\/[^\s]+\b/)) {
        matches.push({ rule: 'pub-doi', matched: 'DOI detected', location: 'content' })
        score += 0.3
      }

      // Journal references
      if (hasKeyword(content, 'journal of') || hasKeyword(content, 'doi:')) {
        matches.push({ rule: 'pub-journal', matched: 'journal reference', location: 'content' })
        score += 0.15
      }

      return { matches, score }
    },
  }
}
