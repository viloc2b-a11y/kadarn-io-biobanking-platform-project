# PCP-1.1 Identity and Workspace Provisioning Audit

**Program:** Kadarn Platform Consolidation - PCP  
**Phase:** PCP-1.1  
**Step:** 1 - Current State Audit  
**Mode:** Discovery only. No code changes.  
**Objective:** Determine how registration, login, organization creation, memberships, roles, workspace access, and sponsor/institution routing currently work.

## Executive Verdict

Kadarn already has the correct organization-first foundation: `Organization` is the persistent anchor, `User Profile` is linked to Supabase Auth, and access is mediated through `organization_memberships`, roles, capabilities, active organization metadata, RLS, and route guards.

The current implementation is not yet a complete organization-first onboarding system. It supports login, profile resolution, organization creation, workspace access, active organization switching, capability-driven workspace navigation, and sponsor passport reads. It does not yet provide a full registration/provisioning workflow for all actor types, and several boundaries are inconsistent: creator roles, invite roles, active org metadata, public sharing, and marketplace visibility.

PCP-1.1 should reuse the existing identity, organization, membership, capability, workspace, sponsor portfolio, and passport architecture. No new domain model is needed for the supported actors.

## Governance Inputs

This audit follows:

- `docs/platform-discovery/platform-capability-audit.md`
- `docs/platform-discovery/knowledge-model.md`
- `docs/platform-discovery/canonical-platform-vocabulary.md`
- `docs/platform-discovery/platform-consolidation-master-plan.md`
- `docs/platform-discovery/kadarn-platform-constitution-v1.0.md`

Relevant constitutional rules:

1. Organization is the persistent anchor.
2. Institution is a product reading of Organization.
3. Portfolio defines sponsor access scope, not institutional truth.
4. Policy and permission are layered.
5. Projections such as Passports are not sources of truth.
6. Consolidation comes before expansion.

## Supported Actor Model

The repository does not model external actors as separate domains. It models them as organizations with capabilities and memberships. Kadarn Platform (Internal) is different: it is represented as a platform role and KOC/operations access path, not as a customer organization type.

| Actor | Current representation | Evidence |
|---|---|---|
| Institution / Research Site | `organizations` row plus capabilities such as `clinical_site`, `biobank`, `processing_lab`, or `diagnostic_lab` | `organization_capability_types`, workspace profile capability mapping |
| Sponsor | `organizations` row with `sponsor` capability; sponsor portfolio controls passport scope | `sponsor_portfolios`, `sponsor_portfolio_memberships`, sponsor passport routes |
| CRO | `organizations` row with `cro` capability | capability seed and workspace profile mapping |
| Network / SMO / Academic Network | `organizations` row; may use network/public visibility and organization capabilities | marketplace/network routes and org visibility scope |
| Vendor / Central Lab / Technology Partner | `organizations` row with `logistics_vendor`, `storage_facility`, `technology_provider`, `processing_lab`, or related capabilities | capability seed and workspace app mapping |
| Kadarn Platform (Internal) | Supabase user metadata role `kadarn_internal`; routes to KOC and internal operations surfaces | `kadarn_role`, `@kadarn/auth`, `/koc`, KOC API route guards |

## Current State Summary

| Area | Current state | Status |
|---|---|---|
| User registration | No product registration UI; Supabase signup exists in seed/test paths and DB trigger creates `user_profiles`. | Partial |
| Login | `/login` signs in with Supabase Auth and redirects by JWT role plus `active_org_id`. | Partial |
| Session context | Web session provider, middleware, API `withAuth`, `/api/me`, workspace profile all exist. | Partial |
| User profile | `user_profiles` exists and is auto-created from Supabase Auth signup trigger. | Implemented |
| Organization creation | `POST /api/organizations` creates organization and active membership for creator. | Partial |
| Memberships | `organization_memberships` exists; active memberships feed workspace profile. | Partial |
| Roles | DB roles use `organization_roles` + `membership_roles`; JWT role uses `kadarn_role`. | Partial / inconsistent |
| Active organization | `POST /api/v1/workspace/active-org` validates membership and writes `active_org_id` to user metadata. | Implemented / split path |
| Workspace access | `/workspace` is guarded by metadata flag; workspace APIs validate membership. | Partial |
| Sponsor routing | `/sponsor` requires authenticated user with active org; sponsor passport APIs use active org as sponsor org. | Partial |
| Institution routing | `/api/v1/institution/profile` uses active organization; public institution profile route exists. | Partial |
| Marketplace visibility | `visibility_scope` exists; marketplace route behavior and RLS expectations are not fully aligned. | Partial |
| Passport sharing | Sponsor passport uses portfolio scope; continuity/site passport public sharing has auth boundary drift. | Partial |

## User Registration

### What Exists

- `user_profiles` is created automatically when a Supabase Auth user is inserted.
- Seed and test paths create Supabase users.
- `admin_create_user()` exists in migrations for seed/admin setup.

### What Is Missing

- No self-service signup page.
- No account recovery UI.
- No invite acceptance UI.
- No organization-first registration wizard.
- No actor-specific provisioning flow for Institution, Sponsor, CRO, Network, or Vendor.

### Evidence

- `apps/web/src/app/(auth)/login/page.tsx`
- `database/migrations/008_organizations_capabilities.sql`
- `supabase/migrations/057_gotrue_seed_compat.sql`
- `tests/setup/seed-users.ts`
- `tests/integration/seed-auth-local.test.ts`

## Login and Routing

### Current Login Flow

1. User enters email/password on `/login`.
2. Web calls `supabase.auth.signInWithPassword`.
3. Login reads `kadarn_role` from `user.user_metadata`.
4. Login treats `Boolean(user.user_metadata.active_org_id)` as membership presence.
5. Redirect goes to:
   - `/koc` for `kadarn_internal`
   - `/workspace` for organization members
   - `/marketplace` otherwise

### Current Issue

Login does not query membership rows. A user with real memberships but no `active_org_id` can be sent to `/marketplace` instead of an organization-selection flow.

### Evidence

- `apps/web/src/app/(auth)/login/page.tsx`
- `packages/auth/src/index.ts`

## Session Context

### Web

- `SessionProvider` loads Supabase user.
- Middleware refreshes SSR auth session.
- Middleware uses `active_org_id` as a lightweight membership flag.
- E2E auth bypass exists behind test flags.

### API

- `withAuth` resolves Supabase user from cookie or Bearer token.
- `createRouteClient()` uses user context.
- `createServiceClient()` uses service role for admin/server operations.

### Risk

`active_org_id` lives in user metadata. The repository already warns that this metadata is client-settable and must be validated against `organization_memberships` for authorization.

### Evidence

- `apps/web/src/components/providers/session-provider.tsx`
- `apps/web/src/middleware.ts`
- `apps/api/src/lib/supabase-server.ts`
- `apps/api/src/lib/workspace.ts`

## User Profiles

### Current Behavior

- `user_profiles` is a 1:1 profile table linked to `auth.users`.
- `/api/me` returns profile and memberships.
- `/api/v1/workspace/profile` returns profile, memberships, active org, allowed experiences, and default redirect.

### Current Drift

- Product/app types still model some profile role concepts that do not map directly to DB profile columns.
- `kadarn_role` comes from Supabase user metadata, not from `user_profiles`.

### Evidence

- `apps/api/src/app/api/me/route.ts`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `packages/types/src/index.ts`
- `database/migrations/008_organizations_capabilities.sql`

## Organization Creation

### Current Behavior

`POST /api/organizations`:

1. Requires authenticated user.
2. Validates organization payload.
3. Inserts `organizations` with `created_by = user.id`.
4. Inserts active `organization_memberships` row for creator.
5. Emits onboarding side effects through current onboarding helpers.

### Critical Gap

The route creates an active membership but does not create a `membership_roles` row assigning `org_admin` to the creator. RLS admin helpers and capability assignment paths expect roles through `membership_roles`.

### Risk

An organization creator may not be able to administer the organization through role-protected paths unless a separate seed/manual role assignment exists.

### Evidence

- `apps/api/src/app/api/organizations/route.ts`
- `database/migrations/008_organizations_capabilities.sql`
- `database/migrations/009_rls_foundation.sql`

## Memberships

### Current Behavior

- `organization_memberships` links user to organization.
- Membership status supports `invited`, `active`, `suspended`, and `inactive`.
- Workspace profile reads active memberships.
- Active organization API validates active membership before writing metadata.

### Current Gaps

- Invite flow creates invited membership but does not persist the requested role into `membership_roles`.
- Invite flow references `organization_memberships.role`, but the schema uses a role junction table.
- No invitation acceptance workflow is evidenced.

### Evidence

- `apps/api/src/app/api/organizations/[id]/invite/route.ts`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/api/src/app/api/v1/workspace/active-org/route.ts`

## Roles and Permissions

### Current Role Sources

| Role source | Storage | Current use |
|---|---|---|
| Platform role | `user.user_metadata.kadarn_role` | KOC routing, login redirect, API role guards |
| Organization role | `organization_roles` and `membership_roles` | RLS admin checks, workspace profile role |
| Invite role | request body in invite route | Logged in event payload, not persisted as DB role |

### Current Risk

Role semantics are split. Some routes check JWT `kadarn_role`; others inspect DB membership roles; invite and some types still assume simpler flat role concepts.

### Evidence

- `packages/auth/src/index.ts`
- `apps/api/src/lib/auth-guards.ts`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts`
- `packages/types/src/index.ts`

## Active Organization

### Current Server Path

`POST /api/v1/workspace/active-org`:

1. Requires auth.
2. Validates requested `org_id`.
3. Uses service client to verify active membership.
4. Updates Supabase user metadata with `active_org_id`.
5. Emits audit event.

This is the strongest existing active organization path.

### Current Client Path

`OrgSelector` updates Supabase user metadata directly using `supabase.auth.updateUser({ data: { active_org_id } })`.

### Current Risk

There are two active-org writers:

- server-validated active-org API
- client-side metadata update

The server path is safer and should be treated as canonical in future prompts.

### Evidence

- `apps/api/src/app/api/v1/workspace/active-org/route.ts`
- `apps/web/src/components/auth/org-selector.tsx`
- `apps/api/src/lib/workspace.ts`

## Workspace Access

### Current Behavior

- `/workspace` route access is gated by auth plus membership flag from metadata.
- `WorkspaceShell` loads:
  - `/api/v1/workspace/profile`
  - `/api/v1/workspace/navigation`
- Workspace profile resolves:
  - user
  - memberships
  - active org
  - allowed experiences
  - default redirect
- Navigation is capability-driven.

### Actor Capability Mapping

`workspace/profile` maps organization capabilities to application access:

| Capability | Current application mapping |
|---|---|
| `biobank` | inventory, collections, qc, exchange, analytics |
| `processing_lab` | processing, qc, exchange, analytics |
| `storage_facility` | inventory, logistics, analytics |
| `sponsor` | programs, discovery, exchange, analytics, payments |
| `cro` | programs, exchange, qc, logistics, analytics |
| `clinical_site` | consent, collections, exchange, regulatory |
| `logistics_vendor` | logistics, exchange, analytics |
| `irb` | regulatory, programs, analytics |
| `regulatory_body` | regulatory, analytics |
| `diagnostic_lab` | processing, qc, exchange, analytics |
| `data_processor` | analytics, exchange |
| `technology_provider` | exchange, analytics |

### Current Gaps

- `/auth/select-org` is returned by profile logic for multi-org users, but no route was found.
- Workspace shell has an inline org selector.
- Sponsor organizations are not automatically sent to `/sponsor`; they remain valid in generic `/workspace`.

### Evidence

- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/api/src/app/api/v1/workspace/navigation/route.ts`
- `apps/web/src/components/workspace/workspace-shell.tsx`
- `tests/api/access-context.test.ts`

## Sponsor Routing and Passport Access

### Current Behavior

- `/sponsor/*` is guarded by middleware requiring authenticated user plus `active_org_id`.
- `SponsorShell` uses session metadata and displays sponsor workspace UI.
- Sponsor Passport API uses:
  - `withAuth`
  - `requireOrgMembership`
  - active org as sponsor organization id
  - `PassportStore`
  - sponsor portfolio repository
- Sponsor Passport detail returns only if the institution is in the sponsor portfolio.

### What Works

The sponsor passport access model aligns with the constitution:

```text
Sponsor organization
  -> Sponsor portfolio
  -> Portfolio membership
  -> Institution passport projection
```

Portfolio controls scope. It does not define institution truth.

### Current Gaps

- Most sponsor pages outside passports are placeholder surfaces.
- Sponsor shell does not fully resolve org context from workspace profile; it primarily uses user metadata/E2E profile.
- Passport sharing/action buttons remain disabled.

### Evidence

- `apps/web/src/components/sponsor/sponsor-shell.tsx`
- `apps/api/src/app/api/v1/sponsor/passports/route.ts`
- `apps/api/src/app/api/v1/sponsor/passports/[institutionId]/route.ts`
- `apps/api/src/lib/sponsor-passport/*`
- `apps/api/src/lib/sponsor-passport/portfolio/*`

## Institution Routing

### Current Behavior

- Authenticated institution profile route exists at `/api/v1/institution/profile`.
- Public institution route exists at `/api/v1/institution/public/[slug]`.
- Site/continuity passport route exists under continuity APIs and UI.

### Current Gaps

- Public route semantics are split between institution public profile and continuity/site passport.
- Public passport read behavior has documented cutover/auth boundary drift in existing discovery/PCP docs.
- Institution is not a separate table; it is a product reading of `organizations`.

### Evidence

- `apps/api/src/app/api/v1/institution/profile/route.ts`
- `apps/api/src/app/api/v1/institution/public/[slug]/route.ts`
- `apps/api/src/app/api/v1/continuity/passport/[slug]/route.ts`
- `docs/platform-discovery/canonical-platform-vocabulary.md`

## Marketplace Visibility

### Current Behavior

- `organizations.visibility_scope` supports `organization`, `program`, `network`, and `public`.
- Marketplace organization/network routes use `visibility_scope` filters.
- Marketplace search and request routes are separate from workspace provisioning.

### Rule Confirmation

Marketplace visibility is not automatically activated by identity provisioning. Creating an organization does not by itself prove readiness for marketplace exposure or passport sharing.

### Current Risk

Some marketplace routes imply anonymous browsing while RLS and route behavior are not consistently proven for anonymous public access.

### Evidence

- `apps/api/src/app/api/v1/marketplace/organizations/route.ts`
- `apps/api/src/app/api/v1/marketplace/network/route.ts`
- `database/migrations/009_rls_foundation.sql`
- `docs/platform-discovery/platform-consolidation-master-plan.md`

## Passport Sharing

### Current Behavior

- Sponsor Passport sharing is scoped through sponsor portfolio memberships.
- Continuity/Site Passport has `passport_visibility` concepts.
- Evidence Core has visibility concepts for evidence/claim access.

### Rule Confirmation

Passport sharing is not automatically activated by organization provisioning. It requires explicit projection/read-model visibility and/or portfolio scope.

### Current Gaps

- Sponsor Passport action/share controls are disabled in UI.
- Continuity public/shared link behavior is not fully aligned with authenticated route behavior.
- `requireConsent()` references an `institutional_consent` concept, but current repository evidence does not show a complete persisted consent model.

### Evidence

- `apps/api/src/app/api/v1/sponsor/passports/*`
- `apps/api/src/lib/auth-guards.ts`
- `apps/web/src/components/sponsor/sponsor-shell.tsx`
- `docs/platform-discovery/knowledge-model.md`

## Existing Tests and Coverage Signals

| Test file | Coverage signal |
|---|---|
| `tests/security/identity.test.ts` | Identity/security foundations |
| `tests/integration/identity-bootstrap.test.ts` | Identity bootstrap behavior |
| `tests/integration/seed-auth-local.test.ts` | Local auth seed compatibility |
| `tests/integration/multi-tenant.test.ts` | Multi-tenant org/membership expectations |
| `tests/security/authorization.test.ts` | Authorization/RLS behavior |
| `tests/api/access-context.test.ts` | Workspace profile, active org, app access |
| `tests/integration/onboarding-flow.test.ts` | Onboarding flow signals |

Tests were inventoried only for this Step 1 audit; they were not executed.

## Current-State Risk Register

| Risk | Severity | Evidence |
|---|---|---|
| Organization creator is not assigned `org_admin` in `membership_roles`. | Critical | `POST /api/organizations`, RLS role model |
| Invite route references nonexistent flat `role` column and does not persist `membership_roles`. | High | `organizations/[id]/invite/route.ts`, schema |
| Active org can be written by client metadata path as well as validated server path. | High | `OrgSelector`, `workspace/active-org`, `workspace.ts` warning |
| Middleware gates workspace/sponsor by metadata flag, not DB membership. | High | `apps/web/src/middleware.ts` |
| Role model is split between `kadarn_role`, `organization_roles`, and invite role body. | High | auth package, workspace profile, migrations |
| `/auth/select-org` is referenced but not implemented as a route. | Medium | workspace profile redirect logic |
| Sponsor workspace shell is mostly placeholder outside passports. | Medium | sponsor shell/pages, PCP master plan |
| Marketplace visibility and anonymous browse are not proven end-to-end. | Medium | marketplace routes and RLS |
| Passport sharing controls are present but disabled/incomplete. | Medium | sponsor shell action bar |
| `institutional_consent` guard exists but complete persistence/use is not evidenced. | Medium | `auth-guards.ts` |

## Reuse Inventory for Future Prompts

Future PCP-1.1 design should reuse these assets:

| Asset | Why reuse |
|---|---|
| `organizations` | Persistent anchor for every actor type. |
| `organization_capability_types` and `organization_capabilities` | Existing actor/function model; avoids adding new actor domains. |
| `user_profiles` | Existing Supabase Auth profile mirror. |
| `organization_memberships` | Existing user-to-organization access relationship. |
| `organization_roles` and `membership_roles` | Existing org role model. |
| `POST /api/v1/workspace/active-org` | Validated active organization setter. |
| `/api/v1/workspace/profile` | Existing access-context read model. |
| `/api/v1/workspace/navigation` | Capability-driven workspace navigation. |
| `PassportStore` and sponsor portfolio repository | Existing sponsor passport access scope. |
| RLS helper functions | Existing authorization foundation. |
| `@kadarn/auth` | Existing experience routing and Supabase SSR helpers. |

## Step 1 Conclusions

1. Kadarn already provisions around organizations conceptually, but the runtime onboarding path is incomplete.
2. The strongest source-of-truth chain is Supabase Auth user -> `user_profiles` -> `organization_memberships` -> `membership_roles` -> active org -> workspace profile/navigation.
3. The current org creation route starts the chain but does not finish it because it does not assign `org_admin` through `membership_roles`.
4. Actor type should be implemented through capabilities, not a new actor table or domain.
5. Marketplace visibility and passport sharing must remain explicit, separate activation steps.
6. Sponsor Passport access should continue using portfolio membership as the scope mechanism.
7. The next PCP-1.1 prompts should design the minimal organization-first provisioning flow around the existing schema and access context, not replace it.
