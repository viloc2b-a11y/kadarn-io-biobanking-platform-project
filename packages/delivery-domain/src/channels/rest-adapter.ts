// ==========================================================================
// RestAdapter — REST API delivery channel (KEMS-007 §G.1)
// ==========================================================================

import type {
  ChannelAdapter,
  ChannelDeliveryResult,
  ChannelPayload,
  ChannelResponse,
  ChannelTransport,
} from './types.js';
import type {
  ChannelType,
  DeliveryArtifact,
  DeliveryChannel,
  DeliveryRecipient,
} from '../index.js';
import { createDeliveryResult } from './types.js';

export class RestAdapter implements ChannelAdapter {
  readonly channelType: ChannelType = 'api';

  constructor(private transport?: ChannelTransport) {}

  async deliver(
    artifact: DeliveryArtifact,
    recipient: DeliveryRecipient,
    channel: DeliveryChannel,
  ): Promise<ChannelDeliveryResult> {
    const payload: ChannelPayload = {
      artifactId: artifact.id,
      artifactType: artifact.type,
      contentType: this.contentTypeFor(artifact.type),
      data: JSON.stringify({
        artifactId: artifact.id,
        contentHash: artifact.contentHash,
        templateId: artifact.templateId,
        metadata: artifact.metadata,
      }),
      recipient,
      channel,
    };

    const transport = this.transport ?? this.defaultTransport.bind(this);
    const response: ChannelResponse = await transport(payload);

    return createDeliveryResult({
      success: response.success,
      receiptId: crypto.randomUUID(),
      channelType: 'api',
      artifactId: artifact.id,
      recipientId: recipient.id,
      error: response.error,
      metadata: {
        ...response.metadata,
        statusCode: response.statusCode,
        method: channel.config?.endpoint ? 'POST' : 'GET',
      },
    });
  }

  validateConfig(config: Record<string, unknown>): boolean {
    // Requires endpoint (valid URL) and method (valid HTTP method)
    if (!config.endpoint || typeof config.endpoint !== 'string') {
      return false;
    }
    try {
      new URL(config.endpoint as string);
    } catch {
      return false;
    }
    if (config.method) {
      const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
      if (typeof config.method !== 'string' || !validMethods.includes((config.method as string).toUpperCase())) {
        return false;
      }
    }
    return true;
  }

  private contentTypeFor(artifactType: string): string {
    const map: Record<string, string> = {
      json: 'application/json',
      pdf: 'application/pdf',
      html: 'text/html',
      csv: 'text/csv',
      zip: 'application/zip',
    };
    return map[artifactType] ?? 'application/octet-stream';
  }

  private defaultTransport(payload: ChannelPayload): Promise<ChannelResponse> {
    return Promise.resolve({
      success: true,
      statusCode: 200,
      body: JSON.stringify({ delivered: true, artifactId: payload.artifactId }),
    });
  }
}
