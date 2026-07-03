// ==========================================================================
// Kadarn Document Intake Engine — MarkItDown Adapter
// ==========================================================================
// Sprint 26B.
//
// Integrates Microsoft MarkItDown (https://github.com/microsoft/markitdown)
// via Python CLI subprocess. NO code copied from the upstream repo.
//
// This adapter implements the IntakeProvider contract defined in Sprint 26A.
// It calls `markitdown <file>` via child_process.execFile, captures stdout,
// and wraps the result in a NormalizedDocument.
//
// Supported formats: PDF, DOCX, XLSX, PPTX, HTML, CSV, JSON, XML, EPUB, ZIP.
// ==========================================================================

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type {
  DocumentArtifact,
  NormalizedDocument,
  IntakeProvider,
  IntakeWarning,
} from '../../contracts.js'

const execFileAsync = promisify(execFile)

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

/** Default timeout for the Python subprocess (60 seconds). */
const DEFAULT_TIMEOUT_MS = 60_000

/** Maximum file size the adapter will process (100 MB). */
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024

/** CLI command to invoke MarkItDown. */
const MARKITDOWN_CMD = process.platform === 'win32' ? 'markitdown.exe' : 'markitdown'

/** Python path for fallback invocation. */
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3'

// --------------------------------------------------------------------------
// MIME types supported by MarkItDown
// --------------------------------------------------------------------------

const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/html',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'application/epub+zip',
  'application/zip',
  'application/x-zip-compressed',
])

// --------------------------------------------------------------------------
// Errors
// --------------------------------------------------------------------------

/** MarkItDown CLI is not installed or not found in PATH. */
export class MarkItDownNotInstalledError extends Error {
  constructor() {
    super(
      'MarkItDown CLI not found. Install it with: pip install \'markitdown[all]\'',
    )
    this.name = 'MarkItDownNotInstalledError'
  }
}

/** MarkItDown process timed out. */
export class MarkItDownTimeoutError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly timeoutMs: number,
  ) {
    super(`MarkItDown timed out after ${timeoutMs}ms processing: ${filePath}`)
    this.name = 'MarkItDownTimeoutError'
  }
}

/** MarkItDown process exited with non-zero code. */
export class MarkItDownExecutionError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly exitCode: number | null,
    public readonly stderr: string,
  ) {
    const detail = stderr ? `: ${stderr.trim()}` : ''
    super(`MarkItDown exited with code ${exitCode} for ${filePath}${detail}`)
    this.name = 'MarkItDownExecutionError'
  }
}

// --------------------------------------------------------------------------
// Adapter
// --------------------------------------------------------------------------

/**
 * MarkItDown Adapter — consumes Microsoft's official MarkItDown via Python CLI.
 *
 * This adapter does NOT copy or reimplement MarkItDown functionality.
 * It delegates entirely to the upstream CLI installed via pip.
 *
 * Usage:
 *   const adapter = new MarkItDownAdapter({ timeoutMs: 30000 })
 *   const normalized = await adapter.normalize(artifact)
 */
export class MarkItDownAdapter implements IntakeProvider {
  readonly name = 'markitdown' as const

  private readonly timeoutMs: number

  constructor(options: { timeoutMs?: number } = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  // --------------------------------------------------------------------------
  // IntakeProvider implementation
  // --------------------------------------------------------------------------

  supports(artifact: DocumentArtifact): boolean {
    return SUPPORTED_MIME_TYPES.has(artifact.mimeType)
  }

  async normalize(artifact: DocumentArtifact): Promise<NormalizedDocument> {
    const startedAt = new Date()
    const warnings: IntakeWarning[] = []

    // --- Pre-flight validation ---
    this.validateFile(artifact, warnings)

    // --- Invoke MarkItDown CLI ---
    let markdown: string
    try {
      markdown = await this.invokeCli(artifact.filePath)
    } catch (cause: unknown) {
      // Try fallback: python -m markitdown
      try {
        markdown = await this.invokePythonModule(artifact.filePath)
        warnings.push({
          code: 'FALLBACK_PYTHON_MODULE',
          message: 'Used python -m markitdown as fallback.',
        })
      } catch {
        throw cause
      }
    }

    const completedAt = new Date()
    const processingTimeMs = completedAt.getTime() - startedAt.getTime()

    // --- Warn on empty output ---
    if (!markdown || markdown.trim().length === 0) {
      warnings.push({
        code: 'EMPTY_OUTPUT',
        message: 'MarkItDown produced empty output.',
      })
    }

    // --- Build NormalizedDocument ---
    return {
      artifactId: artifact.id,
      markdown: markdown || `# ${artifact.filename}\n\n*(Empty document)*\n`,
      metadata: {
        provider: 'markitdown',
        providerVersion: 'external-cli',
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        processingTimeMs,
        language: undefined,
        warnings,
      },
      sourceHash: artifact.sha256,
      normalizedAt: completedAt.toISOString(),
    }
  }

  // --------------------------------------------------------------------------
  // CLI invocation
  // --------------------------------------------------------------------------

  /**
   * Invoke `markitdown <file>` via the installed CLI.
   *
   * MarkItDown writes markdown to stdout. We capture that output.
   */
  private async invokeCli(filePath: string): Promise<string> {
    const { stdout } = await execFileAsync(MARKITDOWN_CMD, [filePath], {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024, // 50 MB buffer
      timeout: this.timeoutMs,
      windowsHide: true,
    })
    return stdout
  }

  /**
   * Fallback: invoke `python -m markitdown <file>`.
   */
  private async invokePythonModule(filePath: string): Promise<string> {
    const { stdout } = await execFileAsync(PYTHON_CMD, ['-m', 'markitdown', filePath], {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: this.timeoutMs,
      windowsHide: true,
    })
    return stdout
  }

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  private validateFile(artifact: DocumentArtifact, warnings: IntakeWarning[]): void {
    // File must exist
    if (!fs.existsSync(artifact.filePath)) {
      throw new Error(`File not found: ${artifact.filePath}`)
    }

    // Size checks (both reported and actual)
    if (artifact.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `Artifact reports size exceeding ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit: ${artifact.filePath}`,
      )
    }
    const stat = fs.statSync(artifact.filePath)
    if (stat.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit: ${artifact.filePath}`,
      )
    }

    // Hash check (non-fatal warning only)
    const fileBuffer = fs.readFileSync(artifact.filePath)
    const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    if (computedHash !== artifact.sha256) {
      warnings.push({
        code: 'HASH_MISMATCH',
        message: 'Computed SHA-256 does not match the provided artifact hash.',
      })
    }
  }
}
