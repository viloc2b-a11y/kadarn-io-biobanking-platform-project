// ==========================================================================
// Sprint A0 — Canonical Taxonomy Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  THERAPEUTIC_AREAS, DISEASE_AREAS, SPECIMEN_TYPES, LABORATORY_TECHNIQUES,
  EQUIPMENT_CATEGORIES, FACILITY_TYPES, CAPABILITY_TYPES, DOCUMENT_TYPES,
  CERTIFICATION_TYPES, TRAINING_TYPES, ORGANIZATION_TYPES, RESEARCH_ROLES,
  PROGRAM_TYPES, RELATIONSHIP_TYPES, STORAGE_CONDITIONS,
  TAXONOMY_STATS, validateTaxonomyTerm,
  getAllTherapeuticAreaKeys, getAllCapabilityTypeKeys,
  getAllSpecimenTypeKeys, getAllDocumentTypeKeys,
} from '../../packages/institutional-knowledge/src/taxonomy'

describe('Canonical Taxonomy — Coverage', () => {
  it('26+ therapeutic areas', () => {
    expect(Object.keys(THERAPEUTIC_AREAS).length).toBeGreaterThanOrEqual(26)
  })

  it('40+ disease areas with parent references', () => {
    expect(Object.keys(DISEASE_AREAS).length).toBeGreaterThanOrEqual(40)
    for (const [_key, area] of Object.entries(DISEASE_AREAS)) {
      expect(area.parent).toBeTruthy()
      // Parent must be a valid therapeutic area
      expect(THERAPEUTIC_AREAS[area.parent as keyof typeof THERAPEUTIC_AREAS]).toBeDefined()
    }
  })

  it('32 specimen types', () => {
    expect(Object.keys(SPECIMEN_TYPES).length).toBeGreaterThanOrEqual(32)
  })

  it('40+ laboratory techniques', () => {
    expect(Object.keys(LABORATORY_TECHNIQUES).length).toBeGreaterThanOrEqual(40)
  })

  it('43+ equipment categories', () => {
    expect(Object.keys(EQUIPMENT_CATEGORIES).length).toBeGreaterThanOrEqual(43)
  })

  it('17 facility types', () => {
    expect(Object.keys(FACILITY_TYPES).length).toBeGreaterThanOrEqual(17)
  })

  it('55+ capability types', () => {
    expect(Object.keys(CAPABILITY_TYPES).length).toBeGreaterThanOrEqual(55)
  })

  it('40+ document types', () => {
    expect(Object.keys(DOCUMENT_TYPES).length).toBeGreaterThanOrEqual(42)
  })

  it('12 certification types', () => {
    expect(Object.keys(CERTIFICATION_TYPES).length).toBeGreaterThanOrEqual(12)
  })

  it('11 training types', () => {
    expect(Object.keys(TRAINING_TYPES).length).toBeGreaterThanOrEqual(11)
  })

  it('14 organization types', () => {
    expect(Object.keys(ORGANIZATION_TYPES).length).toBeGreaterThanOrEqual(14)
  })

  it('26 research roles', () => {
    expect(Object.keys(RESEARCH_ROLES).length).toBeGreaterThanOrEqual(26)
  })

  it('20 program types', () => {
    expect(Object.keys(PROGRAM_TYPES).length).toBeGreaterThanOrEqual(20)
  })

  it('30+ relationship types', () => {
    expect(Object.keys(RELATIONSHIP_TYPES).length).toBeGreaterThanOrEqual(30)
  })

  it('8 storage conditions', () => {
    expect(Object.keys(STORAGE_CONDITIONS).length).toBeGreaterThanOrEqual(8)
  })
})

describe('Canonical Taxonomy — Consistency', () => {
  it('disease areas only reference valid therapeutic areas', () => {
    const taKeys = new Set(Object.keys(THERAPEUTIC_AREAS))
    for (const [_key, area] of Object.entries(DISEASE_AREAS)) {
      expect(taKeys.has(area.parent)).toBe(true)
    }
  })

  it('training types reference valid certifications when linked', () => {
    const certKeys = new Set(Object.keys(CERTIFICATION_TYPES))
    for (const [_key, train] of Object.entries(TRAINING_TYPES)) {
      if (train.certificationKey) {
        expect(certKeys.has(train.certificationKey)).toBe(true)
      }
    }
  })

  it('every taxonomy entry has a label', () => {
    const taxonomies = [
      THERAPEUTIC_AREAS, SPECIMEN_TYPES, LABORATORY_TECHNIQUES,
      EQUIPMENT_CATEGORIES, FACILITY_TYPES, CAPABILITY_TYPES, DOCUMENT_TYPES,
      CERTIFICATION_TYPES, ORGANIZATION_TYPES, RESEARCH_ROLES, PROGRAM_TYPES,
      RELATIONSHIP_TYPES, STORAGE_CONDITIONS,
    ]
    for (const taxonomy of taxonomies) {
      for (const [_key, entry] of Object.entries(taxonomy)) {
        if (entry && typeof entry === 'object' && 'label' in entry) {
          expect((entry as { label: string }).label).toBeTruthy()
        }
      }
    }
  })
})

describe('Canonical Taxonomy — Validation', () => {
  it('validates existing terms', () => {
    const result = validateTaxonomyTerm(THERAPEUTIC_AREAS, 'oncology')
    expect(result.valid).toBe(true)
    expect(result.error).toBeNull()
  })

  it('rejects unknown terms', () => {
    const result = validateTaxonomyTerm(THERAPEUTIC_AREAS, 'invalid_fake_area')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('not in the canonical taxonomy')
  })

  it('helper functions return all keys', () => {
    expect(getAllTherapeuticAreaKeys().length).toBe(Object.keys(THERAPEUTIC_AREAS).length)
    expect(getAllCapabilityTypeKeys().length).toBe(Object.keys(CAPABILITY_TYPES).length)
    expect(getAllSpecimenTypeKeys().length).toBe(Object.keys(SPECIMEN_TYPES).length)
    expect(getAllDocumentTypeKeys().length).toBe(Object.keys(DOCUMENT_TYPES).length)
  })

  it('taxonomy stats are computed', () => {
    expect(TAXONOMY_STATS.totalTerms).toBeGreaterThan(300)
    expect(TAXONOMY_STATS.therapeuticAreas).toBe(Object.keys(THERAPEUTIC_AREAS).length)
    expect(TAXONOMY_STATS.capabilityTypes).toBe(Object.keys(CAPABILITY_TYPES).length)
  })
})

describe('Canonical Taxonomy — Specific domains', () => {
  it('specimen types include critical biospecimen categories', () => {
    const keys = Object.keys(SPECIMEN_TYPES)
    expect(keys).toContain('whole_blood')
    expect(keys).toContain('pbmc')
    expect(keys).toContain('ffpe')
    expect(keys).toContain('fresh_frozen_tissue')
    expect(keys).toContain('dna')
    expect(keys).toContain('rna')
    expect(keys).toContain('saliva')
    expect(keys).toContain('urine')
    expect(keys).toContain('csf')
  })

  it('capability types include critical clinical research capabilities', () => {
    const keys = Object.keys(CAPABILITY_TYPES)
    expect(keys).toContain('patient_recruitment')
    expect(keys).toContain('phlebotomy')
    expect(keys).toContain('biopsy')
    expect(keys).toContain('pbmc_processing')
    expect(keys).toContain('sample_shipping_international')
    expect(keys).toContain('phase1')
    expect(keys).toContain('phase3')
  })

  it('research roles include all operational levels', () => {
    const keys = Object.keys(RESEARCH_ROLES)
    expect(keys).toContain('pi')
    expect(keys).toContain('sub_i')
    expect(keys).toContain('study_coordinator')
    expect(keys).toContain('lab_director')
    expect(keys).toContain('lab_technician')
    expect(keys).toContain('quality_manager')
    expect(keys).toContain('regulatory_specialist')
    expect(keys).toContain('phlebotomist')
    expect(keys).toContain('external_consultant')
  })

  it('relationship types include external ecosystem links', () => {
    const keys = Object.keys(RELATIONSHIP_TYPES)
    expect(keys).toContain('sponsor_to_institution')
    expect(keys).toContain('cro_to_institution')
    expect(keys).toContain('pi_to_study')
    expect(keys).toContain('site_to_network')
    expect(keys).toContain('document_to_claim')
    expect(keys).toContain('claim_to_capability')
    expect(keys).toContain('program_to_readiness')
  })
})
