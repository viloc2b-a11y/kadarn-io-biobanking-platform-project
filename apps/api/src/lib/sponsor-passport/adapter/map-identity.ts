/**
 * RC-11.6 — Organization record → PassportIdentity (no invented relationships).
 */

import type { PassportIdentity } from '../types'
import type { SponsorPortfolioInstitutionReadModel } from '../portfolio/types'
import type { OrganizationRecord } from './queries'

const ORG_SOURCE = 'Organization registration'

function formatLocation(org: OrganizationRecord): string | null {
  const parts = [org.city, org.region, org.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export function mapOrganizationToPassportIdentity(params: {
  organization: OrganizationRecord | null
  portfolioEntry?: SponsorPortfolioInstitutionReadModel
}): PassportIdentity {
  const { organization, portfolioEntry } = params
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

  if (names.length === 0 && portfolioEntry?.displayName) {
    names.push({
      label: 'Primary name',
      value: portfolioEntry.displayName,
      source: 'Sponsor portfolio',
    })
  }

  const orgLocation = organization ? formatLocation(organization) : null
  if (orgLocation) {
    locations.push({
      label: 'Primary site',
      value: orgLocation,
      source: ORG_SOURCE,
    })
  } else if (portfolioEntry?.location) {
    locations.push({
      label: 'Primary site',
      value: portfolioEntry.location,
      source: 'Sponsor portfolio',
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
  portfolioEntry?: SponsorPortfolioInstitutionReadModel
  institutionId: string
}): string {
  return (
    params.organization?.name ??
    params.portfolioEntry?.displayName ??
    params.institutionId
  )
}
