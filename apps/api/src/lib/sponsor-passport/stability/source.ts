/**
 * Stability Source Layer.
 *
 * Converts productive Evidence Core/audit inputs into the internal Stability
 * lifecycle snapshot.
 */

import {
  evaluateClaim,
  type AuditAction,
  type Claim,
  type CounterEvidence,
  type EvidenceNode,
} from '@kadarn/evidence-core'
import type {
  CapabilityTemporalState,
  ConfidenceLevel,
} from '../types'
import {
  STABILITY_REVIEW_STATUS,
  type StabilityDomainState,
  type StabilityKnowledgeSignal,
  type StabilityLifecycleSnapshot,
  type StabilityMovementSignal,
  type StabilityReviewSignal,
} from './types'

const CORE_TO_STABILITY_CONFIDENCE = {
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  insufficient: 'Insufficient',
} as const satisfies Record<string, ConfidenceLevel>

const REVIEW_AUDIT_ACTIONS = new Set<AuditAction>([
  'counter_evidence.submitted',
  'right_of_response.submitted',
  'process_state.updated',
])

const MOVEMENT_AUDIT_ACTIONS = new Set<AuditAction>([
  'claim.created',
  'evidence.submitted',
  'evidence.linked',
  'counter_evidence.submitted',
  'right_of_response.submitted',
  'process_state.updated',
  'evidence.superseded',
])

export interface StabilitySourceEvidenceRead {
  institutionId: string
  claims: Claim[]
  evidenceByClaimId: Record<string, EvidenceNode[]>
}

export interface StabilitySourceAuditEvent {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  createdAt: string
}

export interface BuildStabilitySourceSnapshotParams {
  read: StabilitySourceEvidenceRead
  auditEvents?: StabilitySourceAuditEvent[]
  actorId: string
  correlationId: string
  referenceDate?: Date
  previousState?: StabilityDomainState
}

function splitEvidenceNodes(nodes: EvidenceNode[]): {
  evidenceNodes: EvidenceNode[]
  counterEvidence: CounterEvidence[]
} {
  const evidenceNodes: EvidenceNode[] = []
  const counterEvidence: CounterEvidence[] = []

  for (const node of nodes) {
    if (node.weight < 0) {
      counterEvidence.push({
        ...node,
        isCounterEvidence: true,
        hasResponse: false,
        responseId: null,
      })
    } else {
      evidenceNodes.push(node)
    }
  }

  return { evidenceNodes, counterEvidence }
}

function parseEvidenceDate(value: string): Date | null {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function mapTemporalState(params: {
  claim: Claim
  evidenceNodes: EvidenceNode[]
  referenceDate: Date
}): CapabilityTemporalState {
  const supportingNodes = params.evidenceNodes.filter((node) => node.weight >= 0)

  if (supportingNodes.length === 0) {
    return 'aging'
  }

  const latestEvidenceDate = supportingNodes.reduce<Date | null>((latest, node) => {
    const parsed = parseEvidenceDate(node.date)
    if (!parsed) return latest
    if (!latest || parsed > latest) return parsed
    return latest
  }, null)

  if (!latestEvidenceDate) {
    return 'aging'
  }

  if (!params.claim.decays || params.claim.decayPeriodMonths == null) {
    return 'fresh'
  }

  const elapsedMs = params.referenceDate.getTime() - latestEvidenceDate.getTime()
  const elapsedMonths = elapsedMs / (1000 * 60 * 60 * 24 * 30)

  if (elapsedMonths >= params.claim.decayPeriodMonths) {
    return 'decayed'
  }

  if (elapsedMonths >= params.claim.decayPeriodMonths * 0.7) {
    return 'aging'
  }

  return 'fresh'
}

function mapConfidenceLevel(
  level: keyof typeof CORE_TO_STABILITY_CONFIDENCE,
): ConfidenceLevel {
  return CORE_TO_STABILITY_CONFIDENCE[level]
}

export function buildStabilityKnowledgeSignal(params: {
  claim: Claim
  evidenceNodes: EvidenceNode[]
  actorId: string
  correlationId: string
  referenceDate: Date
}): StabilityKnowledgeSignal {
  const { evidenceNodes, counterEvidence } = splitEvidenceNodes(params.evidenceNodes)
  const report = evaluateClaim({
    claimId: params.claim.id,
    claims: [params.claim],
    evidenceNodes,
    counterEvidence,
    actorId: params.actorId,
    correlationId: params.correlationId,
  })

  return {
    claimId: params.claim.id,
    confidence: mapConfidenceLevel(report.confidenceLevel),
    temporalState: mapTemporalState({
      claim: params.claim,
      evidenceNodes: params.evidenceNodes,
      referenceDate: params.referenceDate,
    }),
    hasSupportingEvidence: evidenceNodes.length > 0,
    hasCounterEvidence: counterEvidence.length > 0,
    contested: report.hasUnresolvedCounterEvidence,
  }
}

function isEvidenceCoreAudit(row: StabilitySourceAuditEvent): boolean {
  return row.resourceType === 'evidence_core'
}

function isReviewAuditAction(action: string): action is AuditAction {
  return REVIEW_AUDIT_ACTIONS.has(action as AuditAction)
}

function isMovementAuditAction(action: string): action is AuditAction {
  return MOVEMENT_AUDIT_ACTIONS.has(action as AuditAction)
}

export function mapAuditEventsToStabilityReviewSignals(
  rows: StabilitySourceAuditEvent[],
): StabilityReviewSignal[] {
  return rows
    .filter((row) => isEvidenceCoreAudit(row) && isReviewAuditAction(row.action))
    .map((row) => ({
      id: row.id,
      subjectId: row.resourceId ?? row.id,
      status: STABILITY_REVIEW_STATUS.OPEN,
    }))
}

export function mapAuditEventsToStabilityMovementSignals(
  rows: StabilitySourceAuditEvent[],
): StabilityMovementSignal[] {
  return rows
    .filter((row) => isEvidenceCoreAudit(row) && isMovementAuditAction(row.action))
    .map((row) => ({
      id: row.id,
      occurredAt: row.createdAt,
    }))
}

export function buildStabilityLifecycleSnapshotFromSource(
  params: BuildStabilitySourceSnapshotParams,
): StabilityLifecycleSnapshot {
  const referenceDate = params.referenceDate ?? new Date()
  const auditEvents = params.auditEvents ?? []

  return {
    institutionId: params.read.institutionId,
    knowledgeSignals: params.read.claims.map((claim) =>
      buildStabilityKnowledgeSignal({
        claim,
        evidenceNodes: params.read.evidenceByClaimId[claim.id] ?? [],
        actorId: params.actorId,
        correlationId: params.correlationId,
        referenceDate,
      }),
    ),
    reviewSignals: mapAuditEventsToStabilityReviewSignals(auditEvents),
    movementSignals: mapAuditEventsToStabilityMovementSignals(auditEvents),
    previousState: params.previousState,
  }
}
