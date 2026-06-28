# Kadarn First Biobank Pilot — Operational Runbook

**Document:** ALPHA-PILOT-02  
**Status:** Final  
**Version:** 1.0  
**Platform:** Kadarn v1.0.0-alpha  
**Date:** 2026-06-28  

---

## 1. Overview

This runbook describes how to execute the first operational pilot of the Kadarn platform with a real biobank partner.

The pilot validates that a complete biospecimen request lifecycle works end-to-end:
discovery → request → agreement → collection → shipment → QC → settlement.

**No developer assistance required.** Follow the steps below in order.

---

## 2. System Prerequisites

### Required Software

| Component | Version | Required By |
|---|---|---|
| Web browser | Chrome 120+ / Firefox 120+ | All users |
| Kadarn API | v1.0.0-alpha | Platform |
| Kadarn Web UI | v1.0.0-alpha | End users |
| Supabase | 2.108.0+ | Operations |
| Docker Desktop | 4.30+ | Operations (local only) |

### Required Access

| System | URL / Connection | Access Type |
|---|---|---|
| Kadarn API | `https://api.kadarn-demo.io` | HTTPS |
| Kadarn Web UI | `https://app.kadarn-demo.io` | Browser |
| Supabase Studio | `https://supabase.kadarn-demo.io` | Admin only |
| Supabase Database | `postgresql://user:pass@host:port/db` | Admin only |

### Required Environment Variables

| Variable | Set In | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Web + API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Web + API |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (server only) | Admin operations |
| `DATABASE_URL` | Operations environment | Direct DB access |

---

## 3. Required Users

### User Roles

| Role | Responsibility | Permissions |
|---|---|---|
| **Platform Admin** | System oversight, monitoring | Admin access to all modules |
| **Biobank Admin** | Manages biobank inventory, supply items | Org admin for biobank org |
| **Biobank Coordinator** | Processes requests, prepares shipments | Org member |
| **Hospital Coordinator** | Manages collections | Org admin for hospital org |
| **Research Sponsor PM** | Creates programs, initiates requests | Org admin for sponsor org |
| **Research Scientist** | Reviews data, defines requirements | Org member |

### Placeholder Credentials

| Email | Role | Organization |
|---|---|---|
| `admin@kadarn-demo.io` | Platform Admin | Kadarn Demo Network |
| `admin@lyon-biobank.fr` | Biobank Admin | Lyon Translational Biobank |
| `coordinator@lyon-biobank.fr` | Biobank Coordinator | Lyon Translational Biobank |
| `coordinator@chu-lyon.fr` | Hospital Coordinator | Lyon-Sud Hospital |
| `pm@grp-pharma.ch` | Research Sponsor PM | Geneva Research Pharma AG |
| `scientist@grp-pharma.ch` | Research Scientist | Geneva Research Pharma AG |

**Password:** Replace with generated passwords at user creation time.

### User Creation Procedure

Run the automated bootstrap script:

```bash
cd kadarn-platform
export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
npx tsx scripts/seed-pilot-users.ts
```

This creates all 7 users, profiles, and memberships in one command.
See `docs/pilots/ALPHA-SEED-DATA.md` for details.

### Manual Alternative

```bash
# For each user, run:
supabase auth create-user \
  --email <email> \
  --password <generated-password>

# Then create their profile:
INSERT INTO user_profiles (id, email, full_name)
SELECT id, email, '<Full Name>'
FROM auth.users WHERE email = '<email>';

# Then assign organization membership:
INSERT INTO organization_memberships (organization_id, user_id, status, invited_by, invited_at, joined_at)
SELECT '<org-uuid>', id, 'active', id, now(), now()
FROM auth.users WHERE email = '<email>';
```

---

## 4. Organizations

### Pre-seeded Organizations

| Name | ID (UUID) | Country | Type |
|---|---|---|---|
| Kadarn Demo Network | `a1000000-...0001` | CH | Platform |
| Lyon Translational Biobank | `a1000000-...0010` | FR | Biobank |
| Centre Hospitalier Lyon-Sud | `a1000000-...0020` | FR | Hospital |
| Geneva Research Pharma AG | `a1000000-...0030` | CH | Sponsor |
| Eurofins Central Laboratory | `a1000000-...0040` | DE | Lab |
| Global Cryo Logistics | `a1000000-...0050` | NL | Courier |

### Organization Details (for reference)

| Field | Lyon Biobank | Lyon Hospital | Geneva Pharma |
|---|---|---|---|
| Legal name | Hospices Civils de Lyon - Biobanque | Hospices Civils de Lyon | Geneva Research Pharma AG |
| Tax ID | FR-123456789 | FR-987654321 | CHE-123.456.789 |
| City | Lyon | Pierre-Benite | Geneva |
| Certifications | ISO-20387, NF-S96-900 | — | — |

---

## 5. Pilot Workflow

### Phase 1 — Setup (Day 1)

```text
Step 1.1: Platform Admin deploys the system
  Action:  Verify API and web UI are reachable
  Check:   https://api.kadarn-demo.io/health → {"status":"ok"}
  Owner:   Platform Admin

Step 1.2: Create user accounts (see Section 3)
  Action:  Create auth users + assign memberships
  Check:   Users can log in at https://app.kadarn-demo.io
  Owner:   Platform Admin

Step 1.3: Assign organization capabilities
  Action:  POST /api/v1/organizations/:id/capabilities
           Lyon Biobank: tumor_biobank, ffpe_storage, frozen_storage, dna_extraction
           Lyon Hospital: patient_recruitment, surgical_collection
  Owner:   Biobank Admin, Hospital Coordinator
```

### Phase 2 — Discovery (Day 1-2)

```text
Step 2.1: Sponsor PM browses available biospecimens
  Action:  GET /api/v1/marketplace/specimens?q=breast+cancer
  Output:  List of available supply items from Lyon Biobank
  Evidence: Screenshot of search results

Step 2.2: Sponsor PM runs feasibility assessment
  Action:  POST /api/feasibility
  Payload: {
    "program_name": "BREAST-2026",
    "required_sample_types": ["FFPE"],
    "required_capabilities": ["tumor_biobank", "dna_extraction"],
    "target_countries": ["FR"]
  }
  Output:  Feasibility scores per organization
  Evidence: Score results
```

### Phase 3 — Request & Agreement (Day 2-5)

```text
Step 3.1: Sponsor PM submits access request
  Action:  POST /api/exchange
  Payload: {
    "title": "FFPE blocks for BREAST-2026 biomarker validation",
    "target_org_ids": ["<biobank-uuid>"],
    "requested_sample_count": 200,
    "program_id": "<program-uuid>"
  }
  Output:  Exchange request created (status: submitted)
  Evidence: Request ID

Step 3.2: Biobank Admin reviews and approves
  Action:  PATCH /api/v1/marketplace/requests
  Payload: {
    "request_id": "<request-id>",
    "action": "approve",
    "reason": "Valid research purpose — IRB approved"
  }
  Output:  Status changes to negotiation
  Evidence: Approval confirmation

Step 3.3: Create exchange deal + escrow
  Action:  POST /api/v1/exchange/deals
  Payload: {
    "request_id": "<request-id>",
    "sponsor_org_id": "<sponsor-uuid>",
    "provider_org_id": "<biobank-uuid>",
    "title": "FFPE cores supply for BREAST-2026",
    "total_value": 45000,
    "currency": "EUR",
    "sample_count_expected": 200
  }
  Output:  Deal created (status: pending_acceptance) + escrow
  Evidence: Deal ID, escrow ID
```

### Phase 4 — Collection & QC (Day 5-15)

```text
Step 4.1: Hospital Coordinator collects specimens
  Action:  POST /api/v1/collections
  Payload: {
    "organization_id": "<hospital-uuid>",
    "name": "BREAST-2026 prospective surgical collection",
    "target_enrollment": 200,
    "program_id": "<program-uuid>"
  }
  Output:  Collection twin created
  Evidence: Collection ID

Step 4.2: Biobank processes samples and records QC
  Action:  PATCH /api/v1/processing/aliquots/:id/qc
  Payload: {
    "qc_status": "pass",
    "notes": "DNA concentration 45.2 ng/uL — within spec"
  }
  Output:  QC status updated
  Evidence: QC result
```

### Phase 5 — Logistics (Day 10-20)

```text
Step 5.1: Biobank Coordinator creates shipment
  Action:  POST /api/v1/shipments
  Payload: {
    "organization_id": "<biobank-uuid>",
    "program_id": "<program-uuid>",
    "carrier": "fedex",
    "origin_address": "Lyon Biobank, France",
    "destination_address": "Eurofins Munich, Germany",
    "temperature_requirements": "dry_ice_box"
  }
  Output:  Shipment created (status: pending)
  Evidence: Shipment ID, tracking number

Step 5.2: Update shipment status on delivery
  Action:  PATCH /api/v1/shipments/:id
  Payload: {"status": "delivered", "actual_delivery": "2026-07-01"}
  Output:  Status updated
  Evidence: Delivery confirmation
```

### Phase 6 — Settlement (Day 20-30)

```text
Step 6.1: Create settlement
  Action:  POST /api/v1/financial/settlements
  Payload: {
    "deal_id": "<deal-uuid>",
    "total_amount": 45000,
    "currency": "EUR"
  }
  Output:  Settlement created (status: pending)
  Evidence: Settlement ID

Step 6.2: Release payment
  Action:  PATCH /api/v1/financial/settlements/:id
  Payload: {"status": "released"}
  Output:  Settlement status updated
  Evidence: Release confirmation
```

### Phase 7 — Verification (Day 30)

```text
Step 7.1: Verify provenance records
  Action:  GET /api/v1/operations/provenance?domain=exchange
  Output:  Complete provenance chain for the request
  Evidence: Provenance graph

Step 7.2: Run integration gate
  Action:  npm run sit-01-gate  (see SIT-01)
  Output:  38/38 tests passing
  Evidence: Test report

Step 7.3: Collect platform metrics
  Action:  GET /api/v1/koc/analytics
  Output:  Program stats, fulfillment rate, enrollment
  Evidence: Analytics dashboard
```

---

## 6. Expected Outputs

### By Phase

| Phase | Output | Format |
|---|---|---|
| Setup | Verified user login + org capabilities | Screenshot |
| Discovery | Feasibility scores for target orgs | JSON |
| Request | Exchange request ID | UUID |
| Agreement | Deal ID + escrow ID | UUID |
| Collection | Collection twin ID | UUID |
| QC | QC status record | JSON |
| Logistics | Shipment ID + tracking status | UUID + string |
| Settlement | Settlement confirmation | JSON |
| Verification | Full provenance chain + analytics | JSON |

### Key Metrics to Record

| Metric | Target | How to Measure |
|---|---|---|
| Time from request to deal | < 5 business days | Calendar dates |
| QC pass rate | > 80% | aliquots passed / total |
| Shipment delivery time | < 10 business days | Shipment dates |
| Settlement completion | 100% of deals | Settlement status |
| API uptime | > 99% | Health endpoint |
| Test pass rate | 100% | `npm test` + SIT-01 |

---

## 7. Success Criteria

All of the following must be true:

- [ ] **Phase 1**: All 6 organizations are visible in the platform
- [ ] **Phase 2**: Feasibility assessment returns scores for at least 2 organizations
- [ ] **Phase 3**: Exchange request transitions through all states (submitted → approved → deal)
- [ ] **Phase 4**: At least 1 QC record with status "pass"
- [ ] **Phase 5**: Shipment reaches "delivered" status
- [ ] **Phase 6**: Settlement reaches "completed" status
- [ ] **Phase 7**: Provenance graph contains the complete chain
- [ ] **Overall**: All 385 automated tests pass
- [ ] **Overall**: SIT-01 gate passes (38/38)

---

## 8. Failure Criteria

The pilot fails if any of the following occur:

- [ ] **Data loss**: Any user data is lost or corrupted
- [ ] **Security breach**: Unauthorized access to another organization's data
- [ ] **RLS bypass**: Multi-tenant isolation is violated
- [ ] **Provenance mutation**: Append-only invariant is broken
- [ ] **API unavailability**: System is down for more than 4 consecutive hours
- [ ] **Blocking bug**: A critical bug prevents completion of Phase 3 or beyond

---

## 9. Recovery Procedures

### User Cannot Log In

```text
1. Verify user exists in Supabase Auth:
   SELECT id, email FROM auth.users WHERE email = '<email>';

2. If user missing, create them:
   supabase auth create-user --email <email> --password <new-password>

3. If user exists but can't access org:
   SELECT * FROM organization_memberships
   WHERE organization_id = '<org-uuid>' AND user_id = '<user-uuid>';

4. Re-insert membership if missing:
   INSERT INTO organization_memberships (...)
```

### API Returns 500 Error

```text
1. Check API logs:
   docker logs kadarn-api --tail 100

2. Verify Supabase connection:
   curl -s http://127.0.0.1:54321/rest/v1/ -H "apikey: $ANON_KEY"

3. Restart API if needed:
   docker restart kadarn-api

4. If database issue:
   docker exec -it supabase_db_kadarn-platform psql -U postgres -d postgres
   SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
```

### Shipment Lost or Damaged

```text
1. Update shipment status to "lost":
   PATCH /api/v1/shipments/:id {"status": "lost"}

2. Provenance automatically records the correction (wasRevisionOf)

3. Notify affected parties (Sponsor PM, Biobank Coordinator)

4. Initiate replacement shipment if needed
```

### QC Failure

```text
1. Record failed QC:
   PATCH /api/v1/processing/aliquots/:id/qc {"qc_status": "fail"}

2. Assess impact: is the entire sample unusable or just this aliquot?

3. If aliquot only: re-process from remaining sample material

4. If sample destroyed: flag in provenance and notify requestor
```

### Settlement Error

```text
1. Verify escrow record exists:
   SELECT * FROM exchange_escrow WHERE deal_id = '<deal-id>';

2. If escrow missing, create manually:
   INSERT INTO exchange_escrow (deal_id, total_amount, ...)

3. If status is stuck:
   PATCH /api/v1/financial/settlements/:id {"status": "cancelled"}
   Then re-initiate: POST /api/v1/financial/settlements
```

---

## 10. Rollback Procedures

### Rollback a Single Transaction

```text
1. Reverse provenance:
   The correction pattern (wasRevisionOf) preserves history.
   No data is deleted. A new correction node is appended.

2. Reverse settlement:
   PATCH /api/v1/financial/settlements/:id {"status": "refunded"}

3. Update deal status:
   PATCH is not available for deals directly.
   Use the approval endpoint to flag the deal.
```

### Full Pilot Rollback

```text
⚠️ Full rollback should only be performed if the failure criteria
in Section 8 are met. Otherwise, fix forward.

1. Export current data for audit:
   supabase db dump -f pilot-audit.sql

2. Notify all participants.

3. Reset local database:
   supabase db reset

4. Re-apply migrations:
   supabase db push

5. Re-seed pilot data:
   psql -f scripts/seed-pilot.sql

6. Verify:
   npm test
   bash scripts/check-secrets.sh
```

---

## 11. Pilot Metrics

### Operational Metrics

| Metric | Collection Method |
|---|---|
| API response time | `withTracing` spans logged to stdout |
| Test pass rate | `npm test` output |
| Uptime | Health endpoint monitoring |
| Error rate | API error log count |
| Settlement time | Escrow created_at → released_at |

### Business Metrics

| Metric | Target | Measurement |
|---|---|---|
| Organizations onboarded | 4+ active | Count from DB |
| Exchange requests | 1+ completed | Status tracking |
| Deals created | 1+ | Exchange deals table |
| Shipments delivered | 1+ | Logistics status |
| QC pass rate | > 80% | Aliquots pass/total |
| Settlement completed | 1 | Escrow status |

---

## 12. Timing

| Phase | Duration | Calendar Time |
|---|---|---|
| Setup | 1 day | Day 1 |
| Discovery | 1 day | Day 1-2 |
| Request & Agreement | 3 days | Day 2-5 |
| Collection & QC | 10 days | Day 5-15 |
| Logistics | 5 days | Day 10-20 |
| Settlement | 10 days | Day 20-30 |
| Verification | 1 day | Day 30 |
| **Total** | **30 days** | **Day 1-30** |

---

## 13. Responsibilities

| Role | Organization | Phases |
|---|---|---|
| Platform Admin | Kadarn Demo Network | 1, 7 |
| Biobank Admin | Lyon Translational Biobank | 3, 4, 5 |
| Biobank Coordinator | Lyon Translational Biobank | 4, 5 |
| Hospital Coordinator | Lyon-Sud Hospital | 4 |
| Research Sponsor PM | Geneva Research Pharma AG | 2, 3, 6 |
| Research Scientist | Geneva Research Pharma AG | 2, 7 |

---

## 14. Deliverables

At pilot completion, produce:

- [ ] **Pilot Report**: `docs/pilots/PILOT-REPORT-001.md`
- [ ] **Metrics Dashboard**: Screenshots of analytics
- [ ] **Provenance Chain**: Export of provenance graph
- [ ] **Test Results**: `npm test` + SIT-01 output
- [ ] **Issue Log**: Every issue encountered with workaround
- [ ] **Feedback Document**: User feedback from each role
- [ ] **Recommendation**: Go/no-go for v1.0.0-beta

---

## 15. Appendix

### A. Quick Reference: API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/marketplace/specimens` | Browse catalog |
| `POST` | `/api/feasibility` | Run feasibility |
| `POST` | `/api/exchange` | Create request |
| `PATCH` | `/api/v1/marketplace/requests` | Approve/reject |
| `POST` | `/api/v1/exchange/deals` | Create deal |
| `POST` | `/api/v1/collections` | Create collection |
| `PATCH` | `/api/v1/processing/aliquots/:id/qc` | Record QC |
| `POST` | `/api/v1/shipments` | Create shipment |
| `PATCH` | `/api/v1/shipments/:id` | Update shipment |
| `POST` | `/api/v1/financial/settlements` | Initiate settlement |
| `PATCH` | `/api/v1/financial/settlements/:id` | Update settlement |
| `GET` | `/api/v1/operations/provenance` | View provenance |
| `GET` | `/api/v1/koc/analytics` | View analytics |

### B. Quick Reference: Verification Commands

```bash
# Run all offline tests
npm test

# Run integration gate (requires Supabase)
export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
npx vitest run tests/integration/sit-01-supabase-gate.test.ts

# Check for secrets leaks
bash scripts/check-secrets.sh

# Build production bundle
npm run build -w apps/api

# Type check
npx tsc --noEmit
```

### C. Seed Data Reset

```bash
# Reset database to clean state
supabase db reset

# Re-apply migrations
supabase db push

# Re-apply migration 032 (append-only triggers)
supabase db push --local

# Re-seed pilot data
docker exec -i supabase_db_kadarn-platform psql -U postgres -d postgres \
  < scripts/seed-pilot.sql
```
