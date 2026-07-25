# Discovery Readiness — Conceptual Specification

**Status:** Product concept — no implementation changes required

---

## Definition

Discovery Readiness answers the question: **"How attractive is this institution to sponsors today?"**

It is NOT another compliance score. It is a composite indicator that measures how ready an institution is to be discovered, evaluated, and selected by sponsors.

## Core Principle

A site may be clinically excellent but undiscoverable. Discovery Readiness bridges the gap between institutional quality and sponsor perception.

## Contributing Factors

| Factor | Weight (conceptual) | Source | Description |
|--------|--------------------|--------|-------------|
| Profile Completeness | 20% | Institution Profile | What % of profile fields are populated with verified data |
| Evidence Coverage | 25% | Evidence Graph | What % of claimed capabilities have supporting evidence |
| Credential Validity | 15% | Credential Registry | Active vs expired credentials; gaps in critical certs |
| Operational Metrics | 15% | Metrics Pipeline | Enrollment performance, activation speed, retention |
| Recruitment Capability | 10% | Patient Panel + Diversity | Panel size, therapeutic match, diversity demographics |
| Passport Completeness | 10% | Passport | Published passport coverage, freshness, share grants |
| Data Freshness | 5% | All sources | Recency of evidence updates, metric timestamps |

## Scoring Model (Conceptual)

```
Discovery Readiness Score = Σ(factor_score × factor_weight)

Each factor_score = 0–100 based on:
  - 0–30: Minimal or no data
  - 31–60: Partial data with gaps
  - 61–85: Good coverage with verified evidence
  - 86–100: Excellent coverage, recently verified, confidence high
```

The score is a **dynamic indicator**, not a static certification. It changes as new evidence is added, credentials expire, and operational metrics update.

## Display

```
Discovery Readiness
Score: 72/100  ▲ +5 this month

Breakdown:
  Profile Completeness    85%  ▲ +2
  Evidence Coverage       68%  ▼ -1  ← Needs attention
  Credential Validity     55%  ▲ +8  ← Recently renewed IATA
  Operational Metrics     70%  = 
  Recruitment Capability  65%  ▲ +3
  Passport Completeness   90%  = 
  Data Freshness          92%  ▲ +1

Top Improvements:
  1. Add evidence for: Remote Monitoring capability
  2. Renew IATA certification (expiring Sep 2026)
  3. Complete PBMC Processing claim
```

## Relationship to Existing Implementation

| Component | Existing Implementation | Gap |
|-----------|----------------------|-----|
| Profile Completeness | Organizations table + onboarding steps | No completeness % calculation |
| Evidence Coverage | evidence-core queries | Computable — new query needed |
| Credential Validity | (No credential table) | 🔴 New concept |
| Operational Metrics | (No metrics pipeline) | 🔴 New concept |
| Recruitment Capability | Discovery + Readiness tables | Partial — needs integration |
| Passport Completeness | passport_entries | Computable |
| Data Freshness | updated_at timestamps | Computable |

## MVP Implementation Path

1. **Phase 1**: Calculate Evidence Coverage from existing data (evidence_nodes per claim)
2. **Phase 2**: Add Profile Completeness from onboarding progress
3. **Phase 3**: Add Passport Completeness from passport_entries
4. **Phase 4**: Add Credential Validity after Credential Registry is built
5. **Phase 5**: Add Operational Metrics after Metrics pipeline is built
6. **Phase 6**: Full weighted score with UI visualization

The Discovery Readiness score can be shown incrementally — each phase adds a new factor to the score without breaking previous factors.
