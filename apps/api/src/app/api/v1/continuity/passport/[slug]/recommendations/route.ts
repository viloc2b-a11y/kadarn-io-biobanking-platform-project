import { createRouteClient, handleApiError } from '@/lib/supabase-server'
import { generateRecommendations } from '@/lib/continuity-claim-service'

/**
 * GET /api/v1/continuity/passport/:slug/recommendations
 *
 * Returns AI-powered profile completion recommendations.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params
    const supabase = await createRouteClient()

    const { data: profile, error: profileError } = await supabase
      .from('site_continuity_profiles')
      .select('id')
      .eq('public_slug', slug)
      .single()

    if (profileError) throw profileError

    const result = await generateRecommendations(supabase as any, profile.id)

    return Response.json({ data: result, error: null })
  } catch (error) {
    return handleApiError(error)
  }
}
