import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

export interface RequestContext {
  requestId: string
  correlationId: string
  traceId?: string
  service: string
  route?: string
  method?: string
  userId?: string
}

const storage = new AsyncLocalStorage<RequestContext>()

const MAX_ID_LEN = 128

function sanitizeId(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim().slice(0, MAX_ID_LEN)
  return trimmed.length > 0 ? trimmed : undefined
}

/** Parse W3C traceparent header → trace-id segment */
export function parseTraceId(traceparent: string | null | undefined): string | undefined {
  if (!traceparent) return undefined
  const parts = traceparent.split('-')
  if (parts.length >= 2 && parts[1]) return parts[1].slice(0, 32)
  return undefined
}

export function resolveRequestContext(
  request: Request,
  service = 'kadarn-api',
): RequestContext {
  const requestId = sanitizeId(request.headers.get('x-request-id')) ?? randomUUID()
  const correlationId = sanitizeId(request.headers.get('x-correlation-id')) ?? requestId
  const traceId = parseTraceId(request.headers.get('traceparent'))
    ?? sanitizeId(request.headers.get('x-trace-id'))

  return { requestId, correlationId, traceId, service }
}

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn)
}

export async function runWithContextAsync<T>(ctx: RequestContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn)
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore()
}

export function getCorrelationId(): string {
  return storage.getStore()?.correlationId ?? randomUUID()
}

export function getRequestId(): string {
  return storage.getStore()?.requestId ?? randomUUID()
}

export function contextHeaders(ctx: RequestContext): Record<string, string> {
  const headers: Record<string, string> = {
    'x-request-id': ctx.requestId,
    'x-correlation-id': ctx.correlationId,
  }
  if (ctx.traceId) headers['x-trace-id'] = ctx.traceId
  return headers
}
