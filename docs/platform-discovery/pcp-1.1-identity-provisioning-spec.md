# PCP-1.1 Identity and Workspace Provisioning Specification

**Program:** Kadarn Platform Consolidation - PCP  
**Phase:** PCP-1.1  
**Step:** 2 - Product Specification  
**Mode:** Product specification only. No code changes.  
**Input:** `docs/platform-discovery/pcp-1.1-identity-provisioning-audit.md`  
**Output:** Organization-first onboarding model for Kadarn.

## Product Decision

Kadarn provisions organizations first, then users inside an organization context. A new authenticated user who starts onboarding is not treated as a standalone customer account. The user is the first administrator or owner of a durable `Organization` record, and workspace access is derived from that organization, its capabilities, its memberships, and its roles.

The six supported actor types are:

1. Institution / Research Site
2. Sponsor
3. CRO
4. Network / SMO / Academic Network
5. Vendor / Central Lab / Technology Partner
6. Kadarn Platform (Internal)

External actors are modeled as `organizations` with assigned capabilities. Kadarn Platform (Internal) is modeled as internal platform access through `kadarn_internal`, KOC/operations routes, platform roles, audit requirements, and governance controls. It must still follow the same authorization and audit model.

## Non-Negotiable Rules

- Kadarn provisions organizations, not individual accounts.
- Every authenticated user operates in exactly one active organization context at a time.
- Multi-membership is allowed only through the existing membership and active-org model.
- The first user created through onboarding becomes the first admin or owner of that organization.
- Marketplace visibility is not enabled automatically.
- Sponsor Passport sharing is not enabled automatically.
- Passports, Published Views, Evidence Packs, Discovery Reports, Institution Profiles, KPEs, and dashboards are projections, not sources of truth.
- Actor type is expressed through capabilities, not new actor tables.
- Kadarn Internal users must use the same layered authorization model: auth, membership or platform role, RLS/policy, visibility, audit, and governance.
- Special-case permission systems are not allowed unless an existing model cannot express the required control.

## Canonical Provisioning Chain

The product model should consolidate around this chain:

```text
Supabase Auth user
  -> user_profiles
  -> organizations
  -> organization_memberships
  -> membership_roles
  -> organization_capabilities
  -> active_org_id
  -> workspace profile/navigation
  -> optional portfolios, programs, discovery sessions, or operational assets
```

The strongest existing source-of-truth path remains:

```text
Organization
  -> Membership
  -> Role
  -> Capability
  -> Active organization context
  -> Workspace access
```

## Shared Onboarding Contract

Every external actor onboarding flow must create or initialize the same minimum set of objects.

| Object | Required behavior |
|---|---|
| `user_profiles` | Ensure the authenticated user has a profile linked to Supabase Auth. |
| `organizations` | Create the durable organization anchor. |
| `organization_memberships` | Create an active membership for the first user. |
| `membership_roles` | Assign the first user the default admin/owner role. |
| `organization_capabilities` | Assign capabilities matching the actor type. |
| `active_org_id` | Set through the validated server path after membership creation. |
| Audit event | Record onboarding, role assignment, capability assignment, and activation. |
| Workspace profile | Resolve active org, applications, role, capabilities, and allowed experiences. |

## Default Locks

New organizations should start operationally private. Onboarding should not imply external publication.

| Feature | Default state | Activation requirement |
|---|---|---|
| Marketplace visibility | Locked | Explicit review/activation of visibility scope. |
| Sponsor Passport sharing | Locked | Portfolio membership, evidence readiness, and sharing approval. |
| Public Institution Profile | Locked | Published-view/public profile approval. |
| Continuity/Site Passport public link | Locked | Explicit public/shared-link review. |
| Evidence claim publication | Locked | Evidence/claim lifecycle promotion and policy approval. |
| Discovery candidate promotion | Locked | Review and promotion into evidence/claim lifecycle. |
| External integrations | Locked | Operational readiness and credentials/config review. |
| Financial/payment workflows | Locked | Payment/compliance activation. |
| KOC administrative actions | Locked for external orgs | Kadarn internal authorization and audit. |

## Actor Provisioning Matrix

| Actor | Organization record | Workspace | First user role | Landing route |
|---|---|---|---|---|
| Institution / Research Site | `organizations` with institution-relevant capabilities | Institution Workspace | `org_admin` / owner | `/workspace` |
| Sponsor | `organizations` with `sponsor` capability | Sponsor Workspace and Sponsor Portfolio scope | `org_admin` / sponsor owner | `/sponsor` or `/workspace` with sponsor surface |
| CRO | `organizations` with `cro` capability | CRO operations workspace | `org_admin` / owner | `/workspace` |
| Network / SMO / Academic Network | `organizations` with network/operator capabilities | Network operations workspace | `org_admin` / network owner | `/workspace` |
| Vendor / Central Lab / Technology Partner | `organizations` with vendor/lab/technology capabilities | Contribution/Confirmation Workspace | `org_admin` / vendor owner | `/workspace` |
| Kadarn Platform (Internal) | Internal Kadarn organization context plus `kadarn_internal` platform role | Kadarn Operations Workspace | platform-only role assigned by governance | `/koc` |

## 1. Institution / Research Site

### What The User Is Trying To Do

The user is registering a research site, institution, hospital, academic center, biobank, clinical site, or lab-facing institution so Kadarn can organize its operational profile, evidence, capabilities, discovery outputs, and future sponsor-facing projections.

### Organization Record Created

Create one `organizations` row as the durable institution anchor. Institution is not a separate table. It is the product reading of an organization when the organization is assessed, discovered, profiled, or presented to sponsors/public users.

Initial capability selection should map to existing capability types, such as:

- `clinical_site`
- `biobank`
- `processing_lab`
- `diagnostic_lab`
- `storage_facility`
- `data_processor`

### Workspace Provisioned

Provision an Institution Workspace under the existing workspace model. The workspace should be capability-driven:

- Profile and organization settings
- Consent, collections, regulatory, inventory, processing, QC, analytics, or exchange depending on capabilities
- Discovery entry points when enabled
- Evidence and continuity surfaces only when backed by existing routes/projections

### Default Role For First User

The first user receives `org_admin` through `membership_roles`. Product copy may call this role Institution Owner or Organization Admin, but the persisted role should reuse the existing organization role model.

### Initial Assets Created

- Organization profile shell
- Active membership for first user
- `org_admin` role assignment
- Initial organization capabilities
- Institution Portfolio initialization
- Workspace profile/navigation context
- Private discovery readiness placeholder or checklist
- Audit event for organization provisioning

Institution Portfolio means the institution-owned operational workspace for organizing its identity, profile, capabilities, discovery readiness, evidence readiness, and internal assets. It is not the same as Sponsor Portfolio.

### Permissions Applied

- First user can manage organization profile, members, capabilities, and institution workspace settings.
- First user can view private institution workspace data.
- Marketplace publication remains disabled.
- Sponsor passport sharing remains disabled.
- Evidence publication remains governed by evidence lifecycle and policy.

### Landing Route

Land on `/workspace`, ideally the institution profile or setup surface once implemented. If active-org selection is needed, use the existing active-org model before landing.

### Locked Until Review/Activation

- Marketplace listing
- Public institution profile
- Sponsor Passport access by any sponsor
- Published View generation for public/sponsor audience
- Evidence claim publication
- External connector activation
- Payment or exchange workflows

## 2. Sponsor

### What The User Is Trying To Do

The user is registering a sponsor organization that wants to manage study intent, inspect institutions, maintain a sponsor portfolio, evaluate readiness, and eventually request evidence or opportunities.

### Organization Record Created

Create one `organizations` row with the `sponsor` capability. The sponsor organization is the tenant anchor for sponsor-side access, portfolio scope, study/program context, requests, and passport reads.

### Workspace Provisioned

Provision Sponsor Workspace using the existing sponsor surfaces and sponsor passport architecture:

- Sponsor dashboard
- Sponsor Passport list/detail
- Portfolio scope
- Study/program intent surfaces when available
- Evidence reasoning context
- Opportunities/risk/notifications only where backed by implementation

### Default Role For First User

The first user receives `org_admin` through `membership_roles`. Product copy may call this Sponsor Owner.

### Initial Assets Created

- Sponsor organization profile
- Active membership for first user
- `org_admin` role assignment
- `sponsor` capability assignment
- Sponsor Workspace context
- Empty active Sponsor Portfolio
- Audit event for sponsor provisioning

Sponsor Portfolio must be created as an empty access scope. It must not auto-add institutions.

### Permissions Applied

- First user can manage sponsor organization settings and members.
- First user can access sponsor workspace.
- First user can view sponsor portfolio shell.
- First user cannot inspect an institution passport unless a portfolio membership grants scope.
- First user cannot publish, share, or request private institution data by default.

### Landing Route

Land on `/sponsor` when sponsor routing is certified. Until then, `/workspace` may remain the generic fallback, but product intent is Sponsor Workspace.

### Locked Until Review/Activation

- Sponsor Passport sharing
- Institution passport reads without portfolio membership
- Marketplace request workflows requiring operational review
- Financial/payment actions
- Evidence challenge/request flows
- Bulk institution search beyond permitted marketplace visibility

## 3. CRO

### What The User Is Trying To Do

The user is registering a CRO organization that coordinates programs, sites, logistics, QC, regulatory work, or study operations on behalf of sponsors or networks.

### Organization Record Created

Create one `organizations` row with the `cro` capability. Additional capabilities may be assigned only if the organization actually performs those functions.

### Workspace Provisioned

Provision a CRO operations workspace using the general workspace model:

- Programs
- Exchange
- QC
- Logistics
- Analytics
- Regulatory surfaces if the capability model permits

### Default Role For First User

The first user receives `org_admin` through `membership_roles`. Product copy may call this CRO Owner or Organization Admin.

### Initial Assets Created

- Organization profile
- Active membership for first user
- `org_admin` role assignment
- `cro` capability assignment
- Workspace profile/navigation context
- Empty program or operations setup checklist
- Audit event for CRO provisioning

### Permissions Applied

- First user can administer CRO workspace, members, and organization settings.
- First user can access capabilities assigned to the CRO.
- Access to sponsor or institution data requires program participation, exchange/request scope, portfolio scope, policy, or explicit authorization.

### Landing Route

Land on `/workspace`, with applications derived from `cro` capability.

### Locked Until Review/Activation

- Sponsor-owned portfolio reads
- Institution private evidence
- Marketplace publication
- Program participation outside approved programs
- External integrations
- Financial/payment operations

## 4. Network / SMO / Academic Network

### What The User Is Trying To Do

The user is registering a network, SMO, or academic network that coordinates multiple sites, institutions, operational relationships, or program participation across a group.

### Organization Record Created

Create one `organizations` row representing the network entity. Do not create child institutions automatically unless a separate invited/provisioned organization flow is completed.

Capabilities should be assigned based on actual function. Depending on repository vocabulary, this may include existing capabilities such as:

- `clinical_site`
- `cro`
- `data_processor`
- `technology_provider`
- other existing capability keys only when appropriate

No new network domain is required for PCP-1.1 unless a later design prompt proves the existing capability model cannot express the workflow.

### Workspace Provisioned

Provision a Network Operations Workspace under `/workspace`:

- Organization profile
- Member management
- Program and participant coordination where supported
- Analytics
- Exchange/request surfaces where supported
- Institution coordination only through explicit organization relationships, memberships, programs, or future approved scope

### Default Role For First User

The first user receives `org_admin` through `membership_roles`. Product copy may call this Network Owner.

### Initial Assets Created

- Network organization profile
- Active membership for first user
- `org_admin` role assignment
- Selected capability assignments
- Workspace profile/navigation context
- Empty network setup checklist
- Audit event for network provisioning

### Permissions Applied

- First user can administer the network organization.
- First user cannot automatically administer member institutions.
- Cross-organization visibility requires explicit program, membership, policy, or other approved access relationship.
- Network marketplace visibility remains disabled until activated.

### Landing Route

Land on `/workspace`, with network-relevant applications derived from assigned capabilities.

### Locked Until Review/Activation

- Automatic access to member institutions
- Marketplace network listing
- Sponsor Passport sharing
- Public network profile
- Cross-site evidence aggregation
- External partner integrations

## 5. Vendor / Central Lab / Technology Partner

### What The User Is Trying To Do

The user is registering a provider organization that contributes services, confirms operational events, processes samples, provides logistics, runs lab operations, stores material, or supports technology workflows.

### Organization Record Created

Create one `organizations` row with one or more existing provider capabilities:

- `logistics_vendor`
- `diagnostic_lab`
- `processing_lab`
- `storage_facility`
- `technology_provider`
- `data_processor`

### Workspace Provisioned

Provision a Contribution/Confirmation Workspace. This workspace is scoped to the provider's assigned capability and should focus on confirming or contributing operational work rather than owning sponsor/institution truth.

Examples:

- Logistics confirmation
- Processing/QC work
- Storage/inventory contribution
- Data/technology integration status
- Exchange/request participation

### Default Role For First User

The first user receives `org_admin` through `membership_roles`. Product copy may call this Vendor Owner, Lab Owner, or Technology Partner Owner depending on selected capability.

### Initial Assets Created

- Provider organization profile
- Active membership for first user
- `org_admin` role assignment
- Provider capability assignments
- Workspace profile/navigation context
- Empty contribution/confirmation setup checklist
- Audit event for provider provisioning

### Permissions Applied

- First user can administer the vendor organization and its users.
- First user can access provider workspace features tied to assigned capabilities.
- First user cannot access sponsor, institution, specimen, program, evidence, or passport data unless scoped by program, exchange, request, or explicit authorization.

### Landing Route

Land on `/workspace`, with navigation derived from the assigned provider capabilities.

### Locked Until Review/Activation

- Marketplace provider listing
- Public service catalog
- Operational integration credentials
- Program participation
- Sponsor/institution private data
- Financial/payment actions
- Passport visibility or sharing

## 6. Kadarn Platform (Internal)

### What The User Is Trying To Do

The user is a Kadarn operator, administrator, support user, security reviewer, compliance reviewer, or platform engineer who needs controlled access to operate the platform, review health, investigate events, support customers, and govern system behavior.

Kadarn Internal onboarding is not a customer onboarding flow. It provisions internal access to the Kadarn Operations Workspace under strict governance.

### Organization Record Created

Kadarn should maintain an internal Kadarn organization context for audit, membership, and operational ownership. Internal users must still have a durable identity and an access context.

The internal actor also requires `kadarn_internal` in platform role metadata because KOC and operations routes already use that platform role.

### Internal Operational Workspace

Provision the Kadarn Operations Workspace:

- KOC dashboard
- Platform health
- Events
- Provenance operations
- KPE operations
- Policy/compliance
- Security/audit views
- Network/ecosystem analytics
- Operational exception review
- Cutover and production-readiness surfaces where implemented

The intended landing route is `/koc`.

### Administrative Capabilities

Administrative capabilities should be limited to operating and governing the platform:

- View operational health and readiness
- Review system events and audit trails
- Investigate provenance and evidence pipeline state
- Review policy/compliance signals
- Support customer onboarding and troubleshooting
- Manage platform configuration only through approved controls
- Review production cutover status
- Run operational checks where explicitly supported

Administrative capability does not imply unrestricted data mutation.

### Governance Permissions

Kadarn Internal permissions must be layered:

1. Supabase Auth identity
2. `user_profiles` profile
3. Internal Kadarn organization membership where applicable
4. `kadarn_internal` platform role for KOC access
5. Fine-grained internal roles for operational duties
6. RLS/policy checks where data is tenant-scoped
7. Audit event capture for administrative actions

Internal access must not bypass tenant isolation unless the operation is explicitly authorized, auditable, and necessary.

### Platform-Only Roles

Platform-only roles should be explicit and narrow. They should not replace customer org roles.

| Role | Purpose | Restrictions |
|---|---|---|
| Platform Operator | Monitor health, queues, events, readiness, and operational exceptions. | No customer data mutation by default. |
| Platform Support | Assist customer onboarding and triage access issues. | Requires audit reason for customer-context access. |
| Platform Compliance Reviewer | Review audit, policy, evidence governance, and visibility controls. | Cannot alter evidence or customer memberships by default. |
| Platform Security Reviewer | Review auth, RLS, policy, and security events. | Cannot grant self additional privileges. |
| Platform Admin | Manage internal platform configuration and emergency operations. | Requires strongest audit and separation-of-duties controls. |

These are product roles for specification. Implementation should reuse existing role infrastructure where possible and avoid a parallel permission system.

### Operational Responsibilities

Kadarn Internal users are responsible for:

- Monitoring platform health
- Reviewing production-readiness gates
- Supporting identity and workspace provisioning
- Investigating incidents
- Reviewing audit and policy outcomes
- Maintaining operational evidence/provenance integrity
- Managing cutover and rollback readiness
- Approving marketplace visibility or public sharing only through governed workflows

### Restrictions

Kadarn Internal users must not:

- Silently edit customer evidence
- Promote discovery candidates without governed review
- Enable marketplace visibility without review
- Enable Sponsor Passport sharing without explicit scope and approval
- Modify customer organization memberships without audit reason
- Use KOC access as a substitute for customer consent or policy
- Assign themselves additional production privileges
- Bypass RLS/policy without a recorded operational reason

### Audit Requirements

Every internal administrative action must be auditable. Required audit fields should include:

- Actor user id
- Internal role or platform role
- Active organization context, when applicable
- Target organization or resource
- Action type
- Reason or operational ticket reference
- Result
- Timestamp
- Correlation id

Read-only internal access to sensitive tenant data should also be auditable when feasible.

### Separation Of Duties

Kadarn Internal access must support separation of duties:

- Operators monitor and triage; they do not approve their own privilege escalation.
- Support can assist onboarding; support cannot silently grant production data sharing.
- Compliance can review; compliance should not mutate the evidence being reviewed.
- Security can investigate access; security should not self-assign platform admin.
- Platform Admin can perform emergency actions; emergency actions require audit and post-action review.

### Initial Assets Created

- Internal user profile
- Internal Kadarn organization membership where applicable
- `kadarn_internal` platform role assignment through governed admin path
- Platform-only role assignment
- KOC access context
- Audit baseline for internal provisioning

### Permissions Applied

- Access to `/koc` and internal operations routes according to platform role.
- Access to operational views required by role.
- No automatic unrestricted customer mutation.
- Customer-scoped operations require policy, audit, and operational justification.

### Landing Route

Land on `/koc`.

### Locked Until Review/Activation

- Platform Admin role
- Emergency override actions
- Customer data mutation
- Public visibility approval
- Sponsor Passport sharing approval
- Evidence promotion or correction
- Production configuration changes

## Permission Model

The product permission model should use existing layers:

| Layer | Responsibility |
|---|---|
| Auth | Confirm user identity. |
| Profile | Identify the user profile linked to auth. |
| Organization membership | Confirm the user belongs to the active organization. |
| Membership role | Determine admin/member/operator authority. |
| Capability | Determine which workspace applications are available. |
| Active org | Bind the current request/session to one organization context. |
| RLS/policy | Enforce tenant, visibility, and operation-level rules. |
| Audit | Record important identity, provisioning, visibility, and governance actions. |

## Landing Route Rules

| Condition | Landing route |
|---|---|
| `kadarn_internal` platform role | `/koc` |
| Sponsor org with sponsor workspace certified | `/sponsor` |
| External org with active membership | `/workspace` |
| Multiple memberships and no active org | Organization selection using existing active-org model |
| No organization membership | Onboarding start or `/marketplace` depending product entry point |

## Activation Workflow Boundaries

Onboarding creates private, operational readiness. It does not publish or share.

| Activation | Who can request | Who can approve | Result |
|---|---|---|---|
| Marketplace visibility | Org admin | Kadarn review or governed self-service rule | Organization appears in allowed marketplace surfaces. |
| Sponsor Portfolio membership | Sponsor admin or Kadarn support workflow | Governed portfolio/access rule | Sponsor can inspect selected institution passport. |
| Sponsor Passport sharing | Institution admin or governed sharing workflow | Institution/Kadarn policy, depending product rule | Passport projection becomes available to scoped sponsor. |
| Public Institution Profile | Institution admin | Review/policy gate | Public profile projection is exposed. |
| Public/shared Site Passport | Institution admin | Review/policy gate | Public/shared link becomes available. |
| External integrations | Org admin | Kadarn operational review | Integration credentials/config become active. |
| Internal elevated access | Internal user manager | Separate authorized approver | Platform-only privilege becomes active. |

## Required Corrections Before Implementation

This specification depends on resolving known Step 1 gaps:

1. Organization creation must assign the first user `org_admin` through `membership_roles`.
2. Invite flow must stop using flat membership roles and must persist roles through `membership_roles`.
3. Active org selection should use the validated server path as canonical.
4. Middleware and route guards should converge on validated membership where required.
5. Sponsor landing behavior should be made explicit.
6. `/auth/select-org` should be resolved or replaced by the existing inline organization selector.
7. Marketplace visibility and passport sharing must remain explicit activation workflows.
8. Kadarn Internal access must be auditable and separated by duty.

## Acceptance Criteria For PCP-1.1 Design

- A new user can onboard by creating an organization, not just a profile.
- The first user receives an active membership and admin role.
- The organization receives exactly the capabilities selected for its actor type.
- The user has one active organization context after onboarding.
- Workspace navigation derives from capabilities.
- Sponsor onboarding creates an empty Sponsor Portfolio scope.
- Institution onboarding initializes an Institution Portfolio.
- Vendor onboarding creates a Contribution/Confirmation Workspace.
- Kadarn Internal onboarding lands in KOC and uses governed platform-only roles.
- Marketplace visibility is off by default.
- Sponsor Passport sharing is off by default.
- All provisioning actions are audit-ready.

## Step 2 Conclusion

The PCP-1.1 product model is organization-first and capability-driven. The correct implementation path is to finish the existing identity, organization, membership, role, capability, active-org, workspace, sponsor portfolio, and audit architecture. Kadarn should not introduce separate actor domains or automatic sharing behavior. The next steps should convert this specification into detailed workflow prompts and implementation tasks without violating the constitution.
