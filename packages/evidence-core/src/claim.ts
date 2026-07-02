// ==========================================================================
// Claim — Domain entity (KEMS-001 §1)
// ==========================================================================

import type { Claim, ClaimStatus } from './types.js';
import type { EvidenceClass } from './evidence-class.js';

/**
 * Create a new Claim with required fields and defaults.
 */
export function createClaim(params: {
  id: string;
  claimTypeId: string;
  name: string;
  description: string;
  organizationId: string;
  domain: string;
  validEvidenceClasses: EvidenceClass[];
  requiredEvidenceClasses: EvidenceClass[];
  decays: boolean;
  decayPeriodMonths: number | null;
  provenance: { createdByActorId: string; createdByOrganizationId: string; correlationId: string; summary: string };
}): Claim {
  const now = new Date().toISOString();
  return {
    id: params.id,
    claimTypeId: params.claimTypeId,
    name: params.name,
    description: params.description,
    organizationId: params.organizationId,
    status: 'active',
    domain: params.domain,
    decays: params.decays,
    decayPeriodMonths: params.decayPeriodMonths,
    validEvidenceClasses: params.validEvidenceClasses,
    requiredEvidenceClasses: params.requiredEvidenceClasses,
    provenance: {
      createdByActorId: params.provenance.createdByActorId,
      createdByOrganizationId: params.provenance.createdByOrganizationId,
      correlationId: params.provenance.correlationId,
      summary: params.provenance.summary,
    },
    visibility: {
      owningOrganizationId: params.organizationId,
      scope: 'site',
      authorizedSponsorIds: [],
    },
    temporal: {
      createdAt: now,
      updatedAt: now,
      decayPeriodMonths: params.decayPeriodMonths,
    },
  };
}

/**
 * Check whether a Claim is active.
 */
export function isClaimActive(claim: Claim): boolean {
  return claim.status === 'active';
}

// --------------------------------------------------------------------------
// Invariants
// --------------------------------------------------------------------------

/**
 * A Claim must be a bounded assertion, not a reputation label.
 * Returns an error message if invalid, null if valid.
 */
export function validateClaimBoundedness(claim: Claim): string | null {
  const opinionKeywords = ['excellent', 'high quality', 'best', 'reliable', 'trusted', 'superior'];
  for (const kw of opinionKeywords) {
    if (claim.description.toLowerCase().includes(kw)) {
      return `Claim "${claim.name}" contains opinion keyword "${kw}". Claims must be bounded assertions, not value judgments.`;
    }
  }
  return null;
}

/**
 * A Claim must admit at least one valid Evidence Class.
 */
export function validateClaimEvidenceClasses(claim: Claim): string | null {
  if (claim.validEvidenceClasses.length === 0) {
    return `Claim "${claim.name}" has no valid Evidence Classes. Every Claim must admit at least one.`;
  }
  return null;
}

/**
 * A Claim must be contradictable by Counter Evidence.
 */
export function validateClaimContradictable(claim: Claim): string | null {
  if (!claim.decays && claim.validEvidenceClasses.length === 0) {
    return `Claim "${claim.name}" cannot be contradicted (no decay, no evidence). Every Claim must be contradictable.`;
  }
  return null;
}
