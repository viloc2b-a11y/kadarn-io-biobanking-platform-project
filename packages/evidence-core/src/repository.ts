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
  ClaimStatus,
  EvidenceNode,
  EvidenceNodeStatus,
  EvidenceRelationship,
  CounterEvidence,
  RightOfResponse,
  ProvenanceMetadata,
  VisibilityMetadata,
  VisibilityScope,
} from './types.js';

// --------------------------------------------------------------------------
// Row mappers (read path — snake_case DB → domain types)
// --------------------------------------------------------------------------

function mapClaimRow(row: Record<string, unknown>): Claim {
  return {
    id: String(row.id),
    claimTypeId: String(row.claim_type_id),
    name: String(row.name),
    description: String(row.description),
    organizationId: String(row.organization_id),
    status: (row.status as ClaimStatus) ?? 'active',
    domain: String(row.domain),
    decays: Boolean(row.decays),
    decayPeriodMonths: row.decay_period_months == null ? null : Number(row.decay_period_months),
    validEvidenceClasses: (row.valid_evidence_classes as EvidenceClass[]) ?? [],
    requiredEvidenceClasses: (row.required_evidence_classes as EvidenceClass[]) ?? [],
    temporal: {
      createdAt: String(row.created_at ?? ''),
      updatedAt: String(row.updated_at ?? ''),
      decayPeriodMonths: row.decay_period_months == null ? null : Number(row.decay_period_months),
    },
    provenance: {
      createdByActorId: String(row.created_by_actor_id ?? ''),
      createdByOrganizationId: String(row.created_by_org_id ?? row.organization_id ?? ''),
      correlationId: String(row.correlation_id ?? ''),
      summary: String(row.provenance_summary ?? ''),
      sourceEventId: row.source_event_id ? String(row.source_event_id) : undefined,
    },
    visibility: {
      owningOrganizationId: String(row.owning_org_id ?? row.organization_id ?? ''),
      scope: (row.visibility_scope as VisibilityScope) ?? 'site',
      authorizedSponsorIds: (row.authorized_sponsor_ids as string[]) ?? [],
    },
  };
}

function mapEvidenceNodeRow(row: Record<string, unknown>): EvidenceNode {
  const provenanceJson = row.provenance as Partial<ProvenanceMetadata> | undefined;
  const visibilityJson = row.visibility as Partial<VisibilityMetadata> | undefined;

  return {
    id: String(row.id),
    claimId: String(row.claim_id),
    evidenceClass: row.evidence_class as EvidenceClass,
    content: String(row.content),
    source: String(row.source),
    date: String(row.node_date ?? row.date ?? ''),
    status: (row.status as EvidenceNodeStatus) ?? 'active',
    weight: Number(row.weight),
    provenance: {
      createdByActorId: provenanceJson?.createdByActorId ?? String(row.created_by_actor_id ?? ''),
      createdByOrganizationId:
        provenanceJson?.createdByOrganizationId ?? String(row.created_by_org_id ?? ''),
      correlationId: provenanceJson?.correlationId ?? String(row.correlation_id ?? ''),
      summary: provenanceJson?.summary ?? String(row.provenance_summary ?? ''),
      sourceEventId: provenanceJson?.sourceEventId,
    },
    visibility: {
      owningOrganizationId:
        visibilityJson?.owningOrganizationId ?? String(row.owning_org_id ?? ''),
      scope: visibilityJson?.scope ?? 'site',
      authorizedSponsorIds: visibilityJson?.authorizedSponsorIds ?? [],
    },
    temporal: {
      createdAt: String(row.created_at ?? ''),
      updatedAt: String(row.updated_at ?? ''),
      decayPeriodMonths: null,
    },
  };
}

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
  const row = (data as Record<string, unknown>[])?.at(0);
  return row ? mapClaimRow(row) : null;
}

export async function getClaimsByOrganizationId(
  db: DbClient,
  organizationId: string,
): Promise<Claim[]> {
  const { data, error } = await db.from('claims').select('*').eq('organization_id', organizationId);
  if (error) throw new Error(`Failed to get claims by organization: ${error}`);
  const rows = (data as Record<string, unknown>[]) ?? [];
  return rows.map(mapClaimRow);
}

export interface OrganizationEvidenceRead {
  organizationId: string;
  claims: Claim[];
  evidenceNodes: EvidenceNode[];
}

export async function getOrganizationEvidenceRead(
  db: DbClient,
  organizationId: string,
): Promise<OrganizationEvidenceRead> {
  const claims = await getClaimsByOrganizationId(db, organizationId);
  const evidenceNodes = await getEvidenceNodesByClaimIds(
    db,
    claims.map((claim) => claim.id),
  );
  return { organizationId, claims, evidenceNodes };
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
  const rows = (data as Record<string, unknown>[]) ?? [];
  return rows.map(mapEvidenceNodeRow);
}

export async function getEvidenceNodesByClaimIds(
  db: DbClient,
  claimIds: string[],
): Promise<EvidenceNode[]> {
  if (claimIds.length === 0) return [];

  const nodes: EvidenceNode[] = [];
  for (const claimId of claimIds) {
    const claimNodes = await getEvidenceNodesByClaim(db, claimId);
    nodes.push(...claimNodes);
  }
  return nodes;
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
