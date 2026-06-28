import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'

const DOMAIN_NODE_TYPES: Record<string, string[]> = {
  asset:      ['specimen', 'aliquot', 'qc_result'],
  logistics:  ['shipment', 'receipt', 'temperature_log'],
  consent:    ['consent', 'document'],
  exchange:   ['access_request'],
  settlement: ['dataset'],
  governance: ['protocol', 'policy_evaluation', 'program'],
}

type OrganizationName = { name: string }

const getOrganizationName = (value: OrganizationName | OrganizationName[] | null): string | null => {
  const organization = Array.isArray(value) ? value[0] : value
  return organization?.name ?? null
}

function resolveDomain(nodeType: string): string {
  for (const [domain, types] of Object.entries(DOMAIN_NODE_TYPES)) {
    if (types.includes(nodeType)) return domain
  }
  return 'other'
}

// integrity_status is computed by provenance_node_integrity_status() in the DB
// (migration 032_provenance_append_only.sql). The DB function is the single
// source of truth so the same logic applies whether called via API or SQL.

export const GET = withAuth(async (request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const domain           = searchParams.get('domain')
    const integrityFilter  = searchParams.get('integrity_status')
    const since            = searchParams.get('since') // ISO date string
    const limit            = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

    const supabase = await createRouteClient()

    // Build node type filter from domain param
    const domainNodeTypes = domain ? DOMAIN_NODE_TYPES[domain] ?? [] : []

    let nodeQuery = supabase
      .from('provenance_nodes')
      .select(`
        id, node_type, external_id, label, properties, organization_id, recorded_at,
        organizations ( name ),
        provenance_evidence ( id, evidence_type, reference, hash )
      `)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (domainNodeTypes.length > 0) {
      nodeQuery = nodeQuery.in('node_type', domainNodeTypes)
    }
    if (since) {
      nodeQuery = nodeQuery.gte('recorded_at', since)
    }

    const { data: nodes, error: nodesErr } = await nodeQuery
    if (nodesErr) {
      return Response.json({ error: { code: 500, message: nodesErr.message } }, { status: 500 })
    }

    if (!nodes || nodes.length === 0) {
      return Response.json({ data: { events: [], total: 0, filters_applied: { domain, integrity_status: integrityFilter } }, error: null })
    }

    // Fetch integrity_status from DB for each node (authoritative — same logic as SQL trigger)
    const nodeIds = nodes.map(n => n.id)

    const { data: integrityRows } = await supabase
      .rpc('provenance_node_integrity_status_batch', { p_node_ids: nodeIds })
      .select('node_id, integrity_status')

    const integrityByNode: Record<string, string> = {}
    for (const row of (integrityRows ?? []) as Array<{ node_id: string; integrity_status: string }>) {
      integrityByNode[row.node_id] = row.integrity_status
    }

    // Fallback: if batch RPC not available, compute per-node via individual RPC
    const getIntegrity = async (nodeId: string, nodeType: string): Promise<string> => {
      if (integrityByNode[nodeId]) return integrityByNode[nodeId]
      const { data } = await supabase
        .rpc('provenance_node_integrity_status', { p_node_id: nodeId, p_node_type: nodeType })
      return (data as string | null) ?? 'warning'
    }

    // Fetch edge counts for each node in bulk (still needed for edge_count field)
    const { data: edges } = await supabase
      .from('provenance_edges')
      .select('source_node_id, target_node_id, edge_type')
      .or(`source_node_id.in.(${nodeIds.map(id => `"${id}"`).join(',')}),target_node_id.in.(${nodeIds.map(id => `"${id}"`).join(',')})`)

    const edgeCountByNode: Record<string, number> = {}
    for (const e of edges ?? []) {
      edgeCountByNode[e.source_node_id] = (edgeCountByNode[e.source_node_id] ?? 0) + 1
      edgeCountByNode[e.target_node_id] = (edgeCountByNode[e.target_node_id] ?? 0) + 1
    }

    const events = await Promise.all(nodes.map(async node => {
      const evidenceList = (node.provenance_evidence ?? []) as Array<{ id: string; evidence_type: string; reference: string; hash: string | null }>
      const edgeCount    = edgeCountByNode[node.id] ?? 0
      const props        = (node.properties ?? {}) as Record<string, unknown>
      const integrityStatus = await getIntegrity(node.id, node.node_type)

      return {
        event_id:         node.id,
        event_type:       node.node_type,
        domain:           resolveDomain(node.node_type),
        entity_type:      node.node_type,
        entity_id:        node.external_id,
        organization:     getOrganizationName(node.organizations),
        organization_id:  node.organization_id,
        program:          (props['program_id'] as string | undefined) ?? null,
        timestamp:        node.recorded_at,
        actor:            (props['actor'] as string | undefined) ?? null,
        label:            node.label,
        evidence_ref:     evidenceList.map(e => e.reference),
        evidence_count:   evidenceList.length,
        integrity_status: integrityStatus,
        edge_count:       edgeCount,
      }
    }))

    const filtered = events.filter(e => {
      if (integrityFilter && e.integrity_status !== integrityFilter) return false
      return true
    })

    const summary = {
      complete:         filtered.filter(e => e.integrity_status === 'complete').length,
      warning:          filtered.filter(e => e.integrity_status === 'warning').length,
      missing_evidence: filtered.filter(e => e.integrity_status === 'missing_evidence').length,
    }

    return Response.json({
      data: {
        total:           filtered.length,
        summary,
        events:          filtered,
        filters_applied: { domain, integrity_status: integrityFilter, since },
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})

// ---------------------------------------------------------------------------
// POST — Create a provenance node with optional edges and evidence
// ---------------------------------------------------------------------------
export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const body = (await request.json()) as Record<string, unknown>

    // Validate required fields
    if (!body.node_type || typeof body.node_type !== 'string') {
      throw new ApiError(400, 'node_type (string) is required')
    }
    if (!body.external_id || typeof body.external_id !== 'string') {
      throw new ApiError(400, 'external_id (string) is required')
    }
    if (!body.organization_id || typeof body.organization_id !== 'string') {
      throw new ApiError(400, 'organization_id (UUID) is required')
    }

    const nodeType = body.node_type
    const externalId = body.external_id
    const label = typeof body.label === 'string' ? body.label : null
    const properties = (body.properties ?? {}) as Record<string, unknown>
    const organizationId = body.organization_id
    const edges = Array.isArray(body.edges)
      ? body.edges as Array<{ edge_type: string; target_node_id: string }>
      : []
    const evidence = Array.isArray(body.evidence)
      ? body.evidence as Array<{ evidence_type: string; reference: string }>
      : []

    // 1. Insert provenance node
    // Try RPC first, fall back to direct insert
    let nodeId: string

    const { data: upsertResult, error: rpcError } = await supabase
      .rpc('upsert_provenance_node', {
        p_node_type: nodeType,
        p_external_id: externalId,
        p_label: label,
        p_properties: properties,
        p_organization_id: organizationId,
      })
      .maybeSingle()

    const upsertedNode = upsertResult as { id?: string } | null

    if (!rpcError && upsertedNode?.id) {
      nodeId = upsertedNode.id
    } else {
      // Fallback: direct insert
      const { data: insertResult, error: insertError } = await supabase
        .from('provenance_nodes')
        .insert({
          node_type: nodeType,
          external_id: externalId,
          label,
          properties,
          organization_id: organizationId,
        })
        .select('id')
        .single()

      if (insertError) {
        throw new ApiError(500, 'Failed to create provenance node', insertError.message)
      }
      nodeId = insertResult.id
    }

    // 2. Insert edges if provided
    if (edges.length > 0) {
      const edgeRows = edges.map(e => ({
        edge_type: e.edge_type,
        source_node_id: nodeId,
        target_node_id: e.target_node_id,
      }))

      const { error: edgeError } = await supabase
        .from('provenance_edges')
        .insert(edgeRows)

      if (edgeError) {
        throw new ApiError(500, 'Failed to create provenance edges', edgeError.message)
      }
    }

    // 3. Insert evidence if provided
    if (evidence.length > 0) {
      const evidenceRows = evidence.map(ev => ({
        node_id: nodeId,
        evidence_type: ev.evidence_type,
        reference: ev.reference,
      }))

      const { error: evidenceError } = await supabase
        .from('provenance_evidence')
        .insert(evidenceRows)

      if (evidenceError) {
        throw new ApiError(500, 'Failed to create provenance evidence', evidenceError.message)
      }
    }

    // Fetch the created node with relations
    const { data: created } = await supabase
      .from('provenance_nodes')
      .select(`
        id, node_type, external_id, label, properties, organization_id, recorded_at,
        provenance_evidence ( id, evidence_type, reference )
      `)
      .eq('id', nodeId)
      .single()

    return Response.json({ data: created }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
})
