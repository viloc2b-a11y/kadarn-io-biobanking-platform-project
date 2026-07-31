import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

SCRIPT = Path(__file__).parents[2] / "scripts/kpo_validate.py"
SPEC = importlib.util.spec_from_file_location("kpo_validate", SCRIPT)
MOD = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MOD
SPEC.loader.exec_module(MOD)


class ValidatorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.record = self.root / "governance/work-orders/WO-TEST-001"
        self.record.mkdir(parents=True)
        self.profile = {
            "executable_states": ["authorized", "in_progress"],
            "protected_risk_classes": ["production", "schema_migration"],
        }
        self.contract = {
            field: "value" for field in MOD.REQUIRED_CONTRACT
        }
        self.contract.update({
            "id": "WO-TEST-001", "version": "1.0", "risk_class": "standard",
            "repository": {
                "target": "owner/repo", "base_branch": "master",
                "working_branch": "feat/test", "expected_head": "a" * 40,
            },
            "human_gate": {"required": False, "decision_ref": None},
        })
        self.state = {
            "id": "WO-TEST-001", "version": "1.0", "state": "draft",
            "requested_transition": "authorize",
            "admissible_transitions": ["authorize"], "dependencies": [],
            "blockers": [], "accepted_evidence": [],
        }

    def tearDown(self):
        self.tmp.cleanup()

    def write(self):
        (self.record / "work-order.yml").write_text(yaml.safe_dump(self.contract))
        (self.record / "state.yml").write_text(yaml.safe_dump(self.state))
        (self.record / "EVIDENCE_INDEX.md").write_text("# Evidence\n")

    def test_valid_draft_passes(self):
        self.write()
        self.assertEqual(MOD.validate_record(self.record, "advisory", self.profile), [])

    def test_incomplete_draft_warns_but_does_not_error(self):
        self.contract.pop("objective")
        self.write()
        findings = MOD.validate_record(self.record, "advisory", self.profile)
        self.assertTrue(any(f.code == "KPO003" and f.severity == "warning" for f in findings))
        self.assertFalse(any(f.severity == "error" for f in findings))

    def test_protected_execution_requires_gate(self):
        self.contract["risk_class"] = "production"
        self.state["state"] = "authorized"
        self.write()
        findings = MOD.validate_record(self.record, "protected", self.profile)
        self.assertTrue(any(f.code == "KPO008" and f.severity == "error" for f in findings))

    def test_identity_mismatch_is_always_error(self):
        self.state["id"] = "WO-WRONG"
        self.write()
        findings = MOD.validate_record(self.record, "advisory", self.profile)
        self.assertTrue(any(f.code == "KPO005" and f.severity == "error" for f in findings))


if __name__ == "__main__":
    unittest.main()
