import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

/**
 * Service-role client for server-side public reads (no user session).
 * Use only on routes that intentionally bypass RLS for published data.
 */
export function createServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Creates a Supabase client for API route handlers.
 * Uses Bearer token from Authorization header when present, otherwise cookies.
 * RLS is enforced — no service_role bypass for user requests.
 */
export async function createRouteClient() {
  const headerStore = await headers();
  const bearer = headerStore.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) {
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

/**
 * Gets the authenticated user from the request.
 * Throws 401 if not authenticated.
 */
export async function getAuthUser() {
  const supabase = await createRouteClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  return data.user;
}

// ---------------------------------------------------------------------------
// Normalized API errors
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          code: error.statusCode,
          message: error.message,
          details: error.details ?? null,
        },
      },
      { status: error.statusCode },
    );
  }

  console.error('Unhandled API error:', error);
  return Response.json(
    {
      error: {
        code: 500,
        message: 'Internal server error',
        details: null,
      },
    },
    { status: 500 },
  );
}

/**
 * Wraps an API route handler with auth + error handling.
 */
export function withAuth(
  handler: (
    request: Request,
    user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>,
    params?: Record<string, string>,
  ) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<Record<string, string>> }) => {
    try {
      const user = await getAuthUser();
      const resolvedParams = await context.params;
      return await handler(request, user, resolvedParams);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Wraps a public API route handler with error handling (no auth required).
 */
export function withErrorHandling(
  handler: (request: Request) => Promise<Response>,
) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
