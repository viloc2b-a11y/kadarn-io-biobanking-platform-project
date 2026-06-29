// ==========================================================================
// Workflow Engine 2.0 — Exchange Request Definition (reference)
// ==========================================================================
// Maps PoC steps to ADR-017 step types for Postgres-backed instances.
// ==========================================================================

import type { WorkflowDefinition } from '../../types';

export const EXCHANGE_REQUEST_DEFINITION: WorkflowDefinition = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'exchange-request',
  description: 'Research access request lifecycle',
  version: 1,
  status: 'active',
  metadata: { source: 'sprint-8-runtime', pocModule: 'temporal/exchange-request-workflow' },
  steps: [
    { id: 'receive_submission', type: 'auto_action', label: 'Receive submission', actionHandler: 'log_activity' },
    { id: 'notify_reviewer', type: 'auto_action', label: 'Notify reviewer', actionHandler: 'notify_reviewer' },
    { id: 'wait_review', type: 'human_task', label: 'Await reviewer action', assigneeRole: 'provider_admin', timeoutMinutes: 10_080 },
    { id: 'assess_review', type: 'policy_check', label: 'Assess review decision', policyRefs: ['exchange.review'] },
    { id: 'notify_negotiation', type: 'auto_action', label: 'Notify negotiation', actionHandler: 'notify_parties' },
    { id: 'wait_mta', type: 'human_task', label: 'Await MTA signature', assigneeRole: 'legal', timeoutMinutes: 20_160 },
    { id: 'assess_mta', type: 'auto_action', label: 'Assess MTA', actionHandler: 'assess_request_timeout' },
    { id: 'finalize', type: 'auto_action', label: 'Finalize request', actionHandler: 'update_request_status' },
  ],
};
