// Kadarn Proof of Execution — Document Generator
// Compiles data from all engines into a structured audit-ready report.

export interface KpeRequest {
  programId: string;
  programName: string;
  organizations: { id: string; name: string; role: string }[];
  specimens: { total: number; collected: number; qcPassed: number; qcFailed: number; consumed: number };
  shipments: { total: number; completed: number; breached: number; disputed: number };
  transactions: { total: number; completed: number; disputed: number };
  exceptions: { total: number; critical: number; warnings: number; items: string[] };
  policies: { applied: number; allowed: number; denied: number; conditionals: number };
  evidence: { documents: number; qcReports: number; logs: number; agreements: number };
  trust: { avgOrgTrust: number; minTrust: number; maxTrust: number };
  timeline: { start: string; end: string; duration: string };
  compliance: { status: string; gaps: string[]; readyForAudit: boolean };
}

export function generateKpe(data: KpeRequest): string {
  const d = data;
  const sections = [
    `╔═══════════════════════════════════════════════════════╗`,
    `║     KADARN PROOF OF EXECUTION REPORT v1.0            ║`,
    `╚═══════════════════════════════════════════════════════╝`,
    ``,
    `Program: ${d.programName} (${d.programId})`,
    `Period: ${d.timeline.start} — ${d.timeline.end} (${d.timeline.duration})`,
    `Status: ${d.compliance.status}`,
    `Ready for Audit: ${d.compliance.readyForAudit ? 'YES' : 'NO'}`,
    `─────────────────────────────────────────────────────`,
    ``,
    `PARTICIPATING ORGANIZATIONS`,
    d.organizations.map(o => `  • ${o.name} — ${o.role}`).join('\n'),
    ``,
    `ASSETS MOVED`,
    `  Specimens: ${d.specimens.total} total (${d.specimens.collected} collected, ${d.specimens.qcPassed} QC pass, ${d.specimens.qcFailed} QC fail, ${d.specimens.consumed} consumed)`,
    `  Shipments: ${d.shipments.total} total (${d.shipments.completed} completed, ${d.shipments.breached} breached, ${d.shipments.disputed} disputed)`,
    `  Transactions: ${d.transactions.total} total (${d.transactions.completed} completed, ${d.transactions.disputed} disputed)`,
    ``,
    `EXCEPTIONS`,
    `  Total: ${d.exceptions.total} (${d.exceptions.critical} critical, ${d.exceptions.warnings} warnings)`,
    d.exceptions.items.map(e => `  • ${e}`).join('\n'),
    ``,
    `EVIDENCE GENERATED`,
    `  Documents: ${d.evidence.documents}`,
    `  QC Reports: ${d.evidence.qcReports}`,
    `  Temperature Logs: ${d.evidence.logs}`,
    `  Agreements: ${d.evidence.agreements}`,
    ``,
    `POLICY EVALUATIONS`,
    `  Policies applied: ${d.policies.applied}`,
    `  Allowed: ${d.policies.allowed} | Denied: ${d.policies.denied} | Conditional: ${d.policies.conditionals}`,
    ``,
    `TRUST INDEX`,
    `  Network average: ${(d.trust.avgOrgTrust * 100).toFixed(0)}%`,
    `  Range: ${(d.trust.minTrust * 100).toFixed(0)}% – ${(d.trust.maxTrust * 100).toFixed(0)}%`,
    ``,
    `COMPLIANCE SUMMARY`,
    `  Status: ${d.compliance.status}`,
    d.compliance.gaps.length > 0 ? `  Gaps: ${d.compliance.gaps.join(', ')}` : '  Gaps: None identified',
    ``,
    `─────────────────────────────────────────────────────`,
    `Generated: ${new Date().toISOString()}`,
    `Kadarn Platform v1.0.0-beta`,
    `KRM-BNO Compliant`,
  ];
  return sections.join('\n');
}
