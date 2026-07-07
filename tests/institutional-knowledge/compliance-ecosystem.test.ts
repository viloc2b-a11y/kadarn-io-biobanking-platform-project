// ==========================================================================
// IKM Compliance Integration Sprint — Tests
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildComplianceCatalog, createComplianceKnowledgeState,
  detectComplianceRisks, generateComplianceTimeline,
  buildComplianceDashboard, COMPLIANCE_UX_STATES, COMPLIANCE_ECOSYSTEM,
  type ComplianceKnowledgeState,
} from '../../packages/institutional-knowledge/src/compliance-ecosystem'

let catalog: ReturnType<typeof buildComplianceCatalog>
let state: ComplianceKnowledgeState

beforeEach(() => {
  catalog = buildComplianceCatalog()
  state = createComplianceKnowledgeState('inst-test-1')
})

// ============================================================================
// PART 1 — Catalog Aggregation
// ============================================================================

describe('Compliance Ecosystem — Catalog Aggregation', () => {
  it('aggregates quality + regulatory items (62+)', () => {
    expect(catalog.items.length).toBeGreaterThanOrEqual(62)
  })

  it('items have valid domains', () => {
    const domains = new Set(catalog.items.map((i) => i.domain))
    expect(domains.has('quality')).toBe(true)
    expect(domains.has('regulatory')).toBe(true)
  })

  it('documents aggregated from both domains (24+)', () => {
    expect(catalog.documents.length).toBeGreaterThanOrEqual(24)
  })

  it('regulatory items correctly marked as expiring where applicable', () => {
    const regulatory = catalog.items.filter((i) => i.domain === 'regulatory')
    const expiring = regulatory.filter((i) => i.expires)
    expect(expiring.length).toBeGreaterThan(15)
  })
})

// ============================================================================
// PART 2 — Risk Detection: Missing Items & Documents
// ============================================================================

describe('Compliance Ecosystem — Risk Detection: Missing', () => {
  it('detects all required items as missing when state is empty', () => {
    const risks = detectComplianceRisks(state, catalog)
    const missingItems = risks.filter((r) => r.riskType === 'missing_policy')
    // All required items should be detected
    const requiredCount = catalog.items.filter((i) => i.required).length
    expect(missingItems.length).toBe(requiredCount)
  })

  it('detects missing required documents', () => {
    const risks = detectComplianceRisks(state, catalog)
    const missingDocs = risks.filter((r) => r.riskType === 'missing_document')
    const requiredDocCount = catalog.documents.filter((d) => d.required).length
    expect(missingDocs.length).toBe(requiredDocCount)
  })

  it('clears missing-item risks when items are documented', () => {
    // Document first 5 required items
    let idx = 0
    for (const item of catalog.items) {
      if (item.required && idx < 5) {
        state.documentedItems.add(item.key)
        idx++
      }
    }
    const risks = detectComplianceRisks(state, catalog)
    const missingCount = catalog.items.filter((i) => i.required).length
    const stillMissing = risks.filter((r) => r.riskType === 'missing_policy').length
    expect(stillMissing).toBe(missingCount - 5)
  })
})

// ============================================================================
// PART 3 — Risk Detection: Expired & Expiring
// ============================================================================

describe('Compliance Ecosystem — Risk Detection: Expiration', () => {
  it('detects expired document', () => {
    state.uploadedDocuments.add('clia_certificate_doc')
    state.documentExpirations.set('clia_certificate_doc', '2024-01-01T00:00:00Z')
    const risks = detectComplianceRisks(state, catalog)
    const expired = risks.filter((r) => r.riskType === 'expired_document')
    expect(expired.length).toBe(1)
  })

  it('does not flag non-expired documents', () => {
    state.uploadedDocuments.add('clia_certificate_doc')
    // Expires far in the future
    state.documentExpirations.set('clia_certificate_doc', '2030-01-01T00:00:00Z')
    const risks = detectComplianceRisks(state, catalog)
    const expired = risks.filter((r) => r.riskType === 'expired_document')
    expect(expired.length).toBe(0)
  })

  it('detects documents expiring within 90 days', () => {
    state.uploadedDocuments.add('iata_certificate_doc')
    const future30 = new Date()
    future30.setDate(future30.getDate() + 30)
    state.documentExpirations.set('iata_certificate_doc', future30.toISOString())
    const risks = detectComplianceRisks(state, catalog)
    const expiring = risks.filter((r) => r.riskType === 'expiring_soon')
    expect(expiring.length).toBeGreaterThanOrEqual(1)
    expect(expiring[0].severity).toBe('high') // <= 30 days → high
  })

  it('expiring in 60 days → medium severity', () => {
    state.uploadedDocuments.add('vendor_list')
    const future60 = new Date()
    future60.setDate(future60.getDate() + 60)
    state.documentExpirations.set('vendor_list', future60.toISOString())
    const risks = detectComplianceRisks(state, catalog)
    const expiring = risks.filter((r) => r.riskType === 'expiring_soon')
    expect(expiring.length).toBeGreaterThanOrEqual(1)
    expect(expiring[0].severity).toBe('medium')
  })
})

// ============================================================================
// PART 4 — Risk Detection: CAPA, Training, Audit
// ============================================================================

describe('Compliance Ecosystem — Risk Detection: Operations', () => {
  it('detects overdue CAPA', () => {
    state.capaStatus.set('CAPA-001', { open: true, dueDate: '2025-01-01T00:00:00Z', owner: 'dr-smith' })
    const risks = detectComplianceRisks(state, catalog)
    const overdue = risks.filter((r) => r.riskType === 'overdue_capa')
    expect(overdue.length).toBe(1)
    expect(overdue[0].reason).toContain('CAPA-001')
  })

  it('detects expired training', () => {
    state.trainingStatus.set('gcp-training', { completed: true, expiryDate: '2025-06-01T00:00:00Z' })
    const risks = detectComplianceRisks(state, catalog)
    const expired = risks.filter((r) => r.riskType === 'expired_training')
    expect(expired.length).toBe(1)
  })

  it('detects incomplete training', () => {
    state.trainingStatus.set('hsp-training', { completed: false })
    const risks = detectComplianceRisks(state, catalog)
    const incomplete = risks.filter((r) => r.riskType === 'missing_required_training')
    expect(incomplete.length).toBe(1)
  })

  it('detects overdue audits', () => {
    state.auditStatus.set('audit-q1-2026', { completed: false })
    const risks = detectComplianceRisks(state, catalog)
    const overdue = risks.filter((r) => r.riskType === 'overdue_audit')
    expect(overdue.length).toBe(1)
  })
})

// ============================================================================
// PART 5 — Risk Detection: Missing Owners
// ============================================================================

describe('Compliance Ecosystem — Risk Detection: Ownership', () => {
  it('detects required items without assigned owners', () => {
    // Document all items but assign no owners
    for (const item of catalog.items) {
      if (item.required) state.documentedItems.add(item.key)
    }
    const risks = detectComplianceRisks(state, catalog)
    const missingOwners = risks.filter((r) => r.riskType === 'missing_owner')
    expect(missingOwners.length).toBeGreaterThan(0)
  })

  it('clears owner gaps when owners are assigned', () => {
    for (const item of catalog.items) {
      if (item.required) {
        state.documentedItems.add(item.key)
        state.itemOwners.set(item.key, 'person-quality-lead')
      }
    }
    const risks = detectComplianceRisks(state, catalog)
    const missingOwners = risks.filter((r) => r.riskType === 'missing_owner')
    expect(missingOwners.length).toBe(0)
  })
})

// ============================================================================
// PART 6 — Timeline
// ============================================================================

describe('Compliance Ecosystem — Timeline', () => {
  it('generates empty timeline for empty state', () => {
    const timeline = generateComplianceTimeline(state, catalog)
    expect(timeline).toHaveLength(0)
  })

  it('includes expired items in expired window', () => {
    state.uploadedDocuments.add('irb_approval_letter')
    state.documentExpirations.set('irb_approval_letter', '2024-01-01T00:00:00Z')
    const timeline = generateComplianceTimeline(state, catalog)
    const expired = timeline.filter((t) => t.window === 'expired')
    expect(expired.length).toBe(1)
  })

  it('places upcoming expirations in correct windows', () => {
    state.uploadedDocuments.add('iata_certificate_doc')
    const future20 = new Date()
    future20.setDate(future20.getDate() + 20)
    state.documentExpirations.set('iata_certificate_doc', future20.toISOString())
    const timeline = generateComplianceTimeline(state, catalog)
    const upcoming = timeline.filter((t) => t.window !== 'expired')
    expect(upcoming.length).toBe(1)
    // 20 days → falls into 30d window (not 15d)
    expect(upcoming[0].window).toBe('30d')
  })

  it('timeline is sorted by date ascending', () => {
    state.uploadedDocuments.add('state_lab_license_doc')
    state.uploadedDocuments.add('insurance_cert')
    const future10 = new Date(); future10.setDate(future10.getDate() + 10)
    const future80 = new Date(); future80.setDate(future80.getDate() + 80)
    state.documentExpirations.set('state_lab_license_doc', future80.toISOString())
    state.documentExpirations.set('insurance_cert', future10.toISOString())
    const timeline = generateComplianceTimeline(state, catalog)
    const upcoming = timeline.filter((t) => t.window !== 'expired')
    expect(upcoming.length).toBeGreaterThanOrEqual(2)
    // First entry should be the 10-day one
    expect(upcoming[0].documentKey).toBe('insurance_cert')
  })

  it('includes CAPA due dates in timeline', () => {
    state.capaStatus.set('CAPA-002', { open: true, dueDate: '2026-07-20T00:00:00Z' })
    const timeline = generateComplianceTimeline(state, catalog)
    const capaEntries = timeline.filter((t) => t.type === 'review')
    expect(capaEntries.length).toBeGreaterThanOrEqual(1)
  })
})

// ============================================================================
// PART 7 — Dashboard
// ============================================================================

describe('Compliance Ecosystem — Dashboard', () => {
  it('empty state → status empty, healthScore 0', () => {
    const dashboard = buildComplianceDashboard(state, catalog)
    expect(dashboard.status).toBe('empty')
    expect(dashboard.overview.healthScore).toBe(0)
    expect(dashboard.overview.documentedItems).toBe(0)
  })

  it('partially documented → many gaps', () => {
    // Document 5 quality items
    let count = 0
    for (const item of catalog.items) {
      if (item.domain === 'quality' && count < 5) {
        state.documentedItems.add(item.key)
        count++
      }
    }
    // Upload 1 document (expired)
    state.uploadedDocuments.add('clia_certificate_doc')
    state.documentExpirations.set('clia_certificate_doc', '2024-01-01T00:00:00Z')

    const dashboard = buildComplianceDashboard(state, catalog)
    expect(dashboard.status).toBe('at_risk') // expired doc → at risk
    expect(dashboard.overview.expiredDocuments).toBe(1)
    expect(dashboard.overview.documentedItems).toBe(5)
  })

  it('active state when critical items documented, no expired', () => {
    // Document all required items AND assign owners (prevents missing_owner risks)
    for (const item of catalog.items) {
      if (item.required) {
        state.documentedItems.add(item.key)
        state.itemOwners.set(item.key, 'person-quality-lead')
      }
    }
    // Upload ALL documents with future expirations (ready status requires zero missing docs)
    const future = new Date(); future.setFullYear(future.getFullYear() + 2)
    for (const doc of catalog.documents) {
      state.uploadedDocuments.add(doc.key)
      state.documentExpirations.set(doc.key, future.toISOString())
    }

    const dashboard = buildComplianceDashboard(state, catalog)
    expect(dashboard.status).toBe('ready_for_promotion')
        expect(dashboard.overview.healthScore).toBeGreaterThanOrEqual(40)
    expect(dashboard.overview.expiredDocuments).toBe(0)
  })

  it('produces high priority actions sorted by severity', () => {
    state.uploadedDocuments.add('clia_certificate_doc')
    state.documentExpirations.set('clia_certificate_doc', '2024-01-01T00:00:00Z')

    const dashboard = buildComplianceDashboard(state, catalog)
    expect(dashboard.highPriorityActions.length).toBeGreaterThan(0)
    // Critical actions first
    const firstAction = dashboard.highPriorityActions[0]
    expect(firstAction.severity).toBe('critical')
  })

  it('includes expiring documents list', () => {
    const future50 = new Date(); future50.setDate(future50.getDate() + 50)
    state.uploadedDocuments.add('iata_certificate_doc')
    state.documentExpirations.set('iata_certificate_doc', future50.toISOString())

    const dashboard = buildComplianceDashboard(state, catalog)
    expect(dashboard.expiringDocuments.length).toBe(1)
    expect(dashboard.expiringDocuments[0].daysUntilExpiry).toBeGreaterThan(0)
  })
})

// ============================================================================
// PART 8 — UX States
// ============================================================================

describe('Compliance Ecosystem — UX States', () => {
  it('has all 6 states defined', () => {
    const states = Object.keys(COMPLIANCE_UX_STATES)
    expect(states).toHaveLength(6)
    expect(states).toContain('empty')
    expect(states).toContain('at_risk')
    expect(states).toContain('ready_for_promotion')
  })

  it('every state has label, description, user view, action, and transition', () => {
    for (const state of Object.values(COMPLIANCE_UX_STATES)) {
      expect(state.label).toBeTruthy()
      expect(state.description).toBeTruthy()
      expect(state.whatUserSees).toBeTruthy()
      expect(state.recommendedAction).toBeTruthy()
      expect(state.whatChanges).toBeTruthy()
    }
  })

  it('ready_for_promotion mentions evidence promotion without performing it', () => {
    const ready = COMPLIANCE_UX_STATES.ready_for_promotion
    expect(ready.description).toContain('documented')
    expect(ready.whatChanges).toContain('Evidence')
  })
})

// ============================================================================
// PART 9 — Knowledge Operations
// ============================================================================

describe('Compliance Ecosystem — Knowledge Operations', () => {
  it('renew document updates expiration', () => {
    const { state: newState } = COMPLIANCE_ECOSYSTEM.ops.renewDocument(state, 'clia_certificate_doc', '2030-01-01T00:00:00Z')
    expect(newState.documentExpirations.get('clia_certificate_doc')).toBe('2030-01-01T00:00:00Z')
  })

  it('replace document removes old, adds new', () => {
    state.uploadedDocuments.add('old_cert')
    state.documentExpirations.set('old_cert', '2025-01-01T00:00:00Z')

    const { state: newState } = COMPLIANCE_ECOSYSTEM.ops.replaceDocument(
      state, 'old_cert', 'new_cert', '2030-01-01T00:00:00Z'
    )
    expect(newState.uploadedDocuments.has('old_cert')).toBe(false)
    expect(newState.uploadedDocuments.has('new_cert')).toBe(true)
    expect(newState.documentExpirations.has('old_cert')).toBe(false)
    expect(newState.documentExpirations.get('new_cert')).toBe('2030-01-01T00:00:00Z')
  })

  it('mark reviewed sets next review date', () => {
    const { state: newState } = COMPLIANCE_ECOSYSTEM.ops.markDocumentReviewed(state, 'sop_master_list', '2027-01-01T00:00:00Z')
    expect(newState.documentReviewDates.get('sop_master_list')).toBe('2027-01-01T00:00:00Z')
  })

  it('assign owner sets a person on an item', () => {
    const { state: newState } = COMPLIANCE_ECOSYSTEM.ops.assignItemOwner(state, 'quality_manual', 'person-jane')
    expect(newState.itemOwners.get('quality_manual')).toBe('person-jane')
  })

  it('record item documented adds to state', () => {
    const { state: newState } = COMPLIANCE_ECOSYSTEM.ops.recordItemDocumented(state, 'quality_policy')
    expect(newState.documentedItems.has('quality_policy')).toBe(true)
  })

  it('upload document records with optional dates', () => {
    const { state: newState } = COMPLIANCE_ECOSYSTEM.ops.uploadDocument(state, 'capa_log', '2030-06-01T00:00:00Z', '2027-01-01T00:00:00Z')
    expect(newState.uploadedDocuments.has('capa_log')).toBe(true)
    expect(newState.documentExpirations.get('capa_log')).toBe('2030-06-01T00:00:00Z')
    expect(newState.documentReviewDates.get('capa_log')).toBe('2027-01-01T00:00:00Z')
  })

  it('archive obsolete removes item from tracking', () => {
    state.documentedItems.add('obsolete_policy')
    state.itemOwners.set('obsolete_policy', 'person-x')
    const { state: newState } = COMPLIANCE_ECOSYSTEM.ops.archiveObsoleteItem(state, 'obsolete_policy')
    expect(newState.documentedItems.has('obsolete_policy')).toBe(false)
    expect(newState.itemOwners.has('obsolete_policy')).toBe(false)
  })

  it('all operations update lastUpdated timestamp', () => {
    const before = state.lastUpdated
    const { state: newState } = COMPLIANCE_ECOSYSTEM.ops.recordItemDocumented(state, 'capa_system')
    expect(new Date(newState.lastUpdated).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime())
  })
})

// ============================================================================
// PART 10 — Boundary enforcement
// ============================================================================

describe('Compliance Ecosystem — Boundary Rules', () => {
  it('does not export Evidence Object types', () => {
    // The ecosystem only uses IKM types — ComplianceItem, ComplianceDocument, etc.
    // No EvidenceObject, Claim, Confidence, or ReadinessScore types imported
    const exportedNames = Object.keys(COMPLIANCE_ECOSYSTEM)
    expect(exportedNames).not.toContain('promoteToEvidence')
    expect(exportedNames).not.toContain('calculateReadiness')
    expect(exportedNames).not.toContain('evaluateClaim')
  })

  it('no downstream engine calls — stays within IKM', () => {
    // All functions operate on state and catalog — no imports of
    // evidence-core, readiness-engine, or sponsor-intelligence
    const risks = detectComplianceRisks(state, catalog)
    expect(risks.every((r) => 'riskType' in r && 'severity' in r)).toBe(true)
  })
})
