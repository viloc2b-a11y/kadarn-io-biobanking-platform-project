import { apiGet, apiPost } from '@/lib/api-client'
import type {
  CurationEvent,
  DashboardData,
  DiscoverySession,
  ProvenanceData,
  ProvenanceTargetType,
  PipelineStatusData,
  ValidationNote,
} from './types'

export async function listDiscoverySessions(): Promise<DiscoverySession[]> {
  return apiGet<DiscoverySession[]>('/api/v1/discovery/session')
}

export async function openDiscoverySession(): Promise<DiscoverySession> {
  return apiPost<DiscoverySession>('/api/v1/discovery/session', {})
}

export async function fetchDiscoveryDashboard(sessionId: string): Promise<DashboardData> {
  return apiGet<DashboardData>(`/api/v1/discovery/dashboard?sessionId=${encodeURIComponent(sessionId)}`)
}

export async function fetchDiscoveryPipelineStatus(sessionId: string): Promise<PipelineStatusData> {
  return apiGet<PipelineStatusData>(`/api/v1/discovery/pipeline-status?sessionId=${encodeURIComponent(sessionId)}`)
}

export async function fetchDiscoveryProvenance(params: {
  sessionId: string
  targetType: ProvenanceTargetType
  targetId: string
}): Promise<ProvenanceData> {
  const qs = new URLSearchParams({
    sessionId: params.sessionId,
    targetType: params.targetType,
    targetId: params.targetId,
  })
  return apiGet<ProvenanceData>(`/api/v1/discovery/provenance?${qs.toString()}`)
}

export async function submitCurationAction(payload: {
  targetType: string
  targetId: string
  action: string
  reason?: string
  discoveryRunId: string
  enrichmentPayload?: Record<string, unknown>
}): Promise<CurationEvent> {
  return apiPost<CurationEvent>('/api/v1/discovery/curation', payload)
}

export async function submitValidationNote(payload: {
  discoverySessionId: string
  discoveryRunId?: string
  category: string
  note: string
  targetType?: string
  targetId?: string
}): Promise<ValidationNote> {
  return apiPost<ValidationNote>('/api/v1/discovery/validation-notes', payload)
}

export const CURATION_ACTIONS = [
  'ACCEPT',
  'REJECT',
  'ENRICH',
  'DEFER',
  'NEEDS_MORE_EVIDENCE',
  'MERGE',
  'SPLIT',
  'ARCHIVE',
] as const

export const CURATION_ACTION_LABELS: Record<(typeof CURATION_ACTIONS)[number], string> = {
  ACCEPT: 'Accept for review',
  REJECT: 'Reject',
  ENRICH: 'Enrich',
  DEFER: 'Defer',
  NEEDS_MORE_EVIDENCE: 'Needs more evidence',
  MERGE: 'Merge',
  SPLIT: 'Split',
  ARCHIVE: 'Archive',
}

export const CURATION_TARGET_TYPES = [
  'EVIDENCE_CANDIDATE',
  'CLASSIFICATION',
  'ENTITY',
  'RELATIONSHIP',
  'SNAPSHOT_ITEM',
] as const

export const CURATION_TARGET_TYPE_LABELS: Record<(typeof CURATION_TARGET_TYPES)[number], string> = {
  EVIDENCE_CANDIDATE: 'Evidence candidate',
  CLASSIFICATION: 'Document classification',
  ENTITY: 'Entity',
  RELATIONSHIP: 'Relationship',
  SNAPSHOT_ITEM: 'Snapshot item',
}

export const VALIDATION_CATEGORIES = [
  'GOT_RIGHT',
  'MISSED',
  'FALSE_POSITIVE',
  'FALSE_NEGATIVE',
  'SURPRISING',
  'DOCUMENT_TO_REQUEST',
  'USER_REACTION',
  'TTFV',
  'GENERAL',
] as const
