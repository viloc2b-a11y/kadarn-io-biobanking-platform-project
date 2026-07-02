// ==========================================================================
// Connector Layer — Base Adapter (Sprint 23A)
// ==========================================================================

import type { ConnectorAdapter, ConnectorHealthStatus, ConnectorMetadata, ConnectorResponse, ProviderId } from '../types/types.js'

export abstract class BaseConnectorAdapter implements ConnectorAdapter {
  abstract readonly metadata: ConnectorMetadata

  protected lastSuccess: string | null = null
  protected lastError: string | null = null
  protected lastErrorMessage: string | null = null
  protected retryCount = 0

  abstract connect(): Promise<boolean>
  abstract fetch(externalId: string, options?: Record<string, string>): Promise<ConnectorResponse>
  abstract normalize(raw: unknown): Record<string, unknown>
  abstract validate(payload: Record<string, unknown>): string[]

  async health(): Promise<ConnectorHealthStatus> {
    const start = Date.now()
    try {
      const connected = await this.connect()
      const responseTime = Date.now() - start

      if (connected) {
        this.lastSuccess = new Date().toISOString()
        return {
          provider: this.metadata.provider,
          health: 'healthy',
          response_time_ms: responseTime,
          last_success_at: this.lastSuccess,
          last_error_at: this.lastError,
          last_error_message: null,
          retry_count: this.retryCount,
          checked_at: new Date().toISOString(),
        }
      }

      return this.degradedStatus(responseTime)
    } catch (err) {
      const responseTime = Date.now() - start
      this.lastError = new Date().toISOString()
      this.lastErrorMessage = String(err)
      this.retryCount++

      return {
        provider: this.metadata.provider,
        health: 'unavailable' as const,
        response_time_ms: responseTime,
        last_success_at: this.lastSuccess,
        last_error_at: this.lastError,
        last_error_message: this.lastErrorMessage,
        retry_count: this.retryCount,
        checked_at: new Date().toISOString(),
      }
    }
  }

  protected degradedStatus(responseTime: number): ConnectorHealthStatus {
    return {
      provider: this.metadata.provider,
      health: 'degraded',
      response_time_ms: responseTime,
      last_success_at: this.lastSuccess,
      last_error_at: this.lastError,
      last_error_message: this.lastErrorMessage,
      retry_count: this.retryCount,
      checked_at: new Date().toISOString(),
    }
  }

  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = this.metadata.retry_max,
  ): Promise<T> {
    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn()
        this.retryCount = 0
        return result
      } catch (err) {
        lastError = err
        this.retryCount = attempt + 1
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
    throw lastError
  }

  protected buildResponse<T>(
    externalId: string,
    normalized: T,
    processingTimeMs: number,
    warnings: string[] = [],
    errors: string[] = [],
  ): ConnectorResponse<T> {
    return {
      provider: this.metadata.provider,
      status: errors.length > 0 ? 'degraded' : 'success',
      retrieved_at: new Date().toISOString(),
      external_identifier: externalId,
      normalized_payload: normalized,
      metadata: {
        adapter_version: this.metadata.version,
        processing_time_ms: processingTimeMs,
        retry_attempts: this.retryCount,
      },
      warnings,
      errors,
    }
  }
}
