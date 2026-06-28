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

## Gaps

| Entity | Reason |
|---|---|
| Users & Memberships | Require `auth.users` (Supabase Auth). Create via Auth API first. |
| Capabilities | Require `organization_capability_types` to exist in target DB. |

## Next Steps

1. Create auth users for pilot organizations
2. Insert memberships
3. Assign capabilities
4. Run SIT-01 gate tests
