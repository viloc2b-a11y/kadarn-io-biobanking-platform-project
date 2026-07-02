---
name: 4r-review
description: Pre-PR review pipeline — 5 domain advisors (security, AI, compliance, CICD, clinical), 4 standard review lenses (risk, readability, reliability, resilience), and final engineering quality review (architecture, testing, database, performance).
---

## kadarn.security-advisor

output: review-security-report.md
outputMode: file-only
progress: true

Run R0 Security Advisor review on the current diff for Kadarn-specific domains:
HIPAA (clinical data/ePHI), GDPR (personal data), and multi-tenant access control
(Supabase RLS, function-level access, cross-tenant leakage).
Report findings with severity: BLOCKER | CRITICAL | WARNING | SUGGESTION.
If clean, say exactly: `No findings.`

## kadarn.ai-security-advisor

reads: review-security-report.md
output: review-ai-security-report.md
outputMode: file-only
progress: true

Run R0-AI AI Security Advisor review on the current diff for AI-specific domains:
LLM guardrails, agentic AI tool invocation, and RAG prompt injection.
Read the prior security report for cross-domain context (e.g., AI + clinical data).
Report findings with severity: BLOCKER | CRITICAL | WARNING | SUGGESTION.
If clean, say exactly: `No findings.`

## kadarn.compliance-advisor

reads: review-security-report.md+review-ai-security-report.md
output: review-compliance-report.md
outputMode: file-only
progress: true

Run R0-C Compliance Advisor review on the current diff for compliance-specific domains:
SOC2 Type II audit preparation, Privacy Impact Assessments, and GDPR Data Subject
Access Requests. Read the prior security and AI reports for cross-domain context
(e.g., a security finding may trigger a PIA or SOC2 control requirement).
Report findings with severity: BLOCKER | CRITICAL | WARNING | SUGGESTION.
If clean, say exactly: `No findings.`

## kadarn.cicd-advisor

reads: review-security-report.md+review-ai-security-report.md+review-compliance-report.md
output: review-cicd-report.md
outputMode: file-only
progress: true

Run R0-D CICD Advisor review on the current diff for pipeline and supply chain domains:
GitHub Actions security (OIDC, action pins, least privilege workflows), supply chain
attack detection (dependency confusion, typosquatting), SBOM generation and analysis,
and secret scanning (Gitleaks, pre-commit hooks, CI gating).
Read the prior reports for cross-domain context.
Report findings with severity: BLOCKER | CRITICAL | WARNING | SUGGESTION.
If clean, say exactly: `No findings.`

## vilo.clinical-advisor

reads: review-security-report.md+review-compliance-report.md
output: review-clinical-report.md
outputMode: file-only
progress: true

Run R0-V Vilo Clinical Advisor review on the current diff for clinical domain:
biospecimen lifecycle (KRM-BNO phases, operational twins, chain of custody),
clinical data governance (PHI boundaries, data scope, FHIR mappings, consent),
and lab operations (processing, QC, storage, LIMS integration).
Read the prior security and compliance reports for cross-domain context
(e.g., a clinical data change likely has HIPAA and SOC2 implications).
Report findings with severity: BLOCKER | CRITICAL | WARNING | SUGGESTION.
If clean, say exactly: `No findings.`

## review-risk

reads: review-security-report.md+review-ai-security-report.md+review-compliance-report.md+review-cicd-report.md+review-clinical-report.md
output: review-risk-report.md
outputMode: file-only
progress: true

Run R1 Risk review on the current diff. Report security, privilege boundary, data exposure, dependency, and merge-blocking vulnerability findings. If clean, say exactly: `No findings.`

## review-readability

reads: review-risk-report.md
output: review-readability-report.md
outputMode: file-only
progress: true

Run R2 Readability review on the current diff. Report naming, complexity, intention, maintainability, review size, and context clarity findings. If clean, say exactly: `No findings.`

## review-reliability

reads: review-risk-report.md+review-readability-report.md
output: review-reliability-report.md
outputMode: file-only
progress: true

Run R3 Reliability review on the current diff. Report behavior-first test coverage, edge case, determinism, contract, and regression findings. If clean, say exactly: `No findings.`

## review-resilience

reads: review-risk-report.md+review-readability-report.md+review-reliability-report.md
output: review-resilience-report.md
outputMode: file-only
progress: true

Run R4 Resilience review on the current diff. Report fallback, retry/backoff, graceful degradation, observability, load, rollback, and SLO risk findings. If clean, say exactly: `No findings.`

## gentle.engineering-advisor

reads: review-security-report.md+review-ai-security-report.md+review-compliance-report.md+review-cicd-report.md+review-clinical-report.md+review-risk-report.md+review-readability-report.md+review-reliability-report.md+review-resilience-report.md
output: review-engineering-report.md
outputMode: file-only
progress: true

You are the final step in the review pipeline. Read ALL prior reports (5 domain + 4 review lenses) and inspect the diff for engineering quality issues not yet reported. Cover four areas:

1. **Architecture**: ADRs, engine boundaries, event-driven, Core/Service separation
2. **Testing**: coverage, integration patterns, edge cases, flakiness
3. **Database**: migration idempotence, RLS, naming, append-only, indexes
4. **Performance**: pagination, N+1, rate limiting, query efficiency

Do NOT repeat findings already reported by prior advisors. Report only new, transversal engineering quality findings. Severity: BLOCKER | CRITICAL | WARNING | SUGGESTION.
If the diff has no new findings, say exactly: `No findings.`
