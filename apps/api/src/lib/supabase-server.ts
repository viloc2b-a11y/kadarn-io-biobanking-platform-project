import {
  ApiError as LegacyApiError,
  handleInstrumentedError,
  resolveRequestContext,
  runWithContextAsync,
} from '@kadarn/instrumentation'
import { KadarnError } from '@kadarn/types/errors'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'

export function createServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export async function createRouteClient() {
  const headerStore = await headers()
  const bearer = headerStore.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (bearer) {
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        },
      },
    },
  )
}

export async function getAuthUser() {
  const supabase = await createRouteClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new ApiError(401, 'Unauthorized')
  }

  return data.user
}

/** @deprecated Use KadarnError from @kadarn/types/errors for new code */
export class ApiError extends LegacyApiError {}

export function handleApiError(error: unknown) {
  return handleInstrumentedError(error)
}

export function withAuth(
  handler: (
    request: Request,
    user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>,
    params?: Record<string, string>,
  ) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<Record<string, string>> }) => {
    const url = new URL(request.url)
    const ctx = {
      ...resolveRequestContext(request),
      route: url.pathname,
      method: request.method,
    }

    return runWithContextAsync(ctx, async () => {
      try {
        const user = await getAuthUser()
        ctx.userId = user.id
        const resolvedParams = await context.params
        const response = await handler(request, user, resolvedParams)
        const headers = new Headers(response.headers)
        headers.set('x-request-id', ctx.requestId)
        headers.set('x-correlation-id', ctx.correlationId)
        if (ctx.traceId) headers.set('x-trace-id', ctx.traceId)
        return new Response(response.body, { status: response.status, headers })
      } catch (error) {
        if (error instanceof KadarnError) return handleInstrumentedError(error)
        return handleInstrumentedError(error)
      }
    })
  }
}

export function withErrorHandling(
  handler: (request: Request) => Promise<Response>,
) {
  return async (request: Request) => {
    const url = new URL(request.url)
    const ctx = {
      ...resolveRequestContext(request),
      route: url.pathname,
      method: request.method,
    }

    return runWithContextAsync(ctx, async () => {
      try {
        const response = await handler(request)
        const headers = new Headers(response.headers)
        headers.set('x-request-id', ctx.requestId)
        headers.set('x-correlation-id', ctx.correlationId)
        if (ctx.traceId) headers.set('x-trace-id', ctx.traceId)
        return new Response(response.body, { status: response.status, headers })
      } catch (error) {
        return handleInstrumentedError(error)
      }
    })
  }
}
