// ==========================================================================
// Discovery agent adapter — Compatibility Layer for capability/claim outputs
// Sprint 28D route convergence
// ==========================================================================

import type { PublishedView } from '@kadarn/types/phase8'
import type { CanonicalClaimViewModel } from '@kadarn/types/phase8'
import { PublishedViewEngine, confidenceLevelFromScore, type ViewAudience } from './engine'
import type { AgentOutputMap } from './engine-output-builder'

export const DISCOVERY_ADAPTER_VERSION = 'discovery-read:1.0.0'

export interface DiscoveryAdaptContext {
  orgId: string
  sessionId: string
  audience?: ViewAudience
}

export interface DiscoveryAdaptResult {
  agentOutputs: AgentOutputMap
  views: PublishedView[]
}

function cloneAgentOutputs(agentOutputs: AgentOutputMap): AgentOutputMap {
  return JSON.parse(JSON.stringify(agentOutputs)) as AgentOutputMap
}

function publishDiscoveryItem(
  engine: PublishedViewEngine,
  item: Record<string, unknown>,
  itemType: 'capability' | 'claim_candidate',
  ctx: DiscoveryAdaptContext,
  index: number,
): PublishedView {
  const id = String(item.id ?? item.capabilityId ?? `${itemType}:${index}`)
  const name = String(item.name ?? item.reasoning ?? item.title ?? id)
  const claimTypeId = String(
    item.claimTypeId ?? item.proposedClaimTypeId ?? item.type ?? itemType,
  )
  const confidence = Number(item.confidence ?? item.confidence_score ?? 50)

  return engine.publish({
    claimInstanceId: id,
    claimVersionId: `discovery-v1:${id}`,
    orgId: ctx.orgId,
    confidenceLevel: confidenceLevelFromScore(confidence),
    confidenceValue: confidence,
    audience: ctx.audience ?? 'canonical',
    visibilityPolicyRef: `discovery:${itemType}:${ctx.sessionId}`,
    adapterVersion: DISCOVERY_ADAPTER_VERSION,
    projection: {
      claim_type_id: claimTypeId,
      claim_instance_id: id,
      claim_version_id: `discovery-v1:${id}`,
      schema_version: 'discovery:agent:1.0.0',
      subject_entity_id: ctx.orgId,
      summary: name,
      attributes: {
        item_type: itemType,
        session_id: ctx.sessionId,
        source_agent: itemType === 'capability' ? 'capability_detector' : 'claim_candidate_detector',
        payload: JSON.stringify(item),
      } as CanonicalClaimViewModel['attributes'],
      evidence_refs: [],
      lifecycle_state: String(item.status ?? 'proposed'),
      adapter_version: DISCOVERY_ADAPTER_VERSION,
    },
  })
}

function rebuildCapabilityOutput(views: PublishedView[]): Record<string, unknown> | undefined {
  const caps = views
    .filter(v => v.projection.attributes.item_type === 'capability')
    .map(v => JSON.parse(String(v.projection.attributes.payload)) as Record<string, unknown>)

  if (caps.length === 0) return undefined
  return { capabilities: caps }
}

function rebuildClaimCandidateOutput(views: PublishedView[]): Record<string, unknown> | undefined {
  const candidates = views
    .filter(v => v.projection.attributes.item_type === 'claim_candidate')
    .map(v => JSON.parse(String(v.projection.attributes.payload)) as Record<string, unknown>)

  if (candidates.length === 0) return undefined
  return { candidates }
}

/**
 * Route discovery agent capability/claim outputs through Published Views.
 * Preserves agentOutputs shape for backward compatibility.
 */
export function adaptDiscoveryAgentOutputs(
  agentOutputs: AgentOutputMap,
  ctx: DiscoveryAdaptContext,
): DiscoveryAdaptResult {
  const engine = new PublishedViewEngine()
  const views: PublishedView[] = []
  const result = cloneAgentOutputs(agentOutputs)

  const capOutput = agentOutputs['capability_detector']?.output
  const capabilities = (capOutput?.capabilities as Array<Record<string, unknown>>) ?? []
  for (let i = 0; i < capabilities.length; i++) {
    views.push(publishDiscoveryItem(engine, capabilities[i], 'capability', ctx, i))
  }

  const claimOutput = agentOutputs['claim_candidate_detector']?.output
  const candidates = (claimOutput?.candidates as Array<Record<string, unknown>>) ?? []
  for (let i = 0; i < candidates.length; i++) {
    views.push(publishDiscoveryItem(engine, candidates[i], 'claim_candidate', ctx, i))
  }

  const rebuiltCaps = rebuildCapabilityOutput(views)
  if (rebuiltCaps && result['capability_detector']) {
    result['capability_detector'] = {
      ...result['capability_detector'],
      output: rebuiltCaps,
    }
  }

  const rebuiltClaims = rebuildClaimCandidateOutput(views)
  if (rebuiltClaims && result['claim_candidate_detector']) {
    result['claim_candidate_detector'] = {
      ...result['claim_candidate_detector'],
      output: rebuiltClaims,
    }
  }

  return { agentOutputs: result, views }
}

/** Register discovery_candidates rows as Published Views; return same row shapes */
export function adaptDiscoveryCandidates<T extends Record<string, unknown>>(
  candidates: T[],
  ctx: DiscoveryAdaptContext,
): { candidates: T[]; views: PublishedView[] } {
  const engine = new PublishedViewEngine()
  const views: PublishedView[] = []

  for (let i = 0; i < candidates.length; i++) {
    views.push(
      publishDiscoveryItem(
        engine,
        candidates[i],
        'claim_candidate',
        ctx,
        i,
      ),
    )
  }

  return { candidates, views }
}
