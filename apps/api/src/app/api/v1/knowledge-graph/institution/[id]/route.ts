// ==========================================================================
// KAD-LOOP-003 — Knowledge Graph: Full Institution Graph (Phase 9)
// ==========================================================================
// GET /api/v1/knowledge-graph/institution/[id]
// Returns the full knowledge graph for a single institution (organization):
// all claims, all capabilities, all capability↔claim edges, and all
// claim↔evidence edges for that organization.
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

interface GraphNode {
  id: string;
  type: 'claim' | 'capability' | 'evidence';
  label: string;
  status?: string;
  organization_id?: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  type: 'capability_claim' | 'claim_evidence';
}

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id: orgId } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    // 1. Verify the organization exists.
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single();

    if (orgErr) {
      if (orgErr.code === 'PGRST116') throw new ApiError(404, 'Institution not found');
      throw new ApiError(500, 'Failed to fetch institution', orgErr.message);
    }
    if (!org) throw new ApiError(404, 'Institution not found');

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const claimIds: string[] = [];
    const capabilityIds: string[] = [];

    // ─── Fetch all claims for the org ───────────────────────────────────
    const { data: claims, error: claimErr } = await supabase
      .from('claims')
      .select('id, name, lifecycle_status, organization_id')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (claimErr) {
      throw new ApiError(500, 'Failed to fetch claims', claimErr.message);
    }

    for (const c of claims ?? []) {
      nodes.push({
        id: c.id,
        type: 'claim',
        label: c.name,
        status: c.lifecycle_status,
        organization_id: c.organization_id,
      });
      claimIds.push(c.id);
    }

    // ─── Fetch all capabilities for the org ─────────────────────────────
    const { data: caps, error: capErr } = await supabase
      .from('capabilities')
      .select('id, name, status, organization_id')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (capErr) {
      throw new ApiError(500, 'Failed to fetch capabilities', capErr.message);
    }

    for (const c of caps ?? []) {
      nodes.push({
        id: c.id,
        type: 'capability',
        label: c.name,
        status: c.status,
        organization_id: c.organization_id,
      });
      capabilityIds.push(c.id);
    }

    // ─── Fetch capability ↔ claim edges ────────────────────────────────
    if (capabilityIds.length > 0) {
      const { data: capClaimLinks, error: linkErr } = await supabase
        .from('capability_claims')
        .select('id, capability_id, claim_id, relationship_type')
        .in('capability_id', capabilityIds)
        .order('created_at', { ascending: true })
        .limit(5000);

      if (linkErr) {
        throw new ApiError(500, 'Failed to fetch capability-claim edges', linkErr.message);
      }

      for (const l of capClaimLinks ?? []) {
        edges.push({
          id: l.id,
          source: l.capability_id,
          target: l.claim_id,
          relationship: l.relationship_type,
          type: 'capability_claim',
        });
      }
    }

    // ─── Fetch claim ↔ evidence edges + evidence nodes ─────────────────
    if (claimIds.length > 0) {
      const { data: claimEvidenceLinks, error: ceErr } = await supabase
        .from('claim_evidence_links')
        .select('id, claim_id, evidence_id, relationship_type')
        .in('claim_id', claimIds)
        .order('created_at', { ascending: true })
        .limit(5000);

      if (ceErr) {
        throw new ApiError(500, 'Failed to fetch claim-evidence edges', ceErr.message);
      }

      const evidenceIds = (claimEvidenceLinks ?? [])
        .map((l) => l.evidence_id)
        .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe

      // Fetch the evidence nodes themselves.
      if (evidenceIds.length > 0) {
        const { data: evidenceNodes, error: evErr } = await supabase
          .from('evidence_nodes')
          .select('id, evidence_class, status, lifecycle_status')
          .in('id', evidenceIds)
          .limit(5000);

        if (evErr) {
          throw new ApiError(500, 'Failed to fetch evidence nodes', evErr.message);
        }

        for (const e of evidenceNodes ?? []) {
          nodes.push({
            id: e.id,
            type: 'evidence',
            label: e.evidence_class ?? e.id,
            status: e.lifecycle_status ?? e.status ?? undefined,
          });
        }
      }

      for (const l of claimEvidenceLinks ?? []) {
        edges.push({
          id: l.id,
          source: l.claim_id,
          target: l.evidence_id,
          relationship: l.relationship_type,
          type: 'claim_evidence',
        });
      }
    }

    return Response.json({
      data: {
        institution_id: orgId,
        nodes,
        edges,
        stats: {
          node_count: nodes.length,
          edge_count: edges.length,
          claims: claimIds.length,
          capabilities: capabilityIds.length,
        },
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
