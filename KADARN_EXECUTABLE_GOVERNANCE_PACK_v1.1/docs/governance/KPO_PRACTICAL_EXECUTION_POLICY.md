# KPO Practical Execution Policy v1.0

## Decision

KADARN governance is calibrated by risk and lifecycle stage. It must make unsafe
or untraceable changes difficult without making exploration and ordinary
development impossible.

## Always blocking

- contract/state identity mismatch;
- invalid YAML or corrupted primary records;
- an inadmissible lifecycle transition;
- protected execution without a recorded Human Gate;
- active blocker on an executable Work Order;
- a non-full or missing commit SHA at execution time;
- writes outside explicitly authorized paths for protected work.

## Warning during drafting, blocking at PR

- missing scope exclusions;
- missing acceptance criteria;
- missing validation commands;
- missing evidence requirements;
- stale derived projections;
- incomplete repository coordinates.

These are warnings only in `advisory` mode. They become errors in `required` and
`protected` modes.

## Human Gate boundary

A Human Gate is required for:

- push, PR creation, merge, release, deployment, or external transmission;
- changes to security, tenant isolation, authentication, authorization, or
  regulated-data handling;
- database/schema migration;
- destructive or difficult-to-recover operations;
- accepting evidence or changing a governed lifecycle state.

It is not required for:

- reading and discovery;
- local drafts;
- local tests and static analysis;
- generating a proposed Work Order;
- producing a non-authoritative report.

## Evidence rule

CI output may validate technical claims, but it does not accept its own evidence.
Acceptance remains a recorded Human decision. Derived state can be regenerated
after acceptance; it never overrides the individual Work Order record.
