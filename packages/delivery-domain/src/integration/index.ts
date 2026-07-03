// ==========================================================================
// Integration — Barrel export
// Sprint 9.11 — External Integration APIs
// ==========================================================================

// --- Core Types ---
export {
  type ApiEndpoint,
  type ApiResponse,
  type ApiContract,
  type IntegrationAdapter,
  type DeliveryRequestLike,
  type DeliverySdkConfig,
  type SdkResponse,
} from './types.js';

// --- Adapters ---
export { CtmsAdapter, ctmsAdapter } from './ctms-adapter.js';
export { FhirAdapter, fhirAdapter } from './fhir-adapter.js';
export { WebhookIntegration, webhookIntegration } from './webhook-integration.js';

// --- REST API Contract ---
export { RestApiContract, deliveryRestApi } from './rest-api.js';

// --- SDK ---
export { DeliverySdk } from './sdk.js';

// --- Contract Validator ---
export { ApiContractValidator } from './api-validator.js';
