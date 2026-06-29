import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (_request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
    }
    const supabase = await createRouteClient()

    const { data, error } = await supabase
      .from('audit_events')
      .select('id, action, resource_type, resource_id, summary, organization_id, program_id, actor_email, created_at')
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      return Response.json({ error: { code: 500, message: error.message } }, { status: 500 })
    }

    return Response.json({
      data: (data ?? []).map(e => ({
        id: e.id, action: e.action, resource_type: e.resource_type,
        resource_id: e.resource_id, summary: e.summary,
        actor: e.actor_email, created_at: e.created_at,
      })),
      error: null,
    })
  } catch (err) { return handleApiError(err) }
})
