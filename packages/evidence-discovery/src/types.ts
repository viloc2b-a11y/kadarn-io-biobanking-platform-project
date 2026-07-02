// ==========================================================================
// Evidence Discovery — Domain Types (KEMS-002 / KEMS-002A)
// ==========================================================================
// Sprint 20A.1.
// ==========================================================================

// --------------------------------------------------------------------------
// Layer 0 — Original Artifact
// --------------------------------------------------------------------------

export type ArtifactType = 'pdf' | 'docx' | 'zip' | 'image' | 'api_payload' | 'public_registry' | 'other';

export interface Layer0Artifact {
  /** Unique artifact ID */
  id: string;
  /** Original file name */
  fileName: string;
  /** File type */
  type: ArtifactType;
  /** File size in bytes */
  sizeBytes: number;
  /** SHA-256 hash of original file */
  hash: string;
  /** Source (upload, api, registry) */
  source: string;
  /** When received */
  receivedAt: string;
  /** Storage path or reference */
  storageRef: string;
}

// --------------------------------------------------------------------------
// Layer 1 — Extracted Representation
// --------------------------------------------------------------------------

export interface Layer1Markdown {
  /** Artifact ID this was extracted from */
  artifactId: string;
  /** Markdown content */
  markdown: string;
  /** Extractor used (e.g. 'markitdown', 'ocr', 'manual') */
  extractor: string;
  /** Extractor version */
  extractorVersion: string;
  /** When extraction occurred */
  extractedAt: string;
  /** File hash of original (for provenance verification) */
  originalHash: string;
  /** Processing status */
  status: 'pending' | 'completed' | 'failed';
  /** Error message if failed */
  error?: string;
}

// --------------------------------------------------------------------------
// State Machine (KEMS-002A)
// --------------------------------------------------------------------------

export type DiscoveryState =
  | 'RAW_SOURCE'
  | 'DISCOVERED'
  | 'CLASSIFIED'
  | 'ENTITY_EXTRACTED'
  | 'CLAIMS_PROPOSED'
  | 'CURATION'
  | 'ENRICHED'
  | 'NEEDS_MORE_EVIDENCE'
  | 'READY_FOR_PROMOTION'
  | 'PROMOTED'
  | 'REJECTED'
  | 'MERGED'
  | 'SPLIT'
  | 'ARCHIVED'
  | 'DISCOVERY_FAILED'
  | 'CLASSIFICATION_FAILED'
  | 'ENTITY_EXTRACTION_FAILED'
  | 'CLAIM_DETECTION_FAILED';

export type TerminalState = 'PROMOTED' | 'REJECTED' | 'ARCHIVED';

// --------------------------------------------------------------------------
// Allowed transitions (KEMS-002A §5)
// --------------------------------------------------------------------------

export const ALLOWED_TRANSITIONS: Record<DiscoveryState, DiscoveryState[]> = {
  RAW_SOURCE: ['DISCOVERED'],
  DISCOVERED: ['CLASSIFIED', 'DISCOVERY_FAILED'],
  CLASSIFIED: ['ENTITY_EXTRACTED', 'CLASSIFICATION_FAILED'],
  ENTITY_EXTRACTED: ['CLAIMS_PROPOSED', 'ENTITY_EXTRACTION_FAILED'],
  CLAIMS_PROPOSED: ['CURATION', 'CLAIM_DETECTION_FAILED'],
  CURATION: ['ENRICHED', 'REJECTED', 'NEEDS_MORE_EVIDENCE', 'MERGED', 'SPLIT'],
  ENRICHED: ['READY_FOR_PROMOTION'],
  NEEDS_MORE_EVIDENCE: ['CURATION'],
  READY_FOR_PROMOTION: ['PROMOTED'],
  PROMOTED: [],
  REJECTED: [],
  MERGED: ['CURATION', 'ARCHIVED'],
  SPLIT: ['CURATION', 'ARCHIVED'],
  ARCHIVED: [],
  DISCOVERY_FAILED: ['DISCOVERED', 'ARCHIVED'],
  CLASSIFICATION_FAILED: ['CLASSIFIED', 'ARCHIVED'],
  ENTITY_EXTRACTION_FAILED: ['ENTITY_EXTRACTED', 'ARCHIVED'],
  CLAIM_DETECTION_FAILED: ['CLAIMS_PROPOSED', 'ARCHIVED'],
};

// --------------------------------------------------------------------------
// Transition Event (KEMS-002A §6)
// --------------------------------------------------------------------------

export interface TransitionEvent {
  /** Candidate ID */
  candidateId: string;
  /** Previous state */
  fromState: DiscoveryState;
  /** New state */
  toState: DiscoveryState;
  /** When transition occurred */
  timestamp: string;
  /** Who/what performed the transition */
  actor: string;
  /** Pipeline version */
  pipelineVersion: string;
  /** Model version (if AI-driven) */
  modelVersion?: string;
  /** Human-readable reason */
  reason: string;
}

// --------------------------------------------------------------------------
// Evidence Candidate (KEMS-002 §4)
// --------------------------------------------------------------------------

export type EvidenceClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface EvidenceCandidate {
  /** Unique candidate ID */
  id: string;
  /** Current state machine state */
  state: DiscoveryState;
  /** References to Layer 0 artifacts that produced this candidate */
  artifactIds: string[];
  /** Reference to Layer 1 markdown */
  layer1Id?: string;
  /** Proposed Evidence Class */
  proposedEvidenceClass?: EvidenceClass;
  /** Proposed content */
  content: string;
  /** Discovery confidence (extraction certainty, NOT Claim confidence) */
  discoveryConfidence: number;
  /** Source (document, api, connector) */
  source: string;
  /** State machine transition history */
  transitions: TransitionEvent[];
  /** Provenance chain */
  provenanceChain: ProvenanceEntry[];
  /** When candidate was created */
  createdAt: string;
  /** When last updated */
  updatedAt: string;
}

// --------------------------------------------------------------------------
// Claim Candidate
// --------------------------------------------------------------------------

export interface ClaimCandidate {
  /** Unique claim candidate ID */
  id: string;
  /** Proposed claimTypeId from Claim Taxonomy */
  proposedClaimTypeId: string;
  /** Evidence Candidate IDs that support this Claim */
  evidenceCandidateIds: string[];
  /** Discovery confidence (NOT Claim confidence) */
  discoveryConfidence: number;
  /** State machine state (inherits from parent candidate) */
  state: DiscoveryState;
  /** Transitions */
  transitions: TransitionEvent[];
  /** Human-readable reasoning */
  reasoning: string;
  /** When created */
  createdAt: string;
}

// --------------------------------------------------------------------------
// Provenance Chain (KEMS-002 §6)
// --------------------------------------------------------------------------

export type ProvenanceStepType =
  | 'original_artifact'
  | 'layer1_extraction'
  | 'pipeline_execution'
  | 'extractor_output'
  | 'model_output'
  | 'agent_output'
  | 'human_curation'
  | 'promotion_decision';

export interface ProvenanceEntry {
  step: ProvenanceStepType;
  description: string;
  actor: string;
  timestamp: string;
  version: string;
  /** Hash of relevant artifact for verification */
  hash?: string;
}

// --------------------------------------------------------------------------
// Institutional Evidence Snapshot (KEMS-002 §16)
// --------------------------------------------------------------------------

export interface EvidenceSnapshot {
  /** Site name */
  siteName: string;
  /** Generated at */
  generatedAt: string;
  /** Evidence Candidates found */
  candidateCount: number;
  /** Claim Candidates proposed */
  claimCandidateCount: number;
  /** Document types classified */
  documentTypes: string[];
  /** Basic timeline */
  timeline: TimelineEvent[];
  /** Coverage estimate */
  coverageEstimate: number;
  /** Top leverage recommendation */
  topRecommendation: string;
}

export interface TimelineEvent {
  date: string;
  description: string;
  sourceRef: string;
  confidence: number;
}
