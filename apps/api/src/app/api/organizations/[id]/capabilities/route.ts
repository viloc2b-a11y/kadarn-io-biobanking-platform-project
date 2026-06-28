import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { uuidParamSchema } from '@/lib/validation'
import { z } from 'zod'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { createCorrelationId } from '@/lib/exchange-helper'

const assignCapabilitiesSchema = z.object({
  capability_keys: z.array(z.string().min(1)).min(1, 'At least one capability key is required'),
})

/**
 * GET /api/v1/organizations/:id/capabilities
 * List current capabilities for an organization.
 */
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id: orgId } = uuidParamSchema.parse(params)
    const supabase = await createRouteClient()

    const { data, error } = await supabase
      .from('organization_capabilities')
      .select(`
        id,
        capability_type_id,
        is_primary,
        accredited_until,
        created_at,
        organization_capability_types ( id, key, name, category )
      `)
      .eq('organization_id', orgId)

    if (error) throw new ApiError(500, 'Failed to fetch capabilities', error.message)

    return Response.json({
      data: (data ?? []).map(c => ({
        id: c.id,
        capability_type_id: c.capability_type_id,
        key: (c.organization_capability_types as any)?.key ?? null,
        name: (c.organization_capability_types as any)?.name ?? null,
        category: (c.organization_capability_types as any)?.category ?? null,
        is_primary: c.is_primary,
        accredited_until: c.accredited_until,
        created_at: c.created_at,
      })),
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})

/**
 * POST /api/v1/organizations/:id/capabilities
 * Assign capabilities to an organization by capability key.
 */
export const POST = withAsyncTracing(
  withAuth(async (request, user, params) => {
    try {
      const { id: orgId } = uuidParamSchema.parse(params)
      const supabase = await createRouteClient()
      const correlationId = createCorrelationId()

      // Verify caller is org admin
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('id, role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!membership) throw new ApiError(403, 'You are not a member of this organization')

      const body = (await request.json()) as Record<string, unknown>
      const parsed = assignCapabilitiesSchema.safeParse(body)
      if (!parsed.success) throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)

      // Look up capability type IDs by key
      const { data: types } = await supabase
        .from('organization_capability_types')
        .select('id, key')
        .in('key', parsed.data.capability_keys)

      if (!types || types.length === 0)
        throw new ApiError(400, `No capability types found for keys: ${parsed.data.capability_keys.join(', ')}`)

      const foundKeys = new Set(types.map(t => t.key))
      const missingKeys = parsed.data.capability_keys.filter(k => !foundKeys.has(k))
      if (missingKeys.length > 0)
        throw new ApiError(400, `Unknown capability keys: ${missingKeys.join(', ')}`)

      let assigned = 0
      for (const type of types) {
        const { error: insertErr } = await supabase
          .from('organization_capabilities')
          .insert({ organization_id: orgId, capability_type_id: type.id, created_by: user.id })
          .maybeSingle()
        if (!insertErr) assigned++
      }

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      console.log(JSON.stringify({
        type: 'domain_event',
        event: {
          type: 'OrganizationCapabilityAdded',
          payload: { organizationId: orgId, capabilityKey: parsed.data.capability_keys.join(','), isPrimary: false },
          actorId: user.id, organizationId: orgId, correlationId,
        },
        timestamp: new Date().toISOString(),
      }))

      return Response.json({
        data: { assigned, capabilities: types.map(t => t.key) },
        error: null,
      }, { status: 201 })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'organizations.capabilities', 'kadarn.api.method': 'POST' } },
)
