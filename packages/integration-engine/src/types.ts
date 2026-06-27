export interface ExternalSystem { name: string; baseUrl: string; }
export interface IntegrationEvent { source: string; eventType: string; payload: Record<string,unknown>; }
export interface IntegrationAdapter { sendEvent(system: string, event: IntegrationEvent): Promise<void>; }
