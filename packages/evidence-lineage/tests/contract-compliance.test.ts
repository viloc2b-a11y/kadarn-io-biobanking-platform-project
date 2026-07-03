import { describe, it, expect } from 'vitest'
import { EvidenceLineageEngine } from '../src/engine.js'
import {
  toContractLineage,
  assertContractLineageComplete,
} from '../src/contract-mapper.js'
import type { DocumentArtifact, NormalizedDocument } from '../src/types.js'

function makeLineageInput() {
  const artifact: DocumentArtifact = {
    id: 'artifact-contract-1',
    filename: 'protocol.pdf',
    format: 'pdf',
    mimeType: 'application/pdf',
    sizeBytes: 5000,
    sha256: 'b'.repeat(64),
    filePath: '/tmp/protocol.pdf',
    source: { kind: 'upload', providerId: 'manual', acquiredAt: new Date().toISOString() },
    registeredAt: new Date().toISOString(),
  }
  const normalized: NormalizedDocument = {
    artifactId: 'artifact-contract-1',
    markdown: '# Protocol',
    metadata: {
      provider: 'markitdown',
      providerVersion: '0.3.0',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      processingTimeMs: 10,
      warnings: [],
    },
    sourceHash: 'b'.repeat(64),
    normalizedAt: new Date().toISOString(),
  }
  const extraction = {
    entities: [{ id: 'e1', name: 'Site A', type: 'institution', mentions: [{ line: 2, rule: 'org' }], sectionId: 's0' }],
    relationships: [],
    claims: [],
    capabilities: [],
    assets: [{ id: 'a1', name: '100 samples', type: 'biospecimen', line: 4, sectionId: 's1' }],
  }
  return { artifact, normalized, extraction }
}

describe('Phase 8 contract compliance (28A)', () => {
  it('maps engine lineage to frozen @kadarn/types/phase8 contracts', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)
    const contract = toContractLineage(result, 'org-test-1')

    expect(contract.source.source_id).toBe('src:artifact-contract-1')
    expect(contract.source.source_type).toBe('uploaded_document')
    expect(contract.source.org_id).toBe('org-test-1')
    expect(contract.sourceVersion.content_hash).toBe('b'.repeat(64))
    expect(contract.extractionRun.parser_version).toBe('0.3.0')
    expect(contract.facts.length).toBeGreaterThan(0)
    expect(contract.facts[0].span.source_version_id).toBeTruthy()
    expect(contract.facts[0].semantic_type).toBeTruthy()
  })

  it('passes 28B completeness gate on contract bundle', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)
    const contract = toContractLineage(result, 'org-test-1')

    expect(() => assertContractLineageComplete(contract)).not.toThrow()
  })

  it('engine result.complete implies contract facts have span refs', () => {
    const engine = new EvidenceLineageEngine()
    const { artifact, normalized, extraction } = makeLineageInput()
    const result = engine.buildLineage(artifact, normalized, extraction)
    const contract = toContractLineage(result, 'org-test-1')

    if (result.complete) {
      for (const fact of contract.facts) {
        expect(fact.span.address_value).toMatch(/^line:/)
        expect(fact.extraction_run_id).toBe(contract.extractionRun.run_id)
      }
    }
  })
})
