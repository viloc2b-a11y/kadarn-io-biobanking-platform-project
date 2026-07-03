import { withAuth, handleApiError, createRouteClient } from '@/lib/auth-guards'
import { generateRecommendations } from '@/lib/continuity-claim-service'
import { rateLimit, COMPUTE_RATE_LIMIT } from '@/lib/rate-limit'

/**
 * GET /api/v1/continuity/passport/:slug/recommendations
 *
 * RC-0.3: Requires authentication.
 */
export const GET = rateLimit(COMPUTE_RATE_LIMIT, withAuth(async (_request, user) => {
  try {
    const url = new URL(_request.url)
    const pathSegments = url.pathname.split('/')
    const slug = pathSegments[pathSegments.indexOf('passport') + 1]

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
}))
