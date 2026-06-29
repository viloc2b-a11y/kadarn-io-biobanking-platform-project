// ==========================================================================
// Webhooks — Outbound webhook delivery to external systems
// ==========================================================================

export type WebhookEvent = 'organization.created' | 'program.created' | 'program.updated' | 'sample.received' | 'sample.processed' | 'audit.event';

export interface WebhookConfig {
  id: string;
  organizationId: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  isActive: boolean;
  retryCount: number;
  timeoutMs: number;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  url: string;
  status: 'pending' | 'delivered' | 'failed';
  requestBody: string;
  responseStatus?: number;
  responseBody?: string;
  attempts: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface WebhookService {
  /** Register a new webhook endpoint */
  register(config: Omit<WebhookConfig, 'id' | 'createdAt'>): Promise<WebhookConfig>;

  /** Update a webhook configuration */
  update(id: string, config: Partial<WebhookConfig>): Promise<WebhookConfig>;

  /** Delete a webhook */
  delete(id: string, organizationId: string): Promise<void>;

  /** List webhooks for an organization */
  list(organizationId: string): Promise<WebhookConfig[]>;

  /** Deliver an event to all matching webhooks */
  deliver(event: WebhookEvent, payload: unknown, organizationId: string): Promise<WebhookDelivery[]>;

  /** Get delivery history for a webhook */
  getDeliveryHistory(webhookId: string, limit?: number): Promise<WebhookDelivery[]>;

  /** Retry a failed delivery */
  retry(deliveryId: string): Promise<WebhookDelivery>;
}
