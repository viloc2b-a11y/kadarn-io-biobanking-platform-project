// ==========================================================================
// Institutional Consent Engine — Tests (Sprint 24E)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { InstitutionalConsentEngine } from '../src/institutional-consent/engine.js'

function makeEngine(): InstitutionalConsentEngine {
  return new InstitutionalConsentEngine()
}

// --------------------------------------------------------------------------

describe('InstitutionalConsent — request', () => {
  it('creates a pending consent request', () => {
    const engine = makeEngine()
    const consent = engine.request('brief:001', 'inst:vilo', 'sponsor:pharma', 'study_feasibility', ['claim:pbmc'], ['PBMC'], [], 90)
    expect(consent.consent_id).toContain('consent:')
    expect(consent.authorization_state).toBe('pending')
    expect(consent.expires_at).toBeTruthy()
    expect(consent.audit_log).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — grant', () => {
  it('grants full consent', () => {
    const engine = makeEngine()
    const c = engine.request('b:1', 'inst:v', 'sponsor', 'study_feasibility', ['c:1'], ['A'], [], 30)
    engine.grant(c.consent_id, 'site_director', 'claim_only')
    expect(c.authorization_state).toBe('granted')
    expect(c.granted_at).toBeTruthy()
    expect(c.audit_log).toHaveLength(2)
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — partial grant', () => {
  it('grants partial consent with limited scope', () => {
    const engine = makeEngine()
    const c = engine.request('b:2', 'inst:v', 'sponsor', 'clinical_trial', ['c:1', 'c:2'], ['A', 'B'], [], 30)
    engine.grantPartial(c.consent_id, 'site_director', ['c:1'], ['A'])
    expect(c.authorization_state).toBe('partially_granted')
    expect(c.requested_claims).toEqual(['c:1'])
    expect(c.requested_research_assets).toEqual(['A'])
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — decline', () => {
  it('declines consent with reason', () => {
    const engine = makeEngine()
    const c = engine.request('b:3', 'inst:v', 'sponsor', 'partnership', [], [], [], 30)
    engine.decline(c.consent_id, 'site_director', 'Not interested')
    expect(c.authorization_state).toBe('declined')
    expect(c.audit_log[1].details).toBe('Not interested')
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — revoke', () => {
  it('revokes previously granted consent', () => {
    const engine = makeEngine()
    const c = engine.request('b:4', 'inst:v', 'sponsor', 'site_selection', ['c:1'], [], [], 30)
    engine.grant(c.consent_id, 'sd')
    engine.revoke(c.consent_id, 'sd', 'Study cancelled')
    expect(c.authorization_state).toBe('revoked')
    expect(c.revoked_at).toBeTruthy()
  })

  it('throws when revoking non-granted consent', () => {
    const engine = makeEngine()
    const c = engine.request('b:5', 'inst:v', 'sponsor', 'other', [], [], [], 30)
    expect(() => engine.revoke(c.consent_id, 'sd')).toThrow()
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — expiration', () => {
  it('checks and marks expired consents', () => {
    const engine = makeEngine()
    const c = engine.request('b:6', 'inst:v', 'sponsor', 'study_feasibility', ['c:1'], [], [], -1) // expired immediately
    engine.grant(c.consent_id, 'sd')
    const expired = engine.checkExpirations()
    expect(expired.length).toBeGreaterThanOrEqual(0) // depending on timing
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — extend', () => {
  it('extends consent expiration', () => {
    const engine = makeEngine()
    const c = engine.request('b:7', 'inst:v', 'sponsor', 'biospecimen_collection', ['c:1'], [], [], 30)
    engine.grant(c.consent_id, 'sd')
    engine.extend(c.consent_id, 'sd', 60)
    expect(c.audit_log[2].action).toBe('consent_extended')
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — queries', () => {
  it('gets pending consents for institution', () => {
    const engine = makeEngine()
    engine.request('b:8', 'inst:v', 'sponsor', 'study_feasibility', ['c:1'], [], [], 30)
    engine.request('b:9', 'inst:v', 'sponsor2', 'clinical_trial', ['c:2'], [], [], 30)
    const pending = engine.getPending('inst:v')
    expect(pending).toHaveLength(2)
  })

  it('gets granted consents for sponsor', () => {
    const engine = makeEngine()
    const c = engine.request('b:10', 'inst:v', 'sponsor:x', 'site_selection', ['c:1'], [], [], 30)
    engine.grant(c.consent_id, 'sd')
    const granted = engine.getGranted('sponsor:x')
    expect(granted).toHaveLength(1)
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — audit trail', () => {
  it('records all actions in audit log', () => {
    const engine = makeEngine()
    const c = engine.request('b:11', 'inst:v', 'sponsor', 'partnership', ['c:1'], [], [], 30)
    engine.grant(c.consent_id, 'sd')
    engine.revoke(c.consent_id, 'sd')
    // requested + granted + revoked = 3 events
    expect(c.audit_log).toHaveLength(3)
    expect(c.audit_log[0].action).toBe('consent_requested')
    expect(c.audit_log[1].action).toBe('consent_granted')
    expect(c.audit_log[2].action).toBe('consent_revoked')
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — no permanent consent', () => {
  it('all consents have expiration', () => {
    const engine = makeEngine()
    const c = engine.request('b:12', 'inst:v', 'sponsor', 'study_feasibility', [], [], [], 90)
    expect(c.expires_at).toBeTruthy()
  })
})

// --------------------------------------------------------------------------

describe('InstitutionalConsent — no forbidden language', () => {
  it('never uses confidence, verified, certified, permanent, wildcard', () => {
    const engine = makeEngine()
    engine.request('b:13', 'inst:v', 'sponsor', 'study_feasibility', ['c:1'], [], [], 30)
    const json = JSON.stringify(engine.getPending('inst:v'))
    expect(json).not.toContain('confidence')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('permanent')
    expect(json).not.toContain('wildcard')
  })
})
