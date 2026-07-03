// ==========================================================================
// DeliveryStatus — Artifact status state machine
// ==========================================================================

import { z } from 'zod';

export const ARTIFACT_STATUSES = ['draft', 'generated', 'queued', 'delivered', 'acknowledged', 'expired', 'revoked'] as const;

export const ArtifactStatusSchema = z.enum(ARTIFACT_STATUSES);

export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;

/**
 * Valid state transitions for DeliveryArtifact (KEMS-007 lifecycle).
 * Once delivered → acknowledged or expired.
 * Revoked and expired are terminal.
 */
const VALID_TRANSITIONS: Record<ArtifactStatus, ArtifactStatus[]> = {
  draft: ['generated'],
  generated: ['queued', 'revoked'],
  queued: ['delivered', 'revoked'],
  delivered: ['acknowledged', 'expired'],
  acknowledged: ['expired', 'revoked'],
  expired: [],   // terminal
  revoked: [],   // terminal
};

/** Check if a transition from one status to another is valid */
export function isValidTransition(from: ArtifactStatus, to: ArtifactStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get the next valid status after a successful transition.
 * Throws if the transition is invalid.
 */
export function transitionStatus(from: ArtifactStatus, to: ArtifactStatus): ArtifactStatus {
  if (!isValidTransition(from, to)) {
    throw new Error(`Invalid artifact status transition: ${from} → ${to}`);
  }
  return to;
}

/** Check if a status is terminal (no further transitions possible) */
export function isTerminalStatus(status: ArtifactStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

/** Check if a string is a valid ArtifactStatus */
export function isArtifactStatus(value: string): value is ArtifactStatus {
  return ARTIFACT_STATUSES.includes(value as ArtifactStatus);
}
