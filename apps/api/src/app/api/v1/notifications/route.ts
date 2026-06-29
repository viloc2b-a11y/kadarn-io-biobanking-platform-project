import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (_request, user) => {
  try {
    const supabase = await createRouteClient()

    const [auditRes, challengesRes, policiesRes, tasksRes] = await Promise.all([
      supabase.from('audit_events').select('id, action, resource_type, resource_id, summary, organization_id, created_at')
        .eq('actor_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('trust_challenges').select('id, organization_id, status, created_at')
        .or(`created_by.eq.${user.id},reviewed_by.eq.${user.id}`).limit(10),
      supabase.from('policy_evaluations').select('id, policy_id, result, evaluated_at').limit(10),
      supabase.from('workflow_tasks').select('id, workflow_instance_id, status, title').eq('assigned_to', user.id).limit(10),
    ])

    return Response.json({
      data: {
        activity: auditRes.data ?? [],
        challenges: challengesRes.data ?? [],
        evaluations: policiesRes.data ?? [],
        tasks: tasksRes.data ?? [],
      }, error: null,
    })
  } catch (err) { return handleApiError(err) }
})
