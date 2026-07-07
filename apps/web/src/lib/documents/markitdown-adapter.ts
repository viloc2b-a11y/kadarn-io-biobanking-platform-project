// ==========================================================================
// Kadarn MVP — MarkItDown Adapter (Document Bridge)
// ==========================================================================
// CR-3 Resolution: Thin wrapper around MarkItDown CLI.
// Converts uploaded files to Markdown for downstream evidence extraction.
// Isolated behind a clean boundary — no dependency on document-intake package.
// ==========================================================================

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'

const execFileAsync = promisify(execFile)

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 60_000
const MAX_FILE_SIZE_MB = 50
const PYTHON_CMD = process.env.MARKITDOWN_PYTHON_PATH ?? process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3')

const SUPPORTED_EXTENSIONS = new Set([
  '.pdf', '.docx', '.xlsx', '.pptx', '.html', '.csv',
  '.json', '.xml', '.txt', '.md', '.epub', '.zip',
])

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface MarkItDownResult {
  filename: string
  markdown: string
  characterCount: number
  convertedAt: string
  converter: 'markitdown'
  providerVersion?: string
  warnings: string[]
}

export interface MarkItDownError {
  filename: string
  error: string
  code: 'UNSUPPORTED_FORMAT' | 'FILE_TOO_LARGE' | 'NOT_INSTALLED' | 'CONVERSION_FAILED' | 'TIMEOUT' | 'EMPTY_OUTPUT'
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Convert an uploaded file buffer to Markdown using MarkItDown CLI.
 */
export async function convertToMarkdown(params: {
  buffer: Buffer
  filename: string
  mimeType?: string
}): Promise<MarkItDownResult> {
  const { buffer, filename } = params
  const ext = path.extname(filename).toLowerCase()

  // Validate
  if (buffer.length === 0) {
    throw createError(filename, 'EMPTY_OUTPUT', 'Uploaded document is empty.')
  }
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw createError(filename, 'UNSUPPORTED_FORMAT', `Unsupported format: ${ext}`)
  }
  if (buffer.length > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw createError(filename, 'FILE_TOO_LARGE', `File exceeds ${MAX_FILE_SIZE_MB}MB limit`)
  }

  // Write temp file
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kadarn-markitdown-'))
  const tmpFile = path.join(tmpDir, filename)
  
  try {
    fs.writeFileSync(tmpFile, buffer)

    const markdown = await invokeMarkItDown(tmpFile)
    const warnings: string[] = []

    if (!markdown || markdown.trim().length === 0) {
      warnings.push('MarkItDown produced empty output')
    }

    // Try to get version
    let version: string | undefined
    try {
      const { stdout } = await execFileAsync(PYTHON_CMD, ['-m', 'markitdown', '--version'], {
        timeout: 5000, windowsHide: true,
      })
      version = stdout.trim().replace(/^markitdown\s*/i, '')
    } catch { /* version detection is best-effort */ }

    return {
      filename,
      markdown: markdown || `# ${filename}\n\n*(Empty document)*\n`,
      characterCount: (markdown || '').length,
      convertedAt: new Date().toISOString(),
      converter: 'markitdown',
      providerVersion: version,
      warnings,
    }
  } finally {
    // Cleanup temp files
    try { fs.unlinkSync(tmpFile) } catch {}
    try { fs.rmdirSync(tmpDir) } catch {}
  }
}

// --------------------------------------------------------------------------
// CLI invocation
// --------------------------------------------------------------------------

async function invokeMarkItDown(filePath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(PYTHON_CMD, ['-m', 'markitdown', filePath], {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: DEFAULT_TIMEOUT_MS,
      windowsHide: true,
    })
    return stdout
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        throw createError(filePath, 'NOT_INSTALLED', "MarkItDown not installed. Run: pip install 'markitdown[all]'")
      }
      if (code === 'ETIMEDOUT') {
        throw createError(filePath, 'TIMEOUT', `Conversion timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`)
      }
    }
    throw createError(filePath, 'CONVERSION_FAILED', err instanceof Error ? err.message : 'Unknown error')
  }
}

// --------------------------------------------------------------------------
// Check installation
// --------------------------------------------------------------------------

export async function checkMarkItDownInstalled(): Promise<boolean> {
  try {
    await execFileAsync(PYTHON_CMD, ['-m', 'markitdown', '--version'], {
      timeout: 5000, windowsHide: true,
    })
    return true
  } catch {
    return false
  }
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function createError(filename: string, code: MarkItDownError['code'], message: string): MarkItDownError {
  return { filename, error: message, code } as MarkItDownError
}
