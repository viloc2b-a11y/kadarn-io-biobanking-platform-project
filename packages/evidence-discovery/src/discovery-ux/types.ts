// ==========================================================================
// Discovery UX — Domain Types
// ==========================================================================
// Sprint 20B.7.
//
// UX architecture, states, flows, and contracts for the Discovery Experience.
// Not visual UI — just states, transitions, events, and data contracts.
//
// Key UX Principles:
// - Institutional Recognition Moment: "I see who you are"
// - Minimum User Effort: upload and wait
// - Evidence First: results before forms
// - Progressive Discovery: reveal depth over time
// - Human Review: always in control
// ==========================================================================

import type { InstitutionalProfile, ProfileStatus } from '../profile/types.js';

// --------------------------------------------------------------------------
// UX Phases
// --------------------------------------------------------------------------

export type DiscoveryPhase =
  | 'onboarding'       // "Cuéntame quién eres" — minimal input
  | 'uploading'        // Documents being uploaded and processed
  | 'processing'       // Kadarn works — pipeline running
  | 'reviewing'        // Results presented — human review
  | 'complete';        // Profile finalized

export type DiscoveryPhaseStatus = 'idle' | 'in_progress' | 'paused' | 'completed' | 'failed';

// --------------------------------------------------------------------------
// UX Events
// --------------------------------------------------------------------------

export type DiscoveryUXEvent =
  | { type: 'INSTITUTION_SUBMITTED'; institutionName: string }
  | { type: 'DOCUMENTS_UPLOADED'; fileCount: number }
  | { type: 'PIPELINE_STARTED' }
  | { type: 'PIPELINE_PROGRESS'; stage: string; percent: number }
  | { type: 'PIPELINE_COMPLETED'; profile: InstitutionalProfile }
  | { type: 'PIPELINE_FAILED'; error: string }
  | { type: 'HUMAN_REVIEW_STARTED' }
  | { type: 'HUMAN_REVIEW_ACTION'; action: ReviewAction; targetId: string }
  | { type: 'HUMAN_REVIEW_COMPLETED' }
  | { type: 'PROFILE_EXPORTED' }
  | { type: 'ERROR_OCCURRED'; message: string; recoverable: boolean };

// --------------------------------------------------------------------------
// Review Actions
// --------------------------------------------------------------------------

export type ReviewAction =
  | 'accept_capability'
  | 'reject_capability'
  | 'accept_claim'
  | 'reject_claim'
  | 'request_more_evidence'
  | 'edit_timeline_event'
  | 'add_note'
  | 'flag_for_review';

// --------------------------------------------------------------------------
// UX Screen States
// --------------------------------------------------------------------------

export interface OnboardingState {
  phase: 'onboarding';
  status: DiscoveryPhaseStatus;
  /** Institution name entered by user */
  institutionName: string | null;
  /** Whether the user has completed onboarding */
  completed: boolean;
}

export interface UploadingState {
  phase: 'uploading';
  status: DiscoveryPhaseStatus;
  /** Files being uploaded */
  files: UploadedFile[];
  /** Upload progress 0–100 */
  progress: number;
}

export interface UploadedFile {
  fileName: string;
  size: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface ProcessingState {
  phase: 'processing';
  status: DiscoveryPhaseStatus;
  /** Current pipeline stage */
  currentStage: string;
  /** Overall progress 0–100 */
  overallProgress: number;
  /** Stage-level progress 0–100 */
  stageProgress: number;
  /** Stages completed so far */
  completedStages: string[];
  /** Estimated time remaining */
  estimatedRemaining?: string;
}

export type PipelineStage =
  | 'document_classification'
  | 'entity_extraction'
  | 'relationship_extraction'
  | 'timeline_reconstruction'
  | 'capability_detection'
  | 'claim_detection'
  | 'gap_analysis'
  | 'narrative_generation'
  | 'profile_building';

export const PIPELINE_STAGES: PipelineStage[] = [
  'document_classification',
  'entity_extraction',
  'relationship_extraction',
  'timeline_reconstruction',
  'capability_detection',
  'claim_detection',
  'gap_analysis',
  'narrative_generation',
  'profile_building',
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  document_classification: 'Classifying documents',
  entity_extraction: 'Extracting entities',
  relationship_extraction: 'Identifying relationships',
  timeline_reconstruction: 'Reconstructing timeline',
  capability_detection: 'Detecting capabilities',
  claim_detection: 'Identifying claim candidates',
  gap_analysis: 'Analyzing evidence gaps',
  narrative_generation: 'Generating narrative',
  profile_building: 'Building institutional profile',
};

export interface ReviewState {
  phase: 'reviewing';
  status: DiscoveryPhaseStatus;
  /** The complete profile */
  profile: InstitutionalProfile;
  /** Current item being reviewed */
  currentReviewItem: ReviewItem | null;
  /** Items pending review */
  pendingItems: ReviewItem[];
  /** Items already reviewed */
  reviewedItems: ReviewedItem[];
  /** Whether review is complete */
  completed: boolean;
}

export interface ReviewItem {
  itemId: string;
  type: 'capability' | 'claim' | 'timeline_event' | 'narrative_section' | 'evidence_gap';
  label: string;
  description: string;
  sourceIds: string[];
}

export interface ReviewedItem {
  itemId: string;
  action: ReviewAction;
  reviewedAt: string;
  note?: string;
}

export interface CompleteState {
  phase: 'complete';
  status: DiscoveryPhaseStatus;
  /** The finalized profile */
  profile: InstitutionalProfile;
  /** When the profile was finalized */
  completedAt: string;
  /** Whether the profile has been exported */
  exported: boolean;
}

// --------------------------------------------------------------------------
// UX State Machine
// --------------------------------------------------------------------------

export type DiscoveryUXState =
  | OnboardingState
  | UploadingState
  | ProcessingState
  | ReviewState
  | CompleteState;

// --------------------------------------------------------------------------
// UX Flow Configuration
// --------------------------------------------------------------------------

export interface DiscoveryUXConfig {
  /** Whether to automatically start pipeline after upload */
  autoStartPipeline: boolean;
  /** Whether to pause pipeline for human review at each stage */
  pauseForReview: boolean;
  /** Whether to show confidence scores during review */
  showConfidence: boolean;
  /** Maximum files per upload batch */
  maxFilesPerBatch: number;
  /** Accepted file types */
  acceptedFileTypes: string[];
}

export const DEFAULT_UX_CONFIG: DiscoveryUXConfig = {
  autoStartPipeline: true,
  pauseForReview: true,
  showConfidence: true,
  maxFilesPerBatch: 50,
  acceptedFileTypes: ['.pdf', '.docx', '.xlsx', '.csv', '.txt', '.html'],
};

// --------------------------------------------------------------------------
// UX Messages (for UI layer)
// --------------------------------------------------------------------------

export type UXMessageType =
  | 'recognition_moment'   // "We found your institution!"
  | 'capability_discovered'// "We detected PBMC processing capability"
  | 'evidence_gap'         // "We're missing calibration records"
  | 'claim_ready'          // "We can assert this claim"
  | 'review_needed'        // "Some items need your review"
  | 'complete'             // "Your institutional profile is ready"
  | 'error';               // "Something went wrong"

export interface UXMessage {
  type: UXMessageType;
  title: string;
  description: string;
  /** Suggested next action for the user */
  suggestedAction?: string;
  /** Whether this message requires user attention */
  requiresAttention: boolean;
}

// --------------------------------------------------------------------------
// UX Metrics
// --------------------------------------------------------------------------

export interface DiscoveryUXMetrics {
  /** Time from onboarding to profile complete */
  totalDurationMs: number;
  /** Time spent in each phase */
  phaseDurations: Record<DiscoveryPhase, number>;
  /** Files uploaded */
  totalFiles: number;
  /** Pipeline stages completed */
  stagesCompleted: number;
  /** Items reviewed by human */
  itemsReviewed: number;
  /** Items accepted vs rejected */
  acceptanceRate: number;
}
