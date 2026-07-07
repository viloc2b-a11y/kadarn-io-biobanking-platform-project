# OCP-4 — Final Handoff & "I'm Done" CTA

**Sprint:** OCP-4
**Date:** 2026-07-07
**Status:** Complete

---

## Objective

Close the onboarding journey with a clear final step. The user understands whether onboarding is complete, whether the Passport is draft or evidence-backed, what remains incomplete, and how to proceed to workspace.

---

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `onboarding-context.tsx` | +15 lines | `onboardingCompleted` flag, `completeOnboarding()` function |
| `onboarding-sidebar.tsx` | +15 lines | Completion state display, workspace link |
| `passport/page.tsx` | +65 lines | "I'm Done" CTA, confirmation banner, workspace link |
| `tests/onboarding/ocp-4-handoff.test.ts` | NEW (+230 lines) | 12 tests |
| `docs/onboarding/ocp-4-final-handoff-im-done-cta.md` | NEW | This document |

---

## Statuses Supported

| Status | Meaning | How triggered |
|--------|---------|---------------|
| `DRAFT_PASSPORT_REVIEWED` | User completed onboarding with draft Passport | `canGenerateDraftPassport && !canGenerateFullPassport` + user clicks "Finish" |
| `EVIDENCE_BACKED_PASSPORT_REVIEWED` | User completed with evidence-backed Passport | `canGenerateFullPassport` + user clicks "Finish" |
| `ONBOARDING_COMPLETED` | `onboardingCompleted = true` in state | `completeOnboarding()` sets flag |

The `PASSPORT_GENERATED` status in the completion gate now reflects `state.onboardingCompleted`.

---

## Behavior Before

- Passport page showed Passport data with Share/Export actions
- No "I'm done" CTA — user had to navigate away manually
- No confirmation that onboarding was complete
- No handoff to workspace
- No distinction between reviewing Passport and completing onboarding

## Behavior After

- Passport page shows "Finish Onboarding — Go to Workspace" CTA when Passport is ready (draft or full)
- Green confirmation banner after completion: "Onboarding complete"
- "Go to Workspace" link in sidebar when completed
- `onboardingCompleted` flag persisted to localStorage
- Completion gate reflects PASSPORT_GENERATED when completed
- Draft vs evidence-backed distinction in confirmation messaging

---

## "I'm Done" CTA Behavior

### When draft Passport is ready

```
┌─────────────────────────────────────────────────────┐
│ Your draft Institution Passport is complete.         │
│ Some capabilities still need supporting evidence.    │
│                                                      │
│ [Finish Onboarding — Go to Workspace] [View Roadmap] │
└─────────────────────────────────────────────────────┘
```

### When evidence-backed Passport is ready

```
┌─────────────────────────────────────────────────────┐
│ Your evidence-backed Institution Passport is         │
│ complete and ready for internal review.              │
│                                                      │
│ [Finish Onboarding — Go to Workspace] [View Roadmap] │
└─────────────────────────────────────────────────────┘
```

### After completion

```
┌─────────────────────────────────────────────────────┐
│ ✅ Onboarding complete                               │
│ Your Institution Passport is ready. You can always   │
│ return to strengthen evidence.                       │
│                                                      │
│ [Go to Workspace] [Back to Onboarding]               │
└─────────────────────────────────────────────────────┘
```

---

## Language Compliance

Avoided terms:
- ❌ verified
- ❌ certified
- ❌ approved
- ❌ sponsor-ready (without context)

Used terms:
- ✅ draft Passport
- ✅ evidence-backed Passport
- ✅ ready for internal review
- ✅ remaining evidence gaps
- ✅ strengthen your Passport

---

## Tests Run

```
tests/onboarding/ocp-4-handoff.test.ts          — 12 tests
tests/onboarding/derived-read-models.test.ts    — 31 tests
tests/onboarding/completion-gate.test.ts         — 20 tests
tests/onboarding/ocp-3-evidence-aware.test.ts   — 14 tests
Total: 77 tests passed
```

### OCP-4 Specific Tests (12)

| Test | Result |
|------|--------|
| Draft Passport can be reviewed | ✅ |
| Evidence-backed Passport can be reviewed | ✅ |
| PASSPORT_GENERATED when onboarding completed | ✅ |
| Completion does not hide gaps | ✅ |
| Completion preserves gate data | ✅ |
| PASSPORT_GENERATED preserves next best action | ✅ |
| Vilo draft: declared + partial evidence → can complete | ✅ |
| Vilo evidence-backed: sufficient evidence → ready | ✅ |
| Vilo completed flag → PASSPORT_GENERATED | ✅ |
| Vilo draft completed → gaps still visible | ✅ |
| No verified/certified/approved language | ✅ |
| Draft vs evidence-backed distinction | ✅ |

---

## Known Limitations

1. **Workspace page not updated**: The workspace shell (`/workspace`) does not yet read `onboardingCompleted` from onboarding context. It needs a separate integration (OCP-4 backlog).
2. **No provisioning trigger**: Completing onboarding does not trigger the `POST /api/v1/onboarding/organization` provisioning API. This is deferred to OCP-4 backlog.
3. **No workspace banner**: The workspace page doesn't show Passport status or remaining gaps. This requires workspace-side integration.

---

## Post-Pilot Backlog

| Item | Sprint |
|------|--------|
| Workspace shows onboarding completion status | OCP-4 backlog |
| Provisioning API triggered on completion | OCP-4 backlog |
| Workspace "Resume Onboarding" link | OCP-4 backlog |
| Passport version snapshot on completion | Post-pilot |

---

## Validation Commands

```bash
npx vitest run tests/onboarding/ocp-4-handoff.test.ts
npx vitest run tests/onboarding/
# Result: 77 tests passed
```
