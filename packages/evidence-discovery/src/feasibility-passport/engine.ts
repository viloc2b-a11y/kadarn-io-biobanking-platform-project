// ==========================================================================
// Feasibility Passport — Types + Engine (Sprint 24F)
// ==========================================================================
// Mutual Reveal + Living Feasibility Passport.
// Completes the sponsor-site interaction lifecycle.
// Identity revealed only after mutual institutional consent.
// Passport is a living object — not a static PDF.
// ==========================================================================

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type RevealStatus = 'pending' | 'revealed' | 'declined' | 'expired' | 'revoked'

export interface MutualReveal {
  reveal_id: string
  consent_id: string
  institution_id: string
  sponsor_id: string
  status: RevealStatus
  revealed_at: string | null
  expires_at: string | null
  passport_id: string | null
  workspace_id: string | null
  metadata: Record<string, unknown>
}

export interface FeasibilityPassport {
  passport_id: string
  institution_id: string
  version: number
  generated_at: string
  last_updated: string
  visibility_scope: string
  capabilities: PassportCapability[]
  research_assets: string[]
  supported_claims: string[]
  authorized_private_evidence: string[]
  readiness_summary: string
  recommendations: string[]
  known_gaps: string[]
  certifications: string[]
  operational_summary: string
  governance_reference: string
  metadata: Record<string, unknown>
}

export interface PassportCapability {
  name: string
  status: string
  evidence_count: number
  maturity: string
}

export interface CollaborationWorkspace {
  workspace_id: string
  passport_id: string
  institution_id: string
  sponsor_id: string
  sections: WorkspaceSection[]
  created_at: string
}

export interface WorkspaceSection {
  id: string
  title: string
  content_type: 'passport' | 'claims' | 'evidence' | 'timeline' | 'documents' | 'questions' | 'decisions'
  data: Record<string, unknown>
}

// --------------------------------------------------------------------------
// FeasibilityPassportEngine
// --------------------------------------------------------------------------

export class FeasibilityPassportEngine {
  private reveals = new Map<string, MutualReveal>()
  private passports = new Map<string, FeasibilityPassport>()
  private versionHistory = new Map<string, FeasibilityPassport[]>()
  private workspaces = new Map<string, CollaborationWorkspace>()

  /**
   * Initiate mutual reveal after consent is granted.
   */
  initiateReveal(
    consentId: string,
    institutionId: string,
    sponsorId: string,
    durationDays = 90,
  ): MutualReveal {
    const now = new Date().toISOString()
    const revealId = `reveal:${consentId.slice(-8)}:${Date.now().toString(36)}`

    const reveal: MutualReveal = {
      reveal_id: revealId,
      consent_id: consentId,
      institution_id: institutionId,
      sponsor_id: sponsorId,
      status: 'pending',
      revealed_at: null,
      expires_at: new Date(Date.now() + durationDays * 86400000).toISOString(),
      passport_id: null,
      workspace_id: null,
      metadata: {},
    }

    this.reveals.set(revealId, reveal)
    return reveal
  }

  /**
   * Accept mutual reveal and create passport.
   */
  acceptReveal(revealId: string): { reveal: MutualReveal; passport: FeasibilityPassport; workspace: CollaborationWorkspace } {
    const reveal = this.reveals.get(revealId)
    if (!reveal) throw new Error(`Reveal not found: ${revealId}`)

    const now = new Date().toISOString()
    reveal.status = 'revealed'
    reveal.revealed_at = now

    // Create Feasibility Passport
    const passportId = `passport:${reveal.institution_id.slice(-8)}:v1`
    const passport = this.createPassport(passportId, reveal.institution_id)
    reveal.passport_id = passportId

    // Create Collaboration Workspace
    const workspaceId = `workspace:${revealId.slice(-8)}`
    const workspace = this.createWorkspace(workspaceId, passportId, reveal.institution_id, reveal.sponsor_id)
    reveal.workspace_id = workspaceId

    return { reveal, passport, workspace }
  }

  /**
   * Decline mutual reveal.
   */
  declineReveal(revealId: string): MutualReveal {
    const reveal = this.reveals.get(revealId)
    if (!reveal) throw new Error(`Reveal not found: ${revealId}`)
    reveal.status = 'declined'
    return reveal
  }

  /**
   * Revoke a revealed passport.
   */
  revokeReveal(revealId: string): MutualReveal {
    const reveal = this.reveals.get(revealId)
    if (!reveal) throw new Error(`Reveal not found: ${revealId}`)
    if (reveal.status !== 'revealed') throw new Error('Only revealed passports can be revoked')
    reveal.status = 'revoked'
    return reveal
  }

  /**
   * Create a living Feasibility Passport.
   */
  private createPassport(passportId: string, institutionId: string): FeasibilityPassport {
    const now = new Date().toISOString()
    const passport: FeasibilityPassport = {
      passport_id: passportId,
      institution_id: institutionId,
      version: 1,
      generated_at: now,
      last_updated: now,
      visibility_scope: 'passport',
      capabilities: [],
      research_assets: [],
      supported_claims: [],
      authorized_private_evidence: [],
      readiness_summary: 'Readiness assessment available in passport.',
      recommendations: [],
      known_gaps: [],
      certifications: [],
      operational_summary: 'Operational details available upon full collaboration.',
      governance_reference: 'KEMS-001, KEMS-002',
      metadata: {},
    }

    this.passports.set(passportId, passport)
    this.versionHistory.set(passportId, [{ ...passport }])
    return passport
  }

  /**
   * Refresh passport with updated data from canonical engines.
   * This is what makes it "living" — not static.
   */
  refreshPassport(
    passportId: string,
    capabilities: PassportCapability[],
    assets: string[],
    claims: string[],
    readiness: string,
    recommendations: string[],
    gaps: string[],
  ): FeasibilityPassport {
    const passport = this.passports.get(passportId)
    if (!passport) throw new Error(`Passport not found: ${passportId}`)

    const now = new Date().toISOString()
    passport.version += 1
    passport.last_updated = now
    passport.capabilities = capabilities
    passport.research_assets = assets
    passport.supported_claims = claims
    passport.readiness_summary = readiness
    passport.recommendations = recommendations
    passport.known_gaps = gaps

    // Version history
    const history = this.versionHistory.get(passportId) ?? []
    history.push({ ...passport, version: passport.version })
    this.versionHistory.set(passportId, history)

    return passport
  }

  /**
   * Export a snapshot of the passport (not the living object).
   */
  exportSnapshot(passportId: string): FeasibilityPassport {
    const passport = this.passports.get(passportId)
    if (!passport) throw new Error(`Passport not found: ${passportId}`)
    return { ...passport, metadata: { ...passport.metadata, exported_at: new Date().toISOString(), is_snapshot: true } }
  }

  /**
   * Create a Collaboration Workspace shell.
   */
  private createWorkspace(workspaceId: string, passportId: string, institutionId: string, sponsorId: string): CollaborationWorkspace {
    const workspace: CollaborationWorkspace = {
      workspace_id: workspaceId,
      passport_id: passportId,
      institution_id: institutionId,
      sponsor_id: sponsorId,
      sections: [
        { id: 'overview', title: 'Overview', content_type: 'passport', data: {} },
        { id: 'claims', title: 'Requested Claims', content_type: 'claims', data: {} },
        { id: 'evidence', title: 'Authorized Evidence', content_type: 'evidence', data: {} },
        { id: 'timeline', title: 'Timeline', content_type: 'timeline', data: {} },
        { id: 'documents', title: 'Documents', content_type: 'documents', data: {} },
        { id: 'questions', title: 'Questions', content_type: 'questions', data: {} },
        { id: 'decisions', title: 'Decision History', content_type: 'decisions', data: {} },
      ],
      created_at: new Date().toISOString(),
    }
    this.workspaces.set(workspaceId, workspace)
    return workspace
  }

  getReveal(revealId: string): MutualReveal | undefined {
    return this.reveals.get(revealId)
  }

  getPassport(passportId: string): FeasibilityPassport | undefined {
    return this.passports.get(passportId)
  }

  getVersionHistory(passportId: string): FeasibilityPassport[] {
    return this.versionHistory.get(passportId) ?? []
  }

  getWorkspace(workspaceId: string): CollaborationWorkspace | undefined {
    return this.workspaces.get(workspaceId)
  }
}
