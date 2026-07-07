# PCP-1.2 Invitation and Membership Management Implementation Plan

**Program:** Kadarn Platform Consolidation - PCP  
**Phase:** PCP-1.2  
**Step:** 4 - Implementation Plan  
**Mode:** Planning only. No code changes.  
**Inputs:** `pcp-1.2-membership-audit.md`, `pcp-1.2-membership-spec.md`, `ADR-033-organization-membership-model.md`  
**Output:** Phased implementation roadmap for Invitation and Membership Management.

## Implementation Decision

PCP-1.2 should complete Kadarn's existing organization membership model. The work must reuse `organizations`, `user_profiles`, `organization_memberships`, `organization_roles`, `membership_roles`, workspace profile, active-org validation, RLS helpers, Policy Engine hooks where available, and audit infrastructure.

The implementation must not create a duplicate permission system, actor-specific user model, or second organization-user relationship.

## Global Constraints

- `organization_memberships` remains the source of truth for organization access.
- `membership_roles` remains the source of truth for organization role assignment.
- Invitations are the only supported mechanism for adding users after organization provisioning.
- Invitation persistence may add only the minimal token/state support required for secure acceptance, expiration, resend, and cancellation.
- `active_org_id` must be written through a server path that validates active membership.
- Removed and suspended members must not satisfy workspace access.
- Invited and pending-acceptance members must not satisfy workspace access.
- Ownership safeguards must prevent orphaned organizations.
- Kadarn Platform roles are not managed through public/customer invitation flows.
- Membership changes must not enable marketplace visibility, sponsor passport sharing, public profiles, evidence publication, or payment workflows by default.
- Every membership and role mutation must emit audit.

## Target Membership Flow

```text
Owner/Admin opens member administration
  -> invites member
  -> invitation API creates governed invitation
  -> invitee accepts
  -> membership becomes active
  -> membership_roles become effective
  -> user selects active organization
  -> workspace profile resolves access
  -> audit trail records every state change
```

## Baseline Validation Commands

Use these commands as phase-level gates when implementation begins:

```powershell
npm run typecheck
npm run lint
npm run test -w tests -- --run tests/api/access-context.test.ts
npm run test -w tests -- --run tests/security/identity.test.ts
npm run test -w tests -- --run tests/security/authorization.test.ts
npm run test -w tests -- --run tests/integration/audit-coverage.test.ts
npm run build -w apps/api
npm run build -w apps/web
```

For UI/E2E phases:

```powershell
npm run test:e2e -w apps/web
```

For documentation or SQL-only review:

```powershell
git diff --check
```

## Phase Dependency Order

| Phase | Depends on | Purpose |
|---|---|---|
| PCP-1.2a | PCP-1.2 Step 4 | Invitation UI shell and member-management entry points. |
| PCP-1.2b | PCP-1.2a | Invitation API and persistence/validation contract. |
| PCP-1.2c | PCP-1.2b | Invitation acceptance and activation flow. |
| PCP-1.2d | PCP-1.2b, PCP-1.2c | Membership administration list/actions. |
| PCP-1.2e | PCP-1.2d | Role management through `membership_roles`. |
| PCP-1.2f | PCP-1.2e | Ownership transfer with safeguards. |
| PCP-1.2g | PCP-1.2d, PCP-1.2e | Suspension, reactivation, and removal lifecycle. |
| PCP-1.2h | PCP-1.2b through PCP-1.2g | Centralized audit coverage for every mutation. |
| PCP-1.2i | all PCP-1.2 implementation phases | Unit, API, integration, security, and UI tests. |

## PCP-1.2a - Invitation UI

### Purpose

Create the user-facing workspace UI for organization administrators to view membership state and initiate invitations. This phase should introduce navigation and forms only where safe. It should not create real invitations until the API contract is implemented.

Required behavior:

- Add an organization members/settings surface in the workspace.
- Show current active organization context.
- Show member list placeholder or read-only current data if already available.
- Provide invite form fields for email, role, title/department, and optional message.
- Include copy that membership does not publish the organization or grant sponsor passport access.
- Keep Kadarn Platform roles out of customer invitation UI.

### Files Likely Touched

- `apps/web/src/app/(workspace)/workspace/settings/members/page.tsx`
- `apps/web/src/app/(workspace)/workspace/members/page.tsx`
- `apps/web/src/components/workspace/workspace-shell.tsx`
- `apps/web/src/components/membership/*`
- `apps/web/src/lib/koc-api.ts` or a new workspace API client helper if local patterns require it
- `tests/web/*membership*.test.ts`

### Modules To Reuse

- `apps/web/src/components/workspace/workspace-shell.tsx`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/api/src/app/api/v1/workspace/active-org/route.ts`
- `@kadarn/auth` role/session helpers
- Existing workspace navigation and capability-driven shell patterns

### Risks

- UI implies invitations are sent before the API exists.
- UI exposes Kadarn Platform roles to customer organizations.
- UI uses flat `admin/member/viewer` roles instead of the PCP-1.2 product role vocabulary.
- UI lets non-admin users access invitation controls.
- UI suggests membership enables marketplace publication or passport sharing.

### Validation

```powershell
npm run typecheck
npm run lint
npm run build -w apps/web
npm run test -w tests -- --run tests/web/auth-entrypoints.test.ts
```

### Stop Conditions

- Invite form sends real mutation requests before PCP-1.2b exists.
- Kadarn Platform roles appear in customer organization member UI.
- Members page can be reached without authenticated workspace context.
- UI copy says invited members receive sponsor passport, marketplace, evidence, or finance access automatically.

## PCP-1.2b - Invitation API

### Purpose

Implement the server-side invitation contract. This phase establishes how invitations are created, secured, stored, resent, cancelled, and mapped to memberships.

Required behavior:

- Invite by email into an existing organization.
- Validate inviter has an active organization membership and permission to invite.
- Prevent duplicate active memberships.
- Prevent duplicate open invitations.
- Stage intended role assignment through canonical role keys.
- Support expiration and cancellation.
- Decide and implement minimal invitation-token persistence if secure email acceptance requires it.
- Keep `organization_memberships` as the access source of truth.

### Files Likely Touched

- `apps/api/src/app/api/organizations/[id]/invite/route.ts`
- `apps/api/src/app/api/v1/organizations/[id]/invitations/route.ts`
- `apps/api/src/app/api/v1/organizations/[id]/invitations/[invitationId]/route.ts`
- `apps/api/src/lib/membership/*`
- `apps/api/src/lib/audit.ts`
- `apps/api/src/lib/rate-limit.ts`
- `apps/api/src/lib/validation.ts`
- `database/migrations/*membership*invitation*.sql` only if token/state persistence is strictly required
- `supabase/migrations/*membership*invitation*.sql` only if DB migration is required
- `tests/api/*membership*invitation*.test.ts`

### Modules To Reuse

- `createRouteClient()` and `createServiceClient()` from `apps/api/src/lib/supabase-server.ts`
- `withAuth()` and route error handling
- Existing partial invite route as concept, not as final role model
- `organization_memberships`
- `organization_roles`
- `membership_roles`
- RLS helper pattern from `apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts`
- `emitAuditEvent()` from `apps/api/src/lib/audit.ts`
- `rateLimit()` public/workspace rate-limit helpers

### Risks

- Creating a second source of truth for organization access.
- Persisting invitation tokens insecurely.
- Assigning roles outside `membership_roles`.
- Allowing member invite from a suspended/removed membership.
- Allowing invites into suspended/archived organizations.
- Leaking account existence through invite responses.

### Validation

```powershell
npm run typecheck
npm run lint
npm run build -w apps/api
npm run test -w tests -- --run tests/security/authorization.test.ts
npm run test -w tests -- --run tests/integration/audit-coverage.test.ts
```

### Stop Conditions

- API writes `organization_memberships.role`.
- API grants Kadarn Platform roles through customer invitation endpoints.
- API creates active membership before acceptance.
- API stores reusable plaintext invitation tokens.
- API allows duplicate open invitations for the same org/email.
- API returns account-existence details to unauthorized callers.

## PCP-1.2c - Invitation Acceptance

### Purpose

Implement invitee acceptance so a governed invitation becomes an active membership with effective roles.

Required behavior:

- Validate invitation token or invite context.
- Reject expired or cancelled invitations.
- Bind the invitation to the correct authenticated user or account acceptance flow.
- Move membership from Invited/Pending Acceptance to Active.
- Apply intended roles through `membership_roles`.
- Set `joined_at`.
- Allow selecting the organization through the validated active-org API.
- Provide reject invitation behavior.

### Files Likely Touched

- `apps/web/src/app/(auth)/invite/[token]/page.tsx`
- `apps/web/src/app/(auth)/accept-invitation/page.tsx`
- `apps/web/src/components/auth/invitation-acceptance-form.tsx`
- `apps/api/src/app/api/v1/invitations/[token]/route.ts`
- `apps/api/src/app/api/v1/invitations/[token]/accept/route.ts`
- `apps/api/src/app/api/v1/invitations/[token]/reject/route.ts`
- `apps/api/src/lib/membership/*`
- `tests/api/*invitation-acceptance*.test.ts`
- `tests/web/*invitation*.test.ts`

### Modules To Reuse

- Supabase Auth session and login route patterns
- `user_profiles`
- `organization_memberships`
- `membership_roles`
- `POST /api/v1/workspace/active-org`
- `GET /api/v1/workspace/profile`
- `emitAuditEvent()`
- Existing auth route group patterns from PCP-1.1 UI work

### Risks

- Accepting an invitation for the wrong email/user.
- Activating membership without role assignment.
- Allowing expired/cancelled token acceptance.
- Logging sensitive token values.
- Auto-selecting active org without membership validation.
- Creating a second self-service registration path that claims an existing organization.

### Validation

```powershell
npm run typecheck
npm run lint
npm run build -w apps/api
npm run build -w apps/web
npm run test -w tests -- --run tests/api/access-context.test.ts
npm run test -w tests -- --run tests/security/identity.test.ts
```

### Stop Conditions

- Expired or cancelled invitations can be accepted.
- Invited/Pending Acceptance memberships appear as active workspace options.
- Acceptance skips `membership_roles`.
- Acceptance enables marketplace visibility, public profile, or sponsor passport sharing.
- Token is exposed in audit output, logs, or client-visible error details.

## PCP-1.2d - Membership Administration

### Purpose

Build the organization administration surface and API to list members, view membership status, see roles, and trigger member operations.

Required behavior:

- List organization members for authorized administrators.
- Include membership lifecycle state.
- Include role assignments resolved from `membership_roles`.
- Show pending invitations separately from active members where applicable.
- Provide actions for resend, cancel, suspend, reactivate, remove, change role, and ownership transfer as gated actions.

### Files Likely Touched

- `apps/api/src/app/api/v1/organizations/[id]/members/route.ts`
- `apps/api/src/app/api/v1/organizations/[id]/members/[membershipId]/route.ts`
- `apps/api/src/lib/membership/*`
- `apps/web/src/app/(workspace)/workspace/settings/members/page.tsx`
- `apps/web/src/components/membership/member-list.tsx`
- `apps/web/src/components/membership/member-actions.tsx`
- `apps/web/src/components/membership/invitation-list.tsx`
- `tests/api/*membership-admin*.test.ts`
- `tests/web/*membership-admin*.test.ts`

### Modules To Reuse

- Workspace profile active org context
- RLS helper pattern from capabilities admin route
- `organization_memberships`
- `membership_roles`
- `organization_roles`
- `emitAuditEvent()`
- `withAuth()`
- `rateLimit(WORKSPACE_RATE_LIMIT, ...)`

### Risks

- Member list leaks users across organizations.
- Admin action buttons appear for unauthorized users.
- Removed/suspended users remain selectable as active org.
- UI mutates stale membership state without refresh.
- Member administration ignores organization lifecycle.

### Validation

```powershell
npm run typecheck
npm run lint
npm run build -w apps/api
npm run build -w apps/web
npm run test -w tests -- --run tests/security/authorization.test.ts
npm run test -w tests -- --run tests/integration/multi-tenant.test.ts
```

### Stop Conditions

- Non-admin members can view or mutate full membership lists.
- API returns memberships from unrelated organizations.
- Removed memberships are physically deleted by default.
- Role display comes from a non-canonical flat role field.

## PCP-1.2e - Role Management

### Purpose

Implement organization role assignment and role changes through `membership_roles`, while mapping product role labels to canonical role keys.

Required behavior:

- Define role key mapping for Institution, Sponsor, Network, Vendor, CRO, and Kadarn Platform internal roles.
- Reuse existing roles where sufficient.
- Add or seed only missing role keys needed by the product spec.
- Change role assignments through `membership_roles`.
- Prevent self-escalation.
- Prevent unauthorized role grants.
- Keep Kadarn Platform roles out of customer organization role assignment.

### Files Likely Touched

- `database/migrations/*organization_roles*.sql` if new role keys are required
- `supabase/migrations/*organization_roles*.sql` if new role keys are required
- `apps/api/src/lib/membership/roles.ts`
- `apps/api/src/app/api/v1/organizations/[id]/members/[membershipId]/roles/route.ts`
- `apps/web/src/components/membership/role-selector.tsx`
- `packages/types/src/index.ts` only if shared exported role types are needed
- `tests/api/*role-management*.test.ts`
- `tests/security/authorization.test.ts`

### Modules To Reuse

- `organization_roles`
- `membership_roles`
- `has_org_role()` / `is_org_admin()` RLS semantics
- Existing v1 capabilities admin role-query pattern
- `emitAuditEvent()`
- PCP-1.2 product role mapping

### Risks

- Creating product role labels that do not map to persisted role keys.
- Duplicating platform roles inside customer org role assignment.
- Allowing an Administrator to grant Owner when only Owner should do so.
- Removing roles from the last owner.
- Role changes are not reflected in workspace profile/navigation.

### Validation

```powershell
npm run typecheck
npm run lint
npm run build -w apps/api
npm run test -w tests -- --run tests/security/authorization.test.ts
npm run test -w tests -- --run tests/api/access-context.test.ts
```

### Stop Conditions

- Role assignment writes to `organization_memberships.role`.
- Role change bypasses `membership_roles`.
- User can grant themselves Owner/Admin without existing authority.
- Last active owner can lose ownership through role change.
- Kadarn Platform roles are assignable from customer member UI.

## PCP-1.2f - Ownership Transfer

### Purpose

Implement protected ownership transfer so an organization can change its accountable owner without becoming orphaned.

Required behavior:

- Transfer ownership from current owner to another active or accepting member.
- Assign new owner before downgrading/removing old owner.
- Block transfer to suspended/removed membership.
- Block ownership transfer if target user has not accepted membership, unless transfer is completed as part of acceptance.
- Support governed Kadarn internal recovery path separately from customer UI.
- Require explicit confirmation and reason.

### Files Likely Touched

- `apps/api/src/app/api/v1/organizations/[id]/ownership/transfer/route.ts`
- `apps/api/src/lib/membership/ownership.ts`
- `apps/web/src/components/membership/ownership-transfer-dialog.tsx`
- `apps/web/src/app/(workspace)/workspace/settings/members/page.tsx`
- `tests/api/*ownership-transfer*.test.ts`
- `tests/security/authorization.test.ts`
- `tests/integration/audit-coverage.test.ts`

### Modules To Reuse

- `organization_memberships`
- `membership_roles`
- `organization_roles`
- Role management helper from PCP-1.2e
- `emitAuditEvent()`
- Policy Engine hooks if ownership transfer policy exists or is introduced in shadow mode

### Risks

- Organization becomes ownerless.
- Current owner is downgraded before new owner is confirmed.
- Ownership can be transferred to a suspended/removed member.
- Admins can transfer ownership without owner-level authority.
- Recovery path becomes an unaudited super-admin bypass.

### Validation

```powershell
npm run typecheck
npm run lint
npm run build -w apps/api
npm run test -w tests -- --run tests/security/authorization.test.ts
npm run test -w tests -- --run tests/integration/audit-coverage.test.ts
```

### Stop Conditions

- Last owner can be removed, suspended, or downgraded.
- Ownership transfer lacks audit reason/correlation id.
- Ownership transfer grants marketplace/public/passport permissions as a side effect.
- Customer UI can invoke Kadarn internal recovery.

## PCP-1.2g - Membership Suspension

### Purpose

Implement suspension, reactivation, and removal lifecycle transitions for memberships.

Required behavior:

- Suspend active members and immediately disable workspace access.
- Reactivate suspended members when organization and governance state allow it.
- Remove members while preserving audit history.
- Clear or invalidate active org context for affected users when needed.
- Record reason and actor for every state transition.
- Preserve role history while making roles ineffective when membership is not Active.

### Files Likely Touched

- `apps/api/src/app/api/v1/organizations/[id]/members/[membershipId]/suspend/route.ts`
- `apps/api/src/app/api/v1/organizations/[id]/members/[membershipId]/reactivate/route.ts`
- `apps/api/src/app/api/v1/organizations/[id]/members/[membershipId]/remove/route.ts`
- `apps/api/src/lib/membership/lifecycle.ts`
- `apps/api/src/lib/workspace.ts`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/web/src/components/membership/member-actions.tsx`
- `tests/api/*membership-lifecycle*.test.ts`
- `tests/api/access-context.test.ts`

### Modules To Reuse

- `organization_memberships.status`
- `requireValidatedActiveOrg()`
- Active-org API validation
- Workspace profile filtering
- `emitAuditEvent()`
- Ownership safeguards from PCP-1.2f

### Risks

- Suspended members retain active workspace access.
- Removed members still satisfy active-org validation.
- Removing a user physically deletes history.
- Last owner can be suspended or removed.
- Reactivation restores roles that governance should require reapproval for.

### Validation

```powershell
npm run typecheck
npm run lint
npm run build -w apps/api
npm run test -w tests -- --run tests/api/access-context.test.ts
npm run test -w tests -- --run tests/security/identity.test.ts
npm run test -w tests -- --run tests/security/authorization.test.ts
```

### Stop Conditions

- Suspended/removed memberships appear in `GET /api/v1/workspace/profile` active memberships.
- `POST /api/v1/workspace/active-org` accepts suspended or removed memberships.
- Removal deletes membership rows without audit-preserving strategy.
- Suspension can orphan the organization.

## PCP-1.2h - Audit Logging

### Purpose

Normalize audit logging for all PCP-1.2 membership and invitation mutations.

Required behavior:

- Emit audit for invitation created, sent, resent, accepted, rejected, expired, cancelled.
- Emit audit for member activated, suspended, reactivated, removed.
- Emit audit for role changed.
- Emit audit for ownership transferred.
- Include actor, target, organization, previous state, new state, reason, and correlation id.
- Avoid logging plaintext tokens or sensitive invitation secrets.
- Ensure audit reads remain governed by role and organization scope.

### Files Likely Touched

- `apps/api/src/lib/audit.ts`
- `apps/api/src/lib/membership/audit.ts`
- `apps/api/src/app/api/v1/organizations/[id]/invitations/*`
- `apps/api/src/app/api/v1/organizations/[id]/members/*`
- `apps/api/src/app/api/audit-events/route.ts`
- `tests/integration/audit-coverage.test.ts`
- `tests/security/audit.test.ts`

### Modules To Reuse

- `audit_events`
- `emitAuditEvent()`
- `publishDomainEventFireAndForget()`
- Existing audit coverage tests
- Existing `audit_action` and `audit_resource_type` enum values where sufficient

### Risks

- Audit emitted only as console logs.
- Audit omits old/new membership or role state.
- Token values leak into audit.
- Audit route exposes membership history to unauthorized users.
- Some mutation routes miss audit coverage.

### Validation

```powershell
npm run typecheck
npm run lint
npm run build -w apps/api
npm run test -w tests -- --run tests/integration/audit-coverage.test.ts
npm run test -w tests -- --run tests/security/audit.test.ts
```

### Stop Conditions

- Any PCP-1.2 mutation lacks an audit event.
- Audit stores plaintext invitation tokens.
- Audit event cannot be correlated to actor, organization, and target membership/invitation.
- Audit read path leaks cross-organization membership history.

## PCP-1.2i - Tests

### Purpose

Prove PCP-1.2 behavior end to end across invitation, acceptance, membership lifecycle, role management, ownership safeguards, active org validation, and audit.

Required coverage:

- Unit tests for role mapping, lifecycle transitions, token validation, ownership safeguards.
- API tests for invite, accept, reject, resend, cancel, list members, change role, suspend, reactivate, remove, transfer ownership.
- Security tests for cross-org isolation, self-escalation, last-owner protection, suspended access denial.
- Workspace tests for active-org filtering and multi-org selection.
- Audit tests for every mutation.
- UI tests for member administration and invitation acceptance.

### Files Likely Touched

- `tests/api/*membership*.test.ts`
- `tests/api/*invitation*.test.ts`
- `tests/security/authorization.test.ts`
- `tests/security/identity.test.ts`
- `tests/security/audit.test.ts`
- `tests/integration/audit-coverage.test.ts`
- `tests/integration/multi-tenant.test.ts`
- `tests/api/access-context.test.ts`
- `tests/web/*membership*.test.ts`
- `apps/web/tests/*membership*.spec.ts` if Playwright coverage is added

### Modules To Reuse

- Existing Supabase test helpers
- Existing seeded users and organizations
- `tests/api/access-context.test.ts`
- `tests/security/identity.test.ts`
- `tests/security/authorization.test.ts`
- `tests/integration/audit-coverage.test.ts`
- Existing E2E auth mock only where appropriate

### Risks

- Tests rely on brittle source scanning instead of behavior where integration is possible.
- Supabase local state makes tests order-dependent.
- Invitation tokens are hard to test safely without leaking secrets.
- UI tests pass while API authorization remains incomplete.
- Audit coverage tests accept console logs instead of centralized audit for new routes.

### Validation

```powershell
npm run typecheck
npm run lint
npm run test -w tests -- --run tests/api/access-context.test.ts
npm run test -w tests -- --run tests/security/identity.test.ts
npm run test -w tests -- --run tests/security/authorization.test.ts
npm run test -w tests -- --run tests/security/audit.test.ts
npm run test -w tests -- --run tests/integration/audit-coverage.test.ts
npm run test -w tests -- --run tests/integration/multi-tenant.test.ts
npm run build -w apps/api
npm run build -w apps/web
```

For UI/E2E:

```powershell
npm run test:e2e -w apps/web
```

### Stop Conditions

- Last-owner protection is not covered by tests.
- Suspended/removed active-org denial is not covered by tests.
- Invitation token expiration/cancellation is not covered by tests.
- Role assignment through `membership_roles` is not covered by tests.
- Audit is not asserted for every mutation.
- Cross-organization membership leakage is not tested.

## Cross-Phase Implementation Notes

### Minimal Persistence Decision

The most important implementation decision is whether secure invitation acceptance can be represented by the existing `organization_memberships` row plus metadata, or whether a narrow invitation-token table is required.

If a new table is required, it should be limited to invitation security and delivery state:

- organization id
- invitee email or protected email reference
- invited membership id if created
- requested role key(s)
- token hash
- status
- expires_at
- sent_at
- accepted_at
- cancelled_at
- created_by
- audit metadata

It must not become the access source of truth.

### Lifecycle Mapping

Current DB membership status supports `invited`, `active`, `suspended`, and `inactive`. PCP-1.2 product lifecycle includes Pending Acceptance and Removed.

Implementation planning must decide whether to:

- map Pending Acceptance and Removed into existing status plus metadata, or
- add a minimal enum migration.

That decision must preserve backwards compatibility for current active membership checks.

### Role Mapping

Existing role keys should be reused where possible:

- `org_admin`
- `org_member`
- `readonly`
- `data_steward`

New product roles should be added only when existing roles cannot express the permission bundle.

### Active Organization

All phases must converge on one rule:

```text
active_org_id is valid only if the user has an Active membership in that organization.
```

Client-side metadata writes should not be used as authorization.

### Audit

New PCP-1.2 routes should use centralized audit events, not console logs as the primary audit mechanism.

## Final Rollout Gate

PCP-1.2 is ready for production rollout only when:

- Invitations are governed and auditable.
- Invitation acceptance activates membership safely.
- Roles are assigned through `membership_roles`.
- Membership lifecycle states control workspace access.
- Ownership cannot be orphaned.
- Active org selection validates active membership.
- Suspended and removed users lose workspace access.
- Audit exists for every membership and role mutation.
- Tests cover unit, API, security, integration, and UI flows.
- No duplicate permission or user-membership system exists.
- Kadarn Platform roles remain governed separately from customer invitation flows.

## Plan Conclusion

PCP-1.2 should be implemented as a consolidation sequence, not a redesign. The existing architecture already contains the correct source-of-truth objects. The work is to finish the missing product and governance flows around them:

```text
Invitation UI
  -> Invitation API
  -> Invitation Acceptance
  -> Membership Administration
  -> Role Management
  -> Ownership Transfer
  -> Membership Suspension
  -> Audit Logging
  -> Tests
```

Each phase must preserve ADR-033: organizations own memberships, users access through memberships, permissions resolve through memberships, membership lifecycle controls access, ownership is protected, and invitations are the only supported post-provisioning membership expansion mechanism.
