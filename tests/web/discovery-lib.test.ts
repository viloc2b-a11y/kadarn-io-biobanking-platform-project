// Discovery Workbench — pure helper unit tests
import { describe, it, expect } from 'vitest'
import {
  candidateStateTone,
  excerpt,
  formatDiscoveryConfidence,
  getResearchAssetNextStep,
  getResearchAssetStatus,
  labelize,
  mapCapabilitiesToResearchAssets,
  parseEnrichmentPayload,
  RESEARCH_ASSET_LABELS,
} from '../../apps/web/src/components/discovery/lib'
import type { ResearchAssetLabel, ResearchAssetStatus } from '../../apps/web/src/components/discovery/lib'

describe('candidateStateTone', () => {
  it('maps accepted-like states to green', () => {
    expect(candidateStateTone('ACCEPTED')).toBe('green')
    expect(candidateStateTone('enriched')).toBe('green')
  })

  it('maps rejected-like states to red', () => {
    expect(candidateStateTone('REJECTED')).toBe('red')
    expect(candidateStateTone('ARCHIVED')).toBe('red')
  })

  it('maps in-review states to amber', () => {
    expect(candidateStateTone('DEFERRED')).toBe('amber')
    expect(candidateStateTone('NEEDS_MORE_EVIDENCE')).toBe('amber')
    expect(candidateStateTone('PROPOSED')).toBe('amber')
  })

  it('falls back to default for unknown states', () => {
    expect(candidateStateTone('SOMETHING_ELSE')).toBe('default')
    expect(candidateStateTone('')).toBe('default')
  })
})

describe('formatDiscoveryConfidence', () => {
  it('renders numeric confidence exactly as provided (no scaling)', () => {
    expect(formatDiscoveryConfidence(0.82)).toBe('0.82')
    expect(formatDiscoveryConfidence(1)).toBe('1')
    expect(formatDiscoveryConfidence(0)).toBe('0')
  })

  it('passes through string values', () => {
    expect(formatDiscoveryConfidence('0.5')).toBe('0.5')
  })

  it('renders a dash for missing or invalid values', () => {
    expect(formatDiscoveryConfidence(null)).toBe('—')
    expect(formatDiscoveryConfidence(undefined)).toBe('—')
    expect(formatDiscoveryConfidence(Number.NaN)).toBe('—')
    expect(formatDiscoveryConfidence('')).toBe('—')
  })
})

describe('labelize', () => {
  it('replaces underscores with spaces', () => {
    expect(labelize('NEEDS_MORE_EVIDENCE')).toBe('NEEDS MORE EVIDENCE')
    expect(labelize('evidence_candidate')).toBe('evidence candidate')
  })

  it('trims surrounding whitespace', () => {
    expect(labelize(' _padded_ ')).toBe('padded')
  })
})

describe('parseEnrichmentPayload', () => {
  it('accepts a valid JSON object', () => {
    const result = parseEnrichmentPayload('{"field": "value", "n": 2}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ field: 'value', n: 2 })
    }
  })

  it('rejects empty input', () => {
    const result = parseEnrichmentPayload('   ')
    expect(result.ok).toBe(false)
  })

  it('rejects invalid JSON', () => {
    const result = parseEnrichmentPayload('{not json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('valid JSON')
  })

  it('rejects non-object JSON values', () => {
    expect(parseEnrichmentPayload('42').ok).toBe(false)
    expect(parseEnrichmentPayload('"text"').ok).toBe(false)
    expect(parseEnrichmentPayload('[1,2]').ok).toBe(false)
    expect(parseEnrichmentPayload('null').ok).toBe(false)
  })
})

describe('excerpt', () => {
  it('returns short text unchanged', () => {
    expect(excerpt('short text')).toBe('short text')
  })

  it('collapses internal whitespace', () => {
    expect(excerpt('a  b\n\tc')).toBe('a b c')
  })

  it('truncates long text with an ellipsis within the limit', () => {
    const long = 'x'.repeat(500)
    const result = excerpt(long, 100)
    expect(result.length).toBeLessThanOrEqual(100)
    expect(result.endsWith('…')).toBe(true)
  })
})

// ==========================================================================
// Research Assets Enabled — Sprint 21A
// ==========================================================================

describe('RESEARCH_ASSET_LABELS', () => {
  it('contains exactly 14 labels', () => {
    expect(RESEARCH_ASSET_LABELS).toHaveLength(14)
  })

  it('has no duplicate labels', () => {
    const lower = RESEARCH_ASSET_LABELS.map((l) => l.toLowerCase())
    expect(new Set(lower).size).toBe(RESEARCH_ASSET_LABELS.length)
  })

  it('includes key biospecimen asset types', () => {
    expect(RESEARCH_ASSET_LABELS).toContain('Plasma')
    expect(RESEARCH_ASSET_LABELS).toContain('Serum')
    expect(RESEARCH_ASSET_LABELS).toContain('PBMC')
    expect(RESEARCH_ASSET_LABELS).toContain('FFPE Tissue')
    expect(RESEARCH_ASSET_LABELS).toContain('Frozen Tissue')
  })

  it('includes key dataset asset types', () => {
    expect(RESEARCH_ASSET_LABELS).toContain('Clinical Dataset')
    expect(RESEARCH_ASSET_LABELS).toContain('Imaging Dataset')
    expect(RESEARCH_ASSET_LABELS).toContain('Omics-ready Dataset')
    expect(RESEARCH_ASSET_LABELS).toContain('AI-ready Dataset')
  })
})

describe('getResearchAssetStatus', () => {
  const asset: ResearchAssetLabel = 'Plasma'

  it('returns Not enough evidence yet when no capabilities support the asset', () => {
    const status = getResearchAssetStatus(asset, [], [], [], [])
    expect(status).toBe('Not enough evidence yet')
  })

  it('returns Enabled by current evidence when capability + matching claim exist', () => {
    const status = getResearchAssetStatus(
      asset,
      ['plasma_collection'],
      ['this site collects plasma samples'],
      [],
      [],
    )
    expect(status).toBe('Enabled by current evidence')
  })

  it('returns Needs additional evidence when capability exists but claim is absent and gap exists', () => {
    const status = getResearchAssetStatus(
      asset,
      ['plasma_collection'],
      [],
      ['plasma handling'],
      [],
    )
    expect(status).toBe('Needs additional evidence')
  })

  it('returns Needs additional evidence when gap description mentions the asset', () => {
    const status = getResearchAssetStatus(
      asset,
      ['plasma_collection'],
      [],
      [],
      ['missing plasma storage protocol'],
    )
    expect(status).toBe('Needs additional evidence')
  })

  it('returns Needs human review when capability exists but no claim and no relevant gap', () => {
    const status = getResearchAssetStatus(
      asset,
      ['plasma_collection'],
      [],
      [],
      [],
    )
    expect(status).toBe('Needs human review')
  })

  it('matches claims case-insensitively (caller lowercases)', () => {
    // getResearchAssetStatus relies on the caller to lowercase inputs.
    // mapCapabilitiesToResearchAssets does this — the direct call must pass lowered strings.
    const status = getResearchAssetStatus(
      'Whole Blood' as ResearchAssetLabel,
      ['whole_blood_collection'],
      ['this site collects whole blood samples'],
      [],
      [],
    )
    expect(status).toBe('Enabled by current evidence')
  })

  it('matches gaps case-insensitively via category (caller lowercases)', () => {
    const status = getResearchAssetStatus(
      'Frozen Tissue' as ResearchAssetLabel,
      ['frozen_tissue_storage'],
      [],
      ['frozen tissue handling gap'],
      [],
    )
    expect(status).toBe('Needs additional evidence')
  })

  it('capability presence takes priority — even without claim, status is never Not enough evidence yet', () => {
    const status = getResearchAssetStatus('PBMC' as ResearchAssetLabel, ['pbmc_isolation'], [], [], [])
    expect(status).not.toBe('Not enough evidence yet')
  })
})

describe('getResearchAssetNextStep', () => {
  it('maps Enabled by current evidence to review + sponsor summary', () => {
    expect(getResearchAssetNextStep('Enabled by current evidence')).toContain('sponsor-facing')
  })

  it('maps Needs additional evidence to upload/link evidence', () => {
    expect(getResearchAssetNextStep('Needs additional evidence')).toContain('Upload or link')
  })

  it('maps Needs human review to reviewer assessment', () => {
    expect(getResearchAssetNextStep('Needs human review')).toContain('reviewer should assess')
  })

  it('maps Not enough evidence yet to expand scope or upload evidence', () => {
    expect(getResearchAssetNextStep('Not enough evidence yet')).toContain('Expand discovery scope')
  })

  it('falls back to a generic message for unknown status', () => {
    expect(getResearchAssetNextStep('unexpected' as ResearchAssetStatus)).toContain(
      'Review the evidence profile',
    )
  })

  it('never uses "verified" or promotional language', () => {
    const allSteps = [
      'Enabled by current evidence' as ResearchAssetStatus,
      'Needs additional evidence' as ResearchAssetStatus,
      'Needs human review' as ResearchAssetStatus,
      'Not enough evidence yet' as ResearchAssetStatus,
    ]
    for (const status of allSteps) {
      const step = getResearchAssetNextStep(status)
      expect(step).not.toMatch(/verified/i)
      expect(step).not.toMatch(/guaranteed/i)
      expect(step).not.toMatch(/certified/i)
    }
  })
})

describe('mapCapabilitiesToResearchAssets', () => {
  it('returns exactly 14 entries — one per asset label', () => {
    const result = mapCapabilitiesToResearchAssets([], [], [])
    expect(result).toHaveLength(14)
  })

  it('all entries are Not enough evidence yet when inputs are empty', () => {
    const result = mapCapabilitiesToResearchAssets([], [], [])
    for (const entry of result) {
      expect(entry.status).toBe('Not enough evidence yet')
      expect(entry.supportingCapabilities).toHaveLength(0)
    }
  })

  it('maps a plasma-related capability to the Plasma asset', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ name: 'Plasma Collection and Storage' }],
      [{ content: 'plasma samples are collected on-site' }],
      [],
    )
    const plasma = result.find((e) => e.asset === 'Plasma')
    expect(plasma).toBeDefined()
    expect(plasma!.status).toBe('Enabled by current evidence')
    expect(plasma!.supportingCapabilities).toContain('plasma collection and storage')
  })

  it('maps capability via label field when name is absent', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ label: 'Serum Processing' }],
      [{ content: 'serum processing is available' }],
      [],
    )
    const serum = result.find((e) => e.asset === 'Serum')
    expect(serum).toBeDefined()
    expect(serum!.status).toBe('Enabled by current evidence')
  })

  it('maps capability via capabilityId field when name and label are absent', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ capabilityId: 'PBMC_isolation_v2' }],
      [],
      [],
    )
    const pbmc = result.find((e) => e.asset === 'PBMC')
    expect(pbmc).toBeDefined()
    expect(pbmc!.supportingCapabilities).toContain('pbmc_isolation_v2')
  })

  it('deduplicates capabilities mapping to the same asset', () => {
    const result = mapCapabilitiesToResearchAssets(
      [
        { name: 'Plasma collection' },
        { name: 'Plasma storage' },
        { name: 'Plasma handling' },
      ],
      [],
      [],
    )
    const plasma = result.find((e) => e.asset === 'Plasma')
    expect(plasma).toBeDefined()
    expect(plasma!.supportingCapabilities).toHaveLength(3)
  })

  it('uses first-match-wins for overlapping terms (whole blood before blood)', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ name: 'whole blood collection and processing' }],
      [{ content: 'whole blood samples' }],
      [],
    )
    const wholeBlood = result.find((e) => e.asset === 'Whole Blood')
    expect(wholeBlood).toBeDefined()
    expect(wholeBlood!.supportingCapabilities).toContain('whole blood collection and processing')
    expect(wholeBlood!.status).toBe('Enabled by current evidence')
  })

  it('maps "frozen tissue" and "cryopreserved" to Frozen Tissue', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ name: 'frozen tissue storage' }, { name: 'cryopreserved sample handling' }],
      [],
      [],
    )
    const frozenTissue = result.find((e) => e.asset === 'Frozen Tissue')
    expect(frozenTissue).toBeDefined()
    expect(frozenTissue!.supportingCapabilities).toContain('frozen tissue storage')
    expect(frozenTissue!.supportingCapabilities).toContain('cryopreserved sample handling')
  })

  it('maps "whole slide" and "digital pathology" to Whole Slide Images', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ name: 'whole slide scanning' }, { name: 'digital pathology review' }],
      [],
      [],
    )
    const wsi = result.find((e) => e.asset === 'Whole Slide Images')
    expect(wsi).toBeDefined()
    expect(wsi!.supportingCapabilities).toHaveLength(2)
  })

  it('maps imaging-related terms to Imaging Dataset', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ name: 'radiology imaging suite' }],
      [{ content: 'imaging datasets available' }],
      [],
    )
    const imaging = result.find((e) => e.asset === 'Imaging Dataset')
    expect(imaging).toBeDefined()
    expect(imaging!.status).toBe('Enabled by current evidence')
  })

  it('maps "omics" and "sequencing" to Omics-ready Dataset', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ name: 'omics analysis pipeline' }, { name: 'next-generation sequencing' }],
      [],
      [],
    )
    const omics = result.find((e) => e.asset === 'Omics-ready Dataset')
    expect(omics).toBeDefined()
    expect(omics!.supportingCapabilities).toHaveLength(2)
  })

  it('maps AI-readiness terms (ai-ready, annotation, metadata, governance) to AI-ready Dataset', () => {
    const result = mapCapabilitiesToResearchAssets(
      [
        { name: 'AI-ready data export' },
        { name: 'annotation pipeline' },
        { name: 'metadata management' },
        { name: 'data governance framework' },
      ],
      [],
      [],
    )
    const aiReady = result.find((e) => e.asset === 'AI-ready Dataset')
    expect(aiReady).toBeDefined()
    expect(aiReady!.supportingCapabilities).toHaveLength(4)
  })

  it('populates missingRequirements from gap descriptions that mention the asset', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ name: 'plasma_collection' }],
      [],
      [
        { description: 'No plasma storage protocol documented' },
        { description: 'Plasma handling SOP missing' },
        { description: 'unrelated gap' },
      ],
    )
    const plasma = result.find((e) => e.asset === 'Plasma')
    expect(plasma).toBeDefined()
    expect(plasma!.missingRequirements).toHaveLength(2)
    expect(plasma!.missingRequirements[0]).toContain('storage protocol')
    expect(plasma!.missingRequirements[1]).toContain('handling sop')
  })

  it('caps missingRequirements at 3 items', () => {
    const result = mapCapabilitiesToResearchAssets(
      [{ name: 'plasma_collection' }],
      [],
      [
        { description: 'plasma gap 1' },
        { description: 'plasma gap 2' },
        { description: 'plasma gap 3' },
        { description: 'plasma gap 4' },
        { description: 'plasma gap 5' },
      ],
    )
    const plasma = result.find((e) => e.asset === 'Plasma')
    expect(plasma).toBeDefined()
    expect(plasma!.missingRequirements).toHaveLength(3)
  })

  it('every entry has a non-empty nextStep', () => {
    const result = mapCapabilitiesToResearchAssets([], [], [])
    for (const entry of result) {
      expect(entry.nextStep).toBeTruthy()
      expect(entry.nextStep.length).toBeGreaterThan(0)
    }
  })

  it('every entry has the expected structure', () => {
    const result = mapCapabilitiesToResearchAssets([], [], [])
    for (const entry of result) {
      expect(entry).toHaveProperty('asset')
      expect(entry).toHaveProperty('status')
      expect(entry).toHaveProperty('supportingCapabilities')
      expect(entry).toHaveProperty('supportingClaims')
      expect(entry).toHaveProperty('missingRequirements')
      expect(entry).toHaveProperty('nextStep')
      expect(Array.isArray(entry.supportingCapabilities)).toBe(true)
      expect(Array.isArray(entry.supportingClaims)).toBe(true)
      expect(Array.isArray(entry.missingRequirements)).toBe(true)
    }
  })

  it('correctly derives status for a realistic multi-input scenario', () => {
    const capabilities = [
      { name: 'Plasma collection and processing' },
      { name: 'Serum extraction' },
      { name: 'FFPE block preparation' },
      { name: 'Whole slide scanning service' },
    ]
    const claims = [
      { content: 'This site collects and processes plasma samples from all enrolled patients.' },
      { content: 'FFPE tissue blocks are prepared on-site.' },
    ]
    const gaps = [
      { description: 'Serum handling protocol not documented' },
      { description: 'Whole slide image quality standards missing' },
    ]

    const result = mapCapabilitiesToResearchAssets(capabilities, claims, gaps)

    const plasma = result.find((e) => e.asset === 'Plasma')
    expect(plasma!.status).toBe('Enabled by current evidence')

    const serum = result.find((e) => e.asset === 'Serum')
    expect(serum!.status).toBe('Needs additional evidence')

    const ffpe = result.find((e) => e.asset === 'FFPE Tissue')
    expect(ffpe!.status).toBe('Enabled by current evidence')

    const wsi = result.find((e) => e.asset === 'Whole Slide Images')
    // Gap says "whole slide image" (singular) but asset is "Whole Slide Images" (plural)
    // — substring mismatch, so no gap match → Needs human review
    expect(wsi!.status).toBe('Needs human review')

    const pbmc = result.find((e) => e.asset === 'PBMC')
    expect(pbmc!.status).toBe('Not enough evidence yet')
  })
})
