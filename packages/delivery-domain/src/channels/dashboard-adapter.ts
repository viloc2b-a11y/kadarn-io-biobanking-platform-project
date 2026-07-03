// ==========================================================================
// DashboardAdapter — Kadarn portal delivery channel (KEMS-007 §G.4)
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

export class DashboardAdapter implements ChannelAdapter {
  readonly channelType: ChannelType = 'portal';

  constructor(private transport?: ChannelTransport) {}

  async deliver(
    artifact: DeliveryArtifact,
    recipient: DeliveryRecipient,
    channel: DeliveryChannel,
  ): Promise<ChannelDeliveryResult> {
    const dashboardPath = `/workspace/delivery/${artifact.id}`;

    const payload: ChannelPayload = {
      artifactId: artifact.id,
      artifactType: artifact.type,
      contentType: 'application/json',
      data: JSON.stringify({
        artifactId: artifact.id,
        dashboardPath,
        accessible: true,
        notificationSent: true,
      }),
      recipient,
      channel,
      metadata: {
        dashboardPath,
        notificationSent: true,
      },
    };

    const transport = this.transport ?? this.defaultTransport.bind(this);
    const response: ChannelResponse = await transport(payload);

    return createDeliveryResult({
      success: response.success,
      receiptId: crypto.randomUUID(),
      channelType: 'portal',
      artifactId: artifact.id,
      recipientId: recipient.id,
      error: response.error,
      metadata: {
        dashboardPath,
        notificationSent: (channel.config?.notificationEnabled as boolean) ?? true,
        workspaceId: (channel.config?.workspaceId as string) ?? 'default',
      },
    });
  }

  validateConfig(config: Record<string, unknown>): boolean {
    // Always valid — uses defaults for workspaceId and notificationEnabled
    return true;
  }

  private defaultTransport(payload: ChannelPayload): Promise<ChannelResponse> {
    return Promise.resolve({
      success: true,
      statusCode: 200,
      metadata: {
        dashboardPath: (payload.metadata as Record<string, unknown>)?.dashboardPath,
        notificationSent: true,
      },
    });
  }
}
