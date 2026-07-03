// ==========================================================================
// Kadarn API — Standardized Response Envelopes
// ==========================================================================
// RC-0.4 — All API routes must return consistent JSON shapes.
//
// Success: { ok: true, data, request_id, generated_at }
// Error:   { ok: false, error: { code, message, details }, request_id, generated_at }
// ==========================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiSuccessEnvelope<T = unknown> {
  ok: true
  data: T
  request_id: string
  generated_at: string
}

export interface ApiErrorDetail {
  code: number | string
  message: string
  details?: unknown
}

export interface ApiErrorEnvelope {
  ok: false
  error: ApiErrorDetail
  request_id: string
  generated_at: string
}

export type ApiEnvelope<T = unknown> = ApiSuccessEnvelope<T> | ApiErrorEnvelope

// ---------------------------------------------------------------------------
// Request ID
// ---------------------------------------------------------------------------

import { randomUUID } from 'node:crypto'

/** Generate or extract a request ID from headers. */
export function resolveRequestId(request?: Request): string {
  if (request) {
    const incoming = request.headers.get('x-request-id')
    if (incoming) return incoming.slice(0, 128) // truncate safety
  }
  return randomUUID()
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

/**
 * Build a standardized success response.
 */
export function apiSuccess<T>(data: T, requestId: string, status = 200): Response {
  const body: ApiSuccessEnvelope<T> = {
    ok: true,
    data,
    request_id: requestId,
    generated_at: new Date().toISOString(),
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'x-request-id': requestId },
  })
}

/**
 * Build a standardized error response.
 */
export function apiError(
  code: number | string,
  message: string,
  requestId: string,
  details?: unknown,
  status = 500,
): Response {
  const body: ApiErrorEnvelope = {
    ok: false,
    error: { code, message, details: details ?? null },
    request_id: requestId,
    generated_at: new Date().toISOString(),
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'x-request-id': requestId },
  })
}

// ---------------------------------------------------------------------------
// Wrapper — converts existing handler output to standardized envelopes
// ---------------------------------------------------------------------------

export function withEnvelope(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const requestId = resolveRequestId(request)
    try {
      const response = await handler(request)

      // If handler already returns a standard envelope, preserve it but add request_id
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const body = await response.json()
        // If body already has ok field, assume it's an envelope — just inject request_id
        if (body && typeof body === 'object' && 'ok' in body) {
          const envelope = body as Record<string, unknown>
          envelope.request_id = (envelope.request_id as string) ?? requestId
          envelope.generated_at = (envelope.generated_at as string) ?? new Date().toISOString()
          return new Response(JSON.stringify(envelope), {
            status: response.status,
            headers: { ...Object.fromEntries(response.headers), 'x-request-id': requestId },
          })
        }
      }

      // Non-envelope response: wrap in success envelope
      if (response.ok) {
        // Try to parse body as JSON and wrap
        try {
          const body = await response.clone().json()
          return apiSuccess(body, requestId, response.status)
        } catch {
          return response // non-JSON response, return as-is
        }
      }

      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error'
      return apiError(500, message, requestId, null, 500)
    }
  }
}
