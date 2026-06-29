import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { uuidParamSchema } from '@/lib/validation'
import { z } from 'zod'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { publishIntegrationEvent } from '@/lib/event-runtime'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const participantRoleEnum = [
  'sponsor', 'lead', 'contributor', 'consumer', 'processor', 'reviewer', 'observer',
] as const

const addParticipantSchema = z.object({
  organization_id: z.string().uuid('Organization ID must be a valid UUID'),
  role: z.enum(participantRoleEnum, {
    errorMap: () => ({ message: `Role must be one of: ${participantRoleEnum.join(', ')}` }),
  }),
  data_scope_override: z
    .enum(['no_sharing', 'metadata_only', 'aggregate_only', 'de_identified', 'pseudonymized', 'identified', 'full_access'])
    .optional(),
})

// ---------------------------------------------------------------------------
// GET — list participants
// ---------------------------------------------------------------------------
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id: programId } = uuidParamSchema.parse(params)
    const supabase = await createRouteClient()

    const { data, error } = await supabase
      .from('program_participants')
      .select(`
        id, organization_id, role, status, data_scope_override,
        invited_at, joined_at, deactivated_at, deactivated_reason,
        created_at, updated_at,
        organizations ( id, name, country, is_active )
      `)
      .eq('program_id', programId)

    if (error) {
      return Response.json(
        { error: { code: 500, message: error.message } },
        { status: 500 },
      )
    }

    return Response.json({
      data: (data ?? []).map(p => ({
        id: p.id,
        organization: p.organizations,
        role: p.role,
        status: p.status,
        data_scope_override: p.data_scope_override,
        invited_at: p.invited_at,
        joined_at: p.joined_at,
        deactivated_at: p.deactivated_at,
        deactivated_reason: p.deactivated_reason,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })),
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})

// ---------------------------------------------------------------------------
// POST — add a participant (negotiation step in sponsor flow)
// ---------------------------------------------------------------------------
export const POST = withAsyncTracing(
  withAuth(async (request, user, params) => {
    try {
      const supabase = await createRouteClient()
      const { id: programId } = uuidParamSchema.parse(params)

      const body = (await request.json()) as Record<string, unknown>
      const parsed = addParticipantSchema.safeParse(body)
      if (!parsed.success) {
        throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)
      }

      const { organization_id, role, data_scope_override } = parsed.data

      const { data: program, error: progErr } = await supabase
        .from('programs')
        .select('id, sponsor_org_id, lead_org_id, created_by_organization_id')
        .eq('id', programId)
        .single()

      if (progErr || !program) throw new ApiError(404, 'Program not found')

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organization_id)
        .single()

      if (!org) throw new ApiError(400, 'Organization not found')

      const activeOrgId = user.user_metadata?.active_org_id as string | null
      const isKocInternal = user.user_metadata?.kadarn_role === 'kadarn_internal'
      const authorizedOrgs = [
        program.sponsor_org_id,
        program.lead_org_id,
        program.created_by_organization_id,
      ].filter(Boolean) as string[]

      if (!isKocInternal && (!activeOrgId || !authorizedOrgs.includes(activeOrgId))) {
        throw new ApiError(403, 'Access denied — must be an admin of the sponsor or lead organization')
      }

      const { data: existing } = await supabase
        .from('program_participants')
        .select('id')
        .eq('program_id', programId)
        .eq('organization_id', organization_id)
        .maybeSingle()

      if (existing) throw new ApiError(409, 'Organization is already a participant in this program')

      const { data: inserted, error: insertErr } = await supabase
        .from('program_participants')
        .insert({
          program_id: programId,
          organization_id,
          role,
          status: 'invited',
          data_scope_override: data_scope_override ?? null,
          invited_at: new Date().toISOString(),
          created_by: user.id,
        })
        .select(`
          id, organization_id, role, status, data_scope_override,
          invited_at, joined_at, created_at,
          organizations ( id, name, country, is_active )
        `)
        .single()

      if (insertErr) throw new ApiError(500, 'Failed to add participant', insertErr.message)

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      const _corrId = crypto.randomUUID()
      publishIntegrationEvent('ProgramParticipantAdded', {
        participantId: inserted.id,
        programId,
        organizationId: organization_id,
        role,
      }, {
        actorId: user.id,
        organizationId: organization_id,
        correlationId: _corrId,
        programId,
        idempotencyKey: `ProgramParticipantAdded:${inserted.id}`,
      })

      return Response.json({ data: inserted, error: null }, { status: 201 })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'programs.participants', 'kadarn.api.method': 'POST' } },
)
