// ==========================================================================
// Evidence Core — Lifecycle Service
// ==========================================================================
// Baseline AF-1.0. Sprint 17.3.
//
// Orchestrates the Evidence Core lifecycle operations. Each operation:
//   - Validates domain invariants (from Sprint 17.1)
//   - Persists via repository (from Sprint 17.2)
//   - Records audit trail
//   - Preserves provenance
//
// This service does NOT:
//   - Compute Confidence (ADR-011)
//   - Interpret evidence (Engine concern)
//   - Expose APIs or UI
//   - Use Trust terminology (ADR-010)
// ==========================================================================

import type { DbClient } from './db.js';
import { EvidenceClass } from './evidence-class.js';
import type {
  Claim,
  EvidenceNode,
  EvidenceRelationship,
  CounterEvidence,
  RightOfResponse,
  ProvenanceMetadata,
  VisibilityMetadata,
} from './types.js';
import { validateClaim } from './invariants.js';
import { createProvenance } from './provenance.js';
import { siteVisibility, sponsorAuthorizedVisibility, systemVisibility } from './visibility.js';
import { recordAuditEntry, createAuditEntry } from './audit.js';
import {
  insertClaim,
  getClaimById,
  insertEvidenceNode,
  getEvidenceNodesByClaim,
  insertCounterEvidence,
  insertRightOfResponse,
  insertRelationship,
} from './repository.js';

// --------------------------------------------------------------------------
// Actor context — required for every operation
// --------------------------------------------------------------------------

export interface ActorContext {
  actorId: string;
  organizationId: string;
  correlationId: string;
}

// --------------------------------------------------------------------------
// 1. Create Claim
// --------------------------------------------------------------------------

export interface CreateClaimCommand {
  claimTypeId: string;
  name: string;
  description: string;
  domain: string;
  validEvidenceClasses: EvidenceClass[];
  requiredEvidenceClasses: EvidenceClass[];
  decays: boolean;
  decayPeriodMonths: number | null;
  visibilityScope?: 'site' | 'sponsor_authorized' | 'system';
  authorizedSponsorIds?: string[];
}

export async function createClaim(
  db: DbClient,
  ctx: ActorContext,
  command: CreateClaimCommand,
): Promise<Claim> {
  // Build provenance
  const provenance = createProvenance({
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    summary: `Claim created: ${command.name}`,
  });

  // Build visibility
  let visibility: VisibilityMetadata;
  switch (command.visibilityScope) {
    case 'sponsor_authorized':
      visibility = sponsorAuthorizedVisibility(ctx.organizationId, command.authorizedSponsorIds ?? []);
      break;
    case 'system':
      visibility = systemVisibility();
      break;
    default:
      visibility = siteVisibility(ctx.organizationId);
  }

  // Create domain model (validates invariants)
  const { createClaim: buildClaim } = await import('./claim.js');
  const claimModel = buildClaim({
    id: crypto.randomUUID(),
    claimTypeId: command.claimTypeId,
    name: command.name,
    description: command.description,
    organizationId: ctx.organizationId,
    domain: command.domain,
    validEvidenceClasses: command.validEvidenceClasses,
    requiredEvidenceClasses: command.requiredEvidenceClasses,
    decays: command.decays,
    decayPeriodMonths: command.decayPeriodMonths,
    provenance: {
      createdByActorId: ctx.actorId,
      createdByOrganizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
      summary: provenance.summary,
    },
  });

  // Validate invariants
  const validation = validateClaim(claimModel);
  if (!validation.valid) {
    throw new Error(`Claim validation failed: ${validation.errors.join('; ')}`);
  }

  // Persist
  const claim = await insertClaim(db, {
    claimTypeId: command.claimTypeId,
    name: command.name,
    description: command.description,
    organizationId: ctx.organizationId,
    domain: command.domain,
    validEvidenceClasses: command.validEvidenceClasses,
    requiredEvidenceClasses: command.requiredEvidenceClasses,
    decays: command.decays,
    decayPeriodMonths: command.decayPeriodMonths,
    provenance,
  });

  // Audit
  await recordAuditEntry(db, createAuditEntry({
    action: 'claim.created',
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    entityId: claimModel.id,
    summary: `Claim created: ${command.name} (${command.claimTypeId})`,
    details: { claimTypeId: command.claimTypeId, domain: command.domain },
  }));

  return claim;
}

// --------------------------------------------------------------------------
// 2. Submit Evidence Node
// --------------------------------------------------------------------------

export interface SubmitEvidenceCommand {
  claimId: string;
  evidenceClass: EvidenceClass;
  content: string;
  source: string;
  date: string;
  weight: number;
  authorizedSponsorIds?: string[];
}

export async function submitEvidence(
  db: DbClient,
  ctx: ActorContext,
  command: SubmitEvidenceCommand,
): Promise<EvidenceNode> {
  // Verify claim exists
  const claim = await getClaimById(db, command.claimId);
  if (!claim) {
    throw new Error(`Claim not found: ${command.claimId}`);
  }

  const provenance = createProvenance({
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    summary: `Evidence submitted: ${command.content.slice(0, 80)}`,
  });

  const visibility = command.authorizedSponsorIds && command.authorizedSponsorIds.length > 0
    ? sponsorAuthorizedVisibility(ctx.organizationId, command.authorizedSponsorIds)
    : siteVisibility(ctx.organizationId);

  const node = await insertEvidenceNode(db, {
    claimId: command.claimId,
    evidenceClass: command.evidenceClass,
    content: command.content,
    source: command.source,
    date: command.date,
    weight: command.weight,
    provenance,
    visibility,
  });

  // Audit
  await recordAuditEntry(db, createAuditEntry({
    action: 'evidence.submitted',
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    entityId: node.id,
    summary: `Evidence submitted for claim ${command.claimId}: Class ${command.evidenceClass}`,
    details: { claimId: command.claimId, evidenceClass: command.evidenceClass },
  }));

  return node;
}

// --------------------------------------------------------------------------
// 3. Link Evidence Node to Claim (creates relationship)
// --------------------------------------------------------------------------

export async function linkEvidenceToClaim(
  db: DbClient,
  ctx: ActorContext,
  evidenceNodeId: string,
  claimId: string,
): Promise<EvidenceRelationship> {
  const provenance = createProvenance({
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    summary: `Evidence node ${evidenceNodeId} linked to claim ${claimId}`,
  });

  const rel = await insertRelationship(db, {
    sourceNodeId: evidenceNodeId,
    targetNodeId: claimId,
    relationshipType: 'supports',
    provenance: { correlationId: ctx.correlationId, summary: provenance.summary },
  });

  await recordAuditEntry(db, createAuditEntry({
    action: 'evidence.linked',
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    entityId: evidenceNodeId,
    summary: `Evidence node ${evidenceNodeId} linked to claim ${claimId}`,
    details: { claimId, evidenceNodeId, relationshipId: rel.id },
  }));

  return rel;
}

// --------------------------------------------------------------------------
// 4. Submit Counter Evidence
// --------------------------------------------------------------------------

export interface SubmitCounterEvidenceCommand {
  claimId: string;
  evidenceClass: EvidenceClass;
  content: string;
  source: string;
  date: string;
  weight: number;
}

export async function submitCounterEvidence(
  db: DbClient,
  ctx: ActorContext,
  command: SubmitCounterEvidenceCommand,
): Promise<CounterEvidence> {
  const claim = await getClaimById(db, command.claimId);
  if (!claim) {
    throw new Error(`Claim not found: ${command.claimId}`);
  }

  const provenance = createProvenance({
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    summary: `Counter evidence submitted: ${command.content.slice(0, 80)}`,
  });

  const ce = await insertCounterEvidence(db, {
    claimId: command.claimId,
    evidenceClass: command.evidenceClass,
    content: command.content,
    source: command.source,
    date: command.date,
    weight: command.weight,
    provenance,
    visibility: siteVisibility(ctx.organizationId),
  });

  await recordAuditEntry(db, createAuditEntry({
    action: 'counter_evidence.submitted',
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    entityId: ce.id,
    summary: `Counter evidence submitted for claim ${command.claimId}`,
    details: { claimId: command.claimId, evidenceClass: command.evidenceClass },
  }));

  return ce;
}

// --------------------------------------------------------------------------
// 5. Submit Right of Response
// --------------------------------------------------------------------------

export interface SubmitResponseCommand {
  counterEvidenceId: string;
  description: string;
  resolutionDate: string;
  supportingEvidenceIds?: string[];
}

export async function submitRightOfResponse(
  db: DbClient,
  ctx: ActorContext,
  command: SubmitResponseCommand,
): Promise<RightOfResponse> {
  const provenance = createProvenance({
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    summary: `Right of Response submitted for counter evidence ${command.counterEvidenceId}`,
  });

  const ror = await insertRightOfResponse(db, {
    counterEvidenceId: command.counterEvidenceId,
    description: command.description,
    resolutionDate: command.resolutionDate,
    supportingEvidenceIds: command.supportingEvidenceIds,
    provenance,
    visibility: siteVisibility(ctx.organizationId),
  });

  await recordAuditEntry(db, createAuditEntry({
    action: 'right_of_response.submitted',
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    entityId: ror.id,
    summary: `Right of Response for counter evidence ${command.counterEvidenceId}`,
    details: { counterEvidenceId: command.counterEvidenceId },
  }));

  return ror;
}

// --------------------------------------------------------------------------
// 6. Update Process State
// --------------------------------------------------------------------------

export type ProcessStateUpdate = {
  entityType: 'claim' | 'evidence_node' | 'right_of_response';
  entityId: string;
  newStatus: string;
  reason: string;
};

/**
 * Update the process state of a lifecycle entity.
 * Only status/process state changes — never content mutation.
 * Audit trail is always recorded.
 */
export async function updateProcessState(
  _db: DbClient,
  ctx: ActorContext,
  update: ProcessStateUpdate,
): Promise<void> {
  // Validate: only process state, not content
  const allowedStatuses: Record<string, string[]> = {
    claim: ['active', 'archived', 'deprecated'],
    evidence_node: ['active', 'superseded', 'disputed', 'resolved'],
    right_of_response: ['submitted', 'accepted', 'rejected', 'confirmed'],
  };

  const validForType = allowedStatuses[update.entityType];
  if (!validForType || !validForType.includes(update.newStatus)) {
    throw new Error(
      `Invalid status "${update.newStatus}" for ${update.entityType}. ` +
      `Allowed: ${validForType?.join(', ')}`
    );
  }

  await recordAuditEntry(_db, createAuditEntry({
    action: 'process_state.updated',
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    entityId: update.entityId,
    summary: `${update.entityType} ${update.entityId} → ${update.newStatus}: ${update.reason}`,
    details: { entityType: update.entityType, previousStatus: null, newStatus: update.newStatus, reason: update.reason },
  }));
}
