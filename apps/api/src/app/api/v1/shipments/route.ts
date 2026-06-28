import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import {
  emitShipmentCreated,
  recordShipmentProvenance,
  evaluateProviderTrust,
  createCorrelationId,
} from '@/lib/logistics-helper'

type JsonObject = Record<string, unknown>

// ---------------------------------------------------------------------------
// GET /api/v1/shipments — List logistics shipments
// ---------------------------------------------------------------------------
export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const programId = url.searchParams.get('program_id')
    const orgId = url.searchParams.get('organization_id')
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200)

    const isKocInternal = user.user_metadata?.kadarn_role === 'kadarn_internal'

    let query = supabase
      .from('logistics_shipments')
      .select(`
        id, program_id, organization_id, shipment_name, shipment_type, status,
        carrier, service_type, tracking_number,
        origin_org_id, origin_address, destination_org_id, destination_address,
        pick_up_date, estimated_delivery, actual_delivery, shipped_date,
        container_type, temperature_excursion,
        created_at, updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      const statuses = status.split(',')
      query = query.in('status', statuses)
    }
    if (programId) query = query.eq('program_id', programId)

    if (!isKocInternal) {
      const activeOrgId = user.user_metadata?.active_org_id as string | null
      if (!activeOrgId) return Response.json({ data: [], error: null })
      query = query.eq('organization_id', activeOrgId)
    } else if (orgId) {
      query = query.eq('organization_id', orgId)
    }

    const { data, error } = await query
    if (error) throw new ApiError(500, 'Failed to fetch shipments', error.message)

    return Response.json({ data: data ?? [], error: null })
  } catch (err) {
    return handleApiError(err)
  }
})

// ---------------------------------------------------------------------------
// POST /api/v1/shipments — Create a logistics shipment + twin
// ---------------------------------------------------------------------------
export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const body = (await request.json()) as JsonObject
      const correlationId = createCorrelationId()

      if (!body.organization_id || typeof body.organization_id !== 'string')
        throw new ApiError(400, 'organization_id (UUID) is required')
      if (!body.program_id || typeof body.program_id !== 'string')
        throw new ApiError(400, 'program_id (UUID) is required')
      if (!body.carrier || typeof body.carrier !== 'string')
        throw new ApiError(400, 'carrier (string) is required')

      const validCarriers = ['fedex', 'dhl', 'world_courier', 'marken', 'ups', 'other']
      const carrier = body.carrier.toLowerCase()
      if (!validCarriers.includes(carrier))
        throw new ApiError(400, `Invalid carrier. Must be one of: ${validCarriers.join(', ')}`)

      const shipmentName = body.shipment_name ?? `Shipment-${Date.now().toString(36)}`
      const originAddress = body.origin ?? body.origin_address ?? null
      const destAddress = body.destination ?? body.destination_address ?? null
      const tempReq = body.temperature_requirements ?? body.temperature_range ?? null
      const validContainers = ['dry_ice_box', 'liquid_nitrogen_dry_shipper', 'refrigerated', 'ambient', 'frozen_gel_packs', 'temperature_controlled_container']
      const normalizedTempReq = typeof tempReq === 'string' ? tempReq.toLowerCase().replace(/\s+/g, '_') : null
      const containerType = normalizedTempReq && validContainers.includes(normalizedTempReq) ? normalizedTempReq : 'dry_ice_box'
      const estimatedDelivery = body.estimated_delivery ?? body.estimated_delivery_date ?? null

      const { data: shipment, error: insertError } = await supabase
        .from('logistics_shipments')
        .insert({
          program_id: body.program_id,
          organization_id: body.organization_id,
          shipment_name: shipmentName,
          shipment_type: body.shipment_type ?? 'standard',
          status: 'pending',
          carrier,
          service_type: body.service_type ?? null,
          origin_address: originAddress,
          destination_address: destAddress,
          estimated_delivery: estimatedDelivery,
          container_type: containerType,
        })
        .select('id, program_id, organization_id, shipment_name, status, carrier, created_at')
        .single()

      if (insertError) throw new ApiError(500, 'Failed to create shipment', insertError.message)

      // Create shipment_twin
      const { error: twinError } = await supabase
        .from('shipment_twins')
        .insert({
          id: shipment.id,
          organization_id: body.organization_id,
          status: 'scheduled',
          courier: carrier,
          origin_org_id: body.origin_org_id ?? null,
          destination_org_id: body.destination_org_id ?? null,
          temperature_range: tempReq,
          twin_sequence: 0,
        })

      if (twinError) console.error('Failed to create shipment twin:', twinError.message)

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      const orgId = body.organization_id as string
      evaluateProviderTrust(body.destination_org_id as string ?? orgId)
      recordShipmentProvenance(shipment.id, orgId, carrier, correlationId)
        .catch((err: unknown) => console.error('[SHIPMENT] Provenance failed:', err))
      emitShipmentCreated(shipment.id, orgId, body.program_id as string, carrier, user.id, correlationId)

      return Response.json({ data: shipment }, { status: 201 })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'shipments', 'kadarn.api.method': 'POST' } },
)
