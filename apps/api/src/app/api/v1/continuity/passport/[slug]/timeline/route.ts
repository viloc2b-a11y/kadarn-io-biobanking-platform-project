import { withAuth, handleApiError, createRouteClient } from '@/lib/auth-guards'
import { buildGrowthTimeline } from '@/lib/continuity-claim-service'

/**
 * GET /api/v1/continuity/passport/:slug/timeline
 *
 * RC-0.3: Requires authentication. Returns institutional growth timeline.
 */
export const GET = withAuth(async (_request, user) => {
  try {
    const url = new URL(_request.url)
    const pathSegments = url.pathname.split('/')
    const slug = pathSegments[pathSegments.indexOf('passport') + 1]

    const supabase = await createRouteClient()

    const { data: profile, error: profileError } = await supabase
      .from('site_continuity_profiles')
      .select('id, headline, public_slug')
      .eq('public_slug', slug)
      .single()

    if (profileError) throw profileError

    const result = await buildGrowthTimeline(supabase as any, profile.id)

    return Response.json({
      data: {
        siteName: profile.headline ?? 'Site',
        slug: profile.public_slug,
        milestones: result.milestones,
      },
      error: null,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
