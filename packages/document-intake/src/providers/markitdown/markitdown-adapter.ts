// ==========================================================================
// Kadarn Document Intake Engine — MarkItDown Adapter (Production)
// ==========================================================================
// Sprint 27C.
//
// Integrates Microsoft MarkItDown via Python CLI subprocess.
// Production-ready with: installation checks, version detection,
// stderr capture, timeout handling, and typed failure modes.
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

const DEFAULT_TIMEOUT_MS = 60_000
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024
const MARKITDOWN_CMD = process.platform === 'win32' ? 'markitdown.exe' : 'markitdown'
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3'

// --------------------------------------------------------------------------
// MIME types
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
// Supported formats (human-readable)
// --------------------------------------------------------------------------

export const SUPPORTED_FORMATS = [
  'PDF', 'DOCX', 'XLSX', 'PPTX', 'HTML', 'CSV', 'JSON', 'XML', 'EPUB', 'ZIP',
] as const

// --------------------------------------------------------------------------
// Errors
// --------------------------------------------------------------------------

export class MarkItDownNotInstalledError extends Error {
  constructor() {
    super("MarkItDown CLI not found. Install with: pip install 'markitdown[all]'")
    this.name = 'MarkItDownNotInstalledError'
  }
}

export class MarkItDownTimeoutError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly timeoutMs: number,
  ) {
    super(`MarkItDown timed out after ${timeoutMs}ms processing: ${filePath}`)
    this.name = 'MarkItDownTimeoutError'
  }
}

export class MarkItDownExecutionError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly exitCode: number | null,
    public readonly stderr: string,
    public readonly signal: NodeJS.Signals | null = null,
  ) {
    const detail = stderr ? `: ${stderr.trim().slice(0, 200)}` : signal ? ` (killed by ${signal})` : ''
    super(`MarkItDown exited with code ${exitCode} for ${filePath}${detail}`)
    this.name = 'MarkItDownExecutionError'
  }
}

export class MarkItDownUnsupportedFormatError extends Error {
  constructor(mimeType: string) {
    super(`MarkItDown does not support format: ${mimeType}. Supported: ${[...SUPPORTED_MIME_TYPES].slice(0, 5).join(', ')}...`)
    this.name = 'MarkItDownUnsupportedFormatError'
  }
}

// --------------------------------------------------------------------------
// Installation check result
// --------------------------------------------------------------------------

export interface MarkItDownInstallationStatus {
  installed: boolean
  version: string | null
  path: string
  method: 'cli' | 'python-module' | 'not-found'
}

// --------------------------------------------------------------------------
// Adapter
// --------------------------------------------------------------------------

export class MarkItDownAdapter implements IntakeProvider {
  readonly name = 'markitdown' as const
  private readonly timeoutMs: number
  private _providerVersion: string | null = null

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

    // --- Pre-flight ---
    if (!this.supports(artifact)) {
      throw new MarkItDownUnsupportedFormatError(artifact.mimeType)
    }
    this.validateFile(artifact, warnings)

    // --- Build NormalizedDocument (version detected via checkInstallation) ---
    let markdown: string
    let usedFallback = false
    try {
      markdown = await this.invokeCli(artifact.filePath)
    } catch (cause: unknown) {
      try {
        markdown = await this.invokePythonModule(artifact.filePath)
        usedFallback = true
        warnings.push({
          code: 'FALLBACK_PYTHON_MODULE',
          message: 'Used python -m markitdown as fallback.',
        })
      } catch {
        throw this.categorizeError(cause, artifact.filePath)
      }
    }

    const completedAt = new Date()
    const processingTimeMs = completedAt.getTime() - startedAt.getTime()

    // --- Empty output ---
    if (!markdown || markdown.trim().length === 0) {
      warnings.push({ code: 'EMPTY_OUTPUT', message: 'MarkItDown produced empty output.' })
    }

    // --- NormalizedDocument ---
    return {
      artifactId: artifact.id,
      markdown: markdown || `# ${artifact.filename}\n\n*(Empty document)*\n`,
      metadata: {
        provider: 'markitdown',
        providerVersion: this._providerVersion ?? 'external-cli',
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
  // Installation check
  // --------------------------------------------------------------------------

  /**
   * Verify MarkItDown is installed and detect its version.
   * Safe to call at startup or before first use.
   */
  async checkInstallation(): Promise<MarkItDownInstallationStatus> {
    // Try CLI first
    try {
      const { stdout } = await execFileAsync(MARKITDOWN_CMD, ['--version'], {
        timeout: 5000,
        windowsHide: true,
      })
      return {
        installed: true,
        version: stdout.trim().replace(/^markitdown\s*/i, ''),
        path: MARKITDOWN_CMD,
        method: 'cli',
      }
    } catch {
      // Try python -m markitdown --version
      try {
        const { stdout } = await execFileAsync(PYTHON_CMD, ['-m', 'markitdown', '--version'], {
          timeout: 5000,
          windowsHide: true,
        })
        return {
          installed: true,
          version: stdout.trim().replace(/^markitdown\s*/i, ''),
          path: `${PYTHON_CMD} -m markitdown`,
          method: 'python-module',
        }
      } catch {
        return { installed: false, version: null, path: 'not-found', method: 'not-found' }
      }
    }
  }

  // --------------------------------------------------------------------------
  // CLI invocation
  // --------------------------------------------------------------------------

  private async invokeCli(filePath: string): Promise<string> {
    try {
      const { stdout, stderr } = await execFileAsync(MARKITDOWN_CMD, [filePath], {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
        timeout: this.timeoutMs,
        windowsHide: true,
      })
      // Stderr may contain warnings — log but don't fail
      if (stderr && stderr.trim()) {
        // Non-fatal: markitdown sometimes writes warnings to stderr
      }
      return stdout
    } catch (err: unknown) {
      throw this.categorizeError(err, filePath)
    }
  }

  private async invokePythonModule(filePath: string): Promise<string> {
    try {
      const { stdout, stderr } = await execFileAsync(PYTHON_CMD, ['-m', 'markitdown', filePath], {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
        timeout: this.timeoutMs,
        windowsHide: true,
      })
      if (stderr && stderr.trim()) {
        // Non-fatal warnings
      }
      return stdout
    } catch (err: unknown) {
      throw this.categorizeError(err, filePath)
    }
  }

  // --------------------------------------------------------------------------
  // Internal: error categorization
  // --------------------------------------------------------------------------

  private categorizeError(err: unknown, filePath: string): Error {
    if (err instanceof Error && 'code' in err) {
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        return new MarkItDownNotInstalledError()
      }
      if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') {
        return new MarkItDownTimeoutError(filePath, this.timeoutMs)
      }
    }
    // Check for timeout in message
    if (err instanceof Error && err.message.includes('timed out')) {
      return new MarkItDownTimeoutError(filePath, this.timeoutMs)
    }
    // Extract stderr and exit code if available
    const exitCode = (err as any)?.code ?? null
    const stderr = (err as any)?.stderr ?? ''
    const signal = (err as any)?.signal ?? null
    return new MarkItDownExecutionError(filePath, exitCode, stderr, signal)
  }

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  private validateFile(artifact: DocumentArtifact, warnings: IntakeWarning[]): void {
    if (!fs.existsSync(artifact.filePath)) {
      throw new Error(`File not found: ${artifact.filePath}`)
    }

    if (artifact.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Artifact exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit: ${artifact.filePath}`)
    }

    const stat = fs.statSync(artifact.filePath)
    if (stat.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit: ${artifact.filePath}`)
    }

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
