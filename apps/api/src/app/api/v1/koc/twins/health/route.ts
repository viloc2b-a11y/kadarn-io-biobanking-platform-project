import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

/**
 * GET /api/v1/koc/twins/health
 * Twins Health Dashboard — aggregate health metrics across all twin types.
 */
export const GET = withAuth(async (_request, user) => {
  try {
    // RC-0.3: KOC access restricted to kadarn_internal role
    const userRole = user.user_metadata?.kadarn_role as string | undefined
    if (userRole !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access restricted' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    const [specimens, shipments, transactions, collections] = await Promise.all([
      supabase.from('specimen_twins').select('id, status, health, twin_events: twin_events(count)'),
      supabase.from('shipment_twins').select('id, status, health, twin_events: twin_events(count)'),
      supabase.from('transaction_twins').select('id, status, health, twin_events: twin_events(count)'),
      supabase.from('collection_twins').select('id, status, health, twin_events: twin_events(count)'),
    ])

    function healthBreakdown(label: string, items: any[] | null) {
      const all = items ?? []
      return {
        label,
        total: all.length,
        active: all.filter((i: any) => i.status === 'active' || i.status === 'in_transit').length,
        by_health: {
          healthy: all.filter((i: any) => i.health === 'healthy' || i.health === 'good').length,
          warning: all.filter((i: any) => i.health === 'warning' || i.health === 'degraded').length,
          critical: all.filter((i: any) => i.health === 'critical' || i.health === 'unhealthy').length,
          unknown: all.filter((i: any) => !i.health || i.health === 'unknown').length,
        },
        total_events: all.reduce((s: number, i: any) => s + (i.twin_events?.length ?? 0), 0),
      }
    }

    return Response.json({
      data: {
        specimens: healthBreakdown('Specimens', specimens.data),
        shipments: healthBreakdown('Shipments', shipments.data),
        transactions: healthBreakdown('Transactions', transactions.data),
        collections: healthBreakdown('Collections', collections.data),
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
