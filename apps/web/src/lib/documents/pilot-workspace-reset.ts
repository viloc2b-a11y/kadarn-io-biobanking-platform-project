// ==========================================================================
// KTP-1.5 — Pilot Workspace Reset Utility (LOOP 10C)
// ==========================================================================
// Cleans demo/walkthrough data from the onboarding store while preserving
// canonical entities (Organization, People, Facilities, Equipment, Studies).
//
// Current storage: localStorage / onboarding state
// DB state: 0 rows (no persistence yet)
// Storage state: no real files (simulated only)
// ==========================================================================

// --------------------------------------------------------------------------
// Inventory item
// --------------------------------------------------------------------------

export interface WorkspaceInventoryItem {
  id: string
  label: string
  source: 'localStorage' | 'mock' | 'database' | 'storage' | 'fixture'
  routingStatus?: string
  handlingMode?: string
  ownerEntity?: string
  isDemo: boolean
  isOrphan: boolean
  recommendedAction: 'delete' | 'archive' | 'preserve' | 'review'
}

export interface WorkspaceInventory {
  documentRecords: WorkspaceInventoryItem[]
  uploadedDocs: WorkspaceInventoryItem[]
  studyDocs: WorkspaceInventoryItem[]
  feasibilityFolder: WorkspaceInventoryItem[]
  evidenceNodes: WorkspaceInventoryItem[]
  packages: WorkspaceInventoryItem[]
  auditEvents: WorkspaceInventoryItem[]
  exports: WorkspaceInventoryItem[]
  entityRecords: WorkspaceInventoryItem[]
  summary: {
    totalItems: number
    demoItems: number
    orphanItems: number
    deleteRecommended: number
    preserveRecommended: number
    reviewRecommended: number
  }
}

export interface ResetResult {
  dryRun: boolean
  itemsAffected: number
  itemsDeleted: number
  itemsPreserved: number
  itemsMarkedReview: number
  dbCleanupSkipped: boolean
  dbCleanupReason?: string
  storageCleanupSkipped: boolean
  storageCleanupReason?: string
  warnings: string[]
}

// --------------------------------------------------------------------------
// Inventory scan
// --------------------------------------------------------------------------

/**
 * Scan the onboarding state and produce an inventory of all document-related data.
 * Identifies demo/walkthrough items, orphans, and recommends actions.
 */
export function scanWorkspace(params: {
  uploadedDocs: Array<{ label: string; type: string; uploaded: boolean; fileName?: string }>
  studyRecords: Array<{ id: string; studyTitle: string; documents: Array<{ id: string; label: string; isUploaded: boolean; documentType: string }> }>
  organizationName?: string
}): WorkspaceInventory {
  const items: WorkspaceInventoryItem[] = []
  const entityRecords: WorkspaceInventoryItem[] = []

  // Scan uploaded docs
  for (const doc of params.uploadedDocs) {
    const isDemo = doc.label.toLowerCase().includes('demo') ||
      doc.label.toLowerCase().includes('test') ||
      doc.label.toLowerCase().includes('walkthrough') ||
      doc.label.toLowerCase().includes('vilo') ||
      doc.label.toLowerCase().includes('mock')
    const isOrphan = !doc.uploaded

    items.push({
      id: doc.label,
      label: doc.fileName || doc.label,
      source: 'localStorage',
      isDemo,
      isOrphan,
      routingStatus: doc.uploaded ? 'assigned' : 'unassigned',
      recommendedAction: isDemo ? 'delete' : isOrphan ? 'review' : 'preserve',
    })
  }

  // Scan study experience documents
  for (const study of params.studyRecords) {
    for (const doc of study.documents) {
      const isDemo = study.studyTitle.toLowerCase().includes('demo') ||
        study.studyTitle.toLowerCase().includes('test') ||
        doc.label.toLowerCase().includes('demo')
      const isOrphan = !doc.isUploaded

      items.push({
        id: doc.id,
        label: `${study.studyTitle || 'Study'} — ${doc.label}`,
        source: 'localStorage',
        isDemo,
        isOrphan,
        ownerEntity: study.id,
        recommendedAction: isDemo ? 'delete' : isOrphan ? 'review' : 'preserve',
      })
    }
  }

  // Entity records (always preserve)
  if (params.organizationName) {
    entityRecords.push({
      id: 'org-1',
      label: params.organizationName,
      source: 'localStorage',
      isDemo: false,
      isOrphan: false,
      recommendedAction: 'preserve',
    })
  }

  const demoItems = items.filter(i => i.isDemo)
  const orphanItems = items.filter(i => i.isOrphan)
  const deleteRec = items.filter(i => i.recommendedAction === 'delete')
  const preserveRec = items.filter(i => i.recommendedAction === 'preserve')
  const reviewRec = items.filter(i => i.recommendedAction === 'review')

  return {
    documentRecords: items,
    uploadedDocs: items.filter(i => i.source === 'localStorage' && !i.ownerEntity),
    studyDocs: items.filter(i => i.ownerEntity),
    feasibilityFolder: [],
    evidenceNodes: [],
    packages: [],
    auditEvents: [],
    exports: [],
    entityRecords,
    summary: {
      totalItems: items.length,
      demoItems: demoItems.length,
      orphanItems: orphanItems.length,
      deleteRecommended: deleteRec.length,
      preserveRecommended: preserveRec.length,
      reviewRecommended: reviewRec.length,
    },
  }
}

// --------------------------------------------------------------------------
// Reset function
// --------------------------------------------------------------------------

/**
 * Reset pilot workspace by clearing demo/walkthrough data.
 *
 * Current scope: localStorage only (DB has 0 rows, storage has no real files).
 * Returns a clean onboarding state ready for Vilo pilot.
 */
export function resetPilotWorkspace(params: {
  uploadedDocs: Array<{ label: string; type: string; uploaded: boolean; fileName?: string }>
  studyRecords: Array<{ id: string; studyTitle: string; documents: Array<{ id: string; label: string; isUploaded: boolean; documentType: string }> }>
  dryRun?: boolean
}): ResetResult {
  const inventory = scanWorkspace(params)
  const warnings: string[] = []

  if (params.dryRun) {
    return {
      dryRun: true,
      itemsAffected: inventory.summary.deleteRecommended + inventory.summary.reviewRecommended,
      itemsDeleted: 0,
      itemsPreserved: inventory.summary.preserveRecommended,
      itemsMarkedReview: inventory.summary.reviewRecommended,
      dbCleanupSkipped: true,
      dbCleanupReason: 'DB has 0 rows — no cleanup needed.',
      storageCleanupSkipped: true,
      storageCleanupReason: 'No real files stored — simulated only.',
      warnings: [
        `Dry run: ${inventory.summary.deleteRecommended} items would be deleted.`,
        `${inventory.summary.reviewRecommended} items marked for review.`,
        `${inventory.summary.preserveRecommended} items preserved.`,
      ],
    }
  }

  // Real reset: remove demo items, preserve entity data
  const cleanedDocs = params.uploadedDocs.filter(doc => {
    const label = (doc.fileName || doc.label).toLowerCase()
    return !label.includes('demo') && !label.includes('test') && !label.includes('walkthrough') && !label.includes('vilo') && !label.includes('mock')
  })

  const cleanedStudies = params.studyRecords.filter(study => {
    const title = study.studyTitle.toLowerCase()
    return !title.includes('demo') && !title.includes('test') && !title.includes('mock')
  }).map(study => ({
    ...study,
    documents: study.documents.filter(doc => {
      const label = doc.label.toLowerCase()
      return !label.includes('demo') && !label.includes('test')
    }),
  }))

  const deletedCount = params.uploadedDocs.length - cleanedDocs.length +
    params.studyRecords.reduce((s, r) => s + r.documents.length, 0) -
    cleanedStudies.reduce((s, r) => s + r.documents.length, 0)

  if (deletedCount === 0) {
    warnings.push('No demo/walkthrough items found to delete. Workspace may already be clean.')
  }

  return {
    dryRun: false,
    itemsAffected: deletedCount,
    itemsDeleted: deletedCount,
    itemsPreserved: cleanedDocs.length + cleanedStudies.reduce((s, r) => s + r.documents.length, 0),
    itemsMarkedReview: 0,
    dbCleanupSkipped: true,
    dbCleanupReason: 'DB has 0 rows — no cleanup needed.',
    storageCleanupSkipped: true,
    storageCleanupReason: 'No real files stored — simulated only.',
    warnings,
  }
}

// --------------------------------------------------------------------------
// Clean seed for Vilo pilot
// --------------------------------------------------------------------------

export interface ViloPilotSeed {
  organization: string
  uploadedDocs: Array<{ label: string; type: string }>
  studyRecords: Array<{ id: string; studyTitle: string; protocolNumber: string; nct?: string }>
}

/**
 * Create a clean seed state for the Vilo pilot.
 * Empty document arrays — Vilo loads their real documents fresh.
 */
export function createViloPilotSeed(params: {
  organizationName?: string
  preserveStudies?: Array<{ id: string; studyTitle: string; protocolNumber: string; nct?: string }>
}): ViloPilotSeed {
  return {
    organization: params.organizationName || 'Vilo Research Group',
    uploadedDocs: [],
    studyRecords: params.preserveStudies || [],
  }
}
