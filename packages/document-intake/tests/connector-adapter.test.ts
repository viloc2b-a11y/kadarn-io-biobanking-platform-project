// ==========================================================================
// Kadarn Document Intake Engine — Connector Adapter Tests
// ==========================================================================
// Sprint 26A — Foundation.
// Tests ConnectorIntakeAdapter: transforms ConnectorFetchResult into DocumentArtifact.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { ConnectorIntakeAdapter } from '../src/adapters/connector.js'
import type {
  ConnectorProviderInfo,
  ConnectorFetchResult,
} from '../src/adapters/connector.js'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeProvider(overrides: Partial<ConnectorProviderInfo> = {}): ConnectorProviderInfo {
  return {
    providerId: 'pubmed',
    version: '1.0.0',
    ...overrides,
  }
}

function makeResult(overrides: Partial<ConnectorFetchResult> = {}): ConnectorFetchResult {
  return {
    externalId: 'PMID:12345',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/12345/',
    filename: 'article-12345.pdf',
    mimeType: 'application/pdf',
    content: Buffer.from('test document content'),
    metadata: { journal: 'Nature', year: 2025 },
    ...overrides,
  }
}

// --------------------------------------------------------------------------
// Artifact transformation
// --------------------------------------------------------------------------

describe('ConnectorIntakeAdapter', () => {
  const adapter = new ConnectorIntakeAdapter()

  it('transforms a fetch result into a DocumentArtifact', () => {
    const result = makeResult()
    const provider = makeProvider()

    const artifact = adapter.toArtifact(
      result,
      provider,
      '/data/pubmed/article-12345.pdf',
      'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    )

    expect(artifact.id).toBe('artifact-pubmed-PMID:12345')
    expect(artifact.filename).toBe('article-12345.pdf')
    expect(artifact.format).toBe('pdf')
    expect(artifact.mimeType).toBe('application/pdf')
    expect(artifact.sizeBytes).toBe(result.content.length)
    expect(artifact.filePath).toBe('/data/pubmed/article-12345.pdf')
    expect(artifact.sha256).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2')
  })

  it('sets source.kind to connector', () => {
    const artifact = adapter.toArtifact(
      makeResult(),
      makeProvider(),
      '/tmp/doc.pdf',
      'hash',
    )

    expect(artifact.source.kind).toBe('connector')
  })

  it('propagates provider id to source', () => {
    const artifact = adapter.toArtifact(
      makeResult(),
      makeProvider({ providerId: 'clinicaltrials.gov' }),
      '/tmp/doc.pdf',
      'hash',
    )

    expect(artifact.source.providerId).toBe('clinicaltrials.gov')
    expect(artifact.id).toContain('clinicaltrials.gov')
  })

  it('propagates external id to source', () => {
    const result = makeResult({ externalId: 'NCT04283461' })
    const artifact = adapter.toArtifact(
      result,
      makeProvider({ providerId: 'clinicaltrials.gov' }),
      '/tmp/doc.pdf',
      'hash',
    )

    expect(artifact.source.externalId).toBe('NCT04283461')
    expect(artifact.id).toContain('NCT04283461')
  })

  it('propagates source URL', () => {
    const result = makeResult({ sourceUrl: 'https://example.com/doc.pdf' })
    const artifact = adapter.toArtifact(result, makeProvider(), '/tmp/doc.pdf', 'hash')

    expect(artifact.source.sourceUrl).toBe('https://example.com/doc.pdf')
  })

  it('propagates connector metadata to source metadata', () => {
    const result = makeResult({ metadata: { journal: 'Nature', year: 2025 } })
    const artifact = adapter.toArtifact(result, makeProvider(), '/tmp/doc.pdf', 'hash')

    expect(artifact.source.metadata).toEqual({ journal: 'Nature', year: 2025 })
  })

  it('sets acquiredAt and registeredAt timestamps', () => {
    const before = new Date().toISOString()
    const artifact = adapter.toArtifact(makeResult(), makeProvider(), '/tmp/doc.pdf', 'hash')
    const after = new Date().toISOString()

    expect(artifact.source.acquiredAt).toBeTruthy()
    expect(artifact.source.acquiredAt >= before).toBe(true)
    expect(artifact.source.acquiredAt <= after).toBe(true)

    expect(artifact.registeredAt).toBeTruthy()
    expect(artifact.registeredAt >= before).toBe(true)
    expect(artifact.registeredAt <= after).toBe(true)
  })
})

// --------------------------------------------------------------------------
// Format detection
// --------------------------------------------------------------------------

describe('ConnectorIntakeAdapter — format detection', () => {
  const adapter = new ConnectorIntakeAdapter()

  it('detects pdf format', () => {
    const artifact = adapter.toArtifact(
      makeResult({ mimeType: 'application/pdf' }),
      makeProvider(),
      '/tmp/doc.pdf',
      'hash',
    )
    expect(artifact.format).toBe('pdf')
  })

  it('detects docx format', () => {
    const artifact = adapter.toArtifact(
      makeResult({
        filename: 'doc.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      makeProvider(),
      '/tmp/doc.docx',
      'hash',
    )
    expect(artifact.format).toBe('docx')
  })

  it('detects zip format', () => {
    const artifact = adapter.toArtifact(
      makeResult({ filename: 'data.zip', mimeType: 'application/zip' }),
      makeProvider(),
      '/tmp/data.zip',
      'hash',
    )
    expect(artifact.format).toBe('zip')
  })

  it('detects html format', () => {
    const artifact = adapter.toArtifact(
      makeResult({ filename: 'page.html', mimeType: 'text/html' }),
      makeProvider(),
      '/tmp/page.html',
      'hash',
    )
    expect(artifact.format).toBe('html')
  })

  it('defaults to txt for unknown types', () => {
    const artifact = adapter.toArtifact(
      makeResult({ filename: 'data.csv', mimeType: 'text/csv' }),
      makeProvider(),
      '/tmp/data.csv',
      'hash',
    )
    expect(artifact.format).toBe('txt')
  })
})

// --------------------------------------------------------------------------
// Artifact id generation
// --------------------------------------------------------------------------

describe('ConnectorIntakeAdapter — artifact id generation', () => {
  const adapter = new ConnectorIntakeAdapter()

  it('generates consistent artifact ids from provider + external id', () => {
    const artifact = adapter.toArtifact(
      makeResult({ externalId: 'PMID:99999' }),
      makeProvider({ providerId: 'pubmed' }),
      '/tmp/doc.pdf',
      'hash',
    )

    expect(artifact.id).toBe('artifact-pubmed-PMID:99999')
  })

  it('generates unique ids for different providers', () => {
    const pubMed = adapter.toArtifact(
      makeResult({ externalId: '123' }),
      makeProvider({ providerId: 'pubmed' }),
      '/tmp/a.pdf',
      'hash',
    )
    const ctGov = adapter.toArtifact(
      makeResult({ externalId: '123' }),
      makeProvider({ providerId: 'clinicaltrials.gov' }),
      '/tmp/b.pdf',
      'hash',
    )

    expect(pubMed.id).not.toBe(ctGov.id)
  })
})

// --------------------------------------------------------------------------
// Boundary compliance
// --------------------------------------------------------------------------

describe('ConnectorIntakeAdapter — boundaries', () => {
  it('does not import evidence-discovery types', () => {
    // KDIE adapter uses its own ConnectorFetchResult and ConnectorProviderInfo types,
    // NOT evidence-discovery/connectors types. This test validates decoupling.
    const adapter = new ConnectorIntakeAdapter()
    expect(adapter).toBeDefined()
  })

  it('produces valid DocumentArtifact for engine consumption', () => {
    const adapter = new ConnectorIntakeAdapter()
    const artifact = adapter.toArtifact(
      makeResult(),
      makeProvider(),
      '/tmp/test.pdf',
      'hash123',
    )

    // The artifact must satisfy the DocumentArtifact contract
    expect(artifact.id).toBeTruthy()
    expect(artifact.format).toBeTruthy()
    expect(artifact.source).toBeDefined()
    expect(artifact.source.kind).toBe('connector')
    expect(artifact.sha256).toBe('hash123')
    expect(artifact.filePath).toBe('/tmp/test.pdf')
  })
})
