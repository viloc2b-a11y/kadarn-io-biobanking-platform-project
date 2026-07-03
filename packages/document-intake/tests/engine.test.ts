// ==========================================================================
// Kadarn Document Intake Engine — Engine Tests
// ==========================================================================
// Sprint 26A — Foundation.
// Tests DocumentIntakeEngine: provider selection, normalization, error handling.
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  DocumentIntakeEngine,
  NoSuitableProviderError,
  IntakeNormalizationError,
} from '../src/engine.js'
import type {
  DocumentArtifact,
  NormalizedDocument,
  IntakeProvider,
  DocumentSource,
} from '../src/contracts.js'

// --------------------------------------------------------------------------
// Mocks
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
    filename: 'document.pdf',
    format: 'pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    sha256: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    filePath: '/tmp/document.pdf',
    source: makeSource(),
    registeredAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeNormalized(artifactId: string, providerName: string = 'markitdown'): NormalizedDocument {
  return {
    artifactId,
    markdown: '# Normalized',
    metadata: {
      provider: providerName,
      providerVersion: 'test',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      processingTimeMs: 10,
      warnings: [],
    },
    sourceHash: 'hash',
    normalizedAt: new Date().toISOString(),
  }
}

function makeProvider(overrides: Partial<IntakeProvider> = {}): IntakeProvider {
  const name = overrides.name ?? 'markitdown'
  return {
    name,
    supports: () => true,
    normalize: async (a) => makeNormalized(a.id, name),
    ...overrides,
  }
}

// --------------------------------------------------------------------------
// Engine construction and registration
// --------------------------------------------------------------------------

describe('DocumentIntakeEngine — construction', () => {
  it('creates an engine with no providers', () => {
    const engine = new DocumentIntakeEngine([])
    expect(engine.listProviders()).toHaveLength(0)
  })

  it('creates an engine with initial providers', () => {
    const p = makeProvider()
    const engine = new DocumentIntakeEngine([p])
    expect(engine.listProviders()).toHaveLength(1)
    expect(engine.listProviders()[0].name).toBe('markitdown')
  })

  it('registers additional providers after construction', () => {
    const engine = new DocumentIntakeEngine([])
    engine.register(makeProvider({ name: 'unstructured' }))
    engine.register(makeProvider({ name: 'ocr' }))

    const names = engine.listProviders().map(p => p.name)
    expect(names).toEqual(['unstructured', 'ocr'])
  })
})

// --------------------------------------------------------------------------
// Provider selection
// --------------------------------------------------------------------------

describe('DocumentIntakeEngine — provider selection', () => {
  let engine: DocumentIntakeEngine

  beforeEach(() => {
    const pdfProvider = makeProvider({
      name: 'markitdown',
      supports: (a) => a.format === 'pdf',
    })
    const docxProvider = makeProvider({
      name: 'unstructured',
      supports: (a) => a.format === 'docx',
    })
    engine = new DocumentIntakeEngine([pdfProvider, docxProvider])
  })

  it('selects the right provider based on format', async () => {
    const pdfArtifact = makeArtifact({ format: 'pdf', mimeType: 'application/pdf' })
    const result = await engine.intake(pdfArtifact)
    expect(result.metadata.provider).toBe('markitdown')
  })

  it('selects docx provider for docx artifacts', async () => {
    const docxArtifact = makeArtifact({
      format: 'docx',
      filename: 'report.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const result = await engine.intake(docxArtifact)
    expect(result.metadata.provider).toBe('unstructured')
  })

  it('throws NoSuitableProviderError when no provider matches', async () => {
    const zipArtifact = makeArtifact({
      format: 'zip',
      filename: 'bundle.zip',
      mimeType: 'application/zip',
    })

    await expect(engine.intake(zipArtifact)).rejects.toThrow(NoSuitableProviderError)
  })

  it('error message includes artifact format and id', async () => {
    const zipArtifact = makeArtifact({
      id: 'artifact-zip-1',
      format: 'zip',
      filename: 'data.zip',
      mimeType: 'application/zip',
    })

    await expect(engine.intake(zipArtifact)).rejects.toThrow(/zip/)
    await expect(engine.intake(zipArtifact)).rejects.toThrow(/artifact-zip-1/)
  })
})

// --------------------------------------------------------------------------
// Normalization
// --------------------------------------------------------------------------

describe('DocumentIntakeEngine — normalization', () => {
  it('returns a NormalizedDocument on success', async () => {
    const p = makeProvider()
    const engine = new DocumentIntakeEngine([p])
    const artifact = makeArtifact()

    const result = await engine.intake(artifact)

    expect(result.artifactId).toBe('artifact-1')
    expect(result.markdown).toBe('# Normalized')
    expect(result.metadata.provider).toBe('markitdown')
  })

  it('passes artifact id through to the normalized result', async () => {
    const p = makeProvider({
      normalize: async (a) => ({
        ...makeNormalized(a.id),
        artifactId: a.id,
      }),
    })
    const engine = new DocumentIntakeEngine([p])
    const artifact = makeArtifact({ id: 'custom-id-42' })

    const result = await engine.intake(artifact)
    expect(result.artifactId).toBe('custom-id-42')
  })

  it('provider receives the full artifact', async () => {
    let received: DocumentArtifact | null = null
    const p = makeProvider({
      normalize: async (a) => {
        received = a
        return makeNormalized(a.id)
      },
    })
    const engine = new DocumentIntakeEngine([p])
    const artifact = makeArtifact({ filename: 'exact-file.pdf' })

    await engine.intake(artifact)
    expect(received).not.toBeNull()
    expect(received!.filename).toBe('exact-file.pdf')
    expect(received!.sha256).toBe(artifact.sha256)
  })
})

// --------------------------------------------------------------------------
// Error handling
// --------------------------------------------------------------------------

describe('DocumentIntakeEngine — error handling', () => {
  it('wraps provider errors in IntakeNormalizationError', async () => {
    const p = makeProvider({
      name: 'markitdown',
      normalize: async () => {
        throw new Error('CLI not found')
      },
    })
    const engine = new DocumentIntakeEngine([p])
    const artifact = makeArtifact()

    await expect(engine.intake(artifact)).rejects.toThrow(IntakeNormalizationError)
  })

  it('IntakeNormalizationError includes provider name and artifact id', async () => {
    const p = makeProvider({
      name: 'markitdown',
      normalize: async () => {
        throw new Error('timeout')
      },
    })
    const engine = new DocumentIntakeEngine([p])
    const artifact = makeArtifact({ id: 'artifact-timeout' })

    try {
      await engine.intake(artifact)
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(IntakeNormalizationError)
      const e = err as IntakeNormalizationError
      expect(e.providerName).toBe('markitdown')
      expect(e.artifactId).toBe('artifact-timeout')
      expect(e.message).toContain('timeout')
    }
  })

  it('NoSuitableProviderError is a plain Error subclass', () => {
    const artifact = makeArtifact({ format: 'zip', mimeType: 'application/zip' })
    const err = new NoSuitableProviderError(artifact)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('NoSuitableProviderError')
  })

  it('IntakeNormalizationError is a plain Error subclass', () => {
    const err = new IntakeNormalizationError('test', 'a1', new Error('boom'))
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('IntakeNormalizationError')
  })
})

// --------------------------------------------------------------------------
// Multiple providers — first-match semantics
// --------------------------------------------------------------------------

describe('DocumentIntakeEngine — first-match semantics', () => {
  it('uses the first matching provider when multiple match', async () => {
    const first = makeProvider({
      name: 'markitdown',
      supports: (a) => a.format === 'pdf',
      normalize: async (a) => ({ ...makeNormalized(a.id), markdown: '# From First' }),
    })
    const second = makeProvider({
      name: 'azure-document-intelligence',
      supports: (a) => a.format === 'pdf',
      normalize: async (a) => ({ ...makeNormalized(a.id), markdown: '# From Second' }),
    })

    const engine = new DocumentIntakeEngine([first, second])
    const artifact = makeArtifact({ format: 'pdf' })

    const result = await engine.intake(artifact)
    // First registered wins
    expect(result.markdown).toBe('# From First')
    expect(result.metadata.provider).toBe('markitdown')
  })

  it('falls through to second if first rejects the format', async () => {
    const first = makeProvider({
      name: 'markitdown',
      supports: () => false,
    })
    const second = makeProvider({
      name: 'unstructured',
      supports: () => true,
      normalize: async (a) => ({ ...makeNormalized(a.id, 'unstructured'), markdown: '# From Second' }),
    })

    const engine = new DocumentIntakeEngine([first, second])
    const artifact = makeArtifact()

    const result = await engine.intake(artifact)
    expect(result.markdown).toBe('# From Second')
    expect(result.metadata.provider).toBe('unstructured')
  })
})
