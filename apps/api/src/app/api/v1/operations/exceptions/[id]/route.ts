import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'

/**
 * PATCH /api/v1/operations/exceptions/:id
 *
 * Resolve, escalate, or dismiss an operational exception.
 * Delegates to the appropriate source table based on exception source.
 *
 * Body: { action: "resolve" | "escalate" | "dismiss", note?: string }
 */
export const PATCH = withAuth(async (request, user) => {
  try {
    // Extract id from URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (!id || id === 'undefined') {
      throw new ApiError(400, 'Exception ID is required')
    }

    const { action, note } = await request.json() as {
      action: 'resolve' | 'escalate' | 'dismiss'
      note?: string
    }

    if (!['resolve', 'escalate', 'dismiss'].includes(action)) {
      throw new ApiError(400, 'Invalid action. Must be: resolve, escalate, or dismiss')
    }

    const supabase = await createRouteClient()

    // Determine source table by checking each possible source
    // Order: trust_challenges → logistics_shipments → exchange_requests
    const sourceChecks: Array<{
      table: string
      statusField: string
      statusMap: Record<string, string>
    }> = [
      {
        table: 'trust_challenges',
        statusField: 'status',
        statusMap: { resolve: 'resolved', escalate: 'under_review', dismiss: 'dismissed' },
      },
      {
        table: 'logistics_shipments',
        statusField: 'status',
        statusMap: { resolve: 'delivered', escalate: 'exception', dismiss: 'cancelled' },
      },
      {
        table: 'exchange_requests',
        statusField: 'status',
        statusMap: { resolve: 'accepted', escalate: 'under_review', dismiss: 'withdrawn' },
      },
    ]

    let sourceTable: string | null = null
    let newStatus: string | null = null
    let orgId: string | null = null

    for (const source of sourceChecks) {
      const newSt = source.statusMap[action]
      if (!newSt) continue

      // Use raw query since tables have different column names
      const { data } = await supabase
        .from(source.table as any)
        .select('id, organization_id')
        .eq('id', id)
        .maybeSingle()

      if (data) {
        sourceTable = source.table
        newStatus = newSt
        orgId = (data as any).organization_id ?? null
        break
      }
    }

    if (!sourceTable || !newStatus) {
      throw new ApiError(404, 'Exception not found in any source table')
    }

    // Build update payload
    const updatePayload: Record<string, any> = {
      [sourceChecks.find(s => s.table === sourceTable)!.statusField]: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }
    if (note) {
      updatePayload.resolution_notes = note
    }

    const { error: updateError } = await supabase
      .from(sourceTable as any)
      .update(updatePayload)
      .eq('id', id)

    if (updateError) {
      throw new ApiError(500, 'Failed to update exception', updateError.message)
    }

    // Log audit event
    const auditAction = action === 'resolve' ? 'complete' : action === 'escalate' ? 'submit' : 'cancel'
        const resourceTypeMap: Record<string, string> = {
          trust_challenges: 'trust_challenge',
          logistics_shipments: 'shipment',
          exchange_requests: 'exchange_request',
        }
        await supabase.rpc('emit_audit_event', {
          p_action: auditAction,
          p_resource_type: resourceTypeMap[sourceTable] ?? 'exception',
          p_resource_id: id,
          p_organization_id: orgId,
          p_summary: `Exception ${action}d: ${note ?? 'No note'}`,
        }).maybeSingle()

    return Response.json({
      data: {
        id,
        source: sourceTable,
        action,
        new_status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
