// ==========================================================================
// Phase 8 integration guard — 28J / route convergence
// ==========================================================================

export const PHASE8_VIEW_BOUNDARY = 'ADR-030' as const

export function assertPublishedViewRead(source: string): void {
  const blocked = [
    'continuity_experience_claims:direct',
    'evidence-core:claims:product',
    'dashboard-engines:raw',
    'discovery_agent_outputs:capability:direct',
    'discovery_agent_outputs:claim:direct',
    'discovery_candidates:direct',
  ]
  if (blocked.includes(source)) {
    throw new Error(`Phase 8 boundary violation: ${source} must use PublishedView`)
  }
}

/** External-facing routes migrated to Published View service (28D+) */
export const VIEW_MIGRATED_ROUTES = [
  '/api/v1/continuity/passport/:slug',
  '/api/v1/institution/public/:slug',
  '/api/v1/discovery/dashboard',
  '/api/v1/discovery/report',
] as const

/**
 * Authenticated internal routes — deferred (not public claim/capability surfaces).
 * Must migrate before 28K cutover if exposed externally.
 */
export const VIEW_PENDING_ROUTES = [
  '/api/v1/institution/profile',
] as const
