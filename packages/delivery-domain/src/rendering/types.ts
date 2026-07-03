// ==========================================================================
// Rendering Types — Published View → Artifact transformation contracts
// Sprint 9.4 — Published View Rendering
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';

// --- Input: generic ViewData compatible with Phase 8 PublishedView ---

export interface ViewSection {
  sectionId: string;
  heading: string;
  content: string | Record<string, unknown>;
  order: number;
}

export interface ViewData {
  id: string;
  title: string;
  source: string; // org or claim identifier
  generatedAt: string; // ISO timestamp
  sections: ViewSection[];
  metadata: Record<string, unknown>;
}

// --- Output: rendered artifact ---

export interface RenderedArtifact {
  contentType: string; // MIME type
  data: string; // rendered content
  artifactType: ArtifactType;
  renderedAt: string; // ISO timestamp
  viewId: string;
  metadata: Record<string, unknown>;
}

// --- Renderer contract ---

export interface ArtifactRenderer {
  readonly artifactType: ArtifactType;
  render(view: ViewData): RenderedArtifact;
}
