// ==========================================================================
// Graph Fabric Runtime — cross-graph queries (Knowledge + Trust + Provenance)
// ==========================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { GraphQueryService } from '@kadarn/graph-query/src/service';
import type {
  GraphQueryAdapter,
  KnowledgeInfo,
  OrganizationTrustInfo,
  SpecimenProvenance,
} from '@kadarn/graph-query/src/types';
import { getKnowledgeService } from '@/lib/knowledge-runtime';
import { getTrustEngineService } from '@/lib/trust-runtime';
import { createServiceClient } from '@/lib/service-client';
import type { VocabularySet } from '@kadarn/knowledge-engine';

class SupabaseGraphFabricAdapter implements GraphQueryAdapter {
  constructor(private readonly client: SupabaseClient) {}

  async getProvenanceLineage(specimenId: string): Promise<SpecimenProvenance> {
    const { data: node } = await this.client
      .from('provenance_nodes')
      .select('id, node_type, label, properties, recorded_at')
      .eq('external_id', specimenId)
      .eq('node_type', 'specimen')
      .maybeSingle();

    const nodeId = node?.id as string | undefined;
    if (!nodeId) {
      return {
        specimenId,
        ancestors: [],
        descendants: [],
        edges: [],
        evidence: [],
      };
    }

    const { data: edges } = await this.client
      .from('provenance_edges')
      .select('edge_type, source_node_id, target_node_id')
      .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);

    const { data: evidence } = await this.client
      .from('provenance_evidence')
      .select('evidence_type, reference')
      .eq('node_id', nodeId);

    const { data: links } = await this.client
      .from('knowledge_entity_links')
      .select('vocabulary, normalized_label, term_id')
      .eq('entity_type', 'specimen_twin')
      .eq('entity_id', specimenId);

    const properties = (node?.properties ?? {}) as Record<string, unknown>;
    const specimenType = typeof properties.specimenType === 'string'
      ? properties.specimenType
      : links?.[0]?.normalized_label;

    return {
      specimenId,
      specimenType,
      ancestors: [],
      descendants: [],
      edges: (edges ?? []).map(edge => ({
        edgeType: edge.edge_type as string,
        sourceId: edge.source_node_id as string,
        targetId: edge.target_node_id as string,
      })),
      evidence: [
        ...(evidence ?? []).map(item => ({
          type: item.evidence_type as string,
          reference: item.reference as string,
        })),
        ...(links ?? []).map(item => ({
          type: `knowledge:${item.vocabulary as string}`,
          reference: item.normalized_label as string,
        })),
      ],
    };
  }

  async getEvidenceForShipment(shipmentId: string) {
    const { data: node } = await this.client
      .from('provenance_nodes')
      .select('id')
      .eq('external_id', shipmentId)
      .eq('node_type', 'shipment')
      .maybeSingle();

    if (!node?.id) return [];

    const { data } = await this.client
      .from('provenance_evidence')
      .select('evidence_type, reference')
      .eq('node_id', node.id);

    return (data ?? []).map(item => ({
      type: item.evidence_type as string,
      reference: item.reference as string,
    }));
  }

  async getOrganizationTrust(orgId: string): Promise<OrganizationTrustInfo> {
    const trust = await getTrustEngineService().getScores(orgId);
    const trajectory = await getTrustEngineService().getTrajectory(orgId);

    return {
      organizationId: orgId,
      operationalScore: trust.operationalScore,
      regulatoryScore: trust.regulatoryScore,
      financialScore: trust.financialScore,
      technicalScore: trust.technicalScore,
      overallScore: trust.overallScore,
      trajectory: trajectory.map(point => ({
        date: point.date,
        score: point.score,
        dimension: point.dimension,
        eventSource: point.eventSource,
      })),
    };
  }

  async normalizeAndExpand(term: string, vocabulary: string): Promise<KnowledgeInfo> {
    const vocab = vocabulary as VocabularySet;
    const service = getKnowledgeService();
    const snapshot = await service.loadVocabulary(vocab);
    const normalized = await service.normalize(vocab, term, snapshot);
    const expanded = await service.expand(vocab, term, snapshot);
    const matched = snapshot.terms.find(item => item.preferredLabel === normalized.normalized);
    const mappings = matched
      ? await service.externalMappings(matched.id, snapshot)
      : [];

    return {
      originalTerm: term,
      normalizedTerm: normalized.normalized,
      synonyms: expanded.synonyms,
      vocabulary,
      externalCodes: mappings.map(mapping => ({
        system: mapping.codingSystem,
        code: mapping.externalCode,
      })),
    };
  }

  async findOrganizationsByCapability(capabilities: string[]) {
    if (capabilities.length === 0) {
      const { data } = await this.client.from('organizations').select('id, name').limit(20);
      return (data ?? []).map(org => ({ id: org.id as string, name: org.name as string }));
    }

    const { data } = await this.client
      .from('organization_capabilities')
      .select('organization_id, capability_type_id, organization_capability_types!inner(key), organizations!inner(id, name)')
      .in('organization_capability_types.key', capabilities);

    const seen = new Set<string>();
    const results: Array<{ id: string; name: string }> = [];

    for (const row of data ?? []) {
      const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
      if (!org || seen.has(org.id)) continue;
      seen.add(org.id);
      results.push({ id: org.id, name: org.name });
    }

    return results;
  }
}

let graphService: GraphQueryService | null = null;

export function getGraphFabricService(): GraphQueryService | null {
  const client = createServiceClient();
  if (!client) return null;

  if (!graphService) {
    graphService = new GraphQueryService(new SupabaseGraphFabricAdapter(client));
  }

  return graphService;
}

export function resetGraphFabricRuntime(): void {
  graphService = null;
}

export async function enrichTwinWithKnowledge(
  ctx: { actorId: string; organizationId?: string | null; correlationId: string },
  payload: Record<string, unknown>,
): Promise<void> {
  const specimenId = String(payload.specimenId ?? '');
  const specimenType = String(payload.specimenType ?? '');
  if (!specimenId || !specimenType) return;

  const { runKnowledgeFabricStage } = await import('@/lib/knowledge-runtime');
  await runKnowledgeFabricStage(ctx, {
    entityType: 'specimen_twin',
    entityId: specimenId,
    specimenType,
    pipeline: payload.pipeline ?? 'specimen-twin',
  });
}
