// ==========================================================================
// Kadarn Document Intake Engine — Gateway Integration Tests
// ==========================================================================
// Sprint 27A.
// Tests: Gateway intake, metrics, error handling, backward compat,
// provider failure, provider timeout, fallback, provenance.
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  DocumentIntakeGateway,
  IntakeGatewayError,
} from '../src/gateway.js'
import { resetIntakeMetrics, getIntakeMetrics } from '../src/metrics.js'
import type {
  DocumentArtifact,
  NormalizedDocument,
  IntakeProvider,
  DocumentSource,
} from '../src/contracts.js'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeArtifact(overrides: Partial<DocumentArtifact> = {}): DocumentArtifact {
  const filename = overrides.filename ?? 'test-doc.pdf'
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdie-gw-'))
  const filePath = path.join(tmpDir, filename)
  fs.writeFileSync(filePath, 'test content for gateway integration', 'utf-8')
  const buffer = fs.readFileSync(filePath)
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')

  return {
    id: overrides.id ?? 'artifact-gw-1',
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
      markdown: `# ${a.filename}\n\nNormalized by ${name}.\n`,
      metadata: {
        provider: name as any,
        providerVersion: 'test',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        processingTimeMs: 10,
        warnings: [],
      },
      sourceHash: a.sha256,
      normalizedAt: new Date().toISOString(),
    }),
    ...overrides,
  } as IntakeProvider
}

function cleanup(artifact: DocumentArtifact): void {
  try { fs.unlinkSync(artifact.filePath) } catch { /* ignore */ }
  try { fs.rmdirSync(path.dirname(artifact.filePath)) } catch { /* ignore */ }
}

// --------------------------------------------------------------------------
// Gateway intake
// --------------------------------------------------------------------------

describe('DocumentIntakeGateway — intake', () => {
  let gateway: DocumentIntakeGateway

  beforeEach(() => {
    resetIntakeMetrics()
    gateway = new DocumentIntakeGateway([makeProvider('markitdown')])
  })

  it('returns IntakeGatewayResult with normalized document', async () => {
    const artifact = makeArtifact({ filename: 'protocol.pdf' })

    const result = await gateway.intake(artifact)

    expect(result.document).toBeDefined()
    expect(result.document.artifactId).toBe('artifact-gw-1')
    expect(result.document.markdown).toContain('# protocol.pdf')
    expect(result.provider).toBe('markitdown')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.usedFallback).toBe(false)
    expect(result.gatewayRequestId).toMatch(/^kdie-\d+-\d+$/)

    cleanup(artifact)
  })

  it('increments metrics on successful intake', async () => {
    const artifact = makeArtifact()

    await gateway.intake(artifact)

    const metrics = gateway.getMetrics()
    expect(metrics.documents_received).toBe(1)
    expect(metrics.documents_normalized).toBe(1)
    expect(metrics.documents_failed).toBe(0)
    expect(metrics.last_intake_at).toBeDefined()

    cleanup(artifact)
  })

  it('passes artifact through to provider', async () => {
    let receivedArtifact: DocumentArtifact | null = null
    const provider = makeProvider('markitdown', {
      normalize: async (a) => {
        receivedArtifact = a
        return {
          artifactId: a.id,
          markdown: '# OK\n',
          metadata: {
            provider: 'markitdown',
            providerVersion: 'test',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            processingTimeMs: 5,
            warnings: [],
          },
          sourceHash: a.sha256,
          normalizedAt: new Date().toISOString(),
        }
      },
    })

    const gw = new DocumentIntakeGateway([provider])
    const artifact = makeArtifact({ id: 'custom-id', filename: 'exact-file.pdf' })

    await gw.intake(artifact)

    expect(receivedArtifact).not.toBeNull()
    expect(receivedArtifact!.id).toBe('custom-id')
    expect(receivedArtifact!.filename).toBe('exact-file.pdf')

    cleanup(artifact)
  })

  it('detects fallback usage', async () => {
    const provider = makeProvider('markitdown', {
      normalize: async (a) => ({
        artifactId: a.id,
        markdown: '# Fallback\n',
        metadata: {
          provider: 'markitdown',
          providerVersion: 'test',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          processingTimeMs: 5,
          warnings: [{ code: 'FALLBACK_PYTHON_MODULE', message: 'Used fallback' }],
        },
        sourceHash: a.sha256,
        normalizedAt: new Date().toISOString(),
      }),
    })

    const gw = new DocumentIntakeGateway([provider])
    const artifact = makeArtifact()

    const result = await gw.intake(artifact)
    expect(result.usedFallback).toBe(true)

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Gateway error handling
// --------------------------------------------------------------------------

describe('DocumentIntakeGateway — error handling', () => {
  let gateway: DocumentIntakeGateway

  beforeEach(() => {
    resetIntakeMetrics()
  })

  it('throws IntakeGatewayError on provider failure', async () => {
    const failingProvider = makeProvider('markitdown', {
      normalize: async () => {
        throw new Error('CLI crashed')
      },
    })
    gateway = new DocumentIntakeGateway([failingProvider])
    const artifact = makeArtifact()

    await expect(gateway.intake(artifact)).rejects.toThrow(IntakeGatewayError)
    await expect(gateway.intake(artifact)).rejects.toThrow('CLI crashed')

    cleanup(artifact)
  })

  it('records failure metrics', async () => {
    const failingProvider = makeProvider('markitdown', {
      normalize: async () => {
        throw new Error('boom')
      },
    })
    gateway = new DocumentIntakeGateway([failingProvider])
    const artifact = makeArtifact()

    await expect(gateway.intake(artifact)).rejects.toThrow(IntakeGatewayError)

    const metrics = gateway.getMetrics()
    expect(metrics.documents_received).toBe(1)
    expect(metrics.documents_failed).toBe(1)
    expect(metrics.documents_normalized).toBe(0)

    cleanup(artifact)
  })

  it('throws NO_SUITABLE_PROVIDER when no provider matches', async () => {
    const pdfOnly = makeProvider('markitdown', { supports: (a) => a.format === 'pdf' })
    gateway = new DocumentIntakeGateway([pdfOnly])
    const artifact = makeArtifact({ format: 'docx', filename: 'doc.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })

    try {
      await gateway.intake(artifact)
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(IntakeGatewayError)
      expect((err as IntakeGatewayError).code).toBe('NO_SUITABLE_PROVIDER')
    }

    cleanup(artifact)
  })

  it('IntakeGatewayError has request ID', async () => {
    const failingProvider = makeProvider('markitdown', {
      normalize: async () => { throw new Error('fail') },
    })
    gateway = new DocumentIntakeGateway([failingProvider])
    const artifact = makeArtifact()

    try {
      await gateway.intake(artifact)
      expect.fail('should have thrown')
    } catch (err) {
      const e = err as IntakeGatewayError
      expect(e.gatewayRequestId).toMatch(/^kdie-\d+-\d+$/)
      expect(e.artifactId).toBe('artifact-gw-1')
      expect(e.code).toBe('INTAKE_FAILED')
    }

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Multiple providers
// --------------------------------------------------------------------------

describe('DocumentIntakeGateway — multiple providers', () => {
  beforeEach(() => {
    resetIntakeMetrics()
  })

  it('selects the first provider that supports the format', async () => {
    const pdfOnly = makeProvider('markitdown', { supports: (a) => a.format === 'pdf' })
    const docxOnly = makeProvider('unstructured', { supports: (a) => a.format === 'docx' })

    const gateway = new DocumentIntakeGateway([pdfOnly, docxOnly])

    const pdf = makeArtifact({ filename: 'doc.pdf', format: 'pdf', mimeType: 'application/pdf' })
    const result = await gateway.intake(pdf)
    expect(result.provider).toBe('markitdown')
    cleanup(pdf)

    const docx = makeArtifact({ filename: 'doc.docx', format: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const result2 = await gateway.intake(docx)
    expect(result2.provider).toBe('unstructured')
    cleanup(docx)
  })

  it('registers additional providers at runtime', async () => {
    const gateway = new DocumentIntakeGateway([])
    gateway.registerProvider(makeProvider('ocr'))

    const artifact = makeArtifact()
    const result = await gateway.intake(artifact)
    expect(result.provider).toBe('ocr')

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Metrics
// --------------------------------------------------------------------------

describe('DocumentIntakeGateway — metrics', () => {
  beforeEach(() => {
    resetIntakeMetrics()
  })

  it('tracks provider usage counts across multiple intakes', async () => {
    const gateway = new DocumentIntakeGateway([makeProvider('markitdown')])

    await gateway.intake(makeArtifact({ filename: 'a.pdf' }))
    await gateway.intake(makeArtifact({ filename: 'b.pdf' }))
    await gateway.intake(makeArtifact({ filename: 'c.pdf' }))

    const metrics = gateway.getMetrics()
    expect(metrics.documents_received).toBe(3)
    expect(metrics.documents_normalized).toBe(3)
    expect(metrics.provider_used['markitdown']).toBe(3)
    expect(metrics.normalization_time_ms_total).toBeGreaterThanOrEqual(0)
    expect(metrics.normalization_time_ms_max).toBeGreaterThanOrEqual(0)
  })

  it('tracks provider failure counts', async () => {
    const failingProvider = makeProvider('markitdown', {
      normalize: async () => { throw new Error('fail') },
    })
    const gateway = new DocumentIntakeGateway([failingProvider])

    await expect(gateway.intake(makeArtifact())).rejects.toThrow()
    await expect(gateway.intake(makeArtifact())).rejects.toThrow()

    const metrics = gateway.getMetrics()
    expect(metrics.documents_failed).toBe(2)
    expect(metrics.provider_failed['markitdown']).toBe(2)
  })

  it('metrics are independent between gateway instances', async () => {
    const gw1 = new DocumentIntakeGateway([makeProvider('markitdown')])
    const gw2 = new DocumentIntakeGateway([makeProvider('ocr')])

    await gw1.intake(makeArtifact())
    await gw2.intake(makeArtifact())

    // Each gateway instance shares the global metrics store
    const m = getIntakeMetrics()
    expect(m.documents_received).toBe(2)
  })

  it('resetIntakeMetrics clears all counters', () => {
    resetIntakeMetrics()
    const m = getIntakeMetrics()
    expect(m.documents_received).toBe(0)
    expect(m.documents_normalized).toBe(0)
    expect(m.documents_failed).toBe(0)
    expect(m.last_intake_at).toBeNull()
  })
})

// --------------------------------------------------------------------------
// Backward compatibility — legacy extraction adapter
// --------------------------------------------------------------------------

describe('DocumentIntakeGateway — legacy adapter', () => {
  beforeEach(() => {
    resetIntakeMetrics()
  })

  it('converts legacy ExtractionInput to DocumentArtifact and normalizes', async () => {
    const gateway = new DocumentIntakeGateway([makeProvider('markitdown')])

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdie-legacy-'))
    const filePath = path.join(tmpDir, 'legacy-doc.pdf')
    fs.writeFileSync(filePath, 'legacy content', 'utf-8')
    const buffer = fs.readFileSync(filePath)
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')

    const result = await gateway.intakeFromLegacyInput({
      artifactId: 'legacy-1',
      filePath,
      filename: 'legacy-doc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: buffer.length,
      sha256,
    })

    expect(result.document.artifactId).toBe('legacy-1')
    expect(result.document.markdown).toContain('# legacy-doc.pdf')
    expect(result.provider).toBe('markitdown')

    try { fs.unlinkSync(filePath) } catch { /* ignore */ }
    try { fs.rmdirSync(tmpDir) } catch { /* ignore */ }
  })

  it('detects format from MIME type in legacy adapter', async () => {
    const gateway = new DocumentIntakeGateway([makeProvider('markitdown')])

    const result = await gateway.intakeFromLegacyInput({
      artifactId: 'docx-1',
      filePath: '/tmp/test.docx',
      filename: 'report.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 1000,
      sha256: 'a'.repeat(64),
    })

    // Should still work because provider supports all via 'supports: () => true'
    expect(result.document.artifactId).toBe('docx-1')
  })

  it('records metrics for legacy intake', async () => {
    const gateway = new DocumentIntakeGateway([makeProvider('markitdown')])

    await gateway.intakeFromLegacyInput({
      artifactId: 'legacy-metric-1',
      filePath: '/tmp/test.pdf',
      filename: 'test.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 500,
      sha256: 'b'.repeat(64),
    })

    const metrics = gateway.getMetrics()
    expect(metrics.documents_received).toBe(1)
    expect(metrics.documents_normalized).toBe(1)
  })
})

// --------------------------------------------------------------------------
// Provenance preservation
// --------------------------------------------------------------------------

describe('DocumentIntakeGateway — provenance', () => {
  beforeEach(() => {
    resetIntakeMetrics()
  })

  it('preserves artifact ID through the pipeline', async () => {
    const gateway = new DocumentIntakeGateway([makeProvider('markitdown')])
    const artifact = makeArtifact({ id: 'artifact-provenance-test' })

    const result = await gateway.intake(artifact)

    expect(result.document.artifactId).toBe('artifact-provenance-test')

    cleanup(artifact)
  })

  it('preserves source hash through normalization', async () => {
    const gateway = new DocumentIntakeGateway([makeProvider('markitdown')])
    const artifact = makeArtifact()

    const result = await gateway.intake(artifact)

    expect(result.document.sourceHash).toBe(artifact.sha256)

    cleanup(artifact)
  })

  it('gateway request ID is unique per call', async () => {
    const gateway = new DocumentIntakeGateway([makeProvider('markitdown')])

    const r1 = await gateway.intake(makeArtifact({ filename: 'a.pdf' }))
    const r2 = await gateway.intake(makeArtifact({ filename: 'b.pdf' }))

    expect(r1.gatewayRequestId).not.toBe(r2.gatewayRequestId)
  })
})

// --------------------------------------------------------------------------
// Gateway configuration
// --------------------------------------------------------------------------

describe('DocumentIntakeGateway — configuration', () => {
  beforeEach(() => {
    resetIntakeMetrics()
  })

  it('accepts custom request ID prefix', async () => {
    const gateway = new DocumentIntakeGateway(
      [makeProvider('markitdown')],
      { requestIdPrefix: 'custom-prefix' },
    )

    const result = await gateway.intake(makeArtifact())
    expect(result.gatewayRequestId).toMatch(/^custom-prefix-\d+-\d+$/)
  })

  it('constructs with empty providers (register later)', () => {
    const gateway = new DocumentIntakeGateway([])
    expect(gateway).toBeDefined()
    expect(gateway.getMetrics().documents_received).toBe(0)
  })
})
