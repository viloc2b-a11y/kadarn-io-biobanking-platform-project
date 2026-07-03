import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

/**
 * GET /api/v1/koc/twins
 * Digital Twins Dashboard: health status and counts across all twin types
 */
export const GET = withAuth(async (_request, user) => {
  try {
    // RC-0.3: KOC access restricted to kadarn_internal role
    const userRole = user.user_metadata?.kadarn_role as string | undefined
    if (userRole !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access restricted' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    const [specimensRes, shipmentsRes, transactionsRes, collectionsRes, eventsRes] = await Promise.all([
      supabase.from('specimen_twins').select('id, twin_status, twin_health, updated_at', { count: 'exact' }),
      supabase.from('shipment_twins').select('id, twin_status, twin_health, updated_at', { count: 'exact' }),
      supabase.from('transaction_twins').select('id, twin_status, twin_health, updated_at', { count: 'exact' }),
      supabase.from('collection_twins').select('id, twin_status, updated_at', { count: 'exact' }),
      supabase.from('twin_events').select('id, event_type, created_at').order('created_at', { ascending: false }).limit(20),
    ])

    const specimens = specimensRes.data ?? []
    const shipments = shipmentsRes.data ?? []
    const transactions = transactionsRes.data ?? []
    const collections = collectionsRes.data ?? []

    function healthBreakdown(items: any[]) {
      return {
        healthy: items.filter(i => (i.twin_health ?? 'healthy') === 'healthy').length,
        warning: items.filter(i => i.twin_health === 'warning').length,
        critical: items.filter(i => i.twin_health === 'critical').length,
        unknown: items.filter(i => !i.twin_health || i.twin_health === 'unknown').length,
        total: items.length,
      }
    }

    function statusBreakdown(items: any[]) {
      return {
        active: items.filter(i => i.twin_status === 'active').length,
        inactive: items.filter(i => i.twin_status === 'inactive').length,
        archived: items.filter(i => i.twin_status === 'archived').length,
      }
    }

    return Response.json({
      data: {
        summary: {
          total_twins: specimens.length + shipments.length + transactions.length + collections.length,
          total_healthy: healthBreakdown(specimens).healthy + healthBreakdown(shipments).healthy + healthBreakdown(transactions).healthy + healthBreakdown(collections).healthy,
          total_warning: healthBreakdown(specimens).warning + healthBreakdown(shipments).warning + healthBreakdown(transactions).warning + healthBreakdown(collections).warning,
          total_critical: healthBreakdown(specimens).critical + healthBreakdown(shipments).critical + healthBreakdown(transactions).critical + healthBreakdown(collections).critical,
        },
        by_type: {
          specimens: { count: specimens.length, health: healthBreakdown(specimens), status: statusBreakdown(specimens) },
          shipments: { count: shipments.length, health: healthBreakdown(shipments), status: statusBreakdown(shipments) },
          transactions: { count: transactions.length, health: healthBreakdown(transactions), status: statusBreakdown(transactions) },
          collections: { count: collections.length, health: healthBreakdown(collections), status: statusBreakdown(collections) },
        },
        recent_events: (eventsRes.data ?? []).slice(0, 20),
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
