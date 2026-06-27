-- Collection Twin + Organization Twin extension
DO $$ BEGIN CREATE TYPE collection_status AS ENUM ('planned','active','paused','completed','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS collection_twins (
  id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id),
  status collection_status NOT NULL DEFAULT 'planned',
  protocol VARCHAR(500), irb_ref VARCHAR(255), consent_model VARCHAR(50),
  target_enrollment INTEGER, actual_enrollment INTEGER DEFAULT 0,
  twin_sequence BIGINT NOT NULL DEFAULT 0, twin_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE collection_twins ENABLE ROW LEVEL SECURITY;
CREATE POLICY collection_twins_select ON collection_twins FOR SELECT USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()) OR auth.role()='service_role');
CREATE POLICY collection_twins_insert ON collection_twins FOR INSERT WITH CHECK (auth.role()='service_role');
CREATE POLICY collection_twins_update ON collection_twins FOR UPDATE USING (auth.role()='service_role');

-- Organization Twin extends existing organizations table
-- Uses organization_trust from migration 014 for trust scores
-- This view provides the Organization Twin query interface
CREATE OR REPLACE VIEW organization_twins AS
SELECT o.id, o.name, o.country,
  (SELECT jsonb_agg(capability_type_id) FROM public.organization_capabilities WHERE organization_id = o.id) AS capabilities,
  t.operational_score, t.regulatory_score, t.financial_score, t.technical_score, t.overall_score,
  t.total_fulfillments, t.successful_fulfillments, t.incident_count,
  t.last_event_at, t.last_decay_at, t.updated_at as trust_updated_at
FROM organizations o LEFT JOIN organization_trust t ON o.id = t.organization_id;
