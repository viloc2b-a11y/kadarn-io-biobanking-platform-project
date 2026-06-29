import { createRouteClient, handleApiError } from '@/lib/supabase-server'
import { computeSiteScore } from '@/lib/continuity-claim-service'

/**
 * GET /api/v1/continuity/passport/:slug/score
 *
 * Returns the executive site passport scorecard.
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
      .select('id, organization_id, headline, summary, public_slug')
      .eq('public_slug', slug)
      .single()

    if (profileError) throw profileError

    const score = await computeSiteScore(supabase as any, profile.id)

    return Response.json({
      data: {
        profile: {
          headline: profile.headline,
          summary: profile.summary,
          slug: profile.public_slug,
        },
        score,
      },
      error: null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
