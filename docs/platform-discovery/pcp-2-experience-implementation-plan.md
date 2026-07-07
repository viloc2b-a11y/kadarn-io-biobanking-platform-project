# PCP-2 Experience and Navigation Consolidation Implementation Plan

**Program:** Kadarn Platform Consolidation - PCP  
**Phase:** PCP-2  
**Step:** 4 - Implementation Plan  
**Mode:** Planning only. No code changes.  
**Inputs:** `pcp-2-experience-audit.md`, `pcp-2-experience-spec.md`, `ADR-034-unified-workspace-experience.md`  
**Output:** Concrete phased implementation plan for the unified Kadarn application experience.

## Implementation Decision

PCP-2 should be implemented as small, reviewable phases that consolidate the existing Marketplace, Workspace, Sponsor Workspace, and KOC experiences into one application shell model. The work must preserve the Platform Constitution: Organization remains the persistent anchor, navigation is derived from active organization plus authorized capabilities, workspaces are contextual platform views, and navigation visibility never replaces route/API authorization.

The target implementation chain is:

```text
Session
  -> User Profile
  -> Active Organization
  -> Membership Roles
  -> Organization Capabilities
  -> Allowed Experiences
  -> Navigation Manifest
  -> Shared Shell Primitives
  -> Actor-Aware Workspace View
```

## Global Constraints

- Do not introduce a new permission system.
- Do not introduce actor-specific user tables or tenant models.
- Do not make Marketplace visibility, public profile publication, Sponsor Passport sharing, evidence publication, or financial workflows automatic.
- Do not collapse Sponsor Workspace into generic Workspace.
- Do not treat Institution as a separate persistence anchor.
- Do not use navigation visibility as the source of truth for authorization.
- Do not expose KOC to external organization users.
- Direct route and API access must remain independently enforced.
- Each phase must preserve existing user paths unless the phase explicitly replaces them with a validated equivalent.

## Baseline Validation Gates

When implementation begins, every code phase should run the narrowest relevant checks plus the shared baseline where practical:

```powershell
npm run typecheck
npm run lint
npm run test -w tests -- --run tests/web
npm run test -w tests -- --run tests/api
npm run build -w apps/web
npm run build -w apps/api
```

For UI-heavy phases, add Playwright or focused component tests around navigation, auth redirects, shell rendering, and responsive behavior.

## Phase Summary

| Phase | Name | Primary outcome |
|---|---|---|
| PCP-2a | Application Shell | Shared shell primitives and unified shell contract. |
| PCP-2b | Sidebar Consolidation | One manifest-driven sidebar model across Workspace, Sponsor, and KOC. |
| PCP-2c | Top Navigation | Shared breadcrumbs, context, profile, help, search, and notifications affordances. |
| PCP-2d | Workspace Switcher | Server-validated active organization switching and experience refresh. |
| PCP-2e | Unified Dashboard Entry | Actor-aware default landing and dashboard routing. |
| PCP-2f | Notifications | Unified notification affordance and scoped notification model. |
| PCP-2g | Global Search | Authorized global search entry and scoped result model. |
| PCP-2h | Responsive Navigation | Shell-level responsive navigation behavior. |
| PCP-2i | Accessibility Review | Keyboard, screen reader, focus, semantics, contrast, and reduced-motion review. |
| PCP-2j | Tests | Regression coverage for shell, nav, auth, actor awareness, and responsive states. |

---

## PCP-2a - Application Shell

### Purpose

Create the shared application shell foundation ratified by ADR-034. This phase should introduce reusable shell primitives without changing the behavior of every route at once.

The shell must support:

- Public shell.
- Workspace shell.
- Sponsor shell variant.
- Internal/KOC shell variant.
- Focus shell for auth, reports, and public projections.
- Shared brand area, content frame, loading frame, error frame, and shell context contract.

### Files Likely Touched

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/(marketplace)/layout.tsx`
- `apps/web/src/app/(workspace)/layout.tsx`
- `apps/web/src/app/(sponsor)/layout.tsx`
- `apps/web/src/app/(koc)/layout.tsx`
- `apps/web/src/components/workspace/workspace-shell.tsx`
- `apps/web/src/components/sponsor/sponsor-shell.tsx`
- `apps/web/src/components/koc/koc-shell.tsx`
- New shared shell components under `apps/web/src/components/shell/`
- New shell types or contracts under `apps/web/src/lib/navigation/` or `apps/web/src/lib/shell/`
- Tests under `tests/web/` or `apps/web/src/**/__tests__/`

### Existing Modules To Reuse

- `SessionProvider`
- `useSession`
- `@kadarn/auth`
- `GET /api/v1/workspace/profile`
- Existing `WorkspaceShell`, `SponsorShell`, `KocShell`
- Existing Marketplace layout and public routes
- Existing E2E mock session fixtures

### Risks

- A broad shell replacement can break all major route families at once.
- Sponsor-specific context panels may be flattened accidentally.
- KOC internal-only shell behavior could be exposed to external users.
- Public Marketplace routes could start requiring auth unintentionally.
- Shell loading states may flash unauthorized navigation before context resolves.

### Validation

- Existing Marketplace, Workspace, Sponsor, and KOC routes render with their current access rules.
- Anonymous Marketplace remains accessible.
- Unauthenticated Workspace/Sponsor/KOC paths still redirect correctly.
- KOC remains hidden and inaccessible to non-internal users.
- Sponsor shell still supports reasoning/context regions.
- No route gains unauthorized navigation during loading.

### Stop Conditions

- Shared shell requires schema changes.
- Sponsor Workspace loses portfolio/passport context behavior.
- KOC becomes visible or reachable to external users.
- Public Marketplace is no longer public.
- The implementation changes permissions instead of shell composition.

---

## PCP-2b - Sidebar Consolidation

### Purpose

Replace duplicated sidebar/navigation trees with a single manifest-driven sidebar model. This phase should consolidate active item logic, section grouping, labels, icons/status indicators, and administration entry points.

The sidebar should be actor-aware and capability-driven, not page-driven.

### Files Likely Touched

- `apps/web/src/components/workspace/workspace-shell.tsx`
- `apps/web/src/components/sponsor/sponsor-shell.tsx`
- `apps/web/src/components/sponsor/sponsor-nav.ts`
- `apps/web/src/components/koc/koc-shell.tsx`
- `apps/api/src/app/api/v1/workspace/navigation/route.ts`
- New `apps/web/src/components/shell/sidebar.tsx`
- New `apps/web/src/lib/navigation/manifest.ts`
- New `apps/web/src/lib/navigation/types.ts`
- Tests for navigation manifest and active-link behavior

### Existing Modules To Reuse

- Workspace navigation API capability mapping
- Sponsor `SPONSOR_SURFACES`
- KOC `NAV` sections
- `usePathname`
- `E2E_WORKSPACE_NAV`
- Organization capability data from workspace profile/navigation APIs

### Risks

- Static Sponsor/KOC nav items may be lost or renamed without product review.
- Capability-driven nav could hide tools that currently appear as stable entry points.
- Active-link matching may break nested routes.
- Settings could remain outside protected workspace route handling.
- Duplicate nav paths may create confusing active states.

### Validation

- Workspace sidebar reflects active organization capabilities.
- Sponsor sidebar preserves Dashboard, Portfolio Intelligence, Institutional Passports, Feasibility Search, Opportunity Discovery, Risk Monitoring, Notifications, and Settings where authorized.
- KOC sidebar preserves internal operations sections for internal users only.
- Settings appears through the unified administration section.
- Active item highlighting works for exact and nested routes.
- No duplicate navigation trees remain in shell components except temporary adapter data.

### Stop Conditions

- Sidebar manifest becomes a permission source of truth.
- Direct route authorization is weakened.
- Sponsor or KOC nav is removed instead of adapted.
- The phase requires redesigning product IA beyond PCP-2 scope.
- Navigation shows unauthorized routes during loading.

---

## PCP-2c - Top Navigation

### Purpose

Create a shared top navigation model for breadcrumbs, page title, context chip, profile menu, help, notifications entry, and search entry. This phase should remove duplicated topbar behavior while keeping experience-specific context.

### Files Likely Touched

- `apps/web/src/components/workspace/workspace-shell.tsx`
- `apps/web/src/components/sponsor/sponsor-shell.tsx`
- `apps/web/src/components/koc/koc-shell.tsx`
- `apps/web/src/app/(marketplace)/layout.tsx`
- New `apps/web/src/components/shell/top-navigation.tsx`
- New `apps/web/src/components/shell/breadcrumbs.tsx`
- New `apps/web/src/components/shell/profile-menu.tsx`
- New `apps/web/src/lib/navigation/breadcrumbs.ts`
- Tests for breadcrumb and profile menu behavior

### Existing Modules To Reuse

- `useSession`
- Existing sign-out behavior in `SessionProvider`
- Current Workspace top bar
- Current Sponsor global header/context bar
- Current KOC top bar and notification affordance
- Existing route labels from navigation data

### Risks

- Top nav may duplicate sidebar items instead of showing cross-cutting actions.
- Breadcrumbs may expose unauthorized parent object labels.
- Profile menu may mix user profile and organization settings.
- Sponsor context bar may be oversimplified.
- Marketplace may expose private account/workspace state to anonymous users.

### Validation

- Breadcrumbs render safe product context for Workspace, Sponsor, Marketplace, KOC, Settings, and public projection routes.
- Profile menu shows account, active organization, settings where authorized, workspace switcher entry, and sign out.
- Sponsor context still shows portfolio/institution/passport context where applicable.
- KOC top navigation keeps internal context and user identity visible.
- Marketplace top navigation is auth-aware without leaking private organization data.

### Stop Conditions

- Breadcrumbs reveal unauthorized object names or counts.
- Profile menu allows organization role changes outside membership admin.
- Sponsor or KOC loses critical context.
- Public routes require private shell context.

---

## PCP-2d - Workspace Switcher

### Purpose

Consolidate active organization selection into a server-validated workspace switcher. Switching active organization must refresh allowed experiences, navigation manifest, dashboard entry, search scopes, notification scopes, and settings visibility.

### Files Likely Touched

- `apps/web/src/components/auth/org-selector.tsx`
- `apps/web/src/components/workspace/workspace-shell.tsx`
- New `apps/web/src/components/shell/workspace-switcher.tsx`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `apps/api/src/app/api/v1/workspace/active-org/route.ts` if present or to be introduced/finished
- `packages/auth/src/index.ts`
- `apps/web/src/middleware.ts`
- Tests for active org switching and auth redirects

### Existing Modules To Reuse

- `organization_memberships`
- `membership_roles`
- Workspace profile API
- Current `OrgSelector`
- `defaultRedirect`
- `resolveExperience`
- `E2E_MOCK_MEMBERSHIP`
- PCP-1.2 membership lifecycle rules

### Risks

- Client-side metadata writes may continue to bypass server validation.
- Suspended, invited, removed, or pending memberships may appear as selectable.
- Multi-organization users may be routed to stale dashboards.
- Sponsor users may not land on Sponsor Workspace when appropriate.
- Internal users may mix customer active org context with KOC access without clear labeling.

### Validation

- Switcher shows only active memberships.
- Active org changes are server-validated.
- Navigation manifest refreshes after switch.
- Dashboard/default landing refreshes after switch.
- Sponsor org can expose Sponsor Workspace only when sponsor capability and authorization exist.
- No active org shows governed selection/onboarding/invitation state without workspace tools.

### Stop Conditions

- Active org can be changed to an organization where the user lacks active membership.
- Non-active memberships grant navigation.
- Switching org leaks previous org navigation or data.
- Implementation treats `active_org_id` metadata as sufficient authorization.

---

## PCP-2e - Unified Dashboard Entry

### Purpose

Create an actor-aware default landing and dashboard entry model. Dashboards should be projections that summarize current state, next actions, risks, and empty setup guidance without becoming sources of truth.

### Files Likely Touched

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/(workspace)/workspace/page.tsx`
- `apps/web/src/app/(sponsor)/sponsor/page.tsx`
- `apps/web/src/app/(koc)/koc/page.tsx`
- `apps/api/src/app/api/v1/workspace/profile/route.ts`
- `packages/auth/src/index.ts`
- `apps/web/src/middleware.ts`
- New dashboard resolver under `apps/web/src/lib/navigation/` or `apps/api/src/lib/`
- Tests for default redirects and dashboard rendering

### Existing Modules To Reuse

- `resolveExperience`
- `defaultRedirect`
- Workspace profile `default_redirect`
- Workspace overview API
- Sponsor dashboard placeholder
- KOC overview APIs
- Marketplace default redirect from `/`

### Risks

- Default redirect may loop between login, workspace selector, and dashboard.
- Sponsor fallback may continue to route sponsors to generic workspace.
- KOC default may become available to non-internal users.
- Dashboards may start relying on derived projections as source records.
- Empty state guidance may offer unauthorized actions.

### Validation

- Anonymous root path lands on Marketplace.
- Signed-in user with no active org lands on selection/invitation/onboarding path.
- Institution, CRO, Network, and Vendor land on Workspace dashboard.
- Sponsor lands on Sponsor dashboard when authorized.
- Kadarn Internal lands on KOC.
- Dashboards show safe loading, empty, and error states.

### Stop Conditions

- Redirect loop appears.
- Sponsor dashboard bypasses portfolio scope.
- KOC dashboard exposes tenant data without internal authorization.
- Dashboard implementation changes source-of-truth semantics.

---

## PCP-2f - Notifications

### Purpose

Consolidate notification entry points into a shared notification affordance and scoped notification model. Notifications should be actor-aware attention objects that link to canonical surfaces.

### Files Likely Touched

- `apps/web/src/components/koc/koc-shell.tsx`
- `apps/web/src/app/(koc)/koc/notifications/page.tsx`
- `apps/web/src/components/sponsor/sponsor-shell.tsx`
- `apps/web/src/app/(sponsor)/sponsor/notifications/page.tsx`
- New `apps/web/src/components/shell/notifications-menu.tsx`
- New `apps/web/src/lib/notifications/`
- Existing or new API routes under `apps/api/src/app/api/v1/notifications/`
- Tests for notification visibility and links

### Existing Modules To Reuse

- Current KOC notification fetch behavior
- `kocFetch`
- Sponsor notification route placeholder
- Domain events and audit/event APIs where already exposed
- Session and active organization context

### Risks

- Cross-tenant notification leakage.
- KOC platform events may expose customer details without internal scope.
- Notification counts may reveal unauthorized object existence.
- Notifications may link to routes the user cannot access.
- Polling or refresh behavior may introduce performance issues.

### Validation

- Notifications are scoped to active organization or internal role.
- Empty notification state is safe.
- Failed notification fetch does not break the shell.
- Notification links resolve to authorized canonical surfaces.
- KOC notifications require internal access.
- Sponsor notifications respect sponsor portfolio scope.

### Stop Conditions

- Notification count leaks unauthorized data.
- Tenant-specific event details appear outside authorized context.
- Notification menu becomes required for shell rendering.
- New notification system duplicates domain events/audit without reuse.

---

## PCP-2g - Global Search

### Purpose

Introduce a global search entry with scoped results for Marketplace, Workspace, Sponsor, and KOC. Search should be global in placement but authorization-scoped in results.

### Files Likely Touched

- `apps/web/src/components/marketplace/discovery.tsx`
- `apps/web/src/app/(koc)/koc/command/page.tsx`
- `apps/web/src/components/sponsor/sponsor-shell.tsx`
- `apps/web/src/components/workspace/workspace-shell.tsx`
- New `apps/web/src/components/shell/global-search.tsx`
- New `apps/web/src/lib/search/`
- API routes under `apps/api/src/app/api/v1/search/` if needed
- Tests for search scopes and result filtering

### Existing Modules To Reuse

- Marketplace search APIs
- KOC command/search surface
- Sponsor passport and portfolio APIs
- Workspace profile/navigation context
- Policy and visibility filters
- Existing discovery search components where applicable

### Risks

- Search may leak unauthorized object names, counts, or existence.
- Sponsor search may blur Marketplace discovery with Sponsor Portfolio access.
- KOC search may expose internal operations to non-internal users.
- Search may become a parallel data access path not covered by existing API guards.
- Search indexes may become stale or ungoverned.

### Validation

- Anonymous users only see public Marketplace results.
- Workspace users only see active-organization authorized results.
- Sponsor users see Marketplace results and Sponsor Portfolio results clearly separated.
- KOC search is internal-only.
- Search failure preserves query and exposes safe retry messaging.
- Result links require route/API authorization.

### Stop Conditions

- Search reveals unauthorized names, counts, or hidden capabilities.
- Search bypasses policy/visibility filtering.
- Sponsor search grants private passport access from Marketplace results.
- KOC search appears outside internal shell.

---

## PCP-2h - Responsive Navigation

### Purpose

Define and implement shell-level responsive behavior for global navigation, sidebar, top navigation, context panels, action bars, and dense content surfaces.

### Files Likely Touched

- Shared shell components under `apps/web/src/components/shell/`
- `apps/web/src/components/workspace/workspace-shell.tsx`
- `apps/web/src/components/sponsor/sponsor-shell.tsx`
- `apps/web/src/components/koc/koc-shell.tsx`
- `apps/web/src/app/(marketplace)/layout.tsx`
- `apps/web/src/app/globals.css`
- Playwright or visual regression tests for viewport behavior

### Existing Modules To Reuse

- Existing responsive content grids in discovery and marketplace components
- Current shell layout styles
- Sponsor context/action panel structure
- KOC notification dropdown
- Workspace fixed sidebar behavior as migration baseline

### Risks

- Fixed sidebars may continue causing horizontal overflow.
- Mobile drawer may trap focus or hide critical actions.
- Sponsor reasoning panel may disappear without alternate access.
- KOC notification menu may be unusable on mobile.
- Responsive changes may break desktop workflows.

### Validation

- Large desktop: sidebar and top navigation render fully.
- Tablet: sidebar collapses or drawers without losing current context.
- Mobile: primary navigation is reachable through menu/drawer.
- Search, notifications, help, profile, and switcher remain reachable.
- Sponsor context panel becomes tab, drawer, accordion, or equivalent.
- No primary shell navigation requires horizontal scrolling.

### Stop Conditions

- Critical actions are unreachable on mobile.
- Keyboard focus is trapped or lost in drawer behavior.
- Responsive shell hides access-denied or error states.
- Desktop layout regresses significantly.

---

## PCP-2i - Accessibility Review

### Purpose

Review the unified shell and navigation for accessibility before broad rollout. This phase should focus on semantics, keyboard access, screen reader labels, focus management, contrast, reduced motion, loading/error announcements, and route transition clarity.

### Files Likely Touched

- Shared shell components under `apps/web/src/components/shell/`
- Sidebar, top navigation, breadcrumbs, workspace switcher, notifications, global search, profile menu
- `apps/web/src/app/globals.css`
- Test utilities or accessibility tests under `tests/web/`
- Playwright accessibility checks if available

### Existing Modules To Reuse

- Existing semantic roles in Sponsor shell
- Existing link/button components and route structure
- Browser-native controls where possible
- Playwright test infrastructure

### Risks

- Navigation drawers or menus may not be keyboard accessible.
- Active route state may not be announced.
- Search and notifications may lack labels or focus return.
- Color-only status indicators may exclude users.
- Loading skeletons may not communicate progress.

### Validation

- Sidebar and top navigation are keyboard navigable.
- Active route has `aria-current` or equivalent.
- Menus, drawers, search overlays, and notification panels manage focus correctly.
- Icon-only controls have accessible names.
- Status indicators do not rely on color alone.
- Error states are announced and actionable.
- Reduced motion and high contrast preferences are respected where relevant.

### Stop Conditions

- Keyboard users cannot open, navigate, or close shell menus.
- Screen readers cannot identify current route or active organization.
- Focus is lost after route, search, notification, or drawer interactions.
- Accessibility fixes require major IA changes beyond PCP-2 scope.

---

## PCP-2j - Tests

### Purpose

Add regression coverage for the unified shell, navigation manifest, actor-aware behavior, route guards, workspace switching, dashboards, notifications, search, responsive navigation, and accessibility-critical interactions.

This phase may be developed incrementally alongside PCP-2a through PCP-2i, but PCP-2j is the final consolidation gate.

### Files Likely Touched

- `tests/web/`
- `tests/api/`
- `apps/web/src/**/__tests__/`
- `apps/api/src/**/__tests__/`
- Playwright specs if present
- E2E mock session fixtures under `apps/web/src/lib/e2e/`
- Package scripts in `package.json` or `tests/package.json` only if needed

### Existing Modules To Reuse

- Existing Vitest setup
- Existing Playwright setup and E2E auth mock session
- `E2E_WORKSPACE_NAV`
- `E2E_WORKSPACE_PROFILE`
- Existing auth entrypoint tests
- Existing sponsor passport and workspace API tests

### Risks

- Tests may assert implementation details instead of product behavior.
- Broad snapshots may become brittle.
- E2E auth mocks may hide real middleware issues.
- Tests may not cover unauthorized direct-route access.
- Responsive behavior may be tested only visually and miss keyboard/focus regressions.

### Validation

- Unit tests cover manifest generation and active-link matching.
- API tests cover workspace profile/navigation authorization boundaries.
- Web tests cover Marketplace, Workspace, Sponsor, KOC, and Settings shell rendering.
- E2E tests cover login redirect, active organization switching, sponsor landing, KOC denial for non-internal users, and direct-route denial.
- Responsive tests cover desktop, tablet, and mobile navigation access.
- Accessibility tests cover keyboard/focus/labels for shell primitives.

### Stop Conditions

- Tests require weakening auth or bypassing route guards in production code.
- Tests only verify static markup and miss authorization behavior.
- KOC, Sponsor, and Workspace are not all covered.
- Direct-route authorization is not tested.

---

## Sequencing Notes

PCP-2a through PCP-2e should be implemented before deeper notifications/search work because those phases establish the shell, navigation manifest, active organization context, and default landing behavior. PCP-2f and PCP-2g depend on safe scoped context. PCP-2h and PCP-2i should begin early as design constraints, but their final acceptance should happen after core shell primitives exist. PCP-2j is both continuous and final gate.

Recommended implementation order:

```text
PCP-2a Application Shell
  -> PCP-2b Sidebar Consolidation
  -> PCP-2c Top Navigation
  -> PCP-2d Workspace Switcher
  -> PCP-2e Unified Dashboard Entry
  -> PCP-2f Notifications
  -> PCP-2g Global Search
  -> PCP-2h Responsive Navigation
  -> PCP-2i Accessibility Review
  -> PCP-2j Tests
```

## Completion Criteria

PCP-2 is complete when:

- A shared shell contract exists.
- Navigation is manifest-driven and actor-aware.
- Workspace, Sponsor, KOC, and Marketplace no longer maintain unrelated navigation trees.
- Active organization switching is server-validated and refreshes experience context.
- Default dashboard entry is actor-aware.
- Notifications and search are scoped by authorization.
- Settings are route-guarded and represented in the manifest.
- Responsive behavior is defined at shell level.
- Accessibility review passes.
- Regression tests cover authorized and unauthorized paths across all major experiences.
