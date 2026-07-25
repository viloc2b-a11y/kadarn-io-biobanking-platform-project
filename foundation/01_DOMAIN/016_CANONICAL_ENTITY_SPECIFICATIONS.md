# Canonical Entity Specifications — Foundation Domain

**Document:** foundation/01_DOMAIN/016_CANONICAL_ENTITY_SPECIFICATIONS.md
**Date:** 2026-07-24
**Version:** 1.0
**Status:** Active — Implementation Baseline
**Authority:** KEMS-003 (Product Constitution), KEMS-001 (Confidence Graph Model)

---

## Purpose

This document defines the fundamental entities of the KADARN domain model before any table is created, API is designed, or UI is built. It establishes the canonical specifications that every implementation artifact must satisfy.

These specifications govern KAD-002A through KAD-002G and all subsequent domain stories.

---

## Person

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | Represents a natural person who can act within the KADARN ecosystem |
| **Identity** | UUID (system), Email (human-readable unique), Name (display) |
| **Attributes** | first_name, last_name, middle_name, suffix, email, phone, ORCID (optional), NPI (optional), profile_photo (optional) |
| **Relationships** | Can be associated with zero or more Institutions (via memberships). Can perform zero or more Roles. Can be linked to Credentials, Claims (as created_by, reviewed_by), and Evidence. |
| **Constraints** | Email must be unique per person. A Person is not owned by any single Institution. A Person can be associated with multiple Institutions across different time periods. |
| **States** | active, inactive, suspended, merged |
| **Audit rules** | All Person changes must be tracked in audit_events. Merges must preserve the target Person's history. |
| **Versioning** | Person records are not versioned (identity is stable). Role assignments and Credentials are versioned separately. |
| **APIs expected** | POST /people, GET /people, GET /people/:id, PATCH /people/:id, DELETE /people/:id (soft), GET /people/:id/credentials, GET /people/:id/memberships |
| **Evidence association** | People can be linked as evidence creators (evidence_nodes.created_by_actor_id). People can be assigned to ReviewTasks. |

---

## Location

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | Represents a physical location belonging to an Institution |
| **Identity** | UUID (system), Name (institutional identifier) |
| **Attributes** | name, type (enum: clinic, laboratory, warehouse, phase1_unit, office, pharmacy, storage, other), address_line1, address_line2, city, state/province, postal_code, country, phone, timezone, latitude (optional), longitude (optional) |
| **Relationships** | Belongs to exactly one Institution (FK → organizations). Can contain Equipment, Capabilities, and Personnel assignments. Can be linked to Claims (as operational context). |
| **Constraints** | A Location must have a valid address. Location type must be from a controlled vocabulary. An Institution may have zero or more Locations. |
| **States** | active, inactive, under_maintenance, decommissioned |
| **Audit rules** | Location changes tracked in audit_events. Status transitions logged. |
| **Versioning** | Location records are not versioned. Status changes are tracked via audit. |
| **APIs expected** | POST /institutions/:id/locations, GET /institutions/:id/locations, GET /locations/:id, PATCH /locations/:id, DELETE /locations/:id (soft) |
| **Evidence association** | Locations can be referenced in evidence_context to indicate where an activity occurred. |

---

## Institution

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | Aggregate root of the KADARN domain. Owner of Capabilities, Passports, and Information Products. |
| **Identity** | UUID (system), Name (display), Slug (URL-safe unique identifier) |
| **Attributes** | name, legal_name, slug, tax_id (optional), institution_type (enum: site, lab, cro, sponsor, biobank, academic, hospital, network), country, region, email, phone, website, address, logo_url (optional), visibility_scope, status |
| **Relationships** | Owns zero or more Locations. Owns zero or more Capabilities (via Claims). Owns Passport entries. Publishes Information Products. Has zero or more People (via memberships). Has zero or more Credentials. |
| **Constraints** | Slug must be unique across all Institutions. Each Institution has exactly one active Passport. visibility_scope controls sponsor access. |
| **States** | active, inactive, onboarding, suspended |
| **Audit rules** | All Institution changes tracked. Status transitions logged. |
| **Versioning** | Institution records are not versioned. Claims, Evidence, and Passports are versioned independently. |
| **APIs expected** | POST /institutions, GET /institutions, GET /institutions/:slug, PATCH /institutions/:id, GET /institutions/:id/profile (full profile), GET /institutions/:id/passport, GET /public/:slug (public profile) |
| **Evidence association** | Institution is the owner of all Claims. Evidence is owned by the Institution via Claims. Passport is owned by the Institution. |

---

## Membership

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | Associates a Person with an Institution in a specific Role for a specific time period |
| **Identity** | UUID (system) |
| **Attributes** | person_id (FK → people), institution_id (FK → organizations), role_id (FK → roles), title (optional), department (optional), start_date, end_date (nullable), is_primary (boolean) |
| **Relationships** | Links Person to Institution. Links Person to Role. |
| **Constraints** | A Person may have multiple concurrent Memberships across Institutions. A Person may have at most one primary Membership per Institution. end_date must be after start_date. |
| **States** | active, expired, terminated |
| **Audit rules** | Membership changes tracked. Role changes logged. |
| **Versioning** | Memberships are not versioned — changes create a new record with effective dates. |
| **APIs expected** | POST /memberships, GET /people/:id/memberships, GET /institutions/:id/members, PATCH /memberships/:id, DELETE /memberships/:id |
| **Evidence association** | Memberships establish the authority context for who can create Claims and Evidence on behalf of an Institution. |

---

## Role

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | Defines what functions a Person can perform in the context of an Institution |
| **Identity** | UUID (system), Key (machine-readable unique) |
| **Attributes** | name, key, description, scope (enum: institution, system), permissions (JSONB) |
| **Relationships** | Can be assigned to People via Memberships. Can be used in RLS policies for authorization. |
| **Constraints** | Key must be unique. Roles are predefined by the system (not user-creatable in MVP). |
| **States** | active, deprecated |
| **Audit rules** | Role deprecation and permission changes tracked. |
| **Versioning** | Role schema is versioned via KEMS-005. Permission changes are logged. |
| **APIs expected** | GET /roles, GET /roles/:id (read-only in MVP) |
| **Evidence association** | Roles determine who can create Claims, review Evidence, publish Passports, and issue Share Grants. |

---

## Credential

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | Represents an institutional or individual credential as a structured asset |
| **Identity** | UUID (system) |
| **Attributes** | type (enum: license, certification, training, registration, permit), name, issuing_body, credential_id (optional), person_id (FK → people, nullable), institution_id (FK → organizations), issued_date, expiration_date (nullable), scope (optional), evidence_id (FK → evidence_nodes, nullable), confidence (confidence_level) |
| **Relationships** | Belongs to either a Person or an Institution. Can be linked to Evidence (supporting document). |
| **Constraints** | Must be associated with either a person_id or institution_id (one of the two). expiration_date may be null for credentials that do not expire. |
| **States** | active, expiring (computed: within 90 days of expiration), pending, expired, revoked, unknown |
| **Audit rules** | Credential creation, renewal, and revocation tracked in audit_events. |
| **Versioning** | Credentials are not versioned — renewals create new records with new expiration dates. |
| **APIs expected** | POST /credentials, GET /credentials, GET /credentials/:id, PATCH /credentials/:id, GET /people/:id/credentials, GET /institutions/:id/credentials |
| **Evidence association** | Credentials can be linked to Evidence (uploaded certificate PDF) for verification. Confidence in a credential is computed from evidence quality, issuer reputation, and freshness. |

---

## Capability

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | A verified institutional capability derived from Claims backed by Evidence |
| **Identity** | UUID (inherited from Claim) |
| **Attributes** | name, description, claim_id (FK → claims), confidence (computed), status (verified, declared, gap), domain, taxonomy_category |
| **Relationships** | Derived from Claims. Contains Evidence. Has Confidence score. Published via Passport. |
| **Constraints** | A Capability must have at least one Claim. A Claim may produce zero or one Capability. |
| **States** | declared → evidence_submitted → under_review → verified → published |
| **Audit rules** | State transitions tracked. Confidence changes logged. |
| **Versioning** | Capabilities are derived from Claims — they change when Claims or Evidence change. |
| **APIs expected** | GET /capabilities, GET /capabilities/:id, GET /institutions/:id/capabilities |
| **Evidence association** | Capability confidence is computed from the Evidence backing the related Claim. |

---

## Claim

*(Defined in KEMS-001, evidence-core — included here for completeness)*

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | An assertion about an institutional capability |
| **Identity** | UUID |
| **Attributes** | name, description, claim_type_id, organization_id, domain, status, workflow_state, valid_evidence_classes, required_evidence_classes, created_by |
| **Relationships** | Belongs to an Institution. Contains Evidence. Reviewed via workflow. Published via Passport. |
| **States** | draft → declared → pending_evidence → under_review → published → disputed, archived |
| **APIs expected** | CRUD at /api/v1/evidence-core/claims |

---

## Evidence

*(Defined in KEMS-001, evidence-core — included here for completeness)*

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | Verifiable support for a Claim |
| **Identity** | UUID |
| **Attributes** | evidence_class, content, source, node_date, weight, status, provenance, visibility |
| **Relationships** | Belongs to a Claim. Can be related to other Evidence. Can be linked to Credentials. |
| **States** | active, disputed, superseded, archived |
| **APIs expected** | CRUD at /api/v1/evidence-core/evidence |

---

## Passport

*(Defined in KEMS-001, implemented in migrations 061 — included here for completeness)*

| Attribute | Specification |
|-----------|---------------|
| **Responsibility** | Curated publication of institutional claims and evidence for sponsor evaluation |
| **Identity** | UUID (passport_entry_id), Claim-based (one passport per institution) |
| **Attributes** | publication_status, visibility_scope, published_by, published_at |
| **Relationships** | Contains Claims. Can be shared with Sponsors via Share Grants. |
| **States** | draft, published, restricted, withdrawn |

---

## Entity Relationship Summary

```
Person ──Membership── Institution
  │                      │
  │                      ├── Location
  │                      ├── Credential (institutional)
  │                      ├── Claim ──Evidence── Credential (linked)
  │                      │    │
  │                      │    └── Review Workflow
  │                      │
  │                      ├── Capability (derived from Claim + Evidence + Confidence)
  │                      ├── Passport (published from Capabilities)
  │                      │    └── Share Grant (to Sponsor)
  │                      └── Information Product (generated from Passport)
  │
  └── Credential (personal)
  └── Role (via Membership)
```

---

## Implementation Order

| Step | Story | Entity |
|------|-------|--------|
| 0 | KAD-001.5 | This document — Canonical Entity Specifications |
| 1 | KAD-002A | **Person** (table, types, basic CRUD) |
| 2 | KAD-002B | **Location** (table, types, basic CRUD) |
| 3 | KAD-002C | **Institution Relationships** (Membership, Role) |
| 4 | KAD-002D | **Repositories** (Repository pattern for all entities) |
| 5 | KAD-002E | **API** (Full REST API for Person, Location, Membership, Role) |
| 6 | KAD-002F | **UI** (Management views for all entities) |
| 7 | KAD-002G | **Validation** (Integration tests, E2E tests, authorization tests) |

---

## Change Management

This document is governed by the KADARN Foundation Library. Any change to the canonical entity specifications must be:

1. Proposed as an ADR
2. Reviewed against KEMS-003 (Product Constitution)
3. Approved by the Project Owner
4. Reflected in all downstream artifacts (migrations, types, APIs, UI)
