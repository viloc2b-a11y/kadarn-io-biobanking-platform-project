// ==========================================================================
// Evidence Discovery — Semantic Extraction Request Types
// ==========================================================================
// Sprint 20A.3B. KEMS-002.
//
// Preparation layer between Layer 1 extraction and Agent Pipeline.
// No AI agents. No Evidence Core writes.
// ==========================================================================

// --------------------------------------------------------------------------
// Request types (matching Agent Responsibility Matrix)
// --------------------------------------------------------------------------

export type SemanticRequestType =
  | 'DOCUMENT_CLASSIFICATION'
  | 'ENTITY_EXTRACTION'
  | 'RELATIONSHIP_EXTRACTION'
  | 'CLAIM_CANDIDATE_DETECTION'
  | 'TIMELINE_RECONSTRUCTION'
  | 'GAP_DETECTION'
  | 'LEVERAGE_RECOMMENDATION';

export const ALL_REQUEST_TYPES: SemanticRequestType[] = [
  'DOCUMENT_CLASSIFICATION',
  'ENTITY_EXTRACTION',
  'RELATIONSHIP_EXTRACTION',
  'CLAIM_CANDIDATE_DETECTION',
  'TIMELINE_RECONSTRUCTION',
  'GAP_DETECTION',
  'LEVERAGE_RECOMMENDATION',
];

// --------------------------------------------------------------------------
// Request statuses
// --------------------------------------------------------------------------

export type SemanticRequestStatus =
  | 'PENDING'
  | 'CLAIMED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'SKIPPED';

export const ALLOWED_REQUEST_TRANSITIONS: Record<SemanticRequestStatus, SemanticRequestStatus[]> = {
  PENDING: ['CLAIMED', 'CANCELLED', 'SKIPPED'],
  CLAIMED: ['RUNNING', 'CANCELLED', 'FAILED'],
  RUNNING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: ['PENDING'],   // retry
  CANCELLED: [],
  SKIPPED: [],
};

// --------------------------------------------------------------------------
// Request priority
// --------------------------------------------------------------------------

export type RequestPriority = 'high' | 'normal' | 'low';

// --------------------------------------------------------------------------
// Semantic Extraction Request — domain object
// --------------------------------------------------------------------------

export interface SemanticExtractionRequest {
  requestId: string;
  discoveryRunId: string;
  artifactId: string;
  layer1Id: string;
  requestType: SemanticRequestType;
  status: SemanticRequestStatus;
  priority: RequestPriority;
  pipelineVersion: string;
  agentVersion: string | null;
  modelVersion: string | null;
  inputHash: string;
  outputRef: string | null;
  error: string | null;
  createdAt: string;
  claimedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  updatedAt: string;
}

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

export function createRequest(params: {
  discoveryRunId: string;
  artifactId: string;
  layer1Id: string;
  requestType: SemanticRequestType;
  priority?: RequestPriority;
  pipelineVersion: string;
  inputHash: string;
}): SemanticExtractionRequest {
  const now = new Date().toISOString();
  return {
    requestId: crypto.randomUUID(),
    discoveryRunId: params.discoveryRunId,
    artifactId: params.artifactId,
    layer1Id: params.layer1Id,
    requestType: params.requestType,
    status: 'PENDING',
    priority: params.priority ?? 'normal',
    pipelineVersion: params.pipelineVersion,
    agentVersion: null,
    modelVersion: null,
    inputHash: params.inputHash,
    outputRef: null,
    error: null,
    createdAt: now,
    claimedAt: null,
    completedAt: null,
    failedAt: null,
    updatedAt: now,
  };
}

// --------------------------------------------------------------------------
// Status transition
// --------------------------------------------------------------------------

export class InvalidRequestTransitionError extends Error {
  constructor(requestId: string, from: SemanticRequestStatus, to: SemanticRequestStatus) {
    super(
      `Invalid request transition: ${requestId} ${from} → ${to}. ` +
      `Allowed: ${(ALLOWED_REQUEST_TRANSITIONS[from] ?? []).join(', ') || 'none (terminal)'}`,
    );
    this.name = 'InvalidRequestTransitionError';
  }
}

export function transitionRequest(
  request: SemanticExtractionRequest,
  newStatus: SemanticRequestStatus,
  params?: { agentVersion?: string; modelVersion?: string; outputRef?: string; error?: string },
): SemanticExtractionRequest {
  const allowed = ALLOWED_REQUEST_TRANSITIONS[request.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new InvalidRequestTransitionError(request.requestId, request.status, newStatus);
  }

  const now = new Date().toISOString();
  const updated: SemanticExtractionRequest = {
    ...request,
    status: newStatus,
    updatedAt: now,
    agentVersion: params?.agentVersion ?? request.agentVersion,
    modelVersion: params?.modelVersion ?? request.modelVersion,
  };

  switch (newStatus) {
    case 'CLAIMED':
      updated.claimedAt = now;
      break;
    case 'COMPLETED':
      updated.completedAt = now;
      updated.outputRef = params?.outputRef ?? null;
      break;
    case 'FAILED':
      updated.failedAt = now;
      updated.error = params?.error ?? null;
      break;
  }

  return updated;
}
