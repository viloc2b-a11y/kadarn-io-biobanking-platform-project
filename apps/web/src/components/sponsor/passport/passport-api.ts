'use client'

import { apiGet, ApiClientError } from '@/lib/api-client'
import { isE2EAuthClientEnabled } from '@/lib/e2e/mock-session'
import { getPassportByInstitutionId, getPortfolioInstitutions } from './passport-mock-data'
import type { InstitutionalPassport, PassportInstitutionSummary } from './passport-types'

interface PassportPortfolioIndexResponse {
  items: PassportInstitutionSummary[]
}

/**
 * RC-10.4 — Sponsor passport data access.
 * Normal runtime: authenticated fetch to /api/v1/sponsor/passports/*
 * E2E runtime: local mock fallback (no API JWT available).
 */
export async function fetchPassportPortfolioIndex(): Promise<PassportInstitutionSummary[]> {
  if (isE2EAuthClientEnabled()) {
    return getPortfolioInstitutions()
  }

  const response = await apiGet<PassportPortfolioIndexResponse>('/api/v1/sponsor/passports')
  return response.items
}

export async function fetchInstitutionalPassport(
  institutionId: string,
): Promise<InstitutionalPassport> {
  if (isE2EAuthClientEnabled()) {
    const passport = getPassportByInstitutionId(institutionId)
    if (!passport) {
      throw new ApiClientError(404, `Passport not found for institution ${institutionId}`)
    }
    return passport
  }

  return apiGet<InstitutionalPassport>(
    `/api/v1/sponsor/passports/${encodeURIComponent(institutionId)}`,
  )
}

export { ApiClientError }
