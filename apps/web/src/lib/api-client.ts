// ==========================================================================
// Web — Minimal API client
// ==========================================================================
// Thin fetch wrapper matching the convention already used across workspace
// pages (see workspace/collections/page.tsx, workspace/requests/page.tsx):
// call the API app directly via NEXT_PUBLIC_API_URL, attaching the current
// Supabase session's access token as a Bearer header.
// ==========================================================================

'use client'

import { getSupabaseClient } from '@/lib/supabase/client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.error?.message ?? body?.error ?? `Request failed with status ${response.status}`
    throw new ApiClientError(response.status, typeof message === 'string' ? message : JSON.stringify(message), body)
  }
  return (body?.data ?? body) as T
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await authHeaders()
  const response = await fetch(`${API_BASE}${path}`, { headers })
  return parseResponse<T>(response)
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const headers = await authHeaders()
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse<T>(response)
}

export async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  const headers = await authHeaders()
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse<T>(response)
}
