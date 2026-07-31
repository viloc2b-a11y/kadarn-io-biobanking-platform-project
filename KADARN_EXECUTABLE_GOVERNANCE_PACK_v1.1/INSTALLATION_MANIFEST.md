# Installation Manifest

Preferred Windows installation:

```powershell
.\install-kpo.ps1 -RepositoryRoot "D:\path\to\kadarn-platform"
.\install-kpo.ps1 -RepositoryRoot "D:\path\to\kadarn-platform" -Apply
```

The first command is a dry run. The second copies only these paths:

- `.github/workflows/kpo-governance.yml`
- `docs/governance/KPO_PRACTICAL_EXECUTION_POLICY.md`
- `governance/kpo/KPO_GOVERNANCE_PROFILE.yml`
- `governance/work-orders/_template/`
- `scripts/kpo_validate.py`
- `tests/kpo/test_kpo_validate.py`

Do not overwrite an existing Work Order record. Merge the profile with any
existing canonical KPO policy and preserve the higher-precedence Human Gate
decisions.

The packaged `WO-KPO-002` record documents the integration gate but is not
copied by the installer while its target SHA and decision reference remain
unverified.

Recommended integration branch:

`feat/kpo-executable-governance`

Recommended acceptance commands:

```bash
python -m pip install PyYAML
python scripts/kpo_validate.py --root . --mode advisory
python -m unittest discover -s tests/kpo -p "test_*.py"
```
