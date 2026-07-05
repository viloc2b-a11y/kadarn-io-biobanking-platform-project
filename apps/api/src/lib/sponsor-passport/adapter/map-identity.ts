/**
 * RC-11.6 — Organization record → PassportIdentity (no invented relationships).
 */

import type { PassportIdentity } from '../types'
import type { OrganizationRecord } from './queries'
import type { PortfolioAllowlistEntry } from './portfolio-allowlist'

const ORG_SOURCE = 'Organization registration'

function formatLocation(org: OrganizationRecord): string | null {
  const parts = [org.city, org.region, org.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export function mapOrganizationToPassportIdentity(params: {
  organization: OrganizationRecord | null
  allowlistEntry?: PortfolioAllowlistEntry
}): PassportIdentity {
  const { organization, allowlistEntry } = params
  const names: PassportIdentity['names'] = []
  const locations: PassportIdentity['locations'] = []

  if (organization?.name) {
    names.push({
      label: 'Primary name',
      value: organization.name,
      source: ORG_SOURCE,
    })
  }

  if (organization?.legalName && organization.legalName !== organization.name) {
    names.push({
      label: 'Legal name',
      value: organization.legalName,
      source: ORG_SOURCE,
    })
  }

  if (names.length === 0 && allowlistEntry?.displayName) {
    names.push({
      label: 'Primary name',
      value: allowlistEntry.displayName,
      source: 'Portfolio allowlist',
    })
  }

  const orgLocation = organization ? formatLocation(organization) : null
  if (orgLocation) {
    locations.push({
      label: 'Primary site',
      value: orgLocation,
      source: ORG_SOURCE,
    })
  } else if (allowlistEntry?.location) {
    locations.push({
      label: 'Primary site',
      value: allowlistEntry.location,
      source: 'Portfolio allowlist',
    })
  }

  return {
    names,
    locations,
    relationships: [],
  }
}

export function resolveDisplayName(params: {
  organization: OrganizationRecord | null
  allowlistEntry?: PortfolioAllowlistEntry
  institutionId: string
}): string {
  return (
    params.organization?.name ??
    params.allowlistEntry?.displayName ??
    params.institutionId
  )
}
