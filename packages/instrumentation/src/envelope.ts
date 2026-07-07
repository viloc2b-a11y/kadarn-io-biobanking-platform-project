import type { KadarnErrorCode } from '@kadarn/types/errors'
import { randomUUID } from 'node:crypto'
import { getRequestContext } from './context.js'

export interface ApiSuccessEnvelope<T = unknown> {
  ok: true
  data: T
  request_id: string
  correlation_id: string
  generated_at: string
}

export interface ApiErrorDetail {
  code: KadarnErrorCode | string
  message: string
  details?: unknown
}

export interface ApiErrorEnvelope {
  ok: false
  error: ApiErrorDetail
  request_id: string
  correlation_id: string
  generated_at: string
}

export type ApiEnvelope<T = unknown> = ApiSuccessEnvelope<T> | ApiErrorEnvelope

function ids() {
  const ctx = getRequestContext()
  return {
    request_id: ctx?.requestId ?? randomUUID(),
    correlation_id: ctx?.correlationId ?? ctx?.requestId ?? randomUUID(),
  }
}

export function apiSuccessEnvelope<T>(data: T): ApiSuccessEnvelope<T> {
  return {
    ok: true,
    data,
    ...ids(),
    generated_at: new Date().toISOString(),
  }
}

export function apiErrorEnvelope(
  code: KadarnErrorCode | string,
  message: string,
  details?: unknown,
): ApiErrorEnvelope {
  return {
    ok: false,
    error: { code, message, details: details ?? null },
    ...ids(),
    generated_at: new Date().toISOString(),
  }
}

export function jsonResponse(body: ApiEnvelope, status: number, extraHeaders?: Record<string, string>): Response {
  const ctx = getRequestContext()
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(ctx ? { 'x-request-id': ctx.requestId, 'x-correlation-id': ctx.correlationId } : {}),
    ...extraHeaders,
  }
  return new Response(JSON.stringify(body), { status, headers })
}

export function apiSuccessResponse<T>(data: T, status = 200): Response {
  return jsonResponse(apiSuccessEnvelope(data), status)
}

export function apiErrorResponse(
  code: KadarnErrorCode | string,
  message: string,
  httpStatus: number,
  details?: unknown,
): Response {
  return jsonResponse(apiErrorEnvelope(code, message, details), httpStatus)
}
