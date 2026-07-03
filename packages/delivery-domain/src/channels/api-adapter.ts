// ==========================================================================
// ApiAdapter — generic API delivery channel (KEMS-007 §G.6)
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

export class ApiAdapter implements ChannelAdapter {
  readonly channelType: ChannelType = 'api';

  constructor(private transport?: ChannelTransport) {}

  async deliver(
    artifact: DeliveryArtifact,
    recipient: DeliveryRecipient,
    channel: DeliveryChannel,
  ): Promise<ChannelDeliveryResult> {
    const authType = (channel.config?.authType as string) ?? 'none';

    const payload: ChannelPayload = {
      artifactId: artifact.id,
      artifactType: artifact.type,
      contentType: 'application/json',
      data: JSON.stringify({
        artifactId: artifact.id,
        type: artifact.type,
        contentHash: artifact.contentHash,
        templateId: artifact.templateId,
        templateVersion: artifact.templateVersion,
        metadata: artifact.metadata,
        deliveredAt: new Date().toISOString(),
      }),
      recipient,
      channel,
      metadata: {
        authType,
        headers: channel.config?.headers ?? {},
      },
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
        authType,
        statusCode: response.statusCode,
        endpoint: (channel.config?.endpoint as string) ?? '(none)',
      },
    });
  }

  validateConfig(config: Record<string, unknown>): boolean {
    // Requires endpoint (URL)
    if (!config.endpoint || typeof config.endpoint !== 'string') {
      return false;
    }
    try {
      new URL(config.endpoint as string);
    } catch {
      return false;
    }

    // Validate authType
    const authType = (config.authType as string) ?? 'none';
    const validAuthTypes = ['none', 'bearer', 'api-key', 'basic'];
    if (!validAuthTypes.includes(authType)) {
      return false;
    }

    // If authType requires credentials
    if (authType !== 'none') {
      if (!config.credentials || typeof config.credentials !== 'object') {
        return false;
      }
      const creds = config.credentials as Record<string, unknown>;
      if (authType === 'bearer' && (!creds.token || typeof creds.token !== 'string')) {
        return false;
      }
      if (authType === 'api-key' && (!creds.key || typeof creds.key !== 'string')) {
        return false;
      }
      if (authType === 'basic') {
        if (!creds.username || typeof creds.username !== 'string') return false;
        if (!creds.password || typeof creds.password !== 'string') return false;
      }
    }

    return true;
  }

  private defaultTransport(payload: ChannelPayload): Promise<ChannelResponse> {
    return Promise.resolve({
      success: true,
      statusCode: 200,
      body: JSON.stringify({ delivered: true, artifactId: payload.artifactId }),
      metadata: { authType: 'bearer' },
    });
  }
}
