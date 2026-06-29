# Kadarn Platform — Runtime Execution Gate

## Overview

This directory contains the execution scripts for validating the 5 operational
pilots against real infrastructure. Run these **after** setting up the full
local development environment.

## Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Docker Desktop | 24+ | `docker ps` |
| Supabase CLI | 2.108+ | `supabase --version` |
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |

## Infrastructure Setup

### Step 1: Start Supabase Local

```bash
cd kadarn-platform
supabase start
```

This starts PostgreSQL 15, GoTrue Auth, and the REST API on:

| Service | Port |
|---|---|
| PostgreSQL | 54322 |
| API (Kong) | 54321 |
| Studio (dashboard) | 54323 |
| Inbucket (email) | 54324 |

### Step 2: Apply Database Migrations

```bash
# Migrations are in database/migrations/
# Applied by Supabase automatically on start via supabase/migrations/
# If running manually:
supabase db push
```

The migrations create all tables:
- organizations, programs, participants (008-010)
- policy_engine, trust_engine, twins (013-025)
- provenance_graph, workflow_engine (025-031)
- seed data for pilot execution

### Step 3: Load Seed Data

```bash
# Option A: Use Supabase seed
supabase db reset

# Option B: Load manually if already running
PGPASSWORD=kadarn-dev psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed.sql
```

The seed file creates:
- 5 organizations (PharmaCorp, National Biobank, City Hospital, APL Lab, GCC Logistics)
- Capabilities for each
- User profiles and memberships
- 1 active program with participants and milestones
- Supply items in marketplace
- Trust scores
- Specimen twins + provenance
- Shipments
- Exchange deals + escrow
- Audit events
- Trust challenges

### Step 4: Start API Server

```bash
# From the apps/api directory
npm run dev
# Or from root:
cd apps/api && npm run dev
```

The API starts on `http://localhost:3001` (or `PORT` env).

### Step 5: Start Frontend (optional, for visual validation)

```bash
# From the apps/web directory
npm run dev
# Or from root:
cd apps/web && npm run dev
```

The frontend starts on `http://localhost:3000`.

## Running the Pilots

### Quick Start — All 5 Pilots

```bash
# From the project root
bash scripts/run-all-pilots.sh
```

This executes each pilot in sequence and generates an execution report.

### Individual Pilots

```bash
# Each script is self-contained
bash scripts/run-pilot-1.sh    # Prospective Biospecimen Collection
bash scripts/run-pilot-2.sh    # Retrospective FFPE Request
bash scripts/run-pilot-3.sh    # Hospital Onboarding
bash scripts/run-pilot-4.sh    # Biobank Onboarding
bash scripts/run-pilot-5.sh    # Research Sponsor Program
```

### What Each Pilot Validates

| Pilot | Flow | Endpoints |
|---|---|---|
| 1 | Create program → participants → milestones → collection → specimens → provenance → shipment → KPE → settlement | 12 |
| 2 | Search marketplace → feasibility → request → deal → specimen selection → shipment → receipt → settlement | 14 |
| 3 | Create org → assign capability → invite staff → verify workspace → verify marketplace | 6 |
| 4 | Create org → assign capability → invite staff → publish supply items → verify marketplace visibility | 7 |
| 5 | Create org → capability → invite → program → participants → milestones → KPE → settlement → dashboards | 11 |

## Verifying Results

After running all pilots:

1. **Check the scorecard**: `cat scripts/execution-report.md`
2. **Check the database**: `supabase db dump --data-only | grep INSERT | wc -l`
3. **Open the frontend**: `http://localhost:3000/koc` — the Command Center
4. **Check audit events**: `curl http://localhost:3001/api/v1/feed`

## Architecture

```
scripts/
├── run-all-pilots.sh        # Master orchestrator
├── run-pilot-1.sh           # Prospective Collection
├── run-pilot-2.sh           # Retrospective FFPE
├── run-pilot-3.sh           # Hospital Onboarding
├── run-pilot-4.sh           # Biobank Onboarding
├── run-pilot-5.sh           # Research Sponsor
├── execution-report.md      # Generated scorecard
└── README.md                # This file
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `API not reachable` | Infrastructure not started | `docker compose up -d && supabase start` |
| `HTTP 401` | Missing or invalid API key | Check `ANON_KEY` env var |
| `HTTP 403` | Role check failed | Use the correct user's auth token |
| `HTTP 404` | Endpoint not found | Check API server is running on correct port |
| `relation does not exist` | Migrations not applied | `supabase db push` |

## Next After Execution

1. Review `execution-report.md` for scorecard
2. Fix any failed steps
3. Re-run individual pilots as needed
4. When all 5 pass → tag `v1.0.0-beta`

---

*Kadarn Platform — Runtime Execution Gate v1.0*
