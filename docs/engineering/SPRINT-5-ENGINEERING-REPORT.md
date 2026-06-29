# Sprint 5 — Engineering Report

**Program:** Kadarn v1.0 Hardening  
**Sprint:** Provenance Everywhere  
**Version:** `1.0.0-hardening.5`  
**Date:** 2026-06-28  
**Gate status:** PASS (`npm run verify`)

---

## Objective

Every critical operation generates provenance evidence. No critical mutation without traceability.

**Gate:** No critical operation exists without provenance recording.

---

## Root causes fixed

| Issue | Evidence | Fix |
|-------|----------|-----|
| `ProvenanceRecordRequested` events never persisted | Sprint 4 deferred consumer | `provenance-recorder.ts` dual-writes: event + `upsert_provenance_node` |
| Invalid `node_type` values rejected by RPC | Helpers used `collection_twin`, `discovery_search`, etc. | Migration 037 extends enum; twins use `twin_event` |
| Gaps on lifecycle mutations | Deal PATCH, request approve/reject, shipment status, specimen twin | New recorders + route hooks |
| Workflow had events only | `WorkflowSignalRequested` without graph node | `recordWorkflowProvenance` in `signalExchangeRequestWorkflow` |
| Policy shadow had no graph evidence | `PolicyShadowEvaluated` only | `recordPolicyEvaluationProvenance` in policy bridge |
| Discovery GET recorded fake provenance | Read-only catalog searches | Removed from search/specimens GET routes |

---

## Architecture

```
Route (mutation success)
  → record*Provenance() in provenance-recorder.ts
      ├─ publishIntegrationEvent('ProvenanceRecordRequested')  → domain_event_store
      └─ persistProvenanceNode() → upsert_provenance_node RPC   → provenance_nodes
```

Central module: `apps/api/src/lib/provenance-recorder.ts`  
Domain wrappers: `exchange-helper.ts`, `logistics-helper.ts`, `onboarding.ts`

---

## Critical operation coverage

| Domain | Operations | Recorder |
|--------|------------|----------|
| **Exchange** | Create request, approve/reject, create deal, update deal, feasibility | `recordExchangeRequestProvenance`, `recordAccessRequestDecisionProvenance`, `recordDealProvenance`, `recordDealUpdateProvenance`, `recordFeasibilityProvenance` |
| **Workflow** | Exchange request submit signal | `recordWorkflowProvenance` (via `signalExchangeRequestWorkflow`) |
| **QC** | Aliquot QC status change | `recordQcProvenance` |
| **Shipment** | Create + status/custody change + twin sync | `recordShipmentProvenance`, `recordShipmentStatusProvenance`, `recordTwinSyncProvenance` |
| **Payments** | Settlement initiate + status change | `recordSettlementProvenance` |
| **Twins** | Collection + specimen twin creation | `recordCollectionProvenance`, `recordSpecimenTwinProvenance` |
| **Policy** | OPA shadow evaluation | `recordPolicyEvaluationProvenance` |
| **Analytics / Knowledge / Twins dashboards** | GET-only aggregations | Exempt (KAA-003 — no mutation) |

---

## Migration 037

Extends `provenance_node_type` enum:

- `feasibility_assessment`
- `exchange_deal`
- `settlement`
- `workflow_activity`
- `twin_event`

Mirrored: `supabase/migrations/037_provenance_sprint5_types.sql`

---

## Tests

| Test | Count | Location |
|------|-------|----------|
| Sprint 5 static gate | 25 | `tests/hardening/sprint5-provenance.test.ts` |
| Provenance append-only (existing) | 16 | `tests/provenance/provenance-append-only.test.ts` |
| Integration route checks | updated | `onboarding-flow`, `qc-route`, `financial-engine` |

---

## Verification (2026-06-28)

```
npm run verify                              → PASS
Migration parity                            → 37/37 identical
tests/hardening/sprint5-provenance.test.ts  → 25 tests PASS
Total offline gate                          → 470 passed, 38 skipped
```

---

## Follow-ups (Sprint 6+)

- Outbox worker for async provenance retry when RPC fails mid-request
- Provenance edges linking lifecycle nodes (request → deal → settlement)
- Extend gate to programs/participants/capabilities mutations
