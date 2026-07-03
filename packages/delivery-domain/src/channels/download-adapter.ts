// ==========================================================================
// DownloadAdapter — object storage download delivery channel (KEMS-007 §G.5)
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

export class DownloadAdapter implements ChannelAdapter {
  readonly channelType: ChannelType = 's3';

  constructor(private transport?: ChannelTransport) {}

  async deliver(
    artifact: DeliveryArtifact,
    recipient: DeliveryRecipient,
    channel: DeliveryChannel,
  ): Promise<ChannelDeliveryResult> {
    const expirySeconds = (channel.config?.expirySeconds as number) ?? 3600;
    const downloadToken = `token-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const downloadUrl = `https://delivery.kadarn.test/downloads/${artifact.id}?token=${downloadToken}`;
    const fileName = `${artifact.id}.${artifact.type}`;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();

    const payload: ChannelPayload = {
      artifactId: artifact.id,
      artifactType: artifact.type,
      contentType: 'application/octet-stream',
      data: JSON.stringify({
        downloadUrl,
        fileName,
        expirySeconds,
        expiresAt,
        artifactId: artifact.id,
      }),
      recipient,
      channel,
      metadata: {
        downloadUrl,
        fileName,
        expirySeconds,
        expiresAt,
      },
    };

    const transport = this.transport ?? this.defaultTransport.bind(this);
    const response: ChannelResponse = await transport(payload);

    return createDeliveryResult({
      success: response.success,
      receiptId: crypto.randomUUID(),
      channelType: 's3',
      artifactId: artifact.id,
      recipientId: recipient.id,
      error: response.error,
      metadata: {
        ...response.metadata,
        downloadUrl,
        fileName,
        expirySeconds,
        expiresAt,
        bucket: (channel.config?.bucket as string) ?? 'kadarn-delivery',
      },
    });
  }

  validateConfig(config: Record<string, unknown>): boolean {
    // Valid with defaults; custom expirySeconds must be a positive number if provided
    if (config.expirySeconds !== undefined) {
      if (typeof config.expirySeconds !== 'number' || (config.expirySeconds as number) <= 0) {
        return false;
      }
    }
    return true;
  }

  private defaultTransport(payload: ChannelPayload): Promise<ChannelResponse> {
    const expirySeconds = 3600;
    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();
    return Promise.resolve({
      success: true,
      statusCode: 200,
      metadata: {
        downloadUrl: `https://delivery.kadarn.test/downloads/${payload.artifactId}?token=sim-${Date.now()}`,
        expiresAt,
        fileName: `${payload.artifactId}.${payload.artifactType}`,
      },
    });
  }
}
