# KADARN Executable Governance Pack v1.0

This package converts KADARN's canonical documentation into executable controls
without turning routine development into a permanent blocking ceremony.

## Operating model

| Mode | Intended use | Missing non-critical fields |
| --- | --- | --- |
| `advisory` | drafts, discovery, local experiments | warning |
| `required` | implementation and pull requests | error |
| `protected` | production, security, migrations, regulated data | error plus explicit Human Gate |

Risk, not bureaucracy, determines strictness. A Work Order can begin as a draft,
be validated locally, and become strict automatically at the PR or protected
operation boundary.

## Install

On the Windows checkout, run a non-mutating preflight first:

```powershell
.\install-kpo.ps1 -RepositoryRoot "D:\path\to\kadarn-platform"
```

If it reports `DRY RUN PASS`, apply the overlay:

```powershell
.\install-kpo.ps1 -RepositoryRoot "D:\path\to\kadarn-platform" -Apply
```

The installer refuses to overwrite non-identical files and never stages,
commits, pushes, or merges. For a manual installation, copy the contents of
this directory into the repository root and run:

```bash
python -m pip install PyYAML
python scripts/kpo_validate.py --root . --mode advisory
python -m unittest discover -s tests/kpo -p "test_*.py"
```

The included GitHub workflow runs `required` validation on pull requests and
automatically upgrades to `protected` when protected paths are changed.

## Create a Work Order

Copy `governance/work-orders/_template/` to a unique Work Order directory.
The validator accepts `draft` records in advisory mode but does not accept them
for protected execution.

## Practical rule

- Keep moving with warnings during discovery and drafting.
- Require a complete contract before code is merged.
- Require explicit Human Gate evidence only for external or protected actions.
- Never silently infer repository coordinates for an executable action.

See `governance/kpo/KPO_GOVERNANCE_PROFILE.yml` for configurable policy.

`governance/work-orders/WO-KPO-002/` is a blocked integration record. Complete
its verified baseline and Human Gate fields in the target checkout before
authorizing execution.
