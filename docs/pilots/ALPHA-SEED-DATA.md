# ALPHA-PILOT-01 — Production Seed Environment

**Status:** ✅ Complete  
**Date:** 2026-06-28  
**Tag:** v1.0.0-alpha  

---

## Seed Data Created

| Entity | Count | Details |
|---|---|---|
| Organizations | 6 | Kadarn Demo, Lyon Biobank, Lyon Hospital, Geneva Pharma, Eurofins Lab, Global Courier |
| Programs | 2 | BREAST-2026 (active), LUNG-2026 (draft) |
| Collections | 2 | Retrospective FFPE cohort (500), Prospective surgical (200) |
| Supply items | 2 | Breast cancer TMA, Serum biobank |
| Exchange requests | 1 | FFPE blocks for BREAST-2026 |
| Exchange deals | 1 | FFPE cores supply (45,000 EUR) |
| Escrow | 1 | Pending settlement |
| Shipments | 2 | FFPE batch (delivered), Serum batch (in transit) |
| Processing samples | 1 | Breast cancer FFPE specimen |
| QC records | 2 | 1 pass, 1 fail |
| Provenance nodes | 2 | Biobank organization, Specimen |
| Provenance edges | 1 | derived_from (specimen → biobank) |
| Provenance evidence | 1 | Pathology report |
| Audit events | 4 | Org creation, Request submission, Shipment, QC |

## How to Run

```bash
# Local Supabase
docker exec -i supabase_db_kadarn-platform psql -U postgres -d postgres \
  < scripts/seed-pilot.sql

# Or via connection string
psql "$DATABASE_URL" -f scripts/seed-pilot.sql
```

## Idempotency

All inserts use `ON CONFLICT DO NOTHING`. Safe to run multiple times.

## Users & Memberships — Bootstrap

Run the identity bootstrap script AFTER the seed data:

```bash
cd kadarn-platform

# 1. Set the service role key
export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# 2. (Optional) Set individual passwords. If not set, random ones are generated.
export PILOT_PASSWORD_BIOBANK_ADMIN=MySecurePass1
export PILOT_PASSWORD_SPONSOR_PM=MySecurePass2

# 3. Run bootstrap
npx tsx scripts/seed-pilot-users.ts
```

This creates 7 pilot users with:
- Supabase Auth accounts (email confirmed)
- User profiles with full names
- Organization memberships (active)
- Role assignments (org_admin / member / platform_admin)

**Idempotent:** Safe to run multiple times. Existing users are skipped.

## Full Bootstrap Sequence

```bash
# Step 1: Seed data (organizations, programs, collections, etc.)
docker exec -i supabase_db_kadarn-platform psql -U postgres -d postgres \
  < scripts/seed-pilot.sql

# Step 2: Create auth users and memberships
export SUPABASE_SERVICE_ROLE_KEY=<key>
npx tsx scripts/seed-pilot-users.ts

# Step 3: Run verification
npm test
bash scripts/check-secrets.sh
```

## Gaps

| Entity | Reason |
|---|---|
| Capabilities | Require `organization_capability_types` to exist in target DB. |
