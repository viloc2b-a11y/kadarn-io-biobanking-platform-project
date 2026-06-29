import { createRouteClient, handleApiError } from '@/lib/supabase-server'

function verificationLabel(status: string): string {
  if (status === 'kadarn_verified') return 'Kadarn verified'
  if (status === 'reference_confirmed') return 'Reference confirmed'
  if (status === 'evidence_submitted') return 'Evidence submitted'
  return 'Self-reported'
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const supabase = await createRouteClient()

    const { data: profile, error: profileError } = await supabase
      .from('site_continuity_profiles')
      .select('id, organization_id, headline, summary, public_slug, passport_visibility')
      .eq('public_slug', slug)
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
      .order('created_at', { ascending: false })

    if (claimsError) throw claimsError

    return Response.json({
      data: {
        profile,
        claims: (claims ?? []).map((claim) => ({
          ...claim,
          verification_label: verificationLabel(claim.verification_status),
          sponsor_display: claim.sponsor_name_policy === 'public'
            ? null
            : claim.masked_sponsor_label ?? 'Masked sponsor',
        })),
      },
      error: null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
