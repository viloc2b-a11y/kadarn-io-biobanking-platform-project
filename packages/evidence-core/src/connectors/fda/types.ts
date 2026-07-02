// ==========================================================================
// FDA Inspection — Types
// ==========================================================================
// Baseline AF-1.0. Sprint 19.3.
// Three distinct evidence types: Classification, Form 483, Warning Letter.
// ==========================================================================

// --------------------------------------------------------------------------
// FDA Inspection Classification
// --------------------------------------------------------------------------

export type InspectionClassification = 'NAI' | 'VAI' | 'OAI';

export interface FDAInspection {
  /** FEI number of the inspected facility */
  fei: string;
  /** Inspection classification */
  classification: InspectionClassification;
  /** Inspection date */
  inspectionDate: string;
  /** Inspecting agency */
  inspectingAgency: string;
  /** Product type / area inspected */
  productType: string;
  /** Facility name as recorded by FDA */
  facilityName: string;
  /** Facility address */
  facilityCity: string;
  facilityState: string;
  facilityCountry: string;
  /** Whether this classification represents a negative finding (OAI) */
  isNegativeFinding: boolean;
  /** Raw payload */
  rawPayload: Record<string, unknown>;
  /** External URL */
  externalUrl: string;
}

// --------------------------------------------------------------------------
// Form 483 Observation
// --------------------------------------------------------------------------

export interface FDAForm483 {
  /** FEI number */
  fei: string;
  /** Observation ID */
  observationId: string;
  /** Observation description */
  observationText: string;
  /** Observation area (e.g. Sterility, Temperature Control) */
  observationArea: string;
  /** Inspection date */
  inspectionDate: string;
  /** Facility name */
  facilityName: string;
  facilityCity: string;
  facilityState: string;
  facilityCountry: string;
  /** Whether this observation has been resolved */
  resolved: boolean;
  /** Raw payload */
  rawPayload: Record<string, unknown>;
  externalUrl: string;
}

// --------------------------------------------------------------------------
// FDA Warning Letter
// --------------------------------------------------------------------------

export interface FDAWarningLetter {
  /** FEI number */
  fei: string;
  /** Warning letter ID */
  warningLetterId: string;
  /** Issue date */
  issueDate: string;
  /** Subject/Title */
  subject: string;
  /** Facility name */
  facilityName: string;
  facilityCity: string;
  facilityState: string;
  facilityCountry: string;
  /** Whether the warning letter has been closed */
  closed: boolean;
  /** Raw payload */
  rawPayload: Record<string, unknown>;
  externalUrl: string;
}

// --------------------------------------------------------------------------
// Search params
// --------------------------------------------------------------------------

export interface FDASearchParams {
  fei?: string;
  facilityName?: string;
  city?: string;
  state?: string;
  country?: string;
  limit?: number;
}

// --------------------------------------------------------------------------
// Ingestion results
// --------------------------------------------------------------------------

export interface FDAIngestionResult {
  inspectionsIngested: number;
  form483Ingested: number;
  warningLettersIngested: number;
  counterEvidenceCreated: number;
  unresolved: number;
  duplicatesSkipped: number;
  ingestedAt: string;
}
