import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { emitShipmentStatusChanged, createCorrelationId } from '@/lib/logistics-helper'

const VALID_STATUSES = [
  'pending', 'picked_up', 'in_transit', 'customs_hold',
  'delivered', 'exception', 'returned', 'cancelled',
] as const

/**
 * PATCH /api/v1/shipments/:id — Update shipment status and tracking details.
 * Also syncs the linked shipment_twin status.
 */
export const PATCH = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const url = new URL(request.url)
      const pathParts = url.pathname.split('/')
      const id = pathParts[pathParts.length - 1]
      const correlationId = createCorrelationId()

      if (!id || id === 'undefined') throw new ApiError(400, 'Shipment ID is required')

      const supabase = await createRouteClient()

      const { data: existing, error: findError } = await supabase
        .from('logistics_shipments')
        .select('id, status, organization_id')
        .eq('id', id)
        .single()

      if (findError || !existing) {
        if (findError?.code === 'PGRST116') throw new ApiError(404, 'Shipment not found')
        throw new ApiError(500, 'Failed to find shipment', findError?.message)
      }

      const isKocInternal = user.user_metadata?.kadarn_role === 'kadarn_internal'
      const activeOrgId = user.user_metadata?.active_org_id as string | null
      if (!isKocInternal && activeOrgId !== existing.organization_id)
        throw new ApiError(403, 'Access denied — not authorized to update this shipment')

      const body = (await request.json()) as Record<string, unknown>
      const updates: Record<string, unknown> = {}

      if (body.status !== undefined) {
        if (typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number]))
          throw new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`)
        updates.status = body.status
        if (body.status === 'delivered' && !body.actual_delivery)
          updates.actual_delivery = new Date().toISOString()
      }
      if (body.tracking_number !== undefined) updates.tracking_number = body.tracking_number
      if (body.origin_address !== undefined) updates.origin_address = body.origin_address
      if (body.destination_address !== undefined) updates.destination_address = body.destination_address
      if (body.origin_org_id !== undefined) updates.origin_org_id = body.origin_org_id
      if (body.destination_org_id !== undefined) updates.destination_org_id = body.destination_org_id
      if (body.estimated_delivery !== undefined) updates.estimated_delivery = body.estimated_delivery
      if (body.actual_delivery !== undefined) updates.actual_delivery = body.actual_delivery
      if (body.temperature_excursion !== undefined) updates.temperature_excursion = body.temperature_excursion

      const { error: updateError } = await supabase
        .from('logistics_shipments')
        .update(updates)
        .eq('id', id)

      if (updateError) throw new ApiError(500, 'Failed to update shipment', updateError.message)

      // Sync shipment_twin status
      if (body.status) {
        const twinStatus = body.status === 'delivered' ? 'delivered'
          : body.status === 'in_transit' ? 'in_transit'
          : body.status === 'exception' ? 'exception'
          : body.status === 'cancelled' ? 'cancelled'
          : 'scheduled'

        const { error: twinErr } = await supabase
          .from('shipment_twins')
          .update({ status: twinStatus })
          .eq('id', id)

        if (twinErr) console.error('Failed to sync shipment_twin for', id, twinErr.message)
      }

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      if (body.status && body.status !== existing.status) {
        emitShipmentStatusChanged(id, existing.organization_id, existing.status, body.status as string, user.id, correlationId)
      }

      return Response.json({ data: { id, status: updates.status ?? existing.status }, error: null })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'shipments.id', 'kadarn.api.method': 'PATCH' } },
)
