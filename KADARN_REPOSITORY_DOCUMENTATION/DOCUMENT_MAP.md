# KADARN — Canonical Document Map

This map prevents planning documents, evidence models, blueprints, audits, and research from being treated as equivalent authorities.

| Order | Path | Role | Authority | How an AI should use it |
|---:|---|---|---|---|
| 0 | `START_HERE.md` | Entry point | Operational navigation | Read first in every session |
| 1 | `PROJECT_STATE.md` | Current continuation state | Human-maintained operational record | Determine where work resumes |
| 2 | `docs/01-canonical/master-plan/Kadarn_Master_Work_Plan_v1.0.md` | Master planning baseline | Accepted canonical planning source, subject to later Human decisions | Understand scope, sequence, additions, modifications, and archives |
| 3 | `docs/01-canonical/evidence-model/KEMS-001_Confidence_Graph_Model_v1.0.md` | Foundational evidence model | Accepted canonical domain model | Control claims, evidence classes, relationships, confidence, response, and decay |
| 4 | `docs/02-blueprints/kadarn_evidence_blueprint.md` | Operational/data blueprint | Accepted implementation blueprint | Translate evidence doctrine into objects, statuses, workflows, and MVP behavior |
| 5 | `docs/03-audits/vilo-capture-model-audit.md` | Capture/readiness audit | Accepted advisory evidence | Correct evidence capture, conditional requirements, and readiness modeling |
| 6 | `docs/04-validation/publication-delivery-layer-validation.md` | Delivery-layer validation | Supporting validation | Guide publication and delivery architecture |
| 7 | `docs/04-validation/sponsor-delivery-model-validation.md` | Audience delivery validation | Supporting validation | Guide outputs for sponsors, CROs, vendors, auditors, and sites |
| 8 | `docs/04-validation/web-reference-detection-validation.md` | Multisource discovery validation | Supporting validation | Guide future web-source discovery implementation |
| 9 | `docs/99-source-archive/` | Original supplied files | Preservation only | Do not use as the primary working copy |

## Authority labels

- **Canonical:** controls design or planning unless superseded by a later Human Gate decision.
- **Blueprint:** translates canonical intent into a proposed operational form; validate against code before calling it implemented.
- **Audit:** identifies defects and recommendations; not self-authorizing.
- **Validation:** research-backed advice; not self-authorizing.
- **Archive:** preservation copy; never the preferred edit target.

## Topic routing

| If the task concerns… | Read first |
|---|---|
| Current status or next task | `PROJECT_STATE.md` |
| Claims, evidence, confidence, contradictions, decay | KEMS-001 |
| Data objects, JSON shape, evidence workflow | Evidence Blueprint |
| Overall sequence, terminology changes, documents to add/archive | Master Work Plan |
| Onboarding questions, document capture, conditional evidence | Vilo capture-model audit |
| Sponsor/site delivery packages and publication | Delivery validation reports |
| External web references and discovery sources | Web-reference validation report |

## Supersession rule

Never delete a prior canonical document merely because a newer decision exists. Mark it superseded, record the controlling decision, and retain it in history. Update this map whenever authority changes.

