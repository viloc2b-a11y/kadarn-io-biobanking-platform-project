// ==========================================================================
// Slice 2 — Next Best Action Center: Unit Tests
// ==========================================================================
// Tests for the home-aggregator pure derivation functions.
// Verifies: score-free, unknown≠no, factual-only, no invented data.

import { describe, it, expect } from 'vitest'
import {
  derivePriorityToday,
  deriveReadinessBlock,
  deriveRecentChanges,
  deriveReviewQueue,
  derivePassportBlock,
  buildConfidenceExplanation,
  type PriorityTodayInput,
  type ReadinessInput,
  type RecentChangesInput,
  type ReviewQueueInput,
  type PassportBlockInput,
} from '../../apps/web/src/lib/home/home-aggregator'

// ─── Helpers ───────────────────────────────────────────────────────────────

function claim(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id as string ?? 'claim-1',
    statement: overrides.statement as string ?? 'Centrifuge available',
    status: overrides.status as string ?? 'active',
    derivedState: overrides.derivedState as string | undefined,
    confidence: overrides.confidence as string | undefined,
    evidenceCount: overrides.evidenceCount as number | undefined,
    hasExpiredEvidence: (overrides.hasExpiredEvidence as boolean) ?? false,
    hasDispute: (overrides.hasDispute as boolean) ?? false,
    institutionId: overrides.institutionId as string | undefined,
    capabilityId: overrides.capabilityId as string | undefined,
  }
}

// ─── Block 1: PRIORIDAD HOY ───────────────────────────────────────────────

describe('derivePriorityToday', () => {
  it('returns empty when no signals exist', () => {
    const result = derivePriorityToday({
      claims: [],
      evidenceSummary: null,
      staleConfidence: [],
      gaps: [],
      reviewTasks: [],
    })
    expect(result).toEqual([])
  })

  it('detects expired evidence', () => {
    const result = derivePriorityToday({
      claims: [],
      evidenceSummary: {
        totalDocuments: 10,
        documentsPresent: 5,
        documentsMissing: 2,
        documentsExpiringSoon: 1,
        documentsExpired: 2,
      },
      staleConfidence: [],
      gaps: [],
      reviewTasks: [],
    })
    const expired = result.find(r => r.id === 'prio-expired-evidence')
    expect(expired).toBeDefined()
    expect(expired!.title).toContain('2')
  })

  it('detects expiring evidence', () => {
    const result = derivePriorityToday({
      claims: [],
      evidenceSummary: {
        totalDocuments: 10,
        documentsPresent: 8,
        documentsMissing: 0,
        documentsExpiringSoon: 3,
        documentsExpired: 0,
      },
      staleConfidence: [],
      gaps: [],
      reviewTasks: [],
    })
    const expiring = result.find(r => r.id === 'prio-expiring-evidence')
    expect(expiring).toBeDefined()
    expect(expiring!.title).toContain('3')
  })

  it('detects claims without evidence', () => {
    const result = derivePriorityToday({
      claims: [
        claim({ id: 'c1', statement: 'Claim A', evidenceCount: 0 }),
        claim({ id: 'c2', statement: 'Claim B', evidenceCount: 0 }),
      ],
      evidenceSummary: null,
      staleConfidence: [],
      gaps: [],
      reviewTasks: [],
    })
    const missing = result.find(r => r.id === 'prio-missing-evidence')
    expect(missing).toBeDefined()
    expect(missing!.title).toContain('2')
  })

  it('ignores archived/withdrawn claims when checking evidence', () => {
    const result = derivePriorityToday({
      claims: [
        claim({ id: 'c1', statement: 'Active', evidenceCount: 0, status: 'active' }),
        claim({ id: 'c2', statement: 'Archived', evidenceCount: 0, status: 'archived' }),
        claim({ id: 'c3', statement: 'Withdrawn', evidenceCount: 0, status: 'withdrawn' }),
      ],
      evidenceSummary: null,
      staleConfidence: [],
      gaps: [],
      reviewTasks: [],
    })
    const missing = result.find(r => r.id === 'prio-missing-evidence')
    expect(missing).toBeDefined()
    expect(missing!.title).toContain('1') // only active claim counted
  })

  it('detects contradictions', () => {
    const result = derivePriorityToday({
      claims: [
        claim({ id: 'c1', statement: 'Disputed claim', hasDispute: true }),
      ],
      evidenceSummary: null,
      staleConfidence: [],
      gaps: [],
      reviewTasks: [],
    })
    const contradiction = result.find(r => r.id === 'prio-contradiction')
    expect(contradiction).toBeDefined()
  })

  it('detects stale confidence', () => {
    const result = derivePriorityToday({
      claims: [],
      evidenceSummary: null,
      staleConfidence: [
        { id: 's1', entityType: 'claim', entityId: 'c1', entityName: 'Test', staleReason: 'expired' },
      ],
      gaps: [],
      reviewTasks: [],
    })
    const stale = result.find(r => r.id === 'prio-stale-confidence')
    expect(stale).toBeDefined()
  })

  it('detects critical gaps', () => {
    const result = derivePriorityToday({
      claims: [],
      evidenceSummary: null,
      staleConfidence: [],
      gaps: [
        { id: 'g1', description: 'Missing SOP', severity: 'critical' },
      ],
      reviewTasks: [],
    })
    const gaps = result.find(r => r.id === 'prio-critical-gaps')
    expect(gaps).toBeDefined()
  })

  it('non-critical gaps do not trigger priority', () => {
    const result = derivePriorityToday({
      claims: [],
      evidenceSummary: null,
      staleConfidence: [],
      gaps: [
        { id: 'g1', description: 'Minor gap', severity: 'low' },
      ],
      reviewTasks: [],
    })
    const gaps = result.find(r => r.id === 'prio-critical-gaps')
    expect(gaps).toBeUndefined()
  })

  it('detects pending reviews', () => {
    const result = derivePriorityToday({
      claims: [],
      evidenceSummary: null,
      staleConfidence: [],
      gaps: [],
      reviewTasks: [
        { id: 'r1', title: 'Review SOP', status: 'pending', resourceType: 'evidence', resourceId: 'e1', createdAt: '2026-01-01' },
        { id: 'r2', title: 'Completed SOP', status: 'completed', resourceType: 'evidence', resourceId: 'e2', createdAt: '2026-01-01' },
      ],
    })
    const reviews = result.find(r => r.id === 'prio-pending-reviews')
    expect(reviews).toBeDefined()
    expect(reviews!.title).toContain('1') // only pending, not completed
  })
})

// ─── Block 2: READINESS ────────────────────────────────────────────────────

describe('deriveReadinessBlock', () => {
  it('returns zeroed structure for empty input', () => {
    const result = deriveReadinessBlock({
      claims: [],
      capabilities: [],
      evidenceSummary: null,
    })
    expect(result.claimsByStatus.supported).toBe(0)
    expect(result.claimsByStatus.declared).toBe(0)
    expect(result.claimsByStatus.unknown).toBe(0)
    expect(result.claimsByStatus.disputed).toBe(0)
  })

  it('classifies substantiated claims as supported', () => {
    const result = deriveReadinessBlock({
      claims: [
        claim({ id: 'c1', derivedState: 'substantiated', evidenceCount: 3, confidence: 'High' }),
      ],
      capabilities: [],
      evidenceSummary: null,
    })
    expect(result.claimsByStatus.supported).toBe(1)
  })

  it('classifies unsubstantiated claims as declared', () => {
    const result = deriveReadinessBlock({
      claims: [
        claim({ id: 'c1', derivedState: 'unsubstantiated', evidenceCount: 0 }),
      ],
      capabilities: [],
      evidenceSummary: null,
    })
    expect(result.claimsByStatus.declared).toBe(1)
  })

  it('classifies stale/expired claims correctly', () => {
    const result = deriveReadinessBlock({
      claims: [
        claim({ id: 'c1', derivedState: 'stale', hasExpiredEvidence: true }),
      ],
      capabilities: [],
      evidenceSummary: null,
    })
    expect(result.claimsByStatus.staleExpired).toBe(1)
  })

  it('classifies disputed claims', () => {
    const result = deriveReadinessBlock({
      claims: [
        claim({ id: 'c1', derivedState: 'disputed', hasDispute: true }),
      ],
      capabilities: [],
      evidenceSummary: null,
    })
    expect(result.claimsByStatus.disputed).toBe(1)
  })

  it('never converts unknown to no', () => {
    const result = deriveReadinessBlock({
      claims: [
        claim({ id: 'c1', derivedState: 'unknown' }),
      ],
      capabilities: [],
      evidenceSummary: null,
    })
    // unknown goes to unknown bucket, never to "not supported" or "no"
    expect(result.claimsByStatus.unknown).toBe(1)
    expect(result.claimsByStatus.supported).toBe(0)
    expect(result.claimsByStatus.declared).toBe(0)
  })

  it('derives evidence freshness from summary', () => {
    const result = deriveReadinessBlock({
      claims: [],
      capabilities: [],
      evidenceSummary: {
        totalDocuments: 20,
        documentsPresent: 12,
        documentsMissing: 5,
        documentsExpiringSoon: 3,
        documentsExpired: 2,
      },
    })
    expect(result.evidenceFreshness.active).toBe(12)
    expect(result.evidenceFreshness.expiringSoon).toBe(3)
    expect(result.evidenceFreshness.expired).toBe(2)
  })

  it('groups by capability — per-capability, never institutional rollout', () => {
    const result = deriveReadinessBlock({
      claims: [
        claim({ id: 'c1', capabilityId: 'biobank', derivedState: 'substantiated', evidenceCount: 3 }),
        claim({ id: 'c2', capabilityId: 'biobank', evidenceCount: 0 }),
        claim({ id: 'c3', capabilityId: 'lab', derivedState: 'substantiated', evidenceCount: 1 }),
      ],
      capabilities: [{ id: 'biobank', name: 'Biobank' }, { id: 'lab', name: 'Lab' }],
      evidenceSummary: null,
    })
    expect(result.capabilityCoverage).toHaveLength(2)
    const biobank = result.capabilityCoverage.find(c => c.name === 'biobank' || c.name === 'Biobank')
    expect(biobank).toBeDefined()
    // 1 supported, 1 declared (without evidence), 0 unknown
    if (biobank) {
      expect(biobank.supportedClaims + biobank.declaredClaims + biobank.unknownClaims).toBe(2)
    }
  })
})

// ─── Block 3: CAMBIOS RECIENTES ────────────────────────────────────────────

describe('deriveRecentChanges', () => {
  it('returns empty for no data', () => {
    const result = deriveRecentChanges({ claims: [], events: [] })
    expect(result).toEqual([])
  })

  it('includes events', () => {
    const result = deriveRecentChanges({
      claims: [],
      events: [{
        id: 'e1',
        action: 'evidence_upload',
        resourceType: 'evidence',
        resourceId: 'ev-1',
        summary: 'New SOP uploaded',
        createdAt: '2026-08-01T00:00:00Z',
      }],
    })
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('new_evidence')
  })

  it('supplements from claims state', () => {
    const result = deriveRecentChanges({
      claims: [
        claim({ id: 'c1', statement: 'Modified claim', status: 'submitted' }),
      ],
      events: [],
    })
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('deduplicates claims that are also in events', () => {
    const result = deriveRecentChanges({
      claims: [
        claim({ id: 'c1', statement: 'Same claim', status: 'modified' }),
      ],
      events: [{
        id: 'e1',
        action: 'claim_modified',
        resourceType: 'claim',
        resourceId: 'c1',
        summary: 'Same claim modified',
        createdAt: '2026-08-01T00:00:00Z',
      }],
    })
    // c1 should appear once, not twice
    const c1Entries = result.filter(r => r.entityId === 'c1')
    expect(c1Entries.length).toBe(1)
  })

  it('limits to 8 items', () => {
    const events = Array.from({ length: 15 }, (_, i) => ({
      id: `e${i}`,
      action: 'test',
      resourceType: 'claim',
      resourceId: `c${i}`,
      summary: `Event ${i}`,
      createdAt: `2026-08-0${Math.min(9, i + 1)}T00:00:00Z`,
    }))
    const result = deriveRecentChanges({ claims: [], events })
    expect(result.length).toBeLessThanOrEqual(8)
  })
})

// ─── Block 4: COLA DE REVISIÓN ────────────────────────────────────────────

describe('deriveReviewQueue', () => {
  it('returns empty for no tasks', () => {
    const result = deriveReviewQueue({ reviewTasks: [], claims: [] })
    expect(result).toEqual([])
  })

  it('includes pending review tasks', () => {
    const result = deriveReviewQueue({
      reviewTasks: [
        { id: 'r1', title: 'Review claim', status: 'pending', resourceType: 'claim', resourceId: 'c1', createdAt: '2026-01-01' },
      ],
      claims: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('claim_under_review')
  })

  it('excludes completed reviews', () => {
    const result = deriveReviewQueue({
      reviewTasks: [
        { id: 'r1', title: 'Done', status: 'completed', resourceType: 'claim', resourceId: 'c1', createdAt: '2026-01-01' },
      ],
      claims: [],
    })
    expect(result).toHaveLength(0)
  })

  it('includes claims with disputes', () => {
    const result = deriveReviewQueue({
      reviewTasks: [],
      claims: [
        claim({ id: 'c1', statement: 'Disputed', hasDispute: true }),
      ],
    })
    expect(result.length).toBeGreaterThanOrEqual(1)
    const dispute = result.find(r => r.kind === 'dispute')
    expect(dispute).toBeDefined()
  })
})

// ─── Block 5: PASSPORT ─────────────────────────────────────────────────────

describe('derivePassportBlock', () => {
  it('reports identity incomplete when no completeness data', () => {
    const result = derivePassportBlock({
      institutionName: 'Test',
      institutionId: 'org-1',
      completeness: null,
      claims: [],
      evidenceSummary: null,
      passportGeneratedAt: null,
      gaps: [],
    })
    expect(result.identityComplete).toBe(false)
  })

  it('reports identity complete when completeness >= 70%', () => {
    const result = derivePassportBlock({
      institutionName: 'Test',
      institutionId: 'org-1',
      completeness: { overall: 0.85, missingSections: [] },
      claims: [],
      evidenceSummary: null,
      passportGeneratedAt: null,
      gaps: [],
    })
    expect(result.identityComplete).toBe(true)
  })

  it('shows pending items when claims lack evidence', () => {
    const result = derivePassportBlock({
      institutionName: 'Test',
      institutionId: 'org-1',
      completeness: null,
      claims: [
        claim({ id: 'c1', evidenceCount: 3 }),
        claim({ id: 'c2', evidenceCount: 0 }),
        claim({ id: 'c3', evidenceCount: 0 }),
      ],
      evidenceSummary: null,
      passportGeneratedAt: null,
      gaps: [],
    })
    expect(result.claimsWithSupport).toBe(1)
    expect(result.totalClaims).toBe(3)
    expect(result.pendingBeforeShare.some(p => p.includes('2'))).toBe(true)
  })

  it('derives pending from expired evidence', () => {
    const result = derivePassportBlock({
      institutionName: 'Test',
      institutionId: 'org-1',
      completeness: null,
      claims: [],
      evidenceSummary: {
        totalDocuments: 5,
        documentsPresent: 2,
        documentsMissing: 1,
        documentsExpiringSoon: 0,
        documentsExpired: 2,
      },
      passportGeneratedAt: null,
      gaps: [],
    })
    expect(result.pendingBeforeShare.some(p => p.includes('expirados'))).toBe(true)
    expect(result.pendingBeforeShare.some(p => p.includes('faltantes'))).toBe(true)
  })
})

// ─── Block 6: EXPLICABILIDAD ───────────────────────────────────────────────

describe('buildConfidenceExplanation', () => {
  it('returns "Sin evidencia" for claims with 0 evidence', () => {
    const result = buildConfidenceExplanation(claim({ evidenceCount: 0 }))
    expect(result.level).toBe('Sin evidencia')
    expect(result.explanation).toBeTruthy()
  })

  it('returns "Reducida" for expired evidence', () => {
    const result = buildConfidenceExplanation(claim({ evidenceCount: 2, hasExpiredEvidence: true }))
    expect(result.level).toBe('Reducida')
  })

  it('returns "En disputa" for disputed claims', () => {
    const result = buildConfidenceExplanation(claim({ evidenceCount: 2, hasDispute: true }))
    expect(result.level).toBe('En disputa')
  })

  it('returns "Sustentada" for substantiated with 3+ evidence', () => {
    const result = buildConfidenceExplanation(claim({
      evidenceCount: 4,
      derivedState: 'substantiated',
    }))
    expect(result.level).toBe('Sustentada')
  })

  it('returns "Parcial" for claims with 1-2 evidence pieces', () => {
    const result = buildConfidenceExplanation(claim({ evidenceCount: 1 }))
    expect(result.level).toBe('Parcial')
  })

  it('never displays bare number without explanation', () => {
    const result = buildConfidenceExplanation(claim({ evidenceCount: 5 }))
    expect(result.explanation).toBeTruthy()
    expect(result.explanation.length).toBeGreaterThan(10)
  })
})

// ─── Score-Free Invariants ─────────────────────────────────────────────────

describe('score-free invariants', () => {
  it('PriorityToday never emits a score field', () => {
    const result = derivePriorityToday({
      claims: [claim({ evidenceCount: 0 })],
      evidenceSummary: {
        totalDocuments: 10,
        documentsPresent: 5,
        documentsMissing: 5,
        documentsExpiringSoon: 0,
        documentsExpired: 0,
      },
      staleConfidence: [],
      gaps: [],
      reviewTasks: [],
    })
    for (const item of result) {
      const str = JSON.stringify(item)
      expect(str).not.toContain('score')
      expect(str).not.toContain('Score')
      expect(str).not.toContain('overall')
      expect(str).not.toContain('rating')
      expect(str).not.toContain('tier')
      expect(str).not.toContain('rank')
    }
  })

  it('ReadinessBlock never emits a score field', () => {
    const result = deriveReadinessBlock({
      claims: [
        claim({ id: 'c1', derivedState: 'substantiated', evidenceCount: 3 }),
        claim({ id: 'c2', derivedState: 'unknown' }),
      ],
      capabilities: [],
      evidenceSummary: null,
    })
    const str = JSON.stringify(result)
    expect(str).not.toContain('score')
    expect(str).not.toContain('overall')
    expect(str).not.toContain('rating')
    expect(str).not.toContain('percent')
    expect(str).not.toContain('tier')
  })

  it('PassportBlock never emits a score field', () => {
    const result = derivePassportBlock({
      institutionName: 'Test',
      institutionId: 'org-1',
      completeness: { overall: 0.8, missingSections: [] },
      claims: [claim({ evidenceCount: 3 })],
      evidenceSummary: null,
      passportGeneratedAt: '2026-01-01',
      gaps: [],
    })
    const str = JSON.stringify(result)
    expect(str).not.toContain('score')
    expect(str).not.toContain('overall')
    expect(str).not.toContain('rating')
  })

  it('unknown is never converted to no in ReadinessBlock', () => {
    const result = deriveReadinessBlock({
      claims: [
        claim({ id: 'c1', derivedState: 'unknown' }),
        claim({ id: 'c2', derivedState: 'unknown' }),
      ],
      capabilities: [],
      evidenceSummary: null,
    })
    // unknown claims go to unknown bucket, never inflate "supported" or "declared"
    expect(result.claimsByStatus.unknown).toBe(2)
    expect(result.claimsByStatus.supported).toBe(0)
    expect(result.claimsByStatus.declared).toBe(0)
  })
})
