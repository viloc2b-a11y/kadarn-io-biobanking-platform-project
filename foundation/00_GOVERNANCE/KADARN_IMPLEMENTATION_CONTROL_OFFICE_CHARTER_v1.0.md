# KADARN Implementation Control Office Charter v1.0

**Document ID:** KADARN-ICO-001  
**Status:** Canonical — Materialized  
**Owner:** KADARN Program Direction

## 1. Mandate
The Implementation Control Office (ICO) is the governance function responsible for controlling, measuring and auditing execution under KOSRA, the Canonical Execution Plan and KIMP. It is a governance model, not a new software product or organizational bureaucracy.

## 2. Mission
Ensure that every implementation action is authorized, baseline-aware, architecturally compliant, evidence-backed, reversible where necessary and accepted through the human gate.

## 3. Responsibilities
1. Portfolio management.
2. Architecture compliance.
3. Evidence and quality gates.
4. Open-source governance.
5. Roadmap and metric governance.
6. Dependency and risk control.
7. Canonical status reporting.

## 4. Decision rights
The ICO may recommend prioritization, block non-compliant Work Orders, require corrections, demand evidence, and prevent progression across gates. It does not unilaterally change product strategy, architecture, canonical baselines or external authorization.

## 5. Operating roles
- **GPT Work:** planning, drafting Work Orders, reviewing reports and recommending decisions.
- **Human Gate:** final authorization for execution, external actions, acceptance and progression.
- **Hermes Gateway:** contract validation, identity, persistence and status transport.
- **Hermes:** state inspection, compatibility checks, execution governance and evidence consolidation.
- **Gentle AI:** bounded technical execution and test evidence.
- **GitHub:** transport and audit trail, not decision authority.

## 6. Control boards
- Portfolio Board.
- Architecture Compliance Board.
- Evidence & Quality Board.
- OSS Review Board.
- Release Readiness Board.

These may be implemented as review checkpoints rather than standing meetings.

## 7. Required registers
- Work Order Register.
- Decision Register.
- Dependency Register.
- Risk and Exception Register.
- OSS Candidate Register.
- Evidence Package Index.
- Baseline and Release Register.

## 8. Gate model
Intake → Baseline → Authorization → Execution → Verification → Human acceptance → Closure.

## 9. Status vocabulary
DRAFT, READY_FOR_AUTHORIZATION, AUTHORIZED, IN_PROGRESS, BLOCKED, READY_FOR_REVIEW, CORRECTION_REQUIRED, APPROVED, REJECTED, SUPERSEDED, CLOSED.

## 10. Metrics
Portfolio throughput, lead time, blocked time, acceptance rate, correction rate, baseline freshness, evidence completeness, test preservation, architecture exceptions, OSS evaluation outcomes, rollback readiness and escaped defects.

## 11. Anti-bureaucracy rules
Controls must be proportional to risk. Documentation must reuse evidence already produced. No board may require duplicate reports. Small reversible work should remain lightweight. The ICO exists to accelerate safe delivery, not to delay it.

---

**Document references:** KOSRA v0.2 (`foundation/05_ENGINEERING/architecture/KOSRA.md`), CEP (`foundation/05_ENGINEERING/architecture/KADARN_CANONICAL_EXECUTION_PLAN_v1.0.md`), KIMP (`foundation/00_GOVERNANCE/KADARN_IMPLEMENTATION_MASTER_PLAN_v1.0.md`).
