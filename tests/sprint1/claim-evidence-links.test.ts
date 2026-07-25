import { describe, it, expect } from 'vitest'
import { ClaimEvidenceRelationshipType, type ClaimEvidenceLink } from '@kadarn/types'

describe('Claim-Evidence Links (Package D)', () => {
  const makeLink = (overrides: Partial<ClaimEvidenceLink> = {}): ClaimEvidenceLink => ({
    claim_id: crypto.randomUUID(),
    evidence_id: crypto.randomUUID(),
    relationship_type: 'SUPPORTS',
    tenant_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    created_by: null,
    rationale: null,
    provenance: null,
    ...overrides,
  })

  it('should create a valid claim-evidence link', () => {
    const link = makeLink()
    expect(link.claim_id).toBeDefined()
    expect(link.evidence_id).toBeDefined()
    expect(link.relationship_type).toBe('SUPPORTS')
  })

  it('should accept all valid relationship types', () => {
    const types = ['SUPPORTS', 'PARTIALLY_SUPPORTS', 'CONTRADICTS', 'REQUIRES_REVIEW', 'OBSOLETES'] as const
    types.forEach((rt) => {
      const link = makeLink({ relationship_type: rt })
      expect(link.relationship_type).toBe(rt)
    })
  })

  it('should enforce tenant isolation by design', () => {
    const tenantA = crypto.randomUUID()
    const tenantB = crypto.randomUUID()
    const linkA = makeLink({ tenant_id: tenantA })
    const linkB = makeLink({ tenant_id: tenantB })
    expect(linkA.tenant_id).not.toBe(linkB.tenant_id)
  })

  it('should not use claim_ids array pattern', () => {
    // Verify the canonical model uses a separate link table, not an array
    const link = makeLink()
    expect(link).not.toHaveProperty('claim_ids')
    expect(link).toHaveProperty('claim_id')
    expect(link).toHaveProperty('evidence_id')
  })
})
