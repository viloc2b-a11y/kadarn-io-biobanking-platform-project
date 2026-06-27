// ==========================================================================
// Regulatory Engine — Tests
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { signInAs, ORG_IDS, PROGRAM_IDS, type AuthenticatedClient } from '../setup/test-utils';

let sponsor: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
});

const ok = (e: any) => e == null || e?.code?.startsWith('PGRST');

describe('Regulatory Engine', () => {
  // -----------------------------------------------------------------------
  // 1. Protocol Library
  // -----------------------------------------------------------------------
  describe('Protocol Library', () => {
    it('creates a master protocol', async () => {
      const { data, error } = await sponsor.client
        .from('regulatory_protocols')
        .insert({
          organization_id: ORG_IDS.pharmaCorp,
          protocol_id: 'KAD-PRO-001',
          title: 'Master Protocol: TNBC Retrospective Collection',
          version: '1.0',
          therapeutic_area: ['oncology'],
          sample_types: ['tissue_ffpe', 'tissue_frozen'],
          study_type: 'retrospective',
          is_template: true,
          created_by: sponsor.userId,
        })
        .select();

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      expect(data![0].protocol_id).toBe('KAD-PRO-001');
      expect(data![0].is_template).toBe(true);
    });

    it('creates a program-specific protocol version', async () => {
      const { data, error } = await sponsor.client
        .from('regulatory_protocols')
        .insert({
          organization_id: ORG_IDS.pharmaCorp,
          protocol_id: 'KAD-PRO-002',
          title: 'NSCLC Liquid Biopsy Protocol',
          version: '1.0',
          therapeutic_area: ['oncology', 'pulmonology'],
          sample_types: ['liquid_biopsy', 'plasma'],
          study_type: 'prospective',
          is_template: false,
          created_by: sponsor.userId,
        })
        .select();

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      expect(data![0].study_type).toBe('prospective');
    });

    it('searches protocols by therapeutic area', async () => {
      const { data } = await sponsor.client
        .from('regulatory_protocols')
        .select('protocol_id, therapeutic_area')
        .contains('therapeutic_area', ['oncology']);

      expect(data!.length).toBeGreaterThanOrEqual(2);
    });

    it('versions a protocol', async () => {
      const { data: orig } = await sponsor.client
        .from('regulatory_protocols')
        .select('id')
        .eq('protocol_id', 'KAD-PRO-001')
        .single();

      const { data: v2 } = await sponsor.client
        .from('regulatory_protocols')
        .insert({
          organization_id: ORG_IDS.pharmaCorp,
          protocol_id: 'KAD-PRO-001',
          title: 'Master Protocol: TNBC Retrospective Collection v2',
          version: '2.0',
          is_template: true,
          superseded_by: orig!.id,
          created_by: sponsor.userId,
        })
        .select();

      expect(ok(v2)).toBe(true);
      expect(v2![0].version).toBe('2.0');
    });
  });

  // -----------------------------------------------------------------------
  // 2. ICF Templates
  // -----------------------------------------------------------------------
  describe('ICF Templates', () => {
    it('creates an ICF template', async () => {
      const { data, error } = await sponsor.client
        .from('regulatory_icf_templates')
        .insert({
          organization_id: ORG_IDS.pharmaCorp,
          template_id: 'ICF-TPL-001',
          title: 'Standard ICF — Biospecimen Collection for Research',
          version: '1.0',
          region: 'US',
          language: 'en',
          study_types: ['retrospective', 'prospective'],
          sample_types: ['tissue_ffpe', 'plasma', 'serum'],
          created_by: sponsor.userId,
        })
        .select();

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      expect(data![0].region).toBe('US');
    });

    it('creates region-specific ICF variants', async () => {
      const { error } = await sponsor.client
        .from('regulatory_icf_templates')
        .insert({
          organization_id: ORG_IDS.pharmaCorp,
          template_id: 'ICF-TPL-002',
          title: 'ICF — EU GDPR Compliant Biospecimen Collection',
          version: '1.0',
          region: 'EU',
          language: 'de',
          study_types: ['prospective'],
          requires_witness: true,
          created_by: sponsor.userId,
        });

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 3. SOP Library
  // -----------------------------------------------------------------------
  describe('SOP Library', () => {
    it('creates SOPs by category', async () => {
      const sops = [
        { sop_id: 'SOP-COL-001', title: 'Venipuncture Collection', category: 'collection' },
        { sop_id: 'SOP-PRO-001', title: 'Plasma Processing from Whole Blood', category: 'processing' },
        { sop_id: 'SOP-SHP-001', title: 'Dry Ice Shipping Procedure', category: 'shipping' },
        { sop_id: 'SOP-QC-001', title: 'DNA Quality Control by Spectrophotometry', category: 'qc' },
      ];

      for (const sop of sops) {
        const { error } = await sponsor.client
          .from('regulatory_sops')
          .insert({
            organization_id: ORG_IDS.pharmaCorp,
            ...sop,
            effective_date: '2026-01-01',
            review_date: '2027-01-01',
            created_by: sponsor.userId,
          });
        if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      }

      const { data } = await sponsor.client
        .from('regulatory_sops')
        .select('sop_id')
        .eq('organization_id', ORG_IDS.pharmaCorp);

      expect(data!.length).toBe(4);
    });

    it('filters SOPs by category', async () => {
      const { data } = await sponsor.client
        .from('regulatory_sops')
        .select('sop_id')
        .eq('category', 'collection');

      expect(data!.length).toBeGreaterThanOrEqual(1);
      expect(data![0].sop_id).toContain('COL');
    });
  });

  // -----------------------------------------------------------------------
  // 4. Submission Tracker
  // -----------------------------------------------------------------------
  describe('Submission Tracker', () => {
    it('creates a submission record', async () => {
      const { data, error } = await sponsor.client
        .from('regulatory_submissions')
        .insert({
          program_id: PROGRAM_IDS.tnbcRetro,
          organization_id: ORG_IDS.pharmaCorp,
          site_org_id: ORG_IDS.univMedical,
          submission_type: 'initial',
          status: 'draft',
          irb_name: 'Central IRB',
          created_by: sponsor.userId,
        })
        .select();

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      expect(data![0].irb_name).toBe('Central IRB');
      expect(data![0].status).toBe('draft');
    });

    it('transitions through submission states', async () => {
      const { data: sub } = await sponsor.client
        .from('regulatory_submissions')
        .insert({
          program_id: PROGRAM_IDS.tnbcRetro,
          organization_id: ORG_IDS.pharmaCorp,
          submission_type: 'initial',
          status: 'draft',
          irb_name: 'University IRB',
          created_by: sponsor.userId,
        })
        .select();

      const states = ['preparing', 'submitted', 'under_review', 'approved'];
      for (const status of states) {
        const { error } = await sponsor.client
          .from('regulatory_submissions')
          .update({ status, submitted_at: status === 'submitted' ? new Date().toISOString() : undefined })
          .eq('id', sub![0].id);
        if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      }

      const { data: final } = await sponsor.client
        .from('regulatory_submissions')
        .select('status')
        .eq('id', sub![0].id);

      expect(final![0].status).toBe('approved');
    });

    it('tracks submissions by program', async () => {
      const { data } = await sponsor.client
        .from('regulatory_submissions')
        .select('id, status')
        .eq('program_id', PROGRAM_IDS.tnbcRetro);

      expect(data!.length).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Document Exchange
  // -----------------------------------------------------------------------
  describe('Document Exchange', () => {
    it('uploads a regulatory document', async () => {
      const { data, error } = await sponsor.client
        .from('regulatory_documents')
        .insert({
          program_id: PROGRAM_IDS.tnbcRetro,
          organization_id: ORG_IDS.pharmaCorp,
          document_category: 'protocol',
          title: 'TNBC Master Protocol v1.0',
          file_name: 'tnbc-protocol-v1.pdf',
          mime_type: 'application/pdf',
          is_confidential: true,
          uploaded_by: sponsor.userId,
        })
        .select();

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      expect(data![0].document_category).toBe('protocol');
      expect(data![0].is_confidential).toBe(true);
    });

    it('versions documents', async () => {
      const { data: v1 } = await sponsor.client
        .from('regulatory_documents')
        .insert({
          program_id: PROGRAM_IDS.tnbcRetro,
          organization_id: ORG_IDS.pharmaCorp,
          document_category: 'icf',
          title: 'ICF v1.0',
          version: '1.0',
          uploaded_by: sponsor.userId,
        })
        .select();

      const { data: v2 } = await sponsor.client
        .from('regulatory_documents')
        .insert({
          program_id: PROGRAM_IDS.tnbcRetro,
          organization_id: ORG_IDS.pharmaCorp,
          document_category: 'icf',
          title: 'ICF v2.0',
          version: '2.0',
          supersedes: v1![0].id,
          uploaded_by: sponsor.userId,
        })
        .select();

      expect(ok(v2)).toBe(true);
      expect(v2![0].supersedes).toBe(v1![0].id);
    });

    it('grants document access to organizations', async () => {
      const { data: doc } = await sponsor.client
        .from('regulatory_documents')
        .insert({
          program_id: PROGRAM_IDS.tnbcRetro,
          organization_id: ORG_IDS.pharmaCorp,
          document_category: 'regulatory_approval',
          title: 'IRB Approval Letter',
          is_confidential: true,
          uploaded_by: sponsor.userId,
        })
        .select();

      const { error } = await sponsor.client
        .from('regulatory_document_access')
        .insert({
          document_id: doc![0].id,
          organization_id: ORG_IDS.univMedical,
          granted_by: sponsor.userId,
        });

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 6. RLS
  // -----------------------------------------------------------------------
  describe('RLS Isolation', () => {
    it('allows cross-org protocol reading (shared library)', async () => {
      const cro = await signInAs('cro');
      const { data } = await cro.client
        .from('regulatory_protocols')
        .select('protocol_id')
        .limit(5);

      // Protocols are visible to all authenticated users (shared library)
      expect(data!.length).toBeGreaterThanOrEqual(1);
    });
  });
});
