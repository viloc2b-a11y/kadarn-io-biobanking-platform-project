// ==========================================================================
// ClinicalTrials.gov — Mockable API Client
// ==========================================================================
// Baseline AF-1.0. Sprint 19.1.
//
// In production, this would call the CT.gov API v2 (clinicaltrials.gov/api).
// For Sprint 19.1, the connector structure is implemented with a mock
// adapter that simulates API responses for testing.
// ==========================================================================

import type { CTGovStudy, CTGovSearchParams } from './types.js';

// --------------------------------------------------------------------------
// API client interface
// --------------------------------------------------------------------------

export interface CTGovApiClient {
  searchStudies(params: CTGovSearchParams): Promise<CTGovStudy[]>;
  getStudyById(nctId: string): Promise<CTGovStudy | null>;
}

// --------------------------------------------------------------------------
// Mock client for testing
// --------------------------------------------------------------------------

export function createMockClient(mockStudies: CTGovStudy[]): CTGovApiClient {
  return {
    async searchStudies(params: CTGovSearchParams): Promise<CTGovStudy[]> {
      const name = params.name.toLowerCase();
      return mockStudies.filter(s => {
        const facilityMatch = s.facilityName.toLowerCase().includes(name);
        const cityMatch = !params.city || s.facilityCity.toLowerCase() === params.city.toLowerCase();
        const stateMatch = !params.state || s.facilityState.toLowerCase() === params.state.toLowerCase();
        return facilityMatch && cityMatch && stateMatch;
      }).slice(0, params.limit ?? 50);
    },

    async getStudyById(nctId: string): Promise<CTGovStudy | null> {
      return mockStudies.find(s => s.nctId === nctId) ?? null;
    },
  };
}

// --------------------------------------------------------------------------
// Default factory (placeholder for production)
// --------------------------------------------------------------------------

export function createCTGovClient(baseUrl?: string): CTGovApiClient {
  // In production: return a real API client pointing to clinicaltrials.gov
  // For Sprint 19.1, returns mock because we're building the connector structure
  return createMockClient([]);
}
