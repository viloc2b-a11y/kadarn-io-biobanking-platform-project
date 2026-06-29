// ==========================================================================
// Engine Orchestration — Pipeline stage registry
// ==========================================================================

import type { PipelineName, PipelineStage } from './types';

export const PIPELINE_STAGES: Record<PipelineName, PipelineStage[]> = {
  'exchange-request': [
    'discovery', 'knowledge', 'exchange', 'policy', 'workflow',
    'provenance', 'trust', 'financial', 'analytics', 'twins', 'telemetry',
  ],
  'exchange-request-decision': [
    'exchange', 'policy', 'workflow', 'provenance', 'trust', 'analytics', 'telemetry',
  ],
  'exchange-deal': [
    'exchange', 'policy', 'provenance', 'trust', 'financial', 'workflow', 'analytics', 'telemetry',
  ],
  'exchange-deal-update': [
    'exchange', 'policy', 'provenance', 'financial', 'analytics', 'telemetry',
  ],
  feasibility: [
    'discovery', 'knowledge', 'exchange', 'policy', 'provenance', 'analytics', 'telemetry',
  ],
  settlement: [
    'exchange', 'policy', 'provenance', 'trust', 'financial', 'analytics', 'telemetry',
  ],
  'settlement-update': [
    'exchange', 'provenance', 'financial', 'trust', 'analytics', 'telemetry',
  ],
  shipment: [
    'exchange', 'policy', 'provenance', 'trust', 'twins', 'workflow', 'analytics', 'telemetry',
  ],
  'shipment-status': [
    'exchange', 'provenance', 'trust', 'twins', 'analytics', 'telemetry',
  ],
  qc: [
    'policy', 'provenance', 'twins', 'trust', 'analytics', 'telemetry',
  ],
  'collection-twin': [
    'twins', 'provenance', 'knowledge', 'analytics', 'telemetry',
  ],
  'specimen-twin': [
    'discovery', 'twins', 'provenance', 'knowledge', 'analytics', 'telemetry',
  ],
  'organization-onboard': [
    'exchange', 'policy', 'provenance', 'trust', 'analytics', 'telemetry',
  ],
};
