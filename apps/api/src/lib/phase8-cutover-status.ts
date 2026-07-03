// ==========================================================================
// Phase 8 cutover status — no @kadarn/published-view import (ops endpoint only)
// ==========================================================================

export const VIEW_MIGRATED_ROUTES = [
  '/api/v1/continuity/passport/:slug',
  '/api/v1/institution/public/:slug',
  '/api/v1/discovery/dashboard',
  '/api/v1/discovery/report',
] as const

export const VIEW_PENDING_ROUTES = [
  '/api/v1/institution/profile',
] as const

const legacyEnabled = process.env.LEGACY_PASSPORT_ENABLED !== 'false'

export function isLegacyPassportAdapterEnabled(): boolean {
  return legacyEnabled
}

export function getPhase8CutoverStatus() {
  return {
    sprint: '28K',
    legacy_passport_enabled: legacyEnabled,
    published_view_path: 'active' as const,
    compatibility_layer_retained: true,
    adapter_env_var: 'LEGACY_PASSPORT_ENABLED',
    rollback: 'Set LEGACY_PASSPORT_ENABLED=true (or unset) and restart API',
  }
}
