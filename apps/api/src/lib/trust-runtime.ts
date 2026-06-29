// ==========================================================================
// Trust Runtime — Supabase-backed trust engine integration
// ==========================================================================

import {
  TrustEngineService,
  InMemoryTrustAdapter,
  type TrustEngineAdapter,
  type OrganizationTrust,
  type TrustEvent,
  type TrustChallenge,
  type TrustDimension,
} from '@kadarn/trust-engine';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/service-client';
import { publishIntegrationEvent } from '@/lib/event-runtime';

type TrustRow = {
  organization_id: string;
  operational_score: number;
  regulatory_score: number;
  financial_score: number;
  technical_score: number;
  overall_score: number;
  last_event_at: string | null;
  last_decay_at: string;
  total_fulfillments: number;
  successful_fulfillments: number;
  incident_count: number;
};

class SupabaseTrustAdapter implements TrustEngineAdapter {
  constructor(private readonly client: SupabaseClient) {}

  async getOrganizationTrust(organizationId: string): Promise<OrganizationTrust | null> {
    const { data } = await this.client
      .from('organization_trust')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    return data ? mapTrustRow(data as TrustRow) : null;
  }

  async upsertOrganizationTrust(
    partial: Partial<OrganizationTrust> & { organizationId: string },
  ): Promise<void> {
    const row: Record<string, unknown> = {
      organization_id: partial.organizationId,
    };

    if (partial.operationalScore != null) row.operational_score = partial.operationalScore;
    if (partial.regulatoryScore != null) row.regulatory_score = partial.regulatoryScore;
    if (partial.financialScore != null) row.financial_score = partial.financialScore;
    if (partial.technicalScore != null) row.technical_score = partial.technicalScore;
    if (partial.overallScore != null) row.overall_score = partial.overallScore;
    if (partial.lastEventAt !== undefined) row.last_event_at = partial.lastEventAt;
    if (partial.lastDecayAt != null) row.last_decay_at = partial.lastDecayAt;
    if (partial.totalFulfillments != null) row.total_fulfillments = partial.totalFulfillments;
    if (partial.successfulFulfillments != null) {
      row.successful_fulfillments = partial.successfulFulfillments;
    }
    if (partial.incidentCount != null) row.incident_count = partial.incidentCount;

    const { error } = await this.client.from('organization_trust').upsert(row);
    if (error) throw new Error(error.message);
  }

  async insertTrustEvent(event: TrustEvent): Promise<string> {
    const { data, error } = await this.client
      .from('trust_events')
      .insert({
        organization_id: event.organizationId,
        dimension: event.dimension,
        impact: event.impact,
        evidence_ref: event.evidenceRef,
        source: event.source,
        severity: event.severity,
        description: event.description,
        score_before: event.scoreBefore,
        score_after: event.scoreAfter,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id as string;
  }

  async getTrustEvents(organizationId: string, dimension?: TrustDimension): Promise<TrustEvent[]> {
    let query = this.client
      .from('trust_events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (dimension) query = query.eq('dimension', dimension);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map(row => ({
      id: row.id as string,
      organizationId: row.organization_id as string,
      dimension: row.dimension as TrustDimension,
      impact: Number(row.impact),
      evidenceRef: row.evidence_ref as string,
      source: row.source as string,
      severity: row.severity as TrustEvent['severity'],
      description: row.description as string | undefined,
      scoreBefore: row.score_before != null ? Number(row.score_before) : undefined,
      scoreAfter: row.score_after != null ? Number(row.score_after) : undefined,
      createdAt: row.created_at as string,
    }));
  }

  async insertChallenge(challenge: TrustChallenge): Promise<string> {
    const { data, error } = await this.client
      .from('trust_challenges')
      .insert({
        organization_id: challenge.organizationId,
        dimension: challenge.dimension,
        challenged_score: challenge.challengedScore,
        proposed_score: challenge.proposedScore,
        evidence_ref: challenge.evidenceRef,
        reason: challenge.reason,
        status: challenge.status,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id as string;
  }

  async getChallenge(id: string): Promise<TrustChallenge | null> {
    const { data } = await this.client.from('trust_challenges').select('*').eq('id', id).maybeSingle();
    if (!data) return null;

    return {
      id: data.id as string,
      organizationId: data.organization_id as string,
      dimension: data.dimension as TrustDimension,
      challengedScore: Number(data.challenged_score),
      proposedScore: data.proposed_score != null ? Number(data.proposed_score) : undefined,
      evidenceRef: data.evidence_ref as string,
      reason: data.reason as string,
      status: data.status as TrustChallenge['status'],
    };
  }

  async updateChallenge(id: string, updates: Partial<TrustChallenge>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (updates.status) row.status = updates.status;
    if (updates.reviewedBy) row.reviewed_by = updates.reviewedBy;
    if (updates.reviewedAt) row.reviewed_at = updates.reviewedAt;
    if (updates.resolutionNotes) row.resolution_notes = updates.resolutionNotes;

    const { error } = await this.client.from('trust_challenges').update(row).eq('id', id);
    if (error) throw new Error(error.message);
  }
}

function mapTrustRow(row: TrustRow): OrganizationTrust {
  return {
    organizationId: row.organization_id,
    operationalScore: Number(row.operational_score),
    regulatoryScore: Number(row.regulatory_score),
    financialScore: Number(row.financial_score),
    technicalScore: Number(row.technical_score),
    overallScore: Number(row.overall_score),
    lastEventAt: row.last_event_at,
    lastDecayAt: row.last_decay_at,
    totalFulfillments: row.total_fulfillments,
    successfulFulfillments: row.successful_fulfillments,
    incidentCount: row.incident_count,
  };
}

let trustService: TrustEngineService | null = null;
let memoryAdapter: InMemoryTrustAdapter | null = null;

export function getTrustEngineService(): TrustEngineService {
  if (trustService) return trustService;

  const client = createServiceClient();
  const adapter: TrustEngineAdapter = client
    ? new SupabaseTrustAdapter(client)
    : getInMemoryTrustAdapter();

  trustService = new TrustEngineService(adapter);
  return trustService;
}

function getInMemoryTrustAdapter(): InMemoryTrustAdapter {
  if (!memoryAdapter) memoryAdapter = new InMemoryTrustAdapter();
  return memoryAdapter;
}

export function resetTrustRuntime(): void {
  trustService = null;
  memoryAdapter?.reset();
  memoryAdapter = null;
}

export interface TrustEvaluationContext {
  actorId: string;
  organizationId?: string | null;
  correlationId: string;
}

const SETTLEMENT_TRUST_SOURCES: Record<string, { source: string; dimension: TrustDimension }> = {
  funded: { source: 'payment.on_time', dimension: 'financial' },
  released: { source: 'payment.on_time', dimension: 'financial' },
  completed: { source: 'fulfillment.completed', dimension: 'operational' },
  refunded: { source: 'payment.default', dimension: 'financial' },
  cancelled: { source: 'fulfillment.disputed', dimension: 'financial' },
  disputed: { source: 'fulfillment.disputed', dimension: 'operational' },
};

export async function evaluateTrustForPipeline(
  ctx: TrustEvaluationContext,
  payload: Record<string, unknown>,
): Promise<void> {
  const providerOrgId = String(
    payload.providerOrgId ?? payload.targetOrgId ?? ctx.organizationId ?? '',
  );
  if (!providerOrgId) return;

  const service = getTrustEngineService();
  const scores = await service.getScores(providerOrgId);
  const evaluatedAt = new Date().toISOString();

  publishIntegrationEvent(
    'TrustScoreEvaluated',
    {
      providerOrgId,
      trustScore: scores.overallScore,
      evaluatedAt,
      operationalScore: scores.operationalScore,
      regulatoryScore: scores.regulatoryScore,
      financialScore: scores.financialScore,
      technicalScore: scores.technicalScore,
    },
    {
      actorId: ctx.actorId,
      organizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
      idempotencyKey: `TrustScoreEvaluated:${providerOrgId}:${ctx.correlationId}`,
    },
  );
}

export async function recordTrustFromSettlement(input: {
  organizationId: string;
  settlementId: string;
  toStatus: string;
  actorId: string;
  correlationId: string;
}): Promise<void> {
  const mapping = SETTLEMENT_TRUST_SOURCES[input.toStatus];
  if (!mapping) return;

  const service = getTrustEngineService();
  const result = await service.recordEvent({
    organizationId: input.organizationId,
    dimension: mapping.dimension,
    source: mapping.source,
    evidenceRef: input.settlementId,
    description: `Settlement ${input.toStatus}`,
  });

  publishIntegrationEvent(
    'TrustEventRecorded',
    {
      organizationId: input.organizationId,
      eventId: result.eventId,
      dimension: mapping.dimension,
      source: mapping.source,
      scoreBefore: result.scoreBefore,
      scoreAfter: result.scoreAfter,
      evidenceRef: input.settlementId,
    },
    {
      actorId: input.actorId,
      organizationId: input.organizationId,
      correlationId: input.correlationId,
      idempotencyKey: `TrustEventRecorded:${input.settlementId}:${input.toStatus}`,
    },
  );
}
