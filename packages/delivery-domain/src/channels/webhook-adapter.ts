// ==========================================================================
// WebhookAdapter — outgoing webhook delivery channel (KEMS-007 §G.2)
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

export class WebhookAdapter implements ChannelAdapter {
  readonly channelType: ChannelType = 'webhook';

  constructor(private transport?: ChannelTransport) {}

  async deliver(
    artifact: DeliveryArtifact,
    recipient: DeliveryRecipient,
    channel: DeliveryChannel,
  ): Promise<ChannelDeliveryResult> {
    const payload: ChannelPayload = {
      artifactId: artifact.id,
      artifactType: artifact.type,
      contentType: 'application/json',
      data: JSON.stringify({
        event: 'delivery.artifact.ready',
        artifactId: artifact.id,
        type: artifact.type,
        contentHash: artifact.contentHash,
        deliveredAt: new Date().toISOString(),
      }),
      recipient,
      channel,
      metadata: {
        webhookEvent: 'delivery.artifact.ready',
        signatureHeader: 'X-Kadarn-Signature',
      },
    };

    const transport = this.transport ?? this.defaultTransport.bind(this);
    const response: ChannelResponse = await transport(payload);

    return createDeliveryResult({
      success: response.success,
      receiptId: crypto.randomUUID(),
      channelType: 'webhook',
      artifactId: artifact.id,
      recipientId: recipient.id,
      error: response.error,
      metadata: {
        ...response.metadata,
        webhookEvent: 'delivery.artifact.ready',
        statusCode: response.statusCode,
      },
    });
  }

  validateConfig(config: Record<string, unknown>): boolean {
    // Requires: url (webhook URL) and secret (for HMAC signing)
    if (!config.url || typeof config.url !== 'string') {
      return false;
    }
    try {
      new URL(config.url as string);
    } catch {
      return false;
    }
    if (!config.secret || typeof config.secret !== 'string' || (config.secret as string).length === 0) {
      return false;
    }
    return true;
  }

  /** Derive a simulated signature from the artifact id and secret */
  private simulateSignature(artifactId: string, secret: string): string {
    // SHA-256 simulation — uses Node crypto in production, placeholder here
    const input = `${artifactId}:${secret}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `sha256=${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  private defaultTransport(payload: ChannelPayload): Promise<ChannelResponse> {
    return Promise.resolve({
      success: true,
      statusCode: 200,
      body: JSON.stringify({ acknowledged: true }),
      metadata: { webhookEvent: 'delivery.artifact.ready' },
    });
  }
}
