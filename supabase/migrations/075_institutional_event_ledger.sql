-- Table: institutional_events
CREATE TABLE IF NOT EXISTS institutional_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    event_type TEXT NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    occurred_at TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id UUID,
    actor_type TEXT NOT NULL DEFAULT 'person' CHECK (actor_type IN ('person','system','external')),
    subject_id UUID,
    subject_type TEXT,
    correlation_id UUID,
    causation_id UUID,
    payload JSONB NOT NULL DEFAULT '{}',
    idempotency_key TEXT NOT NULL UNIQUE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE institutional_events ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_id ON institutional_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_occurred_at ON institutional_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_correlation_id ON institutional_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_key ON institutional_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_tenant_id ON institutional_events(tenant_id);