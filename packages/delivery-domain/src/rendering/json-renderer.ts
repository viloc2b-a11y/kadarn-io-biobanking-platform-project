// ==========================================================================
// JsonRenderer — Published View → JSON artifact
// Sprint 9.4
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ArtifactRenderer, RenderedArtifact, ViewData } from './types.js';

export class JsonRenderer implements ArtifactRenderer {
  readonly artifactType: ArtifactType = 'json';

  render(view: ViewData): RenderedArtifact {
    const renderedAt = new Date().toISOString();

    const payload = {
      id: view.id,
      title: view.title,
      source: view.source,
      generatedAt: view.generatedAt,
      renderedAt,
      sections: view.sections.map((s) => ({
        sectionId: s.sectionId,
        heading: s.heading,
        content: s.content,
        order: s.order,
      })),
      metadata: view.metadata,
    };

    const data = JSON.stringify(payload, null, 2);

    return {
      contentType: 'application/json',
      data,
      artifactType: 'json',
      renderedAt,
      viewId: view.id,
      metadata: view.metadata,
    };
  }
}
