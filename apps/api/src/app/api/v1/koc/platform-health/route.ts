import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

/**
 * GET /api/v1/koc/platform-health
 * Platform Health Dashboard: system metrics, job queues, error rates
 */
export const GET = withAuth(async (_request, user) => {
  try {
    // RC-0.3: KOC access restricted to kadarn_internal role
    const userRole = user.user_metadata?.kadarn_role as string | undefined
    if (userRole !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access restricted' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const [recentEvents, dailyEvents, orgsRes, shipmentsRes, exchangesRes] = await Promise.all([
      supabase.from('audit_events').select('id, action', { count: 'exact' }).gte('created_at', oneHourAgo),
      supabase.from('audit_events').select('id', { count: 'exact' }).gte('created_at', oneDayAgo),
      supabase.from('organizations').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('logistics_shipments').select('id, status', { count: 'exact' }),
      supabase.from('exchange_requests').select('id, status', { count: 'exact' }),
    ])

    return Response.json({
      data: {
        events_per_hour: recentEvents.count ?? 0,
        events_per_day: dailyEvents.count ?? 0,
        active_orgs: orgsRes.count ?? 0,
        total_shipments: shipmentsRes.count ?? 0,
        total_exchanges: exchangesRes.count ?? 0,
        error_events: (recentEvents.data ?? []).filter(e => e.action === 'error' || e.action === 'delete').length,
        timestamp: now.toISOString(),
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
