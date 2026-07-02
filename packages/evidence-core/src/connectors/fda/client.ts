// ==========================================================================
// FDA Inspection — Mockable API Client
// ==========================================================================
// Baseline AF-1.0. Sprint 19.3.
// ==========================================================================

import type { FDAInspection, FDAForm483, FDAWarningLetter, FDASearchParams } from './types.js';

export interface FDAApiClient {
  searchInspections(params: FDASearchParams): Promise<FDAInspection[]>;
  searchForm483(params: FDASearchParams): Promise<FDAForm483[]>;
  searchWarningLetters(params: FDASearchParams): Promise<FDAWarningLetter[]>;
}

export function createMockFDAClient(
  inspections: FDAInspection[],
  form483s: FDAForm483[],
  warningLetters: FDAWarningLetter[],
): FDAApiClient {
  const matchName = (name: string, params: FDASearchParams): boolean => {
    if (!params.facilityName) return true;
    return name.toLowerCase().includes(params.facilityName.toLowerCase());
  };

  return {
    async searchInspections(params) {
      return inspections.filter(i =>
        matchName(i.facilityName, params) &&
        (!params.city || i.facilityCity.toLowerCase() === params.city.toLowerCase()),
      ).slice(0, params.limit ?? 50);
    },
    async searchForm483(params) {
      return form483s.filter(f =>
        matchName(f.facilityName, params) &&
        (!params.city || f.facilityCity.toLowerCase() === params.city.toLowerCase()),
      ).slice(0, params.limit ?? 50);
    },
    async searchWarningLetters(params) {
      return warningLetters.filter(w =>
        matchName(w.facilityName, params) &&
        (!params.city || w.facilityCity.toLowerCase() === params.city.toLowerCase()),
      ).slice(0, params.limit ?? 50);
    },
  };
}

export function createFDAClient(baseUrl?: string): FDAApiClient {
  return createMockFDAClient([], [], []);
}
