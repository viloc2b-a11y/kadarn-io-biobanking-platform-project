// ==========================================================================
// Kadarn Document Intake Engine — Classification Engine Tests
// ==========================================================================
// Sprint 26C.
// Tests deterministic classification: protocol, IB, ICF, SOP, CV,
// certification, inspection, lab-manual, publication, unknown.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { DocumentClassificationEngine } from '../src/classification/engine.js'
import type {
  ClassificationLabel,
  DocumentClassification,
} from '../src/classification/types.js'
import type { DocumentArtifact, DocumentSource, NormalizedDocument } from '../src/contracts.js'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeSource(): DocumentSource {
  return {
    kind: 'upload',
    acquiredAt: new Date().toISOString(),
  }
}

function makeArtifact(overrides: Partial<DocumentArtifact> = {}): DocumentArtifact {
  return {
    id: 'artifact-test',
    filename: overrides.filename ?? 'document.pdf',
    format: 'pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    sha256: 'a'.repeat(64),
    filePath: '/tmp/doc.pdf',
    source: makeSource(),
    registeredAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeNormalized(markdown: string, overrides: Partial<NormalizedDocument> = {}): NormalizedDocument {
  return {
    artifactId: 'artifact-test',
    markdown,
    metadata: {
      provider: 'markitdown',
      providerVersion: 'test',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      processingTimeMs: 10,
      warnings: [],
    },
    sourceHash: 'a'.repeat(64),
    normalizedAt: new Date().toISOString(),
    ...overrides,
  }
}

// --------------------------------------------------------------------------
// Engine construction
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — construction', () => {
  it('creates an engine instance', () => {
    const engine = new DocumentClassificationEngine()
    expect(engine).toBeDefined()
    expect(typeof engine.classify).toBe('function')
  })

  it('returns classification with required fields', () => {
    const engine = new DocumentClassificationEngine()
    const artifact = makeArtifact()
    const doc = makeNormalized('# Unknown\n\nSome content.')

    const result = engine.classify(artifact, doc)

    expect(result.artifactId).toBe('artifact-test')
    expect(result.label).toBeDefined()
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(result.matches).toBeInstanceOf(Array)
    expect(result.alternatives).toBeInstanceOf(Array)
    expect(result.classifiedAt).toBeDefined()
  })
})

// --------------------------------------------------------------------------
// Classification: Protocol
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — Protocol', () => {
  const engine = new DocumentClassificationEngine()

  it('classifies by filename: protocol', () => {
    const artifact = makeArtifact({ filename: 'clinical-protocol-v3.pdf' })
    const doc = makeNormalized('# Some Document\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('protocol')
    expect(result.confidence).toBeGreaterThan(0.2)
  })

  it('classifies by heading: study protocol', () => {
    const artifact = makeArtifact({ filename: 'doc.pdf' })
    const doc = makeNormalized('# Clinical Study Protocol\n\n## Study Objectives\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('protocol')
  })

  it('classifies by content sections', () => {
    const artifact = makeArtifact({ filename: 'document.pdf' })
    const doc = makeNormalized(`
# Study Title

## Inclusion Criteria
Patients must meet...

## Exclusion Criteria
Patients with...

## Study Design
Randomized controlled...

## Statistical Analysis Plan
Analysis will use...

Content.
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('protocol')
  })

  it('reports matches evidence', () => {
    const artifact = makeArtifact({ filename: 'protocol-v2.pdf' })
    const doc = makeNormalized('# Clinical Protocol\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.matches.length).toBeGreaterThan(0)
    expect(result.matches.some(m => m.location === 'filename')).toBe(true)
  })
})

// --------------------------------------------------------------------------
// Classification: Investigator Brochure
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — Investigator Brochure', () => {
  const engine = new DocumentClassificationEngine()

  it('classifies by filename: ib', () => {
    const artifact = makeArtifact({ filename: 'IB-v5.pdf' })
    const doc = makeNormalized('# Investigator Brochure\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('investigator-brochure')
  })

  it('classifies by filename: investigator-brochure', () => {
    const artifact = makeArtifact({ filename: 'investigator-brochure-2024.pdf' })
    const doc = makeNormalized('# Document\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('investigator-brochure')
  })

  it('classifies by content: IB terms', () => {
    const artifact = makeArtifact({ filename: 'drug-info.pdf' })
    const doc = makeNormalized(`
# Product Information

## Nonclinical Studies
Pharmacology and toxicology data.

## Clinical Studies
Summary of clinical data.

## Pharmacokinetics
Absorption and distribution.

## Guidance for the Investigator
Important safety information.
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('investigator-brochure')
  })
})

// --------------------------------------------------------------------------
// Classification: ICF
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — ICF', () => {
  const engine = new DocumentClassificationEngine()

  it('classifies by filename: icf', () => {
    const artifact = makeArtifact({ filename: 'ICF-v2.pdf' })
    const doc = makeNormalized('# Informed Consent Form\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('icf')
  })

  it('classifies by filename: consentimiento', () => {
    const artifact = makeArtifact({ filename: 'consentimiento-informado.pdf' })
    const doc = makeNormalized('# Documento\n\nContenido.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('icf')
  })

  it('classifies by content: consent language', () => {
    const artifact = makeArtifact({ filename: 'form.pdf' })
    const doc = makeNormalized(`
# Study Participation

You are being asked to participate in a research study.
Your participation is voluntary.
Risks and benefits are described below.
Your signature indicates that you understand the study.
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('icf')
  })

  it('classifies consentimiento informado heading', () => {
    const artifact = makeArtifact({ filename: 'doc.pdf' })
    const doc = makeNormalized('# Consentimiento Informado\n\nContenido.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('icf')
  })
})

// --------------------------------------------------------------------------
// Classification: SOP
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — SOP', () => {
  const engine = new DocumentClassificationEngine()

  it('classifies by filename: sop', () => {
    const artifact = makeArtifact({ filename: 'SOP-001.pdf' })
    const doc = makeNormalized('# Standard Operating Procedure\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('sop')
  })

  it('classifies by SOP section structure', () => {
    const artifact = makeArtifact({ filename: 'procedure.pdf' })
    const doc = makeNormalized(`
# Sample Handling Procedure

## Purpose
To define sample handling.

## Scope
Applies to all lab personnel.

## Responsibilities
Lab manager oversees.

## Procedure
Step 1: Collect sample.
Step 2: Label sample.

## References
SOP-REF-001.
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('sop')
  })

  it('classifies by heading: SOP', () => {
    const artifact = makeArtifact({ filename: 'doc.pdf' })
    const doc = makeNormalized('# SOP\n\n## Purpose\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('sop')
  })
})

// --------------------------------------------------------------------------
// Classification: CV
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — CV', () => {
  const engine = new DocumentClassificationEngine()

  it('classifies by filename: cv', () => {
    const artifact = makeArtifact({ filename: 'CV-John-Doe.pdf' })
    const doc = makeNormalized('# Curriculum Vitae\n\n## Education\n\nPhD.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('cv')
  })

  it('classifies by filename: resume', () => {
    const artifact = makeArtifact({ filename: 'resume-2024.pdf' })
    const doc = makeNormalized('# Resume\n\n## Experience\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('cv')
  })

  it('classifies by content sections', () => {
    const artifact = makeArtifact({ filename: 'profile.pdf' })
    const doc = makeNormalized(`
# John Doe

## Education
PhD in Biology.

## Experience
10 years in clinical research.

## Publications
Doe J. et al. (2023).

## Skills
GCP, ICH, protocol writing.
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('cv')
  })
})

// --------------------------------------------------------------------------
// Classification: Certification
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — Certification', () => {
  const engine = new DocumentClassificationEngine()

  it('classifies by filename: certificate', () => {
    const artifact = makeArtifact({ filename: 'GCP-certificate.pdf' })
    const doc = makeNormalized('# Certificate of Completion\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('certification')
  })

  it('classifies by content: certifies that', () => {
    const artifact = makeArtifact({ filename: 'award.pdf' })
    const doc = makeNormalized(`
# Training Completion

This certifies that John Doe has completed the course.
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('certification')
  })

  it('classifies by filename: accreditation', () => {
    const artifact = makeArtifact({ filename: 'lab-accreditation.pdf' })
    const doc = makeNormalized('# Accreditation\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('certification')
  })
})

// --------------------------------------------------------------------------
// Classification: Inspection
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — Inspection', () => {
  const engine = new DocumentClassificationEngine()

  it('classifies by filename: inspection', () => {
    const artifact = makeArtifact({ filename: 'FDA-inspection-2024.pdf' })
    const doc = makeNormalized('# Inspection Report\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('inspection')
  })

  it('classifies by filename: audit', () => {
    const artifact = makeArtifact({ filename: 'internal-audit-Q2.pdf' })
    const doc = makeNormalized('# Audit Report\n\n## Audit Findings\n\nNon-conformance observed.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('inspection')
  })

  it('classifies by content: audit findings', () => {
    const artifact = makeArtifact({ filename: 'report.pdf' })
    const doc = makeNormalized(`
# Site Visit Summary

## Audit Findings
Three non-conformances were identified.

## Corrective Action
Actions taken within 30 days.

## Observations
Staff training needs improvement.
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('inspection')
  })
})

// --------------------------------------------------------------------------
// Classification: Lab Manual
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — Lab Manual', () => {
  const engine = new DocumentClassificationEngine()

  it('classifies by filename: lab-manual', () => {
    const artifact = makeArtifact({ filename: 'lab-manual-v3.pdf' })
    const doc = makeNormalized('# Laboratory Manual\n\nContent.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('lab-manual')
  })

  it('classifies by content: lab terms', () => {
    const artifact = makeArtifact({ filename: 'biospecimen-guide.pdf' })
    const doc = makeNormalized(`
# Biospecimen Handling Guide

## Specimen Handling
Proper collection and storage.

## Sample Processing
Centrifugation and aliquoting.

## Quality Control
Daily calibration checks.

## Laboratory Procedures
Standard protocols.
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('lab-manual')
  })
})

// --------------------------------------------------------------------------
// Classification: Publication
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — Publication', () => {
  const engine = new DocumentClassificationEngine()

  it('classifies by IMRaD structure', () => {
    const artifact = makeArtifact({ filename: 'article.pdf' })
    const doc = makeNormalized(`
# Title of Research Paper

## Abstract
Background and methods.

## Introduction
Background on the topic.

## Methods
Study design and population.

## Results
Primary and secondary outcomes.

## Discussion
Interpretation of findings.

## References
1. Author A. (2023).
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('publication')
  })

  it('classifies by DOI detection', () => {
    const artifact = makeArtifact({ filename: 'paper.pdf' })
    const doc = makeNormalized(`
# Research Article

## Abstract
Summary.

## Methods
Description.

## Results
Data.

## References
doi: 10.1234/journal.2024.001
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('publication')
  })

  it('detects journal reference', () => {
    const artifact = makeArtifact({ filename: 'manuscript.pdf' })
    const doc = makeNormalized(`
# Findings

## Abstract
...published in the Journal of Clinical Research...

## Methods
...

## Results
...

## References
...
    `.trim())

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('publication')
  })
})

// --------------------------------------------------------------------------
// Classification: Unknown
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — Unknown', () => {
  const engine = new DocumentClassificationEngine()

  it('returns unknown when nothing matches', () => {
    const artifact = makeArtifact({ filename: 'misc.pdf' })
    const doc = makeNormalized('# Random Notes\n\nJust some random text.')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('unknown')
    expect(result.confidence).toBe(0)
    expect(result.matches).toHaveLength(0)
  })

  it('returns unknown for completely empty document', () => {
    const artifact = makeArtifact({ filename: 'empty.pdf' })
    const doc = makeNormalized('')

    const result = engine.classify(artifact, doc)
    expect(result.label).toBe('unknown')
  })
})

// --------------------------------------------------------------------------
// Alternatives
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — alternatives', () => {
  const engine = new DocumentClassificationEngine()

  it('reports alternative classifications when they have partial scores', () => {
    // A document that looks somewhat like a protocol AND a publication
    const artifact = makeArtifact({ filename: 'study-report.pdf' })
    const doc = makeNormalized(`
# Clinical Study Report

## Abstract
Summary of findings.

## Introduction
Background.

## Study Design
Randomized trial.

## Inclusion Criteria
...

## Methods
...

## Results
Primary endpoint met.

## Discussion
...

## References
...
    `.trim())

    const result = engine.classify(artifact, doc)

    // Should have a winner
    expect(result.label).toBeDefined()
    expect(result.label).not.toBe('unknown')

    // Should have alternatives
    expect(result.alternatives.length).toBeGreaterThan(0)

    // Alternatives should have scores > 0
    for (const alt of result.alternatives) {
      expect(alt.score).toBeGreaterThan(0)
    }
  })
})

// --------------------------------------------------------------------------
// Priority: protocol beats publication when both match
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — tie-breaking', () => {
  const engine = new DocumentClassificationEngine()

  it('protocol wins over publication when filename says protocol', () => {
    const artifact = makeArtifact({ filename: 'protocol-amendment.pdf' })
    const doc = makeNormalized(`
# Study Protocol Amendment

## Abstract
Summary.

## Introduction
Background.

## Methods
Design.

## Results
Data.

## Discussion
Interpretation.

## References
...
    `.trim())

    const result = engine.classify(artifact, doc)
    // Protocol has priority 1, publication has priority 9
    // Both have content matches, but filename boosts protocol
    expect(result.label).toBe('protocol')
  })
})

// --------------------------------------------------------------------------
// Deterministic: same input = same output
// --------------------------------------------------------------------------

describe('DocumentClassificationEngine — determinism', () => {
  it('produces identical results for identical inputs', () => {
    const engine = new DocumentClassificationEngine()
    const artifact = makeArtifact({ filename: 'SOP-sample-handling.pdf' })
    const doc = makeNormalized(`
# Standard Operating Procedure

## Purpose
Define sample handling.

## Scope
Lab personnel.

## Responsibilities
Manager.

## Procedure
Step 1.
    `.trim())

    const r1 = engine.classify(artifact, doc)
    const r2 = engine.classify(artifact, doc)

    expect(r1.label).toBe(r2.label)
    expect(r1.confidence).toBe(r2.confidence)
    expect(r1.matches.length).toBe(r2.matches.length)
  })
})

// --------------------------------------------------------------------------
// Classification shape validation
// --------------------------------------------------------------------------

describe('DocumentClassification — shape', () => {
  const engine = new DocumentClassificationEngine()

  it('matches array items have required fields', () => {
    const artifact = makeArtifact({ filename: 'protocol-v1.pdf' })
    const doc = makeNormalized('# Clinical Protocol\n\nContent.')

    const result = engine.classify(artifact, doc)

    for (const match of result.matches) {
      expect(match.rule).toBeTruthy()
      expect(match.matched).toBeTruthy()
      expect(['filename', 'heading', 'content', 'metadata']).toContain(match.location)
    }
  })

  it('alternatives have label and score', () => {
    const artifact = makeArtifact({ filename: 'protocol-v1.pdf' })
    const doc = makeNormalized(`
# Clinical Protocol

## Abstract
Summary.

## Methods
Design.

## Results
Data.
    `.trim())

    const result = engine.classify(artifact, doc)

    for (const alt of result.alternatives) {
      expect(alt.label).toBeDefined()
      expect(alt.score).toBeGreaterThan(0)
    }
  })
})
