// ==========================================================================
// Kadarn Document Intake Engine — Provenance Engine Tests
// ==========================================================================
// Sprint 26F.
// Tests: recording links, backward tracing, forward expansion, full records,
// belongsTo queries, bulk recording, edge cases.
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { DocumentProvenanceEngine } from '../src/provenance/engine.js'
import type { ProvenanceLink, ProvenanceTrace } from '../src/provenance/types.js'

// --------------------------------------------------------------------------
// Setup
// --------------------------------------------------------------------------

describe('DocumentProvenanceEngine', () => {
  let engine: DocumentProvenanceEngine

  beforeEach(() => {
    engine = new DocumentProvenanceEngine()
  })

  // --------------------------------------------------------------------------
  // Recording
  // --------------------------------------------------------------------------

  describe('recording', () => {
    it('records intake link', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')

      expect(engine.linkCount).toBe(1)
      const record = engine.getRecord('doc-1')
      expect(record.links).toHaveLength(1)
      expect(record.links[0].step).toBe('intake')
      expect(record.links[0].sourceId).toBe('doc-1')
      expect(record.links[0].targetId).toBe('doc-1/norm')
    })

    it('records classification link', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordClassification('doc-1/norm', 'doc-1/class')

      expect(engine.linkCount).toBe(2)
    })

    it('records segmentation links for multiple sections', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0', 'doc-1/s1', 'doc-1/s2'])

      expect(engine.linkCount).toBe(4) // 1 intake + 3 sections
    })

    it('records entity extraction link', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')

      expect(engine.linkCount).toBe(3)
    })

    it('records relationship extraction link', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordRelationshipExtraction('doc-1/s0', 'doc-1/s0/r0')

      expect(engine.linkCount).toBe(3)
    })

    it('records claim extraction link', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordClaimExtraction('doc-1/s0', 'doc-1/s0/c0')

      expect(engine.linkCount).toBe(3)
    })

    it('records capability extraction link', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordCapabilityExtraction('doc-1/s0', 'doc-1/s0/cap0')

      expect(engine.linkCount).toBe(3)
    })

    it('records asset extraction link', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordAssetExtraction('doc-1/s0', 'doc-1/s0/a0')

      expect(engine.linkCount).toBe(3)
    })

    it('each link has a unique id', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordClassification('doc-1/norm', 'doc-1/class')

      const record = engine.getRecord('doc-1')
      const ids = record.links.map(l => l.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(ids[0]).toMatch(/^prov-\d+$/)
    })

    it('each link has a timestamp and engine field', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')

      const record = engine.getRecord('doc-1')
      const link = record.links[0]
      expect(link.timestamp).toBeDefined()
      expect(link.engine).toBe('DocumentIntakeEngine')
      expect(new Date(link.timestamp).getTime()).toBeGreaterThan(0)
    })
  })

  // --------------------------------------------------------------------------
  // Backward tracing
  // --------------------------------------------------------------------------

  describe('traceBack', () => {
    it('traces from entity back to document', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')

      const trace = engine.traceBack('doc-1/s0/e0')

      expect(trace.targetId).toBe('doc-1/s0/e0')
      expect(trace.documentId).toBe('doc-1')
      expect(trace.complete).toBe(true)
      expect(trace.chain).toHaveLength(3)
      expect(trace.chain[0].step).toBe('intake')
      expect(trace.chain[1].step).toBe('segmentation')
      expect(trace.chain[2].step).toBe('entity-extraction')
    })

    it('traces from claim back to document', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s1'])
      engine.recordClaimExtraction('doc-1/s1', 'doc-1/s1/c0')

      const trace = engine.traceBack('doc-1/s1/c0')

      expect(trace.documentId).toBe('doc-1')
      expect(trace.complete).toBe(true)
      expect(trace.chain[0].step).toBe('intake')
      expect(trace.chain[1].step).toBe('segmentation')
      expect(trace.chain[2].step).toBe('claim-extraction')
    })

    it('traces from asset back to document', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordAssetExtraction('doc-1/s0', 'doc-1/s0/a0')

      const trace = engine.traceBack('doc-1/s0/a0')

      expect(trace.documentId).toBe('doc-1')
      expect(trace.complete).toBe(true)
    })

    it('returns incomplete trace for unknown target', () => {
      const trace = engine.traceBack('unknown-id')

      expect(trace.targetId).toBe('unknown-id')
      expect(trace.complete).toBe(false)
      expect(trace.chain).toHaveLength(0)
    })

    it('returns incomplete trace when chain is broken', () => {
      // Record extraction without segmentation link (broken chain)
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')

      const trace = engine.traceBack('doc-1/s0/e0')

      expect(trace.complete).toBe(false)
      expect(trace.chain).toHaveLength(1)
    })

    it('trace chain is ordered from document to target', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')

      const trace = engine.traceBack('doc-1/s0/e0')

      // Verify ordering: intake → segmentation → entity-extraction
      const steps = trace.chain.map(l => l.step)
      expect(steps).toEqual(['intake', 'segmentation', 'entity-extraction'])
    })
  })

  // --------------------------------------------------------------------------
  // Forward expansion
  // --------------------------------------------------------------------------

  describe('expandForward', () => {
    it('expands document to show all derived artifacts', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordClassification('doc-1/norm', 'doc-1/class')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0', 'doc-1/s1'])

      const forward = engine.expandForward('doc-1/norm')

      expect(forward.sourceId).toBe('doc-1/norm')
      expect(forward.derivedIds).toHaveLength(3) // classification + 2 sections
      expect(forward.derivedIds).toContain('doc-1/class')
      expect(forward.derivedIds).toContain('doc-1/s0')
      expect(forward.derivedIds).toContain('doc-1/s1')
    })

    it('expands section to show extracted entities', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e1')

      const forward = engine.expandForward('doc-1/s0')

      expect(forward.derivedIds).toHaveLength(2)
      expect(forward.derivedIds).toContain('doc-1/s0/e0')
      expect(forward.derivedIds).toContain('doc-1/s0/e1')
    })

    it('returns empty for leaf artifacts (entities, claims, etc.)', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')

      const forward = engine.expandForward('doc-1/s0/e0')

      expect(forward.derivedIds).toHaveLength(0)
    })
  })

  // --------------------------------------------------------------------------
  // Full record
  // --------------------------------------------------------------------------

  describe('getRecord', () => {
    it('collects all links for a document', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordClassification('doc-1/norm', 'doc-1/class')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0', 'doc-1/s1'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')
      engine.recordClaimExtraction('doc-1/s0', 'doc-1/s0/c0')
      engine.recordAssetExtraction('doc-1/s1', 'doc-1/s1/a0')

      const record = engine.getRecord('doc-1')

      expect(record.documentId).toBe('doc-1')
      expect(record.links.length).toBeGreaterThanOrEqual(6)
      expect(record.createdAt).toBeDefined()
    })

    it('returns empty links for unknown document', () => {
      const record = engine.getRecord('unknown-doc')

      expect(record.documentId).toBe('unknown-doc')
      expect(record.links).toHaveLength(0)
    })

    it('record includes all step types used', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')
      engine.recordClaimExtraction('doc-1/s0', 'doc-1/s0/c0')
      engine.recordCapabilityExtraction('doc-1/s0', 'doc-1/s0/cap0')
      engine.recordRelationshipExtraction('doc-1/s0', 'doc-1/s0/r0')
      engine.recordAssetExtraction('doc-1/s0', 'doc-1/s0/a0')

      const record = engine.getRecord('doc-1')
      const steps = new Set(record.links.map(l => l.step))

      expect(steps.has('intake')).toBe(true)
      expect(steps.has('segmentation')).toBe(true)
      expect(steps.has('entity-extraction')).toBe(true)
      expect(steps.has('claim-extraction')).toBe(true)
      expect(steps.has('capability-extraction')).toBe(true)
      expect(steps.has('relationship-extraction')).toBe(true)
      expect(steps.has('asset-extraction')).toBe(true)
    })
  })

  // --------------------------------------------------------------------------
  // belongsTo
  // --------------------------------------------------------------------------

  describe('belongsTo', () => {
    it('verifies artifact belongs to document', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')

      expect(engine.belongsTo('doc-1/s0/e0', 'doc-1')).toBe(true)
    })

    it('rejects artifact from different document', () => {
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')

      expect(engine.belongsTo('doc-1/s0/e0', 'doc-2')).toBe(false)
    })

    it('rejects unknown artifact', () => {
      expect(engine.belongsTo('unknown', 'doc-1')).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // Bulk recording
  // --------------------------------------------------------------------------

  describe('recordSectionExtractions (bulk)', () => {
    it('records all extraction types for a section at once', () => {
      // Set up full chain first
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])

      const extraction = {
        entities: [{ id: 'doc-1/s0/e0' }, { id: 'doc-1/s0/e1' }],
        relationships: [{ id: 'doc-1/s0/r0' }],
        claimCandidates: [{ id: 'doc-1/s0/c0' }],
        capabilityCandidates: [{ id: 'doc-1/s0/cap0' }],
        researchAssetCandidates: [{ id: 'doc-1/s0/a0' }],
      }

      engine.recordSectionExtractions('doc-1/s0', extraction)

      // 1 intake + 1 segmentation + 6 extraction = 8 total
      expect(engine.linkCount).toBe(8)

      // Verify each type
      const record = engine.getRecord('doc-1')
      const steps = record.links.map(l => l.step)
      expect(steps.filter(s => s === 'entity-extraction')).toHaveLength(2)
      expect(steps.filter(s => s === 'relationship-extraction')).toHaveLength(1)
      expect(steps.filter(s => s === 'claim-extraction')).toHaveLength(1)
      expect(steps.filter(s => s === 'capability-extraction')).toHaveLength(1)
      expect(steps.filter(s => s === 'asset-extraction')).toHaveLength(1)
    })

    it('handles empty extraction gracefully', () => {
      const extraction = {
        entities: [],
        relationships: [],
        claimCandidates: [],
        capabilityCandidates: [],
        researchAssetCandidates: [],
      }

      engine.recordSectionExtractions('doc-1/s0', extraction)

      expect(engine.linkCount).toBe(0)
    })
  })

  // --------------------------------------------------------------------------
  // Multi-document isolation
  // --------------------------------------------------------------------------

  describe('multi-document isolation', () => {
    it('keeps separate documents isolated', () => {
      // Document 1
      engine.recordIntake('doc-1', 'doc-1/norm')
      engine.recordSegmentation('doc-1/norm', ['doc-1/s0'])
      engine.recordEntityExtraction('doc-1/s0', 'doc-1/s0/e0')

      // Document 2
      engine.recordIntake('doc-2', 'doc-2/norm')
      engine.recordSegmentation('doc-2/norm', ['doc-2/s0'])
      engine.recordClaimExtraction('doc-2/s0', 'doc-2/s0/c0')

      // Trace doc-1 entity → should reach doc-1, not doc-2
      const trace1 = engine.traceBack('doc-1/s0/e0')
      expect(trace1.documentId).toBe('doc-1')

      const trace2 = engine.traceBack('doc-2/s0/c0')
      expect(trace2.documentId).toBe('doc-2')

      // getRecord isolates per document
      const record1 = engine.getRecord('doc-1')
      expect(record1.links.length).toBeGreaterThan(0)
      for (const link of record1.links) {
        expect(link.sourceId.startsWith('doc-1') || link.targetId.startsWith('doc-1')).toBe(true)
      }
    })
  })

  // --------------------------------------------------------------------------
  // Full pipeline simulation
  // --------------------------------------------------------------------------

  describe('full pipeline provenance', () => {
    it('simulates complete pipeline: document → asset, full traceability', () => {
      // Simulate a full pipeline run
      const docId = 'artifact-protocol-1'
      const normId = `${docId}/norm`
      const classId = `${docId}/class`
      const sectionIds = [`${docId}/s0`, `${docId}/s1`, `${docId}/s2`]
      const entityId = `${docId}/s0/e0`
      const claimId = `${docId}/s1/c0`
      const assetId = `${docId}/s2/a0`

      // Pipeline steps
      engine.recordIntake(docId, normId)
      engine.recordClassification(normId, classId)
      engine.recordSegmentation(normId, sectionIds)
      engine.recordEntityExtraction(sectionIds[0], entityId)
      engine.recordClaimExtraction(sectionIds[1], claimId)
      engine.recordAssetExtraction(sectionIds[2], assetId)

      // Verify traceability of every artifact
      for (const targetId of [classId, ...sectionIds, entityId, claimId, assetId]) {
        const trace = engine.traceBack(targetId)
        expect(trace.documentId).toBe(docId)
        expect(trace.complete).toBe(true)
        expect(trace.chain.length).toBeGreaterThanOrEqual(1)

        // Every chain step should connect properly
        for (let i = 0; i < trace.chain.length - 1; i++) {
          expect(trace.chain[i].targetId).toBe(trace.chain[i + 1].sourceId)
        }
      }

      // Verify full record
      const record = engine.getRecord(docId)
      expect(record.links.length).toBeGreaterThanOrEqual(7) // intake + class + 3 seg + entity + claim + asset

      // Verify forward expansion from document shows everything
      const forwardFromDoc = engine.expandForward(docId)
      expect(forwardFromDoc.derivedIds).toContain(normId)

      const forwardFromNorm = engine.expandForward(normId)
      expect(forwardFromNorm.derivedIds).toContain(classId)
      for (const sid of sectionIds) {
        expect(forwardFromNorm.derivedIds).toContain(sid)
      }
    })
  })
})
