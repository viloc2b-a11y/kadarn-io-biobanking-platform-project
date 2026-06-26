# ADR-002: Multi-Tenant Architecture & Organization Model

**Status:** Accepted  
**Date:** 2026-06-25  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn is a multi-organization biospecimen infrastructure platform.
Multiple actors (sponsors, CROs, biobanks, clinical sites, laboratories,
couriers, IRBs) collaborate on shared programs. The platform must support
cross-organization data sharing within programs while enforcing isolation
between unrelated organizations.

---

## Decision: Shared Database + RLS

**Do not use database-per-tenant or schema-per-tenant.**

Kadarn uses a **shared PostgreSQL database with Row-Level Security (RLS)**.

### Rationale

Kadarn requires that multiple actors interact within the same program:

```
Sponsor  →  CRO  →  Site  →  Biobank  →  Lab  →  Courier  →  IRB
```

With per-tenant databases, cross-tenant programs become extremely complex
(federated queries, linked servers, data replication). With RLS, program
participants see only what they should, within the same database.

### Model

```
organizations
organization_memberships
organization_capabilities
programs
program_participants
access_policies
resource_permissions
audit_events
```

Every sensitive table must have:

- `organization_id` — owning organization
- `created_by` — user who created the row
- `visibility_scope` — who can see this: organization | program | network | public

RLS policies enforce access at the row level using these columns +
program participation + organization membership.

---

## Decision: Organization-Capability Model

**Do not use a single `organization.type` enum.**

An organization can have multiple capabilities:

```
ABC Research Network
  ├── sponsor
  ├── cro
  ├── biobank
  ├── clinical_site
  ├── processing_lab
  ├── storage_facility
  ├── logistics_vendor
  ├── irb
  └── regulatory_body
```

### Model

```sql
organizations              → legal entity (name, tax_id, country, etc.)
organization_capabilities  → what this org can do within Kadarn
organization_capability_types → controlled vocabulary
```

This avoids forcing a hospital that also operates a biobank to choose
one identity.

---

## Decision: Supabase Auth + OIDC-ready abstraction

Start with Supabase Auth (email/password, magic link, Google OAuth).
But keep the Kadarn identity domain separate from Supabase Auth.

### Model

```sql
identity_providers          → supabase, azure_ad, okta, keycloak
user_profiles               → kadarn users (linked to identity provider accounts)
organization_memberships    → which orgs a user belongs to
organization_roles          → which role within each org
external_identity_links     → SSO provider user IDs
```

This allows Kadarn to start with Supabase Auth and later support
Azure AD, Okta, Auth0, Keycloak, or enterprise SSO without changing
the domain model.

---

## Decision: Audit Trail from Sprint 0

Every major action must emit an audit event.

```sql
audit_events
  id, organization_id, actor_id, action, resource_type,
  resource_id, details (JSONB), ip_address, user_agent, created_at
```

No exceptions. If there is no audit trail for an action, the action
should not exist.

---

## Consequences

| Positive | Negative |
|----------|----------|
| Cross-organization programs are natural | RLS policies must be carefully designed and tested |
| Audit trail is unified across all tenants | Cannot easily physically isolate tenants |
| Organization-capability model is flexible | More complex than a simple `type` enum |
| One codebase, one deployment | RLS performance must be monitored at scale |

---

## Compliance

This ADR implements decisions from:

- **Tenant isolation**: shared DB + RLS
- **SSO/OIDC**: Supabase Auth initially, OIDC-ready abstraction
- **Organization model**: capabilities, not rigid types
- **Repository**: clean `kadarn-platform`, no Vilo OS code
- **Review gates**: migration review, RLS review, domain review, smoke test
