// ==========================================================================
// Channels — barrel export (Sprint 9.8)
// ==========================================================================

export {
  type ChannelTransport,
  type ChannelPayload,
  type ChannelResponse,
  type ChannelAdapter,
  type ChannelDeliveryResult,
  ChannelDeliveryResultSchema,
  createDeliveryResult,
} from './types.js';

export { RestAdapter } from './rest-adapter.js';
export { WebhookAdapter } from './webhook-adapter.js';
export { EmailAdapter } from './email-adapter.js';
export { DashboardAdapter } from './dashboard-adapter.js';
export { DownloadAdapter } from './download-adapter.js';
export { ApiAdapter } from './api-adapter.js';
export { ChannelRegistry } from './registry.js';
