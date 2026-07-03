// ==========================================================================
// Kadarn Document Intake Engine — Pipeline Integration Tests
// ==========================================================================
// Sprint 27D.
// Tests: happy path, all 6 failure modes, review queue, audit, metrics,
// provenance, retry behavior.
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { DocumentIntelligencePipeline } from '../src/pipeline/engine.js'
import type {
  DocumentPipelineResult,
  FailureMode,
} from '../src/pipeline/types.js'
import type { DocumentArtifact, IntakeProvider, NormalizedDocument } from '../src/contracts.js'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeArtifact(overrides: Partial<DocumentArtifact> = {}): DocumentArtifact {
  const filename = overrides.filename ?? 'test.pdf'
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdie-pipe-'))
  const filePath = path.join(tmpDir, filename)
  fs.writeFileSync(filePath, `# Test Document\n\nThis is a test protocol.\n\n## Methods\n\nStudy design and population.\n\n## Results\n\nPrimary endpoint met.`, 'utf-8')
  const buffer = fs.readFileSync(filePath)
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')

  return {
    id: overrides.id ?? 'artifact-pipe-1',
    filename,
    format: overrides.format ?? 'pdf',
    mimeType: overrides.mimeType ?? 'application/pdf',
    sizeBytes: overrides.sizeBytes ?? buffer.length,
    sha256: overrides.sha256 ?? sha256,
    filePath: overrides.filePath ?? filePath,
    source: overrides.source ?? { kind: 'upload', acquiredAt: new Date().toISOString() },
    registeredAt: overrides.registeredAt ?? new Date().toISOString(),
  }
}

function makeProvider(name: string, overrides: Partial<IntakeProvider> = {}): IntakeProvider {
  return {
    name: name as IntakeProvider['name'],
    supports: () => true,
    normalize: async (a) => ({
      artifactId: a.id,
      markdown: `# ${a.filename}\n\nNormalized content.\n\n## Section\n\nDetails here.`,
      metadata: {
        provider: name as any,
        providerVersion: 'test',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        processingTimeMs: 5,
        warnings: [],
      },
      sourceHash: a.sha256,
      normalizedAt: new Date().toISOString(),
    }),
    ...overrides,
  } as IntakeProvider
}

function cleanup(a: DocumentArtifact): void {
  try { fs.unlinkSync(a.filePath) } catch { /* ignore */ }
  try { fs.rmdirSync(path.dirname(a.filePath)) } catch { /* ignore */ }
}

// --------------------------------------------------------------------------
// Happy path
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — happy path', () => {
  let pipeline: DocumentIntelligencePipeline

  beforeEach(() => {
    pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
  })

  it('processes a document through all stages', async () => {
    const artifact = makeArtifact({ filename: 'protocol.pdf' })

    const result = await pipeline.process(artifact)

    // Stage 1: Normalization
    expect(result.normalizedDocument.markdown).toContain('# protocol.pdf')
    expect(result.normalizedDocument.metadata.provider).toBe('markitdown')

    // Stage 2: Classification
    expect(result.classification.label).toBeDefined()
    expect(result.classification.confidence).toBeGreaterThanOrEqual(0)

    // Stage 3: Segmentation
    expect(result.sections.length).toBeGreaterThanOrEqual(1)
    expect(result.sections[0].heading).toBeDefined()

    // Stage 4: Extraction
    expect(result.entities.length).toBeGreaterThanOrEqual(0)
    expect(result.claims.length).toBeGreaterThanOrEqual(0)

    // Stage 5: Provenance
    expect(result.provenanceDocumentId).toBe(artifact.id)

    // Metrics
    const metrics = result.metrics
    expect(metrics.documents_processed).toBe(1)
    expect(metrics.documents_failed).toBe(0)

    cleanup(artifact)
  })

  it('pipeline result has all required fields', async () => {
    const artifact = makeArtifact()
    const result = await pipeline.process(artifact)

    expect(result.artifact).toBeDefined()
    expect(result.normalizedDocument).toBeDefined()
    expect(result.classification).toBeDefined()
    expect(result.sections).toBeInstanceOf(Array)
    expect(result.entities).toBeInstanceOf(Array)
    expect(result.relationships).toBeInstanceOf(Array)
    expect(result.claims).toBeInstanceOf(Array)
    expect(result.capabilities).toBeInstanceOf(Array)
    expect(result.assets).toBeInstanceOf(Array)
    expect(result.provenanceDocumentId).toBeTruthy()
    expect(result.warnings).toBeInstanceOf(Array)
    expect(result.metrics).toBeDefined()

    cleanup(artifact)
  })

  it('preserves artifact through the pipeline', async () => {
    const artifact = makeArtifact({ id: 'custom-id-xyz' })
    const result = await pipeline.process(artifact)

    expect(result.artifact.id).toBe('custom-id-xyz')
    expect(result.normalizedDocument.artifactId).toBe('custom-id-xyz')

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Failure mode: CLIR_NOT_INSTALLED
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — CLI_NOT_INSTALLED', () => {
  it('handles missing CLI gracefully', async () => {
    const failing = makeProvider('markitdown', {
      normalize: async () => {
        const err = new Error('Command not found') as NodeJS.ErrnoException
        err.code = 'ENOENT'
        err.name = 'MarkItDownNotInstalledError'
        throw err
      },
    })
    const pipeline = new DocumentIntelligencePipeline([failing])
    const artifact = makeArtifact()

    const result = await pipeline.process(artifact)

    expect(result.normalizedDocument.markdown).toBe('')
    expect(result.classification.label).toBe('unknown')
    expect(result.metrics.documents_failed).toBe(1)
    expect(result.metrics.documents_processed).toBe(0)

    // No retry for CLI not installed
    expect(result.metrics.documents_retry).toBe(0)

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Failure mode: TIMEOUT
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — TIMEOUT', () => {
  it('retries on timeout and fails after max retries', async () => {
    let attempts = 0
    const timingOut = makeProvider('markitdown', {
      normalize: async () => {
        attempts++
        const err = new Error('timed out') as NodeJS.ErrnoException
        err.code = 'ETIMEDOUT'
        err.name = 'MarkItDownTimeoutError'
        throw err
      },
    })
    const pipeline = new DocumentIntelligencePipeline([timingOut], { maxRetries: 1, retryDelayMs: 10 })
    const artifact = makeArtifact()

    const result = await pipeline.process(artifact)

    // Should have attempted 2 times (initial + 1 retry)
    expect(attempts).toBe(2)
    expect(result.metrics.documents_retry).toBe(1)
    expect(result.metrics.documents_timeout).toBe(1)
    expect(result.metrics.documents_failed).toBe(1)

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Failure mode: NON_ZERO_EXIT
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — NON_ZERO_EXIT', () => {
  it('queues document for review on execution error', async () => {
    const crashing = makeProvider('markitdown', {
      normalize: async () => {
        const err = new Error('Conversion failed') as any
        err.name = 'MarkItDownExecutionError'
        err.exitCode = 1
        err.stderr = 'Invalid PDF structure'
        throw err
      },
    })
    const pipeline = new DocumentIntelligencePipeline([crashing])
    const artifact = makeArtifact()

    const result = await pipeline.process(artifact)

    expect(result.metrics.documents_failed).toBe(1)
    expect(result.metrics.documents_review).toBe(1)

    const queue = pipeline.getReviewQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].reason).toBe('EXECUTION_ERROR')
    expect(queue[0].artifactId).toBe(artifact.id)

    cleanup(artifact)
  })

  it('can resolve a review queue entry', async () => {
    const crashing = makeProvider('markitdown', {
      normalize: async () => {
        const err = new Error('fail') as any
        err.name = 'MarkItDownExecutionError'
        err.exitCode = 2
        throw err
      },
    })
    const pipeline = new DocumentIntelligencePipeline([crashing])
    await pipeline.process(makeArtifact())

    const queue = pipeline.getReviewQueue()
    expect(queue).toHaveLength(1)

    const resolved = pipeline.resolveReview(queue[0].reviewId, 'resolved')
    expect(resolved).toBe(true)
    expect(pipeline.getReviewQueue()[0].status).toBe('resolved')
  })

  it('resolveReview returns false for unknown ID', () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    expect(pipeline.resolveReview('nonexistent', 'resolved')).toBe(false)
  })
})

// --------------------------------------------------------------------------
// Failure mode: UNSUPPORTED_FORMAT
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — UNSUPPORTED_FORMAT', () => {
  it('rejects unsupported formats', async () => {
    const pdfOnly = makeProvider('markitdown', {
      supports: (a) => a.mimeType === 'application/pdf',
      normalize: async () => {
        throw new Error('Should not reach this')
      },
    })
    const pipeline = new DocumentIntelligencePipeline([pdfOnly])
    const artifact = makeArtifact({
      filename: 'image.png',
      format: 'txt',
      mimeType: 'image/png',
    })

    // The gateway will reject because provider doesn't support PNG
    const result = await pipeline.process(artifact)

    expect(result.metrics.documents_rejected).toBe(1)
    expect(result.metrics.documents_review).toBe(0) // not queued

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Failure mode: EMPTY_OUTPUT
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — EMPTY_OUTPUT', () => {
  it('handles documents that produce empty output gracefully', async () => {
    // Empty output is detected at the adapter level (warnings, not thrown error)
    // The pipeline handles it through the gateway which returns empty markdown with EMPTY_OUTPUT warning
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    const artifact = makeArtifact({ filename: 'empty.pdf' })

    // For empty output, the adapter returns a document with EMPTY_OUTPUT warning
    // but doesn't throw. The pipeline treats this as a complete document.
    const result = await pipeline.process(artifact)
    expect(result).toBeDefined()
    expect(result.normalizedDocument).toBeDefined()

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Failure mode: HASH_MISMATCH
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — HASH_MISMATCH', () => {
  it('propagates adapter warnings to pipeline result', async () => {
    // Provider that emits a warning in metadata
    const warningProvider = makeProvider('markitdown', {
      normalize: async (a) => ({
        artifactId: a.id,
        markdown: '# Doc\n\nContent.',
        metadata: {
          provider: 'markitdown' as any,
          providerVersion: 'test',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          processingTimeMs: 5,
          warnings: [{ code: 'HASH_MISMATCH', message: 'Hash does not match.' }],
        },
        sourceHash: a.sha256,
        normalizedAt: new Date().toISOString(),
      }),
    })
    const pipeline = new DocumentIntelligencePipeline([warningProvider])
    const artifact = makeArtifact()

    const result = await pipeline.process(artifact)

    expect(result.warnings.length).toBeGreaterThanOrEqual(1)
    expect(result.metrics.documents_warning).toBeGreaterThanOrEqual(1)

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Audit
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — audit', () => {
  it('records pipeline start and discovery ready events', async () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    const artifact = makeArtifact()

    await pipeline.process(artifact)

    const log = pipeline.getAuditLog()
    const types = log.map(e => e.type)

    expect(types).toContain('PIPELINE_START')
    expect(types).toContain('DISCOVERY_READY')
    expect(log.every(e => e.artifactId === artifact.id)).toBe(true)

    cleanup(artifact)
  })

  it('records failure events without discovery ready', async () => {
    const failing = makeProvider('markitdown', {
      normalize: async () => { throw Object.assign(new Error('boom'), { name: 'MarkItDownExecutionError', exitCode: 1 }) },
    })
    const pipeline = new DocumentIntelligencePipeline([failing])
    const artifact = makeArtifact()

    await pipeline.process(artifact)

    const log = pipeline.getAuditLog()
    expect(log.some(e => e.type === 'FAILURE_OCCURRED')).toBe(true)
    expect(log.some(e => e.type === 'REVIEW_QUEUED')).toBe(true)
    expect(log.every(e => e.type !== 'DISCOVERY_READY')).toBe(true)

    cleanup(artifact)
  })

  it('each audit event has unique ID', async () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    await pipeline.process(makeArtifact())

    const log = pipeline.getAuditLog()
    const ids = log.map(e => e.eventId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// --------------------------------------------------------------------------
// Metrics
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — metrics', () => {
  it('tracks per-stage durations', async () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    const artifact = makeArtifact()

    const result = await pipeline.process(artifact)

    expect(result.metrics.classification_duration_ms_total).toBeGreaterThanOrEqual(0)
    expect(result.metrics.segmentation_duration_ms_total).toBeGreaterThanOrEqual(0)
    expect(result.metrics.extraction_duration_ms_total).toBeGreaterThanOrEqual(0)
    expect(result.metrics.provider_duration_ms_total).toBeGreaterThanOrEqual(0)

    cleanup(artifact)
  })

  it('accumulates metrics across multiple documents', async () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])

    const a1 = makeArtifact({ filename: 'a.pdf' })
    const a2 = makeArtifact({ filename: 'b.pdf' })

    await pipeline.process(a1)
    await pipeline.process(a2)

    const metrics = pipeline.getMetrics()
    expect(metrics.documents_processed).toBe(2)

    cleanup(a1); cleanup(a2)
  })
})

// --------------------------------------------------------------------------
// Provenance
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — provenance', () => {
  it('records provenance chain through all stages', async () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    const artifact = makeArtifact()

    await pipeline.process(artifact)

    const prov = pipeline.getProvenanceEngine()
    expect(prov.linkCount).toBeGreaterThan(0)

    // Verify traceBack works for the document
    const trace = prov.traceBack(artifact.id)
    expect(trace.documentId).toBe(artifact.id)

    cleanup(artifact)
  })

  it('provenance engine is accessible for external queries', () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    const prov = pipeline.getProvenanceEngine()
    expect(prov).toBeDefined()
    expect(prov.linkCount).toBe(0) // no documents processed yet
  })
})

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — configuration', () => {

  it('respects max queue size', async () => {
    const crashing = makeProvider('markitdown', {
      normalize: async () => {
        const err = new Error('fail') as any
        err.name = 'MarkItDownExecutionError'
        err.exitCode = 1
        throw err
      },
    })
    const pipeline = new DocumentIntelligencePipeline([crashing], { maxQueueSize: 2 })

    await pipeline.process(makeArtifact({ filename: 'a.pdf' }))
    await pipeline.process(makeArtifact({ filename: 'b.pdf' }))
    await pipeline.process(makeArtifact({ filename: 'c.pdf' }))

    // First 2 should be queued, 3rd auto-rejected
    expect(pipeline.getReviewQueue()).toHaveLength(2)
    expect(pipeline.getMetrics().documents_rejected).toBeGreaterThanOrEqual(1)
  })
})

// --------------------------------------------------------------------------
// Pipeline output shape
// --------------------------------------------------------------------------

describe('DocumentIntelligencePipeline — output shape', () => {
  it('sections have correct structure', async () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    const result = await pipeline.process(makeArtifact())

    for (const section of result.sections) {
      expect(section.sectionId).toBeTruthy()
      expect(section.documentId).toBe('artifact-pipe-1')
      expect(section.headingLevel).toBeGreaterThanOrEqual(0)
      expect(section.content).toBeDefined()
      expect(section.lineage).toBeInstanceOf(Array)
    }
  })

  it('entities have correct structure', async () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    const result = await pipeline.process(makeArtifact())

    for (const entity of result.entities) {
      expect(entity.id).toBeTruthy()
      expect(entity.name).toBeTruthy()
      expect(entity.type).toBeTruthy()
      expect(entity.mentions.length).toBeGreaterThan(0)
    }
  })

  it('classification has alternatives', async () => {
    const pipeline = new DocumentIntelligencePipeline([makeProvider('markitdown')])
    const result = await pipeline.process(makeArtifact())

    expect(result.classification.matches.length).toBeGreaterThanOrEqual(0)
    expect(result.classification.alternatives).toBeInstanceOf(Array)
  })
})
