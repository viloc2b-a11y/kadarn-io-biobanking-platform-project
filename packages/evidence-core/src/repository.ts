// ==========================================================================
// Evidence Core — Repository Adapter
// ==========================================================================
// Baseline AF-1.0. Sprint 17.2.
//
// This repository provides persistence operations for the Evidence Core.
// It does NOT compute Confidence, run algorithms, or implement Engine logic.
// Append-only constraints are enforced at the database level (triggers).
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
  TemporalMetadata,
} from './types.js';

// --------------------------------------------------------------------------
// Claim repository
// --------------------------------------------------------------------------

export interface CreateClaimInput {
  id?: string;
  claimTypeId: string;
  name: string;
  description: string;
  organizationId: string;
  domain: string;
  validEvidenceClasses: EvidenceClass[];
  requiredEvidenceClasses: EvidenceClass[];
  decays: boolean;
  decayPeriodMonths: number | null;
  provenance: ProvenanceMetadata;
}

export async function insertClaim(db: DbClient, input: CreateClaimInput): Promise<Claim> {
  const now = new Date().toISOString();
  const { data, error } = await db.from('claims').insert({
    id: input.id,
    claim_type_id: input.claimTypeId,
    name: input.name,
    description: input.description,
    organization_id: input.organizationId,
    domain: input.domain,
    decays: input.decays,
    decay_period_months: input.decayPeriodMonths,
    valid_evidence_classes: input.validEvidenceClasses,
    required_evidence_classes: input.requiredEvidenceClasses,
    created_by_actor_id: input.provenance.createdByActorId,
    created_by_org_id: input.provenance.createdByOrganizationId,
    correlation_id: input.provenance.correlationId,
    provenance_summary: input.provenance.summary,
    source_event_id: input.provenance.sourceEventId ?? null,
    owning_org_id: input.organizationId,
    created_at: now,
    updated_at: now,
  });

  if (error) throw new Error(`Failed to insert claim: ${error}`);
  return data as unknown as Claim;
}

export async function getClaimById(db: DbClient, claimId: string): Promise<Claim | null> {
  const { data, error } = await db.from('claims').select('*').eq('id', claimId);
  if (error) throw new Error(`Failed to get claim: ${error}`);
  return (data as unknown as Claim[])?.at(0) ?? null;
}

// --------------------------------------------------------------------------
// Evidence Node repository
// --------------------------------------------------------------------------

export interface CreateEvidenceNodeInput {
  id?: string;
  claimId: string;
  evidenceClass: EvidenceClass;
  content: string;
  source: string;
  date: string;
  weight: number;
  provenance: ProvenanceMetadata;
  visibility: VisibilityMetadata;
}

export async function insertEvidenceNode(
  db: DbClient,
  input: CreateEvidenceNodeInput,
): Promise<EvidenceNode> {
  const { data, error } = await db.from('evidence_nodes').insert({
    id: input.id,
    claim_id: input.claimId,
    evidence_class: input.evidenceClass,
    content: input.content,
    source: input.source,
    node_date: input.date,
    weight: input.weight,
    provenance: input.provenance as unknown as Record<string, unknown>,
    visibility: input.visibility as unknown as Record<string, unknown>,
    is_counter_evidence: false,
    has_response: false,
  });

  if (error) throw new Error(`Failed to insert evidence node: ${error}`);
  return data as unknown as EvidenceNode;
}

export async function getEvidenceNodesByClaim(
  db: DbClient,
  claimId: string,
): Promise<EvidenceNode[]> {
  const { data, error } = await db.from('evidence_nodes').select('*').eq('claim_id', claimId);
  if (error) throw new Error(`Failed to get evidence nodes: ${error}`);
  return (data as unknown as EvidenceNode[]) ?? [];
}

// --------------------------------------------------------------------------
// Counter Evidence repository
// --------------------------------------------------------------------------

export interface CreateCounterEvidenceInput {
  id?: string;
  claimId: string;
  evidenceClass: EvidenceClass;
  content: string;
  source: string;
  date: string;
  weight: number;
  provenance: ProvenanceMetadata;
  visibility: VisibilityMetadata;
}

export async function insertCounterEvidence(
  db: DbClient,
  input: CreateCounterEvidenceInput,
): Promise<CounterEvidence> {
  const { data, error } = await db.from('evidence_nodes').insert({
    id: input.id,
    claim_id: input.claimId,
    evidence_class: input.evidenceClass,
    content: input.content,
    source: input.source,
    node_date: input.date,
    weight: -Math.abs(input.weight), // enforce negative
    provenance: input.provenance as unknown as Record<string, unknown>,
    visibility: input.visibility as unknown as Record<string, unknown>,
    is_counter_evidence: true,
    has_response: false,
  });

  if (error) throw new Error(`Failed to insert counter evidence: ${error}`);
  return data as unknown as CounterEvidence;
}

// --------------------------------------------------------------------------
// Right of Response repository
// --------------------------------------------------------------------------

export interface CreateRightOfResponseInput {
  id?: string;
  counterEvidenceId: string;
  description: string;
  resolutionDate: string;
  supportingEvidenceIds?: string[];
  provenance: ProvenanceMetadata;
  visibility: VisibilityMetadata;
}

export async function insertRightOfResponse(
  db: DbClient,
  input: CreateRightOfResponseInput,
): Promise<RightOfResponse> {
  const { data, error } = await db.from('right_of_response').insert({
    id: input.id,
    counter_evidence_id: input.counterEvidenceId,
    description: input.description,
    resolution_date: input.resolutionDate,
    supporting_evidence_ids: input.supportingEvidenceIds ?? [],
    created_by_actor_id: input.provenance.createdByActorId,
    created_by_org_id: input.provenance.createdByOrganizationId,
    correlation_id: input.provenance.correlationId,
    provenance_summary: input.provenance.summary,
    owning_org_id: input.visibility.owningOrganizationId,
  });

  if (error) throw new Error(`Failed to insert right of response: ${error}`);
  return data as unknown as RightOfResponse;
}

// --------------------------------------------------------------------------
// Evidence Relationship repository
// --------------------------------------------------------------------------

export interface CreateRelationshipInput {
  id?: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: 'supports' | 'contradicts' | 'corroborates' | 'responds_to' | 'supersedes';
  provenance: { correlationId: string; summary: string };
}

export async function insertRelationship(
  db: DbClient,
  input: CreateRelationshipInput,
): Promise<EvidenceRelationship> {
  const { data, error } = await db.from('evidence_relationships').insert({
    id: input.id,
    source_node_id: input.sourceNodeId,
    target_node_id: input.targetNodeId,
    relationship_type: input.relationshipType,
    provenance: input.provenance as unknown as Record<string, unknown>,
  });

  if (error) throw new Error(`Failed to insert relationship: ${error}`);
  return data as unknown as EvidenceRelationship;
}
