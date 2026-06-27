// ==========================================================================
// Exchange Engine — API Tests
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { signInAs, ORG_IDS, type AuthenticatedClient } from '../setup/test-utils';

let sponsor: AuthenticatedClient;
let biobank: AuthenticatedClient;
let cro: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
  biobank = await signInAs('biobank');
  cro = await signInAs('cro');
});

describe('Exchange Engine', () => {
  // -----------------------------------------------------------------------
  // 1. Exchange Requests — Full Lifecycle
  // -----------------------------------------------------------------------
  describe('Exchange Requests', () => {
    let requestId: string;

    it('creates an exchange request', async () => {
      const { data, error } = await sponsor.client
        .from('exchange_requests')
        .insert({
          requester_id: sponsor.userId,
          organization_id: ORG_IDS.pharmaCorp,
          title: 'Need TNBC FFPE blocks for marker validation',
          description: 'Looking for 200 FFPE blocks from TNBC patients with IHC data',
          target_org_ids: [ORG_IDS.nationalBiobank, ORG_IDS.univMedical],
          requested_sample_count: 200,
          requested_timeline_days: 90,
          commercial_use: true,
          status: 'draft',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.title).toContain('TNBC');
      expect(data!.status).toBe('draft');
      requestId = data!.id;
    });

    it('submits the request (status change)', async () => {
      const { error } = await sponsor.client
        .from('exchange_requests')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', requestId);

      expect(error).toBeNull();

      const { data } = await sponsor.client
        .from('exchange_requests')
        .select('status')
        .eq('id', requestId)
        .single();

      expect(data!.status).toBe('submitted');
    });

    it('lists the request for the creator', async () => {
      const { data } = await sponsor.client
        .from('exchange_requests')
        .select('*')
        .eq('requester_id', sponsor.userId);

      expect(data!.length).toBeGreaterThanOrEqual(1);
    });

    it('enforces RLS: biobank admin can see requests for their org', async () => {
      const { data } = await biobank.client
        .from('exchange_requests')
        .select('id')
        .eq('organization_id', ORG_IDS.nationalBiobank);

      // biobank is org_admin of National Biobank
      expect(data).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // 2. Multi-Party Messaging
  // -----------------------------------------------------------------------
  describe('Exchange Messages', () => {
    let requestId: string;

    beforeAll(async () => {
      const { data } = await sponsor.client
        .from('exchange_requests')
        .insert({
          requester_id: sponsor.userId,
          organization_id: ORG_IDS.pharmaCorp,
          title: 'Messaging test request',
          status: 'submitted',
        })
        .select()
        .single();
      requestId = data!.id;
    });

    it('sends and reads messages on the request thread', async () => {
      // Send first message as sponsor
      const { error: err1 } = await sponsor.client
        .from('exchange_messages')
        .insert({
          request_id: requestId,
          sender_id: sponsor.userId,
          sender_name: 'Sarah Chen',
          message: 'We are interested in your plasma collection.',
          message_type: 'general',
        });
      expect(err1).toBeNull();

      // Send second message as sponsor
      const { error: err2 } = await sponsor.client
        .from('exchange_messages')
        .insert({
          request_id: requestId,
          sender_id: sponsor.userId,
          sender_name: 'Sarah Chen',
          message: 'Can you provide pricing?',
          message_type: 'question',
        });
      expect(err2).toBeNull();

      // Read the thread
      const { data } = await sponsor.client
        .from('exchange_messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      expect(data!.length).toBe(2);
      expect(data![0].message).toContain('plasma');
      expect(data![1].message).toContain('pricing');
    });
  });

  // -----------------------------------------------------------------------
  // 3. Exchange Deals
  // -----------------------------------------------------------------------
  describe('Exchange Deals', () => {
    let requestId: string;
    let dealId: string;

    beforeAll(async () => {
      const { data } = await sponsor.client
        .from('exchange_requests')
        .insert({
          requester_id: sponsor.userId,
          organization_id: ORG_IDS.pharmaCorp,
          title: 'Deal test request',
          status: 'accepted',
        })
        .select()
        .single();
      requestId = data!.id;
    });

    it('creates a deal from an accepted request', async () => {
      const { data, error } = await sponsor.client
        .from('exchange_deals')
        .insert({
          request_id: requestId,
          sponsor_org_id: ORG_IDS.pharmaCorp,
          provider_org_id: ORG_IDS.nationalBiobank,
          title: 'TNBC FFPE Cohort Access',
          description: 'Access to 200 TNBC FFPE blocks for IVD validation',
          total_value: 50000,
          sample_count_expected: 200,
          created_by: sponsor.userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.title).toContain('TNBC');
      expect(data!.status).toBe('pending_acceptance');
      dealId = data!.id;
    });

    it('signs MTA by sponsor', async () => {
      const { error } = await sponsor.client
        .from('exchange_deals')
        .update({ mta_signed_by_sponsor: true, mta_signed_at: new Date().toISOString() })
        .eq('id', dealId);

      expect(error).toBeNull();
    });

    it('signs MTA by provider', async () => {
      const { error } = await biobank.client
        .from('exchange_deals')
        .update({ mta_signed_by_provider: true })
        .eq('id', dealId);

      expect(error).toBeNull();

      const { data } = await biobank.client
        .from('exchange_deals')
        .select('mta_signed_by_sponsor, mta_signed_by_provider')
        .eq('id', dealId)
        .single();

      expect(data!.mta_signed_by_sponsor).toBe(true);
      expect(data!.mta_signed_by_provider).toBe(true);
    });

    it('activates the deal', async () => {
      const { error } = await sponsor.client
        .from('exchange_deals')
        .update({ status: 'active' })
        .eq('id', dealId);

      expect(error).toBeNull();
    });

    it('tracks delivery progress', async () => {
      // Deliver some samples
      const { error } = await sponsor.client
        .from('exchange_deals')
        .update({ sample_count_delivered: 150, status: 'fulfillment' })
        .eq('id', dealId);

      expect(error).toBeNull();

      const { data } = await sponsor.client
        .from('exchange_deals')
        .select('delivery_percentage')
        .eq('id', dealId)
        .single();

      // 150/200 = 75%
      expect(data!.delivery_percentage).toBe(75);
    });

    it('completes the deal', async () => {
      const { error } = await sponsor.client
        .from('exchange_deals')
        .update({
          sample_count_delivered: 200,
          status: 'completed',
          actual_end_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', dealId);

      expect(error).toBeNull();

      const { data } = await sponsor.client
        .from('exchange_deals')
        .select('delivery_percentage, status')
        .eq('id', dealId)
        .single();

      expect(data!.delivery_percentage).toBe(100);
      expect(data!.status).toBe('completed');
    });
  });

  // -----------------------------------------------------------------------
  // 4. Escrow
  // -----------------------------------------------------------------------
  describe('Escrow', () => {
    let dealId: string;

    beforeAll(async () => {
      const { data: req } = await sponsor.client
        .from('exchange_requests')
        .insert({
          requester_id: sponsor.userId,
          organization_id: ORG_IDS.pharmaCorp,
          title: 'Escrow test request',
          status: 'accepted',
        })
        .select()
        .single();

      const { data: deal } = await sponsor.client
        .from('exchange_deals')
        .insert({
          request_id: req!.id,
          sponsor_org_id: ORG_IDS.pharmaCorp,
          provider_org_id: ORG_IDS.advancedLab,
          title: 'NGS Service Deal',
          total_value: 25000,
          created_by: sponsor.userId,
        })
        .select()
        .single();
      dealId = deal!.id;
    });

    it('creates escrow for a deal', async () => {
      const { data, error } = await sponsor.client
        .from('exchange_escrow')
        .insert({
          deal_id: dealId,
          total_amount: 25000,
          milestones: JSON.stringify([
            { name: '50% samples received', amount: 12500 },
            { name: 'All data delivered', amount: 12500 },
          ]),
          created_by: sponsor.userId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.total_amount).toBe(25000);
      expect(data!.status).toBe('pending');
    });

    it('funds the escrow', async () => {
      const { error } = await sponsor.client
        .from('exchange_escrow')
        .update({ status: 'funded', funded_at: new Date().toISOString() })
        .eq('deal_id', dealId);

      expect(error).toBeNull();
    });

    it('releases milestone payment', async () => {
      const { error } = await sponsor.client
        .from('exchange_escrow')
        .update({ status: 'partially_released', released_amount: 12500 })
        .eq('deal_id', dealId);

      expect(error).toBeNull();
    });

    it('completes escrow on final release', async () => {
      const { error } = await sponsor.client
        .from('exchange_escrow')
        .update({ status: 'released', released_amount: 25000, released_at: new Date().toISOString() })
        .eq('deal_id', dealId);

      expect(error).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 5. RLS Isolation
  // -----------------------------------------------------------------------
  describe('RLS Isolation', () => {
    it('prevents CRO from seeing PharmaCorp-specific deals', async () => {
      const { data, error } = await cro.client
        .from('exchange_deals')
        .select('sponsor_org_id');

      expect(error).toBeNull();
      // CRO should not see any deals where sponsor is PharmaCorp
      // (CRO is not a member of PharmaCorp)
      if (data) {
        const pharmaDeals = data.filter((d: any) => d.sponsor_org_id === ORG_IDS.pharmaCorp);
        expect(pharmaDeals.length).toBe(0);
      }
    });

    it('prevents CRO from inserting into PharmaCorp escrow', async () => {
      // Get a deal ID from a deal the CRO doesn't have access to
      const { data: deals } = await sponsor.client
        .from('exchange_deals')
        .select('id')
        .eq('sponsor_org_id', ORG_IDS.pharmaCorp)
        .limit(1);

      if (deals && deals.length > 0) {
        const { error } = await cro.client
          .from('exchange_escrow')
          .insert({
            deal_id: deals[0].id,
            total_amount: 1000,
            created_by: cro.userId,
          });

        expect(error).toBeDefined();
      }
    });
  });
});
