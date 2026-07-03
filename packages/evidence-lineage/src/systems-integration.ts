// Sprint 28J — Systems Integration Layer
// Kadarn enriches, never replaces. CTMS, LIMS, EDC, eTMF, EMR contracts.
export type IntegrationSystem = 'ctms' | 'lims' | 'edc' | 'etmf' | 'emr' | 'vilo_os'
export interface IntegrationContract { contractId: string; system: IntegrationSystem; direction: 'inbound' | 'outbound' | 'bidirectional'; authMethod: 'api_key' | 'hmac' | 'oauth2'; rateLimitRpm: number; sla: string; status: 'active' | 'degraded' | 'inactive' }
export interface WebhookEvent { eventId: string; eventType: string; payload: Record<string, unknown>; targetSystem: IntegrationSystem; createdAt: string; retryCount: number; status: 'pending' | 'delivered' | 'failed' | 'dead_letter' }
export class SystemsIntegrationEngine {
  private contracts: IntegrationContract[] = []; private events: WebhookEvent[] = []; private counter = 0
  registerContract(contract: IntegrationContract): void { this.contracts.push(contract) }
  getContract(system: IntegrationSystem): IntegrationContract | undefined { return this.contracts.find(c => c.system === system) }
  dispatchEvent(eventType: string, payload: Record<string, unknown>, targetSystem: IntegrationSystem): WebhookEvent { const e: WebhookEvent = { eventId: `evt:${++this.counter}`, eventType, payload, targetSystem, createdAt: new Date().toISOString(), retryCount: 0, status: 'pending' }; this.events.push(e); return e }
  getEvents(targetSystem?: IntegrationSystem): WebhookEvent[] { return targetSystem ? this.events.filter(e => e.targetSystem === targetSystem) : [...this.events] }
}