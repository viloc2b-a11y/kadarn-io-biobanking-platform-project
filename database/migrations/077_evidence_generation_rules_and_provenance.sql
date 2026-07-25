-- PART 1: New table evidence_generation_rules
CREATE TABLE IF NOT EXISTS evidence_generation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    rule_version INTEGER NOT NULL DEFAULT 1,
    event_pattern TEXT NOT NULL,
    required_inputs JSONB NOT NULL DEFAULT '[]',
    output_evidence_type TEXT NOT NULL,
    preconditions JSONB NOT NULL DEFAULT '{}',
    review_mode TEXT NOT NULL DEFAULT 'manual' CHECK (review_mode IN ('manual','automatic','conditional')),
    confidence_policy JSONB NOT NULL DEFAULT '{}',
    owner UUID,
    active BOOLEAN NOT NULL DEFAULT true,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(rule_name, rule_version)
);

-- PART 2: ALTER TABLE evidence_nodes ADD COLUMN IF NOT EXISTS:
ALTER TABLE evidence_nodes ADD COLUMN IF NOT EXISTS generation_rule_id UUID REFERENCES evidence_generation_rules(id) ON DELETE SET NULL;
ALTER TABLE evidence_nodes ADD COLUMN IF NOT EXISTS input_hash TEXT;
ALTER TABLE evidence_nodes ADD COLUMN IF NOT EXISTS generator TEXT;
ALTER TABLE evidence_nodes ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;
ALTER TABLE evidence_nodes ADD COLUMN IF NOT EXISTS source_record_id UUID REFERENCES source_records(id) ON DELETE SET NULL;

-- Indexes:
CREATE INDEX IF NOT EXISTS idx_generation_rule_id ON evidence_nodes(generation_rule_id);
CREATE INDEX IF NOT EXISTS idx_source_record_id ON evidence_nodes(source_record_id);
CREATE INDEX IF NOT EXISTS idx_input_hash ON evidence_nodes(input_hash);
