// ─── dashboard-next-best-action Phase A — Derived Claim State ──────────
// Authority: sdd/dashboard-next-best-action design (D4), decisions id 979/983.
//
// Pure, deterministic derivation of a Claim's factual state from its own
// `workflow_state` + linked evidence. No global/institutional aggregation:
// exactly one Claim in, one DerivedClaimState out. Thresholds come from
// columns the claims table already has (decays, decay_period_months,
// required_evidence_classes) — nothing invented, nothing numeric.
//
// `claim_status` (DB, frozen by migration 045) is NOT read or produced
// here; this operates on `ClaimWorkflowState` only.

import { z } from 'zod'
import type { ClaimWorkflowState, ClaimEvidenceRelationship } from './claim'

// ─── DerivedClaimState ──────────────────────────────────────────────────

export const DerivedClaimState = z.enum([
  'disputed',
  'archived',
  'awaiting_evidence',
  'stale',
  'partially_supported',
  'supported',
])
export type DerivedClaimState = z.infer<typeof DerivedClaimState>

// ─── Inputs ──────────────────────────────────────────────────────────────

/**
 * One evidence link contributing to the derivation, projected from
 * `claim_evidence_links` (see {@link ClaimEvidenceRelationship} in claim.ts).
 */
export interface DerivationEvidenceLink {
  relationshipType: ClaimEvidenceRelationship
  /** Evidence class this link satisfies (e.g. 'A' | 'B' | 'C' | 'D'), if any. */
  evidenceClass?: string | null
  /** ISO datetime the linked evidence item expires, if it does. */
  expiresAt?: string | null
  /** ISO datetime the link was created — used as the item's freshness marker. */
  createdAt: string
}

export interface ClaimStateInput {
  workflowState: ClaimWorkflowState
  /** Whether this claim's evidence is subject to freshness decay. */
  decays: boolean
  /** Decay window in months; only meaningful when `decays` is true. */
  decayPeriodMonths: number | null
  /** Evidence classes this claim's capability/claim type requires. */
  requiredEvidenceClasses: string[]
  evidenceLinks: DerivationEvidenceLink[]
  /** Injected clock for determinism in tests; defaults to `new Date()`. */
  now?: Date
}

// ─── Derivation ──────────────────────────────────────────────────────────

/**
 * Derives a single Claim's factual state — ordered, first match wins.
 * See design D4 for the authoritative rule table.
 */
export function deriveClaimState(input: ClaimStateInput): DerivedClaimState {
  const now = input.now ?? new Date()

  // Rule 1 — disputed
  if (input.workflowState === 'disputed') return 'disputed'

  // Rule 2 — archived
  if (input.workflowState === 'archived') return 'archived'

  const supportingLinks = input.evidenceLinks.filter(
    (link) => link.relationshipType === 'SUPPORTS' || link.relationshipType === 'PARTIALLY_SUPPORTS',
  )

  // Rule 3 — no supporting evidence at all
  if (supportingLinks.length === 0) return 'awaiting_evidence'

  // Rule 4 — stale: every supporting item expired, or decayed past its window
  const allExpired = supportingLinks.every(
    (link) => Boolean(link.expiresAt) && new Date(link.expiresAt as string) < now,
  )
  const newestSupportingAt = supportingLinks.reduce<Date | null>((latest, link) => {
    const created = new Date(link.createdAt)
    return !latest || created > latest ? created : latest
  }, null)
  const decayedStale =
    input.decays === true &&
    input.decayPeriodMonths !== null &&
    newestSupportingAt !== null &&
    monthsBetween(newestSupportingAt, now) > input.decayPeriodMonths

  if (allExpired || decayedStale) return 'stale'

  // Rule 5 — partially_supported
  const hasContradicts = input.evidenceLinks.some((link) => link.relationshipType === 'CONTRADICTS')
  const matchedClasses = new Set(
    supportingLinks
      .map((link) => link.evidenceClass)
      .filter((evidenceClass): evidenceClass is string => Boolean(evidenceClass)),
  )
  const hasUnmatchedRequiredClass = input.requiredEvidenceClasses.some(
    (evidenceClass) => !matchedClasses.has(evidenceClass),
  )
  const onlyPartialLinks = supportingLinks.every(
    (link) => link.relationshipType === 'PARTIALLY_SUPPORTS',
  )

  if (hasContradicts || hasUnmatchedRequiredClass || onlyPartialLinks) return 'partially_supported'

  // Rule 6 — supported
  return 'supported'
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}
