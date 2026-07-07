// ==========================================================================
// OCP-5 — Document Auto-Classification Tests
// ==========================================================================

import { describe, expect, it } from 'vitest'
import { classifyDocument, buildClassificationGuidance } from '../../apps/web/src/lib/onboarding/document-classifier'
import type { DocumentCategory } from '../../apps/web/src/lib/onboarding/document-classifier'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OCP-5 document classification', () => {
  describe('category classification', () => {
    const cases: { label: string; expectedCategory: DocumentCategory }[] = [
      { label: 'Business License', expectedCategory: 'legal_entity_document' },
      { label: 'CLIA Certificate', expectedCategory: 'clia_certificate' },
      { label: 'CAP Accreditation', expectedCategory: 'clia_certificate' },
      { label: 'GCP Training Certificate', expectedCategory: 'gcp_training' },
      { label: 'IATA Dangerous Goods Certification', expectedCategory: 'iata_training' },
      { label: 'IATA Training Certificate', expectedCategory: 'iata_training' },
      { label: 'PI Medical License', expectedCategory: 'pi_medical_license' },
      { label: 'Sarah Chen CV', expectedCategory: 'cv' },
      { label: 'IRB Approval Letter', expectedCategory: 'irb_relationship_or_approval' },
      { label: 'Institutional Review Board Letter', expectedCategory: 'irb_relationship_or_approval' },
      { label: 'Quality SOP', expectedCategory: 'sop' },
      { label: 'Standard Operating Procedure — Sample Processing', expectedCategory: 'sop' },
      { label: 'Freezer Calibration Record', expectedCategory: 'calibration_record' },
      { label: 'IQ/OQ/PQ Equipment Qualification', expectedCategory: 'equipment_record' },
      { label: 'Temperature Log — Minus80 Freezer', expectedCategory: 'temperature_log' },
      { label: 'Liability Insurance Certificate', expectedCategory: 'insurance' },
      { label: 'Site Delegation Log', expectedCategory: 'delegation_log' },
      { label: 'FDA 1572 Financial Disclosure', expectedCategory: 'financial_disclosure' },
      { label: 'Study History Report', expectedCategory: 'study_history_evidence' },
      { label: 'FDA Inspection Report 2025', expectedCategory: 'audit_or_inspection_evidence' },
      { label: 'Random Unknown File', expectedCategory: 'other' },
    ]

    cases.forEach(({ label, expectedCategory }) => {
      it(`classifies "${label}" as ${expectedCategory}`, () => {
        const result = classifyDocument({ label, type: 'uploaded' })
        expect(result.category).toBe(expectedCategory)
      })
    })
  })

  describe('domain mapping', () => {
    it('CLIA maps to Infrastructure, Capabilities, Regulatory, Passport', () => {
      const result = classifyDocument({ label: 'CLIA Certificate', type: 'uploaded' })
      expect(result.domains).toContain('Infrastructure')
      expect(result.domains).toContain('Capabilities')
      expect(result.domains).toContain('Regulatory / Quality')
      expect(result.domains).toContain('Passport')
    })

    it('PI license maps to People, Capabilities, Passport', () => {
      const result = classifyDocument({ label: 'PI Medical License', type: 'uploaded' })
      expect(result.domains).toContain('People / Roles')
      expect(result.domains).toContain('Passport')
    })

    it('Study history maps to Historical Portfolio', () => {
      const result = classifyDocument({ label: 'Study History Report', type: 'uploaded' })
      expect(result.domains).toContain('Historical Portfolio')
    })
  })

  describe('OCP-3 conditional rules', () => {
    it('CLIA is conditional requirement when lab is declared', () => {
      const result = classifyDocument({
        label: 'CLIA Certificate',
        type: 'uploaded',
        hasLabDeclared: true,
      })
      expect(result.isConditionalRequirement).toBe(true)
      expect(result.conditionalRequirement).toBeDefined()
    })

    it('CLIA is NOT conditional when lab is not declared', () => {
      const result = classifyDocument({
        label: 'CLIA Certificate',
        type: 'uploaded',
        hasLabDeclared: false,
      })
      expect(result.isConditionalRequirement).toBe(false)
    })

    it('IATA is conditional requirement when shipping is declared', () => {
      const result = classifyDocument({
        label: 'IATA Training',
        type: 'uploaded',
        hasShippingDeclared: true,
      })
      expect(result.isConditionalRequirement).toBe(true)
    })

    it('IATA is NOT conditional when shipping is not declared', () => {
      const result = classifyDocument({
        label: 'IATA Training',
        type: 'uploaded',
        hasShippingDeclared: false,
        hasBiospecimenDeclared: false,
      })
      expect(result.isConditionalRequirement).toBe(false)
    })

    it('IATA activates with biospecimen declared even without shipping', () => {
      const result = classifyDocument({
        label: 'IATA Training',
        type: 'uploaded',
        hasShippingDeclared: false,
        hasBiospecimenDeclared: true,
      })
      expect(result.isConditionalRequirement).toBe(true)
    })

    it('IRB is not treated as conditional requirement', () => {
      const result = classifyDocument({
        label: 'IRB Approval Letter',
        type: 'uploaded',
        hasLabDeclared: true,
      })
      expect(result.isConditionalRequirement).toBe(false)
    })
  })

  describe('expiration detection', () => {
    it('CLIA has expiration tracking', () => {
      const result = classifyDocument({ label: 'CLIA Certificate', type: 'uploaded' })
      expect(result.hasExpiration).toBe(true)
    })

    it('GCP training has expiration tracking', () => {
      const result = classifyDocument({ label: 'GCP Training Certificate', type: 'uploaded' })
      expect(result.hasExpiration).toBe(true)
    })

    it('expiration unknown is not expired', () => {
      const result = classifyDocument({ label: 'CLIA Certificate', type: 'uploaded' })
      expect(result.reviewStatus).not.toBe('expired_or_outdated')
      expect(result.expirationNote).toContain('Unknown')
    })

    it('provided expiration date is used', () => {
      const futureDate = new Date(Date.now() + 365 * 86_400_000).toISOString()
      const result = classifyDocument({
        label: 'GCP Training Certificate',
        type: 'uploaded',
        expiresAt: futureDate,
      })
      expect(result.expiresAt).toBe(futureDate)
      expect(result.expirationNote).toContain('Valid until')
    })

    it('expired document is detected', () => {
      const pastDate = new Date(Date.now() - 365 * 86_400_000).toISOString()
      const result = classifyDocument({
        label: 'CLIA Certificate',
        type: 'uploaded',
        expiresAt: pastDate,
      })
      expect(result.reviewStatus).toBe('expired_or_outdated')
    })

    it('CV does not expire', () => {
      const result = classifyDocument({ label: 'Sarah Chen CV', type: 'uploaded' })
      expect(result.hasExpiration).toBe(false)
      expect(result.expirationNote).toBe('Not expirable')
    })
  })

  describe('Passport impact', () => {
    it('CLIA fills required evidence gap', () => {
      const result = classifyDocument({ label: 'CLIA Certificate', type: 'uploaded', hasLabDeclared: true })
      expect(result.passportImpact).toBe('fills_required_evidence_gap')
    })

    it('GCP training strengthens Passport', () => {
      const result = classifyDocument({ label: 'GCP Training', type: 'uploaded' })
      expect(result.passportImpact).toBe('strengthens_passport')
    })

    it('CV is optional supporting evidence', () => {
      const result = classifyDocument({ label: 'CV', type: 'uploaded' })
      expect(result.passportImpact).toBe('optional_supporting_evidence')
    })

    it('unknown document has no current Passport impact', () => {
      const result = classifyDocument({ label: 'Random File', type: 'uploaded' })
      expect(result.passportImpact).toBe('no_current_passport_impact')
    })
  })

  describe('review status', () => {
    it('newly classified document with no review gets classified status', () => {
      const result = classifyDocument({ label: 'Business License', type: 'uploaded' })
      expect(result.reviewStatus).toBe('classified')
    })

    it('reviewed document gets linked_to_passport status', () => {
      const result = classifyDocument({
        label: 'CLIA Certificate', type: 'uploaded', hasBeenReviewed: true,
      })
      expect(result.reviewStatus).toBe('linked_to_passport')
    })

    it('conditional requirement without review needs review', () => {
      const result = classifyDocument({
        label: 'CLIA Certificate', type: 'uploaded', hasLabDeclared: true,
      })
      expect(result.reviewStatus).toBe('needs_review')
    })
  })
})

describe('OCP-5 classification guidance', () => {
  it('produces summary, impact, and action text', () => {
    const classification = classifyDocument({
      label: 'CLIA Certificate', type: 'uploaded', hasLabDeclared: true,
    })
    const guidance = buildClassificationGuidance(classification)
    expect(guidance.summary).toContain('classified')
    expect(guidance.impact.length).toBeGreaterThan(0)
    expect(guidance.action.length).toBeGreaterThan(0)
  })

  it('action mentions expiration when unknown', () => {
    const classification = classifyDocument({ label: 'GCP Training Certificate', type: 'uploaded' })
    const guidance = buildClassificationGuidance(classification)
    expect(guidance.action).toContain('Expiration unknown')
  })
})

describe('OCP-5 Vilo Research document set', () => {
  const viloDocs = [
    { label: 'Business License — Vilo Research', type: 'license' },
    { label: 'CLIA Certificate — Main Campus Lab', type: 'certification' },
    { label: 'PI Medical License — Sarah Chen MD', type: 'license' },
    { label: 'GCP Training Certificate — Sarah Chen', type: 'training' },
    { label: 'IATA Dangerous Goods Training', type: 'training' },
    { label: 'IRB Approval Letter', type: 'regulatory' },
    { label: 'Freezer Temperature Log — Q1 2026', type: 'log' },
    { label: 'Study History — Vilo Oncology Trials 2022-2025', type: 'history' },
    { label: 'Insurance Certificate', type: 'insurance' },
  ]

  const viloInfra = {
    hasLabDeclared: true,
    hasBiospecimenDeclared: true,
    hasShippingDeclared: true,
  }

  it('Vilo business license is legal entity', () => {
    const r = classifyDocument({ ...viloDocs[0], ...viloInfra })
    expect(r.category).toBe('legal_entity_document')
    expect(r.domains).toContain('Institution Identity')
  })

  it('Vilo CLIA is conditional on lab declaration', () => {
    const r = classifyDocument({ ...viloDocs[1], ...viloInfra })
    expect(r.isConditionalRequirement).toBe(true)
    expect(r.category).toBe('clia_certificate')
  })

  it('Vilo PI license strengthens People/Leadership', () => {
    const r = classifyDocument({ ...viloDocs[2], ...viloInfra })
    expect(r.category).toBe('pi_medical_license')
    expect(r.domains).toContain('People / Roles')
    expect(r.domains).toContain('Passport')
  })

  it('Vilo GCP strengthens People/Training', () => {
    const r = classifyDocument({ ...viloDocs[3], ...viloInfra })
    expect(r.category).toBe('gcp_training')
    expect(r.passportImpact).toBe('strengthens_passport')
  })

  it('Vilo IATA only matters because shipping is declared', () => {
    const r = classifyDocument({ ...viloDocs[4], ...viloInfra })
    expect(r.isConditionalRequirement).toBe(true)
  })

  it('Vilo IATA is NOT conditional when no shipping', () => {
    const r = classifyDocument({ ...viloDocs[4], hasLabDeclared: true, hasBiospecimenDeclared: false, hasShippingDeclared: false })
    expect(r.isConditionalRequirement).toBe(false)
  })

  it('Vilo IRB is not universal — classified as relationship/approval, not conditional', () => {
    const r = classifyDocument({ ...viloDocs[5], ...viloInfra })
    expect(r.category).toBe('irb_relationship_or_approval')
    expect(r.isConditionalRequirement).toBe(false)
  })

  it('Vilo temperature log strengthens Infrastructure', () => {
    const r = classifyDocument({ ...viloDocs[6], ...viloInfra })
    expect(r.category).toBe('temperature_log')
    expect(r.domains).toContain('Infrastructure')
  })

  it('Vilo study history strengthens Historical Portfolio', () => {
    const r = classifyDocument({ ...viloDocs[7], ...viloInfra })
    expect(r.category).toBe('study_history_evidence')
    expect(r.domains).toContain('Historical Portfolio')
  })

  it('Vilo missing expiration dates do not become expired', () => {
    const results = viloDocs.map((d) => classifyDocument({ ...d, ...viloInfra }))
    for (const r of results) {
      if (r.hasExpiration && !r.expiresAt) {
        expect(r.reviewStatus).not.toBe('expired_or_outdated')
      }
    }
  })
})
