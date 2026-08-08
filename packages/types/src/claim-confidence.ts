// ─── dashboard-next-best-action Phase A — Claim-Level Confidence State ──
// Authority: sdd/dashboard-next-best-action design (D3), spec id 980
// ("Claim-Level Confidence State Contract"), decisions id 979 rule 3.
//
// A Confidence State is ALWAYS scoped to exactly one Claim and ALWAYS
// returned together with an explanation (`reasons`, non-empty). There is
// no `Pick`/`Partial` export of this shape and no endpoint may return
// `level` alone — a bare label is unrepresentable by this schema, not
// merely discouraged (Zod enforces `reasons.min(1)`).
//
// `level` uses the existing claim-scoped {@link ConfidenceLevel} (5
// values, confidence.ts) — NOT the capability-scoped `ConfidenceBand`.
// Per decisions-2 rule 2, the two taxonomies are never bridged here or
// anywhere else.

import { z } from 'zod'
import { ConfidenceLevel } from './confidence'
import { DerivedClaimState } from './claim-derived-state'
import { ClaimWorkflowState, ClaimEvidenceRelationshipType } from './claim'

// ─── Evidence reference ─────────────────────────────────────────────────

/** SUPPORTS / PARTIALLY_SUPPORTS / CONTRADICTS only — never REQUIRES_REVIEW/OBSOLETES here. */
export const ConfidenceEvidenceRelationship = ClaimEvidenceRelationshipType.extract([
  'SUPPORTS',
  'PARTIALLY_SUPPORTS',
  'CONTRADICTS',
])
export type ConfidenceEvidenceRelationship = z.infer<typeof ConfidenceEvidenceRelationship>

export const EvidenceFreshnessSchema = z.object({
  lastUpdatedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
})
export type EvidenceFreshness = z.infer<typeof EvidenceFreshnessSchema>

export const EvidenceRefSchema = z.object({
  evidenceId: z.string().uuid(),
  relationshipType: ConfidenceEvidenceRelationship,
  /** Human-readable provenance — where this evidence came from. */
  provenance: z.string().min(1),
  freshness: EvidenceFreshnessSchema,
})
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>

// ─── Provenance & derivation reason ─────────────────────────────────────

export const ProvenanceEntrySchema = z.object({
  /** e.g. "externally confirmed by <reference>" — see claim.ts ClaimVerificationStatus demotion. */
  source: z.string().min(1),
  recordedAt: z.string().datetime({ offset: true }),
  detail: z.string().optional().nullable(),
})
export type ProvenanceEntry = z.infer<typeof ProvenanceEntrySchema>

export const DerivationReasonSchema = z.object({
  /** Which D4 rule (or capability rule) produced this state. */
  ruleKey: z.string().min(1),
  /** The concrete inputs that made the rule fire — explainability payload. */
  inputs: z.record(z.string(), z.unknown()),
})
export type DerivationReason = z.infer<typeof DerivationReasonSchema>

// ─── Confidence freshness summary ───────────────────────────────────────

export const ConfidenceFreshnessSchema = z.object({
  newestEvidenceAt: z.string().datetime({ offset: true }).nullable(),
  oldestEvidenceAt: z.string().datetime({ offset: true }).nullable(),
  expiredCount: z.number().int().min(0),
  decayPeriodMonths: z.number().int().nullable(),
})
export type ConfidenceFreshnessSummary = z.infer<typeof ConfidenceFreshnessSchema>

// ─── ClaimConfidenceState ───────────────────────────────────────────────

export const ClaimConfidenceStateSchema = z.object({
  claimId: z.string().uuid(),
  level: ConfidenceLevel,
  derivedState: DerivedClaimState,
  workflowState: ClaimWorkflowState,
  /** SUPPORTS | PARTIALLY_SUPPORTS links. Never removed to make a state look cleaner. */
  evidenceFor: z.array(EvidenceRefSchema),
  /** CONTRADICTS links — never removed, always visible alongside evidenceFor. */
  evidenceAgainst: z.array(EvidenceRefSchema),
  provenance: z.array(ProvenanceEntrySchema),
  freshness: ConfidenceFreshnessSchema,
  /** Non-empty: a Confidence State without an explanation is invalid, not just discouraged. */
  reasons: z.array(DerivationReasonSchema).min(1),
})
export type ClaimConfidenceState = z.infer<typeof ClaimConfidenceStateSchema>
