// ─── KAD-LOOP-003 — Phase 12-13: Acceptance Tests ────────────────────────
// Tests for the Institutional Claims & Capability Graph.
// Verifies 6 acceptance scenarios from the Loop 3 spec.
// Schema-level validation only — no live database required.

import { describe, it, expect } from 'vitest';
import {
  ClaimSchema,
  CreateClaimSchema,
  UpdateClaimSchema,
  ClaimLifecycleStatus,
  ClaimWorkflowState,
  ClaimReviewStatus,
  ClaimVerificationStatus,
  ClaimScope,
  ClaimPriority,
  ClaimCategory,
  ClaimEvidenceLinkSchema,
  ClaimEvidenceRelationshipType,
  ClaimVersionSchema,
  CreateClaimVersionSchema,
  ClaimVersionSummarySchema,
  ClaimVersionLineageSchema,
  InstitutionCapabilitySchema,
  CreateInstitutionCapabilitySchema,
  UpdateInstitutionCapabilitySchema,
  EvidenceSufficiency,
  CapabilityClaimLinkSchema,
  CreateCapabilityClaimLinkSchema,
  CapabilityClaimRelationship,
} from '@kadarn/types';

// ─── Valid UUIDs for test fixtures ────────────────────────────────────────
const ID = {
  org: '550e8400-e29b-41d4-a716-446655440000',
  person: '550e8400-e29b-41d4-a716-446655440001',
  location: '550e8400-e29b-41d4-a716-446655440002',
  claim: '550e8400-e29b-41d4-a716-446655440003',
  capability: '550e8400-e29b-41d4-a716-446655440004',
  evidence: '550e8400-e29b-41d4-a716-446655440005',
  event: '550e8400-e29b-41d4-a716-446655440006',
  version: '550e8400-e29b-41d4-a716-446655440007',
  actor: '550e8400-e29b-41d4-a716-446655440008',
} as const;

const NOW = '2026-07-25T14:00:00.000Z';
const FUTURE = '2027-07-25T14:00:00.000Z';

// ─── Helper: valid claim fixture ──────────────────────────────────────────
const validClaim = () => ({
  id: ID.claim,
  claim_type_id: 'inventory',
  name: 'Test Claim',
  description: 'A test claim for validation',
  organization_id: ID.org,
  location_id: null,
  person_id: null,
  claim_category: 'operational',
  claim_scope: 'institution',
  priority: 'medium',
  version: 1,
  owner_id: null,
  source_event_id: null,
  workflow_state: 'draft',
  lifecycle_status: 'draft',
  review_status: 'pending',
  verification_status: null,
  evidence_count: 0,
  expires_at: null,
  superseded_by: null,
  supersession_reason: null,
  tags: null,
  created_by_actor_id: null,
  created_at: NOW,
  updated_at: NOW,
});

describe('KAD-LOOP-003 — Claims & Capability Graph', () => {

  // ═══════════════════════════════════════════════════════════════════════
  // 1. Claim Schema Validation
  // ═══════════════════════════════════════════════════════════════════════
  describe('Claim Schema Validation', () => {
    it('parses a valid claim', () => {
      const result = ClaimSchema.safeParse(validClaim());
      expect(result.success).toBe(true);
    });

    it('rejects claim without organization_id', () => {
      const { organization_id, ...rest } = validClaim();
      const result = ClaimSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects claim with empty name', () => {
      const result = ClaimSchema.safeParse({ ...validClaim(), name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects claim with invalid UUID', () => {
      const result = ClaimSchema.safeParse({ ...validClaim(), id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('applies default values for priority, version, lifecycle_status, review_status, workflow_state', () => {
      const input = {
        id: ID.claim,
        claim_type_id: 'inventory',
        name: 'Minimal Claim',
        organization_id: ID.org,
        created_at: NOW,
        updated_at: NOW,
      };
      const result = ClaimSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('medium');
        expect(result.data.version).toBe(1);
        expect(result.data.lifecycle_status).toBe('draft');
        expect(result.data.review_status).toBe('pending');
        expect(result.data.workflow_state).toBe('draft');
        expect(result.data.evidence_count).toBe(0);
      }
    });

    it('CreateClaimSchema validates minimal input', () => {
      const result = CreateClaimSchema.safeParse({
        claim_type_id: 'inventory',
        name: 'New Claim',
        organization_id: ID.org,
      });
      expect(result.success).toBe(true);
    });

    it('CreateClaimSchema rejects missing required fields', () => {
      const result = CreateClaimSchema.safeParse({ name: 'No org' });
      expect(result.success).toBe(false);
    });

    it('UpdateClaimSchema allows partial updates', () => {
      const result = UpdateClaimSchema.safeParse({ name: 'Updated Name' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
      }
    });

    it('UpdateClaimSchema rejects empty name', () => {
      const result = UpdateClaimSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('validates optional nullable fields accept null', () => {
      const result = ClaimSchema.safeParse({
        ...validClaim(),
        description: null,
        location_id: null,
        person_id: null,
        expires_at: null,
      });
      expect(result.success).toBe(true);
    });

    it('validates expires_at as datetime string', () => {
      const result = ClaimSchema.safeParse({ ...validClaim(), expires_at: FUTURE });
      expect(result.success).toBe(true);
    });

    it('rejects invalid expires_at format', () => {
      const result = ClaimSchema.safeParse({ ...validClaim(), expires_at: 'next week' });
      expect(result.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Claim Lifecycle Enums
  // ═══════════════════════════════════════════════════════════════════════
  describe('Claim Lifecycle Enums', () => {
    it('ClaimLifecycleStatus has 7 values matching spec', () => {
      const values = ClaimLifecycleStatus.options;
      expect(values).toEqual(['draft', 'review', 'approved', 'rejected', 'superseded', 'expired', 'archived']);
      expect(values.length).toBe(7);
    });

    it('ClaimWorkflowState has 7 values matching DB', () => {
      const values = ClaimWorkflowState.options;
      expect(values).toEqual(['draft', 'declared', 'pending_evidence', 'under_review', 'published', 'disputed', 'archived']);
      expect(values.length).toBe(7);
    });

    it('ClaimReviewStatus has 4 values', () => {
      const values = ClaimReviewStatus.options;
      expect(values).toEqual(['pending', 'in_review', 'approved', 'rejected']);
      expect(values.length).toBe(4);
    });

    it('ClaimVerificationStatus has 7 legacy values', () => {
      const values = ClaimVerificationStatus.options;
      expect(values).toContain('self_reported');
      expect(values).toContain('kadarn_verified');
      expect(values.length).toBe(7);
    });

    it('ClaimScope has 3 values', () => {
      expect(ClaimScope.options).toEqual(['institution', 'location', 'person']);
    });

    it('ClaimPriority has 4 values', () => {
      expect(ClaimPriority.options).toEqual(['low', 'medium', 'high', 'critical']);
    });

    it('ClaimCategory has 5 values', () => {
      expect(ClaimCategory.options).toEqual(['regulatory', 'operational', 'competency', 'capability', 'compliance']);
    });

    it('valid lifecycle statuses parse correctly', () => {
      for (const status of ClaimLifecycleStatus.options) {
        const result = ClaimSchema.safeParse({ ...validClaim(), lifecycle_status: status });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid lifecycle status', () => {
      const result = ClaimSchema.safeParse({ ...validClaim(), lifecycle_status: 'nonexistent' });
      expect(result.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Claim Versioning
  // ═══════════════════════════════════════════════════════════════════════
  describe('Claim Versioning', () => {
    const validVersion = () => ({
      id: ID.version,
      claim_id: ID.claim,
      version: 1,
      claim_type_id: 'inventory',
      name: 'Version 1 Snapshot',
      description: null,
      organization_id: ID.org,
      location_id: null,
      person_id: null,
      claim_category: null,
      claim_scope: null,
      priority: null,
      owner_id: null,
      source_event_id: null,
      workflow_state: 'draft' as const,
      lifecycle_status: 'draft' as const,
      review_status: 'pending' as const,
      verification_status: null,
      evidence_count: 0,
      expires_at: null,
      superseded_by: null,
      supersession_reason: null,
      tags: null,
      created_by_actor_id: null,
      created_at: NOW,
    });

    it('ClaimVersionSchema parses valid snapshot', () => {
      const result = ClaimVersionSchema.safeParse(validVersion());
      expect(result.success).toBe(true);
    });

    it('ClaimVersionSchema rejects missing required fields', () => {
      const { workflow_state, ...rest } = validVersion();
      const result = ClaimVersionSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('ClaimVersionSchema requires version >= 1', () => {
      const result = ClaimVersionSchema.safeParse({ ...validVersion(), version: 0 });
      expect(result.success).toBe(false);
    });

    it('ClaimVersionSchema requires version to be integer', () => {
      const result = ClaimVersionSchema.safeParse({ ...validVersion(), version: 1.5 });
      expect(result.success).toBe(false);
    });

    it('CreateClaimVersionSchema accepts valid inputs', () => {
      const result = CreateClaimVersionSchema.safeParse({
        claim_id: ID.claim,
        version: 2,
        claim_type_id: 'inventory',
        name: 'Updated Claim',
        organization_id: ID.org,
        workflow_state: 'published',
        lifecycle_status: 'approved',
        review_status: 'approved',
      });
      expect(result.success).toBe(true);
    });

    it('ClaimVersionSummarySchema parses lightweight lineage', () => {
      const result = ClaimVersionSummarySchema.safeParse({
        id: ID.version,
        claim_id: ID.claim,
        version: 1,
        lifecycle_status: 'draft',
        review_status: 'pending',
        superseded_by: null,
        created_by_actor_id: null,
        created_at: NOW,
      });
      expect(result.success).toBe(true);
    });

    it('ClaimVersionLineageSchema links versions to current', () => {
      const result = ClaimVersionLineageSchema.safeParse({
        claim_id: ID.claim,
        versions: [{
          id: ID.version,
          claim_id: ID.claim,
          version: 1,
          lifecycle_status: 'draft',
          review_status: 'pending',
          superseded_by: null,
          created_by_actor_id: null,
          created_at: NOW,
        }],
        current_version_id: ID.version,
      });
      expect(result.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Capability Schema
  // ═══════════════════════════════════════════════════════════════════════
  describe('Capability Schema', () => {
    const validCapability = () => ({
      id: ID.capability,
      name: 'Site Operations',
      description: 'Core operational capability',
      capability_type_id: null,
      domain: 'operations',
      organization_id: ID.org,
      primary_claim_id: null,
      status: 'declared' as const,
      review_status: 'pending' as const,
      evidence_sufficiency: null,
      claim_count: 0,
      confidence_score: null,
      confidence_placeholder: null,
      first_declared_at: NOW,
      last_verified_at: null,
      created_at: NOW,
      updated_at: NOW,
    });

    it('InstitutionCapabilitySchema parses valid capability', () => {
      const result = InstitutionCapabilitySchema.safeParse(validCapability());
      expect(result.success).toBe(true);
    });

    it('InstitutionCapabilitySchema rejects empty name', () => {
      const result = InstitutionCapabilitySchema.safeParse({ ...validCapability(), name: '' });
      expect(result.success).toBe(false);
    });

    it('InstitutionCapabilitySchema rejects name > 255 chars', () => {
      const result = InstitutionCapabilitySchema.safeParse({ ...validCapability(), name: 'X'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('InstitutionCapabilitySchema accepts all 6 status values', () => {
      const statuses = ['declared', 'evidence_submitted', 'under_review', 'verified', 'published', 'deprecated'];
      for (const s of statuses) {
        const result = InstitutionCapabilitySchema.safeParse({ ...validCapability(), status: s });
        expect(result.success).toBe(true);
      }
    });

    it('CreateInstitutionCapabilitySchema validates minimal input', () => {
      const result = CreateInstitutionCapabilitySchema.safeParse({
        name: 'New Capability',
        organization_id: ID.org,
      });
      expect(result.success).toBe(true);
    });

    it('UpdateInstitutionCapabilitySchema allows partial updates', () => {
      const result = UpdateInstitutionCapabilitySchema.safeParse({ name: 'Renamed' });
      expect(result.success).toBe(true);
    });

    it('confidence_score must be 0-1', () => {
      const result = InstitutionCapabilitySchema.safeParse({ ...validCapability(), confidence_score: 1.5 });
      expect(result.success).toBe(false);
    });

    it('confidence_score accepts 0 and 1', () => {
      expect(InstitutionCapabilitySchema.safeParse({ ...validCapability(), confidence_score: 0 }).success).toBe(true);
      expect(InstitutionCapabilitySchema.safeParse({ ...validCapability(), confidence_score: 1 }).success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Capability-Claim M2M
  // ═══════════════════════════════════════════════════════════════════════
  describe('Capability-Claim M2M', () => {
    it('CapabilityClaimRelationship has 4 values', () => {
      expect(CapabilityClaimRelationship.options).toEqual(['primary', 'secondary', 'supporting', 'contradicting']);
    });

    it('CapabilityClaimLinkSchema parses valid link', () => {
      const result = CapabilityClaimLinkSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        capability_id: ID.capability,
        claim_id: ID.claim,
        relationship_type: 'primary',
        weight: 1.0,
        created_at: NOW,
        created_by: null,
      });
      expect(result.success).toBe(true);
    });

    it('CapabilityClaimLinkSchema rejects invalid relationship type', () => {
      const result = CapabilityClaimLinkSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        capability_id: ID.capability,
        claim_id: ID.claim,
        relationship_type: 'invalid',
        weight: 1.0,
        created_at: NOW,
        created_by: null,
      });
      expect(result.success).toBe(false);
    });

    it('CapabilityClaimLinkSchema defaults weight to 0', () => {
      const result = CapabilityClaimLinkSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        capability_id: ID.capability,
        claim_id: ID.claim,
        relationship_type: 'primary',
        created_at: NOW,
        created_by: null,
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.weight).toBe(0);
    });

    it('CreateCapabilityClaimLinkSchema accepts optional weight', () => {
      const result = CreateCapabilityClaimLinkSchema.safeParse({
        capability_id: ID.capability,
        claim_id: ID.claim,
        relationship_type: 'secondary',
        weight: 0.5,
      });
      expect(result.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 6. Evidence Sufficiency
  // ═══════════════════════════════════════════════════════════════════════
  describe('Evidence Sufficiency', () => {
    it('EvidenceSufficiency has 6 values', () => {
      expect(EvidenceSufficiency.options).toEqual([
        'sufficient', 'insufficient', 'conflicting', 'expired', 'superseded', 'manual_review_required',
      ]);
      expect(EvidenceSufficiency.options.length).toBe(6);
    });

    it('each sufficiency value is valid in context', () => {
      for (const s of EvidenceSufficiency.options) {
        expect(EvidenceSufficiency.safeParse(s).success).toBe(true);
      }
    });

    it('rejects invalid sufficiency value', () => {
      expect(EvidenceSufficiency.safeParse('unknown').success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 7. Claim-Evidence Relationship
  // ═══════════════════════════════════════════════════════════════════════
  describe('Claim-Evidence Relationship', () => {
    it('ClaimEvidenceRelationshipType has 5 values', () => {
      expect(ClaimEvidenceRelationshipType.options).toEqual([
        'SUPPORTS', 'PARTIALLY_SUPPORTS', 'CONTRADICTS', 'REQUIRES_REVIEW', 'OBSOLETES',
      ]);
    });

    it('ClaimEvidenceLinkSchema parses valid link', () => {
      const result = ClaimEvidenceLinkSchema.safeParse({
        claim_id: ID.claim,
        evidence_id: ID.evidence,
        relationship_type: 'SUPPORTS',
        tenant_id: ID.org,
        created_at: NOW,
        created_by: null,
        rationale: null,
        provenance: null,
      });
      expect(result.success).toBe(true);
    });

    it('ClaimEvidenceLinkSchema rejects invalid relationship', () => {
      const result = ClaimEvidenceLinkSchema.safeParse({
        claim_id: ID.claim,
        evidence_id: ID.evidence,
        relationship_type: 'WEAKENS',
        tenant_id: ID.org,
        created_at: NOW,
        created_by: null,
        rationale: null,
        provenance: null,
      });
      expect(result.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 8. Acceptance Scenarios (Schema-Level)
  // ═══════════════════════════════════════════════════════════════════════
  describe('Acceptance Scenarios', () => {
    it('Scenario 1: Evidence → Claim created — claim with source_event_id is valid', () => {
      const result = ClaimSchema.safeParse({
        ...validClaim(),
        source_event_id: ID.event,
      });
      expect(result.success).toBe(true);
    });

    it('Scenario 2: Multiple Evidence → Single Claim — ClaimEvidenceLinkSchema for 2 evidence items is valid', () => {
      const link1 = ClaimEvidenceLinkSchema.safeParse({
        claim_id: ID.claim,
        evidence_id: ID.evidence,
        relationship_type: 'SUPPORTS',
        tenant_id: ID.org,
        created_at: NOW,
      });
      const link2 = ClaimEvidenceLinkSchema.safeParse({
        claim_id: ID.claim,
        evidence_id: '550e8400-e29b-41d4-a716-446655440020',
        relationship_type: 'PARTIALLY_SUPPORTS',
        tenant_id: ID.org,
        created_at: NOW,
      });
      expect(link1.success).toBe(true);
      expect(link2.success).toBe(true);
    });

    it('Scenario 3: Multiple Claims → Capability — CreateCapabilityClaimLinkSchema for 2 claims is valid', () => {
      const link1 = CreateCapabilityClaimLinkSchema.safeParse({
        capability_id: ID.capability,
        claim_id: ID.claim,
        relationship_type: 'primary',
      });
      const link2 = CreateCapabilityClaimLinkSchema.safeParse({
        capability_id: ID.capability,
        claim_id: '550e8400-e29b-41d4-a716-446655440030',
        relationship_type: 'secondary',
        weight: 0.7,
      });
      expect(link1.success).toBe(true);
      expect(link2.success).toBe(true);
    });

    it('Scenario 4: Missing Evidence → Capability marked incomplete — EvidenceSufficiency.insufficient is valid', () => {
      expect(EvidenceSufficiency.safeParse('insufficient').success).toBe(true);
      // Verify capability can carry this value
      const result = InstitutionCapabilitySchema.safeParse({
        id: ID.capability,
        name: 'Incomplete Capability',
        organization_id: ID.org,
        status: 'declared',
        evidence_sufficiency: 'insufficient',
        claim_count: 0,
        first_declared_at: NOW,
        created_at: NOW,
        updated_at: NOW,
      });
      expect(result.success).toBe(true);
    });

    it('Scenario 5: Traverse Institution → Capability → Claim → Evidence → SourceRecord → Event — all schemas link via UUID FKs', () => {
      // Verify each node in the chain has the FK to link to the next
      const capability = InstitutionCapabilitySchema.safeParse({
        id: ID.capability, name: 'Test', organization_id: ID.org,
        status: 'verified', first_declared_at: NOW, created_at: NOW, updated_at: NOW,
      });
      expect(capability.success).toBe(true);

      const claim = ClaimSchema.safeParse({ ...validClaim(), source_event_id: ID.event });
      expect(claim.success).toBe(true);

      const evidenceLink = ClaimEvidenceLinkSchema.safeParse({
        claim_id: ID.claim,
        evidence_id: ID.evidence,
        relationship_type: 'SUPPORTS',
        tenant_id: ID.org,
        created_at: NOW,
      });
      expect(evidenceLink.success).toBe(true);

      const capClaimLink = CapabilityClaimLinkSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        capability_id: ID.capability,
        claim_id: ID.claim,
        relationship_type: 'primary',
        created_at: NOW,
      });
      expect(capClaimLink.success).toBe(true);
      // Full chain verified: Capability → Claim → Evidence ✓
    });

    it('Scenario 6: Expired Evidence → Capability reflects insufficiency — EvidenceSufficiency.expired is valid', () => {
      expect(EvidenceSufficiency.safeParse('expired').success).toBe(true);
      const result = InstitutionCapabilitySchema.safeParse({
        id: ID.capability,
        name: 'Expired Capability',
        organization_id: ID.org,
        status: 'declared',
        evidence_sufficiency: 'expired',
        claim_count: 1,
        first_declared_at: NOW,
        created_at: NOW,
        updated_at: NOW,
      });
      expect(result.success).toBe(true);
    });
  });
});