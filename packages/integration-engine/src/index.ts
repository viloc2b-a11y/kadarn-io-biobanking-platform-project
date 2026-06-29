export { sendEvent } from './engine';
export type { ExternalSystem, IntegrationEvent, IntegrationAdapter } from './types';
export {
  EXTERNAL_INTEGRATIONS,
  getIntegration,
  integrationsByVerdict,
  type IntegrationEvaluation,
  type IntegrationVerdict,
} from './registry';
