// ==========================================================================
// DeliveryPolicy — rules that govern delivery (KEMS-007 §E)
// ==========================================================================

import { z } from 'zod';
import type { DeliveryPolicyId } from '../value-objects/ids.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';

// --- Type ---
export interface DeliveryPolicy {
  readonly id: DeliveryPolicyId;
  readonly name: string;
  readonly requiredArtifactTypes: ArtifactType[];
  readonly allowedChannels: string[];
  readonly requireApproval: boolean;
  readonly maxRetries: number;
  readonly expiresAfterHours: number | null;
}

// --- Schema ---
export const DeliveryPolicySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  requiredArtifactTypes: z.array(z.enum(['pdf', 'json', 'zip', 'html', 'csv'])),
  allowedChannels: z.array(z.string().uuid()),
  requireApproval: z.boolean(),
  maxRetries: z.number().int().min(0).max(10).default(3),
  expiresAfterHours: z.number().positive().nullable().default(null),
});

// --- Factory ---
export function createDeliveryPolicy(params: {
  id: DeliveryPolicyId;
  name: string;
  requiredArtifactTypes?: ArtifactType[];
  allowedChannels?: string[];
  requireApproval?: boolean;
  maxRetries?: number;
  expiresAfterHours?: number | null;
}): DeliveryPolicy {
  const policy: DeliveryPolicy = {
    id: params.id,
    name: params.name,
    requiredArtifactTypes: params.requiredArtifactTypes ?? [],
    allowedChannels: params.allowedChannels ?? [],
    requireApproval: params.requireApproval ?? false,
    maxRetries: params.maxRetries ?? 3,
    expiresAfterHours: params.expiresAfterHours ?? null,
  };
  DeliveryPolicySchema.parse(policy);
  return policy;
}
