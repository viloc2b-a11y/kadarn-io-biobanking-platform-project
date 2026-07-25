// ==========================================================================
// KAD-002E — Person API (refactored with PersonRepository)
// ==========================================================================
// Authority: Foundation Library 016_CANONICAL_ENTITY_SPECIFICATIONS
// POST /api/v1/people — Create a new Person
// GET  /api/v1/people  — List People, or query by id/email
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { CreatePersonSchema } from '@kadarn/types';
import { PersonRepository } from '@kadarn/platform-services';

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const supabase = await createRouteClient();
    const repository = new PersonRepository(supabase);

    const parsed = CreatePersonSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await repository.create(parsed.data as any);
    if (error) {
      if (error.code === 'CONFLICT') {
        return Response.json({ data: null, error: error.message }, { status: 409 });
      }
      return Response.json({ data: null, error: error.message }, { status: 500 });
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const repository = new PersonRepository(supabase);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const email = url.searchParams.get('email');

    if (id) {
      const { data, error } = await repository.findById(id);
      if (!data && !error) {
        return Response.json({ data: null, error: 'Person not found' }, { status: 404 });
      }
      if (error) return Response.json({ data: null, error: error.message }, { status: 500 });
      return Response.json({ data, error: null });
    }

    if (email) {
      const { data, error } = await repository.findByEmail(email);
      if (error) return Response.json({ data: null, error: error.message }, { status: 500 });
      return Response.json({ data: data ?? null, error: null });
    }

    const { data, error } = await repository.findAll();
    if (error) return Response.json({ data: null, error: error.message }, { status: 500 });

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
