// ==========================================================================
// Private Evidence Layer — Tests (Sprint 23E)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { PrivateEvidenceService } from '../src/private-evidence/engine.js'
import type { PrivateEvidenceRecord } from '../src/private-evidence/engine.js'

function makeService(): PrivateEvidenceService {
  return new PrivateEvidenceService()
}

function pubRecord(overrides: Partial<PrivateEvidenceRecord> = {}): PrivateEvidenceRecord {
  return {
    id: 'ev-pub', title: 'Public Study', evidence_type: 'publication',
    visibility_type: 'public_evidence', authorization_state: 'not_required',
    authorized_viewers: [], supported_capabilities: ['Plasma'], affected_gaps: [],
    derived_summary: 'Public study on plasma.', restricted_fields: [],
    source_reference: 'pubmed/123', metadata: {}, created_at: '', updated_at: '',
    ...overrides,
  }
}

function privRecord(overrides: Partial<PrivateEvidenceRecord> = {}): PrivateEvidenceRecord {
  return {
    id: 'ev-priv', title: 'Confidential SOP', evidence_type: 'sop',
    visibility_type: 'private_evidence', authorization_state: 'authorized',
    authorized_viewers: ['site_director'], supported_capabilities: ['FFPE'],
    affected_gaps: ['SOP gap'], derived_summary: 'Confidential SOP for FFPE.',
    restricted_fields: ['contents', 'author'], source_reference: 'internal/upload',
    metadata: {}, created_at: '', updated_at: '',
    ...overrides,
  }
}

// --------------------------------------------------------------------------

describe('PrivateEvidence — visibility classification', () => {
  it('classifies public evidence', () => {
    const svc = makeService()
    expect(svc.classifyVisibility('pubmed', false, false)).toBe('public_evidence')
  })

  it('classifies restricted evidence without authorization', () => {
    const svc = makeService()
    expect(svc.classifyVisibility('institution_upload', false, true)).toBe('restricted_evidence')
  })

  it('classifies private evidence with authorization', () => {
    const svc = makeService()
    expect(svc.classifyVisibility('institution_upload', true, true)).toBe('private_evidence')
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — authorization', () => {
  it('kadarn_internal can view everything', () => {
    const svc = makeService()
    expect(svc.canView(pubRecord(), 'kadarn_internal')).toBe(true)
    expect(svc.canView(privRecord(), 'kadarn_internal')).toBe(true)
  })

  it('site_director can view private but not restricted', () => {
    const svc = makeService()
    expect(svc.canView(privRecord(), 'site_director')).toBe(true)
    const restricted = privRecord({ visibility_type: 'restricted_evidence' })
    expect(svc.canView(restricted, 'site_director')).toBe(false)
  })

  it('sponsor can only view authorized evidence with sponsor in viewers', () => {
    const svc = makeService()
    const authorized = privRecord({ authorization_state: 'authorized', authorized_viewers: ['sponsor'] })
    expect(svc.canView(authorized, 'sponsor')).toBe(true)
    expect(svc.canView(privRecord(), 'sponsor')).toBe(false)
  })

  it('public cannot view private evidence', () => {
    const svc = makeService()
    expect(svc.canView(privRecord(), 'public')).toBe(false)
    expect(svc.canView(pubRecord(), 'public')).toBe(true)
  })

  it('revoked authorization blocks all except internal', () => {
    const svc = makeService()
    const revoked = privRecord({ authorization_state: 'revoked' })
    expect(svc.canView(revoked, 'kadarn_internal')).toBe(true)
    expect(svc.canView(revoked, 'site_director')).toBe(false)
  })

  it('pending_review blocks sponsors', () => {
    const svc = makeService()
    const pending = privRecord({ authorization_state: 'pending_review' })
    expect(svc.canView(pending, 'sponsor')).toBe(false)
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — masking', () => {
  it('masks restricted fields for unauthorized viewers', () => {
    const svc = makeService()
    const masked = svc.maskForRole(privRecord(), 'public')
    expect(masked.title).toBe('Private evidence')
    expect(masked.authorized_viewers).toHaveLength(0)
  })

  it('does not mask for authorized viewers', () => {
    const svc = makeService()
    const masked = svc.maskForRole(privRecord(), 'kadarn_internal')
    expect(masked.title).toBe('Confidential SOP')
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — safe summaries', () => {
  it('generates safe summary for unauthorized viewer', () => {
    const svc = makeService()
    expect(svc.safeSummary(privRecord(), 'public')).toContain('not available')
  })

  it('generates safe summary for authorized viewer', () => {
    const svc = makeService()
    expect(svc.safeSummary(privRecord(), 'kadarn_internal')).toBe('Confidential SOP for FFPE.')
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — public profile suppression', () => {
  it('suppresses private evidence in public view', () => {
    const svc = makeService()
    expect(svc.suppressForPublic(privRecord())).toBe(true)
    expect(svc.suppressForPublic(pubRecord())).toBe(false)
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — sponsor unauthorized', () => {
  it('sponsor cannot see private evidence without authorization', () => {
    const svc = makeService()
    const filtered = svc.filterForRole([pubRecord(), privRecord()], 'sponsor')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('ev-pub')
  })

  it('sponsor can see authorized private evidence', () => {
    const svc = makeService()
    const authed = privRecord({ authorization_state: 'authorized', authorized_viewers: ['sponsor'] })
    const filtered = svc.filterForRole([authed], 'sponsor')
    expect(filtered).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — report-safe references', () => {
  it('generates report-safe references hiding private details', () => {
    const svc = makeService()
    const refs = svc.reportSafeReferences([pubRecord(), privRecord()], 'sponsor')
    expect(refs).toContain('Public Study (public evidence)')
    expect(refs.some((r) => r.includes('not available'))).toBe(true)
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — explainability', () => {
  it('generates explainability-safe reference for authorized viewer', () => {
    const svc = makeService()
    const ref = svc.explainabilityReference(privRecord(), 'kadarn_internal')
    expect(ref).toContain('Confidential SOP')
    expect(ref).toContain('FFPE')
  })

  it('restricts explainability for unauthorized viewer', () => {
    const svc = makeService()
    const ref = svc.explainabilityReference(privRecord(), 'public')
    expect(ref).toContain('restricted')
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — visibility summary', () => {
  it('builds accurate visibility summary', () => {
    const svc = makeService()
    const summary = svc.buildSummary([
      pubRecord(), pubRecord({ id: 'e2' }), privRecord(),
      privRecord({ id: 'e3', visibility_type: 'restricted_evidence' }),
    ])
    expect(summary.public_count).toBe(2)
    expect(summary.private_count).toBe(1)
    expect(summary.restricted_count).toBe(1)
    expect(summary.total).toBe(4)
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — sponsor readiness', () => {
  it('only authorized private evidence affects sponsor readiness', () => {
    const svc = makeService()
    expect(svc.canAffectSponsorReadiness(privRecord())).toBe(false) // no sponsor in viewers
    const ready = privRecord({ authorization_state: 'authorized', authorized_viewers: ['sponsor'] })
    expect(svc.canAffectSponsorReadiness(ready)).toBe(true)
  })
})

// --------------------------------------------------------------------------

describe('PrivateEvidence — no forbidden language', () => {
  it('never contains PHI, PII, ZKP references in output', () => {
    const svc = makeService()
    const json = JSON.stringify(svc.filterForRole([privRecord()], 'public'))
    expect(json).not.toContain('PHI')
    expect(json).not.toContain('PII')
    expect(json).not.toContain('zero knowledge')
    expect(json).not.toContain('ZKP')
    expect(json).not.toContain('Confidential SOP') // masked
    expect(json).not.toContain('confidence')
  })
})
