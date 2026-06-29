import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

/**
 * GET /api/v1/koc/logistics
 * Logistics Dashboard: shipments, transit, delays, excursions, customs, deliveries
 */
export const GET = withAuth(async (_request, user) => {
  try {
    const supabase = await createRouteClient()

    const [shipmentsRes, twinsRes] = await Promise.all([
      supabase.from('logistics_shipments').select('id, status, carrier, origin, destination, estimated_delivery, actual_delivery, temperature_excursion'),
      supabase.from('shipment_twins').select('id, twin_status, twin_health, metadata'),
    ])

    const shipments = shipmentsRes.data ?? []
    const twinShipments = twinsRes.data ?? []

    const inTransit = shipments.filter(s => s.status === 'in_transit')
    const delayed = shipments.filter(s =>
      s.status !== 'delivered' && s.estimated_delivery &&
      new Date(s.estimated_delivery) < new Date()
    )
    const customs = shipments.filter(s => s.status === 'customs_hold')
    const deliveredToday = shipments.filter(s => {
      if (s.status !== 'delivered' || !s.actual_delivery) return false
      const today = new Date()
      const delDate = new Date(s.actual_delivery)
      return delDate.toDateString() === today.toDateString()
    })
    const excursions = shipments.filter(s => s.temperature_excursion === true)

    return Response.json({
      data: {
        summary: {
          total: shipments.length,
          in_transit: inTransit.length,
          pending: shipments.filter(s => s.status === 'pending' || s.status === 'picked_up').length,
          delivered: shipments.filter(s => s.status === 'delivered').length,
          delayed: delayed.length,
          customs_hold: customs.length,
          temperature_excursions: excursions.length,
          delivered_today: deliveredToday.length,
        },
        carriers: (() => {
          const map: Record<string, number> = {}
          for (const s of shipments) {
            if (s.carrier) map[s.carrier] = (map[s.carrier] ?? 0) + 1
          }
          return map
        })(),
        twin_health: {
          healthy: twinShipments.filter(t => t.twin_health === 'healthy').length,
          warning: twinShipments.filter(t => t.twin_health === 'warning').length,
          critical: twinShipments.filter(t => t.twin_health === 'critical').length,
        },
        recent_shipments: shipments.slice(0, 10),
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
