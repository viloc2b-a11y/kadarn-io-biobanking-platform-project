// ==========================================================================
// Rendering Tests — Sprint 9.4 — Published View Rendering
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  JsonRenderer,
  CsvRenderer,
  HtmlRenderer,
  PdfRenderer,
  type ViewData,
  type ViewSection,
  type ArtifactRenderer,
} from '../src/rendering/index.js';

// --- Helpers ---

function makeViewData(overrides?: Partial<ViewData>): ViewData {
  return {
    id: 'view-001',
    title: 'Institution Capability Report',
    source: 'National Biobank',
    generatedAt: '2026-07-03T10:00:00.000Z',
    sections: [
      {
        sectionId: 'sec-1',
        heading: 'Plasma Collection',
        content: 'The institution operates a state-of-the-art plasma collection facility with capacity for 5000 units per month.',
        order: 1,
      },
      {
        sectionId: 'sec-2',
        heading: 'Quality Metrics',
        content: 'Quality scores: 98.5% viability rate, 99.2% purity, 97.8% recovery.',
        order: 2,
      },
    ],
    metadata: { reportType: 'capability', version: 2 },
  };
}

function makeViewWithNestedContent(): ViewData {
  return {
    id: 'view-nested',
    title: 'Complex Report',
    source: 'Test Org',
    generatedAt: '2026-07-03T10:00:00.000Z',
    sections: [
      {
        sectionId: 'sec-nested',
        heading: 'Nested Data',
        content: { key: 'value', nested: { deep: true }, array: [1, 2, 3] },
        order: 1,
      },
    ],
    metadata: {},
  };
}

function makeEmptyView(): ViewData {
  return {
    id: 'view-empty',
    title: 'Empty Report',
    source: 'Empty Org',
    generatedAt: '2026-07-03T10:00:00.000Z',
    sections: [],
    metadata: {},
  };
}

// ==========================================================================
// JsonRenderer
// ==========================================================================

describe('JsonRenderer', () => {
  const renderer = new JsonRenderer();

  it('renders a complete ViewData to valid JSON', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    expect(parsed.id).toBe('view-001');
    expect(parsed.title).toBe('Institution Capability Report');
    expect(parsed.source).toBe('National Biobank');
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0].sectionId).toBe('sec-1');
  });

  it('output parses back to same structure (round-trip)', () => {
    const view = makeViewData();
    const result = renderer.render(view);
    const parsed = JSON.parse(result.data);
    expect(parsed.id).toBe(view.id);
    expect(parsed.title).toBe(view.title);
    expect(parsed.sections).toHaveLength(view.sections.length);
  });

  it('handles empty sections array', () => {
    const result = renderer.render(makeEmptyView());
    const parsed = JSON.parse(result.data);
    expect(parsed.sections).toEqual([]);
    expect(parsed.title).toBe('Empty Report');
  });

  it('handles nested content objects', () => {
    const result = renderer.render(makeViewWithNestedContent());
    const parsed = JSON.parse(result.data);
    expect(parsed.sections[0].content).toEqual({ key: 'value', nested: { deep: true }, array: [1, 2, 3] });
  });

  it('output matches expected structure', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    // Verify structure via partial match (excludes dynamic renderedAt)
    expect(parsed).toMatchObject({
      generatedAt: '2026-07-03T10:00:00.000Z',
      id: 'view-001',
      metadata: { reportType: 'capability', version: 2 },
      sections: [
        {
          content: 'The institution operates a state-of-the-art plasma collection facility with capacity for 5000 units per month.',
          heading: 'Plasma Collection',
          order: 1,
          sectionId: 'sec-1',
        },
        {
          content: 'Quality scores: 98.5% viability rate, 99.2% purity, 97.8% recovery.',
          heading: 'Quality Metrics',
          order: 2,
          sectionId: 'sec-2',
        },
      ],
      source: 'National Biobank',
      title: 'Institution Capability Report',
    });
    expect(parsed.renderedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('metadata fields present in output', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    expect(parsed.metadata).toEqual({ reportType: 'capability', version: 2 });
  });

  it('renderedAt is ISO timestamp', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    expect(parsed.renderedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('artifactType is json', () => {
    const result = renderer.render(makeViewData());
    expect(result.artifactType).toBe('json');
  });

  it('contentType is application/json', () => {
    const result = renderer.render(makeViewData());
    expect(result.contentType).toBe('application/json');
  });

  it('viewId matches input', () => {
    const result = renderer.render(makeViewData());
    expect(result.viewId).toBe('view-001');
  });
});

// ==========================================================================
// CsvRenderer
// ==========================================================================

describe('CsvRenderer', () => {
  const renderer = new CsvRenderer();

  it('renders sections as CSV rows', () => {
    const result = renderer.render(makeViewData());
    const lines = result.data.trim().split('\n');
    expect(lines).toHaveLength(3); // header + 2 sections
    expect(lines[0]).toBe('section_id,heading,content_summary,source,generated_at');
  });

  it('CSV has correct headers', () => {
    const result = renderer.render(makeViewData());
    const headers = result.data.split('\n')[0];
    expect(headers).toBe('section_id,heading,content_summary,source,generated_at');
  });

  it('proper escaping: commas in content → wrapped in quotes', () => {
    const view: ViewData = {
      id: 'v',
      title: 'T',
      source: 'S',
      generatedAt: '2026-07-03T10:00:00.000Z',
      sections: [{ sectionId: 's1', heading: 'H', content: 'value, with, commas', order: 1 }],
      metadata: {},
    };
    const result = renderer.render(view);
    const line = result.data.split('\n')[1];
    expect(line).toContain('"value, with, commas"');
  });

  it('proper escaping: quotes in content → doubled', () => {
    const view: ViewData = {
      id: 'v',
      title: 'T',
      source: 'S',
      generatedAt: '2026-07-03T10:00:00.000Z',
      sections: [{ sectionId: 's1', heading: 'H', content: 'say "hello"', order: 1 }],
      metadata: {},
    };
    const result = renderer.render(view);
    const line = result.data.split('\n')[1];
    expect(line).toContain('"say ""hello"""');
  });

  it('proper escaping: newlines in content → wrapped in quotes', () => {
    const view: ViewData = {
      id: 'v',
      title: 'T',
      source: 'S',
      generatedAt: '2026-07-03T10:00:00.000Z',
      sections: [{ sectionId: 's1', heading: 'H', content: 'line1\nline2', order: 1 }],
      metadata: {},
    };
    const result = renderer.render(view);
    // The CSV field with embedded newline starts with a quote
    // The field spans multiple lines in the output
    expect(result.data).toContain('"line1\nline2"');
  });

  it('content truncated to 200 chars', () => {
    const longContent = 'A'.repeat(250);
    const view: ViewData = {
      id: 'v',
      title: 'T',
      source: 'S',
      generatedAt: '2026-07-03T10:00:00.000Z',
      sections: [{ sectionId: 's1', heading: 'H', content: longContent, order: 1 }],
      metadata: {},
    };
    const result = renderer.render(view);
    const dataLine = result.data.split('\n')[1];
    // Content should be truncated to 200 + "..."
    expect(dataLine).toContain('...');
    // The truncated content is inside the CSV field
    const fieldContent = dataLine.split(',')[2];
    expect(fieldContent.length).toBeLessThanOrEqual(203 + 2); // 200 + "..." + possible quotes
  });

  it('empty sections → empty CSV with headers only', () => {
    const result = renderer.render(makeEmptyView());
    const lines = result.data.trim().split('\n');
    expect(lines).toHaveLength(1); // header only
    expect(lines[0]).toBe('section_id,heading,content_summary,source,generated_at');
  });

  it('artifactType is csv', () => {
    const result = renderer.render(makeViewData());
    expect(result.artifactType).toBe('csv');
  });

  it('contentType is text/csv', () => {
    const result = renderer.render(makeViewData());
    expect(result.contentType).toBe('text/csv');
  });

  it('handles Record content by JSON.stringify', () => {
    const result = renderer.render(makeViewWithNestedContent());
    const dataLine = result.data.split('\n')[1];
    // JSON values in CSV are quoted and inner quotes are doubled (RFC 4180)
    expect(dataLine).toContain('key');
    expect(dataLine).toContain('value');
    expect(dataLine).toContain('deep');
  });

  it('source and generatedAt are repeated per row', () => {
    const result = renderer.render(makeViewData());
    const lines = result.data.trim().split('\n');
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).toContain('National Biobank');
      expect(lines[i]).toContain('2026-07-03T10:00:00.000Z');
    }
  });
});

// ==========================================================================
// HtmlRenderer
// ==========================================================================

describe('HtmlRenderer', () => {
  const renderer = new HtmlRenderer();

  it('output is valid HTML5 document', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toContain('<!DOCTYPE html>');
    expect(result.data).toContain('<html lang="en">');
    expect(result.data).toContain('</html>');
  });

  it('DOCTYPE present', () => {
    const result = renderer.render(makeViewData());
    expect(result.data.trimStart()).toMatch(/^<!DOCTYPE html>/);
  });

  it('title in head matches view title', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toContain('<title>Institution Capability Report</title>');
  });

  it('each section rendered as <article> with <h2>', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toContain('<article>');
    expect(result.data).toContain('<h2>Plasma Collection</h2>');
    expect(result.data).toContain('<h2>Quality Metrics</h2>');
    // Two sections → two closing </article> tags
    const articleCount = (result.data.match(/<article>/g) || []).length;
    expect(articleCount).toBe(2);
  });

  it('HTML entities escaped: <script> → &lt;script&gt;', () => {
    const view: ViewData = {
      id: 'v',
      title: '<script>alert("xss")</script>',
      source: 'S',
      generatedAt: '2026-07-03T10:00:00.000Z',
      sections: [{ sectionId: 's1', heading: 'Bad <h1>', content: 'inline <div> & "quoted"', order: 1 }],
      metadata: {},
    };
    const result = renderer.render(view);
    expect(result.data).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(result.data).toContain('Bad &lt;h1&gt;');
    expect(result.data).toContain('inline &lt;div&gt; &amp; &quot;quoted&quot;');
  });

  it('header contains source and generated date', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toContain('National Biobank');
    expect(result.data).toContain('2026-07-03T10:00:00.000Z');
  });

  it('footer contains "Kadarn Delivery Engine"', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toContain('Generated by Kadarn Delivery Engine');
  });

  it('footer contains renderedAt timestamp', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toMatch(/Rendered: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });

  it('content correctly placed in <main>', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toContain('<main>');
    expect(result.data).toContain('</main>');
    // Articles should be inside main
    const mainStart = result.data.indexOf('<main>');
    const firstArticle = result.data.indexOf('<article>');
    const mainEnd = result.data.indexOf('</main>');
    expect(firstArticle).toBeGreaterThan(mainStart);
    expect(firstArticle).toBeLessThan(mainEnd);
  });

  it('no inline styles (no style="" attributes)', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).not.toMatch(/style\s*=\s*"/);
  });

  it('artifactType is html', () => {
    const result = renderer.render(makeViewData());
    expect(result.artifactType).toBe('html');
  });

  it('contentType is text/html', () => {
    const result = renderer.render(makeViewData());
    expect(result.contentType).toBe('text/html');
  });

  it('handles nested content objects as prettified JSON', () => {
    const result = renderer.render(makeViewWithNestedContent());
    // HTML renderer escapes JSON: "key" → &quot;key&quot;
    expect(result.data).toContain('&quot;key&quot;');
    expect(result.data).toContain('&quot;value&quot;');
    expect(result.data).toContain('&quot;deep&quot;');
  });

  it('handles empty sections gracefully', () => {
    const result = renderer.render(makeEmptyView());
    expect(result.data).toContain('<main>');
    expect(result.data).toContain('</main>');
    expect(result.data).not.toContain('<article>');
  });

  it('sections are sorted by order', () => {
    const view: ViewData = {
      id: 'v',
      title: 'T',
      source: 'S',
      generatedAt: '2026-07-03T10:00:00.000Z',
      sections: [
        { sectionId: 's2', heading: 'Second', content: 'b', order: 2 },
        { sectionId: 's1', heading: 'First', content: 'a', order: 1 },
      ],
      metadata: {},
    };
    const result = renderer.render(view);
    const posFirst = result.data.indexOf('<h2>First</h2>');
    const posSecond = result.data.indexOf('<h2>Second</h2>');
    expect(posFirst).toBeLessThan(posSecond);
  });

  it('meta charset is UTF-8', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toContain('<meta charset="UTF-8">');
  });

  it('viewport meta is present', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toContain('viewport');
  });

  it('header uses <h1> for title', () => {
    const result = renderer.render(makeViewData());
    expect(result.data).toContain('<h1>Institution Capability Report</h1>');
  });
});

// ==========================================================================
// PdfRenderer
// ==========================================================================

describe('PdfRenderer', () => {
  const renderer = new PdfRenderer();

  it('output is valid PDF representation JSON', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    expect(parsed.format).toBe('pdf-representation');
  });

  it('has pages array', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    expect(Array.isArray(parsed.pages)).toBe(true);
    expect(parsed.pages.length).toBeGreaterThan(0);
  });

  it('content split across pages', () => {
    // Create a view with enough content to span multiple pages
    const longContent = 'A'.repeat(5000);
    const view: ViewData = {
      id: 'v',
      title: 'Large Report',
      source: 'Org',
      generatedAt: '2026-07-03T10:00:00.000Z',
      sections: [{ sectionId: 's1', heading: 'Long Section', content: longContent, order: 1 }],
      metadata: {},
    };
    const result = renderer.render(view);
    const parsed = JSON.parse(result.data);
    // Should span at least 2 pages (5000 chars > 3000/page)
    expect(parsed.totalPages).toBeGreaterThanOrEqual(2);
  });

  it('title preserved', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    expect(parsed.title).toBe('Institution Capability Report');
  });

  it('source preserved', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    expect(parsed.source).toBe('National Biobank');
  });

  it('section boundaries respected in pagination', () => {
    // Two sections that together fit on one page
    const view = makeViewData();
    const result = renderer.render(view);
    const parsed = JSON.parse(result.data);
    // Both sections should be on page 1 since they fit
    expect(parsed.pages[0].elements.length).toBeGreaterThanOrEqual(2);
    // Check that the sections are present
    const headings = parsed.pages[0].elements.filter((e: { type: string }) => e.type === 'heading');
    expect(headings).toHaveLength(2);
  });

  it('total pages calculated correctly', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    expect(parsed.totalPages).toBe(parsed.pages.length);
  });

  it('artifactType is pdf', () => {
    const result = renderer.render(makeViewData());
    expect(result.artifactType).toBe('pdf');
  });

  it('contentType is application/pdf', () => {
    const result = renderer.render(makeViewData());
    expect(result.contentType).toBe('application/pdf');
  });

  it('renderedAt and generatedAt are ISO timestamps', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    expect(parsed.renderedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(parsed.generatedAt).toBe('2026-07-03T10:00:00.000Z');
  });

  it('empty view produces single empty page', () => {
    const result = renderer.render(makeEmptyView());
    const parsed = JSON.parse(result.data);
    expect(parsed.pages).toHaveLength(1);
    expect(parsed.pages[0].elements).toEqual([]);
  });

  it('heading elements have type heading and include sectionId', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    const headingEls = parsed.pages[0].elements.filter((e: { type: string }) => e.type === 'heading');
    expect(headingEls.length).toBeGreaterThan(0);
    expect(headingEls[0].sectionId).toBeDefined();
  });

  it('text elements include sectionId', () => {
    const result = renderer.render(makeViewData());
    const parsed = JSON.parse(result.data);
    const textEls = parsed.pages[0].elements.filter((e: { type: string }) => e.type === 'text');
    expect(textEls.length).toBeGreaterThan(0);
    expect(textEls[0].sectionId).toBeDefined();
  });

  it('handles Record content by JSON.stringify', () => {
    const result = renderer.render(makeViewWithNestedContent());
    const parsed = JSON.parse(result.data);
    const textEls = parsed.pages[0].elements.filter((e: { type: string }) => e.type === 'text');
    expect(textEls[0].content).toContain('"key"');
  });
});

// ==========================================================================
// Renderer contract tests (all renderers implement ArtifactRenderer)
// ==========================================================================

describe('Renderer contract', () => {
  const renderers: ArtifactRenderer[] = [new JsonRenderer(), new CsvRenderer(), new HtmlRenderer(), new PdfRenderer()];

  it('all 4 renderers implement ArtifactRenderer interface', () => {
    for (const r of renderers) {
      expect(r).toHaveProperty('artifactType');
      expect(r).toHaveProperty('render');
      expect(typeof r.render).toBe('function');
    }
  });

  it('each renderer declares correct artifactType', () => {
    expect(new JsonRenderer().artifactType).toBe('json');
    expect(new CsvRenderer().artifactType).toBe('csv');
    expect(new HtmlRenderer().artifactType).toBe('html');
    expect(new PdfRenderer().artifactType).toBe('pdf');
  });

  it('each renderer produces RenderedArtifact with required fields', () => {
    const view = makeViewData();
    for (const r of renderers) {
      const result = r.render(view);
      expect(result).toHaveProperty('contentType');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('artifactType');
      expect(result).toHaveProperty('renderedAt');
      expect(result).toHaveProperty('viewId');
      expect(result).toHaveProperty('metadata');
    }
  });

  it('each renderer sets viewId from input', () => {
    const view = makeViewData();
    for (const r of renderers) {
      const result = r.render(view);
      expect(result.viewId).toBe(view.id);
    }
  });

  it('each renderer sets renderedAt as ISO timestamp', () => {
    const view = makeViewData();
    for (const r of renderers) {
      const result = r.render(view);
      expect(result.renderedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    }
  });

  it('factory-like getRenderer returns correct type', () => {
    function getRenderer(artifactType: 'json' | 'csv' | 'html' | 'pdf'): ArtifactRenderer {
      switch (artifactType) {
        case 'json':
          return new JsonRenderer();
        case 'csv':
          return new CsvRenderer();
        case 'html':
          return new HtmlRenderer();
        case 'pdf':
          return new PdfRenderer();
      }
    }

    expect(getRenderer('json').artifactType).toBe('json');
    expect(getRenderer('csv').artifactType).toBe('csv');
    expect(getRenderer('html').artifactType).toBe('html');
    expect(getRenderer('pdf').artifactType).toBe('pdf');
  });

  it('all renderers preserve metadata from input', () => {
    const view = makeViewData();
    for (const r of renderers) {
      const result = r.render(view);
      expect(result.metadata).toEqual(view.metadata);
    }
  });
});
