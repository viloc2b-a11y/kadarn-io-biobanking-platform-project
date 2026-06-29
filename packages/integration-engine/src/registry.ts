// ==========================================================================
// External Integrations — Sprint 11 evaluation registry
// ==========================================================================
// Each integration is justified by pilot value, not audit checklist compliance.
// ==========================================================================

export type IntegrationVerdict = 'integrate' | 'defer' | 'reject';

export interface IntegrationEvaluation {
  id: string;
  name: string;
  verdict: IntegrationVerdict;
  value: string;
  rationale: string;
  reevaluateWhen: string[];
}

export const EXTERNAL_INTEGRATIONS: IntegrationEvaluation[] = [
  {
    id: 'opa',
    name: 'Open Policy Agent (OPA)',
    verdict: 'integrate',
    value: 'Policy/code separation with shadow convergence evidence before enforce mode',
    rationale:
      'Shadow mode foundation exists (LocalOpaClient, policy_evaluations, domain events). HttpOpaClient enables real OPA sidecar without blocking requests.',
    reevaluateWhen: [
      'Shadow divergence rate < 1% for 30 days',
      'Pilot requires enforce-mode policy authority',
    ],
  },
  {
    id: 'supabase-realtime',
    name: 'Supabase Realtime',
    verdict: 'integrate',
    value: 'Live KOC activity feed without polling; infra already enabled in config',
    rationale:
      'Low-effort client wiring on audit_events/workflow_tasks. No new vendor or license.',
    reevaluateWhen: [
      'Dedicated notifications table is introduced',
      'Multi-region fan-out is required',
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe Connect',
    verdict: 'defer',
    value: 'Real fund movement for multi-party escrow settlement',
    rationale:
      'Financial runtime completes escrow/settlement orchestration internally. Stripe adds KYC, compliance, and vendor lock-in before any pilot requires actual money movement.',
    reevaluateWhen: [
      'Pilot contract requires card/ACH settlement',
      'Legal/compliance sign-off on PSP',
    ],
  },
  {
    id: 'fhir',
    name: 'FHIR R4',
    verdict: 'defer',
    value: 'Hospital/biobank interoperability export',
    rationale:
      'FHIR-MAPPING.md documents field mappings only. Kadarn should expose translation/export, not operate a FHIR server.',
    reevaluateWhen: [
      'Named pilot requires FHIR Bundle export',
      'Knowledge engine external mappings are production-ready',
    ],
  },
  {
    id: 'openspecimen',
    name: 'OpenSpecimen',
    verdict: 'defer',
    value: 'LIMS catalog import for biobank pilots',
    rationale:
      'AGPL blocks code reuse. REST connector belongs in integration-engine when a pilot runs OpenSpecimen.',
    reevaluateWhen: [
      'Pilot biobank confirms OpenSpecimen REST API access',
      'Connector contract tests pass against staging LIMS',
    ],
  },
  {
    id: 'bbmri',
    name: 'BBMRI-ERIC / MIABIS',
    verdict: 'reject',
    value: 'EU biobank network federation alignment',
    rationale:
      'Network federation is a multi-year program, not a sprint deliverable. Keep BBMRI-compatible vocabulary in sample types; defer MIABIS export until FHIR/connector layer exists.',
    reevaluateWhen: [
      'EU federation pilot is funded',
      'MIABIS export spec is signed with partner network',
    ],
  },
];

export function getIntegration(id: string): IntegrationEvaluation | undefined {
  return EXTERNAL_INTEGRATIONS.find(item => item.id === id);
}

export function integrationsByVerdict(verdict: IntegrationVerdict): IntegrationEvaluation[] {
  return EXTERNAL_INTEGRATIONS.filter(item => item.verdict === verdict);
}
