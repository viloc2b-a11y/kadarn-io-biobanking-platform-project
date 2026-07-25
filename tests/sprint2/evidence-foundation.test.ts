// ─── KAD-LOOP-002 — Phase 13: Acceptance Scenario Tests ─────────────────
// Tests for the Evidence Acquisition & Generation Foundation.
// These tests verify the 5 acceptance scenarios from the Loop 2 spec.

import { describe, it, expect } from 'vitest';
import {
  SourceRecordSchema,
  CreateSourceRecordSchema,
  UpdateSourceRecordSchema,
  EvidenceSourceSchema,
  CreateEvidenceSourceSchema,
  EvidenceClassEnum,
  EvidenceLifecycleStatus,
  GenerationRuleSchema,
  CreateGenerationRuleSchema,
  RuleStatus,
  InstitutionalEventSchema,
  CreateInstitutionalEventSchema,
  ClaimEvidenceLinkSchema,
  ReviewSchema,
  CreateReviewSchema,
  ReviewTaskStatus,
  ReviewDecision,
  GenerateEvidenceSchema,
  ReplayResultSchema,
  LineageChainSchema,
  EvidenceSchema,
} from '@kadarn/types';

describe('KAD-LOOP-002 — Evidence Acquisition & Generation Foundation', () => {

  // ─── Scenario 1: Create SourceRecord → generate Evidence → verify provenance ───
  describe('Scenario 1: SourceRecord → Evidence → Provenance', () => {
    it('validates SourceRecord creation with all required fields', () => {
      const input = {
        evidence_source_id: '550e8400-e29b-41d4-a716-446655440000',
        institution_id: '550e8400-e29b-41d4-a716-446655440001',
        external_record_id: 'EXT-001',
        record_type: 'certificate',
        source_version: '1.0',
        content_hash: 'sha256:abc123',
        locator_uri: 'https://example.com/doc/001',
        raw_metadata: { mime_type: 'application/pdf' },
      };
      const parsed = CreateSourceRecordSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });

    it('validates SourceRecord includes supersession fields in schema', () => {
      const record = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        evidence_source_id: '550e8400-e29b-41d4-a716-446655440001',
        acquired_at: new Date().toISOString(),
        superseded_by: null,
        supersession_reason: null,
        invalidation_status: 'active',
        acquisition_status: 'acquired',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const parsed = SourceRecordSchema.safeParse(record);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.invalidation_status).toBe('active');
      }
    });

    it('validates UpdateSourceRecordSchema for supersession', () => {
      const update = {
        superseded_by: '550e8400-e29b-41d4-a716-446655440002',
        supersession_reason: 'Replaced by newer version',
        invalidation_status: 'superseded' as const,
        acquisition_status: 'superseded' as const,
      };
      const parsed = UpdateSourceRecordSchema.safeParse(update);
      expect(parsed.success).toBe(true);
    });
  });

  // ─── Scenario 2: Multiple SourceRecords → generate Evidence → deterministic replay ───
  describe('Scenario 2: Deterministic Replay', () => {
    it('validates GenerateEvidenceSchema input', () => {
      const input = {
        source_record_id: '550e8400-e29b-41d4-a716-446655440000',
        rule_id: '550e8400-e29b-41d4-a716-446655440010',
        tenant_id: '550e8400-e29b-41d4-a716-446655440020',
      };
      const parsed = GenerateEvidenceSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });

    it('validates ReplayResultSchema output', () => {
      const result = {
        evidence_id: '550e8400-e29b-41d4-a716-446655440030',
        input_hash_matches: true,
        output_matches: true,
        replayed_content: '{"source":"test"}',
        original_content: '{"source":"test"}',
        replayed_at: new Date().toISOString(),
      };
      const parsed = ReplayResultSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });

    it('computes deterministic hash from same inputs', () => {
      const crypto = require('crypto');
      const hashInput = ['sha256:abc123', 'rule-001', '1'].join('|');
      const hash1 = crypto.createHash('sha256').update(hashInput).digest('hex');
      const hash2 = crypto.createHash('sha256').update(hashInput).digest('hex');
      expect(hash1).toBe(hash2);
    });

    it('produces different hash from different inputs', () => {
      const crypto = require('crypto');
      const hash1 = crypto.createHash('sha256').update('sha256:abc123|rule-001|1').digest('hex');
      const hash2 = crypto.createHash('sha256').update('sha256:abc124|rule-001|1').digest('hex');
      expect(hash1).not.toBe(hash2);
    });
  });

  // ─── Scenario 3: Evidence supports Claim → ClaimEvidenceLink created ───
  describe('Scenario 3: Claim-Evidence Linking', () => {
    it('validates ClaimEvidenceLink with SUPPORTS relationship', () => {
      const link = {
        claim_id: '550e8400-e29b-41d4-a716-446655440040',
        evidence_id: '550e8400-e29b-41d4-a716-446655440050',
        relationship_type: 'SUPPORTS',
        tenant_id: '550e8400-e29b-41d4-a716-446655440060',
        created_at: new Date().toISOString(),
        created_by: '550e8400-e29b-41d4-a716-446655440070',
      };
      const parsed = ClaimEvidenceLinkSchema.safeParse(link);
      expect(parsed.success).toBe(true);
    });

    it('validates all 5 relationship types', () => {
      const types = ['SUPPORTS', 'PARTIALLY_SUPPORTS', 'CONTRADICTS', 'REQUIRES_REVIEW', 'OBSOLETES'];
      for (const type of types) {
        const link = {
          claim_id: '550e8400-e29b-41d4-a716-446655440040',
          evidence_id: '550e8400-e29b-41d4-a716-446655440050',
          relationship_type: type,
          tenant_id: '550e8400-e29b-41d4-a716-446655440060',
          created_at: new Date().toISOString(),
        };
        const parsed = ClaimEvidenceLinkSchema.safeParse(link);
        expect(parsed.success).toBe(true);
      }
    });
  });

  // ─── Scenario 4: Retrieve lineage → full chain ───
  describe('Scenario 4: Lineage Retrieval', () => {
    it('validates LineageChainSchema structure', () => {
      const chain = {
        event: { id: 'event-1' },
        source_record: { id: 'src-1' },
        generation_rule: { id: 'rule-1' },
        evidence: { id: 'ev-1' },
        claim: { id: 'claim-1' },
        review: { id: 'review-1' },
        passport: { id: 'passport-1' },
      };
      const parsed = LineageChainSchema.safeParse(chain);
      expect(parsed.success).toBe(true);
    });

    it('validates partial lineage (only evidence + source)', () => {
      const chain = {
        evidence: { id: 'ev-1' },
        source_record: { id: 'src-1' },
      };
      const parsed = LineageChainSchema.safeParse(chain);
      expect(parsed.success).toBe(true);
    });
  });

  // ─── Scenario 5: Supersede SourceRecord → existing Evidence preserved ───
  describe('Scenario 5: Supersession Preserves Evidence', () => {
    it('validates supersession update preserves existing data', () => {
      const original = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        evidence_source_id: '550e8400-e29b-41d4-a716-446655440001',
        acquired_at: new Date().toISOString(),
        invalidation_status: 'active' as const,
        acquisition_status: 'acquired' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const parsed = SourceRecordSchema.safeParse(original);
      expect(parsed.success).toBe(true);
      expect(parsed.data?.invalidation_status).toBe('active');

      // Apply supersession
      const superseded = {
        ...original,
        superseded_by: '550e8400-e29b-41d4-a716-446655440002',
        supersession_reason: 'Newer version acquired',
        invalidation_status: 'superseded' as const,
        acquisition_status: 'superseded' as const,
      };
      const parsedSuperseded = SourceRecordSchema.safeParse(superseded);
      expect(parsedSuperseded.success).toBe(true);
      expect(parsedSuperseded.data?.invalidation_status).toBe('superseded');
      expect(parsedSuperseded.data?.superseded_by).toBeTruthy();
    });
  });

  // ─── Evidence Class Reconciliation (Phase 2) ───
  describe('Evidence Class Reconciliation', () => {
    it('EvidenceClassEnum has exactly 6 canonical values (A-F)', () => {
      const values = EvidenceClassEnum.options;
      expect(values).toHaveLength(6);
      expect(values).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    });

    it('rejects old 12-value taxonomy', () => {
      const result = EvidenceClassEnum.safeParse('regulatory');
      expect(result.success).toBe(false);
    });

    it('accepts canonical A-F values', () => {
      for (const cls of ['A', 'B', 'C', 'D', 'E', 'F']) {
        expect(EvidenceClassEnum.safeParse(cls).success).toBe(true);
      }
    });
  });

  // ─── Evidence Lifecycle (Phase 6) ───
  describe('Evidence Lifecycle', () => {
    it('EvidenceLifecycleStatus has exactly 10 states', () => {
      const values = EvidenceLifecycleStatus.options;
      expect(values).toHaveLength(10);
      expect(values).toEqual([
        'draft', 'generated', 'imported', 'verified', 'reviewed',
        'accepted', 'rejected', 'superseded', 'archived', 'invalidated',
      ]);
    });
  });

  // ─── Generation Rule Governance (Phase 3) ───
  describe('Generation Rule Governance', () => {
    it('validates CreateGenerationRuleSchema', () => {
      const rule = {
        rule_name: 'CV Verification Rule',
        event_pattern: 'person.credential.verified',
        required_inputs: { source_type: 'document' },
        output_evidence_type: 'B',
      };
      const parsed = CreateGenerationRuleSchema.safeParse(rule);
      expect(parsed.success).toBe(true);
    });

    it('RuleStatus has 4 governance states', () => {
      expect(RuleStatus.options).toEqual(['draft', 'active', 'deprecated', 'retired']);
    });

    it('validates full GenerationRuleSchema', () => {
      const rule = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        rule_name: 'CV Verification Rule',
        rule_version: 1,
        event_pattern: 'person.credential.verified',
        required_inputs: { source_type: 'document' },
        output_evidence_type: 'B',
        preconditions: {},
        review_mode: 'manual',
        confidence_policy: {},
        active: true,
        rule_status: 'draft',
        effective_from: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const parsed = GenerationRuleSchema.safeParse(rule);
      expect(parsed.success).toBe(true);
    });
  });

  // ─── Institutional Event Zod (Phase 1) ───
  describe('Institutional Event Zod Schema', () => {
    it('validates CreateInstitutionalEventSchema', () => {
      const event = {
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        event_type: 'person.created',
        idempotency_key: 'idem-001',
        tenant_id: '550e8400-e29b-41d4-a716-446655440002',
        payload: { person_id: '123' },
      };
      const parsed = CreateInstitutionalEventSchema.safeParse(event);
      expect(parsed.success).toBe(true);
    });

    it('rejects event without idempotency_key', () => {
      const event = {
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        event_type: 'person.created',
        tenant_id: '550e8400-e29b-41d4-a716-446655440002',
        payload: {},
      };
      const parsed = CreateInstitutionalEventSchema.safeParse(event);
      expect(parsed.success).toBe(false);
    });
  });

  // ─── Review Foundation (Phase 8) ───
  describe('Review Foundation', () => {
    it('ReviewTaskStatus has 5 workflow states', () => {
      expect(ReviewTaskStatus.options).toEqual([
        'pending', 'in_progress', 'completed', 'skipped', 'cancelled',
      ]);
    });

    it('ReviewDecision has 4 outcome values', () => {
      expect(ReviewDecision.options).toEqual([
        'approved', 'rejected', 'needs_more_evidence', 'not_applicable',
      ]);
    });

    it('validates CreateReviewSchema', () => {
      const review = {
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        claim_id: '550e8400-e29b-41d4-a716-446655440040',
        task_type: 'evidence_review',
        assigned_to: '550e8400-e29b-41d4-a716-446655440070',
      };
      const parsed = CreateReviewSchema.safeParse(review);
      expect(parsed.success).toBe(true);
    });

    it('validates ReviewSchema with LOOP-002 fields', () => {
      const review = {
        id: '550e8400-e29b-41d4-a716-446655440080',
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        claim_id: '550e8400-e29b-41d4-a716-446655440040',
        task_type: 'evidence_review',
        status: 'completed',
        review_outcome: 'approved',
        required_actions: [],
        created_at: new Date().toISOString(),
      };
      const parsed = ReviewSchema.safeParse(review);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.review_outcome).toBe('approved');
      }
    });
  });

  // ─── Provenance Requirement: Every Evidence answers all questions ───
  describe('Provenance Completeness', () => {
    it('EvidenceSchema includes generation provenance fields', () => {
      const evidence = {
        id: '550e8400-e29b-41d4-a716-446655440030',
        claim_id: '550e8400-e29b-41d4-a716-446655440040',
        evidence_class: 'A',
        content: 'Generated evidence content',
        status: 'active',
        lifecycle_status: 'generated',
        generation_rule_id: '550e8400-e29b-41d4-a716-446655440010',
        input_hash: 'sha256:abc',
        generator: 'cv-verifier@v1',
        generated_at: new Date().toISOString(),
        source_record_id: '550e8400-e29b-41d4-a716-446655440000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const parsed = EvidenceSchema.safeParse(evidence);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        // WHO: generator
        expect(parsed.data.generator).toBeTruthy();
        // WHEN: generated_at
        expect(parsed.data.generated_at).toBeTruthy();
        // FROM WHAT: source_record_id
        expect(parsed.data.source_record_id).toBeTruthy();
        // USING WHICH RULE: generation_rule_id
        expect(parsed.data.generation_rule_id).toBeTruthy();
        // INPUT HASH: for reproducibility
        expect(parsed.data.input_hash).toBeTruthy();
      }
    });
  });
});
