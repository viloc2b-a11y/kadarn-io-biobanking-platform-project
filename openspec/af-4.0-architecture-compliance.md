# AF-4.0 Architecture Compliance (Sprint 8)

## CI gates

| Gate | Script | Workflow |
|------|--------|----------|
| Architecture | `npm run arch:gate` | `.github/workflows/architecture.yml` |
| Terminology | `scripts/terminology-lint.sh` | architecture.yml |
| Cross-doc | `scripts/cross-doc-consistency.sh` | architecture.yml |

## Checks

- ADR/KEMS registry present
- `@kadarn/instrumentation` exists
- No direct `continuity_experience_claims` reads in v1 API
- Lexicon forbidden terms

## Evidence Core guard

Routes must use Published View for external claim surfaces (ADR-030).

## Gate

- [x] `scripts/arch-gate.sh`
- [x] CI workflow
