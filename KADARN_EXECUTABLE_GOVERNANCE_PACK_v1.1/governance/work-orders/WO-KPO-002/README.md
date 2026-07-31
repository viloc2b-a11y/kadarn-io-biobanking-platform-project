# WO-KPO-002 — Integration Record Bootstrap

This directory is intentionally non-executable until the target checkout is
verified. Run `install-kpo.ps1` in dry-run mode against the real repository,
then replace every `VERIFY_AT_EXECUTION` value in the contract and record the
Human Gate decision before changing the state to `authorized`.

This prevents a stale SHA or branch assumption from becoming an executable
contract while still providing the exact integration record to complete.
