# PCP-1.1 Identity and Workspace Provisioning Implementation Plan

**Program:** Kadarn Platform Consolidation - PCP  
**Phase:** PCP-1.1  
**Step:** 4 - Implementation Plan  
**Mode:** Planning only. No code changes.  
**Inputs:** `pcp-1.1-identity-provisioning-audit.md`, `pcp-1.1-identity-provisioning-spec.md`  
**Output:** Concrete phased implementation plan for organization-first onboarding.

## Implementation Decision

PCP-1.1 should implement onboarding as a small sequence of reviewable phases. The work must finish the existing identity, organization, membership, role, capability, active-org, workspace, sponsor portfolio, continuity/profile, KOC, and audit architecture. It must not introduce duplicate actor domains, duplicate permission systems, or automatic public sharing.

Kadarn provisions organizations first. A user becomes the first admin/owner of an organization. The active organization context is then used to resolve workspace access.

## Global Constraints

- Initial Platform Bootstrap is a one-time platform operation and must remain separate from normal public onboarding.
- No public registration path for Kadarn Platform (Internal).
- Marketplace visibility remains off by default.
- Sponsor Passport sharing remains off by default.
- Actor type maps to existing organization capabilities.
- `membership_roles` is the canonical organization role assignment path.
- `POST /api/v1/workspace/active-org` should become the canonical active-org writer.
- Sponsor Portfolio and Institution Portfolio are initialized as private scopes.
- Internal Kadarn access must use existing auth, roles, policy, RLS, and audit infrastructure where possible.
- Identity must remain compatible with future multi-organization memberships without a redesign.
- Workspace is not the same thing as Organization; initial provisioning creates the primary workspace only.

## Initial Platform Bootstrap

Before public organization onboarding is enabled, Kadarn needs a one-time platform bootstrap path. This is not `/join`, not public registration, and not a normal customer onboarding flow.

Bootstrap initializes:

- Kadarn Organization
- Super Admin user for bootstrap only
- Platform roles
- System configuration
- Kadarn Operations Workspace baseline
- Initial audit/governance settings

The bootstrap Super Admin is a temporary or tightly controlled role used only to establish the first governed platform state. After bootstrap, normal Kadarn Internal access must use explicit internal memberships, platform-only roles, authorization checks, and audit requirements.

### Bootstrap Guardrails

| Area | Requirement |
|---|---|
| Invocation | One-time, operationally controlled, never public. |
| Idempotency | Re-running must not create duplicate Kadarn orgs, roles, or super admins. |
| Audit | Bootstrap must emit or record an auditable bootstrap event. |
| Separation | Bootstrap Super Admin must be separable from day-to-day Platform Admin. |
| Public registration | `/join` must never expose Kadarn Platform (Internal). |

### Bootstrap Stop Conditions

- Bootstrap can be triggered by an unauthenticated or public user.
- Bootstrap creates duplicate Kadarn organizations or platform roles.
- Bootstrap Super Admin becomes the permanent normal operating role.
- Bootstrap bypasses audit entirely.

## Identity Lifecycle Principles

### Future Multi-Organization Compatibility

PCP-1.1 should preserve the current multi-membership shape even if the first implementation encourages one active organization context at a time. The model should remain compatible with a future user belonging to more than one organization, for example:

- Sponsor
- CRO
- Kadarn Internal

This must not require redesigning identity. The durable model remains `user_profiles` plus `organization_memberships`, `membership_roles`, and a single active organization context per session/request.

### Invitation-First Membership Expansion

Only the first user creates the organization. Every later user joins an existing organization by invitation or another governed membership flow.

```text
Organization Creation
  -> First Owner
  -> Invite Members
  -> Membership Accepted
  -> Workspace Access
```

There must not be a second public registration path that creates or claims an already-created organization.

### Organization Lifecycle States

PCP-1.1 should document and preserve a lifecycle that can support Policy Engine and governance rules.

| State | Meaning |
|---|---|
| Pending | Organization has been submitted or provisioned but is not fully reviewed. |
| Under Review | Kadarn or governed workflow is reviewing eligibility, verification, or activation. |
| Active | Organization can use its approved workspace capabilities. |
| Suspended | Organization access or operations are temporarily restricted. |
| Archived | Organization is retained for history/audit but no longer operational. |

### Membership Lifecycle States

| State | Meaning |
|---|---|
| Invited | A membership invitation has been created. |
| Pending Acceptance | The invited user has started or received acceptance but has not completed activation. |
| Active | User can access the organization in an active organization context. |
| Suspended | User is temporarily restricted from the organization. |
| Removed | User no longer has organization access; history remains auditable. |

### Workspace Is Not Organization

An organization is the durable tenant/business actor. A workspace is a product surface or operational context for that organization.

Initial provisioning creates the primary workspace only. Future work may add multiple workspaces per organization without changing the identity model.

Examples:

| Organization type | Possible workspaces |
|---|---|
| Sponsor | Sponsor Workspace, Marketplace Workspace, Analytics Workspace |
| Institution | Operations Workspace, Portfolio Workspace, Marketplace Workspace |
| Vendor | Contribution Workspace, Confirmation Workspace, Marketplace Workspace |
| Kadarn Internal | Operations Workspace, Governance Workspace, Review Queue Workspace |

## Baseline Validation Commands

Use these commands as phase-level gates when code implementation begins:

```powershell
npm run typecheck
npm run lint
npm run test -w tests -- --run tests/integration/onboarding-flow.test.ts
npm run test -w tests -- --run tests/api/access-context.test.ts
npm run test -w tests -- --run tests/security/identity.test.ts
npm run test -w tests -- --run tests/security/authorization.test.ts
npm run build -w apps/web
npm run build -w apps/api
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
| PCP-1.1a | none | Login UX entry points. |
| PCP-1.1b | PCP-1.1a | Public actor selection route. |
| PCP-1.1c | PCP-1.1b | Organization-first registration form. |
| PCP-1.1d | PCP-1.1c | Atomic provisioning API. |
| PCP-1.1e | PCP-1.1d | Institution Portfolio initialization. |
| PCP-1.1f | PCP-1.1d | Sponsor Portfolio initialization. |
| PCP-1.1g | PCP-1.1a | Password recovery. |
| PCP-1.1h | PCP-1.1d | Kadarn Internal workspace provisioning. |
| PCP-1.1j | PCP-1.1d | Invitation and membership management. |
| PCP-1.1i | all implementation phases | Tests and smoke journeys. |

## PCP-1.1a - Login Page UX Updates

### Scope

Update the existing login page without changing current sign-in semantics.

Required changes:

- Add Forgot Password link.
- Add Join Kadarn / Register Organization entry point.
- Preserve existing email/password login behavior.
- Preserve `next` redirect handling.
- Preserve role-based destination behavior for existing users.

### Files Likely Touched

- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(marketplace)/layout.tsx` if public CTA copy needs alignment
- `apps/web/src/components/marketplace/request-cta.tsx` if marketplace request CTA should point to join

### Existing Modules To Reuse

- `getSupabaseClient()` from `apps/web/src/lib/supabase/client`
- `defaultRedirect()` and `resolveRole()` from `@kadarn/auth`
- Existing login form state and submit handler
- Existing `next` query parameter handling

### Risks

- Breaking current login redirect behavior.
- Accidentally routing existing org users into onboarding.
- Confusing public marketplace browse with registration.
- Adding a Join CTA that implies marketplace visibility or passport sharing.

### Validation Commands

```powershell
npm run typecheck
npm run lint
npm run build -w apps/web
```

### Stop Conditions

- Existing sign-in no longer routes `kadarn_internal` users to `/koc`.
- Existing organization users no longer route to `/workspace` or their `next` destination.
- Join/Register entry point bypasses actor selection.
- Login copy implies automatic marketplace publication.

## PCP-1.1b - Actor Type Selection

### Scope

Build `/join` as the public onboarding entry point. The route lets users choose:

- Institution
- Sponsor
- CRO
- Network
- Vendor

Kadarn Platform (Internal) is not listed and is not available through public registration.

### Files Likely Touched

- `apps/web/src/app/(auth)/join/page.tsx` or `apps/web/src/app/join/page.tsx`
- `apps/web/src/app/(auth)/layout.tsx` if auth layout is needed
- `apps/web/src/components/auth/*` for shared auth/onboarding UI
- `apps/web/src/lib/*` if a small actor type constant is shared
- `packages/types/src/index.ts` only if existing exported types are insufficient

### Existing Modules To Reuse

- Next.js App Router patterns already used in `apps/web/src/app/(auth)/login/page.tsx`
- Existing design tokens/styles from auth and marketplace pages
- Existing canonical capability vocabulary from `organization_capability_types`

### Risks

- Creating actor labels that do not map to existing capabilities.
- Exposing Kadarn Platform (Internal) in public registration.
- Creating a new actor domain enum that conflicts with the capability model.
- Letting actor selection activate marketplace/public visibility.

### Validation Commands

```powershell
npm run typecheck
npm run lint
npm run build -w apps/web
```

### Stop Conditions

- `/join` includes Kadarn Platform (Internal) as a public option.
- Actor selection writes data before the registration form is submitted.
- Selected actor cannot be mapped to existing capability keys.
- UI copy says the organization will be published or shared immediately.

## PCP-1.1c - Registration Form

### Scope

Create the organization-first registration form after actor selection.

The form captures:

- Organization information
- Admin user information
- Password
- Terms acknowledgement

The form should submit to the provisioning API, not directly create independent records from the client.

### Files Likely Touched

- `apps/web/src/app/(auth)/join/[actor]/page.tsx` or equivalent join form route
- `apps/web/src/components/auth/organization-registration-form.tsx`
- `apps/web/src/lib/join/*` for client-side request helpers if needed
- `apps/api/src/lib/validation.ts` if shared request schema needs an API schema
- `packages/types/src/index.ts` only if existing types cannot safely represent request/response shape

### Existing Modules To Reuse

- Existing form patterns from `login/page.tsx`
- Existing validation style from `apps/api/src/lib/validation.ts`
- Existing capability keys from the database seed/migrations
- Existing API response envelope conventions in `apps/api/src/lib/api-response.ts`

### Risks

- Storing password or sensitive form state outside Supabase Auth flow.
- Creating user and organization in separate client requests.
- Accepting actor/capability combinations that are not supported.
- Missing terms acknowledgement.
- Poor failure UX if provisioning partially fails.

### Validation Commands

```powershell
npm run typecheck
npm run lint
npm run build -w apps/web
```

### Stop Conditions

- Client directly inserts `organizations`, `organization_memberships`, or `membership_roles`.
- Password is logged, stored in app state beyond submission, or sent to a non-auth endpoint without server-side protection.
- Registration can complete without terms acknowledgement.
- Form supports Kadarn Platform (Internal).

## PCP-1.1d - Provisioning API

### Scope

Create the server-side provisioning path that atomically creates the user, organization, membership, role, capability assignments, active org, and actor-specific initial records.

Required operations:

1. Create auth user.
2. Ensure or create `user_profiles`.
3. Create `organizations`.
4. Create `organization_memberships`.
5. Assign owner/admin role through `membership_roles`.
6. Assign selected capabilities through `organization_capabilities`.
7. Initialize actor-specific workspace records.
8. Set active organization through server-side validated logic.
9. Emit audit/domain/integration events using existing mechanisms where appropriate.

### Files Likely Touched

- `apps/api/src/app/api/join/route.ts` or `apps/api/src/app/api/v1/onboarding/organization/route.ts`
- `apps/api/src/lib/onboarding.ts`
- `apps/api/src/lib/supabase-server.ts`
- `apps/api/src/lib/validation.ts`
- `apps/api/src/lib/workspace.ts`
- `apps/api/src/lib/audit.ts`
- `apps/api/src/app/api/organizations/route.ts` if existing create flow is consolidated instead of duplicated
- `tests/integration/onboarding-flow.test.ts`
- `tests/api/access-context.test.ts`

### Existing Modules To Reuse

- `createServiceClient()` for server-side provisioning operations requiring admin privileges
- Existing organization creation validation schema
- Existing `organization_roles` and `membership_roles` tables
- Existing `organization_capability_types` and `organization_capabilities` tables
- Existing active-org route semantics from `POST /api/v1/workspace/active-org`
- Existing `emitAuditEvent()`
- Existing onboarding hooks in `apps/api/src/lib/onboarding.ts`
- Existing `successResponse()` / error envelope helpers if applicable

### Risks

- Partial provisioning leaves auth user without organization or organization without owner.
- Creator receives active membership but no `org_admin`.
- Provisioning uses flat roles instead of `membership_roles`.
- Service role bypasses RLS without audit.
- Active org metadata is set without validating final membership.
- Duplicate organization names hit existing unique constraints after user creation.
- Retrying the same registration creates duplicate users or organizations.

### Validation Commands

```powershell
npm run typecheck
npm run build -w apps/api
npm run test -w tests -- --run tests/integration/onboarding-flow.test.ts
npm run test -w tests -- --run tests/api/access-context.test.ts
npm run test -w tests -- --run tests/security/identity.test.ts
npm run test -w tests -- --run tests/security/authorization.test.ts
```

### Stop Conditions

- Provisioning cannot be made atomic or compensating rollback is undefined.
- First user is not assigned `org_admin` through `membership_roles`.
- Provisioning writes a new actor table instead of capabilities.
- Provisioning enables `visibility_scope = public` by default.
- Provisioning creates sponsor portfolio memberships to institutions automatically.
- Audit cannot identify actor, organization, operation, result, and correlation id.

## PCP-1.1e - Institution Portfolio Initialization

### Scope

Initialize the institution-owned private portfolio/profile surface using existing models only.

Required behavior:

- Create or initialize institution profile/portfolio state after organization creation.
- Use existing continuity/profile/discovery/published-view/evidence models only.
- Do not create new domain tables unless a later implementation review proves no existing model can represent the required state.
- Keep all institution projections private until review/activation.

### Files Likely Touched

- `apps/api/src/lib/onboarding.ts`
- `apps/api/src/app/api/v1/institution/profile/route.ts`
- `apps/api/src/app/api/v1/institution/public/[slug]/route.ts` only if private/public boundary needs consolidation
- `apps/api/src/lib/continuity-claim-service.ts` if continuity profile initialization is reused
- `database/migrations/042_continuity_engine.sql` only if existing schema requires a safe seed/default change
- `supabase/migrations/042_continuity_engine.sql` if migration mirror changes are required
- `tests/integration/onboarding-flow.test.ts`

### Existing Modules To Reuse

- `organizations`
- `site_continuity_profiles`
- Institution profile routes
- Discovery session/run models if a private discovery setup checklist is needed
- Published View concepts only as locked projections
- Audit events

### Risks

- Confusing Institution Portfolio with Sponsor Portfolio.
- Creating public profile or passport by default.
- Creating claim/evidence truth from onboarding form data.
- Introducing a new `institution_portfolios` table unnecessarily.
- Failing when institution actor is a biobank, clinical site, or lab-like institution.

### Validation Commands

```powershell
npm run typecheck
npm run build -w apps/api
npm run test -w tests -- --run tests/integration/onboarding-flow.test.ts
npm run test -w tests -- --run tests/api/access-context.test.ts
```

### Stop Conditions

- Implementation requires a new institution portfolio table before proving existing profile/continuity/discovery models are insufficient.
- Institution onboarding creates public profile, public passport, or sponsor-visible passport automatically.
- Onboarding creates Evidence Core claims without evidence lifecycle review.
- Generated institution data cannot be traced to organization id.

## PCP-1.1f - Sponsor Portfolio Initialization

### Scope

Initialize sponsor portfolio scope for sponsor organizations.

Required behavior:

- Create one active sponsor portfolio for the sponsor organization.
- Create no institution memberships by default.
- Keep sponsor passport reads empty until portfolio memberships are explicitly created.
- Preserve Sponsor Passport access through portfolio scope.

### Files Likely Touched

- `apps/api/src/lib/onboarding.ts`
- `apps/api/src/lib/sponsor-passport/portfolio/repository.ts`
- `apps/api/src/lib/sponsor-passport/portfolio/types.ts`
- `apps/api/src/lib/sponsor-passport/factory.ts`
- `apps/api/src/app/api/v1/sponsor/passports/route.ts` only if empty state needs response normalization
- `database/migrations/051_sponsor_portfolio.sql` only if schema support is missing
- `supabase/migrations/059_sponsor_portfolio.sql` only if Supabase migration mirror changes are required
- `tests/api/sponsor-passport-portfolio.test.ts`
- `tests/api/sponsor-passport-mock.test.ts`
- `tests/integration/onboarding-flow.test.ts`

### Existing Modules To Reuse

- `sponsor_portfolios`
- `sponsor_portfolio_memberships`
- `SupabaseSponsorPortfolioRepository`
- `PassportStore`
- Sponsor Passport routes
- Existing sponsor shell and passport UI empty states

### Risks

- Auto-adding institutions to new sponsor portfolios.
- Treating portfolio membership as institution ownership.
- Creating sponsor passport sharing by default.
- Service-role portfolio writes without audit.
- Creating multiple active portfolios for one sponsor organization.

### Validation Commands

```powershell
npm run typecheck
npm run build -w apps/api
npm run test -w tests -- --run tests/api/sponsor-passport-portfolio.test.ts
npm run test -w tests -- --run tests/api/sponsor-passport-mock.test.ts
npm run test -w tests -- --run tests/integration/onboarding-flow.test.ts
```

### Stop Conditions

- New sponsor portfolio contains institution memberships by default.
- Sponsor can read a passport without portfolio scope.
- More than one active portfolio can be created for the same sponsor org.
- Sponsor onboarding enables public marketplace access or passport sharing automatically.

## PCP-1.1g - Password Recovery

### Scope

Add Supabase Auth password recovery flow.

Required changes:

- Add forgot password request page.
- Add reset password page.
- Use Supabase Auth password reset APIs.
- Preserve login behavior.
- Provide clear success/error states.

### Files Likely Touched

- `apps/web/src/app/(auth)/forgot-password/page.tsx`
- `apps/web/src/app/(auth)/reset-password/page.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/lib/supabase/client.ts`
- `apps/web/src/middleware.ts` if reset route requires auth middleware exception
- `apps/api/.env.example` and `apps/web/.env.example` only if redirect URL documentation is missing

### Existing Modules To Reuse

- Supabase browser client
- Existing auth page styling
- Existing login route and redirect handling
- Supabase Auth `resetPasswordForEmail` and `updateUser` semantics

### Risks

- Reset route is blocked by middleware.
- Redirect URLs are not configured for local/dev/prod.
- Reset page logs or exposes tokens.
- Password recovery breaks existing session handling.
- Forgot password is confused with organization registration.

### Validation Commands

```powershell
npm run typecheck
npm run lint
npm run build -w apps/web
npm run test:e2e -w apps/web
```

### Stop Conditions

- Reset password route cannot receive Supabase recovery session.
- Existing login fails after password recovery changes.
- Recovery flow requires organization context before user authentication.
- Tokens are printed to logs or UI.

## PCP-1.1h - Kadarn Internal Workspace

### Scope

Provision the internal Kadarn organization and Kadarn Operations Workspace. This is an internal/admin provisioning path, not public registration. It is separate from Initial Platform Bootstrap: bootstrap creates the first governed platform state, while PCP-1.1h defines the continuing operational workspace and internal access model.

Initialize:

- Kadarn organization
- Kadarn Operations Workspace
- Internal memberships
- Administrative roles
- Operations dashboard
- Review queues
- Governance services

Reuse existing authorization infrastructure wherever possible. Do not introduce duplicate permission systems.

### Files Likely Touched

- `database/migrations/011_seed_data.sql`
- `supabase/migrations/030_test_auth_users.sql`
- `database/migrations/030_test_auth_users.sql`
- `apps/api/src/lib/auth-guards.ts`
- `packages/auth/src/index.ts`
- `apps/web/src/middleware.ts`
- `apps/web/src/components/koc/koc-shell.tsx`
- `apps/web/src/app/(koc)/koc/*`
- `apps/api/src/app/api/v1/koc/*`
- `apps/api/src/app/api/v1/operations/*`
- `apps/api/src/lib/audit.ts`
- `tests/security/authorization.test.ts`
- `tests/security/identity.test.ts`
- `tests/api/access-context.test.ts`

### Existing Modules To Reuse

- `kadarn_role = kadarn_internal`
- KOC routes and shell
- `requireRole('kadarn_internal', ...)` where already used
- `organization_memberships` for internal Kadarn organization context where applicable
- `organization_roles` and `membership_roles` for internal org membership
- Audit events
- Policy engine/OPA shadow infrastructure
- Existing KOC/operations route guards
- Initial Platform Bootstrap outputs: Kadarn Organization, platform roles, and baseline system configuration

### Risks

- Creating a parallel internal permission model.
- Giving all internal users unrestricted customer data access.
- Letting internal users self-assign elevated roles.
- Missing audit reason for customer-context operations.
- Mixing customer org roles and platform-only roles without clear separation.
- Exposing internal provisioning through `/join`.

### Validation Commands

```powershell
npm run typecheck
npm run build -w apps/api
npm run build -w apps/web
npm run test -w tests -- --run tests/security/identity.test.ts
npm run test -w tests -- --run tests/security/authorization.test.ts
npm run test -w tests -- --run tests/api/access-context.test.ts
```

### Stop Conditions

- Kadarn Internal appears as a public `/join` option.
- KOC access works without `kadarn_internal` or an approved internal role path.
- Internal users can mutate customer data without audit.
- Internal elevated roles can be self-assigned.
- New permission tables or mechanisms duplicate existing auth/RLS/policy without explicit review.
- Continuing internal workspace provisioning is mixed with public registration or normal customer onboarding.

## PCP-1.1j - Invitation and Membership Management

### Scope

Add the governed path for all users after the first owner. A second, third, or later user should not publicly register an already-created organization. They should join through invitation and membership acceptance.

Required changes:

- Invite users.
- Accept invitation.
- Track membership lifecycle.
- Remove member.
- Transfer ownership.
- Enforce organization ownership safeguards.

Canonical flow:

```text
Organization Creation
  -> First Owner
  -> Invite Members
  -> Membership Accepted
  -> Workspace Access
```

### Files Likely Touched

- `apps/api/src/app/api/organizations/[id]/invite/route.ts`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/api/src/app/api/v1/workspace/active-org/route.ts`
- `apps/api/src/lib/auth-guards.ts`
- `apps/api/src/lib/audit.ts`
- `apps/web/src/app/(auth)/join/*` only for invitation acceptance, not organization creation
- `apps/web/src/components/auth/*`
- `apps/web/src/components/workspace/workspace-shell.tsx`
- `database/migrations/008_organizations_capabilities.sql` only if lifecycle/state values require schema correction
- `database/migrations/009_rls_foundation.sql` only if RLS needs lifecycle alignment
- `tests/integration/onboarding-flow.test.ts`
- `tests/api/access-context.test.ts`
- `tests/security/authorization.test.ts`

### Existing Modules To Reuse

- `organization_memberships`
- `membership_roles`
- `organization_roles`
- Existing invite route, corrected to use `membership_roles`
- Workspace profile membership resolution
- Validated active organization setter
- Audit event infrastructure
- Existing RLS helper functions

### Risks

- Invite route continues to use flat membership roles instead of `membership_roles`.
- Invited users get workspace access before acceptance.
- Removed members retain active org metadata and can access workspace routes.
- Ownership transfer leaves an organization with no owner/admin.
- Multiple public signups create duplicate organization records for the same real organization.
- Membership lifecycle states are implemented only in UI copy and not enforced by API/RLS.

### Validation Commands

```powershell
npm run typecheck
npm run build -w apps/api
npm run build -w apps/web
npm run test -w tests -- --run tests/integration/onboarding-flow.test.ts
npm run test -w tests -- --run tests/api/access-context.test.ts
npm run test -w tests -- --run tests/security/authorization.test.ts
```

### Stop Conditions

- A non-owner can invite members without a valid admin role.
- A second public registration can claim or create an existing organization.
- A user in `invited` or `pending_acceptance` state can access the workspace as active.
- Removing a member does not revoke active organization access.
- Ownership transfer can leave zero active owners.
- Membership changes are not auditable.

## PCP-1.1i - Tests

### Scope

Add focused tests for the full onboarding surface.

Required test categories:

- Unit tests for actor-to-capability mapping.
- API tests for provisioning atomicity and roles.
- API tests for active-org context after onboarding.
- API tests for sponsor portfolio initialization.
- API tests for institution portfolio/profile initialization.
- Security tests for role/membership/RLS boundaries.
- E2E smoke journey from login/register to landed workspace.
- Password recovery smoke journey.
- Internal Kadarn access tests for KOC restrictions.
- Invitation, acceptance, removal, and ownership-transfer tests.
- Organization and membership lifecycle state tests.
- Workspace-not-organization regression tests.

### Files Likely Touched

- `tests/integration/onboarding-flow.test.ts`
- `tests/api/access-context.test.ts`
- `tests/security/identity.test.ts`
- `tests/security/authorization.test.ts`
- `tests/api/sponsor-passport-portfolio.test.ts`
- `tests/api/sponsor-passport-identity-capabilities.test.ts`
- `tests/web/*` for web utility tests if new helpers are created
- `apps/web/e2e/*` or existing Playwright specs if E2E coverage exists there
- `tests/setup/seed-users.ts` only if new seed users are required

### Existing Modules To Reuse

- Vitest setup in `tests`
- Playwright setup in `apps/web`
- Existing Supabase test seed helpers
- Existing identity/security/authorization tests
- Existing sponsor passport fixtures

### Risks

- Tests depend on local Supabase state that is not seeded consistently.
- E2E relies on E2E auth bypass and misses real auth behavior.
- Tests pass with mock stores but fail in evidence-core or production-like mode.
- Test coverage does not verify `membership_roles`.
- Test coverage does not verify marketplace/passport locks.

### Validation Commands

```powershell
npm run test -w tests -- --run tests/integration/onboarding-flow.test.ts
npm run test -w tests -- --run tests/api/access-context.test.ts
npm run test -w tests -- --run tests/security/identity.test.ts
npm run test -w tests -- --run tests/security/authorization.test.ts
npm run test -w tests -- --run tests/api/sponsor-passport-portfolio.test.ts
npm run test:e2e -w apps/web
npm run typecheck
npm run lint
```

### Stop Conditions

- Tests do not assert first-user `membership_roles` assignment.
- Tests do not assert marketplace visibility is disabled by default.
- Tests do not assert sponsor passport access is empty/locked without portfolio membership.
- Tests only cover mocked auth and skip real Supabase Auth paths.
- Tests require manual DB mutation to pass.

## Cross-Phase Implementation Notes

### Actor To Capability Mapping

Use existing capabilities only:

| Public actor | Initial capability candidates |
|---|---|
| Institution | `clinical_site`, `biobank`, `processing_lab`, `diagnostic_lab`, `storage_facility`, `data_processor` |
| Sponsor | `sponsor` |
| CRO | `cro` |
| Network | existing capabilities selected by actual function, commonly `cro`, `clinical_site`, `data_processor`, or `technology_provider` |
| Vendor | `logistics_vendor`, `diagnostic_lab`, `processing_lab`, `storage_facility`, `technology_provider`, `data_processor` |

Stop if a phase requires a new capability key before documenting why existing capability keys cannot express the actor.

### Provisioning Atomicity

The provisioning API should use either a database function/transactional server path or an explicit compensation strategy. The minimum all-or-nothing target is:

```text
auth user
  -> profile
  -> organization
  -> membership
  -> role assignment
  -> capability assignment
  -> active org metadata
  -> actor-specific initialization
  -> audit event
```

Stop if implementation can leave a customer with an auth user but no recoverable organization owner path.

### Visibility And Sharing Defaults

Default state for new organizations:

- Private operational workspace exists.
- Marketplace visibility is not activated.
- Sponsor Passport sharing is not activated.
- Public profile/passport links are not activated.
- Claims are not published.
- Discovery candidates are not promoted.

Stop if any phase makes onboarding synonymous with publication.

### Organization And Membership Lifecycle Enforcement

The lifecycle states documented above should become product contracts for implementation. They may map to existing database values first, but implementation should not erase the distinction between:

- organization provisioning state: `pending`, `under_review`, `active`, `suspended`, `archived`
- membership state: `invited`, `pending_acceptance`, `active`, `suspended`, `removed`

Stop if implementation only changes UI labels while APIs and guards still treat all non-removed states as active.

### Workspace Boundary

Workspace provisioning should create the primary workspace required for the actor's first job. It must not assume a permanent one-to-one relationship between organization and workspace.

```text
Organization
  -> primary workspace at onboarding
  -> additional workspaces later through capabilities, policy, or activation
```

Stop if data models, route names, or permissions make it impossible for one organization to have multiple workspace surfaces in the future.

## Final Rollout Gate

PCP-1.1 implementation is ready to move from development to certification only when:

1. Initial Platform Bootstrap is one-time, idempotent, audited, and separate from public onboarding.
2. New external users can register an organization-first account.
3. The first user is an active member and `org_admin`.
4. Later users join only through invitation or governed membership flows.
5. Active org is set through a validated server path.
6. Workspace navigation resolves from capabilities.
7. Workspace provisioning does not assume a permanent one-to-one organization/workspace relationship.
8. Organization lifecycle states are represented or explicitly mapped for policy/governance.
9. Membership lifecycle states are represented or explicitly mapped for access control.
10. Sponsor onboarding creates an empty sponsor portfolio.
11. Institution onboarding initializes a private institution profile/portfolio surface using existing models.
12. Vendor onboarding lands in a contribution/confirmation workspace.
13. Password recovery works with Supabase Auth.
14. Kadarn Internal is provisioned outside public registration and lands in `/koc`.
15. Internal access is audited and does not bypass governance.
16. Future multi-organization membership remains compatible with the identity model.
17. Marketplace visibility and Sponsor Passport sharing remain locked by default.
18. Unit, API, security, and E2E smoke tests pass.

## Step 4 Conclusion

PCP-1.1 should be implemented as a consolidation program, not a redesign. The smallest safe path is to add one-time platform bootstrap, UX entry points, actor selection, registration, a transactional provisioning API, private actor-specific initialization, password recovery, internal Kadarn workspace provisioning, invitation and membership management, and focused tests. Each phase must stop if it requires a new domain, automatic sharing, a duplicate permission model, or a permanent one-to-one assumption between organization and workspace.
