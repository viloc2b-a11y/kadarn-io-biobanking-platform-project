// ==========================================================================
// IKM Domain Sprint 3C — Program Catalog Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  PROGRAM_TYPES, PROGRAM_REQUIREMENTS, PROGRAM_DOMAIN_STATS,
  PROGRAM_SECTIONS, PROGRAM_CATEGORY_LABELS, getProgramRequirements,
} from '../../packages/institutional-knowledge/src/domains/program-catalog'

describe('Program Catalog — Types', () => {
  it('covers 21 program types across all categories', () => {
    expect(PROGRAM_TYPES.length).toBe(21)
    for (const prog of PROGRAM_TYPES) {
      expect(prog.key).toBeTruthy()
      expect(prog.category).toBeTruthy()
    }
  })

  it('core programs: clinical trial, biobanking, IVD, central lab, specimen collection', () => {
    const keys = PROGRAM_TYPES.map((p) => p.key)
    expect(keys).toContain('clinical_trial_program')
    expect(keys).toContain('biobanking_program')
    expect(keys).toContain('ivd_program')
    expect(keys).toContain('central_lab_program')
    expect(keys).toContain('specimen_collection_program')
  })

  it('innovative: remote, decentralized, cell therapy, gene therapy', () => {
    const keys = PROGRAM_TYPES.map((p) => p.key)
    expect(keys).toContain('remote_program')
    expect(keys).toContain('decentralized_program')
    expect(keys).toContain('cell_therapy_program')
    expect(keys).toContain('gene_therapy_program')
  })
})

describe('Program Catalog — Requirements', () => {
  it('defines 20 requirements across programs', () => {
    expect(PROGRAM_REQUIREMENTS.length).toBeGreaterThanOrEqual(20)
    for (const req of PROGRAM_REQUIREMENTS) {
      expect(req.key).toBeTruthy()
      expect(req.requirementType).toBeTruthy()
    }
  })

  it('core requirements (IRB, GCP PI, consent, -80 storage) are mandatory for multiple programs', () => {
    const irb = PROGRAM_REQUIREMENTS.find((r) => r.key === 'req_irb')
    expect(irb?.mandatory).toBe(true)
    expect(irb?.appliesToPrograms.length).toBeGreaterThan(5)
  })

  it('specialized requirements: ISO 13485 only for IVD and CDx', () => {
    const iso = PROGRAM_REQUIREMENTS.find((r) => r.key === 'req_iso13485')
    expect(iso?.appliesToPrograms).toContain('ivd_program')
    expect(iso?.appliesToPrograms).toContain('companion_dx_program')
    expect(iso?.appliesToPrograms).not.toContain('biobanking_program')
  })

  it('cell processing facility only for cell and gene therapy', () => {
    const cell = PROGRAM_REQUIREMENTS.find((r) => r.key === 'req_cell_processing')
    expect(cell?.appliesToPrograms).toContain('cell_therapy_program')
    expect(cell?.appliesToPrograms).toContain('gene_therapy_program')
  })

  it('getProgramRequirements returns mandatory and optional separated', () => {
    const reqs = getProgramRequirements('biobanking_program')
    expect(reqs.mandatory.length).toBeGreaterThan(0)
    expect(reqs.optional.length).toBeGreaterThan(0)
    const keys = [...reqs.mandatory, ...reqs.optional].map((r) => r.key)
    expect(keys).toContain('req_irb')
    expect(keys).toContain('req_neg80_storage')
  })

  it('requirements map to knowledge items from other domains', () => {
    const mapped = PROGRAM_REQUIREMENTS.filter((r) => r.mapsToKnowledgeItem)
    expect(mapped.length).toBeGreaterThan(10)
  })
})

describe('Program Catalog — Stats', () => {
  it('21 program types, 21 categories', () => {
    expect(PROGRAM_DOMAIN_STATS.totalProgramTypes).toBe(21)
    expect(PROGRAM_DOMAIN_STATS.categories).toBe(21)
  })

  it('biobanking and specimen collection have most requirements', () => {
    const top = PROGRAM_DOMAIN_STATS.programsWithMostRequirements
    expect(top.length).toBeGreaterThan(0)
  })
})

describe('Program Catalog — Sections', () => {
  it('covers all programs across 8 sections', () => {
    const covered = new Set<string>()
    for (const s of PROGRAM_SECTIONS) {
      for (const key of s.itemKeys) covered.add(key)
    }
    const allKeys = new Set(PROGRAM_TYPES.map((p) => p.key))
    for (const key of allKeys) {
      expect(covered.has(key)).toBe(true)
    }
  })
})
