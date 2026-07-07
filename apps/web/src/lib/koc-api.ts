'use client'

import { getSupabaseClient } from '@/lib/supabase/client'
import { apiGet, apiPatch, apiPost } from '@/lib/api-client'

export const KOC_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/** Authenticated fetch against the API app (Bearer token). */
export async function kocFetch(path: string, init?: RequestInit): Promise<Response> {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const url = path.startsWith('http') ? path : `${KOC_API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  return fetch(url, { ...init, headers })
}

export async function kocGet<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path)
  } catch {
    return null
  }
}

export async function kocPost<T>(path: string, payload: unknown): Promise<T | null> {
  try {
    return await apiPost<T>(path, payload)
  } catch {
    return null
  }
}

export async function kocPatch<T>(path: string, payload: unknown): Promise<T | null> {
  try {
    return await apiPatch<T>(path, payload)
  } catch {
    return null
  }
}
