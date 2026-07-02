// ==========================================================================
// Institutional Consent Engine — Types + Engine (Sprint 24E)
// ==========================================================================
// Canonical consent layer. Governs access to institutional intelligence.
// Explicit, purpose-bound, time-limited, revocable, auditable.
// No permanent consent. No wildcard access. No automatic grants.
// ==========================================================================

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type AuthorizationState =
  | 'pending'
  | 'granted'
  | 'partially_granted'
  | 'declined'
  | 'revoked'
  | 'expired'

export type ConsentScope =
  | 'claim_only'
  | 'research_assets'
  | 'private_evidence'
  | 'passport'
  | 'full_collaboration'

export type ConsentPurpose =
  | 'study_feasibility'
  | 'site_selection'
  | 'biospecimen_collection'
  | 'clinical_trial'
  | 'partnership'
  | 'other'

export interface AuditEvent {
  event_id: string
  consent_id: string
  action: string
  actor: string
  timestamp: string
  details: string
}

export interface InstitutionalConsent {
  consent_id: string
  brief_id: string
  institution_id: string
  requesting_actor: string
  purpose: ConsentPurpose
  requested_claims: string[]
  requested_research_assets: string[]
  requested_private_evidence: string[]
  consent_scope: ConsentScope
  authorization_state: AuthorizationState
  granted_at: string | null
  expires_at: string | null
  revoked_at: string | null
  audit_log: AuditEvent[]
  metadata: Record<string, unknown>
}

// --------------------------------------------------------------------------
// InstitutionalConsentEngine
// --------------------------------------------------------------------------

export class InstitutionalConsentEngine {
  private consents = new Map<string, InstitutionalConsent>()

  /**
   * Create a consent request from an Opportunity Brief.
   */
  request(
    briefId: string,
    institutionId: string,
    requestingActor: string,
    purpose: ConsentPurpose,
    requestedClaims: string[],
    requestedAssets: string[],
    requestedPrivateEvidence: string[],
    durationDays = 90,
  ): InstitutionalConsent {
    const now = new Date().toISOString()
    const consentId = `consent:${briefId.slice(-8)}:${Date.now().toString(36)}`

    const consent: InstitutionalConsent = {
      consent_id: consentId,
      brief_id: briefId,
      institution_id: institutionId,
      requesting_actor: requestingActor,
      purpose,
      requested_claims: requestedClaims,
      requested_research_assets: requestedAssets,
      requested_private_evidence: requestedPrivateEvidence,
      consent_scope: 'claim_only',
      authorization_state: 'pending',
      granted_at: null,
      expires_at: new Date(Date.now() + durationDays * 86400000).toISOString(),
      revoked_at: null,
      audit_log: [this.auditEvent(consentId, 'consent_requested', requestingActor, `Purpose: ${purpose}, Duration: ${durationDays} days`)],
      metadata: {},
    }

    this.consents.set(consentId, consent)
    return consent
  }

  /**
   * Grant full consent.
   */
  grant(consentId: string, actor: string, scope: ConsentScope = 'claim_only'): InstitutionalConsent {
    const consent = this.get(consentId)
    consent.authorization_state = 'granted'
    consent.consent_scope = scope
    consent.granted_at = new Date().toISOString()
    consent.audit_log.push(this.auditEvent(consentId, 'consent_granted', actor, `Scope: ${scope}`))
    return consent
  }

  /**
   * Grant partial consent (limited scope).
   */
  grantPartial(consentId: string, actor: string, grantedClaims: string[], grantedAssets: string[]): InstitutionalConsent {
    const consent = this.get(consentId)
    consent.authorization_state = 'partially_granted'
    consent.consent_scope = 'claim_only'
    consent.requested_claims = grantedClaims
    consent.requested_research_assets = grantedAssets
    consent.granted_at = new Date().toISOString()
    consent.audit_log.push(this.auditEvent(consentId, 'consent_partially_granted', actor,
      `Claims: ${grantedClaims.length}, Assets: ${grantedAssets.length}`))
    return consent
  }

  /**
   * Decline consent.
   */
  decline(consentId: string, actor: string, reason?: string): InstitutionalConsent {
    const consent = this.get(consentId)
    consent.authorization_state = 'declined'
    consent.audit_log.push(this.auditEvent(consentId, 'consent_declined', actor, reason ?? 'No reason provided'))
    return consent
  }

  /**
   * Revoke previously granted consent.
   */
  revoke(consentId: string, actor: string, reason?: string): InstitutionalConsent {
    const consent = this.get(consentId)
    if (consent.authorization_state !== 'granted' && consent.authorization_state !== 'partially_granted') {
      throw new Error(`Cannot revoke consent in state: ${consent.authorization_state}`)
    }
    consent.authorization_state = 'revoked'
    consent.revoked_at = new Date().toISOString()
    consent.audit_log.push(this.auditEvent(consentId, 'consent_revoked', actor, reason ?? 'Revoked by institution'))
    return consent
  }

  /**
   * Extend consent expiration.
   */
  extend(consentId: string, actor: string, additionalDays: number): InstitutionalConsent {
    const consent = this.get(consentId)
    const currentExpiry = consent.expires_at ? new Date(consent.expires_at).getTime() : Date.now()
    consent.expires_at = new Date(currentExpiry + additionalDays * 86400000).toISOString()
    consent.audit_log.push(this.auditEvent(consentId, 'consent_extended', actor, `Extended by ${additionalDays} days`))
    return consent
  }

  /**
   * Check for expired consents.
   */
  checkExpirations(): InstitutionalConsent[] {
    const expired: InstitutionalConsent[] = []
    const now = Date.now()
    for (const consent of this.consents.values()) {
      if (
        consent.expires_at &&
        new Date(consent.expires_at).getTime() < now &&
        consent.authorization_state === 'granted'
      ) {
        consent.authorization_state = 'expired'
        consent.audit_log.push(this.auditEvent(consent.consent_id, 'consent_expired', 'system', 'Consent reached expiration'))
        expired.push(consent)
      }
    }
    return expired
  }

  /**
   * Get consent by ID.
   */
  get(consentId: string): InstitutionalConsent {
    const consent = this.consents.get(consentId)
    if (!consent) throw new Error(`Consent not found: ${consentId}`)
    return consent
  }

  /**
   * Get all consents for an institution.
   */
  getByInstitution(institutionId: string): InstitutionalConsent[] {
    return Array.from(this.consents.values()).filter((c) => c.institution_id === institutionId)
  }

  /**
   * Get pending consents (institution dashboard).
   */
  getPending(institutionId: string): InstitutionalConsent[] {
    return this.getByInstitution(institutionId).filter((c) => c.authorization_state === 'pending')
  }

  /**
   * Get granted consents (sponsor dashboard).
   */
  getGranted(requestingActor: string): InstitutionalConsent[] {
    return Array.from(this.consents.values()).filter(
      (c) => c.requesting_actor === requestingActor && c.authorization_state === 'granted',
    )
  }

  /**
   * Create audit event.
   */
  private auditEvent(consentId: string, action: string, actor: string, details: string): AuditEvent {
    return {
      event_id: `audit:${consentId}:${Date.now().toString(36)}`,
      consent_id: consentId,
      action,
      actor,
      timestamp: new Date().toISOString(),
      details,
    }
  }
}
