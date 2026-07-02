// ==========================================================================
// Feasibility Passport — Tests (Sprint 24F)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { FeasibilityPassportEngine } from '../src/feasibility-passport/engine.js'

function makeEngine(): FeasibilityPassportEngine {
  return new FeasibilityPassportEngine()
}

// --------------------------------------------------------------------------

describe('MutualReveal — initiation', () => {
  it('initiates a pending mutual reveal', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('consent:abc', 'inst:vilo', 'sponsor:pharma', 90)
    expect(reveal.reveal_id).toContain('reveal:')
    expect(reveal.status).toBe('pending')
    expect(reveal.expires_at).toBeTruthy()
  })
})

// --------------------------------------------------------------------------

describe('MutualReveal — acceptance', () => {
  it('accepts reveal and creates passport + workspace', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('consent:xyz', 'inst:v', 'sponsor:p')
    const { reveal: updated, passport, workspace } = engine.acceptReveal(reveal.reveal_id)
    expect(updated.status).toBe('revealed')
    expect(updated.revealed_at).toBeTruthy()
    expect(passport.passport_id).toContain('passport:')
    expect(passport.version).toBe(1)
    expect(workspace.workspace_id).toContain('workspace:')
    expect(workspace.sections).toHaveLength(7)
  })
})

// --------------------------------------------------------------------------

describe('MutualReveal — decline', () => {
  it('declines a reveal', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('c:1', 'i:1', 's:1')
    engine.declineReveal(reveal.reveal_id)
    expect(reveal.status).toBe('declined')
  })
})

// --------------------------------------------------------------------------

describe('MutualReveal — revocation', () => {
  it('revokes a revealed passport', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('c:2', 'i:2', 's:2')
    engine.acceptReveal(reveal.reveal_id)
    engine.revokeReveal(reveal.reveal_id)
    expect(reveal.status).toBe('revoked')
  })

  it('throws when revoking non-revealed', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('c:3', 'i:3', 's:3')
    expect(() => engine.revokeReveal(reveal.reveal_id)).toThrow()
  })
})

// --------------------------------------------------------------------------

describe('FeasibilityPassport — refresh', () => {
  it('creates new version on refresh', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('c:4', 'i:4', 's:4')
    const { passport } = engine.acceptReveal(reveal.reveal_id)
    engine.refreshPassport(passport.passport_id, [{ name: 'PBMC', status: 'healthy', evidence_count: 3, maturity: 'advanced' }], ['PBMC'], ['c:1'], 'Ready', ['Rec 1'], ['Gap 1'])
    const updated = engine.getPassport(passport.passport_id)!
    expect(updated.version).toBe(2)
    expect(updated.capabilities).toHaveLength(1)
    expect(updated.research_assets).toContain('PBMC')
  })
})

// --------------------------------------------------------------------------

describe('FeasibilityPassport — version history', () => {
  it('tracks version history', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('c:5', 'i:5', 's:5')
    const { passport } = engine.acceptReveal(reveal.reveal_id)
    engine.refreshPassport(passport.passport_id, [], [], [], '', [], [])
    engine.refreshPassport(passport.passport_id, [], [], [], '', [], [])
    const history = engine.getVersionHistory(passport.passport_id)
    expect(history).toHaveLength(3) // v1 + 2 refreshes
  })
})

// --------------------------------------------------------------------------

describe('FeasibilityPassport — export', () => {
  it('exports a snapshot without modifying the living passport', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('c:6', 'i:6', 's:6')
    const { passport } = engine.acceptReveal(reveal.reveal_id)
    const snapshot = engine.exportSnapshot(passport.passport_id)
    expect(snapshot.metadata.is_snapshot).toBe(true)
    expect(passport.metadata.is_snapshot).toBeUndefined()
  })
})

// --------------------------------------------------------------------------

describe('FeasibilityPassport — workspace', () => {
  it('creates workspace with all 7 sections', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('c:7', 'i:7', 's:7')
    const { workspace } = engine.acceptReveal(reveal.reveal_id)
    const sectionTitles = workspace.sections.map((s) => s.title)
    expect(sectionTitles).toContain('Overview')
    expect(sectionTitles).toContain('Requested Claims')
    expect(sectionTitles).toContain('Authorized Evidence')
    expect(sectionTitles).toContain('Timeline')
    expect(sectionTitles).toContain('Documents')
    expect(sectionTitles).toContain('Questions')
    expect(sectionTitles).toContain('Decision History')
  })
})

// --------------------------------------------------------------------------

describe('FeasibilityPassport — no identity before reveal', () => {
  it('no identity exposed before acceptance', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('c:8', 'inst:vilo', 'sponsor:pharma')
    // Before acceptance, status is 'pending' — no passport created yet
    expect(engine.getPassport('nonexistent')).toBeUndefined()
    // After acceptance
    engine.acceptReveal(reveal.reveal_id)
    const passport = engine.getPassport(reveal.passport_id!)
    expect(passport).toBeDefined()
  })
})

// --------------------------------------------------------------------------

describe('FeasibilityPassport — no forbidden language', () => {
  it('never uses confidence, verified, certified, score', () => {
    const engine = makeEngine()
    const reveal = engine.initiateReveal('c:9', 'i:9', 's:9')
    engine.acceptReveal(reveal.reveal_id)
    const snapshot = engine.exportSnapshot(reveal.passport_id!)
    const json = JSON.stringify(snapshot)
    expect(json).not.toContain('confidence')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('score')
  })
})
