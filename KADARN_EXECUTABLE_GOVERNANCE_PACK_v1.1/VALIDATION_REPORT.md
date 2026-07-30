# Validation Report — v1.1

Date: 2026-07-28

## Result

PASS

## Verified behavior

1. A complete draft passes advisory validation.
2. An incomplete draft produces warnings without stopping local progress.
3. A protected executable Work Order without a recorded Human Gate fails.
4. A contract/state identity mismatch fails in every mode.
5. An empty repository produces a warning in advisory mode.
6. An empty repository fails in required mode.
7. The packaged WO-KPO-002 remains blocked until the target SHA is verified.
8. The installer defaults to dry-run and refuses non-identical overwrites.
9. The installer never stages, commits, pushes, or merges.

## Commands

```bash
python -m unittest discover -s tests/kpo -p "test_*.py"
python scripts/kpo_validate.py --root . --mode advisory
python scripts/kpo_validate.py --root . --mode required
```

## Observed exit codes

- tests: `0`
- package advisory validation: `0`, with one expected baseline warning
- unit tests: `4/4 passed`
- PowerShell runtime validation: not available in this Linux container

This proves the package allows drafting and discovery while preserving hard
gates at integration and protected-operation boundaries. The PowerShell
installer was statically reviewed; its live preflight must run against the
Windows checkout before application.
