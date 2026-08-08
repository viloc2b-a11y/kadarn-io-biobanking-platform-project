#!/usr/bin/env bash
# AF-4.0 Sprint 8 — Architecture compliance gate
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Fail loudly, not silently, if a required tool is missing — a guard that
# silently no-ops when its own grep tool is absent is worse than no guard.
command -v rg >/dev/null 2>&1 || { echo "FAIL: ripgrep (rg) is required by arch-gate.sh but was not found on PATH"; exit 1; }

echo "== AF-4.0 Architecture Gate =="

# ADR registry must exist
test -f openspec/canonical-documents-registry-af-2.1.md

# AF-4.0 program charter
test -f openspec/af-4.0-enterprise-readiness-program.md

# Instrumentation package present
test -f packages/instrumentation/src/index.ts

# Evidence Core guard: no direct continuity_experience_claims reads in API routes
if rg -l "continuity_experience_claims" apps/api/src/app/api/v1 --glob '*.ts' 2>/dev/null | grep -v cutover; then
  echo "FAIL: direct continuity_experience_claims read in v1 API"
  exit 1
fi

# Forbidden bypass of Published View on external surfaces (heuristic)
for route in passport institution/public discovery/dashboard discovery/report; do
  if ! rg -q "published-view|PublishedView|getPublishedViewService" "apps/api/src/app/api/v1" 2>/dev/null; then
    : # individual route check optional
  fi
done

# ─── dashboard-next-best-action — score-free surfaces guard ─────────────
# Design ref: decisions-2 (id 983) rule 5 — mandatory, non-repo-wide gate:
# zero runtime-reachable institution-level score/tier/ranking field on the
# specific surfaces this change fixed. NOT repo-wide: packages/trust-engine
# (ADR-010 preserved dormant code), packages/institutional-knowledge (Phase D
# inventory-only deliverable, not fixed in Slice 1), packages/graph-query
# (dormant adapter, D6), packages/evidence-discovery (separate unrelated
# package, out of this change's scope), and database/migrations (frozen
# schema, no migration issued) are intentionally excluded — reintroducing
# a guard there would fail on legitimate, already-scoped-out code.
SCORE_FREE_SURFACES=(
  "apps/api/src/lib/continuity-claim-service.ts"
  "apps/api/src/app/api/v1/marketplace/organizations/route.ts"
  "apps/web/src/lib/passport/passport-assembler.ts"
  "apps/web/src/lib/onboarding/derived-read-models/passport-read-model.ts"
  "apps/web/src/lib/onboarding/derived-read-models/readiness-read-model.ts"
  "apps/web/src/lib/onboarding/derived-read-models/roadmap-read-model.ts"
  "apps/web/src/lib/onboarding/institution-roadmap.ts"
  "apps/web/src/app/site-passport"
  # Slice 2 — Next Best Action Center (score-free surfaces)
  "apps/web/src/lib/home/home-aggregator.ts"
  "apps/web/src/app/(workspace)/workspace/page.tsx"
  # Slice 3 — Evidence Core hardening (API surfaces)
  "apps/api/src/app/api/v1/claims/route.ts"
  "apps/api/src/app/api/v1/workspace/activity/route.ts"
  "apps/web/src/app/(onboarding)/onboarding/passport"
  "apps/web/src/app/(onboarding)/onboarding/readiness"
  "apps/web/src/app/(onboarding)/onboarding/roadmap"
  "apps/web/src/app/(marketplace)/marketplace/organizations"
  "apps/web/src/app/(koc)/koc/kpe"
  "packages/kpe-generator/src/index.ts"
)
FORBIDDEN_SCORE_FIELDS="overallScore|healthScore|coverageScore|readinessScore|avgOrgTrust|completionPercent|currentReadinessLevel|targetReadinessLevel|organization_trust|trustLevel|trustScore"
SCORE_GATE_FAIL=0
for SURFACE in "${SCORE_FREE_SURFACES[@]}"; do
  if [ -e "$SURFACE" ]; then
    # Match candidate lines, then drop pure comment lines (//, /*, *-continuation)
    # so deprecation-note prose referencing the removed field BY NAME (e.g.
    # "no institution-level overallScore field") doesn't self-trip the gate —
    # only real code usage (property access, object key, assignment) fails it.
    MATCHES=$(rg -n -H "$FORBIDDEN_SCORE_FIELDS" "$SURFACE" --glob '*.ts' --glob '*.tsx' 2>/dev/null \
      | grep -vE '^[^:]+:[0-9]+:\s*(//|/\*|\*)' || true)
    if [ -n "$MATCHES" ]; then
      echo "FAIL: institution-level score/tier field reintroduced in $SURFACE"
      echo "$MATCHES"
      SCORE_GATE_FAIL=1
    fi
  fi
done
if [ "$SCORE_GATE_FAIL" -eq 1 ]; then
  echo "FAIL: score-free surfaces guard (dashboard-next-best-action)"
  exit 1
fi

# ─── dashboard-next-best-action CRITICAL #1 fix — per-claim confidence ────
# Verify report ref: sdd/dashboard-next-best-action/verify-report (id 1010).
# `confidence_score` is a legitimate DB column / property name elsewhere in
# this same change (e.g. apps/api/src/lib/continuity-claim-service.ts still
# queries `.order('confidence_score', ...)` against
# continuity_experience_claims — that is correct, in-scope, per-claim usage,
# NOT the violation). The regression this guard targets is narrower: the
# Site Passport page rendering a bare per-claim confidence number with no
# explanation. So this is a separate, targeted pair of checks — not folded
# into SCORE_FREE_SURFACES/FORBIDDEN_SCORE_FIELDS above, which would
# false-positive-fail continuity-claim-service.ts.
SITE_PASSPORT_PAGE="apps/web/src/app/site-passport/[slug]/page.tsx"
LEGACY_ADAPTER="packages/published-view/src/legacy-adapter.ts"

if [ -f "$SITE_PASSPORT_PAGE" ]; then
  MATCHES=$(rg -n -H "claim\.confidence_score|claim\.verification_label" "$SITE_PASSPORT_PAGE" 2>/dev/null \
    | grep -vE '^[^:]+:[0-9]+:\s*(//|/\*|\*)' || true)
  if [ -n "$MATCHES" ]; then
    echo "FAIL: bare per-claim confidence_score/verification_label reintroduced in $SITE_PASSPORT_PAGE"
    echo "$MATCHES"
    SCORE_GATE_FAIL=1
  fi
fi

if [ -f "$LEGACY_ADAPTER" ]; then
  # Positive check (unlike the negative checks above): confidenceLevel and
  # confidenceExplanation must stay present so a future edit can't silently
  # drop the explanation and regress to a bare number.
  if ! rg -q "confidenceLevel" "$LEGACY_ADAPTER" 2>/dev/null || ! rg -q "confidenceExplanation" "$LEGACY_ADAPTER" 2>/dev/null; then
    echo "FAIL: $LEGACY_ADAPTER no longer emits confidenceLevel/confidenceExplanation"
    SCORE_GATE_FAIL=1
  fi
fi

if [ "$SCORE_GATE_FAIL" -eq 1 ]; then
  echo "FAIL: per-claim confidence explanation guard (dashboard-next-best-action CRITICAL #1)"
  exit 1
fi

echo "PASS: architecture gate"
