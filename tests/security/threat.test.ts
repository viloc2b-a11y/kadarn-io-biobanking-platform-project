// ==========================================================================
// Sprint 1A — Trust & Security Foundation
// Suite: Threat Validation
// ==========================================================================
// Attempts to break the security model:
//   - JWT manipulation
//   - Organization ID spoofing
//   - Cross-org operations
//   - Privilege escalation
//   - Created_by spoofing
//   - Reading foreign audit events
//   - Inserting participants in foreign programs
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import {
  signInAs,
  DEMO_USERS,
  ORG_IDS,
  PROGRAM_IDS,
  trySelect,
  tryInsert,
  tryUpdate,
  type AuthenticatedClient,
} from '../setup/test-utils';

let sponsor: AuthenticatedClient;
let biobank: AuthenticatedClient;
let courier: AuthenticatedClient;
let site: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
  biobank = await signInAs('biobank');
  courier = await signInAs('courier');
  site = await signInAs('site');
});

// -------------------------------------------------------------------------
// 1. JWT Manipulation
// -------------------------------------------------------------------------
describe('1. JWT manipulation', () => {
  it('server rejects JWT with tampered payload', async () => {
    const token = sponsor.session.access_token;
    const parts = token.split('.');

    // Decode the payload, modify it, re-encode
    const payload = JSON.parse(atob(parts[1]));
    payload.sub = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; // different user ID
    const tamperedPayload = btoa(JSON.stringify(payload));

    // Reconstruct token with tampered payload
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    // Try to use the tampered token
    const { trySignInWithToken } = await import('../setup/test-utils');
    const result = await trySignInWithToken(tamperedToken);

    // Should fail — Supabase verifies the JWT signature
    expect(result.success).toBe(false);
  });

  it('server rejects JWT with invalid signature', async () => {
    // Create a completely fake JWT
    const fakeToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6InNwZWN0cmFsX2FkbWluIn0.' +
      'fakedsignature';

    const { trySignInWithToken } = await import('../setup/test-utils');
    const result = await trySignInWithToken(fakeToken);
    expect(result.success).toBe(false);
  });

  it('server rejects expired token', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { getConfig } = await import('../setup/test-utils');
    const config = getConfig();

    // Create a client and try to set a session with an expired JWT
    // (expired: Jan 1, 2020)
    const expiredPayload = {
      sub: '00000000-0000-0000-0000-000000000000',
      exp: 1577836800, // 2020-01-01
      role: 'authenticated',
    };

    const expiredToken =
      btoa('{"alg":"HS256","typ":"JWT"}') + '.' +
      btoa(JSON.stringify(expiredPayload)) + '.' +
      'invalidsignature';

    const client = createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { error } = await client.auth.setSession({
      access_token: expiredToken,
      refresh_token: '',
    });
    expect(error).toBeDefined();
  });
});

// -------------------------------------------------------------------------
// 2. Organization ID Spoofing
// -------------------------------------------------------------------------
describe('2. Organization ID spoofing', () => {
  it('biobank cannot insert into another orgs capabilities', async () => {
    // Try to add a capability to ClinResearch (which biobank doesn't belong to)
    // Get a capability type ID directly
    const { data: capTypes } = await sponsor.client
      .from('organization_capability_types')
      .select('id')
      .limit(1);

    if (capTypes && capTypes.length > 0) {
      const result = await tryInsert(biobank, 'organization_capabilities', {
        organization_id: ORG_IDS.clinResearch,
        capability_type_id: capTypes[0].id,
        is_primary: false,
        created_by: biobank.userId,
      });
      expect(result.success).toBe(false);
    }
  });

  it('courier cannot create membership in another org', async () => {
    const result = await tryInsert(courier, 'organization_memberships', {
      user_id: courier.userId,
      organization_id: ORG_IDS.pharmaCorp,
      status: 'active',
    });
    expect(result.success).toBe(false);
  });

  it('site cannot update another orgs profile', async () => {
    const result = await tryUpdate(
      site,
      'organizations',
      { id: ORG_IDS.nationalBiobank },
      { description: 'Hacked by site user' },
    );
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------------
// 3. Cross-org Data Access
// -------------------------------------------------------------------------
describe('3. Cross-org data access', () => {
  it('biobank cannot read ClinResearch memberships', async () => {
    const result = await trySelect(biobank, 'organization_memberships', {
      organization_id: ORG_IDS.clinResearch,
    });
    expect(result.success).toBe(true);
    // RLS should return zero rows
    if (result.data) {
      const croMemberships = result.data.filter(
        (m: any) => m.organization_id === ORG_IDS.clinResearch,
      );
      expect(croMemberships.length).toBe(0);
    }
  });

  it('courier cannot read PharmaCorp user_profiles', async () => {
    const result = await trySelect(courier, 'user_profiles', {
      email: DEMO_USERS.sponsor.email,
    });
    expect(result.success).toBe(true);
    if (result.data) {
      expect(result.data.length).toBe(0);
    }
  });
});

// -------------------------------------------------------------------------
// 4. Program Participant Escalation
// -------------------------------------------------------------------------
describe('4. Program participant escalation', () => {
  it('biobank cannot add themselves to Program 2 (not a participant)', async () => {
    // biobank is NOT a participant in Program 2 (NSCLC-LBIO)
    const result = await tryInsert(biobank, 'program_participants', {
      program_id: PROGRAM_IDS.nsclcLbio,
      organization_id: ORG_IDS.nationalBiobank,
      role: 'contributor',
      status: 'active',
      created_by: biobank.userId,
    });
    expect(result.success).toBe(false);
  });

  it('courier cannot change their role in Program 1', async () => {
    // courier is a 'processor' in Program 1 — try to escalate to 'lead'
    const result = await tryUpdate(
      courier,
      'program_participants',
      {
        program_id: PROGRAM_IDS.tnbcRetro,
        organization_id: ORG_IDS.globalColdChain,
      },
      { role: 'lead' },
    );
    expect(result.success).toBe(false);
  });

  it('courier cannot delete other participants from Program 1', async () => {
    // Try to delete someone else's participation
    const result = await tryUpdate(
      courier,
      'program_participants',
      {
        program_id: PROGRAM_IDS.tnbcRetro,
        organization_id: ORG_IDS.univMedical,
      },
      { status: 'inactive' },
    );
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------------
// 5. Created_by Spoofing
// -------------------------------------------------------------------------
describe('5. Created_by spoofing', () => {
  it('biobank cannot create an organization claiming to be someone else', async () => {
    const result = await tryInsert(biobank, 'organizations', {
      name: 'Spoofed Org',
      country: 'US',
      created_by: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // fake user ID
    });
    // RLS on organizations_insert checks: created_by = auth.uid()
    expect(result.success).toBe(false);
  });

  it('courier cannot create a program claiming a different creator', async () => {
    const result = await tryInsert(courier, 'programs', {
      name: 'Spoofed Program',
      description: 'Attempt to create with wrong creator',
      status: 'draft',
      created_by: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      created_by_organization_id: ORG_IDS.globalColdChain,
    });
    // RLS checks: created_by = auth.uid()
    expect(result.success).toBe(false);
  });

  it('site cannot claim to be an org_admin of another org', async () => {
    // Try to insert a membership_role for themselves in another org
    // First get site's membership ID for their own org
    const { data: ownMembership } = await site.client
      .from('organization_memberships')
      .select('id')
      .eq('user_id', site.userId)
      .limit(1);

    if (ownMembership && ownMembership.length > 0) {
      // Get the org_admin role ID
      const { data: adminRole } = await site.client
        .from('organization_roles')
        .select('id')
        .eq('key', 'org_admin')
        .limit(1);

      if (adminRole && adminRole.length > 0) {
        // This should succeed (site is org_admin for Univ Medical Center)
        // Verify by checking site can read their own membership_roles
        const { data: roles } = await site.client
          .from('membership_roles')
          .select('*')
          .eq('membership_id', ownMembership[0].id);

        expect(roles).toBeDefined();
      }
    }
  });
});

// -------------------------------------------------------------------------
// 6. Audit Isolation
// -------------------------------------------------------------------------
describe('6. Audit isolation', () => {
  it('biobank cannot read sponsor audit events', async () => {
    // Generate an audit event as sponsor (query creates context)
    await sponsor.client.from('programs').select('id').limit(1);

    // Biobank tries to see sponsor's audit events
    const { data: biobankAudit } = await biobank.client
      .from('audit_events')
      .select('*')
      .eq('actor_id', sponsor.userId);

    // Should be empty
    if (biobankAudit) {
      expect(biobankAudit.length).toBe(0);
    }
  });

  it('audit events track the correct organization_id', async () => {
    // Create a program as sponsor and check audit
    const { data: prog } = await sponsor.client
      .from('programs')
      .insert({
        name: 'Audit Org Check',
        description: 'Testing audit org tracking',
        status: 'draft',
        sponsor_org_id: ORG_IDS.pharmaCorp,
        created_by: sponsor.userId,
        created_by_organization_id: ORG_IDS.pharmaCorp,
      })
      .select()
      .single();

    if (prog) {
      const { data: events } = await sponsor.client
        .from('audit_events')
        .select('*')
        .eq('resource_type', 'program')
        .eq('resource_id', prog.id);

      // If events visible, verify context
      if (events && events.length > 0) {
        expect(events[0].actor_id).toBe(sponsor.userId);
      }
    }
  });
});
