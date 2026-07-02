// ==========================================================================
// Evidence Discovery — Extraction Provider Tests
// ==========================================================================
// Sprint 20A.3A.
// Tests DocumentExtractionProvider interface, MarkItDownProvider,
// DocumentExtractionRegistry, and DocumentExtractionService.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { MarkItDownProvider, DocumentExtractionRegistry, DocumentExtractionService } from '../src/index.js';
import type { ExtractionInput } from '../src/index.js';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeInput(overrides: Partial<ExtractionInput> = {}): ExtractionInput {
  const content = overrides.filename ?? 'test.pdf';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'extraction-test-'));
  const filePath = path.join(tmpDir, content);
  fs.writeFileSync(filePath, 'Test document content for extraction.', 'utf-8');
  const buffer = fs.readFileSync(filePath);

  return {
    artifactId: overrides.artifactId ?? 'artifact-1',
    filePath,
    filename: overrides.filename ?? 'test.pdf',
    mimeType: overrides.mimeType ?? 'application/pdf',
    sizeBytes: overrides.sizeBytes ?? buffer.length,
    sha256: overrides.sha256 ?? crypto.createHash('sha256').update(buffer).digest('hex'),
  };
}

function cleanup(input: ExtractionInput): void {
  try { fs.unlinkSync(input.filePath); } catch { /* ignore */ }
  try { fs.rmdirSync(path.dirname(input.filePath)); } catch { /* ignore */ }
}

// --------------------------------------------------------------------------
// Provider interface
// --------------------------------------------------------------------------

describe('MarkItDownProvider — interface', () => {
  it('implements DocumentExtractionProvider', () => {
    const p = new MarkItDownProvider();
    expect(p.name).toBe('markitdown');
    expect(typeof p.supports).toBe('function');
    expect(typeof p.extract).toBe('function');
  });

  it('supports PDF, DOCX, ZIP MIME types', () => {
    const p = new MarkItDownProvider();
    expect(p.supports(makeInput({ mimeType: 'application/pdf' }))).toBe(true);
    expect(p.supports(makeInput({ mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))).toBe(true);
    expect(p.supports(makeInput({ mimeType: 'application/zip' }))).toBe(true);
  });

  it('rejects unsupported MIME types', () => {
    const p = new MarkItDownProvider();
    expect(p.supports(makeInput({ mimeType: 'image/png' }))).toBe(false);
    expect(p.supports(makeInput({ mimeType: 'text/csv' }))).toBe(false);
  });
});

// --------------------------------------------------------------------------
// Extraction
// --------------------------------------------------------------------------

describe('MarkItDownProvider — extraction', () => {
  it('produces markdown from PDF', async () => {
    const input = makeInput({ filename: 'sop_v3.pdf', mimeType: 'application/pdf' });
    const p = new MarkItDownProvider();
    const result = await p.extract(input);

    expect(result.artifactId).toBe('artifact-1');
    expect(result.markdown).toBeTruthy();
    expect(result.sourceHash).toBe(input.sha256);
    expect(result.metadata.provider).toBe('markitdown');
    cleanup(input);
  });

  it('produces markdown from DOCX', async () => {
    const input = makeInput({ filename: 'protocol.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const p = new MarkItDownProvider();
    const result = await p.extract(input);
    expect(result.markdown).toBeTruthy();
    cleanup(input);
  });

  it('preserves source hash', async () => {
    const input = makeInput({ filename: 'doc.pdf', mimeType: 'application/pdf' });
    const p = new MarkItDownProvider();
    const result = await p.extract(input);
    expect(result.sourceHash).toBe(input.sha256);
    cleanup(input);
  });

  it('extraction metadata includes timing', async () => {
    const input = makeInput({ filename: 'report.pdf', mimeType: 'application/pdf' });
    const p = new MarkItDownProvider();
    const result = await p.extract(input);
    expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.metadata.startedAt).toBeDefined();
    expect(result.metadata.completedAt).toBeDefined();
    cleanup(input);
  });

  it('fails on non-existent file', async () => {
    const p = new MarkItDownProvider();
    await expect(p.extract({
      artifactId: 'a', filePath: '/nonexistent/file.pdf', filename: 'f.pdf',
      mimeType: 'application/pdf', sizeBytes: 0, sha256: 'x',
    })).rejects.toThrow('File not found');
  });
});

// --------------------------------------------------------------------------
// Registry
// --------------------------------------------------------------------------

describe('DocumentExtractionRegistry', () => {
  it('selects the right provider for a given input', () => {
    const p = new MarkItDownProvider();
    const registry = new DocumentExtractionRegistry([p]);

    const input = makeInput({ mimeType: 'application/pdf' });
    const provider = registry.getProvider(input);
    expect(provider.name).toBe('markitdown');
    cleanup(input);
  });

  it('throws when no provider supports the input', () => {
    const p = new MarkItDownProvider();
    const registry = new DocumentExtractionRegistry([p]);

    expect(() => registry.getProvider(makeInput({ mimeType: 'image/png' }))).toThrow('No extraction provider supports');
  });
});

// --------------------------------------------------------------------------
// Service
// --------------------------------------------------------------------------

describe('DocumentExtractionService', () => {
  it('extracts and persists Layer 1', async () => {
    const input = makeInput({ filename: 'service-test.pdf', mimeType: 'application/pdf' });
    const p = new MarkItDownProvider();
    const registry = new DocumentExtractionRegistry([p]);

    let layer1Saved = false;
    let saved: any = null;

    const service = new DocumentExtractionService(registry, {
      async createLayer1(data) {
        layer1Saved = true;
        saved = data;
      },
    });

    await service.extractToLayer1(input);

    expect(layer1Saved).toBe(true);
    expect(saved.artifactId).toBe('artifact-1');
    expect(saved.provider).toBe('markitdown');
    expect(saved.sourceHash).toBe(input.sha256);
    expect(saved.markdown).toBeTruthy();
    cleanup(input);
  });
});

// --------------------------------------------------------------------------
// Boundary
// --------------------------------------------------------------------------

describe('Boundary compliance', () => {
  it('provider has no semantic methods', () => {
    const p = new MarkItDownProvider();
    expect((p as any).createClaim).toBeUndefined();
    expect((p as any).createEvidenceCandidate).toBeUndefined();
    expect((p as any).classify).toBeUndefined();
  });
});
