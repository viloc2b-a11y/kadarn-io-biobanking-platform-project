// ==========================================================================
// Private Evidence Layer — Types + Engine (Sprint 23E)
// ==========================================================================
// Allows institutions to contribute confidential evidence safely.
// No ZKP. No PHI/PII exposure. No private content rendering.
// Pure deterministic helpers. No business logic.
// ==========================================================================

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type EvidenceVisibility =
  | 'public_evidence'
  | 'institution_provided'
  | 'private_evidence'
  | 'derived_signal'
  | 'restricted_evidence'

export type AuthorizationState =
  | 'not_required'
  | 'authorized'
  | 'restricted'
  | 'revoked'
  | 'pending_review'

export type ViewerRole = 'kadarn_internal' | 'site_director' | 'sponsor' | 'public'

export interface PrivateEvidenceRecord {
  id: string
  title: string
  evidence_type: string
  visibility_type: EvidenceVisibility
  authorization_state: AuthorizationState
  authorized_viewers: ViewerRole[]
  supported_capabilities: string[]
  affected_gaps: string[]
  derived_summary: string
  restricted_fields: string[]
  source_reference: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface VisibilitySummary {
  public_count: number
  institution_provided_count: number
  private_count: number
  restricted_count: number
  total: number
}

// --------------------------------------------------------------------------
// PrivateEvidenceService
// --------------------------------------------------------------------------

export class PrivateEvidenceService {
  /**
   * Classify evidence visibility.
   */
  classifyVisibility(
    source: string,
    hasAuthorization: boolean,
    containsRestrictedData: boolean,
  ): EvidenceVisibility {
    if (containsRestrictedData && !hasAuthorization) return 'restricted_evidence'
    if (containsRestrictedData && hasAuthorization) return 'private_evidence'
    if (!hasAuthorization && source === 'institution_upload') return 'institution_provided'
    if (source === 'institution_upload' && hasAuthorization) return 'private_evidence'
    return 'public_evidence'
  }

  /**
   * Determine what a viewer can see.
   */
  canView(record: PrivateEvidenceRecord, role: ViewerRole): boolean {
    if (role === 'kadarn_internal') return true
    if (role === 'site_director' && record.visibility_type !== 'restricted_evidence') return true
    if (role === 'sponsor' && record.authorization_state === 'authorized' && record.authorized_viewers.includes('sponsor')) return true
    return false
  }

  /**
   * Build a visibility summary from records.
   */
  buildSummary(records: PrivateEvidenceRecord[]): VisibilitySummary {
    return {
      public_count: records.filter((r) => r.visibility_type === 'public_evidence').length,
      institution_provided_count: records.filter((r) => r.visibility_type === 'institution_provided').length,
      private_count: records.filter((r) => r.visibility_type === 'private_evidence').length,
      restricted_count: records.filter((r) => r.visibility_type === 'restricted_evidence').length,
      total: records.length,
    }
  }

  /**
   * Generate a safe summary that never exposes private content.
   */
  safeSummary(record: PrivateEvidenceRecord, role: ViewerRole): string {
    if (!this.canView(record, role)) {
      return 'Some supporting evidence is private and not available in this view.'
    }

    if (record.visibility_type === 'restricted_evidence') {
      return `Restricted evidence exists supporting ${record.supported_capabilities.length} capability/capabilities. Details are not available.`
    }

    return record.derived_summary || `Private evidence: ${record.title}`
  }

  /**
   * Mask restricted fields for unauthorized viewers.
   */
  maskForRole(record: PrivateEvidenceRecord, role: ViewerRole): PrivateEvidenceRecord {
    if (this.canView(record, role)) return record

    return {
      ...record,
      title: 'Private evidence',
      derived_summary: 'Private evidence exists but is not available in this report.',
      restricted_fields: record.restricted_fields,
      authorized_viewers: [],
      metadata: {},
    }
  }

  /**
   * Filter records visible to a role.
   */
  filterForRole(records: PrivateEvidenceRecord[], role: ViewerRole): PrivateEvidenceRecord[] {
    return records
      .filter((r) => this.canView(r, role))
      .map((r) => this.maskForRole(r, role))
  }

  /**
   * Generate report-safe references (no private content).
   */
  reportSafeReferences(records: PrivateEvidenceRecord[], role: ViewerRole): string[] {
    const refs: string[] = []

    for (const r of records) {
      if (this.canView(r, role) && r.visibility_type !== 'restricted_evidence') {
        refs.push(`${r.title} (${r.visibility_type.replace(/_/g, ' ')})`)
      } else if (r.visibility_type === 'restricted_evidence' || r.visibility_type === 'private_evidence') {
        refs.push('Private evidence exists but is not available in this report.')
      }
    }

    return [...new Set(refs)]
  }

  /**
   * Generate explainability-safe reference.
   */
  explainabilityReference(record: PrivateEvidenceRecord, role: ViewerRole): string {
    if (this.canView(record, role) && record.authorization_state === 'authorized') {
      return `Private evidence "${record.title}" supports ${record.supported_capabilities.join(', ')}. Authorization: ${record.authorization_state}.`
    }
    if (record.visibility_type === 'private_evidence' || record.visibility_type === 'restricted_evidence') {
      return `Private evidence contributed to this conclusion but details are restricted (authorization: ${record.authorization_state}).`
    }
    return this.safeSummary(record, role)
  }

  /**
   * Check if private evidence should be suppressed for public view.
   */
  suppressForPublic(record: PrivateEvidenceRecord): boolean {
    return record.visibility_type !== 'public_evidence'
  }

  /**
   * Check if private evidence can affect sponsor readiness.
   */
  canAffectSponsorReadiness(record: PrivateEvidenceRecord): boolean {
    return record.authorization_state === 'authorized' && record.authorized_viewers.includes('sponsor')
  }
}
