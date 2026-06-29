import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { uuidParamSchema } from '@/lib/validation'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const milestoneTypeEnum = [
  'program_definition',
  'site_selection',
  'irb_submission',
  'irb_approval',
  'mta_execution',
  'collection_start',
  'collection_complete',
  'processing_start',
  'processing_complete',
  'qc_review',
  'data_delivery',
  'program_close',
] as const

const createMilestoneSchema = z.object({
  milestone_type: z.enum(milestoneTypeEnum, {
    errorMap: () => ({ message: `milestone_type must be one of: ${milestoneTypeEnum.join(', ')}` }),
  }),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  planned_start_date: z.string().optional(),
  planned_end_date: z.string().optional(),
  assigned_org_id: z.string().uuid('assigned_org_id must be a valid UUID').optional(),
})

// ---------------------------------------------------------------------------
// GET — list milestones for a program
// ---------------------------------------------------------------------------
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id: programId } = uuidParamSchema.parse(params)
    const supabase = await createRouteClient()

    const { data, error } = await supabase
      .from('program_milestones')
      .select(`
        id, program_id, milestone_type, title, description,
        planned_start_date, planned_end_date,
        actual_start_date, actual_end_date,
        status, assigned_org_id, assigned_to,
        created_by, created_at, updated_at
      `)
      .eq('program_id', programId)
      .order('planned_end_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      return Response.json(
        { error: { code: 500, message: error.message } },
        { status: 500 },
      )
    }

    return Response.json({
      data: data ?? [],
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})

// ---------------------------------------------------------------------------
// POST — create a milestone
// ---------------------------------------------------------------------------
export const POST = withAuth(async (request, user, params) => {
  try {
    const { id: programId } = uuidParamSchema.parse(params)
    const supabase = await createRouteClient()

    // Parse request body
    const body = (await request.json()) as Record<string, unknown>
    const parsed = createMilestoneSchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)
    }

    const {
      milestone_type,
      title,
      description,
      planned_start_date,
      planned_end_date,
      assigned_org_id,
    } = parsed.data

    // Verify the program exists
    const { data: program, error: progErr } = await supabase
      .from('programs')
      .select('id, sponsor_org_id, lead_org_id')
      .eq('id', programId)
      .single()

    if (progErr || !program) {
      throw new ApiError(404, 'Program not found')
    }

    // Check authorization: caller must be org_admin of sponsor/lead, or KOC internal
    const activeOrgId = user.user_metadata?.active_org_id as string | null
    const isKocInternal = user.user_metadata?.kadarn_role === 'kadarn_internal'
    const authorizedOrgs = [
      program.sponsor_org_id,
      program.lead_org_id,
    ].filter(Boolean) as string[]

    if (!isKocInternal && (!activeOrgId || !authorizedOrgs.includes(activeOrgId))) {
      throw new ApiError(403, 'Access denied — must be an admin of the sponsor or lead organization')
    }

    // Insert the milestone
    const { data: inserted, error: insertErr } = await supabase
      .from('program_milestones')
      .insert({
        program_id: programId,
        milestone_type,
        title,
        description: description ?? null,
        planned_start_date: planned_start_date ?? null,
        planned_end_date: planned_end_date ?? null,
        assigned_org_id: assigned_org_id ?? null,
        status: 'pending',
        created_by: user.id,
      })
      .select(`
        id, program_id, milestone_type, title, description,
        planned_start_date, planned_end_date,
        actual_start_date, actual_end_date,
        status, assigned_org_id, assigned_to,
        created_by, created_at, updated_at
      `)
      .single()

    if (insertErr) {
      throw new ApiError(500, 'Failed to create milestone', insertErr.message)
    }

    return Response.json({ data: inserted, error: null }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
})
