// ==========================================================================
// KTP-1.5 — Feasibility Package Authorization, Generator, Audit & Export
// ==========================================================================
// LOOP 6: Feasibility Package Authorization Workflow v1
// LOOP 7: Sponsor/CRO Feasibility Package Generator v1
// LOOP 8: Document Disclosure Audit Trail & Revocation v1
// LOOP 9: Secure Sponsor/CRO Access or Controlled Export v1
// ==========================================================================

import type {
  DocumentHandlingMode,
  DisclosureStatus,
  RedactionStatus,
} from '@kadarn/types/document-handling'

// ==========================================================================
// LOOP 6 — Feasibility Package Authorization
// ==========================================================================

export interface FeasibilityPackageAuthorization {
  packageAuthorizationId: string
  organizationId: string
  sponsorOrCroName: string
  recipientContact?: string
  purpose: 'feasibility' | 'qualification' | 'startup'
  authorizedDocumentIds: string[]
  authorizedBy: string
  authorizedAt: string
  expiresAt?: string
  status: 'draft' | 'authorized' | 'revoked' | 'expired'
  notes?: string
}

export function createPackageAuthorization(params: {
  organizationId: string
  sponsorOrCroName: string
  purpose: 'feasibility' | 'qualification' | 'startup'
  authorizedDocumentIds: string[]
  authorizedBy: string
  recipientContact?: string
  expiresAt?: string
}): FeasibilityPackageAuthorization {
  return {
    packageAuthorizationId: `pkg-auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    organizationId: params.organizationId,
    sponsorOrCroName: params.sponsorOrCroName,
    recipientContact: params.recipientContact,
    purpose: params.purpose,
    authorizedDocumentIds: params.authorizedDocumentIds,
    authorizedBy: params.authorizedBy,
    authorizedAt: new Date().toISOString(),
    expiresAt: params.expiresAt,
    status: 'draft',
    notes: undefined,
  }
}

/**
 * Validate whether a document can be authorized for a package.
 * Blocks if: expired, private_restricted, redaction unknown/required, not eligible.
 */
export function canAuthorizeForPackage(params: {
  handlingMode: DocumentHandlingMode
  disclosureStatus: DisclosureStatus
  redactionStatus: RedactionStatus
  isExpired?: boolean
}): { canAuthorize: boolean; reason?: string } {
  if (params.isExpired) {
    return { canAuthorize: false, reason: 'Document has expired. Renew before authorizing.' }
  }
  if (params.handlingMode === 'private_restricted') {
    return { canAuthorize: false, reason: 'Private/restricted documents cannot be authorized for external packages.' }
  }
  if (params.redactionStatus === 'unknown' || params.redactionStatus === 'required') {
    return { canAuthorize: false, reason: 'Redaction status must be resolved before authorization.' }
  }
  if (params.disclosureStatus === 'not_eligible' && params.handlingMode !== 'feasibility_folder') {
    return { canAuthorize: false, reason: 'Document is not eligible for disclosure.' }
  }
  if (params.disclosureStatus === 'access_revoked') {
    return { canAuthorize: false, reason: 'Document access was previously revoked.' }
  }
  return { canAuthorize: true }
}

// ==========================================================================
// LOOP 7 — Feasibility Package Generator
// ==========================================================================

export interface FeasibilityPackage {
  packageId: string
  organizationId: string
  recipient: string
  purpose: 'feasibility' | 'qualification' | 'startup'
  includedDocuments: string[]
  includedClaims: string[]
  evidenceSummaries: Array<{
    claimId: string
    claimLabel: string
    evidenceStatus: string
    confidence: number
    gaps: string[]
  }>
  limitations: string[]
  generatedAt: string
  generatedBy: string
  expiresAt?: string
  status: 'generated' | 'shared' | 'revoked' | 'expired'
  authorizationRef?: string
}

export function generateFeasibilityPackage(params: {
  organizationId: string
  recipient: string
  purpose: 'feasibility' | 'qualification' | 'startup'
  authorization: FeasibilityPackageAuthorization
  includedClaims: Array<{ claimId: string; claimLabel: string; evidenceStatus: string; confidence: number; gaps: string[] }>
  limitations?: string[]
  generatedBy: string
  expiresAt?: string
}): FeasibilityPackage {
  const lims = params.limitations || []
  lims.push('This package does not imply sponsor acceptance, regulatory approval, or certification.')
  lims.push('Documents marked as self-reported or referenced-only carry lower confidence.')
  lims.push('Expired documents are excluded. Verify document dates before use.')

  return {
    packageId: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    organizationId: params.organizationId,
    recipient: params.recipient,
    purpose: params.purpose,
    includedDocuments: params.authorization.authorizedDocumentIds,
    includedClaims: params.includedClaims.map(c => c.claimId),
    evidenceSummaries: params.includedClaims,
    limitations: lims,
    generatedAt: new Date().toISOString(),
    generatedBy: params.generatedBy,
    expiresAt: params.expiresAt,
    status: 'generated',
    authorizationRef: params.authorization.packageAuthorizationId,
  }
}

// ==========================================================================
// LOOP 8 — Document Disclosure Audit Trail & Revocation
// ==========================================================================

export type DisclosureAuditEventType =
  | 'document_added_to_feasibility_folder'
  | 'document_removed_from_feasibility_folder'
  | 'document_marked_private_restricted'
  | 'document_reviewed_not_stored'
  | 'document_authorized_for_package'
  | 'document_shared_with_sponsor'
  | 'document_accessed_by_sponsor'
  | 'document_access_revoked'
  | 'document_expired'
  | 'package_generated'
  | 'package_shared'
  | 'package_revoked'
  | 'package_expired'

export interface DisclosureAuditEvent {
  eventId: string
  eventType: DisclosureAuditEventType
  actor: string
  organizationId: string
  documentId?: string
  packageId?: string
  sponsorOrCroRecipient?: string
  timestamp: string
  priorState?: string
  newState?: string
  reason?: string
  metadata?: Record<string, unknown>
}

export function createAuditEvent(params: {
  eventType: DisclosureAuditEventType
  actor: string
  organizationId: string
  documentId?: string
  packageId?: string
  sponsorOrCroRecipient?: string
  priorState?: string
  newState?: string
  reason?: string
  metadata?: Record<string, unknown>
}): DisclosureAuditEvent {
  return {
    eventId: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventType: params.eventType,
    actor: params.actor,
    organizationId: params.organizationId,
    documentId: params.documentId,
    packageId: params.packageId,
    sponsorOrCroRecipient: params.sponsorOrCroRecipient,
    timestamp: new Date().toISOString(),
    priorState: params.priorState,
    newState: params.newState,
    reason: params.reason,
    metadata: params.metadata,
  }
}

/**
 * Revoke a package authorization. Updates package status and creates audit events.
 */
export function revokePackageAuthorization(
  authorization: FeasibilityPackageAuthorization,
  packages: FeasibilityPackage[],
  revokedBy: string,
  reason?: string,
): {
  updatedAuthorization: FeasibilityPackageAuthorization
  updatedPackages: FeasibilityPackage[]
  auditEvents: DisclosureAuditEvent[]
} {
  const now = new Date().toISOString()
  const auditEvents: DisclosureAuditEvent[] = []

  const updatedAuth: FeasibilityPackageAuthorization = {
    ...authorization,
    status: 'revoked',
  }

  auditEvents.push(createAuditEvent({
    eventType: 'package_revoked',
    actor: revokedBy,
    organizationId: authorization.organizationId,
    packageId: authorization.packageAuthorizationId,
    sponsorOrCroRecipient: authorization.sponsorOrCroName,
    priorState: 'authorized',
    newState: 'revoked',
    reason,
  }))

  const updatedPackages = packages.map(pkg => {
    if (pkg.authorizationRef === authorization.packageAuthorizationId) {
      auditEvents.push(createAuditEvent({
        eventType: 'package_revoked',
        actor: revokedBy,
        organizationId: authorization.organizationId,
        packageId: pkg.packageId,
        priorState: pkg.status,
        newState: 'revoked',
        reason,
      }))
      return { ...pkg, status: 'revoked' as const }
    }
    return pkg
  })

  // Individual document revocation events
  for (const docId of authorization.authorizedDocumentIds) {
    auditEvents.push(createAuditEvent({
      eventType: 'document_access_revoked',
      actor: revokedBy,
      organizationId: authorization.organizationId,
      documentId: docId,
      packageId: authorization.packageAuthorizationId,
      priorState: 'authorized_for_package',
      newState: 'access_revoked',
      reason,
    }))
  }

  return { updatedAuthorization: updatedAuth, updatedPackages, auditEvents }
}

// ==========================================================================
// LOOP 9 — Controlled Export
// ==========================================================================

export interface ControlledExport {
  exportId: string
  packageId: string
  format: 'pdf' | 'zip' | 'link'
  accessUrl?: string
  accessExpiresAt?: string
  watermarkText?: string
  generatedAt: string
  status: 'generated' | 'accessed' | 'expired' | 'revoked'
  accessCount: number
  lastAccessedAt?: string
  manifestIncluded: boolean
  documentList: Array<{
    documentId: string
    label: string
    limitations: string[]
  }>
}

export function createControlledExport(params: {
  packageId: string
  format: 'pdf' | 'zip' | 'link'
  documents: Array<{ documentId: string; label: string; limitations: string[] }>
  expiresInDays?: number
  watermarkText?: string
}): ControlledExport {
  const expiresAt = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 86400000).toISOString()
    : undefined

  return {
    exportId: `export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    packageId: params.packageId,
    format: params.format,
    accessUrl: params.format === 'link' ? `kadarn://export/${params.packageId}` : undefined,
    accessExpiresAt: expiresAt,
    watermarkText: params.watermarkText || 'CONFIDENTIAL — For authorized recipient only',
    generatedAt: new Date().toISOString(),
    status: 'generated',
    accessCount: 0,
    manifestIncluded: true,
    documentList: params.documents,
  }
}

/**
 * Check if an export is still accessible.
 */
export function isExportAccessible(exp: ControlledExport): { accessible: boolean; reason?: string } {
  if (exp.status === 'revoked') return { accessible: false, reason: 'Export has been revoked.' }
  if (exp.status === 'expired') return { accessible: false, reason: 'Export has expired.' }
  if (exp.accessExpiresAt && new Date(exp.accessExpiresAt) < new Date()) {
    return { accessible: false, reason: 'Export access window has closed.' }
  }
  return { accessible: true }
}
