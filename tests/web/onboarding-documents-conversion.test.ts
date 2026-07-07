import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..', '..')
const WEB = join(ROOT, 'apps', 'web')
const BUNDLED_PYTHON = join(
  process.env.USERPROFILE ?? '',
  '.cache',
  'codex-runtimes',
  'codex-primary-runtime',
  'dependencies',
  'python',
  'python.exe',
)

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('onboarding document conversion', () => {
  const originalCwd = process.cwd()
  const originalPython = process.env.MARKITDOWN_PYTHON_PATH

  afterEach(() => {
    process.chdir(originalCwd)
    if (originalPython) {
      process.env.MARKITDOWN_PYTHON_PATH = originalPython
    } else {
      delete process.env.MARKITDOWN_PYTHON_PATH
    }
  })

  it('wires the Documents page to the real conversion route and stores Markdown result fields', () => {
    const page = read(join(WEB, 'src', 'app', '(onboarding)', 'onboarding', 'documents', 'page.tsx'))
    const context = read(join(WEB, 'src', 'lib', 'onboarding', 'onboarding-context.tsx'))

    expect(page).toContain("fetch('/api/onboarding/documents/convert'")
    expect(page).toContain("status: 'converted'")
    expect(page).toContain('payload.markdown')
    expect(page).toContain('Converted with MarkItDown')
    expect(context).toContain("converter?: 'markitdown'")
    expect(context).toContain('markdown?: string')
    expect(context).toContain('characterCount?: number')
  })

  it('documents the isolated MarkItDown boundary', () => {
    const doc = read(join(ROOT, 'docs', 'engineering', 'markitdown-document-pipeline.md'))

    expect(doc).toContain('Onboarding document upload -> Next.js API route -> temporary file -> MarkItDown -> Markdown JSON result')
    expect(doc).toContain('This is not a claim extraction pipeline.')
  })

  it('returns Markdown JSON from the API route for a text upload when MarkItDown is installed', async () => {
    const python = process.env.MARKITDOWN_PYTHON_PATH ?? BUNDLED_PYTHON
    if (!existsSync(python)) {
      return
    }

    process.env.MARKITDOWN_PYTHON_PATH = python
    process.chdir(WEB)

    const fixturePath = join(os.tmpdir(), 'kadarn-fixtures-markitdown-upload.txt')
    writeFileSync(fixturePath, 'Kadarn CLIA Certificate\n\nEvidence document for onboarding.', 'utf8')

    const { POST } = await import('../../apps/web/src/app/api/onboarding/documents/convert/route')
    const form = new FormData()
    form.append('file', new File([readFileSync(fixturePath)], 'fixture.txt', { type: 'text/plain' }))

    const response = await POST(new Request('http://localhost/api/onboarding/documents/convert', {
      method: 'POST',
      body: form,
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.filename).toBe('fixture.txt')
    expect(payload.converter).toBe('markitdown')
    expect(payload.markdown).toContain('Kadarn CLIA Certificate')
    expect(payload.characterCount).toBeGreaterThan(0)
    expect(payload.convertedAt).toEqual(expect.any(String))
  }, 90_000)

  it('returns a readable error for an empty upload', async () => {
    process.chdir(WEB)
    const { POST } = await import('../../apps/web/src/app/api/onboarding/documents/convert/route')
    const form = new FormData()
    form.append('file', new File([''], 'empty.txt', { type: 'text/plain' }))

    const response = await POST(new Request('http://localhost/api/onboarding/documents/convert', {
      method: 'POST',
      body: form,
    }))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toContain('empty')
  })
})
