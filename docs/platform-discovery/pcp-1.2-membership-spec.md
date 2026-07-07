# PCP-1.2 Invitation and Membership Management Specification

**Program:** Kadarn Platform Consolidation - PCP  
**Phase:** PCP-1.2  
**Step:** 2 - Product Specification  
**Mode:** Product specification only. No code changes.  
**Input:** `docs/platform-discovery/pcp-1.2-membership-audit.md`  
**Output:** Complete membership management model for Kadarn.

## Product Decision

Kadarn manages people through organization memberships, not standalone accounts. A user may belong to multiple organizations, but every workspace request resolves against one validated active organization context.

PCP-1.2 should consolidate the existing model:

```text
Supabase Auth user
  -> user_profiles
  -> organization_memberships
  -> membership_roles
  -> active_org_id
  -> workspace profile/navigation
  -> audit events
```

Membership is the durable access relationship. Invitation is the governed process that creates or activates that relationship. Role assignment is always persisted through `membership_roles`, even when product copy uses actor-specific role names such as Principal Investigator, Study Manager, or Evidence Reviewer.

## Non-Negotiable Rules

- Organization remains the persistent anchor.
- Users join existing organizations by invitation or another governed membership flow.
- No actor-specific user tables are introduced.
- No duplicate permission system is introduced.
- Product roles must map to existing or extended organization role records, then be assigned through `membership_roles`.
- `organization_memberships.role` must not be used as a source of truth.
- `active_org_id` must be written through a server path that validates active membership.
- Membership changes must not enable marketplace visibility, public profiles, sponsor passport sharing, evidence publication, or financial workflows by default.
- Kadarn Platform roles are not provisioned through public organization onboarding.
- Every membership and role mutation must be auditable.

## Scope

PCP-1.2 defines:

- Membership lifecycle.
- Invitation lifecycle.
- Supported membership operations.
- Supported organization roles by actor type.
- Permission model.
- Ownership safeguards.
- Invitation security.
- Audit requirements.
- Governance rules.

PCP-1.2 does not define:

- Organization onboarding.
- Marketplace publication.
- Sponsor portfolio membership.
- Program participant management.
- Evidence claim permissioning.
- Kadarn platform bootstrap.
- Public account registration redesign.

## Core Objects

| Object | Product meaning | Source of truth |
|---|---|---|
| User | A person authenticated by Kadarn. | Supabase Auth + `user_profiles` |
| Organization | Durable business actor and tenant anchor. | `organizations` |
| Membership | A user's relationship to one organization. | `organization_memberships` |
| Role assignment | Permission bundle attached to a membership. | `membership_roles` + `organization_roles` |
| Invitation | Governed request for a person to join an organization. | Invitation record or invited membership, depending implementation plan |
| Active organization | The organization context for current workspace/session behavior. | Validated membership + `active_org_id` metadata |
| Audit event | Immutable record of membership or role action. | `audit_events` |

## Membership Lifecycle

The product lifecycle for membership is:

```text
Invited
  -> Pending Acceptance
  -> Active
  -> Suspended
  -> Active
  -> Removed
```

Removed is terminal for the membership instance. If a removed person must rejoin, Kadarn should create a new governed invitation or explicitly reactivate only if the implementation preserves audit-safe history.

| State | Meaning | Workspace access | Role effect | Allowed transitions |
|---|---|---|---|---|
| Invited | An organization has initiated an invitation for a user or email address. | No | Intended roles may be staged but not effective. | Pending Acceptance, Cancelled invitation, Expired invitation |
| Pending Acceptance | The invitee has started acceptance or has a valid acceptance path but has not completed account/session confirmation. | No | Roles remain staged or inactive. | Active, Rejected, Expired |
| Active | User has accepted and may operate in the organization if the organization is eligible. | Yes | Assigned roles are effective. | Suspended, Removed, role change, ownership transfer |
| Suspended | User remains associated for history but cannot access the organization. | No | Roles remain recorded but ineffective. | Active, Removed |
| Removed | User no longer has access; history remains auditable. | No | Roles are inactive or historical only. | None by default |

### Membership State Rules

- Only Active memberships may be selected as `active_org_id`.
- Suspended and Removed memberships must not satisfy workspace access.
- Invited and Pending Acceptance memberships must not appear as active workspace options.
- Role assignments are effective only when membership is Active.
- Membership history must preserve inviter, activation, suspension, removal, and role-change audit context.
- A user may hold Active memberships in more than one organization, but only one active organization context is used per session/request.

## Invitation Lifecycle

The product lifecycle for invitations is:

```text
Created
  -> Sent
  -> Accepted
  -> Expired
  -> Cancelled
```

Accepted, Expired, and Cancelled are terminal states for the invitation record.

| State | Meaning | Membership relationship | Allowed transitions |
|---|---|---|---|
| Created | Admin created an invitation request but delivery has not been confirmed. | Membership may be Invited or no membership may exist yet. | Sent, Cancelled |
| Sent | Invitation was delivered or made available to the invitee. | Membership should be Invited or Pending Acceptance. | Accepted, Expired, Cancelled |
| Accepted | Invitee completed acceptance. | Membership becomes Active and roles become effective. | None |
| Expired | Invitation was not accepted before expiration. | Membership remains non-active or is marked inactive/expired by mapping. | None |
| Cancelled | An authorized administrator revoked the invitation before acceptance. | Membership remains non-active or is cancelled/removed by mapping. | None |

### Invitation Record Decision

The audit found no dedicated invitation table. PCP-1.2 should preserve two implementation options for the next planning step:

| Option | When sufficient | Constraint |
|---|---|---|
| Use `organization_memberships.status = 'invited'` as the invitation record | Internal-only invite flows where invitee already has an account and no secure email token is needed | Cannot safely support token expiration, resend, or pre-account acceptance without extra metadata |
| Add a narrow invitation-token record | Email-based invitations, pre-account invitations, secure acceptance links, resend, expiry, cancellation, and audit-grade invitation state | Must not replace `organization_memberships` as the membership source of truth |

Product recommendation: use `organization_memberships` as the membership source of truth and add only the minimum invitation-token persistence required for secure acceptance, expiration, resend, and cancellation if implementation needs email-link invitations.

## Supported Operations

| Operation | Actor | Result | Required authorization |
|---|---|---|---|
| Invite member | Owner or Administrator; role-specific limits may apply | Invitation Created/Sent; membership Invited or staged | Active membership with manage-members permission |
| Accept invitation | Invitee | Membership Active; roles effective; active org may be set after validation | Valid invitation token/session and matching invitee identity |
| Reject invitation | Invitee | Invitation Cancelled/Rejected; membership non-active | Valid invitee identity or token |
| Resend invitation | Owner or Administrator | Invitation Sent with new delivery event/token if needed | Manage-members permission |
| Remove member | Owner or Administrator | Membership Removed; active org cleared if needed | Manage-members permission and ownership safeguards |
| Suspend member | Owner or Administrator | Membership Suspended; workspace access disabled | Manage-members permission |
| Reactivate member | Owner or Administrator | Membership Active | Manage-members permission and valid organization state |
| Change role | Owner or Administrator | `membership_roles` updated | Manage-roles permission; cannot self-escalate beyond own authority |
| Transfer ownership | Current Owner, Kadarn governed admin, or controlled recovery path | New Owner assigned; prior owner retained, downgraded, suspended, or removed according to request | Owner-transfer permission plus safeguards |

### Operation Details

#### Invite Member

Inviting a member should collect:

- Organization id.
- Invitee email.
- Intended product role.
- Optional title/department.
- Optional message.
- Expiration policy.

The operation must:

- Validate inviter has an Active membership in the organization.
- Validate inviter has permission to invite and assign the requested role.
- Prevent duplicate active membership.
- Prevent duplicate open invitation for the same organization and email.
- Stage or assign intended roles only through the canonical role model.
- Emit audit for invitation creation and delivery.

#### Accept Invitation

Accepting an invitation must:

- Validate token or invite context.
- Validate invite is not expired or cancelled.
- Bind the invite to the correct authenticated user or create/complete account acceptance in a governed flow.
- Activate membership.
- Apply intended `membership_roles`.
- Set `joined_at`.
- Allow active organization selection through the validated active-org path.
- Emit audit for invitation acceptance and membership activation.

#### Reject Invitation

Rejecting an invitation must:

- Validate invitee identity or token.
- Mark invitation terminal.
- Keep membership non-active.
- Preserve audit history.
- Avoid disclosing whether an email address has an account beyond what the invitee is authorized to know.

#### Resend Invitation

Resending an invitation must:

- Keep the same invitation intent unless an authorized role change is explicitly requested.
- Rotate or reissue token if token-based invitations are used.
- Preserve prior delivery history.
- Respect rate limits and abuse controls.
- Emit audit.

#### Remove Member

Removing a member must:

- Mark membership Removed rather than physically deleting it by default.
- Make all roles ineffective.
- Clear active organization metadata if the removed member had that organization selected.
- Prevent removal of the last active owner.
- Prevent self-removal when it would orphan the organization.
- Emit audit.

#### Suspend Member

Suspending a member must:

- Disable workspace access immediately.
- Preserve roles for historical and reactivation purposes.
- Clear or invalidate active org for that user.
- Record reason and actor.
- Emit audit.

#### Reactivate Member

Reactivating a member must:

- Require the organization to be eligible for active access.
- Restore membership access.
- Preserve or reassign roles according to governance rules.
- Emit audit.

#### Change Role

Changing role must:

- Update `membership_roles`, not a flat membership role field.
- Prevent self-escalation.
- Prevent downgrading/removing the last owner.
- Preserve old role and new role in audit.
- Recompute workspace profile/navigation on next request.

#### Transfer Ownership

Transferring ownership must:

- Require the target user to have or accept an Active membership.
- Ensure the target can administer the organization.
- Assign Owner role to the target before removing or downgrading the current owner.
- Preserve at least one Active Owner at all times.
- Emit a dedicated ownership-transfer audit event.
- Support Kadarn-governed recovery for orphaned organizations.

## Role Model

Product roles are audience-facing names. Persistence should map those names to organization role keys and assign them through `membership_roles`.

### Role Families

| Family | Purpose |
|---|---|
| Ownership | Legal/accountable control over organization membership and critical settings. |
| Administration | Day-to-day management of members, profile, settings, and capabilities within limits. |
| Operations | Actor-specific operational work. |
| Finance | Billing, payment, and finance views where enabled. |
| Compliance | Regulatory, audit, privacy, and governed review work. |
| Read Only | Visibility without mutation. |
| Platform | Kadarn internal operations and governance. |

## Supported Organization Roles

### Institution Roles

| Role | Product purpose |
|---|---|
| Owner | Accountable owner for institution membership, ownership transfer, and critical settings. |
| Administrator | Manages institution users, profile, capabilities, and workspace settings. |
| Principal Investigator | Oversees study/site research activity and evidence readiness. |
| Coordinator | Coordinates operational workflows, collections, requests, and site tasks. |
| Regulatory | Manages regulatory, compliance, consent, and documentation workflows. |
| Finance | Manages institution billing/payment surfaces when enabled. |
| Laboratory | Manages lab, processing, QC, inventory, and specimen-related surfaces where enabled. |
| Recruiter | Manages recruitment/readiness surfaces where enabled. |
| Read Only | Views permitted institution workspace data without mutation. |

### Sponsor Roles

| Role | Product purpose |
|---|---|
| Owner | Accountable owner for sponsor organization, portfolio governance, and membership authority. |
| Administrator | Manages sponsor users, settings, roles, and capabilities. |
| Study Manager | Manages studies/programs and operational study context. |
| Feasibility Manager | Manages feasibility, search, and institution evaluation workflows. |
| Portfolio Manager | Manages sponsor portfolio scope and institution review workflows. |
| Finance | Manages sponsor finance/payment surfaces when enabled. |
| Read Only | Views permitted sponsor workspace and portfolio data without mutation. |

### Network Roles

| Role | Product purpose |
|---|---|
| Owner | Accountable owner for network organization and membership authority. |
| Administrator | Manages network users, profile, roles, and settings. |
| Site Manager | Manages network site coordination and site-facing workflows. |
| Compliance | Manages compliance, governance, and audit-facing workflows. |

### Vendor Roles

| Role | Product purpose |
|---|---|
| Owner | Accountable owner for vendor organization and membership authority. |
| Administrator | Manages vendor users, settings, and roles. |
| Operations | Manages contribution, confirmation, logistics, technology, or lab-operation workflows where enabled. |

### CRO Roles

| Role | Product purpose |
|---|---|
| Owner | Accountable owner for CRO organization and membership authority. |
| Administrator | Manages CRO users, settings, roles, and capabilities. |
| CRA | Manages clinical research associate workflows, site coordination, and study operations. |
| Portfolio Manager | Manages CRO portfolio/site/program coordination workflows where enabled. |

### Kadarn Platform Roles

Kadarn Platform roles are internal roles. They must not be exposed through public organization registration or normal customer invitation flows.

| Role | Product purpose |
|---|---|
| Super Admin | Controlled bootstrap/recovery role for platform-level authority. |
| Platform Admin | Administers platform configuration, internal users, and governed operations. |
| Operations | Operates KOC workflows, platform health, exceptions, and operational oversight. |
| Customer Success | Supports customer onboarding, workspace readiness, and account coordination. |
| Evidence Reviewer | Reviews evidence, claims, provenance, and publication readiness. |
| Marketplace Operations | Governs marketplace listings, requests, visibility, and marketplace operations. |
| Compliance | Reviews compliance, audit, privacy, regulatory, and governance controls. |
| Support | Handles support workflows with scoped, audited access. |
| Finance | Handles billing, payments, invoicing, and finance operations. |
| Product | Observes product workflows, feedback, and readiness with scoped access. |

## Permission Model

Permissions are product capabilities resolved from:

```text
auth user
  -> active organization membership
  -> membership_roles
  -> organization capabilities
  -> route/RLS/policy checks
  -> visibility/projection filters
```

### Permission Categories

| Permission | Meaning |
|---|---|
| View organization | See organization profile and membership-visible workspace context. |
| Manage organization profile | Edit organization details and workspace settings. |
| View members | See organization membership list and statuses. |
| Invite members | Invite new members. |
| Manage members | Suspend, reactivate, remove, or update non-owner members. |
| Manage roles | Assign, change, or remove roles within allowed scope. |
| Transfer ownership | Transfer Owner role under safeguards. |
| Manage capabilities | Assign or update organization capabilities. |
| View audit | View membership and organization audit events within permitted scope. |
| Manage billing | Access finance/payment surfaces when enabled. |
| Manage compliance | Access compliance/regulatory/audit surfaces. |
| Manage portfolio | Manage sponsor/network/CRO portfolio scopes where implemented. |
| Manage operations | Access actor-specific operational actions. |
| Read only | View permitted resources without mutation. |

### Baseline Role Permission Matrix

| Product role | Baseline permissions |
|---|---|
| Owner | All organization administration permissions, ownership transfer, member/role management, critical settings. |
| Administrator | Manage profile, members, non-owner roles, capabilities, and workspace settings within governance limits. |
| Read Only | View permitted workspace resources only. |
| Finance | View/manage billing and finance surfaces only where enabled. |
| Compliance / Regulatory | View/manage compliance, audit, consent, regulatory, and review workflows where enabled. |
| Operations roles | Manage actor-specific workflows allowed by organization capabilities. |
| Platform roles | Governed internal access by platform role, policy, and audit scope. |

### Actor-Specific Permission Notes

- Institution operational roles must not imply sponsor-facing publication.
- Sponsor portfolio roles must not imply access to institutions outside approved sponsor portfolio membership.
- Network and CRO roles must not imply ownership of member institutions.
- Vendor Operations must not imply access to institution private evidence unless separately authorized.
- Kadarn internal roles must be scoped and audited; support/product access should be least privilege.

## Ownership Safeguards

Ownership is a product role layered on top of the existing organization role model. It must provide stronger safeguards than generic administration.

Required safeguards:

- Every Active organization must have at least one Active Owner.
- Removing, suspending, or downgrading the last Active Owner is blocked.
- Ownership transfer assigns the new Owner before changing the old Owner.
- Self-downgrade is blocked if it would leave no Active Owner.
- Self-removal is blocked if it would orphan the organization.
- Owner changes require explicit confirmation and audit reason.
- Suspended organizations may restrict ownership changes except through governed recovery.
- Kadarn Platform recovery may restore ownership only through a privileged, audited internal workflow.
- Ownership does not bypass evidence, marketplace, passport, or portfolio authorization.

## Invitation Security

Invitations are security-sensitive because they grant organization access. PCP-1.2 should require:

- Invite tokens are single-use if token-based invitations are implemented.
- Tokens expire.
- Tokens are stored hashed or otherwise protected, not as reusable plaintext secrets.
- Resend rotates or reissues acceptance credentials.
- Cancelled and expired invitations cannot be accepted.
- Invitation acceptance binds to the invited email or a governed identity-linking flow.
- Invite acceptance must not leak whether arbitrary emails have existing accounts.
- Invitations are rate-limited per organization and inviter.
- Invitation creation, resend, acceptance, rejection, cancellation, expiration, and failed acceptance are auditable.
- Role requested at invite time is validated again at acceptance time.
- Suspended or archived organizations cannot send new invitations unless a governed exception allows it.
- Kadarn Platform roles cannot be invited through public or customer organization flows.

## Audit Requirements

Membership management follows "no audit = no action." Every state-changing operation must create an audit event.

### Required Audit Events

| Action | Resource | Required details |
|---|---|---|
| Invitation created | Invitation / organization membership | inviter, invitee email, organization, requested role, expiration |
| Invitation sent | Invitation | delivery channel, delivery attempt, correlation id |
| Invitation resent | Invitation | prior invitation, new expiration/token version, actor |
| Invitation accepted | Organization membership | invitee user id, membership id, organization, roles applied |
| Invitation rejected | Invitation | invitee identity if known, organization, reason if provided |
| Invitation expired | Invitation | expiration time, organization, invitee email hash/reference |
| Invitation cancelled | Invitation | actor, organization, reason |
| Member activated | Organization membership | actor, target user, organization |
| Member suspended | Organization membership | actor, target user, reason |
| Member reactivated | Organization membership | actor, target user, reason |
| Member removed | Organization membership | actor, target user, reason |
| Role changed | Membership roles | actor, target user, old roles, new roles |
| Ownership transferred | Membership roles / organization | previous owner, new owner, actor, reason |
| Active org changed | Organization | user, previous active org, new active org |

### Audit Data Rules

- Store actor, organization, target user or invitee reference, previous state, new state, reason, and correlation id.
- Avoid storing invitation token plaintext.
- Avoid exposing raw invitee email in broad audit views unless viewer is authorized.
- Keep audit immutable.
- Membership audit must be queryable for organization administrators and Kadarn governed internal roles.

## Governance Rules

### Organization State Rules

- Active organizations may invite, accept, suspend, remove, and manage roles.
- Pending or Under Review organizations may invite only if onboarding policy allows it.
- Suspended organizations cannot invite or reactivate members except through governed recovery.
- Archived organizations cannot invite, reactivate, or change roles except for audit/recovery workflows.

### Membership Governance Rules

- Only Active memberships can access workspace surfaces.
- Suspended members cannot accept role changes into access until reactivated.
- Removed members cannot access workspace surfaces.
- Invited and Pending Acceptance members cannot be selected as active organization.
- Membership status changes must preserve history.

### Role Governance Rules

- Product role names must map to canonical role keys.
- Role changes must be performed by an authorized member or governed internal operator.
- No user may self-escalate.
- No administrator may grant a role they are not permitted to manage.
- Owner role changes require ownership safeguards.
- Platform roles must be governed separately from customer organization roles.

### Multi-Organization Rules

- A user may be Active in multiple organizations.
- A session/request resolves exactly one active organization.
- Changing active organization must validate active membership server-side.
- Removing or suspending a membership must clear that organization as active context for the affected user.

### Default Lock Rules

Membership does not automatically enable:

- Marketplace publication.
- Sponsor Passport sharing.
- Public institution profiles.
- Evidence claim publication.
- External integrations.
- Payment or financial operations.
- Kadarn internal administration.

## Role Mapping Guidance

Implementation should map product roles to stable role keys. The following names are product-level requirements, not a mandate to create duplicate systems.

Example key style:

| Product role | Possible canonical key |
|---|---|
| Owner | `owner` |
| Administrator | `org_admin` |
| Read Only | `readonly` |
| Principal Investigator | `principal_investigator` |
| Study Manager | `study_manager` |
| Evidence Reviewer | `evidence_reviewer` |
| Platform Admin | `platform_admin` |

Existing system roles such as `org_admin`, `org_member`, `data_steward`, and `readonly` should be reused where they match the product meaning. New role keys should be added only when the existing role vocabulary cannot express the required permission bundle.

## Acceptance Criteria For Future Implementation

PCP-1.2 implementation is complete when:

- Invites can be created, sent, resent, accepted, rejected, expired, and cancelled.
- Memberships move through Invited, Pending Acceptance, Active, Suspended, and Removed states.
- Roles are assigned through `membership_roles`.
- Owner safeguards prevent orphaned organizations.
- Active org selection rejects non-active memberships.
- Multi-org users can select an organization through a validated flow.
- Every membership and role mutation emits audit.
- Existing organization, membership, role, active-org, workspace profile, and audit infrastructure is reused.
- No marketplace visibility or passport sharing is enabled as a side effect.

## Specification Conclusion

Kadarn's Membership Management model should complete the existing organization-first architecture rather than replace it. The product model is:

```text
First Owner provisions organization
  -> Owner/Admin invites member
  -> Invitation is sent and governed
  -> Invitee accepts
  -> Membership becomes Active
  -> Roles become effective through membership_roles
  -> User selects active organization
  -> Workspace profile resolves access
  -> Every change is audited
```

The next PCP-1.2 step should turn this specification into an implementation plan that decides the minimal persistence required for secure invitation tokens while preserving `organization_memberships` as the source of truth for access.
