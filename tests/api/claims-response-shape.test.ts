// ==========================================================================
// Slice 3 — Claims API Response Shape Verification
// ==========================================================================
// Verifies that the enriched claim response includes all fields Home expects.
// No Supabase dependency — tests the shape contract only.

import { describe, it, expect } from 'vitest'
import { deriveClaimState } from '@kadarn/types'
import type { ClaimWorkflowState, DerivationEvidenceLink } from '@kadarn/types'

// ─── Simulate the API's enrichment logic ────────────────────────────────────

function enrichClaim(raw: {
  id: string
  question_text?: string
  answer_value?: string
  workflow_state?: string
  confidence_level?: string
  decays?: boolean
  decay_period_months?: number | null
  required_evidence_classes?: string[]
  institution_id?: string
  capability_id?: string | null
  category?: string | null
  created_at?: string
  updated_at?: string
}, links: DerivationEvidenceLink[], disputedIds: Set<string>) {
  const derivedState = deriveClaimState({
    workflowState: (raw.workflow_state ?? 'draft') as ClaimWorkflowState,
    decays: Boolean(raw.decays),
    decayPeriodMonths: raw.decay_period_months ?? null,
    requiredEvidenceClasses: raw.required_evidence_classes ?? [],
    evidenceLinks: links,
  })

  const now = new Date()
  const hasExpiredEvidence = links.some(
    (l) => l.expiresAt && new Date(l.expiresAt) < now,
  )

  return {
    id: raw.id,
    statement: raw.question_text || raw.answer_value || 'Untitled claim',
    status: raw.workflow_state ?? 'draft',
    derivedState,
    confidence: raw.confidence_level ?? null,
    evidenceCount: links.length,
    hasExpiredEvidence,
    hasDispute: disputedIds.has(raw.id),
    institutionId: raw.institution_id,
    capabilityId: raw.capability_id ?? null,
    category: raw.category ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('claims API response shape (Slice 3 enrichment)', () => {
  const baseClaim = {
    id: 'claim-1',
    question_text: 'Does the site have a centrifuge?',
    answer_value: 'Yes, Sorvall RC-6 Plus',
    workflow_state: 'draft',
    confidence_level: 'declared',
    decays: false,
    decay_period_months: null,
    required_evidence_classes: [],
    institution_id: 'org-1',
    capability_id: 'cap-1',
    category: 'equipment',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  it('enriched response includes all ClaimSummary fields', () => {
    const result = enrichClaim(baseClaim, [], new Set())
    expect(result.id).toBe('claim-1')
    expect(result.statement).toBe('Does the site have a centrifuge?')
    expect(result.status).toBe('draft')
    expect(result.derivedState).toBeDefined()
    expect(result.confidence).toBe('declared')
    expect(result.evidenceCount).toBe(0)
    expect(result.hasExpiredEvidence).toBe(false)
    expect(result.hasDispute).toBe(false)
    expect(result.institutionId).toBe('org-1')
    expect(result.capabilityId).toBe('cap-1')
    expect(result.category).toBe('equipment')
    expect(result.createdAt).toBeTruthy()
    expect(result.updatedAt).toBeTruthy()
  })

  it('derivedState is "awaiting_evidence" when no evidence links', () => {
    const result = enrichClaim(baseClaim, [], new Set())
    expect(result.derivedState).toBe('awaiting_evidence')
  })

  it('derivedState is "supported" with SUPPORTS links covering required classes', () => {
    const link: DerivationEvidenceLink = {
      relationshipType: 'SUPPORTS',
      evidenceClass: 'A',
      createdAt: '2026-01-01T00:00:00Z',
    }
    const claim = { ...baseClaim, required_evidence_classes: ['A'] }
    const result = enrichClaim(claim, [link], new Set())
    expect(result.derivedState).toBe('supported')
    expect(result.evidenceCount).toBe(1)
  })

  it('hasExpiredEvidence is true when a link has expired', () => {
    const expiredLink: DerivationEvidenceLink = {
      relationshipType: 'SUPPORTS',
      evidenceClass: 'A',
      expiresAt: '2020-01-01T00:00:00Z', // definitely expired
      createdAt: '2019-01-01T00:00:00Z',
    }
    const result = enrichClaim(baseClaim, [expiredLink], new Set())
    expect(result.hasExpiredEvidence).toBe(true)
    expect(result.derivedState).toBe('stale')
  })

  it('hasDispute is true when claim is in disputedIds', () => {
    const result = enrichClaim(baseClaim, [], new Set(['claim-1']))
    expect(result.hasDispute).toBe(true)
  })

  it('derivedState is "disputed" when workflow_state is disputed', () => {
    const claim = { ...baseClaim, workflow_state: 'disputed' }
    const result = enrichClaim(claim, [], new Set())
    expect(result.derivedState).toBe('disputed')
  })

  it('evidenceCount matches link count, never inferred from absence', () => {
    const links: DerivationEvidenceLink[] = [
      { relationshipType: 'SUPPORTS', evidenceClass: 'A', createdAt: '2026-01-01T00:00:00Z' },
      { relationshipType: 'SUPPORTS', evidenceClass: 'B', createdAt: '2026-01-02T00:00:00Z' },
    ]
    const claim = { ...baseClaim, required_evidence_classes: ['A', 'B'] }
    const result = enrichClaim(claim, links, new Set())
    expect(result.evidenceCount).toBe(2)
  })

  it('unknown ≠ no — awaiting_evidence is not "no capability"', () => {
    const result = enrichClaim(baseClaim, [], new Set())
    expect(result.derivedState).toBe('awaiting_evidence')
    expect(result.derivedState).not.toBe('unsupported')
    expect(result.derivedState).not.toBe('no')
  })

  it('response never includes institution-level aggregate', () => {
    const result = enrichClaim(baseClaim, [], new Set())
    const str = JSON.stringify(result)
    expect(str).not.toContain('overallScore')
    expect(str).not.toContain('healthScore')
    expect(str).not.toContain('readinessScore')
    expect(str).not.toContain('institutionScore')
  })

  it('fallback statement uses answer_value when question_text is empty', () => {
    const claim = { ...baseClaim, question_text: '', answer_value: 'Yes' }
    const result = enrichClaim(claim, [], new Set())
    expect(result.statement).toBe('Yes')
  })

  it('fallback statement is "Untitled claim" when both are empty', () => {
    const claim = { ...baseClaim, question_text: '', answer_value: '' }
    const result = enrichClaim(claim, [], new Set())
    expect(result.statement).toBe('Untitled claim')
  })
})
