// ==========================================================================
// KTP-1.5 — Feasibility Package Tests (LOOPs 6-9)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  createPackageAuthorization,
  canAuthorizeForPackage,
  generateFeasibilityPackage,
  createAuditEvent,
  revokePackageAuthorization,
  createControlledExport,
  isExportAccessible,
  type FeasibilityPackageAuthorization,
  type FeasibilityPackage,
} from '../../packages/types/src/feasibility-package'

// ==========================================================================
// LOOP 6 — Package Authorization
// ==========================================================================

describe('createPackageAuthorization', () => {
  it('should create a draft authorization', () => {
    const auth = createPackageAuthorization({
      organizationId: 'org-1',
      sponsorOrCroName: 'Pfizer',
      purpose: 'feasibility',
      authorizedDocumentIds: ['doc-1', 'doc-2'],
      authorizedBy: 'user-1',
    })
    expect(auth.status).toBe('draft')
    expect(auth.authorizedDocumentIds).toHaveLength(2)
    expect(auth.sponsorOrCroName).toBe('Pfizer')
  })
})

describe('canAuthorizeForPackage', () => {
  it('should allow feasibility_folder documents', () => {
    const result = canAuthorizeForPackage({
      handlingMode: 'feasibility_folder',
      disclosureStatus: 'eligible_with_authorization',
      redactionStatus: 'none',
    })
    expect(result.canAuthorize).toBe(true)
  })

  it('should block private_restricted documents', () => {
    const result = canAuthorizeForPackage({
      handlingMode: 'private_restricted',
      disclosureStatus: 'not_eligible',
      redactionStatus: 'none',
    })
    expect(result.canAuthorize).toBe(false)
    expect(result.reason).toContain('Private/restricted')
  })

  it('should block when redaction is unknown', () => {
    const result = canAuthorizeForPackage({
      handlingMode: 'feasibility_folder',
      disclosureStatus: 'eligible_with_authorization',
      redactionStatus: 'unknown',
    })
    expect(result.canAuthorize).toBe(false)
  })

  it('should block when redaction is required', () => {
    const result = canAuthorizeForPackage({
      handlingMode: 'feasibility_folder',
      disclosureStatus: 'eligible_with_authorization',
      redactionStatus: 'required',
    })
    expect(result.canAuthorize).toBe(false)
  })

  it('should block expired documents', () => {
    const result = canAuthorizeForPackage({
      handlingMode: 'feasibility_folder',
      disclosureStatus: 'eligible_with_authorization',
      redactionStatus: 'none',
      isExpired: true,
    })
    expect(result.canAuthorize).toBe(false)
    expect(result.reason).toContain('expired')
  })

  it('should block previously revoked documents', () => {
    const result = canAuthorizeForPackage({
      handlingMode: 'feasibility_folder',
      disclosureStatus: 'access_revoked',
      redactionStatus: 'none',
    })
    expect(result.canAuthorize).toBe(false)
  })
})

// ==========================================================================
// LOOP 7 — Package Generator
// ==========================================================================

describe('generateFeasibilityPackage', () => {
  it('should generate a package with limitations', () => {
    const auth = createPackageAuthorization({
      organizationId: 'org-1',
      sponsorOrCroName: 'Pfizer',
      purpose: 'feasibility',
      authorizedDocumentIds: ['doc-1'],
      authorizedBy: 'user-1',
    })
    const pkg = generateFeasibilityPackage({
      organizationId: 'org-1',
      recipient: 'Pfizer',
      purpose: 'feasibility',
      authorization: auth,
      includedClaims: [{ claimId: 'study.participation', claimLabel: 'Study Participation', evidenceStatus: 'DOCUMENT_SUPPORTED', confidence: 0.65, gaps: [] }],
      generatedBy: 'user-1',
    })
    expect(pkg.status).toBe('generated')
    expect(pkg.limitations.length).toBeGreaterThanOrEqual(3)
    expect(pkg.limitations.some(l => l.includes('does not imply sponsor acceptance'))).toBe(true)
    expect(pkg.limitations.some(l => l.includes('self-reported'))).toBe(true)
  })
})

// ==========================================================================
// LOOP 8 — Audit Trail & Revocation
// ==========================================================================

describe('createAuditEvent', () => {
  it('should create an audit event with all fields', () => {
    const event = createAuditEvent({
      eventType: 'document_authorized_for_package',
      actor: 'user-1',
      organizationId: 'org-1',
      documentId: 'doc-1',
      priorState: 'eligible_with_authorization',
      newState: 'authorized_for_package',
    })
    expect(event.eventType).toBe('document_authorized_for_package')
    expect(event.actor).toBe('user-1')
    expect(event.timestamp).toBeDefined()
  })
})

describe('revokePackageAuthorization', () => {
  it('should revoke authorization and create audit events', () => {
    const auth = createPackageAuthorization({
      organizationId: 'org-1',
      sponsorOrCroName: 'Pfizer',
      purpose: 'feasibility',
      authorizedDocumentIds: ['doc-1', 'doc-2'],
      authorizedBy: 'user-1',
    })
    const pkg = generateFeasibilityPackage({
      organizationId: 'org-1',
      recipient: 'Pfizer',
      purpose: 'feasibility',
      authorization: auth,
      includedClaims: [],
      generatedBy: 'user-1',
    })

    const result = revokePackageAuthorization(auth, [pkg], 'admin-1', 'Contract ended')
    expect(result.updatedAuthorization.status).toBe('revoked')
    expect(result.updatedPackages[0].status).toBe('revoked')
    // Audit events: 1 package revoked + 1 package revoked (for pkg) + 2 doc revocations = 4
    expect(result.auditEvents.length).toBe(4)
    expect(result.auditEvents[0].eventType).toBe('package_revoked')
  })
})

// ==========================================================================
// LOOP 9 — Controlled Export
// ==========================================================================

describe('createControlledExport', () => {
  it('should create an export with watermark and expiration', () => {
    const exp = createControlledExport({
      packageId: 'pkg-1',
      format: 'pdf',
      documents: [{ documentId: 'doc-1', label: 'IRB Letter', limitations: ['Redacted'] }],
      expiresInDays: 30,
    })
    expect(exp.status).toBe('generated')
    expect(exp.watermarkText).toContain('CONFIDENTIAL')
    expect(exp.accessExpiresAt).toBeDefined()
    expect(exp.documentList).toHaveLength(1)
  })
})

describe('isExportAccessible', () => {
  it('should return accessible for valid export', () => {
    const exp = createControlledExport({
      packageId: 'pkg-1',
      format: 'link',
      documents: [],
    })
    const result = isExportAccessible(exp)
    expect(result.accessible).toBe(true)
  })

  it('should return not accessible for revoked export', () => {
    const exp = createControlledExport({ packageId: 'pkg-1', format: 'link', documents: [] })
    const revoked = { ...exp, status: 'revoked' as const }
    const result = isExportAccessible(revoked)
    expect(result.accessible).toBe(false)
    expect(result.reason).toContain('revoked')
  })

  it('should return not accessible for expired export', () => {
    const exp = createControlledExport({ packageId: 'pkg-1', format: 'link', documents: [] })
    const expired = { ...exp, status: 'expired' as const }
    const result = isExportAccessible(expired)
    expect(result.accessible).toBe(false)
  })
})
