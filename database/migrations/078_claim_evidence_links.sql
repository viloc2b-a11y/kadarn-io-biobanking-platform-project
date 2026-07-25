-- Table: claim_evidence_links
CREATE TABLE IF NOT EXISTS claim_evidence_links (
    claim_id UUID NOT NULL,
    evidence_id UUID NOT NULL REFERENCES evidence_nodes(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('SUPPORTS','PARTIALLY_SUPPORTS','CONTRADICTS','REQUIRES_REVIEW','OBSOLETES')),
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    rationale TEXT,
    provenance TEXT,
    PRIMARY KEY(claim_id, evidence_id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_id ON claim_evidence_links(evidence_id);
CREATE INDEX IF NOT EXISTS idx_tenant_id ON claim_evidence_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_relationship_type ON claim_evidence_links(relationship_type);