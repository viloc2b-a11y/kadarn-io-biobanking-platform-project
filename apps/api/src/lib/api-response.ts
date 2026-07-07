// ==========================================================================
// API Response Helper — Sprint 25E
// @deprecated Use @kadarn/instrumentation envelope helpers (AF-4.0 Sprint 1)
// ==========================================================================
// Consistent JSON response envelope for all API endpoints.
// ==========================================================================

export interface ApiSuccessResponse<T> {
  data: T
  error: null
  meta?: {
    timestamp: string
    endpoint: string
  }
}

export interface ApiErrorResponse {
  data: null
  error: {
    code: string
    message: string
    details?: string
  }
  meta?: {
    timestamp: string
    endpoint: string
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export function successResponse<T>(data: T, endpoint?: string): ApiSuccessResponse<T> {
  return {
    data,
    error: null,
    meta: endpoint ? { timestamp: new Date().toISOString(), endpoint } : undefined,
  }
}

export function errorResponse(code: string, message: string, details?: string, endpoint?: string): ApiErrorResponse {
  return {
    data: null,
    error: { code, message, details },
    meta: endpoint ? { timestamp: new Date().toISOString(), endpoint } : undefined,
  }
}

export function notFound(message = 'Resource not found'): Response {
  return Response.json(errorResponse('NOT_FOUND', message), { status: 404 })
}

export function badRequest(message: string, details?: string): Response {
  return Response.json(errorResponse('BAD_REQUEST', message, details), { status: 400 })
}

export function rateLimited(retryAfter: number): Response {
  return Response.json(
    errorResponse('RATE_LIMITED', 'Too many requests. Please retry later.'),
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

export function serverError(message = 'Internal server error'): Response {
  return Response.json(errorResponse('INTERNAL_ERROR', message), { status: 500 })
}
