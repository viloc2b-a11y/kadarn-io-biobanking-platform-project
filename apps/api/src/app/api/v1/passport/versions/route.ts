// ==========================================================================
// KEMS — Passport Versions API
// ==========================================================================
// GET /api/v1/passport/versions?profileId=<uuid> — List version history
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const versionsQuerySchema = z.object({
  profileId: z.string().uuid(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;

// ─── GET — list version history for a profile ────────────────────────────
export const GET = withAuth(async (request, _user, _params) => {
  try {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = versionsQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { profileId } = parsed.data;
    const db = createServiceClient() as unknown as DbClient;

    // Fetch the profile to verify it exists
    const { data: profile, error: profileErr } = await db
      .from('site_profiles')
      .select('id, name, profile_type, state, current_version')
      .eq('id', profileId)
      .single();

    if (profileErr || !profile) {
      throw new ApiError(404, 'Profile not found');
    }

    // Fetch all version snapshots, newest first
    const { data: versions, error: versionsErr } = await db
      .from('site_profile_versions')
      .select('*')
      .eq('profile_id', profileId)
      .order('version', { ascending: false });

    if (versionsErr) {
      throw new ApiError(500, 'Failed to fetch versions', versionsErr.message);
    }

    // Fetch publication events
    const { data: publications, error: pubErr } = await db
      .from('profile_publications')
      .select('id, profile_version_id, visibility, published_at, published_by, public_uri, registry_id')
      .eq('profile_id', profileId)
      .order('published_at', { ascending: false });

    if (pubErr) {
      // Publications are optional — don't fail the request
    }

    // Enrich versions with publication info
    const enrichedVersions = (versions ?? []).map((version: any) => {
      const pub = (publications ?? []).find((p: any) => p.profile_version_id === version.id);
      return {
        ...version,
        publication: pub ?? null,
      };
    });

    return Response.json({
      data: {
        profileId,
        profileName: (profile as any).name,
        profileType: (profile as any).profile_type ?? null,
        currentVersion: (profile as any).current_version,
        state: (profile as any).state,
        versions: enrichedVersions,
        totalVersions: enrichedVersions.length,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
