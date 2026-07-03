import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (request, user) => {
  try {
    // RC-0.3: KOC access restricted to kadarn_internal role
    const userRole = user.user_metadata?.kadarn_role as string | undefined
    if (userRole !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access restricted' } }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resource_type')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200)

    const supabase = await createRouteClient()

    let query = supabase
      .from('audit_events')
      .select(`
        id, actor_id, actor_email, action, resource_type, resource_id,
        organization_id, program_id, summary, metadata, created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (action) {
      const actions = action.split(',')
      query = query.in('action', actions)
    }
    if (resourceType) {
      const types = resourceType.split(',')
      query = query.in('resource_type', types)
    }

    const { data, error } = await query

    if (error) {
      return Response.json({ error: { code: 500, message: error.message } }, { status: 500 })
    }

    // Get unique event types for filter UI
    const { data: allTypes } = await supabase
      .from('audit_events')
      .select('action, resource_type', { count: 'exact', head: false })
      .order('created_at', { ascending: false })
      .limit(200)

    const actionTypes = [...new Set((allTypes ?? []).map(e => e.action))]
    const resourceTypes = [...new Set((allTypes ?? []).map(e => e.resource_type))]

    return Response.json({
      data: {
        total: data?.length ?? 0,
        events: (data ?? []).map(e => ({
          id: e.id,
          actor: { id: e.actor_id, email: e.actor_email },
          action: e.action,
          resource: { type: e.resource_type, id: e.resource_id },
          organization_id: e.organization_id,
          program_id: e.program_id,
          summary: e.summary,
          metadata: e.metadata,
          timestamp: e.created_at,
        })),
        filters: {
          actions: actionTypes.sort(),
          resource_types: resourceTypes.sort(),
        },
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
