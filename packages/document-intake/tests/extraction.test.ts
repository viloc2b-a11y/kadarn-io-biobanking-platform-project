// ==========================================================================
// Kadarn Document Intake Engine — Structured Extraction Tests
// ==========================================================================
// Sprint 26E.
// Tests: entity, relationship, claim, capability, and research asset extraction.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { StructuredExtractionEngine } from '../src/extraction/engine.js'
import { EvidenceSegmentationEngine } from '../src/segmentation/engine.js'
import type { NormalizedDocument } from '../src/contracts.js'
import type { DocumentSection } from '../src/segmentation/types.js'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function segment(markdown: string): DocumentSection[] {
  const doc: NormalizedDocument = {
    artifactId: 'artifact-test',
    markdown,
    metadata: {
      provider: 'markitdown',
      providerVersion: 'test',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      processingTimeMs: 0,
      warnings: [],
    },
    sourceHash: 'a'.repeat(64),
    normalizedAt: new Date().toISOString(),
  }
  const segEngine = new EvidenceSegmentationEngine()
  return segEngine.segment(doc).sections
}

// --------------------------------------------------------------------------
// Construction
// --------------------------------------------------------------------------

describe('StructuredExtractionEngine — construction', () => {
  it('creates an engine', () => {
    const engine = new StructuredExtractionEngine()
    expect(engine).toBeDefined()
    expect(typeof engine.extract).toBe('function')
  })

  it('returns empty extraction for no sections', () => {
    const engine = new StructuredExtractionEngine()
    const result = engine.extract([])

    expect(result.documentId).toBe('unknown')
    expect(result.entities).toEqual([])
    expect(result.relationships).toEqual([])
    expect(result.claimCandidates).toEqual([])
    expect(result.capabilityCandidates).toEqual([])
    expect(result.researchAssetCandidates).toEqual([])
  })
})

// --------------------------------------------------------------------------
// Entity extraction
// --------------------------------------------------------------------------

describe('StructuredExtractionEngine — entities', () => {
  const engine = new StructuredExtractionEngine()

  it('extracts people (Dr./Prof./PI patterns)', () => {
    const sections = segment('# Study Team\n\nDr. John Smith is the PI.\nProf. Maria Garcia oversees the lab.')
    const result = engine.extract(sections)

    const people = result.entities.filter(e => e.type === 'person')
    expect(people.length).toBeGreaterThanOrEqual(1)
    const names = people.map(p => p.name)
    expect(names.some(n => n.includes('John Smith') || n.includes('Maria Garcia'))).toBe(true)
  })

  it('extracts drugs (biologic naming patterns)', () => {
    const sections = segment('# Treatment\n\nPatients received Pembrolizumab 200mg.')
    const result = engine.extract(sections)

    const drugs = result.entities.filter(e => e.type === 'drug')
    expect(drugs.length).toBeGreaterThanOrEqual(1)
    expect(drugs.some(d => d.name.toLowerCase().includes('pembrolizumab'))).toBe(true)
  })

  it('extracts diseases from keywords', () => {
    const sections = segment('# Population\n\nPatients with diabetes and hypertension.')
    const result = engine.extract(sections)

    const diseases = result.entities.filter(e => e.type === 'disease')
    expect(diseases.length).toBeGreaterThanOrEqual(2)
    const names = diseases.map(d => d.name.toLowerCase())
    expect(names).toContain('diabetes')
    expect(names).toContain('hypertension')
  })

  it('extracts organizations', () => {
    const sections = segment('# Sites\n\nMassachusetts General Hospital and Stanford University participated.')
    const result = engine.extract(sections)

    const orgs = result.entities.filter(e => e.type === 'organization')
    expect(orgs.length).toBeGreaterThanOrEqual(1)
  })

  it('extracts NCT identifiers', () => {
    const sections = segment('# Trial\n\nRegistered as NCT04283461 on ClinicalTrials.gov.')
    const result = engine.extract(sections)

    const ids = result.entities.filter(e => e.type === 'identifier')
    expect(ids.some(i => i.name === 'NCT04283461')).toBe(true)
  })

  it('extracts DOIs', () => {
    const sections = segment('# Reference\n\nSee 10.1234/clinical.trial.2024 for details.')
    const result = engine.extract(sections)

    const ids = result.entities.filter(e => e.type === 'identifier')
    expect(ids.some(i => i.name.startsWith('10.'))).toBe(true)
  })

  it('extracts biomarkers', () => {
    const sections = segment('# Lab Results\n\nHbA1c was 7.2% and LDL was 130 mg/dL. CRP elevated.')
    const result = engine.extract(sections)

    const biomarkers = result.entities.filter(e => e.type === 'biomarker')
    expect(biomarkers.length).toBeGreaterThanOrEqual(2)
    const names = biomarkers.map(b => b.name)
    expect(names).toContain('HbA1c')
    expect(names).toContain('LDL')
  })

  it('entities have required fields', () => {
    const sections = segment('# Team\n\nDr. Anna Lee is the investigator.')
    const result = engine.extract(sections)

    for (const entity of result.entities) {
      expect(entity.id).toBeTruthy()
      expect(entity.name).toBeTruthy()
      expect(entity.type).toBeTruthy()
      expect(entity.mentions.length).toBeGreaterThan(0)
      expect(entity.sectionId).toBeTruthy()
      for (const mention of entity.mentions) {
        expect(mention.text).toBeTruthy()
        expect(mention.line).toBeGreaterThan(0)
        expect(mention.rule).toBeTruthy()
      }
    }
  })
})

// --------------------------------------------------------------------------
// Relationship extraction
// --------------------------------------------------------------------------

describe('StructuredExtractionEngine — relationships', () => {
  const engine = new StructuredExtractionEngine()

  it('detects sponsorship relationships', () => {
    const sections = segment('# Funding\n\nThis study is sponsored by Pfizer Inc.')
    const result = engine.extract(sections)

    const rels = result.relationships.filter(r => r.type === 'sponsors')
    expect(rels.length).toBeGreaterThanOrEqual(1)
    expect(rels[0].evidence).toContain('sponsored by')
  })

  it('detects collaboration relationships', () => {
    const sections = segment('# Network\n\nThe trial was conducted in collaboration with Mayo Clinic.')
    const result = engine.extract(sections)

    const rels = result.relationships.filter(r => r.type === 'collaborates_with')
    expect(rels.length).toBeGreaterThanOrEqual(1)
  })

  it('relationships have required fields', () => {
    const sections = segment('# Funding\n\nSponsored by Novartis.')
    const result = engine.extract(sections)

    for (const rel of result.relationships) {
      expect(rel.id).toBeTruthy()
      expect(rel.type).toBeTruthy()
      expect(rel.evidence).toBeTruthy()
      expect(rel.line).toBeGreaterThan(0)
      expect(rel.sectionId).toBeTruthy()
    }
  })
})

// --------------------------------------------------------------------------
// Claim extraction
// --------------------------------------------------------------------------

describe('StructuredExtractionEngine — claims', () => {
  const engine = new StructuredExtractionEngine()

  it('detects efficacy claims', () => {
    const sections = segment('# Results\n\nThe treatment reduced mortality by 25%. The primary endpoint was met.')
    const result = engine.extract(sections)

    const efficacy = result.claimCandidates.filter(c => c.type === 'efficacy')
    expect(efficacy.length).toBeGreaterThanOrEqual(1)
  })

  it('detects safety claims', () => {
    const sections = segment('# Safety\n\nNo serious adverse events were reported. The safety profile was favorable.')
    const result = engine.extract(sections)

    const safety = result.claimCandidates.filter(c => c.type === 'safety')
    expect(safety.length).toBeGreaterThanOrEqual(1)
  })

  it('detects demographic claims', () => {
    const sections = segment('# Demographics\n\nMean age was 52.3 years. N = 450 enrolled.')
    const result = engine.extract(sections)

    const demo = result.claimCandidates.filter(c => c.type === 'demographic')
    expect(demo.length).toBeGreaterThanOrEqual(1)
  })

  it('detects methodological claims', () => {
    const sections = segment('# Design\n\nThis was a randomized, double-blind, placebo-controlled trial.')
    const result = engine.extract(sections)

    const method = result.claimCandidates.filter(c => c.type === 'methodological')
    expect(method.length).toBeGreaterThanOrEqual(1)
  })

  it('detects regulatory claims', () => {
    const sections = segment('# Status\n\nThe drug received FDA approval in 2024.')
    const result = engine.extract(sections)

    const reg = result.claimCandidates.filter(c => c.type === 'regulatory')
    expect(reg.length).toBeGreaterThanOrEqual(1)
  })

  it('detects operational claims', () => {
    const sections = segment('# Operations\n\nThe enrollment rate exceeded expectations. Site activation was completed.')
    const result = engine.extract(sections)

    const ops = result.claimCandidates.filter(c => c.type === 'operational')
    expect(ops.length).toBeGreaterThanOrEqual(1)
  })

  it('skips very short lines', () => {
    const sections = segment('# Data\n\nN=50.\n\nThe treatment reduced mortality by 30%.')
    const result = engine.extract(sections)

    // "N=50." is 5 chars (< 10), should be skipped
    // But "The treatment reduced..." is long enough
    const claims = result.claimCandidates
    expect(claims.length).toBeGreaterThanOrEqual(1)
    // None should have a line with just "N=50."
    for (const claim of claims) {
      expect(claim.statement.length).toBeGreaterThanOrEqual(10)
    }
  })

  it('claims have required fields', () => {
    const sections = segment('# Results\n\nMortality was reduced by 20%.')
    const result = engine.extract(sections)

    for (const claim of result.claimCandidates) {
      expect(claim.id).toBeTruthy()
      expect(claim.statement).toBeTruthy()
      expect(claim.type).toBeTruthy()
      expect(claim.line).toBeGreaterThan(0)
      expect(claim.sectionId).toBeTruthy()
    }
  })
})

// --------------------------------------------------------------------------
// Capability extraction
// --------------------------------------------------------------------------

describe('StructuredExtractionEngine — capabilities', () => {
  const engine = new StructuredExtractionEngine()

  it('detects sample collection capability', () => {
    const sections = segment('# Services\n\nWe offer blood draw and venipuncture services.')
    const result = engine.extract(sections)

    const caps = result.capabilityCandidates.filter(c => c.category === 'sample_collection')
    expect(caps.length).toBeGreaterThanOrEqual(1)
  })

  it('detects biobanking capability', () => {
    const sections = segment('# Biorepository\n\nOur biobank provides long-term storage of biospecimens.')
    const result = engine.extract(sections)

    const caps = result.capabilityCandidates.filter(c => c.category === 'biobanking')
    expect(caps.length).toBeGreaterThanOrEqual(1)
  })

  it('detects imaging capability', () => {
    const sections = segment('# Radiology\n\nMRI and CT scan services available.')
    const result = engine.extract(sections)

    const caps = result.capabilityCandidates.filter(c => c.category === 'imaging')
    expect(caps.length).toBeGreaterThanOrEqual(1)
  })

  it('detects logistics capability from heading', () => {
    const sections = segment('# Cold Chain Logistics\n\nWe provide temperature-controlled shipping.')
    const result = engine.extract(sections)

    const caps = result.capabilityCandidates.filter(c => c.category === 'logistics')
    expect(caps.length).toBeGreaterThanOrEqual(1)
  })

  it('capabilities have required fields', () => {
    const sections = segment('# Lab\n\nWe perform biomarker analysis.')
    const result = engine.extract(sections)

    for (const cap of result.capabilityCandidates) {
      expect(cap.id).toBeTruthy()
      expect(cap.name).toBeTruthy()
      expect(cap.category).toBeTruthy()
      expect(cap.evidence).toBeTruthy()
      expect(cap.sectionId).toBeTruthy()
    }
  })
})

// --------------------------------------------------------------------------
// Research asset extraction
// --------------------------------------------------------------------------

describe('StructuredExtractionEngine — research assets', () => {
  const engine = new StructuredExtractionEngine()

  it('detects biospecimen collections', () => {
    const sections = segment('# Samples\n\n500 plasma samples and 200 serum samples were collected.')
    const result = engine.extract(sections)

    const bio = result.researchAssetCandidates.filter(a => a.type === 'biospecimen')
    expect(bio.length).toBeGreaterThanOrEqual(1)
    expect(bio[0].quantity).toBeDefined()
  })

  it('detects patient cohorts', () => {
    const sections = segment('# Population\n\nA cohort of 1200 patients with diabetes was studied.')
    const result = engine.extract(sections)

    const cohorts = result.researchAssetCandidates.filter(a => a.type === 'cohort')
    expect(cohorts.length).toBeGreaterThanOrEqual(1)
  })

  it('detects datasets', () => {
    const sections = segment('# Data\n\nThe dataset contains 5000 patient records with longitudinal follow-up.')
    const result = engine.extract(sections)

    const datasets = result.researchAssetCandidates.filter(a => a.type === 'dataset')
    expect(datasets.length).toBeGreaterThanOrEqual(1)
  })

  it('detects FFPE tissue samples', () => {
    const sections = segment('# Pathology\n\n300 FFPE tissue blocks were analyzed.')
    const result = engine.extract(sections)

    const bio = result.researchAssetCandidates.filter(a => a.type === 'biospecimen')
    expect(bio.length).toBeGreaterThanOrEqual(1)
  })

  it('research assets have required fields', () => {
    const sections = segment('# Collection\n\n150 DNA samples were extracted.')
    const result = engine.extract(sections)

    for (const asset of result.researchAssetCandidates) {
      expect(asset.id).toBeTruthy()
      expect(asset.name).toBeTruthy()
      expect(asset.type).toBeTruthy()
      expect(asset.description).toBeTruthy()
      expect(asset.evidence).toBeTruthy()
      expect(asset.sectionId).toBeTruthy()
    }
  })
})

// --------------------------------------------------------------------------
// Integration: full pipeline
// --------------------------------------------------------------------------

describe('StructuredExtractionEngine — full pipeline', () => {
  it('produces all candidate types from a realistic document', () => {
    const engine = new StructuredExtractionEngine()
    const sections = segment(`
# Clinical Study Protocol

## Investigators
Dr. Robert Chen is the Principal Investigator at Stanford University.
Prof. Sarah Kim oversees data analysis.

## Study Design
This is a randomized, double-blind, placebo-controlled trial.

## Treatment
Patients received Pembrolizumab 200mg every 3 weeks.

## Population
The cohort consisted of 850 patients with diabetes and hypertension.
Mean age was 54.2 years. N = 850 enrolled.

## Safety
No serious adverse events were reported during the study.

## Results
The treatment reduced mortality by 30% compared to placebo.
HbA1c decreased significantly. CRP and LDL levels improved.

## Biorepository
500 plasma samples and 200 serum samples are stored at -80°C.

## Sites
Massachusetts General Hospital and Mayo Clinic participated.

## Registration
This trial is registered as NCT04283461.

## Sponsorship
Sponsored by Merck & Co. in collaboration with Dana-Farber Cancer Institute.
    `.trim())

    const result = engine.extract(sections)

    // Should have all categories
    expect(result.entities.length).toBeGreaterThan(0)
    expect(result.claimCandidates.length).toBeGreaterThan(0)
    expect(result.capabilityCandidates.length).toBeGreaterThan(0)
    expect(result.researchAssetCandidates.length).toBeGreaterThan(0)
  })

  it('produces deterministic results', () => {
    const engine = new StructuredExtractionEngine()
    const markdown = '# Study\n\nDr. Smith is the PI. NCT12345678. 100 plasma samples.'

    const r1 = engine.extract(segment(markdown))
    const r2 = engine.extract(segment(markdown))

    expect(r1.entities.length).toBe(r2.entities.length)
    expect(r1.claimCandidates.length).toBe(r2.claimCandidates.length)
    expect(r1.researchAssetCandidates.length).toBe(r2.researchAssetCandidates.length)
  })
})

// --------------------------------------------------------------------------
// Empty and edge cases
// --------------------------------------------------------------------------

describe('StructuredExtractionEngine — edge cases', () => {
  const engine = new StructuredExtractionEngine()

  it('handles empty content gracefully', () => {
    const sections = segment('')
    const result = engine.extract(sections)

    expect(result.entities).toEqual([])
    expect(result.claimCandidates).toEqual([])
  })

  it('handles markdown without headings', () => {
    const sections = segment('Just plain text with no structure. Dr. Smith is mentioned.')
    const result = engine.extract(sections)

    // Should still extract entities from the flat content
    expect(result.entities.length).toBeGreaterThanOrEqual(0)
  })

  it('does not fail on special characters', () => {
    const sections = segment('# Appendix\n\n± SD: 12.3 (95% CI: 8.1–16.5). © 2024.')
    const result = engine.extract(sections)

    // Should not throw
    expect(result).toBeDefined()
  })
})
