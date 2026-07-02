// ==========================================================================
// Evidence Core — Invariants
// ==========================================================================
// Canonical constraint validation for the Evidence Core domain model.
// Baseline AF-1.0. ADR-011.
// ==========================================================================

import { validateClaimBoundedness, validateClaimEvidenceClasses, validateClaimContradictable } from './claim.js';
import type { Claim } from './types.js';

export interface InvariantResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate all canonical invariants for a Claim.
 */
export function validateClaim(claim: Claim): InvariantResult {
  const errors: string[] = [];

  const boundedness = validateClaimBoundedness(claim);
  if (boundedness) errors.push(boundedness);

  const evidenceClasses = validateClaimEvidenceClasses(claim);
  if (evidenceClasses) errors.push(evidenceClasses);

  const contradictable = validateClaimContradictable(claim);
  if (contradictable) errors.push(contradictable);

  return { valid: errors.length === 0, errors };
}
