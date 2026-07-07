# PCP-1.2 Invitation and Membership Management Audit

**Program:** Kadarn Platform Consolidation - PCP  
**Phase:** PCP-1.2  
**Step:** 1 - Current State Audit  
**Mode:** Discovery only. No code changes.  
**Objective:** Determine how memberships, invitations, organization users, roles, permissions, active organization, workspace selection, organization administration, and audit logging currently work.

## Executive Verdict

Kadarn already has the right membership foundation for PCP-1.2. The durable access model is `user_profiles` plus `organization_memberships`, `organization_roles`, `membership_roles`, organization capabilities, active organization context, RLS helper functions, and route-level guards.

The current implementation is not yet a complete invitation and membership management system. It can represent multi-organization membership and active organization selection, and it has a partial invite endpoint. It does not yet have a governed invitation acceptance lifecycle, a dedicated invitation token model, complete owner semantics, consistent role assignment during invitation, or a complete organization administration surface.

PCP-1.2 should consolidate the existing model. It should not introduce a duplicate permission system, a duplicate organization-user table, or a separate actor-specific membership model.

## Governance Inputs

This audit follows:

- `docs/platform-discovery/kadarn-platform-constitution-v1.0.md`
- `docs/platform-discovery/knowledge-model.md`
- `docs/platform-discovery/canonical-platform-vocabulary.md`
- `docs/platform-discovery/pcp-1.1-identity-provisioning-audit.md`
- `docs/platform-discovery/pcp-1.1-identity-provisioning-spec.md`
- `docs/platform-discovery/pcp-1.1-identity-provisioning-implementation-plan.md`

Relevant governing rules:

1. Organization is the persistent anchor.
2. Membership is the user-to-organization access relationship.
3. Effective permission is layered across auth, membership, RLS, policy, visibility, and projection filtering.
4. `membership_roles` is the canonical organization role assignment path.
5. Every user operates in one active organization context at a time.
6. Multi-membership must remain compatible with the existing model.
7. Only the first user creates an organization; later users should join through invitation or another governed membership flow.
8. Workspace is not the same thing as Organization.
9. Audit must cover membership and administration changes.

## Current State Summary

| Area | Current state | Status |
|---|---|---|
| Membership model | `organization_memberships` links `auth.users` / `user_profiles` to `organizations`; a user can belong to multiple organizations. | Implemented |
| Invitation model | `membership_status` includes `invited`; one invite endpoint creates invited memberships for existing users. No dedicated invitation/token table found. | Partial |
| User model | Supabase Auth is identity source; `user_profiles` is 1:1 with auth users; signup trigger creates profiles. | Implemented |
| Organization model | `organizations` is the durable tenant/business actor; capabilities express actor type. | Implemented |
| Role model | `organization_roles` defines roles; `membership_roles` assigns roles to memberships; JWT `kadarn_role` is separate platform/session metadata. | Partial / inconsistent |
| Ownership | Product language uses first owner/admin; database has `org_admin` role but no distinct owner role or ownership transfer model. | Partial |
| Administration | Capability assignment has an admin-checking path; invite path exists but has role-check drift and no full member admin CRUD surface. | Partial |
| Lifecycle | Membership status enum supports `invited`, `active`, `suspended`, `inactive`; PCP-1.1 desired states are richer. | Partial |
| Active organization | `/api/v1/workspace/active-org` validates active membership before writing `active_org_id`. | Implemented |
| Workspace selection | Workspace profile detects multi-org users and returns `/auth/select-org`; no matching app route was found. | Partial |
| Audit logging | `audit_events` table and `emitAuditEvent` exist; active-org emits audit; invite/capability routes use console/domain event patterns inconsistently. | Partial |

## Membership Model

### What Exists

`organization_memberships` is the canonical user-to-organization access table.

Implemented fields include:

- `id`
- `user_id`
- `organization_id`
- `title`
- `department`
- `status`
- `invited_by`
- `invited_at`
- `joined_at`
- `deactivated_at`
- `deactivated_reason`
- `metadata`
- timestamps

The table has a unique constraint on `(user_id, organization_id)`, which prevents duplicate memberships for the same user and organization while allowing one user to belong to multiple organizations.

### Evidence

- `database/migrations/008_organizations_capabilities.sql`
- `supabase/migrations/008_organizations_capabilities.sql`
- `tests/security/identity.test.ts`
- `tests/api/access-context.test.ts`
- `apps/api/src/app/api/me/route.ts`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`

### Assessment

The model is appropriate for PCP-1.2. Membership should remain the durable access relationship. No new organization-user table is required.

## Organization Model

### What Exists

`organizations` is the durable business actor and tenant anchor. Actor type is not stored as a rigid organization enum. Capabilities determine whether an organization behaves as a sponsor, CRO, institution, vendor, network, lab, or another platform actor.

Important organization fields include:

- identity fields such as `name`, `legal_name`, `country`, `region`
- contact/profile fields
- `metadata`
- `is_active`
- `created_by`
- `visibility_scope`
- timestamps

### Current Limits

`organizations` has `is_active`, but no explicit organization lifecycle enum matching the PCP-1.1 desired states:

- Pending
- Under Review
- Active
- Suspended
- Archived

### Evidence

- `database/migrations/008_organizations_capabilities.sql`
- `docs/platform-discovery/pcp-1.1-identity-provisioning-implementation-plan.md`
- `docs/platform-discovery/canonical-platform-vocabulary.md`

### Assessment

PCP-1.2 should not redefine Organization. It may need to account for organization lifecycle when determining whether invitations, membership activation, or admin actions are allowed.

## User Model

### What Exists

Supabase Auth is the login identity provider. `user_profiles` is the Kadarn profile table linked 1:1 to `auth.users`.

The foundation includes:

- `handle_new_user_signup()` to create `user_profiles` after Auth user creation.
- `sync_profile_to_auth_meta()` to sync profile metadata into `auth.users.raw_app_meta_data`.
- `identity_providers` and `external_identity_links` for future OIDC/SSO compatibility.
- `/api/me` and `/api/v1/workspace/profile` for profile and membership resolution.

### Current Limits

`user_profiles` does not own organization access. Access is derived from memberships and roles. This is correct, but product/UI types still include some role fields that do not map cleanly to the DB model.

### Evidence

- `database/migrations/008_organizations_capabilities.sql`
- `packages/auth/src/index.ts`
- `packages/types/src/index.ts`
- `apps/api/src/app/api/me/route.ts`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`

## Role Model

### What Exists

The canonical organization role model is:

```text
organization_memberships
  -> membership_roles
  -> organization_roles
```

`organization_roles` seeds system roles:

- `org_admin`
- `org_member`
- `biobank_tech`
- `irb_chair`
- `data_steward`
- `readonly`

`membership_roles` lets one membership have multiple roles and supports `assigned_by`, `assigned_at`, and `expires_at`.

### Role Drift

Role semantics are split across multiple places:

| Role source | Storage | Current use | Issue |
|---|---|---|---|
| Platform role | Supabase user metadata `kadarn_role` | KOC routing, login/session routing, some API guards | Not the same as organization role. |
| Organization role | `organization_roles` + `membership_roles` | RLS helpers, workspace profile, some admin checks | Correct canonical model. |
| UI/package role type | `OrganizationMembership.role: 'admin' | 'member' | 'viewer'` | Web selectors and shared auth types | Does not match DB role keys. |
| Invite request role | `admin/member/viewer` body in invite route | Event payload only | Not persisted into `membership_roles`. |

### Evidence

- `database/migrations/008_organizations_capabilities.sql`
- `database/migrations/009_rls_foundation.sql`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/api/src/app/api/organizations/[id]/invite/route.ts`
- `packages/types/src/index.ts`
- `packages/auth/src/index.ts`

### Assessment

PCP-1.2 should consolidate all organization admin/member/viewer semantics onto existing `organization_roles` and `membership_roles`. It should avoid using `organization_memberships.role`, because that column is not part of the current schema.

## Authorization

### What Exists

Database RLS provides the strongest authorization foundation:

- `is_org_member(user_id, org_id)`
- `has_org_capability(org_id, capability_key)`
- `has_current_user_capability(capability_key)`
- `has_org_role(user_id, org_id, role_key)`
- `is_org_admin(org_id)`
- `check_visibility(organization_id, visibility_scope)`
- `user_organizations` view

Route-level authorization also exists:

- `withAuth()` resolves Supabase users for API routes.
- `requireValidatedActiveOrg()` validates `active_org_id` against active membership.
- `requireOrgMembership()` checks active organization presence and membership.
- `requireRole()` checks JWT `kadarn_role`.

### Current Issues

Some routes validate membership by checking only membership existence, while others correctly inspect `membership_roles`. Some older routes still select `organization_memberships.role`, which does not exist in the schema.

The strongest current example is `apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts`, which explicitly notes that roles live in `membership_roles -> organization_roles` and checks `org_admin` through that relation.

### Evidence

- `database/migrations/009_rls_foundation.sql`
- `apps/api/src/lib/auth-guards.ts`
- `apps/api/src/lib/workspace.ts`
- `apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts`
- `apps/api/src/app/api/organizations/[id]/capabilities/route.ts`
- `apps/api/src/app/api/organizations/[id]/invite/route.ts`

## Invitations

### What Exists

The schema can represent an invited membership because `membership_status` includes `invited`, and `organization_memberships` stores `invited_by` and `invited_at`.

There is an existing invite route:

```text
POST /api/organizations/[id]/invite
```

Current route behavior:

1. Requires authenticated user.
2. Parses organization id.
3. Attempts to verify caller membership.
4. Accepts email and a flat role value: `admin`, `member`, or `viewer`.
5. Looks up an existing `user_profiles` row by email.
6. Rejects if the target user does not already exist.
7. Creates an `organization_memberships` row with `status = 'invited'`.
8. Logs a domain-style event to console.

### What Does Not Exist

No evidence was found for:

- dedicated `organization_invitations` or `membership_invitations` table
- invitation token
- invite expiration
- invite resend/revoke
- email delivery
- invitation acceptance route
- acceptance UI
- role assignment during invitation acceptance
- membership activation from `invited` to `active`
- invite audit through the centralized `emitAuditEvent` helper
- invitation flow for users who do not yet have an account

### Critical Drift

The invite route accepts a requested role but does not persist that role into `membership_roles`. It also attempts to read `organization_memberships.role`, but the membership table does not have a `role` column.

### Evidence

- `database/migrations/008_organizations_capabilities.sql`
- `apps/api/src/app/api/organizations/[id]/invite/route.ts`
- `tests/integration/audit-coverage.test.ts`

### Assessment

Invitations partially exist as invited memberships, not as a full invitation product. PCP-1.2 should decide whether to continue using `organization_memberships.status = 'invited'` as the invitation record, or add a narrowly scoped invitation token table only if required for secure email-based acceptance.

## Active Organization

### What Exists

`active_org_id` is stored in Supabase user metadata. The canonical server-side writer is:

```text
POST /api/v1/workspace/active-org
```

That route:

1. Requires authentication.
2. Validates `org_id`.
3. Uses service role to verify the user has an active membership in the organization.
4. Writes `active_org_id` into user metadata.
5. Emits an audit event through `emitAuditEvent`.

`/api/v1/workspace/profile` then uses active org metadata and active memberships to derive:

- active organization
- memberships
- role
- capabilities
- applications
- allowed experiences
- default redirect

### Current Issues

Some web code still writes `active_org_id` directly from the browser using `supabase.auth.updateUser()`. This bypasses the canonical server validation path and repeats the risk already documented in PCP-1.1: user metadata is client-settable and must not be trusted for authorization without DB validation.

### Evidence

- `apps/api/src/app/api/v1/workspace/active-org/route.ts`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/api/src/lib/workspace.ts`
- `apps/web/src/components/workspace/workspace-shell.tsx`
- `apps/web/src/components/auth/org-selector.tsx`
- `apps/web/src/middleware.ts`

## Workspace Selection

### What Exists

Workspace profile supports multi-organization users. If the user has more than one active membership and no valid active organization, it returns:

```text
/auth/select-org
```

The workspace shell has an organization dropdown for users with multiple memberships and calls `/api/v1/workspace/active-org` when switching organizations.

### Current Gap

No matching `apps/web/src/app/**/select-org/**` route was found. The redirect target exists as API logic, but the app route for that selection flow appears absent.

### Evidence

- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/web/src/components/workspace/workspace-shell.tsx`
- `apps/web/src/components/auth/org-selector.tsx`
- `tests/api/access-context.test.ts`

## Organization Administration

### What Exists

Existing admin-adjacent APIs include:

| API | Current purpose | Reuse potential |
|---|---|---|
| `POST /api/organizations` | Create an organization and creator membership. | Legacy org creation path; should not become member management. |
| `POST /api/v1/onboarding/organization` | PCP-1.1d organization-first provisioning. | First-owner provisioning path, not invitation expansion. |
| `GET /api/v1/workspace/profile` | Resolve memberships, roles, apps, active org. | Canonical membership read surface for current user. |
| `POST /api/v1/workspace/active-org` | Validated active org switch. | Canonical active-org writer. |
| `POST /api/organizations/[id]/invite` | Partial invite existing user to org. | Reusable concept, needs correction/consolidation. |
| `GET/POST /api/v1/organizations/[id]/capabilities` | Capability list/assign with role-aware admin check. | Good admin-check pattern to reuse. |
| `GET /api/me` | Basic profile and active membership list. | Lightweight current-user endpoint. |
| `GET /api/audit-events` | KOC audit reads for current actor. | Audit visibility, not member admin. |

### What Is Missing

No complete organization administration surface was found for:

- list all members as admin with roles and statuses
- invite new member with role assignment
- accept invitation
- revoke invitation
- resend invitation
- change member role
- suspend member
- remove member
- transfer ownership
- prevent removing the last owner/admin
- audit every membership and role mutation

## Audit Logging

### What Exists

The database has an immutable `audit_events` table and audit enums that include `invite` and `organization_membership`. The API has a centralized `emitAuditEvent()` helper. `POST /api/v1/workspace/active-org` uses it.

### Current Issues

The invite route and some older state-changing routes use console/domain-event-style emission rather than the centralized audit helper. Existing audit coverage tests accept those patterns for historical routes, but PCP-1.2 membership management should use explicit audit events for membership and role changes.

### Evidence

- `database/migrations/010_audit_programs.sql`
- `apps/api/src/lib/audit.ts`
- `apps/api/src/app/api/v1/workspace/active-org/route.ts`
- `apps/api/src/app/api/organizations/[id]/invite/route.ts`
- `tests/integration/audit-coverage.test.ts`

## Required Determinations

| Question | Determination |
|---|---|
| 1. How are memberships represented? | `organization_memberships` links users to organizations; `membership_roles` assigns roles to each membership. |
| 2. Do invitations already exist? | Partially. `membership_status = 'invited'` and an invite endpoint exist, but no full invitation token/acceptance workflow exists. |
| 3. May users belong to multiple organizations? | Yes. The schema, tests, and workspace profile all support multiple active memberships per user. |
| 4. How are roles assigned? | Canonically through `organization_roles` and `membership_roles`. Some code still uses drifted flat roles. |
| 5. Does ownership exist? | Product language says first owner/admin. Persistence has `org_admin`, but no distinct owner role, ownership transfer, or last-owner protection. |
| 6. How are administrators identified? | Correct path: active membership with `org_admin` via `membership_roles`. Inconsistent path: JWT `kadarn_role = org_admin` or flat route role assumptions. |
| 7. Does organization administration already exist? | Only partially. Capability admin and partial invite exist; member lifecycle management does not. |
| 8. Does membership lifecycle already exist? | Partially. DB enum has `invited`, `active`, `suspended`, `inactive`; PCP-1.1 desired lifecycle also includes pending acceptance and removed. |
| 9. Existing APIs that can be reused? | Workspace profile, active-org, current user profile, capability admin pattern, partial invite route, audit helper, onboarding first-owner provisioning. |
| 10. Gaps? | Invitation acceptance, token/email flow, role persistence in invite, admin member CRUD, owner transfer/last-owner guard, lifecycle normalization, audit consistency, UI for org selection/admin. |

## Key Gaps

### 1. Invitation Is Not A Complete Product Flow

The existing invite endpoint creates an invited membership for an existing profile. It does not support inviting a non-existing user, issuing secure tokens, accepting invitations, or assigning the requested role.

### 2. Role Assignment During Invitation Is Broken Or Incomplete

Requested invite role is logged but not persisted into `membership_roles`. PCP-1.2 must assign roles through the existing junction table.

### 3. Ownership Is Product Language, Not A Persisted Lifecycle

`org_admin` exists and is sufficient for many administration checks, but ownership-specific operations are not represented:

- owner transfer
- last owner/admin protection
- owner-only settings
- audit of ownership changes

### 4. Membership Lifecycle Needs Normalization

Current enum:

```text
invited -> active -> suspended / inactive
```

PCP-1.1 desired language:

```text
invited -> pending_acceptance -> active -> suspended -> removed
```

PCP-1.2 should decide whether to map desired lifecycle onto existing enum values or introduce a minimal migration. That decision belongs in the next planning step, not this audit.

### 5. Active Org Has A Correct API But Not Universal Usage

`POST /api/v1/workspace/active-org` validates membership. Some web code still writes `active_org_id` client-side. PCP-1.2 should make the validated API the only membership-sensitive active-org writer.

### 6. Multi-Org Selection Is Backend-Recognized But UI-Incomplete

The workspace profile can return `/auth/select-org`, and tests validate multi-org behavior. No route for that selector was found.

### 7. Admin Checks Are Inconsistent Across Routes

The newer v1 capabilities route uses the correct `membership_roles -> organization_roles` pattern. Older routes still assume membership-only access or a flat membership role column.

### 8. Audit Is Available But Not Uniform

Membership and role mutations should emit centralized audit events. Existing routes mix `emitAuditEvent`, console logging, and domain-event-style emission.

## Reusable Infrastructure For PCP-1.2

| Need | Reuse |
|---|---|
| Current user identity | Supabase Auth + `user_profiles` |
| Membership source of truth | `organization_memberships` |
| Role source of truth | `organization_roles` + `membership_roles` |
| Multi-org support | Existing unique `(user_id, organization_id)` membership model |
| Admin role check | `has_org_role`, `is_org_admin`, and v1 capabilities route pattern |
| Active org switching | `POST /api/v1/workspace/active-org` |
| Workspace context | `GET /api/v1/workspace/profile` |
| Audit | `audit_events` + `emitAuditEvent()` |
| First-owner provisioning | PCP-1.1d organization provisioning route |
| Existing partial invite semantics | `organization_memberships.status = 'invited'` and invite route concept |

## Recommended PCP-1.2 Boundaries

PCP-1.2 should stay focused on invitation and membership management. It should not:

- redesign organizations
- introduce actor-specific user tables
- create a second permission system
- bypass `membership_roles`
- use `active_org_id` without DB membership validation
- provision Kadarn Internal users through public invitation flows
- enable marketplace visibility or passport sharing as a side effect of membership

## Audit Conclusion

Kadarn can implement Invitation and Membership Management by consolidating the existing architecture. The source of truth is already present: organizations, user profiles, memberships, roles, RLS helpers, workspace profile, active-org selection, and audit events.

The next PCP-1.2 step should specify the membership lifecycle and API contract around that foundation:

```text
Organization Admin
  -> Invite User
  -> Create or track invitation
  -> Accept invitation
  -> Activate membership
  -> Assign membership_roles
  -> Select active organization
  -> Resolve workspace profile
  -> Audit every state change
```

The main design decision is whether the existing `organization_memberships.status = 'invited'` row is sufficient as the invitation record, or whether Kadarn needs a narrowly scoped invitation-token table for secure email acceptance and expiration.
