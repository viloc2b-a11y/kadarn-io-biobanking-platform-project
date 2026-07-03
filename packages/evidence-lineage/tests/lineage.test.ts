import { describe, it, expect } from 'vitest'
import { EvidenceLineageEngine } from '../src/engine.js'
import type { DocumentArtifact, NormalizedDocument } from '../src/types.js'

function makeLineageInput(): {
  artifact: DocumentArtifact
  normalized: NormalizedDocument
  extraction: Parameters<EvidenceLineageEngine['buildLineage']>[2]
} {
  const artifact: DocumentArtifact = {
    id: 'artifact-28a-1', filename: 'protocol.pdf', format: 'pdf',
    mimeType: 'application/pdf', sizeBytes: 5000,
    sha256: 'a'.repeat(64), filePath: '/tmp/protocol.pdf',
    source: { kind: 'upload', providerId: 'manual', acquiredAt: new Date().toISOString() },
    registeredAt: new Date().toISOString(),
  }
  const normalized: NormalizedDocument = {
    artifactId: 'artifact-28a-1', markdown: '# Protocol\n\nContent.',
    metadata: { provider: 'markitdown', providerVersion: '0.3.0',
      startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
      processingTimeMs: 10, warnings: [] },
    sourceHash: 'a'.repeat(64), normalizedAt: new Date().toISOString(),
  }
  const extraction = {
    entities: [{ id: 'e1', name: 'Dr. Smith', type: 'person', mentions: [{ line: 2, rule: 'person' }], sectionId: 's0' }],
    relationships: [{ id: 'r1', type: 'employs', line: 3, sectionId: 's0' }],
    claims: [{ id: 'c1', statement: 'Drug reduces mortality', type: 'efficacy', line: 5, sectionId: 's1' }],
    capabilities: [{ id: 'cap1', name: 'PBMC Processing', category: 'sample_processing', line: 7, sectionId: 's2' }],
    assets: [{ id: 'a1', name: '500 plasma samples', type: 'biospecimen', line: 8, sectionId: 's3' }],
  }
  return { artifact, normalized, extraction }
}

describe('EvidenceLineageEngine', () => {
  it('builds complete lineage chain', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)

    expect(result.lineage.source.sourceId).toBe('src:artifact-28a-1')
    expect(result.lineage.sourceVersion.version).toBe(1)
    expect(result.lineage.artifact.artifactId).toBe('artifact-28a-1')
    expect(result.lineage.extractionRun.parserName).toBe('markitdown')
    expect(result.lineage.extractionRun.parserVersion).toBe('0.3.0')
  })

  it('every fact knows its source version via extraction run', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)

    for (const fact of result.facts) {
      expect(fact.extractionRunId).toBe(result.lineage.extractionRun.extractionRunId)
    }
  })

  it('every fact knows its parser version', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)

    expect(result.lineage.extractionRun.parserVersion).toBe('0.3.0')
    for (const fact of result.facts) {
      expect(fact.extractionRunId).toBeTruthy()
    }
  })

  it('every fact has an offset', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)

    for (const fact of result.facts) {
      expect(fact.offset).toBeDefined()
      expect(fact.offset.order).toBeGreaterThanOrEqual(0)
    }
  })

  it('result.complete is true when all facts have valid offsets', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)
    expect(result.complete).toBe(true)
  })

  it('preserves source metadata', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)

    expect(result.lineage.source.sourceType).toBe('upload')
    expect(result.lineage.source.providerId).toBe('manual')
    expect(result.lineage.sourceVersion.snapshot.filename).toBe('protocol.pdf')
  })

  it('extraction run tracks timing', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)

    expect(result.lineage.extractionRun.processingTimeMs).toBe(10)
    expect(result.lineage.extractionRun.startedAt).toBeDefined()
    expect(result.lineage.extractionRun.completedAt).toBeDefined()
  })

})
