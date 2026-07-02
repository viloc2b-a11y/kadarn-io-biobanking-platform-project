// ==========================================================================
// PubMed Connector — Types
// ==========================================================================
// Baseline AF-1.0. Sprint 19.2.
// PubMed = strong scientific evidence, weak institutional identity.
// ==========================================================================

export interface PubMedArticle {
  /** PubMed ID */
  pmid: string;
  /** Article title */
  title: string;
  /** Journal name */
  journal: string;
  /** Publication date (ISO 8601) */
  publicationDate: string;
  /** Authors */
  authors: string[];
  /** Affiliation strings per author/institution */
  affiliations: string[];
  /** DOI if available */
  doi: string | null;
  /** MeSH terms */
  meshTerms: string[];
  /** Publication type */
  publicationType: string[];
  /** Whether this references a clinical study */
  referencesClinicalStudy: boolean;
  /** Raw payload for audit */
  rawPayload: Record<string, unknown>;
  /** External URL */
  externalUrl: string;
}

export interface PubMedSearchParams {
  /** Institution name */
  institutionName: string;
  /** Optional investigator name */
  investigatorName?: string;
  /** Optional city */
  city?: string;
  /** Optional state */
  state?: string;
  /** Optional country */
  country?: string;
  /** Max results */
  limit?: number;
  /** Lookback years */
  lookbackYears?: number;
}

export interface PubMedIngestionResult {
  /** Total articles found */
  totalFound: number;
  /** Articles ingested as evidence */
  ingested: IngestedArticle[];
  /** Articles staged for manual review */
  staged: StagedArticle[];
  /** Duplicates skipped */
  duplicatesSkipped: number;
  /** Timestamp */
  ingestedAt: string;
}

export interface IngestedArticle {
  pmid: string;
  kadarnSiteId: string;
  evidenceNodeId: string;
  claimId: string | null;
}

export interface StagedArticle {
  pmid: string;
  stagingId: string;
  reason: string;
  confidence: 'medium' | 'low';
}
