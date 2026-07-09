# Hybrid Trial Readiness Passport — Vilo Research Pilot Checklist

**Version:** MVP Pilot  
**Date:** 2026-07-09  
**Status:** Ready for pilot  
**Target Institution:** Vilo Research (Independent research site, Boston)

---

## Pre-Flight Checks

- [ ] `readiness_hybrid_trial` exists in `program_type_taxonomy` (migration 055)
- [ ] 10 hybrid capability types exist in `organization_capability_types`
- [ ] 10 capability requirements + ~30 evidence requirements exist
- [ ] Onboarding journey includes `hybrid-trial` domain
- [ ] `/onboarding/hybrid-trial` route resolves
- [ ] `/onboarding/passport` shows section 4.5 when ht_* answers exist
- [ ] All 259 tests pass

## Pilot Walkthrough

### Phase 1: Onboarding Completion

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Navigate to `/onboarding/hybrid-trial` | Page loads with DomainHeader, intro card | |
| 2 | Answer core questions (ht_has_hybrid_exp: "yes") | Historical experience module appears | |
| 3 | Answer site execution questions | 4 questions visible, answers saved to store | |
| 4 | Set ht_has_home_visits: "yes" | At-home coordination + vendor modules appear (~10 new questions) | |
| 5 | Answer at-home coordination: responsibility matrix, workflow SOP, communication, escalation | All 6 questions with evidence badges | |
| 6 | Answer vendor questions: qualification SOP, training SOP, performance tracking | Vendor module complete | |
| 7 | Set ht_has_bio_home: "yes" | Biospecimen collection + chain of custody + shipping + temperature modules appear (~14 new questions) | |
| 8 | Answer biospecimen-at-home: collection SOP, custody SOP, courier workflow, temperature monitoring | All biospecimen modules complete | |
| 9 | Set ht_has_home_visits safety pathway | At-home escalation pathway documented | |
| 10 | Set ht_has_remote_mon: "yes" | Remote monitoring module appears | |
| 11 | Answer data integrity: source doc SOP, data integrity SOP, EHR/EDC platforms, audit trail, query process, data review | 8 questions with evidence badges | |
| 12 | Answer patient access: panel size, demographics, geographic reach, languages, underserved access | 7 questions | |
| 13 | Answer retention: tracking, rate, strategies | 3 questions | |
| 14 | Answer safety escalation: escalation SOP, emergency SOP, drills, AE reporting | All safety questions | |
| 15 | Answer protocol compliance: deviation SOP, monitoring SOP, CAPA linkage | 3 questions | |
| 16 | Click "Complete Hybrid Trial Section" | Green badge "✅ Hybrid Trial section completed" | |

### Phase 2: Document Upload

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 17 | Navigate to `/onboarding/documents` | Documents page loads | |
| 18 | Upload Responsibility Matrix (At-Home) | Document appears in hybrid-trial category | |
| 19 | Upload Source Documentation SOP | Document appears in hybrid-trial category | |
| 20 | Upload Chain of Custody SOP (Home-to-Lab) | Document appears in hybrid-trial category | |
| 21 | Verify document appears in uploadedDocs[] | Passport read model receives doc label | |

### Phase 3: Passport Review

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 22 | Navigate to `/onboarding/passport` | Passport loads with 5 sections | |
| 23 | Scroll to Section 4.5 "Hybrid Trial Readiness" | Section visible with teal gradient header | |
| 24 | Verify Executive Summary | Overall confidence %, status, mandatory/optional counts | |
| 25 | Verify Decision Guidance | Green/amber/red based on readiness status | |
| 26 | Verify Critical Claims Highlight | 5 claims with checkmarks/bars | |
| 27 | Expand "All 10 Capabilities" | All claims with labels and percentages | |
| 28 | Verify Known Limitations section | 4 limitations listed | |
| 29 | Verify Improvement Actions | Site-facing actions in blue box | |
| 30 | Check for prohibited language | No "verified", "certified", "guaranteed", "trust score" | |

### Phase 4: API Validation (if Supabase available)

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 31 | POST /api/v1/readiness/evaluate { programTypeKey: "readiness_hybrid_trial", source: "onboarding_answers", answers: {...} } | 200 with evaluation data | |
| 32 | Verify persisted: false | Honest non-persistence | |
| 33 | Verify warnings array | 3 warnings present | |
| 34 | Verify verifiableVia | "onboarding-answers://hybrid-trial/{orgId}" | |
| 35 | Verify caps applied | Class B → ≤0.40, B+C → ≤0.65 | |
| 36 | POST with source: "evidence_nodes" (existing behavior) | 200 with DB-backed evaluation | |

### Phase 5: Export/Share

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 37 | Click "Export as PDF" on Passport | Browser print dialog opens | |
| 38 | Click "Share Passport" | URL copied to clipboard | |

---

## Known Limitations (Communicate to Vilo)

1. **Evidence not persisted in database**: Readiness evaluation uses onboarding answers. Evidence nodes are not created automatically. Confidence for self-declared claims is capped at 40%.
2. **No automated document-to-evidence conversion**: Uploading a document does not automatically convert a claim from "Declared only" to "Supported by evidence."
3. **No sponsor portal**: The Passport is the primary sponsor-facing output. No separate sponsor dashboard exists.
4. **Historical experience claims**: Require ClinicalTrials.gov references or operational records. Self-declaration is capped at 25%.
5. **Sponsor due diligence still required**: This assessment does not replace protocol-specific qualification or regulatory compliance verification.

---

## Success Criteria for Pilot

- [ ] Vilo completes Hybrid Trial onboarding in ≤ 20 minutes
- [ ] All gates function correctly (modules appear/disappear based on answers)
- [ ] N/A handling works (closed gates do not penalize readiness)
- [ ] Completion button works and completion-gate recognizes hybrid-trial
- [ ] Passport section 4.5 renders correctly
- [ ] Decision guidance is clear and actionable
- [ ] No certification language in any output
- [ ] All 259 automated tests pass
- [ ] Vilo can export/share the Passport

## Post-Pilot Backlog

1. Evidence node persistence from onboarding answers
2. Document-to-evidence automatic conversion
3. API persist=true full implementation
4. Sponsor-facing API/webhook for programmatic readiness queries
5. PDF/export specifically for Hybrid Trial Package
6. Document upload CTA from within hybrid-trial interview
