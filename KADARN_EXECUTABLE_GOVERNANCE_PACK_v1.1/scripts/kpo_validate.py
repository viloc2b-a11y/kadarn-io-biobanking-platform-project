#!/usr/bin/env python3
"""Risk-calibrated validator for KADARN Work Order records."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

import yaml

FULL_SHA = re.compile(r"^[0-9a-f]{40}$")
REQUIRED_CONTRACT = (
    "id", "version", "title", "program", "workstream", "priority",
    "risk_class", "objective", "scope", "repository", "paths", "deliverables",
    "acceptance_criteria", "validation_commands", "evidence_requirements",
    "rollback", "human_gate", "final_report",
)
REQUIRED_STATE = (
    "id", "version", "state", "admissible_transitions", "dependencies",
    "blockers", "accepted_evidence",
)


@dataclass
class Finding:
    severity: str
    code: str
    record: str
    message: str


def load_yaml(path: Path):
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def get_changed_paths(root: Path) -> list[str]:
    proc = subprocess.run(
        ["git", "diff", "--name-only", "HEAD^", "HEAD"],
        cwd=root, text=True, capture_output=True, check=False
    )
    return proc.stdout.splitlines() if proc.returncode == 0 else []


def missing(obj: dict, fields, allow_empty=()) -> list[str]:
    return [
        field for field in fields
        if field not in obj
        or obj[field] in (None, "")
        or (obj[field] == [] and field not in allow_empty)
    ]


def effective_mode(root: Path, requested: str, profile: dict) -> str:
    protected = tuple(profile.get("protected_paths", []))
    changed = get_changed_paths(root)
    if requested != "advisory" and any(p.startswith(protected) for p in changed):
        return "protected"
    return requested


def validate_record(directory: Path, mode: str, profile: dict) -> list[Finding]:
    findings: list[Finding] = []
    contract_path = directory / "work-order.yml"
    state_path = directory / "state.yml"
    evidence_path = directory / "EVIDENCE_INDEX.md"
    record = directory.name

    for path in (contract_path, state_path, evidence_path):
        if not path.exists():
            findings.append(Finding("error", "KPO001", record, f"Missing {path.name}"))
    if findings:
        return findings

    try:
        contract, state = load_yaml(contract_path), load_yaml(state_path)
    except yaml.YAMLError as exc:
        return [Finding("error", "KPO002", record, f"Invalid YAML: {exc}")]

    incomplete_severity = "warning" if mode == "advisory" else "error"
    for field in missing(contract, REQUIRED_CONTRACT):
        findings.append(Finding(incomplete_severity, "KPO003", record, f"Contract field missing: {field}"))
    for field in missing(
        state, REQUIRED_STATE,
        allow_empty=("dependencies", "blockers", "accepted_evidence"),
    ):
        findings.append(Finding(incomplete_severity, "KPO004", record, f"State field missing: {field}"))

    if contract.get("id") != state.get("id") or contract.get("version") != state.get("version"):
        findings.append(Finding("error", "KPO005", record, "Contract/state identity mismatch"))

    repo = contract.get("repository") or {}
    for field in ("target", "base_branch", "working_branch", "expected_head"):
        if not repo.get(field):
            findings.append(Finding(incomplete_severity, "KPO006", record, f"Repository coordinate missing: {field}"))
    head = repo.get("expected_head")
    if head and not FULL_SHA.match(str(head)):
        findings.append(Finding("error", "KPO007", record, "expected_head must be a full 40-character SHA"))

    risk = contract.get("risk_class", "standard")
    protected_risks = profile.get("protected_risk_classes", [])
    gate = contract.get("human_gate") or {}
    executable = state.get("state") in profile.get("executable_states", [])
    if (mode == "protected" or risk in protected_risks) and executable:
        if not gate.get("required") or not gate.get("decision_ref"):
            findings.append(Finding("error", "KPO008", record, "Protected execution requires a recorded Human Gate decision"))

    requested = state.get("requested_transition")
    if requested and requested not in state.get("admissible_transitions", []):
        findings.append(Finding("error", "KPO009", record, f"Transition '{requested}' is not admissible"))

    if state.get("blockers") and executable:
        findings.append(Finding("error", "KPO010", record, "Executable Work Order has active blockers"))

    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--mode", choices=("advisory", "required", "protected"), default="advisory")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    profile_path = root / "governance/kpo/KPO_GOVERNANCE_PROFILE.yml"
    if not profile_path.exists():
        print(f"ERROR KPO000: missing {profile_path}", file=sys.stderr)
        return 2
    profile = load_yaml(profile_path)
    mode = effective_mode(root, args.mode, profile)
    records_root = root / "governance/work-orders"
    findings: list[Finding] = []
    records = [p for p in records_root.iterdir() if p.is_dir() and p.name != "_template"] if records_root.exists() else []
    if not records:
        severity = "warning" if mode == "advisory" else "error"
        findings.append(Finding(severity, "KPO011", str(records_root), "No individual Work Order records found"))
    for directory in sorted(records):
        findings.extend(validate_record(directory, mode, profile))

    result = {"mode": mode, "records": len(records), "findings": [asdict(f) for f in findings]}
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"KPO validation mode={mode} records={len(records)}")
        for finding in findings:
            print(f"{finding.severity.upper()} {finding.code} [{finding.record}] {finding.message}")
        if not findings:
            print("PASS: governance records are valid")
    return 1 if any(f.severity == "error" for f in findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
