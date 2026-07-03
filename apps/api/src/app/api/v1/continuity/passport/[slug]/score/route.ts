import { withAuth, handleApiError, createRouteClient } from '@/lib/auth-guards'
import { computeSiteScore } from '@/lib/continuity-claim-service'

/**
 * GET /api/v1/continuity/passport/:slug/score
 *
 * RC-0.3: Requires authentication. Returns the executive site passport scorecard.
 */
export const GET = withAuth(async (_request, user) => {
  try {
    const url = new URL(_request.url)
    const pathSegments = url.pathname.split('/')
    const slug = pathSegments[pathSegments.indexOf('passport') + 1]

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
        },
        score,
      },
      error: null,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
