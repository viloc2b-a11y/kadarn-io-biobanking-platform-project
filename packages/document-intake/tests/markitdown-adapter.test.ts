// ==========================================================================
// Kadarn Document Intake Engine — MarkItDown Adapter Tests
// ==========================================================================
// Sprint 26B.
// Tests MarkItDownAdapter: supports(), normalize(), error handling, validation.
// ==========================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MarkItDownAdapter,
  MarkItDownNotInstalledError,
  MarkItDownTimeoutError,
  MarkItDownExecutionError,
} from '../src/providers/markitdown/markitdown-adapter.js'
import type {
  DocumentArtifact,
  DocumentSource,
  NormalizedDocument,
} from '../src/contracts.js'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

// --------------------------------------------------------------------------
// Mock child_process.execFile
// --------------------------------------------------------------------------

const mockExecFile = vi.fn()
vi.mock('node:child_process', () => ({
  execFile: (...args: unknown[]) => {
    // Re-create promisify behavior
    const cb = args[args.length - 1] as (err: Error | null, result?: { stdout: string; stderr: string }) => void
    try {
      const result = mockExecFile(...args.slice(0, -1))
      if (result instanceof Error) {
        cb(result)
      } else {
        cb(null, result)
      }
    } catch (err) {
      cb(err as Error)
    }
  },
}))

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
  const filename = overrides.filename ?? 'test-document.pdf'
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdietest-'))
  const filePath = path.join(tmpDir, filename)
  fs.writeFileSync(filePath, 'test content for markitdown adapter', 'utf-8')
  const buffer = fs.readFileSync(filePath)
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')

  return {
    id: overrides.id ?? 'artifact-1',
    filename,
    format: overrides.format ?? 'pdf',
    mimeType: overrides.mimeType ?? 'application/pdf',
    sizeBytes: overrides.sizeBytes ?? buffer.length,
    sha256: overrides.sha256 ?? sha256,
    filePath: overrides.filePath ?? filePath,
    source: makeSource(overrides.source),
    registeredAt: overrides.registeredAt ?? new Date().toISOString(),
  }
}

function cleanup(artifact: DocumentArtifact): void {
  try { fs.unlinkSync(artifact.filePath) } catch { /* ignore */ }
  try { fs.rmdirSync(path.dirname(artifact.filePath)) } catch { /* ignore */ }
}

// --------------------------------------------------------------------------
// MIME type support
// --------------------------------------------------------------------------

describe('MarkItDownAdapter — supports()', () => {
  const adapter = new MarkItDownAdapter()

  const supportedCases: Array<[string, string]> = [
    ['PDF', 'application/pdf'],
    ['DOCX', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['XLSX', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['PPTX', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ['HTML', 'text/html'],
    ['CSV', 'text/csv'],
    ['JSON', 'application/json'],
    ['XML', 'application/xml'],
    ['XML (text)', 'text/xml'],
    ['EPUB', 'application/epub+zip'],
    ['ZIP', 'application/zip'],
    ['ZIP (alt)', 'application/x-zip-compressed'],
  ]

  it.each(supportedCases)('supports %s (%s)', (_label, mimeType) => {
    const artifact = makeArtifact({ mimeType })
    expect(adapter.supports(artifact)).toBe(true)
    cleanup(artifact)
  })

  it('rejects unsupported MIME types', () => {
    const unsupported = makeArtifact({ mimeType: 'image/png' })
    expect(adapter.supports(unsupported)).toBe(false)
    cleanup(unsupported)

    const video = makeArtifact({ mimeType: 'video/mp4' })
    expect(adapter.supports(video)).toBe(false)
    cleanup(video)

    const binary = makeArtifact({ mimeType: 'application/octet-stream' })
    expect(adapter.supports(binary)).toBe(false)
    cleanup(binary)
  })
})

// --------------------------------------------------------------------------
// Normalization (mocked CLI)
// --------------------------------------------------------------------------

describe('MarkItDownAdapter — normalize() with mock CLI', () => {
  let adapter: MarkItDownAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new MarkItDownAdapter({ timeoutMs: 30000 })
    mockExecFile.mockResolvedValue({ stdout: '# Extracted\n\nContent from markitdown.\n', stderr: '' })
  })

  it('returns a NormalizedDocument with markdown content', async () => {
    const artifact = makeArtifact({ filename: 'protocol.pdf' })

    const result = await adapter.normalize(artifact)

    expect(result.artifactId).toBe('artifact-1')
    expect(result.markdown).toContain('# Extracted')
    expect(result.markdown).toContain('Content from markitdown')
    expect(result.metadata.provider).toBe('markitdown')
    expect(result.metadata.providerVersion).toBe('external-cli')
    expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0)
    expect(result.metadata.startedAt).toBeDefined()
    expect(result.metadata.completedAt).toBeDefined()
    expect(result.sourceHash).toBe(artifact.sha256)
    expect(result.normalizedAt).toBeDefined()

    cleanup(artifact)
  })

  it('passes the file path to the markitdown CLI', async () => {
    const artifact = makeArtifact({ filename: 'specific-file.pdf' })

    await adapter.normalize(artifact)

    // Verify execFile was called with correct command and file path
    expect(mockExecFile).toHaveBeenCalledWith(
      expect.stringContaining('markitdown'),
      [artifact.filePath],
      expect.objectContaining({ encoding: 'utf-8' }),
    )

    cleanup(artifact)
  })

  it('emits empty output warning when markdown is whitespace only', async () => {
    mockExecFile.mockResolvedValue({ stdout: '   \n  ', stderr: '' })
    const artifact = makeArtifact({ filename: 'empty.pdf' })

    const result = await adapter.normalize(artifact)

    const warningCodes = result.metadata.warnings.map(w => w.code)
    expect(warningCodes).toContain('EMPTY_OUTPUT')
    // Should still return a placeholder
    expect(result.markdown).toBeTruthy()

    cleanup(artifact)
  })

  it('falls back to python -m markitdown when CLI fails', async () => {
    // First call (CLI) fails with ENOENT
    let callCount = 0
    mockExecFile.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        const err = new Error('Command not found') as NodeJS.ErrnoException
        err.code = 'ENOENT'
        throw err
      }
      return { stdout: '# Fallback\n\nExtracted via python -m.\n', stderr: '' }
    })

    const artifact = makeArtifact({ filename: 'fallback.pdf' })

    const result = await adapter.normalize(artifact)

    expect(result.markdown).toContain('# Fallback')
    const warningCodes = result.metadata.warnings.map(w => w.code)
    expect(warningCodes).toContain('FALLBACK_PYTHON_MODULE')

    cleanup(artifact)
  })

  it('throws when both CLI and python fallback fail', async () => {
    mockExecFile.mockImplementation(() => {
      const err = new Error('Command not found') as NodeJS.ErrnoException
      err.code = 'ENOENT'
      throw err
    })

    const artifact = makeArtifact({ filename: 'nocloud.pdf' })

    await expect(adapter.normalize(artifact)).rejects.toThrow()

    cleanup(artifact)
  })

  it('emits hash mismatch warning when sha256 does not match', async () => {
    const artifact = makeArtifact({ sha256: '0000000000000000000000000000000000000000000000000000000000000000' })

    const result = await adapter.normalize(artifact)

    const hashWarnings = result.metadata.warnings.filter(w => w.code === 'HASH_MISMATCH')
    expect(hashWarnings).toHaveLength(1)

    cleanup(artifact)
  })

  it('does not emit hash mismatch when sha256 matches', async () => {
    const artifact = makeArtifact() // sha256 auto-computed

    const result = await adapter.normalize(artifact)

    const hashWarnings = result.metadata.warnings.filter(w => w.code === 'HASH_MISMATCH')
    expect(hashWarnings).toHaveLength(0)

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

describe('MarkItDownAdapter — validation', () => {
  let adapter: MarkItDownAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new MarkItDownAdapter()
    mockExecFile.mockResolvedValue({ stdout: '# OK\n', stderr: '' })
  })

  it('throws on non-existent file', async () => {
    const artifact: DocumentArtifact = {
      id: 'nonexistent',
      filename: 'ghost.pdf',
      format: 'pdf',
      mimeType: 'application/pdf',
      sizeBytes: 0,
      sha256: 'x'.repeat(64),
      filePath: '/nonexistent/path/ghost.pdf',
      source: makeSource(),
      registeredAt: new Date().toISOString(),
    }

    await expect(adapter.normalize(artifact)).rejects.toThrow('File not found')
  })

  it('throws on oversized file (artifact sizeBytes)', async () => {
    // when sizeBytes exceeds the limit, validation catches it
    const artifact = makeArtifact({
      filename: 'big.pdf',
      sizeBytes: 200 * 1024 * 1024,
    })

    await expect(adapter.normalize(artifact)).rejects.toThrow(/exceed.*MB limit/)

    cleanup(artifact)
  })
})

// --------------------------------------------------------------------------
// Error types
// --------------------------------------------------------------------------

describe('MarkItDownAdapter — error types', () => {
  it('MarkItDownNotInstalledError has descriptive message', () => {
    const err = new MarkItDownNotInstalledError()
    expect(err.message).toContain('pip install')
    expect(err.message).toContain('markitdown')
    expect(err.name).toBe('MarkItDownNotInstalledError')
  })

  it('MarkItDownTimeoutError stores filePath and timeoutMs', () => {
    const err = new MarkItDownTimeoutError('/data/doc.pdf', 30000)
    expect(err.filePath).toBe('/data/doc.pdf')
    expect(err.timeoutMs).toBe(30000)
    expect(err.message).toContain('30000ms')
    expect(err.name).toBe('MarkItDownTimeoutError')
  })

  it('MarkItDownExecutionError stores exitCode and stderr', () => {
    const err = new MarkItDownExecutionError('/data/doc.pdf', 1, 'Conversion failed: bad format')
    expect(err.filePath).toBe('/data/doc.pdf')
    expect(err.exitCode).toBe(1)
    expect(err.stderr).toBe('Conversion failed: bad format')
    expect(err.message).toContain('code 1')
    expect(err.message).toContain('bad format')
    expect(err.name).toBe('MarkItDownExecutionError')
  })
})

// --------------------------------------------------------------------------
// IntakeProvider compliance
// --------------------------------------------------------------------------

describe('MarkItDownAdapter — IntakeProvider compliance', () => {
  it('implements the IntakeProvider interface', () => {
    const adapter = new MarkItDownAdapter()
    expect(adapter.name).toBe('markitdown')
    expect(typeof adapter.supports).toBe('function')
    expect(typeof adapter.normalize).toBe('function')
  })

  it('has no semantic or domain methods', () => {
    const adapter = new MarkItDownAdapter()
    // Provider is infrastructure-only — no evidence, no claims, no AI
    expect((adapter as any).createClaim).toBeUndefined()
    expect((adapter as any).createEvidenceCandidate).toBeUndefined()
    expect((adapter as any).classify).toBeUndefined()
    expect((adapter as any).calculateConfidence).toBeUndefined()
  })
})

// --------------------------------------------------------------------------
// Configurable timeout
// --------------------------------------------------------------------------

describe('MarkItDownAdapter — configuration', () => {
  it('uses default timeout when not configured', () => {
    const adapter = new MarkItDownAdapter()
    // Default is 60s — test that it constructs
    expect(adapter.name).toBe('markitdown')
  })

  it('accepts custom timeout in constructor', () => {
    const adapter = new MarkItDownAdapter({ timeoutMs: 15000 })
    expect(adapter.name).toBe('markitdown')
    // Custom timeout is private, but construction succeeds
  })
})
