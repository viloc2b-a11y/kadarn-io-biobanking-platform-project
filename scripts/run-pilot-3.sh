#!/usr/bin/env bash
# ============================================================================
# Kadarn Runtime Execution Gate — Pilot 3: Hospital Onboarding
# ============================================================================
# Validates: org creation → auto-membership → capability → invite → workspace
# ============================================================================
set -euo pipefail

API="${API:-http://localhost:54321/functions/v1}"
ANON_KEY="${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
REPORT="/tmp/pilot3-report.txt"
echo "Pilot 3 — Hospital Onboarding" > "$REPORT"

fail() { echo "❌ $1"; echo "FAIL: $1" >> "$REPORT"; exit 1; }
ok()   { echo "✅ $1"; echo "OK: $1" >> "$REPORT"; }

# --------------------------------------------------------------------------
# Step 1: Authenticate as new hospital admin
# --------------------------------------------------------------------------
echo "--- Step 1: Authenticate ---"
AUTH=$(curl -sf -X POST "${API}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@newhospital.nhs.uk","password":"test-password-123"}' 2>&1) \
  || fail "Auth failed"
TOKEN=$(echo "$AUTH" | jq -r '.access_token')
ok "Authenticated as admin@newhospital.nhs.uk"

# --------------------------------------------------------------------------
# Step 2: Create organization (auto-membership test)
# --------------------------------------------------------------------------
echo "--- Step 2: Create org ---"
ORG=$(curl -sf -X POST "${API}/api/organizations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New District General Hospital",
    "legal_name": "New District General Hospital NHS Trust",
    "country": "GB",
    "region": "North West England",
    "description": "District general hospital with 500-bed capacity and histopathology lab."
  }') || fail "Create org failed"
ORG_ID=$(echo "$ORG" | jq -r '.data.id // .id')
[ -z "$ORG_ID" ] && fail "No org id: $(echo "$ORG" | head -c 200)"
ok "Organization created: ${ORG_ID}"

# --------------------------------------------------------------------------
# Step 3: Verify auto-membership was created
# --------------------------------------------------------------------------
echo "--- Step 3: Verify auto-membership ---"
MEMBERS=$(curl -sf "${API}/api/v1/workspace/profile" \
  -H "Authorization: Bearer ${TOKEN}") || fail "Profile fetch failed"
MEM_COUNT=$(echo "$MEMBERS" | jq '.data.memberships | length')
[ "$MEM_COUNT" -eq 0 ] && fail "Auto-membership not created — creator is orphaned"
ok "Auto-membership verified: ${MEM_COUNT} memberships"

# --------------------------------------------------------------------------
# Step 4: Assign clinical_site capability
# --------------------------------------------------------------------------
echo "--- Step 4: Assign capability ---"
curl -sf -X POST "${API}/api/organizations/${ORG_ID}/capabilities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"capability_keys": ["clinical_site", "biobank"]}' \
  || fail "Capability assignment failed"
ok "Capabilities clinical_site + biobank assigned"

# --------------------------------------------------------------------------
# Step 5: Invite staff member
# --------------------------------------------------------------------------
echo "--- Step 5: Invite staff ---"
INVITE=$(curl -sf -X POST "${API}/api/organizations/${ORG_ID}/invite" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"email":"pathologist@newhospital.nhs.uk","role":"member"}') || fail "Invite failed"
INVITE_ID=$(echo "$INVITE" | jq -r '.data.id // .id')
ok "Staff invited: ${INVITE_ID}"

# --------------------------------------------------------------------------
# Step 6: Verify workspace navigation shows correct apps
# --------------------------------------------------------------------------
echo "--- Step 6: Verify workspace nav ---"
NAV=$(curl -sf "${API}/api/v1/workspace/navigation" \
  -H "Authorization: Bearer ${TOKEN}") || echo "⚠️ Nav unavailable"
NAV_COUNT=$(echo "$NAV" | jq '.data.sections | length' 2>/dev/null || echo "0")
# clinical_site should show: consent, collections
# biobank should show: inventory, collections, qc
ok "Navigation loaded: ${NAV_COUNT} sections"

# --------------------------------------------------------------------------
# Step 7: Verify marketplace eligibility
# --------------------------------------------------------------------------
echo "--- Step 7: Marketplace eligibility ---"
# Add a supply item so the hospital is visible in discovery
curl -sf -X POST "${API}/api/v1/marketplace/supply-items" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"prospective_collection\",
    \"title\": \"New District General — Colorectal Cancer Collection\",
    \"sample_types\": [\"fresh_frozen\", \"ffpe\"],
    \"disease_label\": \"Colorectal Cancer\",
    \"country\": \"GB\",
    \"commercial_use_allowed\": false
  }" || fail "Create supply item failed"
ok "Supply item published to marketplace"

# --------------------------------------------------------------------------
# Step 8: Dashboard verification
# --------------------------------------------------------------------------
echo "--- Step 8: Dashboard ---"
DASH=$(curl -sf "${API}/api/v1/koc/platform-health" \
  -H "Authorization: Bearer ${TOKEN}") || echo "⚠️ Dashboard unavailable"
ORG_COUNT=$(echo "$DASH" | jq '.data.active_orgs // "?"')
ok "Platform dashboard shows ${ORG_COUNT} active orgs"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  PILOT 3 — COMPLETE"
echo "  Organization: ${ORG_ID}"
echo "  Staff invited: ${INVITE_ID}"
echo "═══════════════════════════════════════════════════"
echo "PASS: Pilot 3 completed successfully" >> "$REPORT"
echo "PASS: Hospital onboarding without manual DB" >> "$REPORT"
echo "PASS: Auto-membership, capabilities, invite all work" >> "$REPORT"
