# ADR-034: Unified Workspace Experience

**Status:** Accepted  
**Date:** 2026-07-05  
**Deciders:** Kadarn Architecture  
**Program:** PCP-2 - Experience & Navigation Consolidation  
**Related:** ADR-033, PCP-2 Experience Audit, PCP-2 Experience Specification, Platform Constitution

---

## Context

Kadarn currently exposes several recognizable product experiences:

- Marketplace
- Organization Workspace
- Sponsor Workspace
- Kadarn Operations Center
- Public projection/report routes
- Auth and onboarding routes

PCP-2 Step 1 found that these experiences are assembled independently. Marketplace navigation is inline, Workspace navigation is partially API-driven from capabilities, Sponsor navigation is a static surface map, and KOC navigation is a static operations tree. Shell behavior, user identity, sign out, breadcrumbs, notifications, search, settings, active route handling, and responsive behavior are duplicated or inconsistent.

PCP-2 Step 2 defined a unified product model:

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

The Platform Constitution requires consolidation before expansion. Organization remains the persistent anchor; dashboards, Passports, Institution Profiles, Evidence Packs, Published Views, Discovery Reports, and KPEs remain projections; policy governs visibility and operations; portfolio defines sponsor access scope.

Without a formal decision, Kadarn risks preserving separate application shells, duplicating navigation trees, routing users by page path instead of active organization context, and treating actor workspaces as independent applications rather than contextual views over one governed platform.

---

## Decision

Kadarn exposes one application shell.

Navigation adapts to the active organization and authorized capabilities.

Workspaces are contextual views over the same platform rather than independent applications.

The architectural model is:

```text
Authenticated user
  -> Validated active organization context
  -> Membership roles
  -> Organization capabilities
  -> Policy and visibility checks
  -> Authorized navigation manifest
  -> Unified application shell
  -> Actor-aware workspace view
```

Marketplace, Organization Workspace, Sponsor Workspace, and Kadarn Operations Center remain valid product experiences. They are not separate applications with unrelated navigation systems. They are shell variants and navigation manifests over the same platform identity, organization, membership, capability, policy, and projection model.

---

## Navigation Model

Navigation is actor-aware, capability-driven, and manifest-based.

The navigation manifest is the presentation contract for authorized experiences, tools, actions, settings, search scopes, notification scopes, and help context.

```text
Navigation Manifest
  -> Global navigation
  -> Sidebar sections
  -> Secondary navigation
  -> Frequent actions
  -> Workspace-specific tools
  -> Administration entry points
  -> Search scopes
  -> Notification scopes
  -> Help context
```

Navigation rules:

- Navigation is derived from active organization, membership status, membership roles, organization capabilities, policy, visibility, and portfolio scope.
- Navigation items represent authorized product capabilities, not arbitrary pages.
- The same manifest must feed global navigation, sidebar, settings entry points, search scopes, notifications, and frequent actions.
- Navigation must not expose unauthorized capabilities, object names, counts, or sensitive context.
- Direct route and API access must still enforce authorization independently. The manifest is not the permission source of truth.
- Disabled states may be shown only when exposing the missing capability or activation state is safe.

This decision removes duplicated navigation trees as an architectural direction. Existing static maps may remain temporarily during migration, but they should be treated as inputs to or interim implementations of the unified manifest.

---

## Workspace Model

A workspace is a contextual view over one validated active organization, not a separate tenant or application.

```text
Organization
  -> Active membership
  -> Role assignments
  -> Capabilities
  -> Workspace view
```

This means:

- A user may belong to multiple organizations, but only one active organization context is used for workspace behavior.
- The active organization determines available workspace tools.
- Product actor language such as Institution, Sponsor, CRO, Network, Vendor, or Kadarn Internal is resolved from capabilities, role context, and platform role where applicable.
- Workspaces may have different layouts or emphasis, but they share the same shell contract and authorization model.
- Institution Workspace, Sponsor Workspace, CRO Workspace, Network Workspace, Vendor Workspace, and KOC are not independent products with independent access models.

Workspaces are product views over source records and projections. They must not become new sources of truth.

---

## Routing Model

Routes remain user-facing URLs, but route access must be resolved through the same active context model as navigation.

Route families:

| Route family | Product experience | Access basis |
|---|---|---|
| `/marketplace/*` | Marketplace | Public visibility plus authenticated actions when needed |
| `/workspace/*` | Organization Workspace | Active organization membership, role, capability |
| `/sponsor/*` | Sponsor Workspace | Active sponsor organization plus sponsor capability and portfolio/policy scope |
| `/koc/*` | Kadarn Operations Center | Kadarn Internal platform role plus internal authorization |
| `/settings/*` or `/workspace/settings/*` | Settings | Active organization or internal context and settings permission |
| Public projection routes | Reports, public passports, KPE views | Published/projection visibility and policy |
| Auth/onboarding routes | Login, registration, invitation acceptance | Auth state and governed onboarding/invitation flow |

Routing rules:

- Route groups and URL prefixes must align with authorization expectations.
- Workspace-owned routes must be protected as workspace routes even if their URL does not begin with `/workspace`.
- Login/default redirects should use the experience resolver, not only a static role-to-path map.
- A direct URL must not reveal a feature the navigation manifest would hide for that user.
- Sponsor routes require sponsor authorization, but sponsor access to institution data still requires sponsor portfolio membership, visibility, and policy.
- KOC routes must never be exposed to external organization users.

---

## Actor Awareness

Actor awareness is product behavior resolved from platform facts, not a separate architecture.

Supported actors:

| Actor | Workspace view |
|---|---|
| Institution | Institution workspace over an organization with institution-relevant capabilities |
| Sponsor | Sponsor workspace over a sponsor organization and sponsor portfolio scope |
| CRO | Operations workspace over a CRO-capable organization |
| Network | Network coordination workspace over a network/operator organization |
| Vendor | Contribution/confirmation workspace over provider capabilities |
| Kadarn Internal | KOC/internal operations workspace using internal platform role and governed access |

Actor-aware navigation determines:

- Landing page.
- Primary navigation.
- Secondary navigation.
- Frequently used actions.
- Workspace-specific tools.
- Administration entry points.
- Search scopes.
- Notification scopes.
- Help context.
- Empty/loading/error state language.

Actor awareness must not create actor-specific user tables, actor-specific permission systems, or independent app shells.

---

## Authorization Integration

Authorization is layered.

```text
Supabase Auth user
  -> user_profiles
  -> active organization membership
  -> membership_roles
  -> organization_capabilities
  -> RLS helpers
  -> Policy Engine evaluation
  -> visibility and projection filtering
  -> navigation manifest
  -> route/API enforcement
```

The shell and navigation manifest present only authorized options, but enforcement remains in middleware, route guards, API guards, RLS, policy evaluation, visibility rules, and projection filters.

Requirements:

- Active organization context must be server-validated against an active membership.
- Invited, pending, suspended, removed, or expired memberships do not grant workspace navigation.
- Role assignments must resolve from the canonical membership role model.
- Organization capabilities determine available tools, but do not bypass policy.
- Navigation visibility must not replace data access checks.
- Administrative actions require explicit permission and audit.

---

## Relationship To Policy Engine

The Policy Engine governs visibility and operations. It does not replace the navigation model or the organization membership model.

Policy Engine may decide:

- Whether a capability may be shown or activated.
- Whether an operation is allowed in the organization's lifecycle state.
- Whether a user may access a projection, report, passport, evidence surface, or internal operation.
- Whether a sponsor may perform a portfolio-related action.
- Whether an internal user may perform support, recovery, or administrative actions.

The navigation manifest consumes policy outcomes where appropriate. It must not become policy logic itself.

---

## Relationship To Organization Model

Organization remains the durable tenant and business actor anchor.

The unified shell does not create a new workspace entity that competes with Organization. Workspace is a view over:

```text
Organization
  -> Membership
  -> Role
  -> Capability
  -> Policy
  -> Projection/tool surface
```

Institution remains product language for an organization when assessed, discovered, profiled, or presented.

---

## Relationship To Identity

Identity provides the authenticated user and profile. It does not by itself determine organization access.

The unified shell must resolve:

- Signed-in user.
- User profile.
- Active organization.
- Active membership.
- Role assignments.
- Allowed experiences.
- Default landing.

Multi-organization users must switch context through a validated workspace switcher. A stale or client-set active organization value must not authorize workspace access.

---

## Relationship To Marketplace

Marketplace remains the public and semi-public discovery experience.

Under this ADR:

- Marketplace uses the same shell principles where applicable.
- Marketplace navigation becomes auth-aware but must not expose private workspace context.
- Authenticated Marketplace actions still enforce organization membership, role, capability, policy, and visibility.
- Marketplace visibility is not enabled automatically by membership or onboarding.
- Marketplace browsing is distinct from sponsor portfolio access.

Marketplace is an experience in the unified shell model, not a separate platform.

---

## Relationship To Institution Portfolio

Institution Portfolio is an institution-owned workspace/profile surface over the organization anchor.

The unified shell should expose Institution Portfolio surfaces only when the active organization, membership, role, capability, and policy permit them.

Institution Portfolio does not:

- Create a separate institution tenant.
- Publish public profiles automatically.
- Enable Marketplace visibility automatically.
- Share Sponsor Passports automatically.
- Promote discovery candidates into claims.
- Replace Evidence Core or Published View governance.

---

## Relationship To Sponsor Workspace

Sponsor Workspace is a sponsor organization view, not a separate access system.

Sponsor Workspace may have specialized layout regions such as portfolio context, evidence reasoning, passport panels, risk surfaces, and action bars. These are shell variant behavior over the unified shell contract.

Sponsor Workspace access requires:

```text
Active sponsor organization
  -> active membership
  -> sponsor capability
  -> sponsor role/permission
  -> policy and visibility
```

Access to institution-specific sponsor data additionally requires sponsor portfolio scope, portfolio membership, Published View or Passport visibility, and policy.

Sponsor Workspace must not collapse into generic Workspace, but it must share identity, active organization, authorization, navigation, settings, notifications, search, and profile principles with the rest of Kadarn.

---

## Relationship To Platform Constitution

This ADR protects the Platform Constitution:

| Constitutional rule | Unified workspace alignment |
|---|---|
| Organization is the persistent anchor. | Workspace is a contextual view over a validated organization, not a new anchor. |
| Claims are the fundamental unit of Evidence Core. | Navigation and dashboards do not alter claim/evidence truth. |
| Projections are not sources of truth. | Dashboards, Passports, Reports, Profiles, and KPEs remain audience views. |
| Portfolio defines access scope. | Sponsor Workspace does not bypass Sponsor Portfolio membership. |
| Policy governs visibility and operations. | Navigation consumes authorization/policy outcomes but does not replace enforcement. |
| Provenance must travel with evidence and projections. | Evidence-facing navigation must preserve provenance paths. |
| Consolidation comes before expansion. | Kadarn consolidates shell/navigation instead of adding independent apps. |

---

## Consequences

### Positive

- Kadarn has one application experience model instead of multiple unrelated shells.
- Navigation can adapt consistently to active organization, role, capability, policy, and portfolio scope.
- Actor-specific workspaces remain supported without duplicate access models.
- Marketplace, Workspace, Sponsor Workspace, and KOC can share user menu, search, notifications, settings, breadcrumbs, and responsive behavior.
- Route access and navigation visibility can be planned from one manifest contract.
- Product language becomes clearer: workspaces are contextual views over the same platform.

### Negative

- Existing shells and static navigation maps must be migrated carefully.
- The navigation manifest needs precise authorization inputs to avoid leaking capabilities or hiding valid tools.
- Sponsor Workspace must keep specialized reasoning/context behavior while adopting shared shell primitives.
- Settings routes and route guards must be reconciled so route ownership matches access expectations.

### Neutral

- Experience-specific shell variants remain allowed.
- Public Marketplace and public projection routes may still use a lighter shell.
- KOC remains an internal experience, but it must use the same identity and authorization principles.
- Existing route families may remain temporarily if they are guarded consistently.

---

## What This ADR Does Not Do

- Does not implement a shell.
- Does not change routes.
- Does not create a navigation manifest API.
- Does not change RLS policies.
- Does not add database tables.
- Does not alter organization, membership, role, or capability schemas.
- Does not enable Marketplace visibility.
- Does not grant Sponsor Passport access.
- Does not create new KOC privileges.
- Does not replace Policy Engine.

---

## Dependencies

| Artifact | Relationship |
|---|---|
| `docs/platform-discovery/kadarn-platform-constitution-v1.0.md` | Governing rules this ADR protects. |
| `docs/adr/ADR-033-organization-membership-model.md` | Establishes active membership and role assignment as workspace access foundation. |
| `docs/platform-discovery/pcp-1.1-identity-provisioning-spec.md` | Establishes organization-first provisioning and actor capabilities. |
| `docs/platform-discovery/pcp-1.2-membership-spec.md` | Establishes membership lifecycle and active organization constraints. |
| `docs/platform-discovery/pcp-2-experience-audit.md` | Current-state evidence for shell/navigation fragmentation. |
| `docs/platform-discovery/pcp-2-experience-spec.md` | Product specification ratified by this ADR. |

---

## Status

Accepted for PCP-2 implementation planning. Future implementation steps must preserve the unified shell, contextual workspace, and capability-driven navigation decisions unless a later ADR explicitly supersedes this one.
