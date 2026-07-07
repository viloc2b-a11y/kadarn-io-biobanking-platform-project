// ==========================================================================
// Phase 8 cutover status — re-exports route lists from @kadarn/published-view
// ==========================================================================

export {
  VIEW_MIGRATED_ROUTES,
  VIEW_PENDING_ROUTES,
} from '@kadarn/published-view'

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
