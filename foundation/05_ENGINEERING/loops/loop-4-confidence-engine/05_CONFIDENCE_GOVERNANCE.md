# KAD-LOOP-004 — Phase 2: Confidence Governance

## Model Lifecycle

```
draft → active → deprecated → retired
```

- New models start in **draft**
- Activation validates: model exists, rules exist, effective dates valid, methodology complete
- **Active models are immutable** — changes require a new version
- Deprecation preserves historical assessments
- Only one active version per tenant (overlapping active versions are rejected)
- Retired models have all assessments superseded

## Rule Lifecycle

```
draft → active → deprecated → retired
```

- Draft rules may be edited (PATCH)
- Active rules are immutable where required
- Inactive rules excluded from calculations
- Each rule has explicit: effect_type (positive/penalty/blocker), effect_value, blocking_behavior, priority, effective dates
- No anonymous scoring rules — every factor traces to a rule_id

## Repository Methods
- `ConfidenceModelRepository.activate(id)` — sets status='active', validates preconditions
- `ConfidenceModelRepository.deprecate(id)` — sets status='deprecated'
- `ConfidenceRuleRepository.activate(id)` / `deactivate(id)` — rule-level lifecycle

## Governance Rules
1. Cannot edit active model methodology — only metadata (description, effective_until)
2. Activation requires at least one active rule
3. Overlapping active model → conflict (409)
4. Model version is auto-incremented on new activation