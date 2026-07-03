// ==========================================================================
// CsvRenderer — Published View → CSV artifact
// Sprint 9.4
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ArtifactRenderer, RenderedArtifact, ViewData } from './types.js';

const MAX_CONTENT_LENGTH = 200;

/** Escape a CSV field: wrap in quotes if it contains commas, quotes, or newlines */
function escapeCsvField(value: string): string {
  const needsQuoting = value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r');
  if (needsQuoting) {
    // Double any embedded double quotes
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Truncate content to MAX_CONTENT_LENGTH chars, appending "..." if truncated */
function truncateContent(content: string | Record<string, unknown>): string {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  if (text.length <= MAX_CONTENT_LENGTH) return text;
  return text.slice(0, MAX_CONTENT_LENGTH) + '...';
}

export class CsvRenderer implements ArtifactRenderer {
  readonly artifactType: ArtifactType = 'csv';

  render(view: ViewData): RenderedArtifact {
    const renderedAt = new Date().toISOString();

    const headers = ['section_id', 'heading', 'content_summary', 'source', 'generated_at'];
    const lines: string[] = [headers.join(',')];

    for (const section of view.sections) {
      const row = [
        escapeCsvField(section.sectionId),
        escapeCsvField(section.heading),
        escapeCsvField(truncateContent(section.content)),
        escapeCsvField(view.source),
        escapeCsvField(view.generatedAt),
      ];
      lines.push(row.join(','));
    }

    const data = lines.join('\n') + '\n';

    return {
      contentType: 'text/csv',
      data,
      artifactType: 'csv',
      renderedAt,
      viewId: view.id,
      metadata: view.metadata,
    };
  }
}
