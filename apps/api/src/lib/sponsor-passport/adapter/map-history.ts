/**
 * RC-11.7 — Evidence Core audit events → PassportHistoryEvent[].
 *
 * Claim/evidence lifecycle actions only — no portfolio or confidence invention.
 */

import type { AuditAction } from '@kadarn/evidence-core'
import type { PassportHistoryEvent } from '../types'
import type { AuditEventRecord } from './queries'

const CLAIM_EVIDENCE_ACTIONS = new Set<AuditAction>([
  'claim.created',
  'evidence.submitted',
  'evidence.linked',
  'counter_evidence.submitted',
  'right_of_response.submitted',
  'process_state.updated',
  'evidence.superseded',
])

const EVENT_TYPE_LABELS: Record<AuditAction, string> = {
  'claim.created': 'Claim created',
  'evidence.submitted': 'Evidence submitted',
  'evidence.linked': 'Evidence linked',
  'counter_evidence.submitted': 'Counter evidence submitted',
  'right_of_response.submitted': 'Right of response submitted',
  'process_state.updated': 'Process state updated',
  'evidence.superseded': 'Evidence superseded',
  'relationship.created': 'Relationship created',
}

function resolveActor(row: AuditEventRecord): string | undefined {
  if (row.actorEmail) return row.actorEmail
  if (row.actorId) return row.actorId
  return undefined
}

function resolveEventType(action: string): string {
  if (action in EVENT_TYPE_LABELS) {
    return EVENT_TYPE_LABELS[action as AuditAction]
  }
  return action
}

export function isClaimEvidenceAuditAction(action: string): action is AuditAction {
  return CLAIM_EVIDENCE_ACTIONS.has(action as AuditAction)
}

export function mapAuditEventToPassportHistoryEvent(row: AuditEventRecord): PassportHistoryEvent {
  const actor = resolveActor(row)
  const event: PassportHistoryEvent = {
    id: row.id,
    occurredAt: row.createdAt,
    eventType: resolveEventType(row.action),
    description: row.summary,
  }
  if (actor) {
    event.actor = actor
  }
  return event
}

export function mapAuditEventsToPassportHistory(rows: AuditEventRecord[]): PassportHistoryEvent[] {
  return rows
    .filter((row) => row.resourceType === 'evidence_core' && isClaimEvidenceAuditAction(row.action))
    .map(mapAuditEventToPassportHistoryEvent)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}
