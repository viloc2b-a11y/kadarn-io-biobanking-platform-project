// ==========================================================================
// Kadarn API Client — centralized fetch wrapper for the backend API
// ==========================================================================
//
// All API calls go through this module. Benefits:
//   - Single base URL (no more `const API = process.env.NEXT_PUBLIC_API_URL...`)
//   - Automatic cookie-based auth (same-origin after Next.js rewrites)
//   - Consistent error handling (throws ApiClientError on non-2xx)
//   - Typed responses with generic <T>
// ==========================================================================

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export interface ApiResponse<T> {
  data: T
  error: null | { code: string; message: string; details: unknown }
}

// --------------------------------------------------------------------------
// Base path — uses relative URL so Next.js rewrites proxy to the API backend
// --------------------------------------------------------------------------
const BASE = ''  // same-origin: rewrites in next.config.ts handle /api/*

// --------------------------------------------------------------------------
// Request helpers
// --------------------------------------------------------------------------

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { signal?: AbortSignal },
): Promise<T> {
  const url = `${BASE}${path}`

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',  // sends Supabase auth cookie (same-origin after rewrite)
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  })

  if (!res.ok) {
    let parsed: unknown
    try {
      parsed = await res.json()
    } catch {
      parsed = null
    }
    throw new ApiClientError(
      `API ${method} ${path} returned ${res.status}`,
      res.status,
      parsed,
    )
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as unknown as T

  const json: ApiResponse<T> = await res.json()
  if (json.error) {
    throw new ApiClientError(
      json.error.message ?? `API ${method} ${path} error`,
      res.status,
      json.error,
    )
  }
  return json.data
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

export function apiGet<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
  return request<T>('GET', path, undefined, options)
}

export function apiPost<T>(path: string, body?: unknown, options?: { signal?: AbortSignal }): Promise<T> {
  return request<T>('POST', path, body, options)
}

export function apiPatch<T>(path: string, body?: unknown, options?: { signal?: AbortSignal }): Promise<T> {
  return request<T>('PATCH', path, body, options)
}

export function apiDelete<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
  return request<T>('DELETE', path, undefined, options)
}
