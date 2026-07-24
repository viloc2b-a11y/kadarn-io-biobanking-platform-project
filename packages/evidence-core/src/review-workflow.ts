// ==========================================================================
// Kadarn Evidence Core — Review Workflow
// ==========================================================================
// Vertical slice: create claim → attach evidence → review → assess confidence → publish
// ==========================================================================

import type { DbClient } from './db.js';
import { recordAuditEntry, createAuditEntry } from './audit.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type WorkflowState = 'draft' | 'declared' | 'pending_evidence' | 'under_review' | 'published' | 'disputed' | 'archived';

export type ReviewTaskType = 'classification' | 'extraction_review' | 'evidence_review' | 'confidence_review' | 'publication_review' | 'dispute_review';

export type ReviewTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';

export interface ReviewTask {
  id: string;
  organizationId: string;
  claimId?: string;
  evidenceNodeId?: string;
  taskType: ReviewTaskType;
  status: ReviewTaskStatus;
  assignedTo?: string;
  assignedAt?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface ActorContext {
  actorId: string;
  organizationId: string;
  correlationId: string;
}

// --------------------------------------------------------------------------
// Workflow state machine
// --------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  draft: ['declared', 'archived'],
  declared: ['pending_evidence', 'archived'],
  pending_evidence: ['under_review', 'declared'],
  under_review: ['published', 'disputed', 'pending_evidence'],
  published: ['disputed', 'archived'],
  disputed: ['under_review', 'archived'],
  archived: [],
};

export function isValidTransition(from: WorkflowState, to: WorkflowState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function advanceWorkflowState(
  db: DbClient,
  ctx: ActorContext,
  claimId: string,
  newState: WorkflowState,
  reason?: string,
): Promise<{ previousState: WorkflowState; newState: WorkflowState }> {
  // Get current state via RPC
  const { data: stateRow } = await db.rpc('get_claim_workflow_state', { p_claim_id: claimId });
  const currentState: WorkflowState = (stateRow as any)?.workflow_state ?? 'draft';

  if (!isValidTransition(currentState, newState)) {
    throw new Error(`Invalid workflow transition: ${currentState} → ${newState}`);
  }

  // Update via RPC (enforces append-only on claim_workflow table)
  await db.rpc('advance_claim_workflow', {
    p_claim_id: claimId,
    p_new_state: newState,
    p_actor_id: ctx.actorId,
    p_reason: reason ?? null,
  });

  // Audit
  await recordAuditEntry(db, createAuditEntry({
    action: 'workflow.advanced',
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    entityId: claimId,
    summary: `Claim ${claimId}: ${currentState} → ${newState}${reason ? ` (${reason})` : ''}`,
    details: { previousState: currentState, newState, reason },
  }));

  return { previousState: currentState, newState };
}

// --------------------------------------------------------------------------
// Create review task
// --------------------------------------------------------------------------

export async function createReviewTask(
  db: DbClient,
  ctx: ActorContext,
  task: {
    claimId?: string;
    evidenceNodeId?: string;
    taskType: ReviewTaskType;
    assignedTo?: string;
    notes?: string;
  },
): Promise<ReviewTask> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const { error } = await db.from('review_tasks').insert({
    id,
    organization_id: ctx.organizationId,
    claim_id: task.claimId ?? null,
    evidence_node_id: task.evidenceNodeId ?? null,
    task_type: task.taskType,
    status: 'pending',
    assigned_to: task.assignedTo ?? null,
    assigned_at: task.assignedTo ? now : null,
    notes: task.notes ?? null,
    created_at: now,
    created_by: ctx.actorId,
  });

  if (error) throw new Error(`Failed to create review task: ${error}`);

  await recordAuditEntry(db, createAuditEntry({
    action: 'review_task.created',
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    entityId: id,
    summary: `Review task created: ${task.taskType}${task.claimId ? ` for claim ${task.claimId}` : ''}`,
    details: { taskType: task.taskType, claimId: task.claimId },
  }));

  return {
    id,
    organizationId: ctx.organizationId,
    claimId: task.claimId,
    evidenceNodeId: task.evidenceNodeId,
    taskType: task.taskType,
    status: 'pending',
    assignedTo: task.assignedTo,
    notes: task.notes,
    createdAt: now,
    createdBy: ctx.actorId,
  };
}

// --------------------------------------------------------------------------
// Complete review task
// --------------------------------------------------------------------------

export async function completeReviewTask(
  db: DbClient,
  ctx: ActorContext,
  taskId: string,
  status: 'completed' | 'skipped' | 'cancelled',
  notes?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db.rpc('complete_review_task', {
    p_task_id: taskId,
    p_status: status,
    p_completed_by: ctx.actorId,
    p_completed_at: now,
    p_notes: notes ?? null,
  });

  if (error) throw new Error(`Failed to complete review task: ${error}`);

  await recordAuditEntry(db, createAuditEntry({
    action: 'review_task.completed',
    actorId: ctx.actorId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    entityId: taskId,
    summary: `Review task ${taskId} → ${status}`,
    details: { taskId, status, notes },
  }));
}

// --------------------------------------------------------------------------
// List review tasks
// --------------------------------------------------------------------------

export async function listReviewTasks(
  db: DbClient,
  organizationId: string,
  filters?: { status?: ReviewTaskStatus; taskType?: ReviewTaskType; claimId?: string },
): Promise<ReviewTask[]> {
  const { data } = await db.rpc('list_review_tasks', {
    p_organization_id: organizationId,
    p_status: filters?.status ?? null,
    p_task_type: filters?.taskType ?? null,
    p_claim_id: filters?.claimId ?? null,
  });

  const rows = (data as Record<string, unknown>[]) ?? [];
  return rows.map(mapReviewTaskRow);
}

// --------------------------------------------------------------------------
// Row mapper
// --------------------------------------------------------------------------

function mapReviewTaskRow(row: Record<string, unknown>): ReviewTask {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    claimId: row.claim_id ? String(row.claim_id) : undefined,
    evidenceNodeId: row.evidence_node_id ? String(row.evidence_node_id) : undefined,
    taskType: row.task_type as ReviewTaskType,
    status: row.status as ReviewTaskStatus,
    assignedTo: row.assigned_to ? String(row.assigned_to) : undefined,
    assignedAt: row.assigned_at ? String(row.assigned_at) : undefined,
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    completedBy: row.completed_by ? String(row.completed_by) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
    createdBy: String(row.created_by),
  };
}
