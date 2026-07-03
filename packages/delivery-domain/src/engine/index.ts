// ==========================================================================
// Engine — barrel export (Sprint 9.6)
// ==========================================================================

export {
  type DeliveryRequest,
  type DeliveryResult,
  type DeliveryEngineConfig,
} from './types.js';

export {
  DeliveryError,
  DeliveryPolicyDeniedError,
  TemplateNotFoundError,
  RendererNotFoundError,
  DeliveryQueueError,
} from './errors.js';

export { DeliveryEngine } from './delivery-engine.js';
