// ==========================================================================
// DeliveryArtifact — immutable unit of delivery (KEMS-007 §A)
// ==========================================================================

import { z } from 'zod';
import type { DeliveryArtifactId } from '../value-objects/ids.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ContentHash } from '../value-objects/content-hash.js';
import { ArtifactStatusSchema, type ArtifactStatus } from '../value-objects/delivery-status.js';

// --- Type ---
export interface DeliveryArtifact {
  readonly id: DeliveryArtifactId;
  readonly type: ArtifactType;
  readonly contentHash: ContentHash;
  readonly templateId: string;
  readonly templateVersion: number;
  readonly compiledAt: string; // ISO 8601
  readonly status: ArtifactStatus;
  readonly metadata: Record<string, unknown>;
}

// --- Schema ---
export const DeliveryArtifactSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['pdf', 'json', 'zip', 'html', 'csv']),
  contentHash: z.string().regex(/^[a-fA-F0-9]{64}$/),
  templateId: z.string().uuid(),
  templateVersion: z.number().int().positive(),
  compiledAt: z.string().datetime(),
  status: ArtifactStatusSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
});

// --- Factory ---
export function createDeliveryArtifact(params: {
  id: DeliveryArtifactId;
  type: ArtifactType;
  contentHash: ContentHash;
  templateId: string;
  templateVersion: number;
  compiledAt?: string;
  status?: ArtifactStatus;
  metadata?: Record<string, unknown>;
}): DeliveryArtifact {
  const artifact: DeliveryArtifact = {
    id: params.id,
    type: params.type,
    contentHash: params.contentHash,
    templateId: params.templateId,
    templateVersion: params.templateVersion,
    compiledAt: params.compiledAt ?? new Date().toISOString(),
    status: params.status ?? 'draft',
    metadata: params.metadata ?? {},
  };
  DeliveryArtifactSchema.parse(artifact);
  return artifact;
}
