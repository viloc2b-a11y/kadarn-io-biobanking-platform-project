export interface InstitutionalEvent {
    id: string;
    organization_id: string;
    event_type: string;
    event_version: number;
    occurred_at: string;
    recorded_at: string;
    actor_id?: string;
    actor_type: 'person' | 'system' | 'external';
    subject_id?: string;
    subject_type?: string;
    correlation_id?: string;
    causation_id?: string;
    payload: object;
    idempotency_key: string;
    tenant_id: string;
    created_at: string;
}