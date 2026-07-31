// ==========================================================================
// KAD-094 — Questionnaire Templates API
// GET /api/v1/questionnaire-templates — List progressive interview modules
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'

export const GET = withAuth(async (request, _user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const level = url.searchParams.get('level')

    let query = supabase.from('questionnaire_templates').select('*')
      .order('sort_order', { ascending: true })
    if (level) query = query.eq('level', parseInt(level, 10))

    const { data, error } = await query
    if (error) throw new ApiError(500, 'Failed to fetch templates')
    return Response.json({ data, count: data.length, error: null })
  } catch (error) { return handleApiError(error) }
})
