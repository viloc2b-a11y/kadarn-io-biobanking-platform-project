// ==========================================================================
// IKM Compliance Integration Sprint
// ==========================================================================
// Compliance Ecosystem: aggregates Quality + Regulatory into a single
// institutional compliance view. Stays within IKM boundary.
// No Evidence Objects. No Claims. No Readiness. No downstream engines.
// ==========================================================================

import {
  QUALITY_DOMAIN_CATALOG, QUALITY_DOCUMENTS, QUALITY_SECTIONS, QUALITY_OPERATIONS,
  type QualityItem, type QualityDocument,
} from './domains/quality'
import {
  REGULATORY_DOMAIN_CATALOG, REGULATORY_DOCUMENTS, REGULATORY_SECTIONS,
  REGULATORY_LIFECYCLE, REGULATORY_OPERATIONS,
  type RegulatoryItem, type RegulatoryDocument,
} from './domains/regulatory'

// ==========================================================================
// PART 1 — Unified Types
// ==========================================================================

export type ComplianceDomain = 'quality' | 'regulatory'

export type ComplianceSeverity = 'critical' | 'high' | 'medium' | 'low'

export type ComplianceGapType =
  | 'missing_item'
  | 'missing_document'
  | 'expired_document'
  | 'expired_license'
  | 'expired_certification'
  | 'expired_training'
  | 'expired_insurance'
  | 'overdue_capa'
  | 'overdue_review'
  | 'overdue_audit'
  | 'missing_owner'
  | 'incomplete_training'
  | 'missing_policy'
  | 'expiring_soon'
  | 'duplicate_item'

export type ComplianceStatus =
  | 'empty'
  | 'partially_documented'
  | 'active'
  | 'at_risk'
  | 'expired'
  | 'ready_for_promotion'

export interface ComplianceItem {
  key: string
  label: string
  description: string
  domain: ComplianceDomain
  section: string
  required: boolean
  category: string
  expires: boolean
  expirationMonths?: number
}

export interface ComplianceDocument {
  key: string
  label: string
  description: string
  domain: ComplianceDomain
  required: boolean
  expires: boolean
  expirationMonths?: number
  evidenceClass: 'A' | 'B' | 'C' | 'D'
  supportsItems: string[]
}

export interface ComplianceGap {
  gapType: ComplianceGapType
  severity: ComplianceSeverity
  domain: ComplianceDomain
  itemKey?: string
  itemLabel?: string
  documentKey?: string
  documentLabel?: string
  reason: string
  recommendedAction: string
  detectedAt: string
}

export interface ComplianceRisk {
  riskType: ComplianceGapType
  severity: ComplianceSeverity
  domain: ComplianceDomain
  relatedItem?: string
  relatedDocument?: string
  reason: string
  recommendedAction: string
  resolutionRequired: boolean
}

export interface TimelineEntry {
  date: string
  window: 'expired' | '7d' | '15d' | '30d' | '60d' | '90d'
  type: 'renewal' | 'review' | 'expiration' | 'audit' | 'training'
  domain: ComplianceDomain
  itemKey: string
  itemLabel: string
  documentKey?: string
  severity: ComplianceSeverity
}

export interface ComplianceDashboardState {
  status: ComplianceStatus
  overview: {
    totalKnowledgeItems: number
    documentedItems: number
    undocumentedItems: number
    totalDocuments: number
    uploadedDocuments: number
    missingDocuments: number
    expiredDocuments: number
    expiringSoon: number
    gaps: ComplianceGap[]
    healthScore: number // 0-100
  }
  quality: {
    documentedItems: number
    missingItems: number
    sopReviewsPending: number
    capasOpen: number
    capasOverdue: number
    auditsCompleted: number
    auditsPending: number
    trainingComplete: number
    trainingIncomplete: number
    healthScore: number
  }
  regulatory: {
    documentedItems: number
    missingItems: number
    validLicenses: number
    expiredLicenses: number
    expiringLicenses: number
    validCertifications: number
    expiredCertifications: number
    validInsurance: number
    expiredInsurance: number
    healthScore: number
  }
  expiringDocuments: { key: string; label: string; domain: ComplianceDomain; daysUntilExpiry: number }[]
  expiredDocuments: { key: string; label: string; domain: ComplianceDomain; expiredDays: number }[]
  pendingReviews: { key: string; label: string; domain: ComplianceDomain; type: string }[]
  highPriorityActions: { description: string; domain: ComplianceDomain; severity: ComplianceSeverity; itemKey: string }[]
}

// ==========================================================================
// PART 2 — Unified Catalog Builder
// ==========================================================================

export function buildComplianceCatalog(): {
  items: ComplianceItem[]
  documents: ComplianceDocument[]
} {
  const items: ComplianceItem[] = [
    ...QUALITY_DOMAIN_CATALOG.map((qi: QualityItem) => ({
      key: qi.key, label: qi.label, description: qi.description,
      domain: 'quality' as const, section: findQualitySection(qi.key),
      required: qi.required,
      category: qi.itemType,
      expires: false,
    })),
    ...REGULATORY_DOMAIN_CATALOG.map((ri: RegulatoryItem) => ({
      key: ri.key, label: ri.label, description: ri.description,
      domain: 'regulatory' as const, section: findRegulatorySection(ri.key),
      required: ri.required,
      category: ri.category,
      expires: ri.expires,
      expirationMonths: ri.typicalExpirationMonths,
    })),
  ]

  const documents: ComplianceDocument[] = [
    ...QUALITY_DOCUMENTS.map((qd: QualityDocument) => ({
      key: qd.key, label: qd.label, description: qd.description,
      domain: 'quality' as const,
      required: qd.required, expires: qd.expires,
      expirationMonths: qd.typicalExpirationMonths,
      evidenceClass: qd.evidenceClass,
      supportsItems: qd.supportsKnowledgeItems,
    })),
    ...REGULATORY_DOCUMENTS.map((rd: RegulatoryDocument) => ({
      key: rd.key, label: rd.label, description: rd.description,
      domain: 'regulatory' as const,
      required: rd.required, expires: rd.expires,
      expirationMonths: rd.typicalExpirationMonths,
      evidenceClass: rd.evidenceClass,
      supportsItems: rd.supportsKnowledgeItems,
    })),
  ]

  return { items, documents }
}

function findQualitySection(key: string): string {
  for (const s of QUALITY_SECTIONS) {
    if (s.items.some((i) => i.key === key)) return s.name
  }
  return 'unknown'
}

function findRegulatorySection(key: string): string {
  for (const s of REGULATORY_SECTIONS) {
    if (s.items.some((i) => i.key === key)) return s.name
  }
  return 'unknown'
}

// ==========================================================================
// PART 3 — Knowledge State (per-institution snapshot)
// ==========================================================================

export interface ComplianceKnowledgeState {
  institutionId: string
  documentedItems: Set<string>      // item keys that have knowledge recorded
  uploadedDocuments: Set<string>    // document keys that have been uploaded
  documentExpirations: Map<string, string>  // document key → expiration date ISO
  documentReviewDates: Map<string, string>  // document key → next review date ISO
  trainingStatus: Map<string, { completed: boolean; expiryDate?: string }>  // person/role → training state
  capaStatus: Map<string, { open: boolean; dueDate?: string; owner?: string }>
  auditStatus: Map<string, { completed: boolean; completedDate?: string }>
  itemOwners: Map<string, string>   // item key → person key
  lastUpdated: string
}

export function createComplianceKnowledgeState(institutionId: string): ComplianceKnowledgeState {
  return {
    institutionId,
    documentedItems: new Set(),
    uploadedDocuments: new Set(),
    documentExpirations: new Map(),
    documentReviewDates: new Map(),
    trainingStatus: new Map(),
    capaStatus: new Map(),
    auditStatus: new Map(),
    itemOwners: new Map(),
    lastUpdated: new Date().toISOString(),
  }
}

// ==========================================================================
// PART 4 — Risk Detection Engine
// ==========================================================================

export function detectComplianceRisks(
  state: ComplianceKnowledgeState,
  catalog: { items: ComplianceItem[]; documents: ComplianceDocument[] },
  referenceDate: Date = new Date(),
): ComplianceRisk[] {
  const risks: ComplianceRisk[] = []
  const now = referenceDate.getTime()
  const DAY_MS = 86_400_000

  // --- Required items not documented ---
  for (const item of catalog.items) {
    if (item.required && !state.documentedItems.has(item.key)) {
      risks.push({
        riskType: 'missing_policy',
        severity: item.domain === 'regulatory' ? 'critical' : 'high',
        domain: item.domain,
        relatedItem: item.key,
        reason: `Required ${item.domain} item "${item.label}" has no knowledge recorded`,
        recommendedAction: `Document ${item.label} in the ${item.domain} domain or mark as not applicable`,
        resolutionRequired: true,
      })
    }
  }

  // --- Required documents not uploaded ---
  for (const doc of catalog.documents) {
    if (doc.required && !state.uploadedDocuments.has(doc.key)) {
      risks.push({
        riskType: 'missing_document',
        severity: doc.evidenceClass === 'A' ? 'critical' : 'high',
        domain: doc.domain,
        relatedDocument: doc.key,
        reason: `Required ${doc.domain} document "${doc.label}" (Class ${doc.evidenceClass}) is not uploaded`,
        recommendedAction: `Upload ${doc.label} or request an extension`,
        resolutionRequired: true,
      })
    }
  }

  // --- Expired documents / licenses ---
  for (const [docKey, expiryDate] of state.documentExpirations) {
    const expiry = new Date(expiryDate).getTime()
    if (expiry < now) {
      const doc = catalog.documents.find((d) => d.key === docKey)
      risks.push({
        riskType: 'expired_document',
        severity: 'critical',
        domain: doc?.domain ?? 'quality',
        relatedDocument: docKey,
        reason: `Document "${doc?.label ?? docKey}" expired on ${expiryDate}`,
        recommendedAction: `Renew and upload current version of ${doc?.label ?? docKey}`,
        resolutionRequired: true,
      })
    }
  }

  // --- Expiring soon (within 90 days) ---
  for (const [docKey, expiryDate] of state.documentExpirations) {
    const expiry = new Date(expiryDate).getTime()
    const daysUntil = Math.ceil((expiry - now) / DAY_MS)
    if (daysUntil > 0 && daysUntil <= 90) {
      const doc = catalog.documents.find((d) => d.key === docKey)
      const severity: ComplianceSeverity = daysUntil <= 30 ? 'high' : daysUntil <= 60 ? 'medium' : 'low'
      risks.push({
        riskType: 'expiring_soon',
        severity,
        domain: doc?.domain ?? 'quality',
        relatedDocument: docKey,
        reason: `Document "${doc?.label ?? docKey}" expires in ${daysUntil} days`,
        recommendedAction: `Plan renewal of ${doc?.label ?? docKey} before ${expiryDate}`,
        resolutionRequired: daysUntil <= 30,
      })
    }
  }

  // --- Overdue CAPAs ---
  for (const [capaKey, capa] of state.capaStatus) {
    if (capa.open && capa.dueDate) {
      const due = new Date(capa.dueDate).getTime()
      if (due < now) {
        risks.push({
          riskType: 'overdue_capa',
          severity: 'high',
          domain: 'quality',
          relatedItem: capaKey,
          reason: `CAPA "${capaKey}" is overdue since ${capa.dueDate}`,
          recommendedAction: `Escalate overdue CAPA ${capaKey} — ${capa.owner ? `assigned to ${capa.owner}` : 'unassigned'}`,
          resolutionRequired: true,
        })
      }
    }
  }

  // --- Expired training ---
  for (const [trainingKey, train] of state.trainingStatus) {
    if (train.expiryDate) {
      const trainExpiry = new Date(train.expiryDate).getTime()
      if (trainExpiry < now) {
        risks.push({
          riskType: 'expired_training',
          severity: 'high',
          domain: 'quality',
          relatedItem: trainingKey,
          reason: `Training "${trainingKey}" expired on ${train.expiryDate}`,
          recommendedAction: `Schedule renewal training for ${trainingKey}`,
          resolutionRequired: true,
        })
      }
    } else if (!train.completed) {
      risks.push({
        riskType: 'missing_required_training',
        severity: 'medium',
        domain: 'quality',
        relatedItem: trainingKey,
        reason: `Required training "${trainingKey}" not completed`,
        recommendedAction: `Assign and complete training for ${trainingKey}`,
        resolutionRequired: false,
      })
    }
  }

  // --- Items without owners ---
  const criticalItems = catalog.items.filter(
    (i) => i.required && !state.itemOwners.has(i.key)
  )
  for (const item of criticalItems) {
    risks.push({
      riskType: 'missing_owner',
      severity: item.domain === 'regulatory' ? 'critical' : 'high',
      domain: item.domain,
      relatedItem: item.key,
      reason: `Required ${item.domain} item "${item.label}" has no assigned owner`,
      recommendedAction: `Assign a quality/regulatory owner for ${item.label}`,
      resolutionRequired: false,
    })
  }

  // --- Overdue SOP reviews (quality documents with review dates) ---
  for (const [docKey, reviewDate] of state.documentReviewDates) {
    const review = new Date(reviewDate).getTime()
    if (review < now) {
      const doc = catalog.documents.find((d) => d.key === docKey)
      risks.push({
        riskType: 'overdue_review',
        severity: 'medium',
        domain: 'quality',
        relatedDocument: docKey,
        reason: `Document "${doc?.label ?? docKey}" periodic review overdue since ${reviewDate}`,
        recommendedAction: `Complete periodic review of ${doc?.label ?? docKey}`,
        resolutionRequired: false,
      })
    }
  }

  // --- Overdue audits ---
  for (const [auditKey, audit] of state.auditStatus) {
    if (!audit.completed) {
      risks.push({
        riskType: 'overdue_audit',
        severity: 'high',
        domain: 'quality',
        relatedItem: auditKey,
        reason: `Audit "${auditKey}" has not been completed`,
        recommendedAction: `Schedule and complete audit ${auditKey}`,
        resolutionRequired: true,
      })
    }
  }

  return risks
}

// ==========================================================================
// PART 5 — Compliance Timeline
// ==========================================================================

export function generateComplianceTimeline(
  state: ComplianceKnowledgeState,
  catalog: { items: ComplianceItem[]; documents: ComplianceDocument[] },
  referenceDate: Date = new Date(),
): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  const now = referenceDate.getTime()
  const DAY_MS = 86_400_000

  const windowMap: { maxDays: number; window: TimelineEntry['window'] }[] = [
    { maxDays: 7, window: '7d' },
    { maxDays: 15, window: '15d' },
    { maxDays: 30, window: '30d' },
    { maxDays: 60, window: '60d' },
    { maxDays: 90, window: '90d' },
  ]

  // Document expirations
  for (const [docKey, expiryDate] of state.documentExpirations) {
    const expiry = new Date(expiryDate).getTime()
    const daysUntil = Math.ceil((expiry - now) / DAY_MS)
    const doc = catalog.documents.find((d) => d.key === docKey)

    let window: TimelineEntry['window'] | null = null
    let severity: ComplianceSeverity = 'low'

    if (daysUntil < 0) {
      window = 'expired'
      severity = 'critical'
    } else {
      for (const w of windowMap) {
        if (daysUntil <= w.maxDays) { window = w.window; break }
      }
    }

    if (window) {
      const isLicense = docKey.includes('license') || docKey.includes('certificate') || docKey.includes('cert')
      entries.push({
        date: expiryDate, window,
        type: isLicense ? 'renewal' : 'expiration',
        domain: doc?.domain ?? 'quality',
        itemKey: doc?.supportsItems[0] ?? docKey,
        itemLabel: doc?.label ?? docKey,
        documentKey: docKey,
        severity,
      })
    }
  }

  // CAPA due dates
  for (const [capaKey, capa] of state.capaStatus) {
    if (capa.open && capa.dueDate) {
      const due = new Date(capa.dueDate).getTime()
      const daysUntil = Math.ceil((due - now) / DAY_MS)

      let window: TimelineEntry['window'] | null = null
      if (daysUntil < 0) {
        window = 'expired'
      } else {
        for (const w of windowMap) {
          if (daysUntil <= w.maxDays) { window = w.window; break }
        }
      }

      if (window) {
        entries.push({
          date: capa.dueDate, window,
          type: 'review',
          domain: 'quality',
          itemKey: capaKey,
          itemLabel: capaKey,
          severity: window === 'expired' ? 'high' : 'medium',
        })
      }
    }
  }

  // Training expirations
  for (const [trainingKey, train] of state.trainingStatus) {
    if (train.expiryDate) {
      const trainExpiry = new Date(train.expiryDate).getTime()
      const daysUntil = Math.ceil((trainExpiry - now) / DAY_MS)

      let window: TimelineEntry['window'] | null = null
      if (daysUntil < 0) {
        window = 'expired'
      } else {
        for (const w of windowMap) {
          if (daysUntil <= w.maxDays) { window = w.window; break }
        }
      }

      if (window) {
        entries.push({
          date: train.expiryDate, window,
          type: 'training',
          domain: 'quality',
          itemKey: trainingKey,
          itemLabel: trainingKey,
          severity: window === 'expired' ? 'high' : 'medium',
        })
      }
    }
  }

  // Document review dates
  for (const [docKey, reviewDate] of state.documentReviewDates) {
    const review = new Date(reviewDate).getTime()
    const daysUntil = Math.ceil((review - now) / DAY_MS)

    let window: TimelineEntry['window'] | null = null
    if (daysUntil < 0) {
      window = 'expired'
    } else {
      for (const w of windowMap) {
        if (daysUntil <= w.maxDays) { window = w.window; break }
      }
    }

    if (window) {
      const doc = catalog.documents.find((d) => d.key === docKey)
      entries.push({
        date: reviewDate, window,
        type: 'review',
        domain: 'quality',
        itemKey: docKey,
        itemLabel: doc?.label ?? docKey,
        documentKey: docKey,
        severity: 'low',
      })
    }
  }

  // Sort by date ascending
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return entries
}

// ==========================================================================
// PART 6 — Dashboard State Builder
// ==========================================================================

export function buildComplianceDashboard(
  state: ComplianceKnowledgeState,
  catalog: { items: ComplianceItem[]; documents: ComplianceDocument[] },
  referenceDate: Date = new Date(),
): ComplianceDashboardState {
  const risks = detectComplianceRisks(state, catalog, referenceDate)
  const timeline = generateComplianceTimeline(state, catalog, referenceDate)
  const now = referenceDate

  // Quality items
  const qualityItems = catalog.items.filter((i) => i.domain === 'quality')
  const qualityDocumented = qualityItems.filter((i) => state.documentedItems.has(i.key)).length
  const qualityMissing = qualityItems.length - qualityDocumented

  // Regulatory items
  const regulatoryItems = catalog.items.filter((i) => i.domain === 'regulatory')
  const regulatoryDocumented = regulatoryItems.filter((i) => state.documentedItems.has(i.key)).length
  const regulatoryMissing = regulatoryItems.length - regulatoryDocumented

  // Documents
  const totalDocs = catalog.documents.length
  const uploadedDocs = state.uploadedDocuments.size
  const missingDocs = totalDocs - uploadedDocs

  // Expired
  const nowTime = now.getTime()
  const DAY_MS = 86_400_000
  const expiredDocs: ComplianceDashboardState['expiredDocuments'] = []
  const expiringDocs: ComplianceDashboardState['expiringDocuments'] = []

  for (const [docKey, expiryDate] of state.documentExpirations) {
    const expiry = new Date(expiryDate).getTime()
    const diffDays = Math.ceil((expiry - nowTime) / DAY_MS)
    const doc = catalog.documents.find((d) => d.key === docKey)
    if (diffDays < 0) {
      expiredDocs.push({ key: docKey, label: doc?.label ?? docKey, domain: doc?.domain ?? 'quality', expiredDays: Math.abs(diffDays) })
    } else if (diffDays <= 90) {
      expiringDocs.push({ key: docKey, label: doc?.label ?? docKey, domain: doc?.domain ?? 'quality', daysUntilExpiry: diffDays })
    }
  }

  // License counts (regulatory items that expire)
  const regulatoryExpiringItems = regulatoryItems.filter((i) => i.expires)
  const validLicenses = regulatoryDocumented - state.documentExpirations.size // simplified
  const expiredLicenses = expiredDocs.filter((d) => d.domain === 'regulatory').length
  const expiringLicenses = expiringDocs.filter((d) => d.domain === 'regulatory').length

  // CAPAs
  let capasOpen = 0, capasOverdue = 0
  for (const [, capa] of state.capaStatus) {
    if (capa.open) { capasOpen++; if (capa.dueDate && new Date(capa.dueDate).getTime() < nowTime) capasOverdue++ }
  }

  // Training
  let trainingComplete = 0, trainingIncomplete = 0
  for (const [, train] of state.trainingStatus) {
    train.completed ? trainingComplete++ : trainingIncomplete++
  }

  // Audits
  let auditsCompleted = 0, auditsPending = 0
  for (const [, audit] of state.auditStatus) {
    audit.completed ? auditsCompleted++ : auditsPending++
  }

  // Health scores (0-100)
  const totalTracked = qualityItems.length + regulatoryItems.length
  const totalDocumented = qualityDocumented + regulatoryDocumented
  const totalRequired = catalog.items.filter((i) => i.required).length
  const requiredDocumented = catalog.items.filter((i) => i.required && state.documentedItems.has(i.key)).length

  const criticalRisks = risks.filter((r) => r.severity === 'critical').length
  const highRisks = risks.filter((r) => r.severity === 'high').length

  const qualityScore = qualityItems.length > 0
    ? Math.round((qualityDocumented / qualityItems.length) * 100)
    : 0
  const regulatoryScore = regulatoryItems.length > 0
    ? Math.round((regulatoryDocumented / regulatoryItems.length) * 100)
    : 0
  const healthScore = totalTracked > 0
    ? Math.round((totalDocumented / totalTracked) * 100) - (criticalRisks * 5 + highRisks * 2)
    : 0

  // Determine status
  let status: ComplianceStatus = 'empty'
  if (totalDocumented === 0) {
    status = 'empty'
  } else if (expiredDocs.length > 0 || criticalRisks > 0) {
    status = 'at_risk'
  } else if (requiredDocumented === totalRequired && missingDocs === 0 && highRisks === 0) {
    status = 'ready_for_promotion'
  } else if (risks.length > 0) {
    status = 'partially_documented'
  } else {
    status = 'active'
  }

  // High priority actions (top 5 by severity)
  const sortedRisks = [...risks].sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3 }
    return sev[a.severity] - sev[b.severity]
  }).slice(0, 5)

  return {
    status,
    overview: {
      totalKnowledgeItems: totalTracked,
      documentedItems: totalDocumented,
      undocumentedItems: totalTracked - totalDocumented,
      totalDocuments: totalDocs,
      uploadedDocuments: uploadedDocs,
      missingDocuments: missingDocs,
      expiredDocuments: expiredDocs.length,
      expiringSoon: expiringDocs.length,
      gaps: risks.map((r) => ({
        gapType: r.riskType,
        severity: r.severity,
        domain: r.domain,
        itemKey: r.relatedItem,
        documentKey: r.relatedDocument,
        reason: r.reason,
        recommendedAction: r.recommendedAction,
        detectedAt: now.toISOString(),
      })),
      healthScore: Math.max(0, Math.min(100, healthScore)),
    },
    quality: {
      documentedItems: qualityDocumented,
      missingItems: qualityMissing,
      sopReviewsPending: state.documentReviewDates.size,
      capasOpen,
      capasOverdue,
      auditsCompleted,
      auditsPending,
      trainingComplete,
      trainingIncomplete,
      healthScore: Math.max(0, qualityScore),
    },
    regulatory: {
      documentedItems: regulatoryDocumented,
      missingItems: regulatoryMissing,
      validLicenses,
      expiredLicenses,
      expiringLicenses,
      validCertifications: 0,
      expiredCertifications: 0,
      validInsurance: 0,
      expiredInsurance: 0,
      healthScore: Math.max(0, regulatoryScore),
    },
    expiringDocuments: expiringDocs,
    expiredDocuments: expiredDocs,
    pendingReviews: state.documentReviewDates.size > 0
      ? Array.from(state.documentReviewDates.entries()).map(([key, date]) => ({
        key, label: key, domain: 'quality' as const, type: 'review',
      }))
      : [],
    highPriorityActions: sortedRisks.map((r) => ({
      description: r.recommendedAction,
      domain: r.domain,
      severity: r.severity,
      itemKey: r.relatedItem ?? r.relatedDocument ?? 'unknown',
    })),
  }
}

// ==========================================================================
// PART 7 — UX States
// ==========================================================================

export interface UXStateDefinition {
  status: ComplianceStatus
  label: string
  description: string
  whatUserSees: string
  recommendedAction: string
  whatChanges: string
}

export const COMPLIANCE_UX_STATES: Record<ComplianceStatus, UXStateDefinition> = {
  empty: {
    status: 'empty',
    label: 'No Compliance Data',
    description: 'Your institution has not entered any quality or regulatory information.',
    whatUserSees: 'Empty dashboard — zero items documented. Kadarn shows "Get Started" prompt with clear first steps.',
    recommendedAction: 'Start with your Quality Manual and CLIA Certificate — these unlock the most downstream value.',
    whatChanges: 'After documenting 3+ critical items, status upgrades to "Partially Documented".',
  },
  partially_documented: {
    status: 'partially_documented',
    label: 'Compliance In Progress',
    description: 'Some compliance items are documented but gaps exist.',
    whatUserSees: 'Dashboard with checkmarks for documented items, "Add" prompts for missing critical items. Health score visible. Risk list present.',
    recommendedAction: 'Address critical risks first — expired licenses and missing required documents block readiness.',
    whatChanges: 'Closing all critical gaps and uploading all required documents upgrades to "Active" or "Ready for Promotion".',
  },
  active: {
    status: 'active',
    label: 'Compliance Active',
    description: 'All critical compliance items are documented and current.',
    whatUserSees: 'Green health score. No critical risks. Timeline shows upcoming renewals (not past-due items). "Next actions" include scheduled reviews.',
    recommendedAction: 'Maintain currency — schedule periodic reviews, track upcoming expirations, keep training current.',
    whatChanges: 'Maintaining this state for 30+ days without new gaps qualifies for "Ready for Promotion".',
  },
  at_risk: {
    status: 'at_risk',
    label: 'Compliance At Risk',
    description: 'Critical compliance gaps detected — expired licenses, missing insurance, overdue CAPAs.',
    whatUserSees: 'Dashboard header is yellow/red. Critical risks pinned at top. Expired items highlighted. Health score below 60.',
    recommendedAction: 'Resolve expired items immediately. Escalate overdue CAPAs. Verify insurance is current.',
    whatChanges: 'Resolving all critical items and uploading current documents restores "Active" status.',
  },
  expired: {
    status: 'expired',
    label: 'Compliance Expired',
    description: 'Multiple critical licenses, certifications, or insurance policies are expired.',
    whatUserSees: 'Red banner — "Your compliance profile has expired items that may affect program eligibility." All expired items listed with days overdue.',
    recommendedAction: 'Renew expired licenses immediately. Contact your quality director or regulatory lead.',
    whatChanges: 'Once all expired critical items are renewed and documented, status upgrades to "At Risk" or "Active".',
  },
  ready_for_promotion: {
    status: 'ready_for_promotion',
    label: 'Ready for Evidence Promotion',
    description: 'All required compliance knowledge is documented, current, and verified. Ready to feed downstream engines.',
    whatUserSees: 'Gold/green banner — "Your compliance profile is complete. You can now promote to Evidence Objects." Dashboard shows 100% documented, zero critical risks.',
    recommendedAction: 'Review your compliance profile, confirm all documents are current, then trigger Evidence Promotion.',
    whatChanges: 'After promotion, compliance knowledge becomes Evidence Objects. Status resets to "Active" while downstream engines consume evidence.',
  },
}

// ==========================================================================
// PART 8 — Knowledge Operations
// ==========================================================================

export interface ComplianceOperation {
  op: string
  payload: Record<string, unknown>
  timestamp: string
}

export function renewDocument(
  state: ComplianceKnowledgeState,
  documentKey: string,
  newExpiryDate: string,
): { state: ComplianceKnowledgeState; operation: ComplianceOperation } {
  state.documentExpirations.set(documentKey, newExpiryDate)
  state.lastUpdated = new Date().toISOString()
  return {
    state,
    operation: {
      op: 'renew_document',
      payload: { documentKey, newExpiryDate },
      timestamp: new Date().toISOString(),
    },
  }
}

export function replaceDocument(
  state: ComplianceKnowledgeState,
  oldDocumentKey: string,
  newDocumentKey: string,
  newExpiryDate: string,
): { state: ComplianceKnowledgeState; operation: ComplianceOperation } {
  state.uploadedDocuments.delete(oldDocumentKey)
  state.documentExpirations.delete(oldDocumentKey)
  state.documentReviewDates.delete(oldDocumentKey)

  state.uploadedDocuments.add(newDocumentKey)
  state.documentExpirations.set(newDocumentKey, newExpiryDate)
  state.lastUpdated = new Date().toISOString()

  return {
    state,
    operation: {
      op: 'replace_document',
      payload: { oldDocumentKey, newDocumentKey, newExpiryDate },
      timestamp: new Date().toISOString(),
    },
  }
}

export function markDocumentReviewed(
  state: ComplianceKnowledgeState,
  documentKey: string,
  nextReviewDate: string,
): { state: ComplianceKnowledgeState; operation: ComplianceOperation } {
  state.documentReviewDates.set(documentKey, nextReviewDate)
  state.lastUpdated = new Date().toISOString()
  return {
    state,
    operation: {
      op: 'mark_reviewed',
      payload: { documentKey, nextReviewDate },
      timestamp: new Date().toISOString(),
    },
  }
}

export function assignItemOwner(
  state: ComplianceKnowledgeState,
  itemKey: string,
  personKey: string,
): { state: ComplianceKnowledgeState; operation: ComplianceOperation } {
  state.itemOwners.set(itemKey, personKey)
  state.lastUpdated = new Date().toISOString()
  return {
    state,
    operation: {
      op: 'assign_owner',
      payload: { itemKey, personKey },
      timestamp: new Date().toISOString(),
    },
  }
}

export function recordItemDocumented(
  state: ComplianceKnowledgeState,
  itemKey: string,
): { state: ComplianceKnowledgeState; operation: ComplianceOperation } {
  state.documentedItems.add(itemKey)
  state.lastUpdated = new Date().toISOString()
  return {
    state,
    operation: {
      op: 'record_item',
      payload: { itemKey },
      timestamp: new Date().toISOString(),
    },
  }
}

export function uploadDocument(
  state: ComplianceKnowledgeState,
  documentKey: string,
  expiryDate?: string,
  reviewDate?: string,
): { state: ComplianceKnowledgeState; operation: ComplianceOperation } {
  state.uploadedDocuments.add(documentKey)
  if (expiryDate) state.documentExpirations.set(documentKey, expiryDate)
  if (reviewDate) state.documentReviewDates.set(documentKey, reviewDate)
  state.lastUpdated = new Date().toISOString()
  return {
    state,
    operation: {
      op: 'upload_document',
      payload: { documentKey, expiryDate, reviewDate },
      timestamp: new Date().toISOString(),
    },
  }
}

export function archiveObsoleteItem(
  state: ComplianceKnowledgeState,
  itemKey: string,
): { state: ComplianceKnowledgeState; operation: ComplianceOperation } {
  state.documentedItems.delete(itemKey)
  state.itemOwners.delete(itemKey)
  state.lastUpdated = new Date().toISOString()
  return {
    state,
    operation: {
      op: 'archive_item',
      payload: { itemKey },
      timestamp: new Date().toISOString(),
    },
  }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const COMPLIANCE_ECOSYSTEM = {
  buildCatalog: buildComplianceCatalog,
  createState: createComplianceKnowledgeState,
  detectRisks: detectComplianceRisks,
  generateTimeline: generateComplianceTimeline,
  buildDashboard: buildComplianceDashboard,
  uxStates: COMPLIANCE_UX_STATES,
  ops: {
    renewDocument, replaceDocument, markDocumentReviewed,
    assignItemOwner, recordItemDocumented, uploadDocument, archiveObsoleteItem,
  },
}
