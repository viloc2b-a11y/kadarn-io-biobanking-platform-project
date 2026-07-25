// ==========================================================================
// KAD-LOOP-003 — Knowledge Graph Query API (Phase 9)
// ==========================================================================
// GET /api/v1/knowledge-graph
// Query the knowledge graph with filters: orgId, nodeTypes, statuses,
// limit, offset. Returns nodes (claims + capabilities) and the edges
// between them (capability_claims M2M links) scoped to an organization.
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

// ─── Local enum value arrays (mirror @kadarn/types enums) ─────────────────
// Defined locally because @kadarn/types ships Zod v4 schemas while apps/api
// resolves Zod v3; the foreign ZodEnum does not satisfy the v3 ZodType
// generic constraint (TS2344). We validate against the raw string values
// instead — same value set, no cross-version class mismatch.
const CLAIM_LIFECYCLE_STATUSES = [
  'draft', 'review', 'approved', 'rejected', 'superseded', 'expired', 'archived',
] as const;
const CAPABILITY_STATUSES = [
  'declared', 'evidence_submitted', 'under_review', 'verified', 'published', 'deprecated',
] as const;
const claimLifecycleSet = new Set<string>(CLAIM_LIFECYCLE_STATUSES);
const capabilityStatusSet = new Set<string>(CAPABILITY_STATUSES);

// Allowed node types in the graph.
const nodeTypeSchema = z.enum(['claim', 'capability']);

const querySchema = z.object({
  orgId: z.string().uuid(),
  nodeTypes: z
    .union([z.array(nodeTypeSchema), nodeTypeSchema.transform((v) => [v])])
    .optional()
    .default(['claim', 'capability']),
  statuses: z
    .union([
      z.array(z.string()),
      z.string().transform((v) => [v]),
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = withAuth(async (request, _user, _params) => {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());

    // nodeTypes and statuses may appear as repeated query params
    // (?nodeTypes=claim&nodeTypes=capability) — gather them as arrays.
    const nodeTypesRaw = url.searchParams.getAll('nodeTypes');
    const statusesRaw = url.searchParams.getAll('statuses');
    const assembled = {
      ...params,
      nodeTypes: nodeTypesRaw.length ? nodeTypesRaw : undefined,
      statuses: statusesRaw.length ? statusesRaw : undefined,
    };

    const parsed = querySchema.safeParse(assembled);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { orgId, nodeTypes, statuses, limit, offset } = parsed.data;
    const supabase = createServiceClient();

    const nodes: Array<{
      id: string;
      type: 'claim';
      label: string;
      status: string;
      organization_id: string;
    } | {
      id: string;
      type: 'capability';
      label: string;
      status: string;
      organization_id: string;
    }> = [];

    // ─── Fetch claim nodes ──────────────────────────────────────────────
    if (nodeTypes.includes('claim')) {
      let claimQuery = supabase
        .from('claims')
        .select('id, name, lifecycle_status, organization_id')
        .eq('organization_id', orgId);

      // Filter by statuses if provided (matched against lifecycle_status).
      if (statuses && statuses.length > 0) {
        const valid = statuses.filter((s) => claimLifecycleSet.has(s));
        if (valid.length > 0) {
          claimQuery = claimQuery.in('lifecycle_status', valid);
        }
      }

      const { data: claims, error: claimErr } = await claimQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (claimErr) {
        throw new ApiError(500, 'Failed to fetch claim nodes', claimErr.message);
      }

      for (const c of claims ?? []) {
        nodes.push({
          id: c.id,
          type: 'claim',
          label: c.name,
          status: c.lifecycle_status,
          organization_id: c.organization_id,
        });
      }
    }

    // ─── Fetch capability nodes ─────────────────────────────────────────
    if (nodeTypes.includes('capability')) {
      let capQuery = supabase
        .from('capabilities')
        .select('id, name, status, organization_id')
        .eq('organization_id', orgId);

      if (statuses && statuses.length > 0) {
        const valid = statuses.filter((s) => capabilityStatusSet.has(s));
        if (valid.length > 0) {
          capQuery = capQuery.in('status', valid);
        }
      }

      const { data: caps, error: capErr } = await capQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (capErr) {
        throw new ApiError(500, 'Failed to fetch capability nodes', capErr.message);
      }

      for (const c of caps ?? []) {
        nodes.push({
          id: c.id,
          type: 'capability',
          label: c.name,
          status: c.status,
          organization_id: c.organization_id,
        });
      }
    }

    // ─── Fetch edges (capability ↔ claim M2M links) ────────────────────
    // Only edges between nodes we actually returned are useful; we filter
    // by the organization via the capability_claims join to capability.
    const nodeIds = nodes.map((n) => n.id);
    let edgesQuery = supabase
      .from('capability_claims')
      .select('id, capability_id, claim_id, relationship_type, weight, created_at')
      .order('created_at', { ascending: true });

    // Narrow edges to those touching our node set. Supabase's `in` filter
    // works on a single column; we filter on capability_id and claim_id in
    // turn — the intersection is what we keep.
    if (nodeIds.length > 0) {
      edgesQuery = edgesQuery.in('capability_id', nodeIds).in('claim_id', nodeIds);
    } else {
      // No nodes → no edges.
      return Response.json({
        data: { nodes: [], edges: [], limit, offset },
        error: null,
      });
    }

    const { data: edges, error: edgeErr } = await edgesQuery.limit(1000);

    if (edgeErr) {
      throw new ApiError(500, 'Failed to fetch graph edges', edgeErr.message);
    }

    return Response.json({
      data: {
        nodes,
        edges: edges ?? [],
        limit,
        offset,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
