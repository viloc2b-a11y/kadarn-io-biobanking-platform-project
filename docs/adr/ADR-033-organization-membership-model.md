# ADR-033: Organization Membership Model

**Status:** Accepted  
**Date:** 2026-07-05  
**Deciders:** Kadarn Architecture  
**Program:** PCP-1.2 - Invitation & Membership Management  
**Related:** ADR-002, ADR-010, PCP-1.1 Identity & Workspace Provisioning, PCP-1.2 Membership Audit, PCP-1.2 Membership Specification

---

## Context

Kadarn is an organization-first platform. The Platform Constitution states that Organization is the persistent anchor and that effective permission is layered across auth, membership, RLS, policy evaluation, visibility rules, and projection filtering.

PCP-1.1 established organization-first onboarding:

```text
Supabase Auth user
  -> user_profiles
  -> organizations
  -> organization_memberships
  -> membership_roles
  -> organization_capabilities
  -> active_org_id
  -> workspace profile/navigation
```

PCP-1.2 audits found that Kadarn already has the correct foundation:

- `organizations` is the durable business actor and tenant anchor.
- `user_profiles` is linked 1:1 to Supabase Auth users.
- `organization_memberships` links users to organizations.
- `organization_roles` defines organization roles.
- `membership_roles` assigns roles to memberships.
- RLS helper functions and workspace APIs already resolve access through memberships.
- A user can belong to multiple organizations, but only one active organization context should be used per request/session.

The incomplete layer is membership management: invitations, acceptance, lifecycle, role changes, ownership transfer, suspension, removal, and audit requirements are not yet consistently modeled as one product and governance system.

Without a formal decision, Kadarn risks creating duplicate membership systems, treating users as standalone customers, bypassing `membership_roles`, trusting client-set `active_org_id`, or adding members outside a governed invitation flow.

---

## Decision

Organizations own memberships.

Users access Kadarn through memberships.

Permissions are resolved through memberships.

Memberships have lifecycle states.

Ownership is protected.

Invitations are the only supported mechanism for adding additional users after organization provisioning.

The organization membership model is:

```text
Organization
  -> Membership
  -> Role assignment
  -> Permission resolution
  -> Active workspace context
  -> Audit trail
```

The first user of an organization is created through the organization provisioning flow and becomes the first owner/admin according to the role model. Every later user joins that organization through an invitation or another explicitly governed membership expansion flow. There is no second public registration path for claiming or joining an existing organization.

---

## Ownership Model

Ownership is a protected product role on top of the organization role model. It must be represented through the canonical membership role assignment path, not by a separate user table or a flat membership role field.

Ownership rules:

- Every operational organization must have at least one active owner.
- Owner authority belongs to an active membership in that organization.
- Owner role assignment must use `membership_roles`.
- Removing, suspending, or downgrading the last active owner is forbidden.
- Ownership transfer must assign the new owner before changing the prior owner.
- Self-removal and self-downgrade are blocked when they would orphan the organization.
- Kadarn Platform recovery may restore ownership only through a privileged, audited internal workflow.
- Ownership does not bypass Policy Engine, RLS, Evidence Core visibility, sponsor portfolio scope, marketplace governance, or publication controls.

The product may present actor-specific labels such as Institution Owner or Sponsor Owner, but the architectural model remains organization membership plus role assignment.

---

## Invitation Model

Invitations are the only supported mechanism for adding users after organization provisioning.

Invitation exists to govern the transition from an external person or existing user profile into an organization membership. Invitation is not itself the durable access relationship; membership is.

The invitation model is:

```text
Owner/Admin
  -> creates invitation
  -> invitation sent
  -> invitee accepts
  -> membership becomes active
  -> roles become effective
  -> active organization can be selected
```

Invitation lifecycle states:

| State | Meaning |
|---|---|
| Created | Invitation intent exists but delivery has not been confirmed. |
| Sent | Invitation has been delivered or made available to the invitee. |
| Accepted | Invitee completed acceptance and membership activation can proceed. |
| Expired | Invitation was not accepted before expiration. |
| Cancelled | Authorized administrator revoked the invitation before acceptance. |

Implementation may use an invited `organization_memberships` row as the invitation record only when that is sufficient. Secure email acceptance, pre-account invites, resend, expiration, cancellation, and token validation may require a narrow invitation-token persistence layer. If such a layer is added, it must not replace `organization_memberships` as the source of truth for access.

---

## Membership Lifecycle

Memberships must have explicit lifecycle states.

Product lifecycle:

```text
Invited
  -> Pending Acceptance
  -> Active
  -> Suspended
  -> Active
  -> Removed
```

| State | Meaning | Access |
|---|---|---|
| Invited | Organization has initiated an invitation for a user or email address. | No workspace access. |
| Pending Acceptance | Invitee has started or can complete acceptance but has not finished activation. | No workspace access. |
| Active | User can access the organization according to roles, capabilities, policies, and visibility. | Workspace access allowed. |
| Suspended | User remains associated for history but is temporarily blocked. | No workspace access. |
| Removed | User no longer has organization access; history remains auditable. | No workspace access. |

Lifecycle rules:

- Only Active memberships can be selected as active organization context.
- Invited and Pending Acceptance memberships do not grant permissions.
- Suspended memberships do not grant permissions.
- Removed memberships are historical and do not grant permissions.
- Role assignments are effective only for Active memberships.
- Membership status changes must be auditable.

---

## Permissions

Permissions are resolved through membership, not through user identity alone.

Permission resolution order:

```text
Supabase Auth user
  -> user_profiles
  -> active organization membership
  -> membership_roles
  -> organization capabilities
  -> RLS helpers
  -> Policy Engine evaluation
  -> visibility/projection filtering
```

This means:

- A user with no active membership is not an organization workspace user.
- A user with memberships in multiple organizations must select one active organization context.
- Organization role checks must resolve from `membership_roles` and `organization_roles`.
- `kadarn_role` in user metadata is not a substitute for organization membership roles.
- `active_org_id` is a routing/session hint and must be validated against active membership before authorizing organization-scoped operations.
- Membership does not automatically grant Evidence Core access, sponsor passport access, marketplace publication, public profile visibility, or financial workflow authority.

---

## Security

Membership management is security-sensitive because it controls tenant access.

Security requirements:

- No membership-sensitive operation may rely only on client-set metadata.
- Active organization writes must be server-side and validate active membership.
- Invitations must be single-use if token-based acceptance is used.
- Invitation tokens must expire.
- Invitation tokens must not be stored or logged as reusable plaintext secrets.
- Expired or cancelled invitations cannot be accepted.
- Role requested at invite time must be validated again before activation.
- Users cannot self-escalate roles.
- Administrators cannot grant roles beyond their authority.
- The last active owner cannot be removed, suspended, or downgraded.
- Kadarn Platform roles cannot be granted through customer organization invitation flows.
- Invitation, acceptance, rejection, role change, suspension, reactivation, removal, and ownership transfer must be audited.

---

## Governance

Membership management is governed by organization state, membership state, role authority, and audit.

Governance rules:

- Active organizations may invite and manage members according to role permissions.
- Pending or Under Review organizations may invite only if onboarding policy allows it.
- Suspended organizations cannot invite or reactivate members except through governed recovery.
- Archived organizations cannot invite, reactivate, or change roles except for audit or recovery workflows.
- Platform recovery actions require Kadarn internal authorization and audit.
- Membership changes must not automatically publish data, enable marketplace visibility, add sponsor portfolio memberships, or expose evidence.
- Every membership mutation must produce an audit event with actor, organization, target, previous state, new state, reason, and correlation id.

---

## Relationship To Policy Engine

The Policy Engine evaluates membership-related decisions, but it does not replace membership as the source of truth.

Policy Engine may govern:

- Whether an organization may invite members in its current lifecycle state.
- Whether a role may be granted by the current actor.
- Whether ownership transfer requires additional approval.
- Whether suspended or under-review organizations can reactivate members.
- Whether Kadarn internal recovery is permitted.

Membership data is the factual input. Policy Engine provides decision logic and traceability.

---

## Relationship To Workspace

Workspace access is derived from active organization membership.

Workspace must resolve:

```text
active_org_id
  -> active organization_membership
  -> membership_roles
  -> organization_capabilities
  -> allowed applications/navigation
```

Workspace is not Organization. A user can belong to many organizations, and an organization can support multiple product surfaces. The active workspace context is a product view over one validated organization membership.

---

## Relationship To Evidence Core

Evidence Core remains the system of record for claims, evidence nodes, relationships, confidence state, and evidence lifecycle. Membership determines whether a user may reach organization-scoped evidence surfaces, but it does not change evidence truth.

Membership must not:

- Create claims.
- Publish claims.
- Modify evidence.
- Override evidence visibility.
- Grant sponsor access outside sponsor portfolio or policy scope.

Evidence Core access remains governed by RLS, policy, visibility, provenance, and evidence lifecycle controls.

---

## Relationship To Institution Portfolio

Institution Portfolio is an institution-owned workspace/profile surface over the organization anchor. Membership controls which institution users can administer, contribute to, or view institution workspace surfaces.

Membership does not automatically:

- Publish an institution profile.
- Enable marketplace listing.
- Share a sponsor passport.
- Promote discovery candidates into claims.
- Make continuity/site passport public.

Institution roles such as Owner, Administrator, Principal Investigator, Coordinator, Regulatory, Finance, Laboratory, Recruiter, and Read Only are product role labels mapped to canonical membership roles and permissions.

---

## Relationship To Sponsor Workspace

Sponsor Workspace is a sponsor organization surface. Sponsor membership controls who can access sponsor workspace functions, but sponsor access to institutions is still governed by sponsor portfolio scope and policy.

Sponsor membership does not automatically:

- Add institutions to a sponsor portfolio.
- Grant passport access to an institution.
- Enable private institution data access.
- Create marketplace requests.
- Authorize financial workflows.

Sponsor roles such as Owner, Administrator, Study Manager, Feasibility Manager, Portfolio Manager, Finance, and Read Only are product role labels mapped to canonical membership roles and permissions.

---

## Relationship To Platform Constitution

This ADR protects the Platform Constitution:

| Constitutional rule | Membership model alignment |
|---|---|
| Organization is the persistent anchor. | Membership belongs to Organization and grants organization access. |
| Portfolio defines access scope. | Sponsor membership does not bypass sponsor portfolio membership. |
| Policy governs visibility and operations. | Membership is factual input to RLS and Policy Engine decisions. |
| Projections are not sources of truth. | Workspace, passports, profiles, and dashboards are projections over governed source records. |
| Consolidation comes before expansion. | PCP-1.2 completes the existing membership model instead of adding duplicate permission systems. |

---

## Consequences

### Positive

- Membership becomes the single source of truth for organization access.
- Permissions are resolved consistently through membership roles.
- Multi-organization users remain supported without redesign.
- Invitations become governed and auditable.
- Ownership cannot be accidentally orphaned.
- Workspace, Policy Engine, Evidence Core, Sponsor Workspace, and Institution Portfolio all share one access foundation.

### Negative

- Membership management requires careful lifecycle and audit handling.
- Invitation acceptance may require narrowly scoped token persistence.
- Existing role drift must be consolidated incrementally.
- Client-side active org writes must be replaced or constrained by validated server paths.

### Neutral

- Product role names can differ by actor type, but persistence remains canonical.
- Kadarn Platform roles remain a separate governed internal role family.
- Existing RLS and route guards remain valid but must be consistently applied.

---

## What This ADR Does Not Do

- Does not implement invitation APIs.
- Does not add database tables.
- Does not alter enums.
- Does not change RLS policies.
- Does not define all role keys or permissions in schema form.
- Does not provision Kadarn Platform users.
- Does not enable marketplace visibility, passport sharing, or evidence publication.

---

## Dependencies

| Artifact | Relationship |
|---|---|
| `docs/adr/adr-002-multi-tenant-architecture.md` | Establishes shared database, RLS, organization memberships, roles, and audit foundation. |
| `docs/adr/adr-010-policy-engine.md` | Membership facts feed declarative policy decisions. |
| `docs/platform-discovery/kadarn-platform-constitution-v1.0.md` | Provides governing rules this ADR protects. |
| `docs/platform-discovery/pcp-1.1-identity-provisioning-spec.md` | Establishes organization-first provisioning and first owner/admin model. |
| `docs/platform-discovery/pcp-1.2-membership-audit.md` | Current-state evidence for this ADR. |
| `docs/platform-discovery/pcp-1.2-membership-spec.md` | Product model this ADR ratifies architecturally. |

---

## Status

Accepted for PCP-1.2 implementation planning. Future implementation steps must preserve this ADR unless a later ADR explicitly supersedes it.
