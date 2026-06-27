import type {
  TrustEngineAdapter, OrganizationTrust, TrustEvent, TrustChallenge,
} from '@kadarn/trust-engine';

export class MemoryTrustAdapter implements TrustEngineAdapter {
  private trusts = new Map<string, OrganizationTrust>();
  private events = new Map<string, TrustEvent>();
  private challenges = new Map<string, TrustChallenge>();
  private nextId = 1;

  _seeded = false;

  private next(): string { return `mem-${this.nextId++}`; }

  async getOrganizationTrust(organizationId: string): Promise<OrganizationTrust | null> {
    return this.trusts.get(organizationId) ?? null;
  }

  async upsertOrganizationTrust(trust: Partial<OrganizationTrust> & { organizationId: string }): Promise<void> {
    const existing = this.trusts.get(trust.organizationId) ?? {} as OrganizationTrust;
    this.trusts.set(trust.organizationId, { ...existing, ...trust } as OrganizationTrust);
  }

  async insertTrustEvent(event: TrustEvent): Promise<string> {
    const id = this.next();
    this.events.set(id, { ...event, id } as TrustEvent);
    return id;
  }

  async getTrustEvents(organizationId: string): Promise<TrustEvent[]> {
    return Array.from(this.events.values()).filter(e => e.organizationId === organizationId);
  }

  async insertChallenge(challenge: TrustChallenge): Promise<string> {
    const id = this.next();
    this.challenges.set(id, { ...challenge, id } as TrustChallenge);
    return id;
  }

  async getChallenge(id: string): Promise<TrustChallenge | null> {
    return this.challenges.get(id) ?? null;
  }

  async updateChallenge(id: string, updates: Partial<TrustChallenge>): Promise<void> {
    const existing = this.challenges.get(id);
    if (existing) this.challenges.set(id, { ...existing, ...updates });
  }
}
