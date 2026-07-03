import { withAuth, handleApiError, createRouteClient } from '@/lib/auth-guards'
import { rateLimit, PUBLIC_RATE_LIMIT } from '@/lib/rate-limit'
import { getPublishedViewService } from '@/lib/published-view-service'

export const GET = rateLimit(PUBLIC_RATE_LIMIT, withAuth(async (request) => {
  // RC-0.3 + Phase 8 28D: Passport reads via Published View Compatibility Layer.
  try {
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const slugFromPath = pathSegments[pathSegments.indexOf('passport') + 1]

    const supabase = await createRouteClient()

    const { data: profile, error: profileError } = await supabase
      .from('site_continuity_profiles')
      .select('id, organization_id, headline, summary, public_slug, passport_visibility')
      .eq('public_slug', slugFromPath)
      .in('passport_visibility', ['public', 'shared_link'])
      .single()

    if (profileError) throw profileError

    const { data: claims, error: claimsError } = await supabase
      .from('continuity_experience_claims')
      .select('id, claim_type, category, title, description, therapeutic_area, study_phase, biospecimen_type, quantity, verification_status, confidence_score, sponsor_name_policy, masked_sponsor_label')
      .eq('site_continuity_profile_id', profile.id)
      .eq('is_public', true)
      .neq('verification_status', 'rejected')
      .order('confidence_score', { ascending: false })

    if (claimsError) throw claimsError

    const viewService = getPublishedViewService()
    const response = viewService.getPassportResponse({
      profile: {
        id: profile.id,
        organization_id: profile.organization_id,
        headline: profile.headline,
        summary: profile.summary,
        public_slug: profile.public_slug,
      },
      claims: claims ?? [],
    })

    return Response.json({ data: response, error: null })
  } catch (error) {
    return handleApiError(error)
  }
}))
