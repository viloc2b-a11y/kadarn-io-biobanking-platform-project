import type { KadarnErrorCode } from '@kadarn/types/errors'

export interface SdkConfig {
  baseUrl: string
  getAccessToken?: () => Promise<string | null>
}

export class KadarnSdkError extends Error {
  constructor(
    public code: KadarnErrorCode | string,
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'KadarnSdkError'
  }
}

export class KadarnClient {
  constructor(private config: SdkConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    }
    const token = await this.config.getAccessToken?.()
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${this.config.baseUrl}${path}`, { ...init, headers })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      const code = body?.error?.code ?? 'API_INTERNAL_ERROR'
      const message = body?.error?.message ?? res.statusText
      throw new KadarnSdkError(code, message, res.status)
    }
    return (body?.data ?? body) as T
  }

  health() {
    return this.request<{ status: string }>('/api/health')
  }

  institutionPublic(orgId: string) {
    return this.request<Record<string, unknown>>(`/api/v1/institution/public/${encodeURIComponent(orgId)}`)
  }

  discoveryDashboard(sessionId: string) {
    return this.request<Record<string, unknown>>(`/api/v1/discovery/dashboard?sessionId=${encodeURIComponent(sessionId)}`)
  }

  discoveryReport(sessionId: string) {
    return this.request<Record<string, unknown>>(`/api/v1/discovery/report?sessionId=${encodeURIComponent(sessionId)}`)
  }

  passport(slug: string) {
    return this.request<Record<string, unknown>>(`/api/v1/continuity/passport/${encodeURIComponent(slug)}`)
  }
}

export { KADARN_ERROR_HTTP_STATUS } from '@kadarn/types/errors'
export type { KadarnErrorCode } from '@kadarn/types/errors'
