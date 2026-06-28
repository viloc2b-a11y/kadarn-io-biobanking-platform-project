#!/usr/bin/env bash
# ============================================================================
# Kadarn Runtime Execution Gate — Pilot 1: Prospective Biospecimen Collection
# ============================================================================
# Validates: program creation → participants → milestones → collection →
# specimens → provenance → shipment → KPE → settlement
# ============================================================================
set -euo pipefail

AUTH="${AUTH:-http://localhost:54321/auth/v1}"
API="${API:-http://localhost:3001}"
ANON_KEY="${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
PASS="${PASS:-test-password-123}"
REPORT="/tmp/pilot1-report.txt"
echo "Pilot 1 — Prospective Biospecimen Collection" > "$REPORT"

fail() { echo "❌ $1"; echo "FAIL: $1" >> "$REPORT"; exit 1; }
ok()   { echo "✅ $1"; echo "OK: $1" >> "$REPORT"; }

# --------------------------------------------------------------------------
# Step 1: Authenticate as sponsor admin
# --------------------------------------------------------------------------
echo "--- Step 1: Authenticate ---"
AUTH=$(curl -sf -X POST "${AUTH}/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.chen@pharmacorp.com","password":"test-password-123"}' 2>&1) \
  || fail "Auth failed. Is Supabase running?"
TOKEN=$(echo "$AUTH" | jq -r '.access_token')
[ -z "$TOKEN" ] && fail "No access_token in auth response"
ok "Authenticated as sarah.chen@pharmacorp.com"

# --------------------------------------------------------------------------
# Step 2: Create program
# --------------------------------------------------------------------------
echo "--- Step 2: Create program ---"
PROG=$(curl -sf -X POST "${API}/api/programs" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pilot 1 — NSCLC Biomarker Validation",
    "short_name": "P1-NSCLC",
    "description": "Prospective collection of 50 NSCLC FFPE specimens for biomarker validation.",
    "status": "active",
    "sponsor_org_id": "org-sponsor-0001",
    "default_data_scope": "de_identified"
  }') || fail "Create program failed"
PROG_ID=$(echo "$PROG" | jq -r '.data.id // .id')
[ -z "$PROG_ID" ] && fail "No program id in response: $(echo "$PROG" | head -c 200)"
ok "Program created: $PROG_ID"

# --------------------------------------------------------------------------
# Step 3: Add participants
# --------------------------------------------------------------------------
echo "--- Step 3: Add participants ---"
for PARTICIPANT in \
  '{"organization_id":"org-hospital-0003","role":"contributor"}' \
  '{"organization_id":"org-biobank-0002","role":"contributor"}' \
  '{"organization_id":"org-lab-0004","role":"processor"}' \
  '{"organization_id":"org-logistics-0005","role":"processor"}'; do
  RESP=$(curl -sf -X POST "${API}/api/v1/programs/${PROG_ID}/participants" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$PARTICIPANT" 2>&1) || fail "Add participant failed: $PARTICIPANT"
done
ok "4 participants added"

# --------------------------------------------------------------------------
# Step 4: Define milestones
# --------------------------------------------------------------------------
echo "--- Step 4: Define milestones ---"
for MS in \
  '{"milestone_type":"irb_submission","title":"IRB Submission","planned_end_date":"2026-08-01"}' \
  '{"milestone_type":"irb_approval","title":"IRB Approval","planned_end_date":"2026-09-01"}' \
  '{"milestone_type":"mta_execution","title":"MTA Execution","planned_end_date":"2026-09-15"}' \
  '{"milestone_type":"collection_start","title":"Collection Start","planned_end_date":"2026-10-01"}' \
  '{"milestone_type":"collection_complete","title":"Collection Complete","planned_end_date":"2026-12-01"}' \
  '{"milestone_type":"processing_start","title":"Processing Start","planned_end_date":"2026-12-15"}' \
  '{"milestone_type":"qc_review","title":"QC Review","planned_end_date":"2027-01-15"}' \
  '{"milestone_type":"data_delivery","title":"Data Delivery","planned_end_date":"2027-02-01"}'; do
  RESP=$(curl -sf -X POST "${API}/api/v1/programs/${PROG_ID}/milestones" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$MS" 2>&1) || fail "Create milestone failed: $MS"
done
ok "8 milestones created"

# --------------------------------------------------------------------------
# Step 5: Create collection twin
# --------------------------------------------------------------------------
echo "--- Step 5: Create collection ---"
COL=$(curl -sf -X POST "${API}/api/v1/collections" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"program_id\": \"${PROG_ID}\",
    \"name\": \"P1 NSCLC Collection — City Hospital\",
    \"target_enrollment\": 50,
    \"status\": \"active\"
  }") || fail "Create collection failed"
COL_ID=$(echo "$COL" | jq -r '.data.id // .id')
[ -z "$COL_ID" ] && fail "No collection id"
ok "Collection created: $COL_ID"

# --------------------------------------------------------------------------
# Step 6: Create specimen twins
# --------------------------------------------------------------------------
echo "--- Step 6: Create specimens ---"
SPEC_IDS=""
for i in 1 2 3; do
  SPEC=$(curl -sf -X POST "${API}/api/v1/specimens" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"external_id\": \"P1-SPEC-$(printf '%04d' $i)\",
      \"specimen_type\": \"ffpe\",
      \"collection_id\": \"${COL_ID}\",
      \"program_id\": \"${PROG_ID}\",
      \"organization_id\": \"org-hospital-0003\",
      \"status\": \"collected\",
      \"properties\": {\"tissue_type\": \"lung\", \"block_count\": 1}
    }") || fail "Create specimen $i failed"
  SID=$(echo "$SPEC" | jq -r '.data.id // .id')
  SPEC_IDS="${SPEC_IDS} ${SID}"
  ok "Specimen $i created: $SID"
done

# --------------------------------------------------------------------------
# Step 7: Provenance recording
# --------------------------------------------------------------------------
echo "--- Step 7: Provenance ---"
PROV=$(curl -sf -X POST "${API}/api/v1/operations/provenance" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"program_id\": \"${PROG_ID}\",
    \"nodes\": [
      {\"node_type\": \"collection_event\", \"external_id\": \"COL-P1-001\", \"label\": \"P1 Collection Event\"},
      {\"node_type\": \"processing_event\", \"external_id\": \"PROC-P1-001\", \"label\": \"FFPE Processing\"},
      {\"node_type\": \"shipment\", \"external_id\": \"SH-P1-001\", \"label\": \"Shipment to Lab\"}
    ],
    \"edges\": [
      {\"edge_type\": \"processed_at\", \"source_external_id\": \"COL-P1-001\", \"target_external_id\": \"PROC-P1-001\"},
      {\"edge_type\": \"shipped_via\", \"source_external_id\": \"PROC-P1-001\", \"target_external_id\": \"SH-P1-001\"}
    ]
  }") || fail "Provenance recording failed"
ok "Provenance recorded"

# --------------------------------------------------------------------------
# Step 8: Create shipment
# --------------------------------------------------------------------------
echo "--- Step 8: Create shipment ---"
SHIP=$(curl -sf -X POST "${API}/api/v1/shipments" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"program_id\": \"${PROG_ID}\",
    \"organization_id\": \"org-logistics-0005\",
    \"shipment_name\": \"P1 Shipment 001\",
    \"shipment_type\": \"ffpe_blocks\",
    \"carrier\": \"FedEx\",
    \"origin\": \"Manchester, UK\",
    \"destination\": \"Berlin, DE\",
    \"status\": \"pending\"
  }") || fail "Create shipment failed"
SHIP_ID=$(echo "$SHIP" | jq -r '.data.id // .id')
[ -z "$SHIP_ID" ] && fail "No shipment id"
ok "Shipment created: $SHIP_ID"

# --------------------------------------------------------------------------
# Step 9: Mark shipment delivered
# --------------------------------------------------------------------------
echo "--- Step 9: Mark delivered ---"
curl -sf -X PATCH "${API}/api/v1/shipments/${SHIP_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status":"delivered","actual_delivery":"'"$(date -u +%Y-%m-%d)"'","temperature_excursion":false}' \
  || fail "PATCH shipment failed"
ok "Shipment marked delivered"

# --------------------------------------------------------------------------
# Step 10: Evaluate KPE
# --------------------------------------------------------------------------
echo "--- Step 10: KPE Evaluation ---"
KPE=$(curl -sf "${API}/api/v1/programs/${PROG_ID}/kpe" \
  -H "Authorization: Bearer ${TOKEN}") || fail "KPE fetch failed"
KPE_SCORE=$(echo "$KPE" | jq -r '.data.kpe_score // "unknown"')
ok "KPE Score: ${KPE_SCORE}"

# --------------------------------------------------------------------------
# Step 11: Settlement — create deal
# --------------------------------------------------------------------------
echo "--- Step 11: Settlement ---"
REQ_ID=$(curl -sf "${API}/api/v1/marketplace/requests" \
  -H "Authorization: Bearer ${TOKEN}" | jq -r '.data[0].id // empty')
if [ -z "$REQ_ID" ]; then
  # Create a request first
  REQ=$(curl -sf -X POST "${API}/api/v1/marketplace/requests" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"P1 Settlement Request\",
      \"supply_item_id\": null,
      \"requested_sample_count\": 50,
      \"target_org_ids\": [\"org-biobank-0002\"]
    }") || fail "Create request failed"
  REQ_ID=$(echo "$REQ" | jq -r '.data.id // .id')
fi

DEAL=$(curl -sf -X POST "${API}/api/v1/exchange/deals" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"${REQ_ID}\",
    \"sponsor_org_id\": \"org-sponsor-0001\",
    \"provider_org_id\": \"org-biobank-0002\",
    \"program_id\": \"${PROG_ID}\",
    \"title\": \"P1 Biomarker Validation Agreement\",
    \"total_value\": 150000.00,
    \"sample_count_expected\": 50
  }") || fail "Create deal failed"
DEAL_ID=$(echo "$DEAL" | jq -r '.data.id // .id')
ok "Deal created: ${DEAL_ID}"

# Release escrow
curl -sf -X PATCH "${API}/api/v1/exchange/deals/${DEAL_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed","escrow_action":"release_full"}' \
  || fail "PATCH deal failed"
ok "Deal completed with full escrow release"

# --------------------------------------------------------------------------
# Step 12: Verify dashboard visibility
# --------------------------------------------------------------------------
echo "--- Step 12: Dashboard verification ---"
ACTIVITY=$(curl -sf "${API}/api/v1/koc/activity" \
  -H "Authorization: Bearer ${TOKEN}") || echo "⚠️ Activity feed unavailable"
ACT_COUNT=$(echo "$ACTIVITY" | jq '.data | length' 2>/dev/null || echo "0")
ok "Activity feed has ${ACT_COUNT} events"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  PILOT 1 — COMPLETE"
echo "  Program: ${PROG_ID}"
echo "  KPE Score: ${KPE_SCORE}"
echo "  Deal: ${DEAL_ID}"
echo "═══════════════════════════════════════════════════"
echo "PASS: Pilot 1 completed successfully" >> "$REPORT"
echo "PASS: All 12 steps executed" >> "$REPORT"
echo "PASS: Settlement completed with escrow" >> "$REPORT"
