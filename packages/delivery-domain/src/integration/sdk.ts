// ==========================================================================
// Delivery SDK — TypeScript client for the Kadarn Delivery REST API
// Sprint 9.11 — External Integration APIs
// Domain simulation — no real HTTP calls in the domain package.
// ==========================================================================

import type { DeliverySdkConfig, SdkResponse } from './types.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';

export class DeliverySdk {
  private config: DeliverySdkConfig;

  constructor(config: DeliverySdkConfig) {
    this.config = { timeout: 30000, ...config };
  }

  /** Request a new delivery */
  async requestDelivery(params: {
    viewId: string;
    templateName: string;
    artifactType: ArtifactType;
    recipients: { recipientId: string; channelType: string }[];
    metadata?: Record<string, unknown>;
  }): Promise<SdkResponse<{ deliveryId: string; status: string }>> {
    return this.request<{ deliveryId: string; status: string }>('POST', '/api/v1/delivery/request', params);
  }

  /** Get delivery status */
  async getDeliveryStatus(deliveryId: string): Promise<SdkResponse<{ deliveryId: string; artifactId: string; status: string }>> {
    return this.request<{ deliveryId: string; artifactId: string; status: string }>('GET', `/api/v1/delivery/status/${deliveryId}`);
  }

  /** List artifacts */
  async listArtifacts(params?: {
    status?: string;
    templateName?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<SdkResponse<{ artifacts: unknown[]; total: number }>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.templateName) query.set('templateName', params.templateName);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.limit) query.set('limit', String(params.limit));
    const queryStr = query.toString();
    return this.request<{ artifacts: unknown[]; total: number }>('GET', `/api/v1/delivery/artifacts${queryStr ? `?${queryStr}` : ''}`);
  }

  /** Get artifact details */
  async getArtifact(artifactId: string): Promise<SdkResponse<{ artifact: unknown; audit: unknown[] }>> {
    return this.request<{ artifact: unknown; audit: unknown[] }>('GET', `/api/v1/delivery/artifacts/${artifactId}`);
  }

  /** Get the current config (read-only for testing) */
  getConfig(): Readonly<DeliverySdkConfig> {
    return { ...this.config };
  }

  /** Internal request method — simulated in domain, real in production */
  private async request<T>(_method: string, path: string, _body?: unknown): Promise<SdkResponse<T>> {
    try {
      // Simulate different endpoint responses based on path
      let data: unknown = {
        deliveryId: `sim-${Date.now()}`,
        status: 'accepted',
        artifactId: `artifact-${Date.now()}`,
        artifacts: [],
        total: 0,
      };

      // GET /artifacts/{id} returns artifact detail
      if (path.startsWith('/api/v1/delivery/artifacts/') && !path.includes('?')) {
        const artifactId = path.split('/').pop()!;
        data = {
          artifact: { id: artifactId, type: 'pdf', status: 'delivered', contentHash: 'abc123' },
          audit: [{ event: 'delivery.succeeded', timestamp: new Date().toISOString() }],
        };
      }

      const response: SdkResponse<T> = {
        success: true,
        data: data as T,
        statusCode: 200,
      };
      return response;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        statusCode: 500,
      };
    }
  }
}
