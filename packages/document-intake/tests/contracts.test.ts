// ==========================================================================
// Kadarn Document Intake Engine — Contracts Tests
// ==========================================================================
// Sprint 26A — Foundation.
// Validates the contract types, MIME_TO_FORMAT mapping, and input/output shapes.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { MIME_TO_FORMAT } from '../src/contracts.js'
import type {
  DocumentSource,
  DocumentArtifact,
  NormalizedDocument,
  IntakeProvider,
} from '../src/contracts.js'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeSource(overrides: Partial<DocumentSource> = {}): DocumentSource {
  return {
    kind: 'upload',
    acquiredAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeArtifact(overrides: Partial<DocumentArtifact> = {}): DocumentArtifact {
  return {
    id: 'artifact-1',
    filename: 'protocol-v3.pdf',
    format: 'pdf',
    mimeType: 'application/pdf',
    sizeBytes: 45000,
    sha256: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    filePath: '/tmp/protocol-v3.pdf',
    source: makeSource(),
    registeredAt: new Date().toISOString(),
    ...overrides,
  }
}

// --------------------------------------------------------------------------
// MIME to format mapping
// --------------------------------------------------------------------------

describe('MIME_TO_FORMAT', () => {
  it('maps application/pdf to pdf', () => {
    expect(MIME_TO_FORMAT['application/pdf']).toBe('pdf')
  })

  it('maps DOCX MIME to docx', () => {
    expect(MIME_TO_FORMAT['application/vnd.openxmlformats-officedocument.wordprocessingml.document']).toBe('docx')
  })

  it('maps application/zip to zip', () => {
    expect(MIME_TO_FORMAT['application/zip']).toBe('zip')
  })

  it('maps text/html to html', () => {
    expect(MIME_TO_FORMAT['text/html']).toBe('html')
  })

  it('maps text/plain to txt', () => {
    expect(MIME_TO_FORMAT['text/plain']).toBe('txt')
  })

  it('returns undefined for unsupported MIME types', () => {
    expect(MIME_TO_FORMAT['image/png']).toBeUndefined()
    expect(MIME_TO_FORMAT['video/mp4']).toBeUndefined()
    expect(MIME_TO_FORMAT['application/octet-stream']).toBeUndefined()
  })
})

// --------------------------------------------------------------------------
// DocumentSource shape
// --------------------------------------------------------------------------

describe('DocumentSource', () => {
  it('connector source has providerId and externalId', () => {
    const source = makeSource({
      kind: 'connector',
      providerId: 'pubmed',
      externalId: 'PMID:12345',
      sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/12345/',
    })

    expect(source.kind).toBe('connector')
    expect(source.providerId).toBe('pubmed')
    expect(source.externalId).toBe('PMID:12345')
    expect(source.sourceUrl).toBeTruthy()
  })

  it('upload source has minimal fields', () => {
    const source = makeSource({ kind: 'upload' })

    expect(source.kind).toBe('upload')
    expect(source.providerId).toBeUndefined()
    expect(source.externalId).toBeUndefined()
  })

  it('api source has kind api', () => {
    const source = makeSource({ kind: 'api' })
    expect(source.kind).toBe('api')
  })

  it('internal source has kind internal', () => {
    const source = makeSource({ kind: 'internal' })
    expect(source.kind).toBe('internal')
  })

  it('accepts arbitrary metadata', () => {
    const source = makeSource({
      kind: 'connector',
      metadata: { collection: 'covid-studies', priority: 'high' },
    })

    expect(source.metadata).toEqual({ collection: 'covid-studies', priority: 'high' })
  })
})

// --------------------------------------------------------------------------
// DocumentArtifact shape
// --------------------------------------------------------------------------

describe('DocumentArtifact', () => {
  it('has required fields populated', () => {
    const artifact = makeArtifact()

    expect(artifact.id).toBe('artifact-1')
    expect(artifact.filename).toBe('protocol-v3.pdf')
    expect(artifact.format).toBe('pdf')
    expect(artifact.mimeType).toBe('application/pdf')
    expect(artifact.sizeBytes).toBeGreaterThan(0)
    expect(artifact.sha256).toHaveLength(64)
    expect(artifact.filePath).toBeTruthy()
    expect(artifact.source).toBeDefined()
    expect(artifact.registeredAt).toBeDefined()
  })

  it('supports docx format', () => {
    const artifact = makeArtifact({
      filename: 'report.docx',
      format: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    expect(artifact.format).toBe('docx')
  })

  it('supports zip format', () => {
    const artifact = makeArtifact({
      filename: 'bundle.zip',
      format: 'zip',
      mimeType: 'application/zip',
    })

    expect(artifact.format).toBe('zip')
  })

  it('copies source reference', () => {
    const source = makeSource({ kind: 'connector', providerId: 'clinicaltrials.gov' })
    const artifact = makeArtifact({ source })

    expect(artifact.source.kind).toBe('connector')
    expect(artifact.source.providerId).toBe('clinicaltrials.gov')
  })
})

// --------------------------------------------------------------------------
// NormalizedDocument shape
// --------------------------------------------------------------------------

describe('NormalizedDocument', () => {
  function makeNormalized(overrides: Partial<NormalizedDocument> = {}): NormalizedDocument {
    return {
      artifactId: 'artifact-1',
      markdown: '# Title\n\nContent here.',
      metadata: {
        provider: 'markitdown',
        providerVersion: '0.1.0',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        processingTimeMs: 125,
        pages: 3,
        tablesDetected: 1,
        warnings: [],
      },
      sourceHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      normalizedAt: new Date().toISOString(),
      ...overrides,
    }
  }

  it('has markdown content', () => {
    const doc = makeNormalized()
    expect(doc.markdown).toBeTruthy()
    expect(doc.markdown).toContain('# Title')
  })

  it('has extraction metadata', () => {
    const doc = makeNormalized()
    expect(doc.metadata.provider).toBe('markitdown')
    expect(doc.metadata.processingTimeMs).toBeGreaterThanOrEqual(0)
    expect(doc.metadata.pages).toBe(3)
  })

  it('tracks source hash for traceability', () => {
    const artifact = makeArtifact()
    const doc = makeNormalized({ sourceHash: artifact.sha256 })
    expect(doc.sourceHash).toBe(artifact.sha256)
  })

  it('includes warnings array even when empty', () => {
    const doc = makeNormalized()
    expect(doc.metadata.warnings).toEqual([])
  })
})

// --------------------------------------------------------------------------
// IntakeProvider interface compliance
// --------------------------------------------------------------------------

describe('IntakeProvider interface', () => {
  it('validates interface shape at type level', () => {
    // This test compiles to verify the interface shape.
    // At runtime, we check a mock implements the contract.
    const mock: IntakeProvider = {
      name: 'markitdown',
      supports: (_artifact) => true,
      normalize: async (_artifact) =>
        ({
          artifactId: 'x',
          markdown: '# Mock',
          metadata: {
            provider: 'markitdown',
            providerVersion: 'mock',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            processingTimeMs: 1,
            warnings: [],
          },
          sourceHash: 'hash',
          normalizedAt: new Date().toISOString(),
        }) as NormalizedDocument,
    }

    expect(mock.name).toBe('markitdown')
    expect(typeof mock.supports).toBe('function')
    expect(typeof mock.normalize).toBe('function')
  })

  it('provider name is a known value', () => {
    const names: Array<IntakeProvider['name']> = [
      'markitdown',
      'azure-document-intelligence',
      'unstructured',
      'ocr',
    ]
    expect(names).toHaveLength(4)
  })
})
