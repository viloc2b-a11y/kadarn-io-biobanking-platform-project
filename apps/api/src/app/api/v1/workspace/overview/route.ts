import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (_request, user) => {
  try {
    const supabase = await createRouteClient()
    const activeOrgId = user.user_metadata?.active_org_id as string | null

    if (!activeOrgId) {
      return Response.json({ data: { requires_org_selection: true }, error: null })
    }

    // Run scoped queries in parallel — all filtered to active org
    const [programsRes, exchangeRes, dealsRes, activityRes] = await Promise.all([
      supabase
        .from('programs')
        .select('id, name, status, updated_at', { count: 'exact' })
        .or(`sponsor_org_id.eq.${activeOrgId},lead_org_id.eq.${activeOrgId}`)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5),

      supabase
        .from('exchange_requests')
        .select('id, status', { count: 'exact' })
        .eq('organization_id', activeOrgId)
        .in('status', ['submitted', 'under_review']),

      supabase
        .from('exchange_deals')
        .select('id, status', { count: 'exact' })
        .or(`sponsor_org_id.eq.${activeOrgId},provider_org_id.eq.${activeOrgId}`)
        .in('status', ['pending_acceptance', 'in_progress']),

      supabase
        .from('program_activity_log')
        .select('id, event_type, summary, created_at, program_id')
        .eq('organization_id', activeOrgId)
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    // Derive next actions from data
    const nextActions: { id: string; label: string; href: string; priority: 'high' | 'medium' | 'low' }[] = []

    if ((exchangeRes.count ?? 0) > 0) {
      nextActions.push({
        id: 'review-requests',
        label: `${exchangeRes.count} exchange request${exchangeRes.count !== 1 ? 's' : ''} pending review`,
        href: '/workspace/exchange',
        priority: 'high',
      })
    }

    if ((dealsRes.count ?? 0) > 0) {
      nextActions.push({
        id: 'active-deals',
        label: `${dealsRes.count} active deal${dealsRes.count !== 1 ? 's' : ''} in progress`,
        href: '/workspace/exchange',
        priority: 'medium',
      })
    }

    if ((programsRes.count ?? 0) === 0) {
      nextActions.push({
        id: 'discover',
        label: 'Browse the marketplace to join a program',
        href: '/marketplace',
        priority: 'low',
      })
    }

    return Response.json({
      data: {
        stats: {
          active_programs:   programsRes.count ?? 0,
          pending_requests:  exchangeRes.count ?? 0,
          active_deals:      dealsRes.count ?? 0,
        },
        recent_programs:  (programsRes.data ?? []).map(p => ({
          id: p.id, name: p.name, status: p.status, updated_at: p.updated_at,
        })),
        recent_activity:  (activityRes.data ?? []).map(a => ({
          id: a.id, type: a.event_type, summary: a.summary,
          program_id: a.program_id, created_at: a.created_at,
        })),
        next_actions: nextActions,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
