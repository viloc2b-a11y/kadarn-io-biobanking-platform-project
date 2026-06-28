import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { uuidParamSchema } from '@/lib/validation'

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id: programId } = uuidParamSchema.parse(params)
    const supabase = await createRouteClient()

    const { data, error } = await supabase
      .from('audit_events')
      .select(`
        id, actor_id, actor_email, action, resource_type, resource_id,
        organization_id, program_id, summary, old_values, new_values,
        metadata, created_at
      `)
      .eq('program_id', programId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return Response.json(
        { error: { code: 500, message: error.message } },
        { status: 500 },
      )
    }

    return Response.json({
      data: (data ?? []).map(e => ({
        id: e.id,
        actor: { id: e.actor_id, email: e.actor_email },
        action: e.action,
        resource: { type: e.resource_type, id: e.resource_id },
        organization_id: e.organization_id,
        summary: e.summary,
        created_at: e.created_at,
      })),
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
