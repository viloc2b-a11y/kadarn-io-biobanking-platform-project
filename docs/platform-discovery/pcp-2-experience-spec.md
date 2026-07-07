# PCP-2 Experience and Navigation Consolidation Specification

**Program:** Kadarn Platform Consolidation - PCP  
**Phase:** PCP-2  
**Step:** 2 - Product Specification  
**Mode:** Product specification only. No code changes.  
**Input:** `docs/platform-discovery/pcp-2-experience-audit.md`  
**Output:** Unified Kadarn application experience model.

## Product Decision

Kadarn should use one unified application experience model across Institution, Sponsor, CRO, Network, Vendor, and Kadarn Internal users. The product should not maintain duplicated navigation trees for each surface. Instead, every signed-in experience should be resolved from:

```text
Session
  -> User Profile
  -> Organization Memberships
  -> Active Organization
  -> Membership Roles
  -> Organization Capabilities
  -> Allowed Experiences
  -> Navigation Manifest
  -> Application Shell
```

The user sees only the experiences, tools, actions, and settings that are authorized by membership, role, capability, policy, visibility, and portfolio scope.

## Non-Negotiable Rules

- Organization remains the persistent anchor.
- Institution is the product reading of an organization when assessed, discovered, profiled, or presented.
- Actor type is expressed through organization capabilities, not actor-specific user tables or separate tenant models.
- Navigation is actor-aware.
- Navigation is capability-driven, not page-driven.
- Features appear only when authorized.
- Navigation trees must not be duplicated across shells.
- Sponsor Portfolio defines sponsor institution access scope; it does not define institutional truth.
- Dashboards, Passports, Published Views, Evidence Packs, Discovery Reports, Institution Profiles, and KPEs are projections, not sources of truth.
- Marketplace visibility, public profile publication, Sponsor Passport sharing, evidence publication, financial workflows, and internal administrative actions remain locked until governed activation.
- Kadarn Internal access must remain auditable and must not bypass tenant isolation without explicit authorization and reason.

## Scope

PCP-2 defines:

- Application shell behavior.
- Global navigation.
- Workspace navigation.
- Dashboard behavior.
- Sidebar behavior.
- Top navigation.
- Breadcrumbs.
- Workspace switcher.
- Notifications.
- Search.
- Settings.
- Help.
- Profile.
- Responsive behavior.
- Empty, loading, and error states.
- Actor-specific landing, navigation, actions, tools, and administration entry points.

PCP-2 does not define:

- New database domains.
- New permission system.
- New actor tables.
- New marketplace publication workflow.
- New sponsor portfolio access model.
- New evidence publication workflow.
- New KOC administrative powers.
- Visual redesign beyond consolidation rules.

## Canonical Experience Model

Kadarn should present one application shell family with experience-specific composition. Marketplace, Workspace, Sponsor Workspace, and Kadarn Operations Center remain valid experiences, but they should consume a shared navigation manifest and shared shell primitives.

| Layer | Responsibility |
|---|---|
| Session layer | Knows whether the user is signed in. |
| Access context layer | Resolves user profile, memberships, active organization, roles, capabilities, allowed experiences, and default landing. |
| Experience resolver | Chooses Marketplace, Workspace, Sponsor Workspace, or KOC based on role, active organization, capabilities, and requested route. |
| Navigation manifest | Returns actor-aware, authorized navigation sections, shortcuts, actions, settings links, search scopes, and notifications scope. |
| Application shell | Renders brand, global nav, workspace switcher, sidebar, top nav, breadcrumbs, user menu, notifications, search, help, and content states. |
| Page content | Renders the selected tool, dashboard, projection, form, report, or workflow. |

## Application Shell

### Shell Principle

The shell must answer five questions on every authenticated screen:

1. Who am I signed in as?
2. Which organization or workspace am I acting in?
3. Which experience am I using?
4. Where am I inside that experience?
5. What can I do next?

### Shell Regions

| Region | Required behavior |
|---|---|
| Brand area | Shows Kadarn and links to the user's default landing, not always `/`. |
| Workspace switcher | Shows active organization and available active memberships. |
| Experience switcher | Shows authorized experiences such as Marketplace, Workspace, Sponsor, or KOC. |
| Sidebar | Shows primary and secondary navigation for the selected experience. |
| Top navigation | Shows breadcrumbs, page title/context, search, notifications, help, and user menu. |
| Content area | Hosts dashboard, tool, projection, workflow, report, settings, or form content. |
| Context/action area | Optional right panel or action bar for surfaces that need evidence reasoning or next actions. |

### Shell Variants

| Variant | Used by | Notes |
|---|---|---|
| Public shell | Anonymous Marketplace and public projection routes | No workspace switcher. Auth-aware sign-in/register/experience links. |
| Workspace shell | Institution, CRO, Network, Vendor, and generic org workspaces | Capability-driven primary navigation. |
| Sponsor shell | Sponsor organizations with authorized sponsor experience | Uses shared shell primitives plus sponsor context panel for portfolio/passport reasoning. |
| Internal shell | Kadarn Internal | Uses shared shell primitives plus internal operations/navigation sections. |
| Focus shell | Reports, KPE views, public passports, invitation acceptance, auth flows | Minimal shell for task completion or read-only projection. |

## Global Navigation

Global navigation is the cross-experience layer. It should not list every page. It should list authorized experiences and high-value entry points.

| Global item | Visibility |
|---|---|
| Marketplace | Everyone, including anonymous users, subject to public marketplace availability. |
| Workspace | Active organization members. |
| Sponsor Workspace | Users whose active organization has sponsor capability and who are authorized for sponsor surfaces. |
| Kadarn Operations Center | `kadarn_internal` users with appropriate internal access. |
| Settings | Authenticated users with active membership or internal context. |
| Help | Everyone; content may vary by actor. |
| Profile | Authenticated users. |

### Global Navigation Rules

- Show an item only if the user can enter it.
- Disable or hide global entries that require missing active organization, missing capability, or missing role.
- Never use global navigation to imply data access. Entering Sponsor Workspace does not imply access to any institution passport unless portfolio scope allows it.
- Marketplace remains visible but user-specific request actions must still enforce auth and policy.
- KOC must never appear for external org users.

## Workspace Navigation

Workspace navigation is derived from the active organization and should be generated as a single manifest.

```text
Active organization
  -> Membership status
  -> Membership role assignments
  -> Organization capabilities
  -> Policy/visibility checks
  -> Navigation sections
  -> Authorized actions
```

### Workspace Navigation Sections

| Section | Purpose | Examples |
|---|---|---|
| Home | Re-entry point and dashboard | Overview, next actions, recent activity |
| Work | Capability-specific operational tools | Programs, Collections, Processing, QC, Logistics, Consent, Regulatory |
| Evidence | Evidence/discovery/provenance surfaces when enabled | Discovery, Continuity, Claims, Provenance, Reports |
| Exchange | Marketplace and request operations | Requests, Deals, Payments, Exchange |
| Intelligence | Analytics and derived projections | Analytics, Capacity, KPE, Risk |
| Administration | Organization management | Profile, Members, Roles, Capabilities, Security, Billing |
| Support | Help and documentation | Help, contact/support, release notes |

### Capability-Driven Rule

Navigation items are not pages first. They are product capabilities that resolve to pages only after authorization.

Example:

```text
Capability: processing_lab
  -> Tool: Processing
  -> Tool: Quality Control
  -> Tool: Exchange participation
  -> Tool: Analytics
```

If a page exists but the active organization lacks the capability or role, the item must not appear in navigation and direct route access must still be blocked.

## Dashboard Behavior

Dashboards are actor-aware landing projections. They should summarize work, status, risk, and next actions without becoming sources of truth.

| Actor | Default dashboard intent |
|---|---|
| Institution | "What does my organization need to complete, prove, or keep current?" |
| Sponsor | "Which institutions, claims, risks, and opportunities need my attention?" |
| CRO | "Which programs, sites, logistics, QC, or regulatory tasks need coordination?" |
| Network | "What is happening across my coordinated organizations or programs?" |
| Vendor | "What operational contributions, confirmations, requests, or exceptions need action?" |
| Kadarn Internal | "What platform, customer, evidence, policy, or operational state needs attention?" |

### Dashboard Rules

- Dashboard content must be filtered by active organization and authorization.
- Dashboards should show next actions before raw module lists.
- Dashboards should identify empty setup state clearly.
- Dashboards must link to canonical tools, not duplicate workflow logic.
- Dashboards may summarize projections, but must not become the source of truth.
- Sponsor dashboard must respect portfolio scope.
- KOC dashboard must distinguish platform health from customer data access.

## Sidebar

The sidebar is the primary local navigation for authenticated experiences.

### Sidebar Requirements

- Render from the navigation manifest.
- Group items by user intent, not technical route order.
- Preserve a stable order for each actor to reduce cognitive load.
- Show active item and ancestor section.
- Support collapsed mode on medium screens.
- Move behind a menu drawer on small screens.
- Show only authorized sections.
- Include an administration entry point for users with administrative permission.

### Sidebar Section Model

Each sidebar section should support:

- `id`
- `label`
- `items`
- required capability or permission
- optional count or status indicator
- optional disabled reason
- optional actor scope

## Top Navigation

Top navigation provides page context and cross-cutting actions.

| Element | Required behavior |
|---|---|
| Breadcrumbs | Show experience, section, object, and current view when available. |
| Page title | Human-readable current surface or object title. |
| Context chip | Active organization, portfolio, program, institution, or report context. |
| Search | Opens search with actor-appropriate scopes. |
| Notifications | Shows authorized alerts/events/tasks. |
| Help | Opens contextual help for the current surface. |
| Profile menu | Shows account, active org, settings, switch workspace, sign out. |

### Top Navigation Rules

- Top nav must not duplicate sidebar links.
- Top nav should expose cross-cutting actions, not module lists.
- Breadcrumbs must preserve product language: Organization, Institution, Sponsor Portfolio, Program, Passport, Evidence Pack, KPE, etc.
- Search and notifications must respect the same authorization as navigation.

## Breadcrumbs

Breadcrumbs should make object context legible.

| Context | Breadcrumb pattern |
|---|---|
| Workspace dashboard | `Workspace / Overview` |
| Institution profile | `Workspace / Institution Profile` |
| Program detail | `Workspace / Programs / {Program}` |
| Sponsor passport | `Sponsor / Portfolio / Institutional Passports / {Institution}` |
| Marketplace request | `Marketplace / Requests / {Request Type}` |
| KOC operations | `KOC / Platform / {Surface}` |
| Settings | `Workspace / Settings / {Area}` |

Breadcrumbs are navigational context. They do not grant access to parent objects.

## Workspace Switcher

The workspace switcher chooses the active organization context.

### Requirements

- Show only active memberships.
- Exclude invited, pending acceptance, suspended, removed, or expired memberships.
- Changing workspace must validate membership server-side.
- Changing workspace must refresh allowed experiences and navigation manifest.
- If a user has one active membership, the switcher can be compact but should still show the active organization.
- If a user has multiple active memberships, the switcher must show organization name, actor/capability summary, role, and status.
- Kadarn Internal users may have internal organization context plus KOC access, but internal platform role must remain explicit.

### Empty Workspace State

If no active organization is available:

- Show a governed organization selection or onboarding/invitation acceptance path.
- Do not show workspace tools.
- Do not infer access from a stale `active_org_id`.

## Notifications

Notifications are actor-aware attention objects.

| Actor | Notification examples |
|---|---|
| Institution | Invitation updates, profile readiness, evidence review, discovery completion, requests, program tasks |
| Sponsor | Portfolio changes, passport evidence changes, risk alerts, request updates, opportunity updates |
| CRO | Program tasks, site coordination changes, logistics exceptions, QC/regulatory tasks |
| Network | Member organization activity, program coordination tasks, cross-site exceptions |
| Vendor | New requests, work assignments, processing/QC/logistics exceptions, integration status |
| Kadarn Internal | Platform health, incidents, security/policy alerts, cutover gates, failed jobs, support escalations |

### Notification Rules

- Notifications should be scoped to active organization or internal role.
- Sensitive tenant notifications must not leak across memberships.
- KOC notifications may summarize platform events but should require explicit access before showing tenant detail.
- Notifications should link to the canonical surface that can resolve the item.

## Search

Search is global in placement and scoped in results.

### Search Scopes

| Scope | Visibility |
|---|---|
| Marketplace | Public or marketplace-visible organizations, services, assets, and requests. |
| Workspace | Active organization's programs, requests, documents, operations, and authorized evidence surfaces. |
| Sponsor | Sponsor portfolio institutions, passports, claims/projections, opportunities, and risks authorized by portfolio scope. |
| KOC | Internal operational objects, events, health, audit, policy, and support surfaces authorized by internal role. |

### Search Rules

- Search results must not reveal unauthorized object names or counts.
- Search should label result source and audience context.
- Sponsor search must distinguish Marketplace discovery from Sponsor Portfolio access.
- Search should support empty states and error states without exposing backend details.

## Settings

Settings should be consolidated under one organization-aware IA.

### Settings Areas

| Area | Purpose | Visibility |
|---|---|---|
| Organization Profile | Legal name, display name, actor/capability summary | Org admins and authorized members |
| Members | Members, invitations, roles | Users with manage-members permission |
| Roles and Permissions | Role assignment and permission bundles | Owners/admins or internal governed roles |
| Capabilities | Active organization capabilities and activation state | Admins; read-only summary for members where appropriate |
| Marketplace Visibility | Publication readiness and marketplace listing controls | Admins after governed activation |
| Sponsor Portfolio | Sponsor-owned portfolio setup and scope | Sponsor admins |
| Integrations | External connectors and credentials status | Admins with integration permission |
| Security | MFA/session/security settings where available | Account owner/admin depending scope |
| Billing/Payments | Financial activation and payment settings | Authorized finance/admin roles |
| Internal Operations | KOC/admin-only configuration and support controls | Kadarn Internal only |

### Settings Route Principle

Settings should be workspace-owned and route-guarded. PCP-2 should avoid settings routes that render in the workspace shell but are not covered by workspace authorization.

## Help

Help is contextual and actor-aware.

| Context | Help behavior |
|---|---|
| Anonymous Marketplace | Explain discovery, requests, and registration. |
| Institution Workspace | Explain profile readiness, discovery, evidence, marketplace locks, and sharing controls. |
| Sponsor Workspace | Explain portfolio scope, passports, evidence confidence, provenance, opportunities, and request workflows. |
| CRO Workspace | Explain program coordination, operational tasks, exchange, QC/logistics/regulatory workflows. |
| Network Workspace | Explain organization coordination boundaries and cross-org access rules. |
| Vendor Workspace | Explain assigned work, confirmations, integration status, and request participation. |
| KOC | Explain operational surfaces, audit requirements, and support/escalation responsibilities. |

Help must not imply unavailable or unauthorized capabilities.

## Profile

Profile is user-owned and separate from organization settings.

### Profile Content

- Name.
- Email.
- Avatar or display identity.
- Authentication/security status.
- Active organization.
- Membership list.
- Role/capability summary per organization.
- Sign out.

### Profile Rules

- User profile is not organization profile.
- Organization role changes are managed through membership administration, not personal profile.
- Active organization selection belongs in profile and workspace switcher, but must use server-validated membership.

## Responsive Behavior

### Breakpoint Behavior

| Screen | Shell behavior |
|---|---|
| Large desktop | Sidebar expanded, top nav full, optional context panel visible. |
| Standard desktop | Sidebar expanded or compact; context panel collapsible. |
| Tablet | Sidebar collapses to icon rail or drawer; top nav prioritizes breadcrumbs, search, notifications, profile. |
| Mobile | Sidebar becomes drawer; global nav becomes menu; context panels become tabs or accordions; action bars become bottom sheets or stacked buttons. |

### Responsive Rules

- No route should require horizontal scrolling for primary navigation.
- Tables and dense evidence surfaces may scroll within content, not the shell.
- Critical actions must remain reachable on mobile.
- Sponsor reasoning panels and KOC notification panels must collapse without hiding the primary task.
- Breadcrumbs may truncate but must preserve current page/object.

## Empty States

Empty states should explain what is missing, why it is missing, and what the user can do.

| Empty state | Required message |
|---|---|
| No active organization | Select an active organization or complete invitation/onboarding. |
| No capabilities | Organization setup is incomplete; admin action required. |
| No workspace tools | No tools are authorized for the active organization. |
| No sponsor portfolio institutions | Sponsor portfolio exists but contains no authorized institution memberships. |
| No marketplace results | No visible matches; suggest filter changes or registration/request path. |
| No members/invitations | Members and invitations will appear after governed membership actions. |
| No notifications | Nothing currently requires attention. |
| No KOC data | No operational data is available or user lacks internal scope. |

Empty states must not offer actions the user cannot perform.

## Loading States

Loading states should reflect the data being resolved.

| Loading state | Required behavior |
|---|---|
| Session loading | Minimal shell or branded loading screen. |
| Access context loading | Hold navigation until membership and active org are resolved. |
| Navigation loading | Skeleton sidebar/top nav; avoid flashing unauthorized items. |
| Dashboard loading | Dashboard skeleton with stable layout. |
| Search loading | Preserve query and show progress. |
| Notifications loading | Non-blocking indicator. |
| Settings loading | Section-specific skeleton; do not show stale role/capability controls. |

## Error States

Error states must be safe and actionable.

| Error | Required behavior |
|---|---|
| Unauthenticated | Redirect to login with safe `next` target. |
| No active membership | Show workspace selection or invitation/onboarding path. |
| Unauthorized route | Show access denied or redirect to default authorized landing. |
| Capability missing | Explain feature is unavailable for this organization. |
| Policy denied | Explain the action is not allowed; avoid leaking restricted details. |
| Search failure | Show retry and preserve query. |
| Notification failure | Keep shell usable and show non-blocking failure. |
| Dashboard fetch failure | Show retry and fallback guidance. |
| KOC internal denial | Redirect or show internal access denied; audit if appropriate. |

## Actor Specifications

### Institution

| Topic | Specification |
|---|---|
| Landing page | `/workspace`, with Institution dashboard or setup/profile readiness surface. |
| Primary navigation | Overview, Institution Profile, Discovery, Evidence/Continuity, Programs, Collections, Consent, Regulatory, Analytics, Exchange, Settings. |
| Secondary navigation | Documents, Capabilities, Public Profile readiness, Marketplace visibility readiness, Reports, KPE where relevant. |
| Frequently used actions | Update profile, upload/review documents, run or review discovery, manage members, review requests, update capabilities, inspect evidence readiness. |
| Workspace-specific tools | Profile readiness, discovery dashboard, continuity profile/passport, collections, consent, regulatory, inventory, processing/QC if capabilities exist, analytics. |
| Administration entry points | Organization Profile, Members, Roles, Capabilities, Marketplace Visibility, Public Profile, Integrations, Security. |

Institution navigation must not imply marketplace publication, public profile availability, or sponsor passport sharing until governed activation occurs.

### Sponsor

| Topic | Specification |
|---|---|
| Landing page | `/sponsor` when sponsor experience is authorized; `/workspace` only as fallback during consolidation. |
| Primary navigation | Dashboard, Portfolio Intelligence, Institutional Passports, Feasibility Search, Opportunity Discovery, Risk Monitoring, Requests, Notifications, Settings. |
| Secondary navigation | Study intent, Portfolio membership, Evidence changes, Provenance, Comparisons, Saved institutions, Marketplace discovery. |
| Frequently used actions | Review portfolio, inspect passport, trace provenance, compare institutions, create/request feasibility, request evidence, monitor risk, manage portfolio settings. |
| Workspace-specific tools | Sponsor Passport list/detail, portfolio index, feasibility search, opportunity projections, risk monitoring, sponsor requests, evidence reasoning context. |
| Administration entry points | Sponsor Organization Settings, Members, Roles, Sponsor Portfolio, Marketplace Request Settings, Integrations, Billing/Payments if activated. |

Sponsor navigation must distinguish public Marketplace discovery from Sponsor Portfolio access. A sponsor can browse marketplace-visible institutions without gaining private passport access.

### CRO

| Topic | Specification |
|---|---|
| Landing page | `/workspace`, with CRO operations dashboard. |
| Primary navigation | Overview, Programs, Sites/Participants where authorized, Logistics, QC, Regulatory, Exchange, Analytics, Settings. |
| Secondary navigation | Milestones, Requirements, Tasks, Shipments, Exceptions, Documents, KPE, Payments if activated. |
| Frequently used actions | Review program status, coordinate site tasks, review logistics exceptions, update QC/regulatory status, manage requests, inspect KPE readiness. |
| Workspace-specific tools | Program coordination, participant coordination, logistics, QC, regulatory documentation, exchange/request tracking, analytics, KPE projections. |
| Administration entry points | Organization Profile, Members, Roles, Capabilities, Program Access, Integrations, Security. |

CRO navigation must not expose sponsor-owned portfolios, institution private evidence, or cross-organization data unless program, exchange, policy, or explicit access scope allows it.

### Network

| Topic | Specification |
|---|---|
| Landing page | `/workspace`, with Network operations dashboard. |
| Primary navigation | Overview, Network Profile, Programs, Organization Coordination, Analytics, Exchange, Discovery/Readiness where enabled, Settings. |
| Secondary navigation | Member organization relationships, program participation, cross-site tasks, exceptions, documents, reports. |
| Frequently used actions | Review network readiness, coordinate programs, manage organization relationships, inspect exceptions, review analytics, manage members. |
| Workspace-specific tools | Network profile, program coordination, analytics, exchange/request surfaces, readiness/discovery surfaces when capabilities permit. |
| Administration entry points | Organization Profile, Members, Roles, Capabilities, Relationship/Program Access, Marketplace Visibility, Integrations. |

Network navigation must not imply automatic administrative access to member institutions. Cross-organization visibility requires explicit approved relationships or scopes.

### Vendor

| Topic | Specification |
|---|---|
| Landing page | `/workspace`, with Contribution/Confirmation dashboard. |
| Primary navigation | Overview, Assigned Work, Requests, Logistics or Processing/QC based on capability, Integrations, Analytics, Settings. |
| Secondary navigation | Work queue, confirmations, exceptions, documents, service catalog readiness, payments if activated. |
| Frequently used actions | Accept/review request, confirm work, update status, resolve exceptions, upload operational documentation, monitor integration status. |
| Workspace-specific tools | Logistics confirmations, processing/QC work, storage/inventory contribution, data/technology integration status, exchange/request participation. |
| Administration entry points | Organization Profile, Members, Roles, Capabilities, Service Catalog, Integrations, Security, Billing/Payments if activated. |

Vendor navigation must be scoped to assigned capabilities and authorized operational work. It must not expose sponsor, institution, specimen, program, evidence, or passport data without explicit scope.

### Kadarn Internal

| Topic | Specification |
|---|---|
| Landing page | `/koc`. |
| Primary navigation | Network Overview, Platform Health, Exceptions, Events, KPE, Discovery, Provenance, Compliance, Policy, Workflow, Knowledge, Security/Audit, Support, Settings. |
| Secondary navigation | Cutover readiness, activity, notifications, analytics, ecosystem, internal support queues, operational runbooks. |
| Frequently used actions | Review health, investigate incidents, inspect events, review policy/compliance, trace provenance, support customer access, monitor cutover gates. |
| Workspace-specific tools | KOC dashboards, platform health, event stream, audit/policy review, provenance operations, KPE operations, workflow/knowledge/engine views. |
| Administration entry points | Internal Settings, Platform Roles, Support Tools, Security Review, Policy Configuration, Operational Runbooks, Audit Review. |

Kadarn Internal navigation must remain role-limited and auditable. KOC is not a shortcut around customer authorization, RLS, evidence governance, or policy.

## Actor Navigation Matrix

| Actor | Experience | Landing | Primary model | Admin model |
|---|---|---|---|---|
| Institution | Workspace | `/workspace` | Capability-driven institution tools | Organization settings and membership admin |
| Sponsor | Sponsor Workspace | `/sponsor` | Sponsor portfolio and evidence reasoning surfaces | Sponsor org and portfolio administration |
| CRO | Workspace | `/workspace` | Program/operations coordination | Organization and program access admin |
| Network | Workspace | `/workspace` | Network coordination and analytics | Organization, relationships, and capability admin |
| Vendor | Workspace | `/workspace` | Contribution/confirmation work | Provider org, capability, and integration admin |
| Kadarn Internal | KOC | `/koc` | Platform operations and governance | Internal roles, audit, support, policy settings |

## Navigation Manifest Contract

The product contract should support one manifest per resolved context.

```text
NavigationManifest
  user
  activeOrganization
  activeExperience
  allowedExperiences
  globalItems
  primarySections
  secondarySections
  frequentActions
  workspaceTools
  administrationItems
  searchScopes
  notificationScopes
  emptyStateHints
  helpContext
```

### Manifest Rules

- One manifest feeds global nav, sidebar, top nav, settings links, search scopes, and frequent actions.
- The manifest is not a permission source of truth; it is a presentation of already-authorized capabilities.
- Direct route access must enforce the same authorization independently.
- The manifest should include disabled reasons only when revealing the missing capability is safe.

## Acceptance Criteria For PCP-2 Implementation Planning

Future PCP-2 implementation planning should verify:

- One shared navigation contract exists for all authenticated experiences.
- Marketplace header becomes auth-aware without exposing private workspace data.
- Workspace, Sponsor, and KOC consume shared shell primitives.
- Settings are route-guarded and represented in navigation through the manifest.
- Active organization switching refreshes dashboard, navigation, search scopes, notification scopes, and settings access.
- Sponsor landing chooses `/sponsor` only when sponsor capability and authorization are present.
- KOC is visible only to Kadarn Internal users.
- Responsive behavior is defined at shell level.
- Empty/loading/error states are consistent and safe.

## Product Conclusion

PCP-2 should unify Kadarn around a single experience contract:

```text
Organization + Membership + Role + Capability + Policy
  -> Actor-aware Experience
  -> Authorized Navigation Manifest
  -> Shared Application Shell
  -> Capability-specific Tools and Projections
```

This preserves Kadarn's existing product surfaces while removing navigation duplication and making the application usable as a production platform for all supported actors.
