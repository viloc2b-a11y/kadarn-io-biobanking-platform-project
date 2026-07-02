// ==========================================================================
// Institutional Timeline — Domain Types
// ==========================================================================
// Sprint 20B.1.
//
// Chronological reconstruction of institutional history.
// No Claims. No Confidence computation. No Discovery modification.
// Every event is traceable to evidence.
// ==========================================================================

export type DatePrecision = 'exact' | 'estimated_month' | 'estimated_year' | 'approximate_range';

export interface TimelineDate {
  /** ISO 8601 date string (YYYY-MM-DD or YYYY-MM or YYYY) */
  value: string;
  /** How precise this date is */
  precision: DatePrecision;
  /** Human-readable description of how this date was determined */
  rationale: string;
}

export type EventCategory =
  | 'clinical_trial'
  | 'publication'
  | 'certification'
  | 'equipment_acquisition'
  | 'facility_change'
  | 'investigator_joining'
  | 'capability_milestone'
  | 'regulatory_event'
  | 'organizational_change'
  | 'training_completed'
  | 'study_activity'
  | 'other';

export interface TimelineEvent {
  /** Unique event ID */
  eventId: string;
  /** Event date (may be estimated) */
  date: TimelineDate;
  /** Category */
  category: EventCategory;
  /** Short title */
  title: string;
  /** Narrative description */
  narrative: string;
  /** How confident we are this event occurred */
  confidence: number;
  /** Discovery entities that support this event */
  evidenceEntityIds: string[];
  /** Discovery relationships that support this event */
  evidenceRelationshipIds: string[];
  /** Source artifact IDs */
  sourceArtifactIds: string[];
  /** Whether this event requires human review */
  requiresHumanReview: boolean;
}

export interface InstitutionalTimeline {
  /** Site/institution identifier */
  siteId: string;
  /** When this timeline was generated */
  generatedAt: string;
  /** All events, sorted chronologically */
  events: TimelineEvent[];
  /** Year range covered */
  yearRange: { start: number | null; end: number | null };
  /** Total events */
  eventCount: number;
  /** Events requiring review */
  requiresReviewCount: number;
}
