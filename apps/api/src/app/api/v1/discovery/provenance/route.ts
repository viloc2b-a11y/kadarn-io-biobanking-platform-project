// ==========================================================================
// Discovery Dashboard — Provenance API (read-only)
// ==========================================================================
// GET /api/v1/discovery/provenance?sessionId=&targetType=&targetId=
// Traces reviewable items back through agent output → Layer 1 → Layer 0.
// Never writes to Evidence Core. Never mutates Layer 0 or Layer 1.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';

const VALID_TARGET_TYPES = [
  'ENTITY',
  'RELATIONSHIP',
  'CAPABILITY',
  'CLAIM_CANDIDATE',
] as const;

type ProvenanceTargetType = typeof VALID_TARGET_TYPES[number];

const ARTIFACT_AGENT_NAMES: Record<ProvenanceTargetType, string[]> = {
  ENTITY: ['entity-extractor', 'entity_extractor'],
  RELATIONSHIP: ['relationship-extractor', 'relationship_extractor'],
  CAPABILITY: ['capability_detector'],
  CLAIM_CANDIDATE: ['claim_candidate_detector'],
};

interface AgentOutputRow {
  id: string;
  agent_name: string;
  agent_version: string;
  status: string;
  output: Record<string, unknown>;
  confidence: number;
  provenance: Record<string, unknown>;
  layer1_id: string;
  artifact_id: string;
  created_at: string;
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value as Record<string, unknown>[] : [];
}

function findItemInOutput(
  targetType: ProvenanceTargetType,
  targetId: string,
  output: Record<string, unknown>,
): Record<string, unknown> | null {
  switch (targetType) {
    case 'ENTITY':
      return asArray(output.entities).find((e) => String(e.entityId) === targetId) ?? null;
    case 'RELATIONSHIP':
      return asArray(output.relationships).find(
        (r) => String(r.relationshipId ?? `${r.type}-${r.sourceEntityId}-${r.targetEntityId}`) === targetId,
      ) ?? null;
    case 'CAPABILITY':
      return asArray(output.capabilities).find((c) => String(c.capabilityId) === targetId) ?? null;
    case 'CLAIM_CANDIDATE':
      return asArray(output.candidates).find((c) => String(c.claimId ?? c.id) === targetId) ?? null;
    default:
      return null;
  }
}

function itemLabel(targetType: ProvenanceTargetType, item: Record<string, unknown>): string {
  switch (targetType) {
    case 'ENTITY':
      return String(item.value ?? item.entityId ?? 'Entity');
    case 'RELATIONSHIP':
      return `${String(item.sourceEntityId ?? 'source')} → ${String(item.targetEntityId ?? 'target')}`;
    case 'CAPABILITY':
      return String(item.name ?? item.label ?? item.capabilityId ?? 'Capability');
    case 'CLAIM_CANDIDATE':
      return String(item.summary ?? item.claimLabel ?? item.label ?? item.claimId ?? 'Claim candidate');
    default:
      return targetType;
  }
}

function itemTypeLabel(targetType: ProvenanceTargetType, item: Record<string, unknown>): string {
  switch (targetType) {
    case 'ENTITY':
      return String(item.type ?? 'ENTITY');
    case 'RELATIONSHIP':
      return String(item.type ?? 'RELATIONSHIP');
    case 'CAPABILITY':
      return String(item.category ?? item.status ?? 'CAPABILITY');
    case 'CLAIM_CANDIDATE':
      return String(item.status ?? 'CLAIM_CANDIDATE');
    default:
      return targetType;
  }
}

function sourceSpan(item: Record<string, unknown>): string | null {
  const span = item.sourceSpan ?? item.source_span ?? item.evidenceSummary;
  return span != null ? String(span) : null;
}

function relatedIds(item: Record<string, unknown>, targetType: ProvenanceTargetType): {
  entityIds: string[];
  relationshipIds: string[];
  artifactIds: string[];
  capabilityIds: string[];
  claimIds: string[];
} {
  const supporting = item.supportingEvidence as Record<string, unknown> | undefined;

  const entityIds = [
    ...(Array.isArray(item.supportingEntityIds) ? item.supportingEntityIds.map(String) : []),
    ...(Array.isArray(supporting?.entityIds) ? (supporting.entityIds as string[]) : []),
    ...(targetType === 'RELATIONSHIP'
      ? [String(item.sourceEntityId ?? ''), String(item.targetEntityId ?? '')]
      : []),
  ].filter(Boolean);

  return {
    entityIds,
    relationshipIds: [
      ...(Array.isArray(item.supportingRelationshipIds) ? item.supportingRelationshipIds.map(String) : []),
      ...(Array.isArray(supporting?.relationshipIds) ? (supporting.relationshipIds as string[]) : []),
    ].filter(Boolean),
    artifactIds: [
      ...(Array.isArray(item.supportingArtifactIds) ? item.supportingArtifactIds.map(String) : []),
      ...(Array.isArray(supporting?.artifactIds) ? (supporting.artifactIds as string[]) : []),
    ].filter(Boolean),
    capabilityIds: item.sourceCapabilityId ? [String(item.sourceCapabilityId)] : [],
    claimIds: [],
  };
}

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const organizationId = await requireValidatedActiveOrg(user);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const targetType = url.searchParams.get('targetType') as ProvenanceTargetType | null;
    const targetId = url.searchParams.get('targetId');

    if (!sessionId || !targetType || !targetId) {
      return Response.json(
        { data: null, error: 'sessionId, targetType, and targetId query parameters are required' },
        { status: 400 },
      );
    }

    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return Response.json(
        { data: null, error: `Invalid targetType. Must be one of: ${VALID_TARGET_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    const { data: session, error: sessionErr } = await supabase
      .from('discovery_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('organization_id', organizationId)
      .single();
    if (sessionErr) throw sessionErr;

    const { data: runs } = await supabase
      .from('discovery_runs')
      .select('*')
      .eq('session_id', sessionId)
      .order('started_at', { ascending: false })
      .limit(1);

    const latestRun = runs?.[0] ?? null;
    if (!latestRun) {
      return Response.json({
        data: {
          targetType,
          targetId,
          itemSummary: { label: targetId, type: targetType, details: {} },
          chain: [],
          agentOutput: null,
          pipelineVersion: null,
          layer1: null,
          layer0: null,
          sourceSpan: null,
          relatedEntities: [],
          relatedRelationships: [],
          relatedCapabilities: [],
          relatedClaims: [],
          curationHistory: [],
        },
        error: null,
      });
    }

    const { data: artifacts } = await supabase
      .from('discovery_artifacts')
      .select('*')
      .eq('run_id', latestRun.id);

    const artifactIds = (artifacts ?? []).map((a) => a.id);
    const agentNames = ARTIFACT_AGENT_NAMES[targetType];

    let matchedRow: AgentOutputRow | null = null;
    let matchedItem: Record<string, unknown> | null = null;

    if (artifactIds.length > 0) {
      const { data: outputRows } = await supabase
        .from('discovery_agent_outputs')
        .select('*')
        .in('artifact_id', artifactIds)
        .in('agent_name', agentNames)
        .order('created_at', { ascending: false });

      for (const row of outputRows ?? []) {
        const output = (row.output ?? {}) as Record<string, unknown>;
        const item = findItemInOutput(targetType, targetId, output);
        if (item) {
          matchedRow = row as AgentOutputRow;
          matchedItem = item;
          break;
        }
      }
    }

    // Fallback: search run-scoped agent outputs when artifact-scoped search misses
    if (!matchedItem && artifactIds.length > 0) {
      for (const name of agentNames) {
        const { data: scoped } = await supabase
          .from('discovery_agent_outputs')
          .select('*')
          .in('artifact_id', artifactIds)
          .eq('agent_name', name)
          .order('created_at', { ascending: false })
          .limit(5);

        for (const row of scoped ?? []) {
          const output = (row.output ?? {}) as Record<string, unknown>;
          const item = findItemInOutput(targetType, targetId, output);
          if (item) {
            matchedRow = row as AgentOutputRow;
            matchedItem = item;
            break;
          }
        }
        if (matchedItem) break;
      }
    }

    // Last resort: scan any agent output row for this run's artifacts
    if (!matchedItem && artifactIds.length > 0) {
      const { data: allRows } = await supabase
        .from('discovery_agent_outputs')
        .select('*')
        .in('artifact_id', artifactIds)
        .order('created_at', { ascending: false });

      for (const row of allRows ?? []) {
        const output = (row.output ?? {}) as Record<string, unknown>;
        const item = findItemInOutput(targetType, targetId, output);
        if (item) {
          matchedRow = row as AgentOutputRow;
          matchedItem = item;
          break;
        }
      }
    }

    let layer1 = null;
    let layer0 = null;
    let resolvedArtifactId: string | null = matchedRow?.artifact_id ?? null;

    const links = matchedItem ? relatedIds(matchedItem, targetType) : {
      entityIds: [], relationshipIds: [], artifactIds: [], capabilityIds: [], claimIds: [],
    };

    if (!resolvedArtifactId && links.artifactIds.length > 0) {
      resolvedArtifactId = links.artifactIds[0];
    }

    if (matchedRow?.layer1_id) {
      const { data: l1 } = await supabase
        .from('discovery_layer1')
        .select('*')
        .eq('id', matchedRow.layer1_id)
        .single();
      if (l1) {
        layer1 = {
          id: l1.id,
          artifact_id: l1.artifact_id,
          extractor: l1.extractor,
          extractor_version: l1.extractor_version,
          original_hash: l1.original_hash,
          status: l1.status,
          extracted_at: l1.extracted_at,
          markdown_preview: String(l1.markdown ?? '').slice(0, 500),
        };
        resolvedArtifactId = resolvedArtifactId ?? l1.artifact_id;
      }
    } else if (resolvedArtifactId) {
      const { data: l1rows } = await supabase
        .from('discovery_layer1')
        .select('*')
        .eq('artifact_id', resolvedArtifactId)
        .order('extracted_at', { ascending: false })
        .limit(1);
      const l1 = l1rows?.[0];
      if (l1) {
        layer1 = {
          id: l1.id,
          artifact_id: l1.artifact_id,
          extractor: l1.extractor,
          extractor_version: l1.extractor_version,
          original_hash: l1.original_hash,
          status: l1.status,
          extracted_at: l1.extracted_at,
          markdown_preview: String(l1.markdown ?? '').slice(0, 500),
        };
      }
    }

    if (resolvedArtifactId) {
      const artifact = (artifacts ?? []).find((a) => a.id === resolvedArtifactId)
        ?? (await supabase.from('discovery_artifacts').select('*').eq('id', resolvedArtifactId).single()).data;
      if (artifact) {
        layer0 = {
          id: artifact.id,
          file_name: artifact.file_name,
          artifact_type: artifact.artifact_type,
          size_bytes: artifact.size_bytes,
          file_hash: artifact.file_hash,
          source: artifact.source,
          storage_ref: artifact.storage_ref,
          created_at: artifact.created_at,
        };
      }
    }

    const provenanceMeta = (matchedRow?.provenance ?? {}) as Record<string, unknown>;
    const agentOutput = matchedRow ? {
      agent_name: matchedRow.agent_name,
      agent_version: matchedRow.agent_version,
      status: matchedRow.status,
      confidence: Number(matchedRow.confidence ?? 0),
      created_at: matchedRow.created_at,
      pipeline_version: String(provenanceMeta.pipelineVersion ?? latestRun.pipeline_version),
    } : null;

    const span = matchedItem ? sourceSpan(matchedItem) : null;

    const chain = [
      matchedItem ? { label: 'Review Item', detail: itemLabel(targetType, matchedItem), id: targetId } : null,
      agentOutput ? {
        label: 'Agent Output',
        detail: `${agentOutput.agent_name} v${agentOutput.agent_version}`,
        id: matchedRow?.id,
      } : null,
      layer1 ? {
        label: 'Layer 1',
        detail: `${layer1.extractor} v${layer1.extractor_version}`,
        id: layer1.id,
      } : null,
      layer0 ? {
        label: 'Layer 0',
        detail: layer0.file_name,
        id: layer0.id,
      } : null,
    ].filter(Boolean);

    const { data: curationHistory } = await supabase
      .from('discovery_curation_events')
      .select('*')
      .eq('discovery_run_id', latestRun.id)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Resolve related items from same-run agent outputs (read-only cross-reference)
    const relatedEntities: { type: string; id: string; label: string }[] = [];
    const relatedRelationships: { type: string; id: string; label: string }[] = [];
    const relatedCapabilities: { type: string; id: string; label: string }[] = [];
    const relatedClaims: { type: string; id: string; label: string }[] = [];

    if (artifactIds.length > 0) {
      const { data: entityRows } = await supabase
        .from('discovery_agent_outputs')
        .select('output')
        .in('artifact_id', artifactIds)
        .in('agent_name', ['entity-extractor', 'entity_extractor'])
        .limit(10);

      for (const row of entityRows ?? []) {
        for (const entity of asArray((row.output as Record<string, unknown>)?.entities)) {
          const id = String(entity.entityId ?? '');
          if (links.entityIds.includes(id)) {
            relatedEntities.push({ type: 'entity', id, label: String(entity.value ?? id) });
          }
        }
      }

      const { data: relRows } = await supabase
        .from('discovery_agent_outputs')
        .select('output')
        .in('artifact_id', artifactIds)
        .in('agent_name', ['relationship-extractor', 'relationship_extractor'])
        .limit(10);

      for (const row of relRows ?? []) {
        for (const rel of asArray((row.output as Record<string, unknown>)?.relationships)) {
          const id = String(rel.relationshipId ?? `${rel.type}-${rel.sourceEntityId}-${rel.targetEntityId}`);
          if (links.relationshipIds.includes(id)) {
            relatedRelationships.push({ type: 'relationship', id, label: `${rel.sourceEntityId} → ${rel.targetEntityId}` });
          }
        }
      }

      const { data: capRows } = await supabase
        .from('discovery_agent_outputs')
        .select('output')
        .in('artifact_id', artifactIds)
        .eq('agent_name', 'capability_detector')
        .limit(5);

      for (const row of capRows ?? []) {
        for (const cap of asArray((row.output as Record<string, unknown>)?.capabilities)) {
          const id = String(cap.capabilityId ?? '');
          if (links.capabilityIds.includes(id) || id === targetId) {
            relatedCapabilities.push({ type: 'capability', id, label: String(cap.name ?? cap.label ?? id) });
          }
        }
      }

      const { data: claimRows } = await supabase
        .from('discovery_agent_outputs')
        .select('output')
        .in('artifact_id', artifactIds)
        .eq('agent_name', 'claim_candidate_detector')
        .limit(5);

      for (const row of claimRows ?? []) {
        for (const claim of asArray((row.output as Record<string, unknown>)?.candidates)) {
          const id = String(claim.claimId ?? claim.id ?? '');
          if (targetType === 'CAPABILITY' && links.claimIds.includes(id)) {
            relatedClaims.push({ type: 'claim', id, label: String(claim.summary ?? id) });
          }
          if (targetType === 'CLAIM_CANDIDATE' && claim.sourceCapabilityId) {
            relatedCapabilities.push({
              type: 'capability',
              id: String(claim.sourceCapabilityId),
              label: String(claim.sourceCapabilityId),
            });
          }
        }
      }
    }

    return Response.json({
      data: {
        targetType,
        targetId,
        itemSummary: matchedItem ? {
          label: itemLabel(targetType, matchedItem),
          type: itemTypeLabel(targetType, matchedItem),
          details: matchedItem,
        } : { label: targetId, type: targetType, details: {} },
        chain,
        agentOutput,
        pipelineVersion: agentOutput?.pipeline_version ?? latestRun.pipeline_version,
        layer1,
        layer0,
        sourceSpan: span,
        relatedEntities,
        relatedRelationships,
        relatedCapabilities,
        relatedClaims,
        curationHistory: curationHistory ?? [],
      },
      error: null,
    });
  } catch (err) {
    return handleApiError(err);
  }
});
