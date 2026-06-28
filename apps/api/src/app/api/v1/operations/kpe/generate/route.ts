import { NextResponse } from 'next/server';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get('programId') ?? 'prog-001';

  const report = {
    programId, programName: 'Oncology Biomarker Validation 2024-05',
    organizations: [
      { id: 'org-1', name: 'PharmaCorp', role: 'Sponsor' },
      { id: 'org-2', name: 'National Biobank', role: 'Biobank' },
      { id: 'org-3', name: 'Advanced Path Lab', role: 'Processing Lab' },
      { id: 'org-4', name: 'Global Cold Chain', role: 'Logistics' },
    ],
    specimens: { total: 450, collected: 320, qcPassed: 310, qcFailed: 10, consumed: 45 },
    shipments: { total: 23, completed: 19, breached: 1, disputed: 1 },
    transactions: { total: 15, completed: 11, disputed: 1 },
    exceptions: { total: 3, critical: 1, warnings: 2, items: ['Temperature breach -45°C on shipment GCC-2025-0620-01', 'Export permit missing for ALD cohort', 'QC failure — tissue fragmentation exceeds threshold'] },
    policies: { applied: 12, allowed: 11, denied: 0, conditionals: 1 },
    evidence: { documents: 8, qcReports: 45, logs: 23, agreements: 3 },
    trust: { avgOrgTrust: 0.89, minTrust: 0.78, maxTrust: 0.95 },
    timeline: { start: '2024-06-01', end: '2026-12-31', duration: '31 months' },
    compliance: { status: 'Compliant', gaps: [], readyForAudit: true },
  };

  return NextResponse.json({ success: true, data: { report } });
}
