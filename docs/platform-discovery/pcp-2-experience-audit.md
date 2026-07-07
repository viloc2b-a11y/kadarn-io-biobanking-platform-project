# PCP-2 Experience and Navigation Consolidation Audit

**Program:** Kadarn Platform Consolidation - PCP  
**Phase:** PCP-2  
**Step:** 1 - Current State Audit  
**Mode:** Discovery only. No code changes.  
**Objective:** Determine how routing, layouts, shells, navigation, dashboards, workspace routing, marketplace navigation, sponsor experience, settings, authentication redirects, user menus, and responsive behavior currently work.

## Executive Verdict

Kadarn already has several meaningful product experiences: Marketplace, Workspace, Sponsor Workspace, and Kadarn Operations Center. Each has enough routing and shell structure to be recognizable, and the Workspace experience already resolves active organization, memberships, roles, capabilities, applications, and default redirects through API-backed profile/navigation endpoints.

The current experience architecture is not yet consolidated. Shells are implemented separately, navigation definitions live in multiple places, routing prefixes do not always match layout ownership, dashboard entry points are split by experience, and responsive behavior is mostly incidental. The main PCP-2 work should be consolidation, not redesign: preserve the existing experiences while normalizing shell contracts, navigation sources, dashboard selection, route guards, user menu behavior, and settings placement.

## Governance Inputs

This audit follows:

- `docs/platform-discovery/kadarn-platform-constitution-v1.0.md`
- `docs/platform-discovery/knowledge-model.md`
- `docs/platform-discovery/canonical-platform-vocabulary.md`
- `docs/platform-discovery/pcp-1.1-identity-provisioning-spec.md`
- `docs/platform-discovery/pcp-1.2-membership-spec.md`

Relevant governing rules:

1. Organization is the persistent anchor.
2. Membership and role determine workspace access.
3. Organization capabilities drive workspace applications.
4. Marketplace visibility and sponsor passport sharing are not automatic.
5. Passports, dashboards, institution profiles, and reports are projections, not sources of truth.
6. Sponsor portfolio defines sponsor institution access scope.
7. Policy governs visibility and operations.
8. Consolidation comes before expansion.

## Evidence Base

| Area | Evidence |
|---|---|
| Root app layout/session | `apps/web/src/app/layout.tsx`, `apps/web/src/components/providers/session-provider.tsx` |
| Marketplace layout | `apps/web/src/app/(marketplace)/layout.tsx` |
| Workspace layout/shell | `apps/web/src/app/(workspace)/layout.tsx`, `apps/web/src/components/workspace/workspace-shell.tsx` |
| Sponsor layout/shell | `apps/web/src/app/(sponsor)/layout.tsx`, `apps/web/src/components/sponsor/sponsor-shell.tsx`, `apps/web/src/components/sponsor/sponsor-nav.ts` |
| KOC layout/shell | `apps/web/src/app/(koc)/layout.tsx`, `apps/web/src/components/koc/koc-shell.tsx` |
| Auth redirects/guards | `apps/web/src/middleware.ts`, `packages/auth/src/index.ts`, `apps/web/src/app/(auth)/login/page.tsx` |
| Workspace profile/navigation APIs | `apps/api/src/app/api/v1/workspace/profile/route.ts`, `apps/api/src/app/api/v1/workspace/navigation/route.ts` |
| Org selector | `apps/web/src/components/auth/org-selector.tsx` |
| Marketplace search/CTA | `apps/web/src/components/marketplace/discovery.tsx`, `apps/web/src/components/marketplace/request-cta.tsx` |

## Current Application Shell Architecture

The app uses Next.js route groups to mount different experience shells without always exposing the group name in the URL.

| Experience | Route group | URL family | Shell/layout | Primary pattern |
|---|---|---|---|---|
| Root | none | `/` | `app/layout.tsx` | Global `SessionProvider`; `/` redirects to `/marketplace`. |
| Marketplace | `(marketplace)` | `/marketplace/*` | Marketplace layout | Public top navigation with sign-in/workspace links. |
| Workspace | `(workspace)` | `/workspace/*` and currently `/settings/members` | `WorkspaceShell` | Authenticated org workspace with left sidebar, active org switcher, top bar. |
| Sponsor | `(sponsor)` | `/sponsor/*` | `SponsorShell` | Sponsor-specific three-panel KUX shell with context bar and action bar. |
| KOC | `(koc)` | `/koc/*` | `KocShell` | Internal operations sidebar/topbar with notifications. |
| Auth | `(auth)` | `/login`, `/join`, `/forgot-password` | Page-level auth UI | Standalone auth/onboarding pages. |

### Assessment

Kadarn currently has a multi-shell architecture. That matches product needs, but there is no shared shell contract for brand, user menu, organization context, navigation, responsive behavior, or cross-experience switching.

## Routing

### What Exists

- `/` redirects to `/marketplace`.
- `/marketplace/*` is public-facing marketplace/navigation.
- `/workspace/*` is generic organization workspace.
- `/sponsor/*` is sponsor-specific workspace.
- `/koc/*` is Kadarn internal operations.
- `/settings/members` is mounted through the workspace route group and therefore uses `WorkspaceShell`, even though its URL does not begin with `/workspace`.
- `/site-passport/[slug]` and `/report/kpe/[id]` are standalone projection/report routes.
- `/join`, `/join/[actor]`, `/forgot-password`, and `/login` are auth/onboarding routes.

### Current Routing Drift

Route group ownership and URL prefix ownership are not always aligned. The clearest example is `/settings/members`: it renders inside `(workspace)` and `WorkspaceShell`, but middleware route guards only special-case `/workspace`, `/sponsor`, and `/koc`.

### Assessment

PCP-2 should decide whether settings belong under `/workspace/settings/*` or whether middleware and route access should explicitly recognize `/settings/*` as a workspace-owned route family.

## Existing Layouts

| Layout | Behavior |
|---|---|
| `apps/web/src/app/layout.tsx` | Global metadata, CSS, `SessionProvider`. |
| `(marketplace)/layout.tsx` | Public header/top nav; links to Marketplace sections, Workspace, Sign in. |
| `(workspace)/layout.tsx` | Wraps children in `WorkspaceShell`. |
| `(sponsor)/layout.tsx` | Wraps children in `SponsorShell`. |
| `(koc)/layout.tsx` | Wraps children in `KocShell`. |

### Layout Observations

- Layouts are simple and mostly delegate to shell components.
- Marketplace layout is implemented inline rather than as a reusable shell component.
- Workspace, Sponsor, and KOC shells are client components with local fetch/redirect behavior.
- Shell visual language is similar but duplicated.

## Workspace Separation

### Marketplace

Marketplace is public-first. It exposes discovery navigation:

- Discover
- Organizations
- Collections
- Services
- Requests

Marketplace links to Workspace and Sign in. Marketplace request CTA redirects unauthenticated users to `/login?next=...`.

### Workspace

Workspace is authenticated and organization-contextual. It resolves:

- user profile
- active org
- memberships
- capabilities
- applications
- allowed experiences
- default redirect

Workspace navigation is API-driven from active organization capabilities, with a local static Settings section currently appended by the shell.

### Sponsor

Sponsor is a separate experience at `/sponsor/*`. It has its own shell and static `SPONSOR_SURFACES` navigation:

- Dashboard
- Portfolio Intelligence
- Institutional Passports
- Feasibility Search
- Opportunity Discovery
- Risk Monitoring
- Notifications

Sponsor shell references active org metadata but does not use the same workspace profile/navigation shell contract.

### KOC

KOC is internal at `/koc/*`. It has a static sidebar grouped as:

- Network
- Evidence
- Intelligence
- Engines
- Platform

KOC uses `kadarn_internal` role checks in middleware/auth and shell-level client redirect.

### Assessment

The experiences are differentiated but not unified. Workspace is capability-driven; Sponsor and KOC are static navigation maps; Marketplace has inline top navigation. PCP-2 should consolidate navigation shape while preserving experience-specific surfaces.

## Navigation Duplication

Navigation is currently defined in multiple places:

| Navigation source | Location | Type |
|---|---|---|
| Marketplace top nav | `apps/web/src/app/(marketplace)/layout.tsx` | Inline static links |
| Workspace base/capability nav | `apps/api/src/app/api/v1/workspace/navigation/route.ts` | API-derived from capabilities |
| Workspace settings nav | `apps/web/src/components/workspace/workspace-shell.tsx` | Local static section |
| Sponsor surfaces | `apps/web/src/components/sponsor/sponsor-nav.ts` | Static typed config |
| KOC nav | `apps/web/src/components/koc/koc-shell.tsx` | Static inline config |
| Dashboard cards/next actions | workspace/sponsor/KOC pages | Page-local links |

### Current Issues

- There is no shared navigation item type across Marketplace, Workspace, Sponsor, and KOC.
- Active link logic is duplicated in shell components.
- Brand/logo markup is duplicated across Marketplace, Workspace, Sponsor, and KOC.
- User/sign-out behavior is duplicated in Workspace, Sponsor, and KOC.
- Marketplace is top-nav only, while other experiences are sidebar/complex-shell based.
- Settings navigation is not yet part of the API navigation model.

## Sidebar

### Workspace Sidebar

Workspace sidebar:

- fixed width `228`
- fixed position
- brand header
- active organization switcher
- capability badges
- API-driven nav sections
- local Settings > Members section
- user footer/sign out

### KOC Sidebar

KOC sidebar:

- fixed width `228`
- fixed position
- brand/KOC header
- static nav sections with icons
- live indicator
- sign out

### Sponsor Navigation

Sponsor uses a left navigation inside a three-panel layout rather than the same fixed sidebar structure. It also includes movement guidance (`Explore`, `Focus`, `Explain`, `Compare`, `Decide`) as behavioral copy.

### Assessment

Workspace and KOC sidebars are structurally similar and candidates for consolidation. Sponsor intentionally differs but still needs shared primitives for brand, active item, user menu, and responsive behavior.

## Top Navigation

| Experience | Top navigation behavior |
|---|---|
| Marketplace | Full primary navigation in header. |
| Workspace | Sticky top bar with org breadcrumb/current route label and Marketplace link. |
| Sponsor | Global header, context bar, breadcrumb, action bar. |
| KOC | Sticky top bar with current label, notification menu, user email. |

### Current Issues

- Top navigation behavior is experience-specific and not driven by a shared model.
- Search exists as a disabled/placeholder sponsor header affordance, marketplace has real search, KOC has command/search route, and workspace has no global search.
- Notifications/alerts exist in KOC and Sponsor but not as shared primitives.

## Dashboard Selection

Dashboard entry points are split by experience:

| Entry point | Current behavior |
|---|---|
| `/` | Redirects to `/marketplace`. |
| `/marketplace` | Marketplace discovery/search dashboard. |
| `/workspace` | Organization workspace overview with stats, next actions, programs, activity. |
| `/sponsor` | Sponsor dashboard placeholder focused on evidence reasoning and portfolio state. |
| `/koc` | Network overview with health, KPE, exception queue. |

### Current Issues

- Login redirect uses `kadarn_role` and Boolean `active_org_id`, not the full workspace profile's default redirect.
- Workspace profile can return `/auth/select-org` for multi-org users, but no matching route was found in prior PCP-1.2 audit.
- Sponsor users may route to `/workspace` or `/sponsor` depending entry point; sponsor capability exists in generic workspace nav as `Programs` and `Discovery`, while sponsor shell has richer sponsor-specific surfaces.

## Marketplace Integration

### What Exists

Marketplace is the default public landing experience. It provides:

- top nav
- discovery/search tabs for research, services, network
- request CTA flow
- unauthenticated request redirect to login with `next`
- link to Workspace and Sign in
- marketplace browse links from auth/onboarding pages

### Current Issues

- Marketplace and Workspace are linked but not deeply integrated through a shared shell or user context.
- Marketplace "Workspace" link always points to `/workspace`; it does not account for no active org, sponsor intent, or internal role.
- Marketplace requests are separate from workspace request surfaces.
- Marketplace navigation is static and not capability/user-aware.

## Sponsor Experience

### What Exists

Sponsor has a dedicated shell and route family. It is the richest intent-labeled experience:

- global header
- surface context
- evidence/institution context
- left nav of sponsor surfaces
- right reasoning panel
- action bar with disabled contextual verbs
- sponsor passport context provider

### Current Issues

- Sponsor shell has its own navigation and user handling separate from Workspace.
- Sponsor access is guarded by active org metadata but not by capability checks at the shell level.
- Sponsor organization name is read from `active_org_name` metadata or E2E fallback; workspace profile is not the source.
- Sponsor surfaces are mostly placeholders or projections; there is no canonical bridge from sponsor capability to `/sponsor` as preferred landing.

## Institution Experience

### What Exists

Institution is currently expressed primarily through generic Workspace:

- `/workspace/profile`
- `/workspace/discovery`
- `/workspace/continuity`
- `/workspace/consent`
- `/workspace/collections`
- `/workspace/regulatory`
- capability-driven navigation for `clinical_site`, `biobank`, `processing_lab`, etc.
- public/projection routes such as `/site-passport/[slug]`

### Current Issues

- There is no distinct "Institution Workspace" shell.
- Institution-specific surfaces are mixed with generic workspace operations.
- `/workspace/profile` currently renders raw profile JSON rather than a productized organization settings/profile experience.
- Institution Portfolio concepts from PCP-1.1 are not yet clearly represented in navigation.

## Internal Kadarn Experience

### What Exists

KOC is the Kadarn internal operations experience. It includes:

- `/koc` overview
- network health
- exceptions
- KPE
- discovery
- provenance
- compliance
- capacity
- programs
- analytics
- ecosystem
- policy
- workflow
- twins
- knowledge
- logistics
- platform health
- phase 8 cutover
- activity/events/network/notifications

Access is based on `kadarn_internal` role through middleware and shell redirects.

### Current Issues

- KOC navigation is large and static.
- KOC contains some formatting drift in nav config indentation.
- KOC notification menu has its own local fetch/state model.
- No shared role/permission-based internal navigation model is evident.
- Some KOC pages are operational dashboards while others are engine consoles; they are not separated by a shared information architecture.

## Settings

### What Exists

The clearest settings route is:

- `/settings/members`

It is mounted through the workspace route group and uses WorkspaceShell. It is a PCP-1.2a placeholder with:

- Current Members
- Pending Invitations
- disabled Invite Member button
- no API calls

Workspace profile/settings also exists as:

- `/workspace/profile`

### Current Issues

- Settings are not consistently under `/workspace/settings`.
- Settings routes are not yet represented in the workspace navigation API.
- Middleware prefix guards do not explicitly protect `/settings/*`, even if the route group uses WorkspaceShell.
- Organization profile, members, billing, capabilities, and security settings do not yet share one settings model.

## Authentication Redirects

### Current Flow

Login:

1. User signs in with Supabase Auth.
2. Login reads `kadarn_role` from user metadata.
3. Login treats `Boolean(active_org_id)` as membership presence.
4. Redirect target is `next` if present, else `defaultRedirect(role, hasMembership)`.

Middleware:

- `/koc` requires `kadarn_internal`.
- `/workspace` requires authenticated role and active org metadata.
- `/sponsor` requires authenticated role and active org metadata.
- `/auth/login` redirects to `/login`.

Workspace shell:

- redirects unauthenticated users to `/login?next=/workspace`.
- shows `OrgSelector` when profile has no active org.

Sponsor shell:

- redirects unauthenticated users to `/login?next={pathname}`.

KOC shell:

- redirects unauthenticated users to `/login?next=/koc`.
- redirects non-internal users to `/workspace`.

### Current Issues

- Redirect logic is split across login page, middleware, `@kadarn/auth`, WorkspaceShell, SponsorShell, and KocShell.
- Login uses metadata, while workspace profile has a more complete `default_redirect` resolver.
- Active org metadata is still treated as the lightweight membership flag.
- No canonical "experience resolver" was found that consumes workspace profile and chooses Marketplace, Workspace, Sponsor, or KOC.

## User Menu

### What Exists

| Experience | User affordance |
|---|---|
| Marketplace | Sign in link; no authenticated user menu. |
| Workspace | User footer with full name/email, role, sign out. |
| Sponsor | Header display name and sign out. |
| KOC | User email in topbar and sign out in sidebar. |

### Current Issues

- No shared user menu component.
- No consistent cross-experience switcher.
- No common settings/account link.
- Sign-out placement differs by shell.
- Marketplace does not adapt header for authenticated users.

## Responsive Behavior

### What Exists

Some content panels use responsive grid patterns (`auto-fit`, `flexWrap`, `overflowX`), especially marketplace/discovery and some delivery/discovery panels.

### Current Gaps

- Workspace and KOC sidebars are fixed at `228px` with fixed positioning.
- Workspace/KOC main content uses fixed `marginLeft: 228`.
- Sponsor layout uses a multi-column work area and side panels; it has some `flexWrap` but no clear mobile shell behavior.
- Marketplace top nav is horizontal with no mobile menu found.
- No shared responsive shell breakpoint model was found.

## Required Determinations

| Question | Determination |
|---|---|
| 1. Current application shell architecture | Multi-shell route-group architecture: Marketplace layout, WorkspaceShell, SponsorShell, KocShell, plus standalone auth/projection routes. |
| 2. Existing layouts | Root, Marketplace, Workspace, Sponsor, KOC layouts exist. Workspace/Sponsor/KOC delegate to shell components; Marketplace inline shell. |
| 3. Existing workspace separation | Marketplace, Workspace, Sponsor, and KOC are separate route families; Sponsor is not simply a Workspace sub-route despite sponsor being an organization capability. |
| 4. Navigation duplication | Navigation config and active-link logic are duplicated across Marketplace layout, workspace navigation API/shell, sponsor nav, and KOC shell. |
| 5. Dashboard entry points | `/marketplace`, `/workspace`, `/sponsor`, `/koc`; root redirects to Marketplace. |
| 6. Marketplace integration | Marketplace is default public landing and request entry; it links to Workspace/Login but is not session-aware beyond request CTA. |
| 7. Sponsor experience | Dedicated sponsor route family and shell with KUX intent surfaces, reasoning panel, and action bar; separate from generic Workspace navigation. |
| 8. Institution experience | Generic Workspace plus institution-related routes/projections; no distinct Institution shell or consolidated Institution Portfolio nav. |
| 9. Internal Kadarn experience | KOC route family and shell guarded by `kadarn_internal`, with large static operations/engine nav. |
| 10. Missing navigation capabilities | Shared shell primitives, canonical experience resolver, unified settings IA, responsive shell model, authenticated marketplace header, role/capability-aware sponsor landing, active-org-safe route groups, shared user menu, and centralized nav definitions. |

## Key Gaps

### 1. No Canonical Experience Resolver

The platform has enough data to resolve experience from role, membership, active org, and capabilities, but logic is split across login, middleware, workspace profile, and shell components.

### 2. Route Prefixes And Layout Ownership Drift

Route groups can place pages in WorkspaceShell without URL prefixes matching middleware guards. `/settings/members` is the current example.

### 3. Navigation Source Fragmentation

Workspace nav is API-driven; Sponsor and KOC nav are static configs; Marketplace nav is inline. PCP-2 should normalize the navigation contract.

### 4. Sponsor vs Workspace Ambiguity

Sponsor has a dedicated experience, but sponsor capability also appears in generic workspace navigation. Landing behavior and cross-links are not yet canonical.

### 5. Institution Experience Is Under-Expressed

Institution is represented as generic workspace capabilities and projections. There is no dedicated Institution Portfolio navigation model yet.

### 6. Settings Are Not Consolidated

Members/settings currently exists outside `/workspace/*`, while profile/settings remains under `/workspace/profile`. Organization settings IA is incomplete.

### 7. Responsive Shell Behavior Is Not Systematic

Shells rely on fixed sidebars and desktop-first layouts. Responsive behavior exists inside content components but not at shell level.

### 8. User Menu Is Duplicated

Sign out, identity display, account context, and cross-experience switching are implemented separately or missing by experience.

### 9. Marketplace Header Is Not Auth-Aware

Marketplace always shows Workspace and Sign in links rather than a user-aware account/experience menu.

### 10. Top-Level Search/Command Is Fragmented

Marketplace has real search, Sponsor has placeholder search, KOC has command/search route, Workspace has no global search.

## Reusable Infrastructure For PCP-2

| Need | Reuse |
|---|---|
| Session context | `SessionProvider`, Supabase session, `@kadarn/auth` |
| Experience routing inputs | `GET /api/v1/workspace/profile`, `active_org_id`, `kadarn_role`, memberships |
| Workspace navigation | `GET /api/v1/workspace/navigation` |
| Sponsor surfaces | `components/sponsor/sponsor-nav.ts` |
| KOC surfaces | `components/koc/koc-shell.tsx` navigation config |
| Marketplace nav | `(marketplace)/layout.tsx` nav links |
| Org selection | `components/auth/org-selector.tsx` |
| Access guard patterns | `apps/web/src/middleware.ts`, `packages/auth/src/index.ts` |
| Settings placeholder | `/settings/members` from PCP-1.2a |

## Recommended PCP-2 Boundaries

PCP-2 should consolidate experience and navigation. It should not:

- redesign Kadarn's domain model
- collapse Sponsor Passport into generic Workspace
- treat Institution as a separate persistence anchor
- make Marketplace publication automatic
- bypass membership or active-org validation
- replace Policy Engine/RLS authorization
- introduce speculative new product experiences

## Audit Conclusion

Kadarn has the right experience ingredients, but they are assembled independently. PCP-2 should create a consolidated experience/navigation model that keeps the current product surfaces but standardizes how users enter, switch, and understand them:

```text
Session
  -> Role
  -> Memberships
  -> Active organization
  -> Capabilities
  -> Experience resolver
  -> Shell
  -> Navigation
  -> Dashboard / settings / projection routes
```

The next PCP-2 step should define a product specification for canonical experiences, shell responsibilities, navigation hierarchy, dashboard selection, settings IA, and responsive behavior before implementation.
