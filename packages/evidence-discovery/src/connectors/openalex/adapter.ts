// ==========================================================================
// Connector Layer — Openalex Adapter (Sprint 23A)
// ==========================================================================

import { BaseConnectorAdapter } from '../base/adapter.js'
import type { ConnectorMetadata, ConnectorResponse, ProviderId } from '../types/types.js'

export class OpenalexAdapter extends BaseConnectorAdapter {
  readonly metadata: ConnectorMetadata = {
    provider: 'openalex',
    version: '1.0.0',
    base_url: 'https://api.openalex.org',
    rate_limit_rpm: 100,
    retry_max: 3,
    timeout_ms: 10000,
  }

  async connect(): Promise<boolean> {
    // In production: HEAD/GET health endpoint
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.metadata.timeout_ms)
      const response = await fetch(`${this.metadata.base_url}`, {
        method: 'HEAD',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      return response.ok
    } catch {
      return false
    }
  }

  async fetch(externalId: string, options?: Record<string, string>): Promise<ConnectorResponse> {
    const start = Date.now()
    const warnings: string[] = []
    const errors: string[] = []

    try {
      const result = await this.withRetry(async () => {
        const url = this.buildUrl(externalId, options)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.metadata.timeout_ms)
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeout)
        if (!response.ok) throw new Error(`Openalex returned ${response.status}`)
        return response.json()
      })

      const normalized = this.normalize(result)
      const validationErrors = this.validate(normalized)
      errors.push(...validationErrors)
      this.lastSuccess = new Date().toISOString()

      return this.buildResponse(externalId, normalized, Date.now() - start, warnings, errors)
    } catch (err) {
      this.lastError = new Date().toISOString()
      this.lastErrorMessage = String(err)
      return {
        provider: 'openalex',
        status: 'error',
        retrieved_at: new Date().toISOString(),
        external_identifier: externalId,
        normalized_payload: {},
        metadata: { adapter_version: this.metadata.version, processing_time_ms: Date.now() - start, retry_attempts: this.retryCount },
        warnings,
        errors: [String(err)],
      }
    }
  }

  normalize(raw: unknown): Record<string, unknown> {
    const data = raw as Record<string, unknown> ?? {}
    return {
      provider: 'openalex',
      external_id: data.id ?? data.uuid ?? '',
      raw_data: data,
      normalized_at: new Date().toISOString(),
    }
  }

  validate(payload: Record<string, unknown>): string[] {
    const errors: string[] = []
    if (!payload.provider) errors.push('Missing provider field')
    return errors
  }

  private buildUrl(externalId: string, options?: Record<string, string>): string {
    let url = `${this.metadata.base_url}/${encodeURIComponent(externalId)}`
    if (options) {
      const params = new URLSearchParams(options).toString()
      if (params) url += `?${params}`
    }
    return url
  }
}
