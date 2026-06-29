// ==========================================================================
// Policy Shadow → Domain Event Runtime bridge
// ==========================================================================

import { setPolicyShadowDecisionSink } from '@kadarn/policy-engine';
import { publishIntegrationEvent } from './event-runtime';
import { recordPolicyEvaluationProvenance } from './provenance-recorder';

setPolicyShadowDecisionSink((decision) => {
  publishIntegrationEvent(
    'PolicyShadowEvaluated',
    {
      actorId: decision.actorId,
      actorRole: decision.actorRole,
      organizationId: decision.organizationId ?? '',
      correlationId: decision.decisionId,
    },
    {
      actorId: decision.actorId,
      organizationId: decision.organizationId,
      correlationId: decision.decisionId,
      idempotencyKey: `PolicyShadowEvaluated:${decision.decisionId}`,
    },
  );

  recordPolicyEvaluationProvenance(
    decision.decisionId,
    decision.organizationId ?? '',
    decision.resourceType,
    decision.action,
    decision.opaDecision,
    decision.actorId,
    decision.decisionId,
  );
});
