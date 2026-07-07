import type { RequestContext } from './context.js'
import {
  getRequestContext,
  resolveRequestContext,
  runWithContextAsync,
} from './context.js'
import { emitPlatformEvent } from './events.js'
import { KadarnError, fromLegacyApiError } from './errors.js'
import { apiErrorResponse } from './envelope.js'
import { logStructured } from './logger.js'
import { getMetricsRegistry } from './metrics.js'
import type { KadarnErrorCode } from '@kadarn/types/errors'
import { httpStatusToErrorCode } from '@kadarn/types/errors'

export {
  resolveRequestContext,
  runWithContextAsync,
  getRequestContext,
  getCorrelationId,
  getRequestId,
  contextHeaders,
} from './context.js'

export { apiSuccessResponse, apiErrorResponse, apiSuccessEnvelope, apiErrorEnvelope } from './envelope.js'
export { getLogger, logStructured, setLogger } from './logger.js'
export { getMetricsRegistry, MetricsRegistry } from './metrics.js'
export { emitPlatformEvent, onPlatformEvent } from './events.js'
export { getHealthAggregator, createLivenessReport, type HealthReport } from './health.js'
export { initInstrumentation, isInstrumentationInitialized } from './init.js'
export { KadarnError, fromLegacyApiError } from './errors.js'

/** Legacy ApiError shim for apps/api migration */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleInstrumentedError(error: unknown): Response {
  const ctx = getRequestContext()

  if (error instanceof KadarnError) {
    logStructured('warn', error.message, { errorCode: error.code }, error)
    getMetricsRegistry().counter('kadarn_http_errors_total', 1, {
      code: error.code,
      route: ctx?.route ?? 'unknown',
    })
    emitPlatformEvent({
      type: 'ErrorRecorded',
      timestamp: new Date().toISOString(),
      correlationId: ctx?.correlationId ?? 'unknown',
      requestId: ctx?.requestId ?? 'unknown',
      source: ctx?.service ?? 'kadarn-api',
      errorCode: error.code,
      message: error.message,
    })
    return apiErrorResponse(error.code, error.message, error.httpStatus, error.details)
  }

  if (error instanceof ApiError) {
    const code = httpStatusToErrorCode(error.statusCode)
    return handleInstrumentedError(new KadarnError(code, error.message, error.details))
  }

  logStructured('error', 'Unhandled API error', {}, error instanceof Error ? error : undefined)
  return apiErrorResponse('API_INTERNAL_ERROR', 'Internal server error', 500)
}

/**
 * Wrap a route handler with request context, metrics, and unified error envelope.
 */
export function withInstrumentation(
  route: string,
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const ctx: RequestContext = {
      ...resolveRequestContext(request),
      route,
      method: request.method,
    }
    const start = Date.now()

    return runWithContextAsync(ctx, async () => {
      emitPlatformEvent({
        type: 'RequestReceived',
        timestamp: new Date().toISOString(),
        correlationId: ctx.correlationId,
        requestId: ctx.requestId,
        traceId: ctx.traceId,
        source: ctx.service,
        method: request.method,
        route,
      })

      try {
        const response = await handler(request)
        const durationMs = Date.now() - start
        getMetricsRegistry().recordHttpRequest(request.method, route, response.status, durationMs)
        emitPlatformEvent({
          type: 'RequestCompleted',
          timestamp: new Date().toISOString(),
          correlationId: ctx.correlationId,
          requestId: ctx.requestId,
          traceId: ctx.traceId,
          source: ctx.service,
          method: request.method,
          route,
          status: response.status,
          durationMs,
        })

        const headers = new Headers(response.headers)
        headers.set('x-request-id', ctx.requestId)
        headers.set('x-correlation-id', ctx.correlationId)
        if (ctx.traceId) headers.set('x-trace-id', ctx.traceId)

        return new Response(response.body, { status: response.status, headers })
      } catch (error) {
        const durationMs = Date.now() - start
        const errResponse = handleInstrumentedError(error)
        getMetricsRegistry().recordHttpRequest(request.method, route, errResponse.status, durationMs)
        return errResponse
      }
    })
  }
}

export function mapAuthError(statusCode: number, message: string, details?: unknown): KadarnError {
  return fromLegacyApiError(statusCode, message, details)
}

export type { KadarnErrorCode }
