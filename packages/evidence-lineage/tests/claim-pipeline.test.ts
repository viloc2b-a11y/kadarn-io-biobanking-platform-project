import { describe, it, expect, beforeEach } from 'vitest'
import { ClaimGenerationEngine } from '../src/claim-generation.js'
import { ClaimProvenanceEngine } from '../src/claim-provenance.js'
import { EntityResolutionEngine } from '../src/entity-resolution.js'
import type { Claim } from '../src/claim-generation.js'

describe('ClaimGeneration + ClaimProvenance (28C + 28E)', () => {
  let claimEngine: ClaimGenerationEngine
  let provenanceEngine: ClaimProvenanceEngine
  let entityEngine: EntityResolutionEngine

  beforeEach(() => {
    claimEngine = new ClaimGenerationEngine()
    for (const rule of ClaimGenerationEngine.defaultRules()) {
      claimEngine.registerRule(rule)
    }
    provenanceEngine = new ClaimProvenanceEngine()
    entityEngine = new EntityResolutionEngine()
  })

  it('generates claim candidates from biospecimen facts', () => {
    const entity = entityEngine.resolve({
      rawName: 'National Biobank', hintType: 'institution',
      identifiers: [{ type: 'ror', value: 'ror:nb', confidence: 1 }],
      factIds: ['fact:1'],
    }).entity

    const facts = [
      { factId: 'fact:1', factType: 'asset', content: { name: '500 plasma samples', type: 'biospecimen' } },
    ]

    const candidates = claimEngine.generateCandidates(facts, entity)
    expect(candidates.length).toBeGreaterThanOrEqual(1)
    expect(candidates[0].claimType).toBe('biospecimen_collection')
    expect(candidates[0].statement).toContain('National Biobank')
  })

  it('generates claim candidates from capability facts', () => {
    const entity = entityEngine.resolve({
      rawName: 'Clinical Lab Inc', hintType: 'laboratory',
      identifiers: [{ type: 'ror', value: 'ror:cli', confidence: 1 }],
      factIds: ['fact:2'],
    }).entity

    const facts = [
      { factId: 'fact:2', factType: 'capability', content: { name: 'PBMC Processing', category: 'sample_processing' } },
    ]

    const candidates = claimEngine.generateCandidates(facts, entity)
    expect(candidates.length).toBeGreaterThanOrEqual(1)
    expect(candidates[0].claimType).toBe('laboratory_capability')
  })

  it('promotes candidate to Claim', () => {
    const entity = entityEngine.resolve({
      rawName: 'BioBank Co', hintType: 'institution',
      identifiers: [{ type: 'ror', value: 'ror:bbc', confidence: 1 }],
      factIds: ['fact:3'],
    }).entity

    const facts = [
      { factId: 'fact:3', factType: 'asset', content: { name: 'FFPE blocks', type: 'biospecimen' } },
    ]

    const candidates = claimEngine.generateCandidates(facts, entity)
    expect(candidates.length).toBeGreaterThan(0)

    const claim = claimEngine.promoteToClaim(candidates[0], 'def:biospecimen:v1')
    expect(claim.claimId).toMatch(/^claim:\d+$/)
    expect(claim.status).toBe('proposed')
    expect(claim.facts).toContain('fact:3')
  })

  it('builds complete claim provenance', () => {
    const entity = entityEngine.resolve({
      rawName: 'Research Hospital', hintType: 'institution',
      identifiers: [{ type: 'ror', value: 'ror:rh', confidence: 1 }],
      factIds: ['fact:4'],
    }).entity

    const facts = [
      { factId: 'fact:4', factType: 'asset', content: { name: 'DNA samples', type: 'biospecimen' } },
    ]

    const candidates = claimEngine.generateCandidates(facts, entity)
    const claim = claimEngine.promoteToClaim(candidates[0], 'def:biospecimen:v1')

    // Build provenance with lineage context
    const lineageFacts = [{
      factId: 'fact:4', extractionRunId: 'er:1', factType: 'asset' as const,
      content: { name: 'DNA samples', type: 'biospecimen' },
      offset: { startLine: 1, endLine: 1, order: 0 },
      extractedAt: new Date().toISOString(),
    }]

    const extractionRun = {
      extractionRunId: 'er:1', artifactId: 'artifact:1',
      parserName: 'markitdown', parserVersion: '0.3.0',
      startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
      processingTimeMs: 10, warnings: [],
    }

    const source = {
      sourceId: 'src:1', providerId: 'upload', sourceType: 'upload' as const,
      acquiredAt: new Date().toISOString(),
    }

    const sourceVersion = {
      sourceVersionId: 'sv:1', sourceId: 'src:1', version: 1,
      snapshot: { filename: 'doc.pdf' }, connectorVersion: '0.3.0',
      ingestedAt: new Date().toISOString(),
    }

    const provenance = provenanceEngine.buildProvenance(
      claim, candidates[0], entity, lineageFacts,
      extractionRun, source, sourceVersion,
    )

    expect(provenance.claimId).toBe(claim.claimId)
    expect(provenance.steps.length).toBe(5)
    expect(provenance.reconstructible).toBe(true)
    expect(provenance.entity.canonicalName).toBe('Research Hospital')
  })

  it('canReconstruct returns true for complete provenance', () => {
    const entity = entityEngine.resolve({
      rawName: 'Site A', hintType: 'site',
      identifiers: [{ type: 'ror', value: 'ror:sitea', confidence: 1 }],
      factIds: ['fact:5'],
    }).entity

    const facts = [{ factId: 'fact:5', factType: 'capability', content: { name: 'MRI', category: 'imaging' } }]
    const candidates = claimEngine.generateCandidates(facts, entity)
    const claim = claimEngine.promoteToClaim(candidates[0], 'def:imaging:v1')

    const provenance = provenanceEngine.buildProvenance(
      claim, candidates[0], entity,
      [{ factId: 'fact:5', extractionRunId: 'er:2', factType: 'capability', content: {}, offset: { startLine: 1, endLine: 1, order: 0 }, extractedAt: new Date().toISOString() }],
      { extractionRunId: 'er:2', artifactId: 'a:1', parserName: 'markitdown', parserVersion: '0.3.0', startedAt: '', completedAt: '', processingTimeMs: 0, warnings: [] },
      { sourceId: 's:1', providerId: 'upload', sourceType: 'upload', acquiredAt: '' },
      { sourceVersionId: 'sv:1', sourceId: 's:1', version: 1, snapshot: {}, connectorVersion: '', ingestedAt: '' },
    )

    expect(provenanceEngine.canReconstruct(claim.claimId)).toBe(true)
  })

  it('getProvenance returns undefined for unknown claim', () => {
    expect(provenanceEngine.getProvenance('unknown')).toBeUndefined()
  })

  it('no facts → zero candidates', () => {
    const entity = entityEngine.resolve({
      rawName: 'Empty Org', hintType: 'organization',
      identifiers: [], factIds: [],
    }).entity

    const candidates = claimEngine.generateCandidates([], entity)
    expect(candidates).toHaveLength(0)
  })
})
