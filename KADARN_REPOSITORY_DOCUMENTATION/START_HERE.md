# KADARN — Start Here

This is the mandatory entry point for every human or AI working on KADARN.

## Project identity

KADARN is an institution-first evidence and readiness platform for clinical-research organizations, with an initial commercial focus on biospecimen collection, IVD/diagnostics, biobanking, translational research, and research sites.

The product does not certify institutions. It organizes institution-owned claims and evidence, preserves provenance, represents contradictions, and produces explainable confidence and readiness projections.

## Human decision controlling this documentation

On 2026-07-28, the project owner accepted the Claude-produced documents supplied in this package as correct for organizational purposes and directed that work stop revolving around repeated document revalidation. The immediate priority is to make the repository understandable and navigable.

This acceptance does not convert every research recommendation into implemented software. Document authority and implementation status are separate.

## Read in this order

1. `PROJECT_STATE.md` — where the project is now and the next action.
2. `DOCUMENT_MAP.md` — what each document means and its authority.
3. `docs/01-canonical/master-plan/Kadarn_Master_Work_Plan_v1.0.md`
4. `docs/01-canonical/evidence-model/KEMS-001_Confidence_Graph_Model_v1.0.md`
5. `docs/02-blueprints/kadarn_evidence_blueprint.md`
6. Only then read the relevant validation or research report for the task.

## Working rule

Before changing code or documentation:

1. Identify the requested outcome.
2. Read `PROJECT_STATE.md`.
3. Find the controlling document in `DOCUMENT_MAP.md`.
4. Inspect the current implementation and tests.
5. Classify the requested item as `IMPLEMENTED`, `DECIDED_NOT_IMPLEMENTED`, `PLANNED`, `INFERRED`, or `UNKNOWN`.
6. Do not present plans, mockups, research recommendations, or document language as deployed behavior.
7. Update `PROJECT_STATE.md` when a material milestone or decision changes the continuation point.

## Precedence

When records disagree, use this order:

1. Explicit Human Gate decisions.
2. Accepted per-Work-Order records and evidence, when present.
3. Current implementation, schemas, migrations, tests, and deployment configuration.
4. Canonical documents listed in `DOCUMENT_MAP.md`.
5. Blueprints.
6. Audits and validation reports.
7. Research reports and historical source copies.

Do not silently merge contradictions. Record them in `PROJECT_STATE.md` under “Open gaps and contradictions.”

