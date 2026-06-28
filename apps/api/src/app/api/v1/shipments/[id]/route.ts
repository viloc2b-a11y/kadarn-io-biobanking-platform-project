import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'

const VALID_STATUSES = [
  'pending', 'picked_up', 'in_transit', 'customs_hold',
  'delivered', 'exception', 'returned', 'cancelled',
] as const

/**
 * PATCH /api/v1/shipments/:id
 *
 * Update shipment status and tracking details.
 * Also syncs the linked shipment_twin status.
 */
export const PATCH = withAuth(async (request, user) => {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (!id || id === 'undefined') {
      throw new ApiError(400, 'Shipment ID is required')
    }

    const supabase = await createRouteClient()

    // Verify shipment exists and user has access
    const { data: existing, error: findError } = await supabase
      .from('logistics_shipments')
      .select('id, status, organization_id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      if (findError?.code === 'PGRST116') {
        throw new ApiError(404, 'Shipment not found')
      }
      throw new ApiError(500, 'Failed to find shipment', findError?.message)
    }

    // Role check: KOC internal OR org member of owning org
    const isKocInternal = user.user_metadata?.kadarn_role === 'kadarn_internal'
    const activeOrgId = user.user_metadata?.active_org_id as string | null

    if (!isKocInternal && activeOrgId !== existing.organization_id) {
      throw new ApiError(403, 'Access denied — not authorized to update this shipment')
    }

    // Parse and validate body
    const body = (await request.json()) as Record<string, unknown>
    const updates: Record<string, unknown> = {}

    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
        throw new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`)
      }
      updates.status = body.status

      // Auto-set actual_delivery when marking as delivered
      if (body.status === 'delivered' && !body.actual_delivery) {
        updates.actual_delivery = new Date().toISOString()
      }
    }

    if (body.actual_delivery !== undefined) {
      updates.actual_delivery = body.actual_delivery
    }
    if (body.temperature_excursion !== undefined) {
      updates.temperature_excursion = body.temperature_excursion
    }
    if (body.carrier !== undefined) {
      updates.carrier = body.carrier
    }
    if (body.tracking_number !== undefined) {
      updates.tracking_number = body.tracking_number
    }
    if (body.destination_address !== undefined) {
      updates.destination_address = body.destination_address
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, 'No valid fields to update')
    }

    // Update logistics_shipments
    const { data: updated, error: updateError } = await supabase
      .from('logistics_shipments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new ApiError(500, 'Failed to update shipment', updateError.message)
    }

    // Sync the linked shipment_twin if status changed
    if (body.status) {
      const { error: twinError } = await supabase
        .from('shipment_twins')
        .update({ twin_status: body.status })
        .eq('id', id)

      if (twinError) {
        // Non-blocking: log but don't fail the request
        console.error(`Failed to sync shipment_twin for ${id}: ${twinError.message}`)
      }
    }

    return Response.json({
      data: updated,
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
