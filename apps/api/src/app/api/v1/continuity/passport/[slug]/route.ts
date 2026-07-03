import { withAuth, handleApiError, createRouteClient } from '@/lib/auth-guards'

function verificationLabel(status: string): string {
  if (status === 'kadarn_verified') return 'Verified'
  if (status === 'reference_confirmed') return 'Reference confirmed'
  if (status === 'evidence_submitted') return 'Evidence submitted'
  return 'Self-reported'
}

export const GET = withAuth(async (_request, user) => {
  // RC-0.3: Passport routes now require authentication.
  // Public passport data is still accessible to any authenticated user,
  // but requires auth to verify the requester's identity for consent tracking.
  try {
    const { slug } = await _request.url
      ? { slug: new URL(_request.url).pathname.split('/').pop()! }
      : { slug: '' }

    const supabase = await createRouteClient()

    // Use the request URL to extract slug from path params
    const url = new URL(_request.url)
    const pathSegments = url.pathname.split('/')
    const slugFromPath = pathSegments[pathSegments.indexOf('passport') + 1]

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

    return Response.json({
      data: {
        profile: {
          headline: profile.headline,
          summary: profile.summary,
          slug: profile.public_slug,
        },
        claims: (claims ?? []).map(c => ({
          id: c.id,
          type: c.claim_type,
          category: c.category,
          title: c.title,
          description: c.description,
          verification: verificationLabel(c.verification_status),
          confidence: c.confidence_score,
        })),
      },
      error: null,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
