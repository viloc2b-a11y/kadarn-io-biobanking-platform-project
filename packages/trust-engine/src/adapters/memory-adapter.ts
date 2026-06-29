// ==========================================================================
// Trust Engine — In-memory adapter (tests + offline runtime)
// ==========================================================================

import type {
  OrganizationTrust,
  TrustEvent,
  TrustChallenge,
  TrustDimension,
} from '../types';
import type { TrustEngineAdapter } from '../service';

export class InMemoryTrustAdapter implements TrustEngineAdapter {
  private trust = new Map<string, OrganizationTrust>();
  private events: TrustEvent[] = [];
  private challenges = new Map<string, TrustChallenge>();

  async getOrganizationTrust(organizationId: string): Promise<OrganizationTrust | null> {
    return this.trust.get(organizationId) ?? null;
  }

  async upsertOrganizationTrust(
    partial: Partial<OrganizationTrust> & { organizationId: string },
  ): Promise<void> {
    const existing = this.trust.get(partial.organizationId);
    const merged: OrganizationTrust = {
      organizationId: partial.organizationId,
      operationalScore: partial.operationalScore ?? existing?.operationalScore ?? 0.5,
      regulatoryScore: partial.regulatoryScore ?? existing?.regulatoryScore ?? 0.5,
      financialScore: partial.financialScore ?? existing?.financialScore ?? 0.5,
      technicalScore: partial.technicalScore ?? existing?.technicalScore ?? 0.5,
      overallScore: partial.overallScore ?? existing?.overallScore ?? 0.5,
      lastEventAt: partial.lastEventAt ?? existing?.lastEventAt ?? null,
      lastDecayAt: partial.lastDecayAt ?? existing?.lastDecayAt ?? new Date().toISOString(),
      totalFulfillments: partial.totalFulfillments ?? existing?.totalFulfillments ?? 0,
      successfulFulfillments: partial.successfulFulfillments ?? existing?.successfulFulfillments ?? 0,
      incidentCount: partial.incidentCount ?? existing?.incidentCount ?? 0,
    };
    this.trust.set(partial.organizationId, merged);
  }

  async insertTrustEvent(event: TrustEvent): Promise<string> {
    const id = event.id ?? `evt-${this.events.length + 1}`;
    this.events.push({ ...event, id, createdAt: event.createdAt ?? new Date().toISOString() });
    return id;
  }

  async getTrustEvents(organizationId: string, dimension?: TrustDimension): Promise<TrustEvent[]> {
    return this.events.filter(
      e => e.organizationId === organizationId && (!dimension || e.dimension === dimension),
    );
  }

  async insertChallenge(challenge: TrustChallenge): Promise<string> {
    const id = challenge.id ?? `ch-${this.challenges.size + 1}`;
    this.challenges.set(id, { ...challenge, id });
    return id;
  }

  async getChallenge(id: string): Promise<TrustChallenge | null> {
    return this.challenges.get(id) ?? null;
  }

  async updateChallenge(id: string, updates: Partial<TrustChallenge>): Promise<void> {
    const current = this.challenges.get(id);
    if (current) {
      this.challenges.set(id, { ...current, ...updates });
    }
  }

  reset(): void {
    this.trust.clear();
    this.events = [];
    this.challenges.clear();
  }
}
