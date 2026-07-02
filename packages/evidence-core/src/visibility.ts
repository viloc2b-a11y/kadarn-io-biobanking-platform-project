// ==========================================================================
// Visibility metadata helpers (KEMS-001 §7)
// ==========================================================================

import type { VisibilityMetadata } from './types.js';

/**
 * Create site-level visibility (default for new evidence).
 * The owning organization sees everything.
 */
export function siteVisibility(organizationId: string): VisibilityMetadata {
  return {
    owningOrganizationId: organizationId,
    scope: 'site',
    authorizedSponsorIds: [],
  };
}

/**
 * Grant a sponsor access to specific evidence.
 */
export function sponsorAuthorizedVisibility(
  organizationId: string,
  sponsorIds: string[],
): VisibilityMetadata {
  return {
    owningOrganizationId: organizationId,
    scope: 'sponsor_authorized',
    authorizedSponsorIds: sponsorIds,
  };
}

/**
 * System-level visibility (internal Kadarn operations).
 */
export function systemVisibility(): VisibilityMetadata {
  return {
    owningOrganizationId: '__system__',
    scope: 'system',
    authorizedSponsorIds: [],
  };
}
