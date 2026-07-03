// ==========================================================================
// EmailAdapter — email delivery channel (KEMS-007 §G.3)
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailAdapter implements ChannelAdapter {
  readonly channelType: ChannelType = 'email';

  constructor(private transport?: ChannelTransport) {}

  async deliver(
    artifact: DeliveryArtifact,
    recipient: DeliveryRecipient,
    channel: DeliveryChannel,
  ): Promise<ChannelDeliveryResult> {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const payload: ChannelPayload = {
      artifactId: artifact.id,
      artifactType: artifact.type,
      contentType: 'multipart/mixed',
      data: JSON.stringify({
        subject: `Kadarn Delivery — ${artifact.type.toUpperCase()} Artifact`,
        body: `A new ${artifact.type} artifact is available.\n\nArtifact ID: ${artifact.id}\nTemplate: ${artifact.templateId}\n\nView in Kadarn: /delivery/${artifact.id}`,
        attachmentName: `${artifact.id}.${artifact.type}`,
      }),
      recipient,
      channel,
      metadata: {
        messageId,
        from: (channel.config?.auth as Record<string, string>)?.username ?? 'delivery@kadarn.test',
      },
    };

    const transport = this.transport ?? this.defaultTransport.bind(this);
    const response: ChannelResponse = await transport(payload);

    return createDeliveryResult({
      success: response.success,
      receiptId: crypto.randomUUID(),
      channelType: 'email',
      artifactId: artifact.id,
      recipientId: recipient.id,
      error: response.error,
      metadata: {
        messageId,
        to: recipient.identifier,
        subject: `Kadarn Delivery — ${artifact.type.toUpperCase()} Artifact`,
        statusCode: response.statusCode,
      },
    });
  }

  validateConfig(config: Record<string, unknown>): boolean {
    // Requires at minimum a valid 'from' email address
    const from = config.from as string | undefined;
    if (!from || typeof from !== 'string') {
      return false;
    }
    return EMAIL_REGEX.test(from);
  }

  private defaultTransport(payload: ChannelPayload): Promise<ChannelResponse> {
    return Promise.resolve({
      success: true,
      statusCode: 250,
      body: 'OK',
      metadata: {
        messageId: (payload.metadata as Record<string, unknown>)?.messageId ?? `msg-${Date.now()}`,
        to: payload.recipient.identifier,
      },
    });
  }
}
