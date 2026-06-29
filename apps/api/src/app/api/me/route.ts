import { withAuth, createRouteClient } from '@/lib/supabase-server';

export const GET = withAuth(async (_request, user) => {
  const supabase = await createRouteClient();

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 = no rows returned (RLS or missing profile)
    console.error('Profile fetch error:', profileError);
  }

  // Get active memberships
  const { data: memberships } = await supabase
    .from('organization_memberships')
    .select('*, organizations(id, name, country)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      profile: profile ?? null,
      memberships: memberships ?? [],
    },
  });
});
