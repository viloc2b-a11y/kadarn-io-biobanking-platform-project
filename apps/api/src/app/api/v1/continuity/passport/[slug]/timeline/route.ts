import { createRouteClient, handleApiError } from '@/lib/supabase-server'
import { buildGrowthTimeline } from '@/lib/continuity-claim-service'

/**
 * GET /api/v1/continuity/passport/:slug/timeline
 *
 * Returns the institutional growth timeline for a site.
 * Milestones: founding, first study, first Phase III, certifications,
 * biospecimen programs, verification events, future projections.
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
}
