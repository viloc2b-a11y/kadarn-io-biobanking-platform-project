// ==========================================================================
// ArtifactType — valid artifact output formats for delivery
// ==========================================================================

import { z } from 'zod';

export const ARTIFACT_TYPES = ['pdf', 'json', 'zip', 'html', 'csv'] as const;

export const ArtifactTypeSchema = z.enum(ARTIFACT_TYPES);

export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

/** Check if a string is a valid ArtifactType */
export function isArtifactType(value: string): value is ArtifactType {
  return ARTIFACT_TYPES.includes(value as ArtifactType);
}
