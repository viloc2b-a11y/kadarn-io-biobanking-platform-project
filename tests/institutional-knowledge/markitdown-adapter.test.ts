// ==========================================================================
// MarkItDown Adapter — Integration Tests
// @vitest-environment node
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest'
import { convertToMarkdown, checkMarkItDownInstalled } from '../../apps/web/src/lib/documents/markitdown-adapter.ts'

describe('MarkItDown Adapter', () => {
  let installed = false

  beforeAll(async () => {
    installed = await checkMarkItDownInstalled()
  })

  it('MarkItDown is installed', () => {
    expect(installed).toBe(true)
  })

  it('converts a simple text file to Markdown', async () => {
    const buffer = Buffer.from('# Hello Kadarn\n\nThis is a test document.\n\n- Item 1\n- Item 2\n')
    const result = await convertToMarkdown({
      buffer,
      filename: 'test-document.md',
    })

    expect(result.filename).toBe('test-document.md')
    expect(result.markdown).toContain('Hello Kadarn')
    expect(result.characterCount).toBeGreaterThan(0)
    expect(result.convertedAt).toBeTruthy()
    expect(result.converter).toBe('markitdown')
  })

  it('converts HTML to Markdown', async () => {
    const html = '<html><body><h1>CLIA Certificate</h1><p>Laboratory is certified under <strong>CLIA #45D1234567</strong>.</p><ul><li>Valid through Dec 2027</li><li>Issued by CMS</li></ul></body></html>'
    const buffer = Buffer.from(html)
    const result = await convertToMarkdown({
      buffer,
      filename: 'clia-certificate.html',
    })

    expect(result.markdown).toBeTruthy()
    expect(result.characterCount).toBeGreaterThan(0)
  })

  it('rejects unsupported format', async () => {
    const buffer = Buffer.from('test')
    try {
      await convertToMarkdown({ buffer, filename: 'image.png' })
      expect.fail('Should have thrown')
    } catch (err: any) {
      expect(err.code || err.error).toBeDefined()
    }
  })

  it('handles empty file gracefully', async () => {
    const buffer = Buffer.from('')
    const result = await convertToMarkdown({
      buffer,
      filename: 'empty.txt',
    })

    expect(result.markdown).toBeTruthy()
    expect(result.warnings).toBeDefined()
  })

  it('includes conversion metadata', async () => {
    const buffer = Buffer.from('Test content for metadata check.')
    const result = await convertToMarkdown({
      buffer,
      filename: 'metadata-test.txt',
    })

    expect(result.converter).toBe('markitdown')
    expect(result.convertedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(typeof result.characterCount).toBe('number')
  })

  it('install check returns boolean', async () => {
    const isInstalled = await checkMarkItDownInstalled()
    expect(typeof isInstalled).toBe('boolean')
  })
})
