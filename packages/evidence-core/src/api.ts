// ==========================================================================
// Evidence Core — Internal API Contracts
// ==========================================================================
// Baseline AF-1.0. Sprint 17.5.
//
// These are internal API contracts that wrap the lifecycle service.
// They do NOT compute Confidence, score institutions, or interpret evidence.
// Every API calls the underlying lifecycle service and preserves all
// ADR-011 boundary invariants.
// ==========================================================================

import type { DbClient } from './db.js';
import type {
  ActorContext,
  CreateClaimCommand,
  SubmitEvidenceCommand,
  SubmitCounterEvidenceCommand,
  SubmitResponseCommand,
  ProcessStateUpdate,
} from './lifecycle.js';
import {
  createClaim as lifecycleCreateClaim,
  submitEvidence as lifecycleSubmitEvidence,
  submitCounterEvidence as lifecycleSubmitCounterEvidence,
  submitRightOfResponse as lifecycleSubmitResponse,
  updateProcessState as lifecycleUpdateProcessState,
} from './lifecycle.js';
import { insertRelationship } from './repository.js';
import { getClaimById, getEvidenceNodesByClaim } from './repository.js';
import { assertNotForbiddenInCore } from './boundary.js';

// --------------------------------------------------------------------------
// API: Create Claim
// --------------------------------------------------------------------------

export interface ApiCreateClaimInput {
  claimTypeId: string;
  name: string;
  description: string;
  domain: string;
  validEvidenceClasses: string[];
  requiredEvidenceClasses: string[];
  decays: boolean;
  decayPeriodMonths: number | null;
  visibilityScope?: 'site' | 'sponsor_authorized' | 'system';
  authorizedSponsorIds?: string[];
}

export async function apiCreateClaim(
  db: DbClient,
  ctx: ActorContext,
  input: ApiCreateClaimInput,
) {
  assertNotForbiddenInCore('createClaim');

  const command: CreateClaimCommand = {
    claimTypeId: input.claimTypeId,
    name: input.name,
    description: input.description,
    domain: input.domain,
    validEvidenceClasses: input.validEvidenceClasses as any,
    requiredEvidenceClasses: input.requiredEvidenceClasses as any,
    decays: input.decays,
    decayPeriodMonths: input.decayPeriodMonths,
    visibilityScope: input.visibilityScope,
    authorizedSponsorIds: input.authorizedSponsorIds,
  };

  // Organization ownership ALWAYS comes from the authenticated session
  // context (ctx.organizationId), never from client input. Callers must
  // resolve ctx.organizationId from a validated active membership before
  // invoking this API (see requireValidatedActiveOrg in apps/api).
  const claim = await lifecycleCreateClaim(db, ctx, command);
  return { data: claim, error: null };
}

// --------------------------------------------------------------------------
// API: Submit Evidence
// --------------------------------------------------------------------------

export interface ApiSubmitEvidenceInput {
  claimId: string;
  evidenceClass: string;
  content: string;
  source: string;
  date: string;
  weight: number;
  authorizedSponsorIds?: string[];
}

export async function apiSubmitEvidence(
  db: DbClient,
  ctx: ActorContext,
  input: ApiSubmitEvidenceInput,
) {
  assertNotForbiddenInCore('submitEvidence');

  const command: SubmitEvidenceCommand = {
    claimId: input.claimId,
    evidenceClass: input.evidenceClass as any,
    content: input.content,
    source: input.source,
    date: input.date,
    weight: input.weight,
    authorizedSponsorIds: input.authorizedSponsorIds,
  };

  const node = await lifecycleSubmitEvidence(db, ctx, command);
  return { data: node, error: null };
}

// --------------------------------------------------------------------------
// API: Submit Counter Evidence
// --------------------------------------------------------------------------

export interface ApiCounterEvidenceInput {
  claimId: string;
  evidenceClass: string;
  content: string;
  source: string;
  date: string;
  weight: number;
}

export async function apiSubmitCounterEvidence(
  db: DbClient,
  ctx: ActorContext,
  input: ApiCounterEvidenceInput,
) {
  assertNotForbiddenInCore('submitCounterEvidence');

  const command: SubmitCounterEvidenceCommand = {
    claimId: input.claimId,
    evidenceClass: input.evidenceClass as any,
    content: input.content,
    source: input.source,
    date: input.date,
    weight: input.weight,
  };

  const ce = await lifecycleSubmitCounterEvidence(db, ctx, command);
  return { data: ce, error: null };
}

// --------------------------------------------------------------------------
// API: Submit Right of Response
// --------------------------------------------------------------------------

export interface ApiSubmitResponseInput {
  counterEvidenceId: string;
  description: string;
  resolutionDate: string;
  supportingEvidenceIds?: string[];
}

export async function apiSubmitResponse(
  db: DbClient,
  ctx: ActorContext,
  input: ApiSubmitResponseInput,
) {
  assertNotForbiddenInCore('submitRightOfResponse');

  const command: SubmitResponseCommand = {
    counterEvidenceId: input.counterEvidenceId,
    description: input.description,
    resolutionDate: input.resolutionDate,
    supportingEvidenceIds: input.supportingEvidenceIds,
  };

  const ror = await lifecycleSubmitResponse(db, ctx, command);
  return { data: ror, error: null };
}

// --------------------------------------------------------------------------
// API: Create Relationship
// --------------------------------------------------------------------------

export interface ApiCreateRelationshipInput {
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: 'supports' | 'contradicts' | 'corroborates' | 'responds_to' | 'supersedes';
}

export async function apiCreateRelationship(
  db: DbClient,
  ctx: ActorContext,
  input: ApiCreateRelationshipInput,
) {
  assertNotForbiddenInCore('createEvidenceRelationship');

  const rel = await insertRelationship(db, {
    sourceNodeId: input.sourceNodeId,
    targetNodeId: input.targetNodeId,
    relationshipType: input.relationshipType,
    provenance: { correlationId: ctx.correlationId, summary: `Relationship: ${input.relationshipType}` },
  });

  return { data: rel, error: null };
}

// --------------------------------------------------------------------------
// API: Update Process State
// --------------------------------------------------------------------------

export interface ApiUpdateProcessStateInput {
  entityType: 'claim' | 'evidence_node' | 'right_of_response';
  entityId: string;
  newStatus: string;
  reason: string;
}

export async function apiUpdateProcessState(
  db: DbClient,
  ctx: ActorContext,
  input: ApiUpdateProcessStateInput,
) {
  assertNotForbiddenInCore('updateProcessState');

  const update: ProcessStateUpdate = {
    entityType: input.entityType,
    entityId: input.entityId,
    newStatus: input.newStatus,
    reason: input.reason,
  };

  await lifecycleUpdateProcessState(db, ctx, update);
  return { data: { updated: true }, error: null };
}

// --------------------------------------------------------------------------
// API: Query Claim
// --------------------------------------------------------------------------

export interface ApiQueryClaimInput {
  claimId: string;
}

export async function apiGetClaim(
  db: DbClient,
  _ctx: ActorContext,
  input: ApiQueryClaimInput,
) {
  const claim = await getClaimById(db, input.claimId);
  if (!claim) {
    return { data: null, error: 'Claim not found' };
  }
  // Return only stored data — no computation
  return { data: claim, error: null };
}

// --------------------------------------------------------------------------
// API: Query Evidence for a Claim
// --------------------------------------------------------------------------

export interface ApiQueryEvidenceInput {
  claimId: string;
}

export async function apiGetClaimEvidence(
  db: DbClient,
  _ctx: ActorContext,
  input: ApiQueryEvidenceInput,
) {
  const nodes = await getEvidenceNodesByClaim(db, input.claimId);
  return { data: nodes, error: null };
}
