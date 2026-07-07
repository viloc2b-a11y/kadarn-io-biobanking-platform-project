// ==========================================================================
// OCP-6 — Historical Portfolio Tests
// ==========================================================================

import { describe, expect, it } from 'vitest'
import { deriveHistoricalPortfolio } from '../../apps/web/src/lib/onboarding/historical-portfolio'
import type { HistoricalPortfolioInput } from '../../apps/web/src/lib/onboarding/historical-portfolio'
import type { DocumentClassification } from '../../apps/web/src/lib/onboarding/document-classifier'

function viloInput(): HistoricalPortfolioInput {
  return {
    memoryEvents: [
      { id: 'mem-1', date: '2016-03-15', title: 'Vilo Research founded', domain: 'Institutional Timeline', description: 'Independent research site.', linkedEvidence: ['Business License'] },
      { id: 'mem-2', date: '2018-06-01', title: 'Therapeutic expansion into Endocrinology', domain: 'Research History', description: 'Expanded from Oncology.', linkedEvidence: [] },
      { id: 'mem-3', date: '2020-01-10', title: 'Acquired minus80 freezer for biospecimen storage', domain: 'Location / Infrastructure History', description: 'Added -80C storage.', linkedEvidence: ['Temperature Log'] },
      { id: 'mem-4', date: '2022-09-01', title: 'Phase II Oncology trial completed', domain: 'Research History', description: 'Completed Phase II trial.', linkedEvidence: ['Study History Report'] },
    ],
    classifiedDocs: [
      { category: 'legal_entity_document', categoryLabel: 'Legal entity document' } as DocumentClassification,
      { category: 'gcp_training', categoryLabel: 'GCP training' } as DocumentClassification,
      { category: 'study_history_evidence', categoryLabel: 'Study history evidence' } as DocumentClassification,
      { category: 'temperature_log', categoryLabel: 'Temperature log' } as DocumentClassification,
    ],
    foundedYear: '2016',
    organizationType: 'Independent Research Site',
    hasLabDeclared: true,
    hasBiospecimenDeclared: true,
    capabilityNames: ['Clinical Research Operations', 'Biospecimen Collection', 'Sample Processing'],
    hasStudyHistoryEvidence: true,
    hasAuditEvidence: false,
  }
}

function minimalInput(): HistoricalPortfolioInput {
  return {
    memoryEvents: [], classifiedDocs: [], foundedYear: null, organizationType: null,
    hasLabDeclared: false, hasBiospecimenDeclared: false, capabilityNames: [],
    hasStudyHistoryEvidence: false, hasAuditEvidence: false,
  }
}

describe('OCP-6 historical portfolio', () => {
  it('founding event type is correct', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    expect(r.events.find((e) => e.type === 'founding_or_institution_creation')).toBeDefined()
  })

  it('founding with evidence is DOCUMENT_BACKED_HISTORY', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    const f = r.events.find((e) => e.type === 'founding_or_institution_creation')
    expect(f!.evidenceState).toBe('DOCUMENT_BACKED_HISTORY')
  })

  it('founding without year is UNKNOWN_DATE', () => {
    const r = deriveHistoricalPortfolio({ ...viloInput(), foundedYear: null, classifiedDocs: [] })
    expect(r.events.find((e) => e.type === 'founding_or_institution_creation')!.evidenceState).toBe('UNKNOWN_DATE')
  })

  it('capability milestones are derived', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    expect(r.events.filter((e) => e.type === 'capability_acquisition').length).toBeGreaterThanOrEqual(3)
  })

  it('document categories map to history events', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    expect(r.events.filter((e) => e.source === 'document').length).toBeGreaterThanOrEqual(3)
  })

  it('freezer is infrastructure event', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    const f = r.events.find((e) => e.title.includes('freezer'))
    expect(f).toBeDefined()
    expect(f!.type).toBe('infrastructure_expansion')
    expect(f!.linkedDocuments).toContain('Temperature Log')
  })

  it('study history evidence maps to study experience', () => {
    const r = deriveHistoricalPortfolio({ ...minimalInput(), classifiedDocs: [{ category: 'study_history_evidence', categoryLabel: 'Study history evidence' }] as DocumentClassification[] })
    expect(r.events.some((e) => e.type === 'study_experience')).toBe(true)
  })

  it('gcp training maps to certification milestone', () => {
    const r = deriveHistoricalPortfolio({ ...minimalInput(), classifiedDocs: [{ category: 'gcp_training', categoryLabel: 'GCP training' }] as DocumentClassification[] })
    expect(r.events.some((e) => e.type === 'certification_or_training_milestone')).toBe(true)
  })

  it('reports missing founding date gap', () => {
    const r = deriveHistoricalPortfolio(minimalInput())
    expect(r.gaps.some((g) => g.id === 'gap-founding-date')).toBe(true)
  })

  it('reports missing study history gap', () => {
    const r = deriveHistoricalPortfolio(minimalInput())
    expect(r.gaps.some((g) => g.id === 'gap-study-history')).toBe(true)
  })

  it('baseline is met with founding year + capabilities', () => {
    const r = deriveHistoricalPortfolio({ ...minimalInput(), foundedYear: '2020', capabilityNames: ['Clinical Research'] })
    expect(r.baselineMet).toBe(true)
  })

  it('baseline is not met with no data', () => {
    expect(deriveHistoricalPortfolio(minimalInput()).baselineMet).toBe(false)
  })

  it('document-backed count is computed', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    expect(r.documentBackedCount).toBeGreaterThan(0)
  })

  it('completeness percentage is in range', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    expect(r.completenessPercentage).toBeGreaterThan(0)
    expect(r.completenessPercentage).toBeLessThanOrEqual(100)
  })

  it('Vilo: all 4 source types present', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    const sources = new Set(r.events.map((e) => e.source))
    expect(sources.has('canonical_object')).toBe(true)
    expect(sources.has('derived')).toBe(true)
    expect(sources.has('document')).toBe(true)
    expect(sources.has('memory_event')).toBe(true)
  })

  it('Vilo: Phase II study is in portfolio', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    expect(r.events.some((e) => e.title.includes('Phase II'))).toBe(true)
  })

  it('Vilo: biospecimen capability is in portfolio', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    expect(r.events.some((e) => e.title.includes('Biospecimen'))).toBe(true)
  })

  it('memory event without linked evidence is DECLARED_HISTORY', () => {
    const r = deriveHistoricalPortfolio(viloInput())
    const exp = r.events.find((e) => e.title.includes('Endocrinology'))
    expect(exp).toBeDefined()
    expect(exp!.evidenceState).toBe('DECLARED_HISTORY')
  })
})
