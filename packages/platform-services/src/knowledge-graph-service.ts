// ─── KAD-LOOP-003 Phase 7 — Knowledge Graph Service ─────────────────────
// Authority: KADARN Engineering Playbook — Knowledge Graph Traversal
//
// The KADARN domain model forms a canonical graph:
//   Institution → Capability → Claim → Evidence → SourceRecord → InstitutionalEvent
//
// The graph is IMPLICIT in the foreign keys — no separate graph store needed.
// This service traverses those FKs to materialise graph views for UI/API use.
//
// DB tables & traversal edges:
//   organizations (root institution)
//     ↑ organization_id
//   capabilities (institution capability)
//     ↕ capability_claims (M2M: capability_id ↔ claim_id)
//   claims (organization_id, source_event_id)
//     ↕ claim_evidence_links (M2M: claim_id ↔ evidence_id, relationship_type)
//   evidence_nodes (evidence_class, source_record_id)
//     ↑ source_record_id
//   source_records (evidence_source_id, institution_id)
//     (institutional_events linked via claims.source_event_id or correlation_id)
//   institutional_events (organization_id)
//
// Design rules enforced here:
//   - Tenant safe: every query scopes by organization_id (forward traversal)
//     or re-derives orgId from the starting node before any sibling fetch
//     (reverse traversal). No unscoped SELECTs.
//   - Forward traversal: institution → capability → claim → evidence → source → event
//   - Reverse traversal: event → source → evidence → claim → capability → institution
//   - Graceful errors: any Supabase error returns an empty result, never throws.
//   - Returns structured JSON (GraphNode/GraphEdge), not raw DB rows.

import type { SupabaseClient } from '@supabase/supabase-js';

// ==========================================================================
// Graph Types
// ==========================================================================

/** A generic graph node wrapping any domain row. */
export interface GraphNode {
  id: string;
  type: string;
  name: string;
  data: Record<string, unknown>;
}

/** A directed edge between two graph nodes. */
export interface GraphEdge {
  source_id: string;
  target_id: string;
  relationship: string;
  metadata?: Record<string, unknown>;
}

/** Full forward graph rooted at an institution. */
export interface InstitutionGraph {
  institution: GraphNode;
  capabilities: GraphNode[];
  claims: GraphNode[];
  evidence: GraphNode[];
  sources: GraphNode[];
  events: GraphNode[];
  edges: GraphEdge[];
}

/** Reverse-traversal result: a flat node/edge set with a root_id. */
export interface ReverseGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  root_id: string;
}

/** Sub-tree rooted at a capability. */
export interface CapabilitySubtree {
  capability: GraphNode;
  claims: GraphNode[];
  evidence: GraphNode[];
  edges: GraphEdge[];
}

/** Sub-tree rooted at a claim. */
export interface ClaimSubtree {
  claim: GraphNode;
  evidence: GraphNode[];
  sources: GraphNode[];
  events: GraphNode[];
  edges: GraphEdge[];
}

/** Filters for the queryGraph method. `orgId` is always required (tenant scoping). */
export interface GraphQueryFilters {
  orgId: string;
  nodeTypes?: string[];
  statuses?: string[];
  lifecycleStatuses?: string[];
  limit?: number;
  offset?: number;
}

/** Paginated graph query result. `total` is the unfiltered count for the org. */
export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total: number;
}

/** Coverage statistics for an institution's graph. */
export interface CoverageStats {
  orgId: string;
  totalCapabilities: number;
  totalClaims: number;
  totalEvidence: number;
  claimsWithEvidence: number;
  claimsWithoutEvidence: number;
  capabilitiesWithClaims: number;
  capabilitiesWithoutClaims: number;
  evidenceByClass: Record<string, number>;
}

// ==========================================================================
// Node type constants — canonical labels used in GraphNode.type
// ==========================================================================

const NODE_INSTITUTION = 'institution';
const NODE_CAPABILITY = 'capability';
const NODE_CLAIM = 'claim';
const NODE_EVIDENCE = 'evidence';
const NODE_SOURCE = 'source';
const NODE_EVENT = 'event';

// ==========================================================================
// Helpers
// ==========================================================================

/** Coerce a possibly-null/undefined value to a string, '' fallback. */
function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

/** Build a GraphNode from a raw DB row. `type` is the canonical label. */
function toNode(type: string, row: Record<string, unknown>): GraphNode {
  const id = str(row.id);
  const name =
    str(row.name) ||
    str(row.legal_name) ||
    str(row.title) ||
    str(row.event_type) ||
    str(row.record_type) ||
    (id ? `${type}:${id.slice(0, 8)}` : type);
  return { id, type, name, data: { ...row } };
}

/** Add an edge only if both endpoints are non-empty (defensive). */
function pushEdge(
  edges: GraphEdge[],
  source_id: string,
  target_id: string,
  relationship: string,
  metadata?: Record<string, unknown>,
): void {
  if (!source_id || !target_id) return;
  edges.push({ source_id, target_id, relationship, ...(metadata ? { metadata } : {}) });
}

// ==========================================================================
// Service
// ==========================================================================

/**
 * KnowledgeGraphService — materialises the KADARN canonical graph from
 * Supabase FK joins. Construct with a SupabaseClient (service_role for
 * cross-tenant admin reads; or a user-scoped client for RLS-enforced reads).
 */
export class KnowledgeGraphService {
  constructor(private supabase: SupabaseClient) {}

  // ─── Forward Traversal ─────────────────────────────────────────────────

  /**
   * Materialise the full forward graph rooted at `orgId`:
   *   Institution → Capability → Claim → Evidence → SourceRecord → InstitutionalEvent
   *
   * `depth` optionally limits how far down the chain to traverse:
   *   1 = institution + capabilities
   *   2 = + claims
   *   3 = + evidence (default when omitted — full graph)
   *   4 = + sources
   *   5+ = + events (full)
   * All queries are scoped by organization_id.
   */
  async getInstitutionGraph(orgId: string, depth?: number): Promise<InstitutionGraph> {
    const d = depth ?? 5;
    const capabilities: GraphNode[] = [];
    const claims: GraphNode[] = [];
    const evidence: GraphNode[] = [];
    const sources: GraphNode[] = [];
    const events: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 1. Institution root
    const { data: orgRow, error: orgErr } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    if (orgErr || !orgRow) {
      // Root missing — return an empty graph with a placeholder institution node.
      return {
        institution: { id: orgId, type: NODE_INSTITUTION, name: '', data: {} },
        capabilities,
        claims,
        evidence,
        sources,
        events,
        edges,
      };
    }
    const institution = toNode(NODE_INSTITUTION, orgRow as Record<string, unknown>);

    if (d < 1) {
      return { institution, capabilities, claims, evidence, sources, events, edges };
    }

    // 2. Capabilities (org-scoped)
    const { data: capRows, error: capErr } = await this.supabase
      .from('capabilities')
      .select('*')
      .eq('organization_id', orgId);
    if (capErr || !capRows) {
      return { institution, capabilities, claims, evidence, sources, events, edges };
    }
    for (const row of capRows as Record<string, unknown>[]) {
      const node = toNode(NODE_CAPABILITY, row);
      capabilities.push(node);
      pushEdge(edges, institution.id, node.id, 'has_capability');
    }
    if (d < 2) {
      return { institution, capabilities, claims, evidence, sources, events, edges };
    }

    // 3. Claims — via capability_claims M2M (claims are org-scoped on claims.organization_id too).
    //    Fetch org-scoped claims directly, then link to capabilities via the join table.
    const { data: claimRows, error: claimErr } = await this.supabase
      .from('claims')
      .select('*')
      .eq('organization_id', orgId);
    if (claimErr || !claimRows) {
      return { institution, capabilities, claims, evidence, sources, events, edges };
    }
    const claimIds: string[] = [];
    for (const row of claimRows as Record<string, unknown>[]) {
      const node = toNode(NODE_CLAIM, row);
      claims.push(node);
      claimIds.push(node.id);
      // institution → claim (direct org ownership)
      pushEdge(edges, institution.id, node.id, 'owns_claim');
    }
    // capability → claim edges via join table
    if (capabilities.length > 0 && claimIds.length > 0) {
      const { data: ccRows } = await this.supabase
        .from('capability_claims')
        .select('capability_id, claim_id, relationship_type, weight')
        .in('claim_id', claimIds);
      for (const cc of (ccRows ?? []) as Record<string, unknown>[]) {
        pushEdge(
          edges,
          str(cc.capability_id),
          str(cc.claim_id),
          'asserts_claim',
          {
            relationship_type: str(cc.relationship_type),
            weight: cc.weight ?? null,
          },
        );
      }
    }
    if (d < 3 || claimIds.length === 0) {
      return { institution, capabilities, claims, evidence, sources, events, edges };
    }

    // 4. Evidence — via claim_evidence_links M2M
    const { data: celRows } = await this.supabase
      .from('claim_evidence_links')
      .select('claim_id, evidence_id, relationship_type')
      .in('claim_id', claimIds);
    const celList = (celRows ?? []) as Record<string, unknown>[];
    const evidenceIds = celList
      .map((l) => str(l.evidence_id))
      .filter((id) => Boolean(id));
    const dedupEvidenceIds = Array.from(new Set(evidenceIds));
    if (dedupEvidenceIds.length > 0) {
      const { data: evRows } = await this.supabase
        .from('evidence_nodes')
        .select('*')
        .in('id', dedupEvidenceIds);
      const evById = new Map<string, GraphNode>();
      for (const row of (evRows ?? []) as Record<string, unknown>[]) {
        const node = toNode(NODE_EVIDENCE, row);
        evidence.push(node);
        evById.set(node.id, node);
      }
      for (const cel of celList) {
        const evId = str(cel.evidence_id);
        pushEdge(
          edges,
          str(cel.claim_id),
          evId,
          'supported_by_evidence',
          { relationship_type: str(cel.relationship_type) },
        );
      }
    }
    if (d < 4 || dedupEvidenceIds.length === 0) {
      return { institution, capabilities, claims, evidence, sources, events, edges };
    }

    // 5. Source records — evidence_nodes.source_record_id → source_records
    const sourceRecordIds = evidence
      .map((n) => str(n.data.source_record_id))
      .filter((id) => Boolean(id));
    const dedupSourceIds = Array.from(new Set(sourceRecordIds));
    if (dedupSourceIds.length > 0) {
      const { data: srcRows } = await this.supabase
        .from('source_records')
        .select('*')
        .in('id', dedupSourceIds);
      const srcById = new Map<string, GraphNode>();
      for (const row of (srcRows ?? []) as Record<string, unknown>[]) {
        const node = toNode(NODE_SOURCE, row);
        sources.push(node);
        srcById.set(node.id, node);
      }
      for (const ev of evidence) {
        const srId = str(ev.data.source_record_id);
        if (srId && srcById.has(srId)) {
          pushEdge(edges, srId, ev.id, 'produced_evidence');
        }
      }
    }
    if (d < 5) {
      return { institution, capabilities, claims, evidence, sources, events, edges };
    }

    // 6. Institutional events — org-scoped; link to claims via claims.source_event_id
    const { data: evRows2 } = await this.supabase
      .from('institutional_events')
      .select('*')
      .eq('organization_id', orgId);
    const eventById = new Map<string, GraphNode>();
    for (const row of (evRows2 ?? []) as Record<string, unknown>[]) {
      const node = toNode(NODE_EVENT, row);
      events.push(node);
      eventById.set(node.id, node);
      pushEdge(edges, institution.id, node.id, 'recorded_event');
    }
    for (const c of claims) {
      const seId = str(c.data.source_event_id);
      if (seId && eventById.has(seId)) {
        pushEdge(edges, seId, c.id, 'triggered_claim');
      }
    }

    return { institution, capabilities, claims, evidence, sources, events, edges };
  }

  // ─── Reverse Traversal ─────────────────────────────────────────────────

  /**
   * Reverse traversal from any node back to its owning institution.
   * Supported nodeTypes: 'institution', 'capability', 'claim', 'evidence',
   * 'source', 'event'. Unknown types return an empty graph (root_id = nodeId).
   *
   * The walk first derives the owning orgId from the starting node, then
   * re-uses forward traversal within that tenant to assemble the full path.
   */
  async getReverseGraph(nodeType: string, nodeId: string): Promise<ReverseGraph> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 1. Load the starting node + derive orgId
    let orgId: string | null = null;
    let startNode: GraphNode | null = null;

    switch (nodeType) {
      case NODE_INSTITUTION: {
        const { data } = await this.supabase
          .from('organizations')
          .select('*')
          .eq('id', nodeId)
          .single();
        if (data) {
          orgId = nodeId;
          startNode = toNode(NODE_INSTITUTION, data as Record<string, unknown>);
        }
        break;
      }
      case NODE_CAPABILITY: {
        const { data } = await this.supabase
          .from('capabilities')
          .select('*')
          .eq('id', nodeId)
          .single();
        if (data) {
          const row = data as Record<string, unknown>;
          orgId = str(row.organization_id) || null;
          startNode = toNode(NODE_CAPABILITY, row);
        }
        break;
      }
      case NODE_CLAIM: {
        const { data } = await this.supabase
          .from('claims')
          .select('*')
          .eq('id', nodeId)
          .single();
        if (data) {
          const row = data as Record<string, unknown>;
          orgId = str(row.organization_id) || null;
          startNode = toNode(NODE_CLAIM, row);
        }
        break;
      }
      case NODE_EVIDENCE: {
        // evidence has no direct org_id; walk claim → org
        const { data: ev } = await this.supabase
          .from('evidence_nodes')
          .select('id, claim_id')
          .eq('id', nodeId)
          .single();
        if (ev) {
          const claimId = str((ev as Record<string, unknown>).claim_id);
          startNode = { id: nodeId, type: NODE_EVIDENCE, name: '', data: { claim_id: claimId } };
          if (claimId) {
            const { data: claim } = await this.supabase
              .from('claims')
              .select('organization_id')
              .eq('id', claimId)
              .single();
            orgId = str((claim as Record<string, unknown> | null)?.organization_id) || null;
          }
        }
        break;
      }
      case NODE_SOURCE: {
        // source_records.institution_id is the org FK
        const { data } = await this.supabase
          .from('source_records')
          .select('id, institution_id')
          .eq('id', nodeId)
          .single();
        if (data) {
          const row = data as Record<string, unknown>;
          orgId = str(row.institution_id) || null;
          startNode = { id: nodeId, type: NODE_SOURCE, name: '', data: row };
        }
        break;
      }
      case NODE_EVENT: {
        const { data } = await this.supabase
          .from('institutional_events')
          .select('id, organization_id')
          .eq('id', nodeId)
          .single();
        if (data) {
          const row = data as Record<string, unknown>;
          orgId = str(row.organization_id) || null;
          startNode = { id: nodeId, type: NODE_EVENT, name: '', data: row };
        }
        break;
      }
      default:
        return { nodes, edges, root_id: nodeId };
    }

    if (!startNode) {
      // Starting node not found — empty reverse graph.
      return { nodes, edges, root_id: nodeId };
    }

    // 2. If we couldn't derive an orgId, return just the start node.
    if (!orgId) {
      nodes.push(startNode);
      return { nodes, edges, root_id: startNode.id };
    }

    // 3. Forward-traverse the owning institution, then prune to the path
    //    between startNode and the institution. This keeps every sibling
    //    fetch tenant-scoped (orgId) while still answering the reverse query.
    const full = await this.getInstitutionGraph(orgId, 5);
    const allNodes: GraphNode[] = [
      full.institution,
      ...full.capabilities,
      ...full.claims,
      ...full.evidence,
      ...full.sources,
      ...full.events,
    ];
    const nodeById = new Map<string, GraphNode>();
    for (const n of allNodes) nodeById.set(n.id, n);

    // BFS backward from startNode to institution across the edge set.
    const reachable = this.collectReachable(full.edges, startNode.id, full.institution.id);
    for (const id of reachable) {
      const n = nodeById.get(id);
      if (n) nodes.push(n);
    }
    // Edges where BOTH endpoints are in the reachable set.
    for (const e of full.edges) {
      if (reachable.has(e.source_id) && reachable.has(e.target_id)) {
        edges.push(e);
      }
    }
    // Ensure the start node is present even if it had no inbound edges.
    if (!reachable.has(startNode.id)) {
      nodes.unshift(startNode);
    }

    return { nodes, edges, root_id: startNode.id };
  }

  /**
   * BFS over `edges` collecting every node on any path between `startId`
   * and `rootId`. Treats edges as undirected for reachability.
   */
  private collectReachable(
    edges: GraphEdge[],
    startId: string,
    rootId: string,
  ): Set<string> {
    const adj = new Map<string, string[]>();
    for (const e of edges) {
      const a = adj.get(e.source_id) ?? [];
      a.push(e.target_id);
      adj.set(e.source_id, a);
      const b = adj.get(e.target_id) ?? [];
      b.push(e.source_id);
      adj.set(e.target_id, b);
    }
    const visited = new Set<string>();
    const queue: string[] = [startId];
    visited.add(startId);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const neighbours = adj.get(cur) ?? [];
      for (const nb of neighbours) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    // Only include nodes in the component that also contains rootId.
    if (!visited.has(rootId)) {
      // No path — return just the start node.
      return new Set<string>([startId]);
    }
    return visited;
  }

  // ─── Sub-trees ─────────────────────────────────────────────────────────

  /**
   * Sub-tree rooted at a capability: capability → linked claims → their evidence.
   * Tenant safety: the capability is loaded first; its organization_id scopes
   * all subsequent claim/evidence fetches.
   */
  async getCapabilitySubtree(capabilityId: string): Promise<CapabilitySubtree> {
    const empty: CapabilitySubtree = {
      capability: { id: capabilityId, type: NODE_CAPABILITY, name: '', data: {} },
      claims: [],
      evidence: [],
      edges: [],
    };

    const { data: capRow, error: capErr } = await this.supabase
      .from('capabilities')
      .select('*')
      .eq('id', capabilityId)
      .single();
    if (capErr || !capRow) return empty;
    const capability = toNode(NODE_CAPABILITY, capRow as Record<string, unknown>);

    // Linked claims via capability_claims (capability-scoped)
    const { data: ccRows, error: ccErr } = await this.supabase
      .from('capability_claims')
      .select('claim_id, relationship_type, weight')
      .eq('capability_id', capabilityId);
    if (ccErr || !ccRows) {
      return { capability, claims: [], evidence: [], edges: [] };
    }
    const claimIds = (ccRows as Record<string, unknown>[])
      .map((r) => str(r.claim_id))
      .filter((id) => Boolean(id));
    if (claimIds.length === 0) {
      return { capability, claims: [], evidence: [], edges: [] };
    }

    // Fetch claims — scope by the capability's org for tenant safety.
    // Build the query through `unknown` casts because the Supabase query
    // builder type is structural and `.in()` + `.eq()` chaining isn't modelled
    // cleanly by DbClient (same escape hatch used in claim-repository.ts).
    const orgId = str((capRow as Record<string, unknown>).organization_id);
    let claimQuery: unknown = this.supabase
      .from('claims')
      .select('*')
      .in('id', claimIds);
    if (orgId) {
      claimQuery = (claimQuery as unknown as { eq: (c: string, v: unknown) => unknown })
        .eq('organization_id', orgId);
    }
    const { data: claimRows, error: claimErr } = (await claimQuery) as {
      data: unknown;
      error: { message?: string } | null;
    };
    if (claimErr || !claimRows) {
      return { capability, claims: [], evidence: [], edges: [] };
    }
    const claims: GraphNode[] = [];
    const claimById = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    for (const row of claimRows as Record<string, unknown>[]) {
      const node = toNode(NODE_CLAIM, row);
      claims.push(node);
      claimById.set(node.id, node);
    }
    for (const cc of ccRows as Record<string, unknown>[]) {
      const cid = str(cc.claim_id);
      if (claimById.has(cid)) {
        pushEdge(edges, capability.id, cid, 'asserts_claim', {
          relationship_type: str(cc.relationship_type),
          weight: cc.weight ?? null,
        });
      }
    }

    // Evidence via claim_evidence_links for the linked claims
    const { data: celRows } = await this.supabase
      .from('claim_evidence_links')
      .select('claim_id, evidence_id, relationship_type')
      .in('claim_id', claimIds);
    const evIds = Array.from(
      new Set(
        (celRows ?? [])
          .map((l) => str((l as Record<string, unknown>).evidence_id))
          .filter((id) => Boolean(id)),
      ),
    );
    const evidence: GraphNode[] = [];
    if (evIds.length > 0) {
      const { data: evRows } = await this.supabase
        .from('evidence_nodes')
        .select('*')
        .in('id', evIds);
      const evById = new Map<string, GraphNode>();
      for (const row of (evRows ?? []) as Record<string, unknown>[]) {
        const node = toNode(NODE_EVIDENCE, row);
        evidence.push(node);
        evById.set(node.id, node);
      }
      for (const cel of (celRows ?? []) as Record<string, unknown>[]) {
        const cid = str(cel.claim_id);
        const eid = str(cel.evidence_id);
        if (claimById.has(cid) && evById.has(eid)) {
          pushEdge(edges, cid, eid, 'supported_by_evidence', {
            relationship_type: str(cel.relationship_type),
          });
        }
      }
    }

    return { capability, claims, evidence, edges };
  }

  /**
   * Sub-tree rooted at a claim: claim → evidence → source_records → events.
   * Tenant safety: the claim is loaded first; its organization_id scopes
   * the institutional_events fetch.
   */
  async getClaimSubtree(claimId: string): Promise<ClaimSubtree> {
    const empty: ClaimSubtree = {
      claim: { id: claimId, type: NODE_CLAIM, name: '', data: {} },
      evidence: [],
      sources: [],
      events: [],
      edges: [],
    };

    const { data: claimRow, error: claimErr } = await this.supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single();
    if (claimErr || !claimRow) return empty;
    const claim = toNode(NODE_CLAIM, claimRow as Record<string, unknown>);
    const orgId = str((claimRow as Record<string, unknown>).organization_id);

    // Evidence via claim_evidence_links
    const { data: celRows, error: celErr } = await this.supabase
      .from('claim_evidence_links')
      .select('claim_id, evidence_id, relationship_type')
      .eq('claim_id', claimId);
    if (celErr || !celRows) {
      return { claim, evidence: [], sources: [], events: [], edges: [] };
    }
    const evIds = Array.from(
      new Set(
        (celRows as Record<string, unknown>[])
          .map((l) => str(l.evidence_id))
          .filter((id) => Boolean(id)),
      ),
    );
    const evidence: GraphNode[] = [];
    const evById = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    if (evIds.length > 0) {
      const { data: evRows } = await this.supabase
        .from('evidence_nodes')
        .select('*')
        .in('id', evIds);
      for (const row of (evRows ?? []) as Record<string, unknown>[]) {
        const node = toNode(NODE_EVIDENCE, row);
        evidence.push(node);
        evById.set(node.id, node);
      }
      for (const cel of celRows as Record<string, unknown>[]) {
        const eid = str(cel.evidence_id);
        if (evById.has(eid)) {
          pushEdge(edges, claim.id, eid, 'supported_by_evidence', {
            relationship_type: str(cel.relationship_type),
          });
        }
      }
    }

    // Source records via evidence_nodes.source_record_id
    const sourceIds = Array.from(
      new Set(
        evidence
          .map((n) => str(n.data.source_record_id))
          .filter((id) => Boolean(id)),
      ),
    );
    const sources: GraphNode[] = [];
    const srcById = new Map<string, GraphNode>();
    if (sourceIds.length > 0) {
      const { data: srcRows } = await this.supabase
        .from('source_records')
        .select('*')
        .in('id', sourceIds);
      for (const row of (srcRows ?? []) as Record<string, unknown>[]) {
        const node = toNode(NODE_SOURCE, row);
        sources.push(node);
        srcById.set(node.id, node);
      }
      for (const ev of evidence) {
        const srId = str(ev.data.source_record_id);
        if (srId && srcById.has(srId)) {
          pushEdge(edges, srId, ev.id, 'produced_evidence');
        }
      }
    }

    // Events — org-scoped. Link to the claim via claims.source_event_id.
    const events: GraphNode[] = [];
    if (orgId) {
      const { data: evRows } = await this.supabase
        .from('institutional_events')
        .select('*')
        .eq('organization_id', orgId);
      const evById = new Map<string, GraphNode>();
      for (const row of (evRows ?? []) as Record<string, unknown>[]) {
        const node = toNode(NODE_EVENT, row);
        events.push(node);
        evById.set(node.id, node);
      }
      const seId = str((claimRow as Record<string, unknown>).source_event_id);
      if (seId && evById.has(seId)) {
        pushEdge(edges, seId, claim.id, 'triggered_claim');
      }
    }

    return { claim, evidence, sources, events, edges };
  }

  // ─── Filtered Graph Query ──────────────────────────────────────────────

  /**
   * Query the graph for an institution with optional filters on node type,
   * status, and lifecycle status. Returns paginated nodes + the edges among
   * the returned nodes, plus an unfiltered total for paging.
   *
   * `filters.orgId` is required; all fetches are org-scoped.
   */
  async queryGraph(filters: GraphQueryFilters): Promise<GraphQueryResult> {
    const {
      orgId,
      nodeTypes,
      statuses,
      lifecycleStatuses,
      limit = 100,
      offset = 0,
    } = filters;

    const want = (type: string): boolean =>
      !nodeTypes || nodeTypes.length === 0 || nodeTypes.includes(type);

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    let total = 0;

    // Helper: apply status/lifecycle filters to a base query builder.
    // `statusCol` is the column to filter when `statuses` is provided;
    // `lifecycleCol` is filtered when `lifecycleStatuses` is provided.
    const applyFilters = (
      q: unknown,
      statusCol: string | null,
      lifecycleCol: string | null,
    ): unknown => {
      let cur = q;
      if (statuses && statuses.length > 0 && statusCol) {
        cur = (cur as unknown as { in: (c: string, v: unknown[]) => unknown })
          .in(statusCol, statuses);
      }
      if (lifecycleStatuses && lifecycleStatuses.length > 0 && lifecycleCol) {
        cur = (cur as unknown as { in: (c: string, v: unknown[]) => unknown })
          .in(lifecycleCol, lifecycleStatuses);
      }
      return cur;
    };

    // Institution root (not filtered by status/lifecycle; counted in total)
    if (want(NODE_INSTITUTION)) {
      const { data: orgRow } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      if (orgRow) {
        nodes.push(toNode(NODE_INSTITUTION, orgRow as Record<string, unknown>));
        total += 1;
      }
    }

    // Capabilities (status column: 'status', no lifecycle)
    if (want(NODE_CAPABILITY)) {
      let q: unknown = this.supabase
        .from('capabilities')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId);
      q = applyFilters(q, 'status', null);
      const res = (await q) as {
        data: unknown;
        count: number | null;
        error: { message?: string } | null;
      };
      if (!res.error && res.data) {
        for (const row of res.data as Record<string, unknown>[]) {
          nodes.push(toNode(NODE_CAPABILITY, row));
        }
        total += res.count ?? (res.data as unknown[]).length;
      }
    }

    // Claims (status: 'status', lifecycle: 'lifecycle_status')
    const claimIds: string[] = [];
    if (want(NODE_CLAIM)) {
      let q: unknown = this.supabase
        .from('claims')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId);
      q = applyFilters(q, 'status', 'lifecycle_status');
      const res = (await q) as {
        data: unknown;
        count: number | null;
        error: { message?: string } | null;
      };
      if (!res.error && res.data) {
        for (const row of res.data as Record<string, unknown>[]) {
          const node = toNode(NODE_CLAIM, row);
          nodes.push(node);
          claimIds.push(node.id);
        }
        total += res.count ?? (res.data as unknown[]).length;
      }
    }

    // Evidence (status: 'status', lifecycle: 'lifecycle_status') — org-scoped via claims
    const evIds: string[] = [];
    if (want(NODE_EVIDENCE) && claimIds.length > 0) {
      const { data: celRows } = await this.supabase
        .from('claim_evidence_links')
        .select('evidence_id')
        .in('claim_id', claimIds);
      const ids = Array.from(
        new Set(
          (celRows ?? [])
            .map((l) => str((l as Record<string, unknown>).evidence_id))
            .filter((id) => Boolean(id)),
        ),
      );
      if (ids.length > 0) {
        let q: unknown = this.supabase
          .from('evidence_nodes')
          .select('*', { count: 'exact' })
          .in('id', ids);
        q = applyFilters(q, 'status', 'lifecycle_status');
        const res = (await q) as {
          data: unknown;
          count: number | null;
          error: { message?: string } | null;
        };
        if (!res.error && res.data) {
          for (const row of res.data as Record<string, unknown>[]) {
            const node = toNode(NODE_EVIDENCE, row);
            nodes.push(node);
            evIds.push(node.id);
          }
          total += res.count ?? (res.data as unknown[]).length;
        }
      }
    }

    // Sources (no status/lifecycle columns on source_records; only acquisition_status)
    if (want(NODE_SOURCE) && evIds.length > 0) {
      const { data: evRows } = await this.supabase
        .from('evidence_nodes')
        .select('id, source_record_id')
        .in('id', evIds);
      const srcIds = Array.from(
        new Set(
          (evRows ?? [])
            .map((r) => str((r as Record<string, unknown>).source_record_id))
            .filter((id) => Boolean(id)),
        ),
      );
      if (srcIds.length > 0) {
        let q: unknown = this.supabase
          .from('source_records')
          .select('*', { count: 'exact' })
          .in('id', srcIds);
        q = applyFilters(q, 'acquisition_status', null);
        const res = (await q) as {
          data: unknown;
          count: number | null;
          error: { message?: string } | null;
        };
        if (!res.error && res.data) {
          for (const row of res.data as Record<string, unknown>[]) {
            nodes.push(toNode(NODE_SOURCE, row));
          }
          total += res.count ?? (res.data as unknown[]).length;
        }
      }
    }

    // Events (no status column; lifecycle n/a)
    if (want(NODE_EVENT)) {
      let q: unknown = this.supabase
        .from('institutional_events')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId);
      q = applyFilters(q, null, null);
      const res = (await q) as {
        data: unknown;
        count: number | null;
        error: { message?: string } | null;
      };
      if (!res.error && res.data) {
        for (const row of res.data as Record<string, unknown>[]) {
          nodes.push(toNode(NODE_EVENT, row));
        }
        total += res.count ?? (res.data as unknown[]).length;
      }
    }

    // Edges among the returned nodes — fetch join rows for the in-set node ids.
    const nodeIds = new Set(nodes.map((n) => n.id));
    if (claimIds.length > 0) {
      const { data: ccRows } = await this.supabase
        .from('capability_claims')
        .select('capability_id, claim_id, relationship_type, weight')
        .in('claim_id', claimIds);
      for (const cc of (ccRows ?? []) as Record<string, unknown>[]) {
        const s = str(cc.capability_id);
        const t = str(cc.claim_id);
        if (nodeIds.has(s) && nodeIds.has(t)) {
          pushEdge(edges, s, t, 'asserts_claim', {
            relationship_type: str(cc.relationship_type),
            weight: cc.weight ?? null,
          });
        }
      }
      const { data: celRows } = await this.supabase
        .from('claim_evidence_links')
        .select('claim_id, evidence_id, relationship_type')
        .in('claim_id', claimIds);
      for (const cel of (celRows ?? []) as Record<string, unknown>[]) {
        const s = str(cel.claim_id);
        const t = str(cel.evidence_id);
        if (nodeIds.has(s) && nodeIds.has(t)) {
          pushEdge(edges, s, t, 'supported_by_evidence', {
            relationship_type: str(cel.relationship_type),
          });
        }
      }
    }

    // Apply offset/limit on the final node list (institution always kept first).
    const institutionNodes = nodes.filter((n) => n.type === NODE_INSTITUTION);
    const otherNodes = nodes.filter((n) => n.type !== NODE_INSTITUTION);
    const pagedOthers = otherNodes.slice(offset, offset + limit);
    const pagedNodes = [...institutionNodes, ...pagedOthers];

    return { nodes: pagedNodes, edges, total };
  }

  // ─── Coverage Stats ────────────────────────────────────────────────────

  /**
   * Coverage statistics for an institution: counts of capabilities, claims,
   * evidence, and gap metrics (claims without evidence, capabilities without
   * claims), plus an evidence-class histogram. All counts are org-scoped.
   */
  async getCoverageStats(orgId: string): Promise<CoverageStats> {
    const stats: CoverageStats = {
      orgId,
      totalCapabilities: 0,
      totalClaims: 0,
      totalEvidence: 0,
      claimsWithEvidence: 0,
      claimsWithoutEvidence: 0,
      capabilitiesWithClaims: 0,
      capabilitiesWithoutClaims: 0,
      evidenceByClass: {},
    };

    // Capabilities (org-scoped)
    const { count: capCount } = await this.supabase
      .from('capabilities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    stats.totalCapabilities = capCount ?? 0;

    // Claims (org-scoped)
    const { data: claimRows, count: claimCount } = await this.supabase
      .from('claims')
      .select('id', { count: 'exact' })
      .eq('organization_id', orgId);
    stats.totalClaims = claimCount ?? 0;
    const claimIds = ((claimRows ?? []) as Record<string, unknown>[]).map((r) =>
      str(r.id),
    );

    // Evidence linked to those claims
    let evIds: string[] = [];
    if (claimIds.length > 0) {
      const { data: celRows } = await this.supabase
        .from('claim_evidence_links')
        .select('claim_id, evidence_id')
        .in('claim_id', claimIds);
      const celList = (celRows ?? []) as Record<string, unknown>[];
      evIds = Array.from(
        new Set(
          celList
            .map((l) => str(l.evidence_id))
            .filter((id) => Boolean(id)),
        ),
      );
      const claimsWithEv = new Set(
        celList.map((l) => str(l.claim_id)).filter((id) => Boolean(id)),
      );
      stats.claimsWithEvidence = claimsWithEv.size;
      stats.claimsWithoutEvidence = Math.max(
        0,
        stats.totalClaims - stats.claimsWithEvidence,
      );
    } else {
      stats.claimsWithoutEvidence = stats.totalClaims;
    }
    stats.totalEvidence = evIds.length;

    // Evidence class histogram
    if (evIds.length > 0) {
      const { data: evRows } = await this.supabase
        .from('evidence_nodes')
        .select('evidence_class')
        .in('id', evIds);
      const byClass: Record<string, number> = {};
      for (const row of (evRows ?? []) as Record<string, unknown>[]) {
        const cls = str(row.evidence_class) || 'unknown';
        byClass[cls] = (byClass[cls] ?? 0) + 1;
      }
      stats.evidenceByClass = byClass;
    }

    // Capabilities with/without claims — via capability_claims joined to
    // org-scoped capabilities. A capability "has claims" if it has at least
    // one row in capability_claims (regardless of relationship_type).
    if (stats.totalCapabilities > 0) {
      const { data: capRows } = await this.supabase
        .from('capabilities')
        .select('id')
        .eq('organization_id', orgId);
      const capIds = ((capRows ?? []) as Record<string, unknown>[]).map((r) =>
        str(r.id),
      );
      if (capIds.length > 0) {
        const { data: ccRows } = await this.supabase
          .from('capability_claims')
          .select('capability_id')
          .in('capability_id', capIds);
        const capsWithClaims = new Set(
          ((ccRows ?? []) as Record<string, unknown>[]).map((r) =>
            str(r.capability_id),
          ),
        );
        stats.capabilitiesWithClaims = capsWithClaims.size;
        stats.capabilitiesWithoutClaims = Math.max(
          0,
          stats.totalCapabilities - stats.capabilitiesWithClaims,
        );
      }
    }

    return stats;
  }
}
