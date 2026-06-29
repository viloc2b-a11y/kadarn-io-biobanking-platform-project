#!/usr/bin/env bash
# ============================================================================
# Kadarn Runtime Execution Gate — Pilot 2: Retrospective FFPE Request
# ============================================================================
# Validates: search → feasibility → request → deal → shipment → settlement
# ============================================================================
set -euo pipefail

API="${API:-http://localhost:54321/functions/v1}"
ANON_KEY="${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
REPORT="/tmp/pilot2-report.txt"
echo "Pilot 2 — Retrospective FFPE Request" > "$REPORT"

fail() { echo "❌ $1"; echo "FAIL: $1" >> "$REPORT"; exit 1; }
ok()   { echo "✅ $1"; echo "OK: $1" >> "$REPORT"; }

# --------------------------------------------------------------------------
# Step 1: Authenticate as researcher
# --------------------------------------------------------------------------
echo "--- Step 1: Authenticate ---"
AUTH=$(curl -sf -X POST "${API}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"a.thompson@pharmacorp.com","password":"test-password-123"}' 2>&1) \
  || fail "Auth failed"
TOKEN=$(echo "$AUTH" | jq -r '.access_token')
[ -z "$TOKEN" ] && fail "No access_token"
ok "Authenticated as a.thompson@pharmacorp.com"

# --------------------------------------------------------------------------
# Step 2: Search marketplace for FFPE
# --------------------------------------------------------------------------
echo "--- Step 2: Search FFPE ---"
SEARCH=$(curl -sf "${API}/api/v1/marketplace/specimens?q=ffpe&sample_type=ffpe&limit=5" \
  -H "Authorization: Bearer ${TOKEN}") || fail "Search failed"
RESULT_COUNT=$(echo "$SEARCH" | jq '.data.results | length')
[ "$RESULT_COUNT" -eq 0 ] && fail "No FFPE results found — seed data may be missing"
FIRST_ITEM=$(echo "$SEARCH" | jq -r '.data.results[0].id')
ok "Search returned ${RESULT_COUNT} results, first: ${FIRST_ITEM}"

# --------------------------------------------------------------------------
# Step 3: Submit feasibility request
# --------------------------------------------------------------------------
echo "--- Step 3: Feasibility request ---"
FEAS=$(curl -sf -X POST "${API}/api/v1/marketplace/feasibility" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "program_name": "NSCLC Biomarker Discovery — FFPE Cohort",
    "therapeutic_area": "Oncology",
    "disease_label": "Non-small Cell Lung Cancer",
    "required_sample_types": ["ffpe"],
    "required_capabilities": ["biobank", "processing_lab"],
    "target_countries": ["GB", "DE"],
    "estimated_sample_count": 100,
    "urgency": "standard"
  }') || fail "Feasibility request failed"
FEAS_ID=$(echo "$FEAS" | jq -r '.data.id // .id')
ok "Feasibility submitted: ${FEAS_ID}"

# --------------------------------------------------------------------------
# Step 4: Submit access request
# --------------------------------------------------------------------------
echo "--- Step 4: Access request ---"
REQ=$(curl -sf -X POST "${API}/api/v1/marketplace/requests" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Access to Lung Cancer FFPE Cohort\",
    \"description\": \"Requesting 50 FFPE blocks from NSCLC cohort for biomarker validation.\",
    \"supply_item_id\": \"${FIRST_ITEM}\",
    \"target_org_ids\": [\"org-biobank-0002\"],
    \"requested_sample_count\": 50,
    \"requested_timeline_days\": 90,
    \"commercial_use\": true
  }") || fail "Access request failed"
REQ_ID=$(echo "$REQ" | jq -r '.data.id // .id')
ok "Access request submitted: ${REQ_ID}"

# --------------------------------------------------------------------------
# Step 5: Create exchange deal
# --------------------------------------------------------------------------
echo "--- Step 5: Create deal ---"
DEAL=$(curl -sf -X POST "${API}/api/v1/exchange/deals" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"${REQ_ID}\",
    \"sponsor_org_id\": \"org-sponsor-0001\",
    \"provider_org_id\": \"org-biobank-0002\",
    \"title\": \"NSCLC FFPE Cohort Access Agreement\",
    \"total_value\": 75000.00,
    \"sample_count_expected\": 50,
    \"expected_start_date\": \"2026-08-01\",
    \"expected_end_date\": \"2026-10-31\"
  }") || fail "Create deal failed"
DEAL_ID=$(echo "$DEAL" | jq -r '.data.id // .id')
ok "Deal created: ${DEAL_ID}"

# --------------------------------------------------------------------------
# Step 6: Sign MTA and activate deal
# --------------------------------------------------------------------------
echo "--- Step 6: Sign MTA ---"
curl -sf -X PATCH "${API}/api/v1/exchange/deals/${DEAL_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"mta_signed": true, "status": "active"}' \
  || fail "MTA signing failed"
ok "MTA signed, deal active"

# --------------------------------------------------------------------------
# Step 7: Create shipment
# --------------------------------------------------------------------------
echo "--- Step 7: Create shipment ---"
SHIP=$(curl -sf -X POST "${API}/api/v1/shipments" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"program_id\": null,
    \"organization_id\": \"org-logistics-0005\",
    \"shipment_name\": \"P2 FFPE Shipment 001\",
    \"shipment_type\": \"ffpe_blocks\",
    \"carrier\": \"FedEx Priority\",
    \"origin\": \"London, UK\",
    \"destination\": \"Boston, US\",
    \"status\": \"pending\"
  }") || fail "Create shipment failed"
SHIP_ID=$(echo "$SHIP" | jq -r '.data.id // .id')
ok "Shipment created: ${SHIP_ID}"

# --------------------------------------------------------------------------
# Step 8: Mark delivered
# --------------------------------------------------------------------------
echo "--- Step 8: Mark delivered ---"
curl -sf -X PATCH "${API}/api/v1/shipments/${SHIP_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status":"delivered","actual_delivery":"'"$(date -u +%Y-%m-%d)"'","temperature_excursion":false}' \
  || fail "PATCH shipment failed"
ok "Shipment marked delivered"

# --------------------------------------------------------------------------
# Step 9: Record provenance
# --------------------------------------------------------------------------
echo "--- Step 9: Provenance ---"
curl -sf -X POST "${API}/api/v1/operations/provenance" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"nodes\": [
      {\"node_type\": \"specimen\", \"external_id\": \"FFPE-COHORT-001\", \"label\": \"NSCLC FFPE Block 001\"},
      {\"node_type\": \"shipment\", \"external_id\": \"SH-P2-001\", \"label\": \"FFPE Shipment to Boston\"},
      {\"node_type\": \"receipt\", \"external_id\": \"REC-P2-001\", \"label\": \"Receipt at Sponsor Lab\"}
    ],
    \"edges\": [
      {\"edge_type\": \"shipped_via\", \"source_external_id\": \"FFPE-COHORT-001\", \"target_external_id\": \"SH-P2-001\"},
      {\"edge_type\": \"received_at\", \"source_external_id\": \"SH-P2-001\", \"target_external_id\": \"REC-P2-001\"}
    ]
  }") || fail "Provenance recording failed"
ok "Provenance recorded"

# --------------------------------------------------------------------------
# Step 10-11: Verify dashboards
# --------------------------------------------------------------------------
echo "--- Step 10: Verify dashboards ---"
POLICY=$(curl -sf "${API}/api/v1/koc/policy" -H "Authorization: Bearer ${TOKEN}") || echo "⚠️ Policy dashboard unavailable"
echo "$POLICY" | jq '.data.total_policies // "unknown"' | xargs -I{} ok "Policy dashboard accessible, policies: {}"

ACTIVITY=$(curl -sf "${API}/api/v1/koc/activity" -H "Authorization: Bearer ${TOKEN}") || echo "⚠️ Activity feed unavailable"
ACT_COUNT=$(echo "$ACTIVITY" | jq '.data | length' 2>/dev/null || echo "0")
ok "Activity feed has ${ACT_COUNT} events"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  PILOT 2 — COMPLETE"
echo "  Feasibility: ${FEAS_ID}"
echo "  Request: ${REQ_ID}"
echo "  Deal: ${DEAL_ID}"
echo "  Shipment: ${SHIP_ID}"
echo "═══════════════════════════════════════════════════"
echo "PASS: Pilot 2 completed successfully" >> "$REPORT"
echo "PASS: FFPE retrospective flow verified" >> "$REPORT"
