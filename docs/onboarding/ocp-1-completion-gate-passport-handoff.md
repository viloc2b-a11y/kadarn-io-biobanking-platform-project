# OCP-1 — Completion Gate & Passport Handoff

**Sprint:** OCP-1
**Date:** 2026-07-07
**Status:** Complete

---

## Objective

Turn existing onboarding infrastructure into a pilot-ready product experience by adding a clear completion gate and handoff from onboarding to Passport review.

---

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `apps/web/src/lib/onboarding/completion-gate.ts` | NEW (+280 lines) | Pure, deterministic completion gate function |
| `apps/web/src/lib/onboarding/onboarding-context.tsx` | MODIFIED (+25 lines) | Added `useCompletionGate()` hook |
| `apps/web/src/app/(onboarding)/components/onboarding-sidebar.tsx` | REWRITTEN | Completion status display + draft/full Passport CTAs |
| `apps/web/src/app/(onboarding)/onboarding/passport/page.tsx` | MODIFIED (+55 lines) | Completion banner + success state on Passport page |
| `tests/onboarding/completion-gate.test.ts` | NEW (+370 lines) | 20 tests covering all completion statuses |
| `docs/onboarding/ocp-1-completion-gate-passport-handoff.md` | NEW | This document |

---

## Behavior Before

- Sidebar showed fast-track progress (Passport Level 0-3) based on legacy flat keys
- No clear signal when onboarding was "done"
- No distinction between incomplete, needs-evidence, needs-review, ready states
- Passport page showed empty state or passport without context about completeness
- No draft Passport concept

## Behavior After

- Sidebar shows completion status: NOT_STARTED, IN_PROGRESS, NEEDS_EVIDENCE, NEEDS_REVIEW, READY_FOR_PASSPORT, PASSPORT_GENERATED
- Status bar with percentage and critical item count
- Next best action link always visible
- Green CTA for full Passport when ready
- Amber CTA for draft Passport when partially complete
- Passport page shows contextual banner:
  - Green success banner: "Your onboarding is complete"
  - Amber draft banner: "Draft Passport — some evidence is missing"
  - Blue progress banner: "Onboarding X% complete — continue"
- Missing critical items listed inline

---

## Completion Statuses Supported

| Status | Trigger | User sees |
|--------|---------|-----------|
| `NOT_STARTED` | 0% overall | "Start building your profile" |
| `IN_PROGRESS` | Some domains answered, not enough for Passport | "% complete · In progress" |
| `NEEDS_EVIDENCE` | Critical questions met but < 3 documents | "% complete · Needs evidence" |
| `NEEDS_REVIEW` | Draft possible but critical items remain | "% complete · Needs review" |
| `READY_FOR_PASSPORT` | >= 7 critical, >= 3 docs, >= 3 interview domains | "Passport ready for review" |
| `PASSPORT_GENERATED` | Flag set (future use) | "Passport generated" |

---

## Known Limitations

1. **Canonical vs legacy**: The completion gate reads canonical objects (`people_team_members`, `infra_location_infrastructure`) but the `PASSPORT_LEVEL1_CRITICAL` in fast-track.ts still uses legacy flat keys. The gate now has its own canonical critical checks independent of fast-track.
2. **Derived domains**: Derived domains (capabilities, readiness, passport, roadmap) are marked complete when their parent interview domains are done. There's no separate Passport review completion marker yet.
3. **PASSPORT_GENERATED state**: Currently only triggered by a `passportGenerated` flag. No actual Passport generation/save event exists yet.
4. **No persistence**: Completion status is computed in-browser from onboarding state. No server-side validation of completion.
5. **Document threshold**: Hardcoded at 3 minimum documents. No per-domain or per-capability document requirements.

---

## Post-Pilot Backlog

| Item | Priority | Notes |
|------|----------|-------|
| Server-side completion validation | Medium | Validate before provisioning |
| Per-capability document requirements | Medium | Instead of flat "3 docs" |
| Passport generation event | Low | Track when user actually reviews/generates Passport |
| Review workflow (human review step) | Low | OCP-8 |
| Evidence Engine integration | Deferred | OCP-5 |

---

## Validation Commands

```bash
# Run completion gate tests
npx vitest run tests/onboarding/completion-gate.test.ts

# Run all onboarding tests
npx vitest run tests/onboarding/

# Result: 51 tests passed (31 read models + 20 completion gate)
```

---

## Vilo Research Pilot Validation

If Vilo Research completes the onboarding flow:

1. Answers all organization, people, infrastructure questions → IN_PROGRESS
2. Uploads 3+ documents → NEEDS_REVIEW (some critical items may remain)
3. Completes all 5 interview domains + 3 docs → READY_FOR_PASSPORT
4. Sidebar shows green "Review Your Passport →" CTA
5. Passport page shows green success banner: "Your onboarding is complete"
6. User can review Passport and proceed

**Answer**: Yes, the system clearly tells the user when onboarding is complete and the Passport is ready for review.
