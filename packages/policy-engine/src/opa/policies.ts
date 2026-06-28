// ==========================================================================
// Kadarn Policy Engine — Shadow Mode Policy Definitions
// ==========================================================================
// KAA-001 §4 (Scope of Authority), §9 (Ownership Boundaries)
//
// Each policy is defined in two forms:
//   1. JSON condition tree — evaluated by the local Kadarn engine
//   2. Rego source — reference for future OPA server deployment
//
// These are the Shadow Mode starter policies. Each represents an existing
// authorization rule that Kadarn currently enforces via RLS or inline checks.
// OPA evaluates the same rule in parallel to build convergence evidence.
// ==========================================================================

import type { PolicyDefinition } from './types';

// --------------------------------------------------------------------------
// Policy: organization.membership
// --------------------------------------------------------------------------
// Mirrors existing RLS: an actor can access an org's data only if they are
// an active member of that organization.
//
// Rego equivalent:
//   package kadarn.organization
//
//   default allow := false
//
//   allow {
//     input.actor.role == "kadarn_internal"
//   }
//
//   allow {
//     input.organization.membership_status == "active"
//   }
// --------------------------------------------------------------------------

export const organizationMembershipPolicy: PolicyDefinition = {
  id: 'organization.membership',
  name: 'Organization Membership',
  description: 'Actor must have active membership in the target organization, or be kadarn_internal',
  version: '0.1.0',
  rego: `package kadarn.organization

default allow := false

allow {
  input.actor.role == "kadarn_internal"
}

allow {
  input.organization.membership_status == "active"
}`,
  conditions: {
    any: [
      { eq: [{ var: 'actor.role' }, 'kadarn_internal'] },
      { eq: [{ var: 'organization.membership_status' }, 'active'] },
    ],
  },
  effect: 'allow',
  reason: 'Actor must have active organization membership or be kadarn_internal',
  defaultDeny: true,
  denyReason: 'Actor lacks active membership and is not kadarn_internal',
  resourceTypes: ['organization'],
};

// --------------------------------------------------------------------------
// Policy: program.visibility
// --------------------------------------------------------------------------
// Mirrors existing RLS: an actor can see a program only if their org is
// the sponsor or a participant, or the program is public.
//
// Rego equivalent:
//   package kadarn.program
//
//   default allow := false
//
//   allow {
//     input.program.visibility == "public"
//   }
//
//   allow {
//     input.program.sponsor_org_id == input.organization.id
//   }
//
//   allow {
//     input.program.participant_org_ids[_] == input.organization.id
//   }
// --------------------------------------------------------------------------

export const programVisibilityPolicy: PolicyDefinition = {
  id: 'program.visibility',
  name: 'Program Visibility',
  description: 'Actor can view a program if it is public, their org sponsors it, or their org participates',
  version: '0.1.0',
  rego: `package kadarn.program

default allow := false

allow {
  input.program.visibility == "public"
}

allow {
  input.program.sponsor_org_id == input.organization.id
}

allow {
  some i
  input.program.participant_org_ids[i] == input.organization.id
}`,
  conditions: {
    any: [
      { eq: [{ var: 'program.visibility' }, 'public'] },
      { eq: [{ var: 'program.sponsor_org_id' }, { var: 'organization.id' }] },
      { in: [{ var: 'organization.id' }, { var: 'program.participant_org_ids' }] },
    ],
  },
  effect: 'allow',
  reason: 'Program is visible to the actor per visibility rules',
  defaultDeny: true,
  denyReason: 'Program is not visible to the actor',
  resourceTypes: ['program'],
};

// --------------------------------------------------------------------------
// Default policies — loaded when OPA_SHADOW_MODE=true
// --------------------------------------------------------------------------

export const DEFAULT_POLICIES: PolicyDefinition[] = [
  organizationMembershipPolicy,
  programVisibilityPolicy,
];
