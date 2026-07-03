// ==========================================================================
// DeliveryTemplate — how an artifact is rendered (KEMS-007 §B)
// ==========================================================================

import { z } from 'zod';
import { createHash } from 'node:crypto';
import type { DeliveryTemplateId } from '../value-objects/ids.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ContentHash } from '../value-objects/content-hash.js';
import { TemplateMetadataSchema, TemplateSchemaSchema, type TemplateMetadata, type TemplateSchema } from '../templating/types.js';

// --- Type ---
export interface DeliveryTemplate {
  readonly id: DeliveryTemplateId;
  readonly name: string;
  readonly artifactType: ArtifactType;
  readonly version: number;
  readonly metadata: TemplateMetadata;
  readonly schema: TemplateSchema;
  readonly renderEngine: string;
  readonly checksum: ContentHash;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

// --- Schema ---
export const DeliveryTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  artifactType: z.enum(['pdf', 'json', 'zip', 'html', 'csv']),
  version: z.number().int().positive(),
  metadata: TemplateMetadataSchema,
  schema: TemplateSchemaSchema,
  renderEngine: z.string().min(1),
  checksum: z.string().regex(/^[a-fA-F0-9]{64}$/, 'checksum must be a 64-character hex string (SHA-256)'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// --- Checksum ---

/** Compute a deterministic SHA-256 checksum for a template's content */
export function computeTemplateChecksum(
  template: Pick<DeliveryTemplate, 'name' | 'artifactType' | 'version' | 'metadata' | 'schema'>,
): ContentHash {
  const canonical = JSON.stringify({
    name: template.name,
    artifactType: template.artifactType,
    version: template.version,
    metadata: template.metadata,
    schema: template.schema,
  });
  return createHash('sha256').update(canonical).digest('hex') as ContentHash;
}

// --- Factory ---
export function createDeliveryTemplate(params: {
  id: DeliveryTemplateId;
  name: string;
  artifactType: ArtifactType;
  version: number;
  metadata: TemplateMetadata;
  schema: TemplateSchema;
  renderEngine: string;
  checksum?: ContentHash;
  createdAt?: string;
  updatedAt?: string;
}): DeliveryTemplate {
  const now = new Date().toISOString();
  const checksum = params.checksum ?? computeTemplateChecksum({
    name: params.name,
    artifactType: params.artifactType,
    version: params.version,
    metadata: params.metadata,
    schema: params.schema,
  });
  const template: DeliveryTemplate = {
    id: params.id,
    name: params.name,
    artifactType: params.artifactType,
    version: params.version,
    metadata: params.metadata,
    schema: params.schema,
    renderEngine: params.renderEngine,
    checksum,
    createdAt: params.createdAt ?? now,
    updatedAt: params.updatedAt ?? now,
  };
  DeliveryTemplateSchema.parse(template);
  return template;
}

/** Create a new version of an existing template (version bump + checksum recalc) */
export function bumpTemplateVersion(template: DeliveryTemplate): DeliveryTemplate {
  const bumped: DeliveryTemplate = {
    ...template,
    version: template.version + 1,
    updatedAt: new Date().toISOString(),
    checksum: computeTemplateChecksum({
      name: template.name,
      artifactType: template.artifactType,
      version: template.version + 1,
      metadata: template.metadata,
      schema: template.schema,
    }),
  };
  DeliveryTemplateSchema.parse(bumped);
  return bumped;
}
