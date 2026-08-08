// ==========================================================================
// Feature Flags — lightweight, env-based, no framework dependency
// ==========================================================================

/**
 * Marketplace is BUILT_BUT_DEFERRED per MVP scope §A.2 #1.
 * Set NEXT_PUBLIC_ENABLE_MARKETPLACE=true to re-enable.
 * Default: disabled (hidden from navigation, entry points, and redirects).
 */
export const ENABLE_MARKETPLACE =
  process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE === 'true'
