// ==========================================================================
// ClinicalTrials.gov Connector — Types
// ==========================================================================
// Baseline AF-1.0. Sprint 19.1.
// ==========================================================================

export interface CTGovStudy {
  /** NCT identifier */
  nctId: string;
  /** Study title */
  title: string;
  /** Sponsor/collaborator */
  sponsor: string;
  /** Conditions being studied */
  conditions: string[];
  /** Therapeutic areas */
  therapeuticAreas: string[];
  /** Facility name */
  facilityName: string;
  /** Facility city */
  facilityCity: string;
  /** Facility state */
  facilityState: string;
  /** Facility country */
  facilityCountry: string;
  /** Recruitment status */
  recruitmentStatus: 'Recruiting' | 'Active, not recruiting' | 'Completed' | 'Terminated' | 'Withdrawn' | 'Unknown';
  /** Study phase */
  studyPhase: string;
  /** Start date */
  startDate: string;
  /** Completion date */
  completionDate: string;
  /** Principal investigator */
  principalInvestigator: string | null;
  /** Raw payload for audit */
  rawPayload: Record<string, unknown>;
  /** External URL */
  externalUrl: string;
  /** Whether protocol mentions biospecimens */
  mentionsBiospecimen: boolean;
}

export interface CTGovSearchParams {
  /** Institution/site name */
  name: string;
  /** Optional city */
  city?: string;
  /** Optional state */
  state?: string;
  /** Optional country */
  country?: string;
  /** Max results */
  limit?: number;
}

export interface CTGovIngestionResult {
  /** Total studies found */
  totalFound: number;
  /** Studies successfully ingested */
  ingested: IngestedStudy[];
  /** Studies that could not be resolved */
  unresolved: UnresolvedStudy[];
  /** Duplicates skipped */
  duplicatesSkipped: number;
  /** Timestamp */
  ingestedAt: string;
}

export interface IngestedStudy {
  nctId: string;
  kadarnSiteId: string;
  evidenceNodeId: string;
  claimId: string | null;
}

export interface UnresolvedStudy {
  nctId: string;
  facilityName: string;
  stagingId: string;
  reason: string;
}
