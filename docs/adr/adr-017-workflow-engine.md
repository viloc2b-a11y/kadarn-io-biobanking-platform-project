# ADR-017: Workflow Engine 2.0 — Dynamic, Policy-Driven Orchestration

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn's existing workflows (program lifecycle, access requests) are
hardcoded in service logic. They cannot be modified without code changes,
do not invoke the Policy Engine, and have no versioning.

KRM-RAO (§5.3) defines the Workflow Engine as responsible for dynamic,
policy-driven workflow orchestration. The Policy Engine (ADR-010) now
exists — the Workflow Engine must integrate with it at every decision
point.

---

## Decision: Build Workflow Engine 2.0 with Policy Integration

### 1. Data Model

**WorkflowDefinition** — versioned template:
- id, name, version, status (draft/active/deprecated)
- steps[]: ordered list of step definitions
- Each step: id, type (human_task, policy_check, auto_action, sub_workflow),
  config, assignee_role, timeout

**WorkflowInstance** — running instance of a definition:
- id, definition_id, status, context (JSONB), current_step
- Supports suspend, resume, cancel

**WorkflowTask** — individual task within a workflow:
- id, instance_id, step_id, status, assigned_to, completed_at

### 2. Policy Integration

Every `policy_check` step calls the Policy Engine:
- Assembles context from workflow context + step data
- Passes to `PolicyEngine.evaluate()`
- Allow: continues to next step
- Deny: transitions to `blocked` status
- Conditional: routes to human review task

### 3. Engine API

- `createDefinition(name, steps, version)` — register a new workflow
- `startInstance(definitionId, context, actorId)` — begin a workflow
- `getNextStep(instanceId)` — determine the next pending step
- `completeTask(taskId, result, actorId)` — finish a task, advance workflow
- `suspendInstance / resumeInstance / cancelInstance`
- `getInstanceHistory(instanceId)` — audit trail of all steps completed

---

## Consequences

### Positive

- Workflows become data — changeable without code deploys
- Policy integration at every decision point
- Full audit trail of workflow execution

### Negative

- Requires workflow definition UI (future)
- Complex workflows need careful step design
