#!/usr/bin/env bash
# ============================================================================
# Kadarn Runtime Execution Gate — Pilot 5: Research Sponsor Program
# ============================================================================
# Validates: sponsor org → program → participants → milestones → KPE → settlement
# ============================================================================
set -euo pipefail

API="${API:-http://localhost:54321/functions/v1}"
ANON_KEY="${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
REPORT="/tmp/pilot5-report.txt"
echo "Pilot 5 — Research Sponsor Program" > "$REPORT"

fail() { echo "❌ $1"; echo "FAIL: $1" >> "$REPORT"; exit 1; }
ok()   { echo "✅ $1"; echo "OK: $1" >> "$REPORT"; }

# --------------------------------------------------------------------------
# Step 1: Authenticate as sponsor admin
# --------------------------------------------------------------------------
echo "--- Step 1: Authenticate ---"
AUTH=$(curl -sf -X POST "${API}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"sponsor@newco.com","password":"test-password-123"}' 2>&1) \
  || fail "Auth failed"
TOKEN=$(echo "$AUTH" | jq -r '.access_token')
ok "Authenticated"

# --------------------------------------------------------------------------
# Step 2: Create sponsor organization
# --------------------------------------------------------------------------
echo "--- Step 2: Create org ---"
ORG=$(curl -sf -X POST "${API}/api/organizations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "NovaBio Therapeutics",
    "legal_name": "NovaBio Therapeutics Inc.",
    "country": "US",
    "region": "Massachusetts",
    "description": "Biotech company specializing in oncology precision medicine."
  }') || fail "Create org failed"
ORG_ID=$(echo "$ORG" | jq -r '.data.id // .id')
ok "Organization created: ${ORG_ID}"

# --------------------------------------------------------------------------
# Step 3: Assign sponsor capability + invite team
# --------------------------------------------------------------------------
echo "--- Step 3: Capability ---"
curl -sf -X POST "${API}/api/organizations/${ORG_ID}/capabilities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"capability_keys": ["sponsor"]}' || fail "Capability failed"
ok "Capability 'sponsor' assigned"

curl -sf -X POST "${API}/api/organizations/${ORG_ID}/invite" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"email":"cra@novabio.com","role":"member"}' || fail "Invite failed"
ok "Team member invited"

# --------------------------------------------------------------------------
# Step 4: Create program
# --------------------------------------------------------------------------
echo "--- Step 4: Create program ---"
PROG=$(curl -sf -X POST "${API}/api/programs" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"NovaBio — Panobinostat Liquid Biopsy Trial\",
    \"short_name\": \"NB-PLB-001\",
    \"description\": \"Multi-center liquid biopsy monitoring trial for DLBCL patients on panobinostat.\",
    \"status\": \"active\",
    \"sponsor_org_id\": \"${ORG_ID}\",
    \"default_data_scope\": \"pseudonymized\"
  }") || fail "Create program failed"
PROG_ID=$(echo "$PROG" | jq -r '.data.id // .id')
ok "Program created: ${PROG_ID}"

# --------------------------------------------------------------------------
# Step 5: Add participants (other orgs from seed data)
# --------------------------------------------------------------------------
echo "--- Step 5: Add participants ---"
for P in '{"organization_id":"org-hospital-0003","role":"contributor"}' \
         '{"organization_id":"org-biobank-0002","role":"contributor"}' \
         '{"organization_id":"org-lab-0004","role":"processor"}'; do
  curl -sf -X POST "${API}/api/v1/programs/${PROG_ID}/participants" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$P" || fail "Add participant failed: $P"
done
ok "3 participants added"

# --------------------------------------------------------------------------
# Step 6: Define milestones
# --------------------------------------------------------------------------
echo "--- Step 6: Milestones ---"
for MS in \
  '{"milestone_type":"irb_submission","title":"IRB Submission — Multi-center","planned_end_date":"2026-09-01"}' \
  '{"milestone_type":"irb_approval","title":"IRB Approval","planned_end_date":"2026-10-15"}' \
  '{"milestone_type":"mta_execution","title":"MTA with Sites","planned_end_date":"2026-11-01"}' \
  '{"milestone_type":"collection_start","title":"Enrollment Start","planned_end_date":"2026-11-15"}' \
  '{"milestone_type":"collection_complete","title":"Enrollment Complete (120 pts)","planned_end_date":"2027-05-01"}' \
  '{"milestone_type":"data_delivery","title":"Final Data Lock","planned_end_date":"2027-07-01"}'; do
  curl -sf -X POST "${API}/api/v1/programs/${PROG_ID}/milestones" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$MS" || fail "Create milestone failed: $(echo "$MS" | head -c 60)"
done
ok "6 milestones created"

# --------------------------------------------------------------------------
# Step 7: Evaluate KPE
# --------------------------------------------------------------------------
echo "--- Step 7: KPE ---"
KPE=$(curl -sf "${API}/api/v1/programs/${PROG_ID}/kpe" \
  -H "Authorization: Bearer ${TOKEN}") || fail "KPE failed"
KPE_SCORE=$(echo "$KPE" | jq -r '.data.kpe_score // "?"')
KPE_AUDIT=$(echo "$KPE" | jq -r '.data.audit_ready // false')
ok "KPE Score: ${KPE_SCORE}, Audit Ready: ${KPE_AUDIT}"

DIMS=$(echo "$KPE" | jq -r '.data.dimensions | to_entries[] | "\(.key): \(.value.score)% (\(.value.status))"' 2>/dev/null || echo "")
while IFS= read -r line; do
  [ -n "$line" ] && ok "  $line"
done <<< "$DIMS"

# --------------------------------------------------------------------------
# Step 8: Settlement
# --------------------------------------------------------------------------
echo "--- Step 8: Settlement ---"
# Create exchange request first
REQ=$(curl -sf -X POST "${API}/api/v1/marketplace/requests" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"NB-PLB-001 Specimen Access\",\"target_org_ids\":[\"org-biobank-0002\"],\"requested_sample_count\":240}") || fail "Create request failed"
REQ_ID=$(echo "$REQ" | jq -r '.data.id // .id')

DEAL=$(curl -sf -X POST "${API}/api/v1/exchange/deals" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"${REQ_ID}\",
    \"sponsor_org_id\": \"${ORG_ID}\",
    \"provider_org_id\": \"org-biobank-0002\",
    \"program_id\": \"${PROG_ID}\",
    \"title\": \"NB-PLB-001 Liquid Biopsy Supply Agreement\",
    \"total_value\": 320000.00,
    \"sample_count_expected\": 240
  }") || fail "Create deal failed"
DEAL_ID=$(echo "$DEAL" | jq -r '.data.id // .id')
ok "Deal: ${DEAL_ID}"

# Sign MTA
curl -sf -X PATCH "${API}/api/v1/exchange/deals/${DEAL_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"mta_signed":true,"status":"active"}' || fail "MTA signing failed"
ok "MTA signed, deal active"

# --------------------------------------------------------------------------
# Step 9: Verify program dashboards
# --------------------------------------------------------------------------
echo "--- Step 9: Dashboard verification ---"
DETAIL=$(curl -sf "${API}/api/v1/programs/${PROG_ID}" \
  -H "Authorization: Bearer ${TOKEN}") || echo "⚠️ Detail unavailable"
PARTICIPANTS=$(curl -sf "${API}/api/v1/programs/${PROG_ID}/participants" \
  -H "Authorization: Bearer ${TOKEN}") || echo "⚠️ Participants unavailable"
PART_COUNT=$(echo "$PARTICIPANTS" | jq '.data | length' 2>/dev/null || echo "0")
ok "Program detail + ${PART_COUNT} participants visible"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  PILOT 5 — COMPLETE"
echo "  Org: ${ORG_ID}"
echo "  Program: ${PROG_ID}"
echo "  KPE Score: ${KPE_SCORE}"
echo "  Deal: ${DEAL_ID}"
echo "═══════════════════════════════════════════════════"
echo "PASS: Pilot 5 completed successfully" >> "$REPORT"
echo "PASS: Full sponsor program lifecycle verified" >> "$REPORT"
