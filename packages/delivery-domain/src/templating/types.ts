// ==========================================================================
// Template System Types — KEMS-007 §B
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { DeliveryTemplateId } from '../value-objects/ids.js';

// --- TemplateMetadata ---
export interface TemplateMetadata {
  readonly displayName: string;
  readonly description: string;
  readonly category: 'report' | 'pack' | 'passport' | 'audit';
  readonly deprecated?: boolean;
  readonly supersededBy?: string; // template id of newer version
  readonly tags?: string[];
}

// --- TemplateSlot ---
export interface TemplateSlot {
  readonly name: string;
  readonly type: 'text' | 'table' | 'chart' | 'list' | 'json' | 'markdown';
  readonly required: boolean;
  readonly defaultValue?: unknown;
  readonly description: string;
  readonly validation?: {
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly pattern?: string;
    readonly minItems?: number;
    readonly maxItems?: number;
  };
}

// --- TemplateSchema ---
export interface TemplateSchema {
  readonly version: string;
  readonly slots: TemplateSlot[];
  readonly layout?: 'single-column' | 'two-column' | 'dashboard' | 'report' | 'pack';
  readonly styles?: Record<string, unknown>;
}

// --- Zod schemas for runtime validation ---
import { z } from 'zod';

export const TemplateSlotSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'table', 'chart', 'list', 'json', 'markdown']),
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  description: z.string(),
  validation: z.object({
    minLength: z.number().int().positive().optional(),
    maxLength: z.number().int().positive().optional(),
    pattern: z.string().optional(),
    minItems: z.number().int().positive().optional(),
    maxItems: z.number().int().positive().optional(),
  }).optional(),
});

export const TemplateSchemaSchema = z.object({
  version: z.string().min(1),
  slots: z.array(TemplateSlotSchema).min(1),
  layout: z.enum(['single-column', 'two-column', 'dashboard', 'report', 'pack']).optional(),
  styles: z.record(z.string(), z.unknown()).optional(),
});

export const TemplateMetadataSchema = z.object({
  displayName: z.string().min(1),
  description: z.string(),
  category: z.enum(['report', 'pack', 'passport', 'audit']),
  deprecated: z.boolean().optional(),
  supersededBy: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});
