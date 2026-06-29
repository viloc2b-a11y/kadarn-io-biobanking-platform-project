'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ---------------------------------------------------------------------------
// Types (mirror KPE endpoint)
// ---------------------------------------------------------------------------
interface DimData {
  score: number; threshold: number; status: 'pass' | 'warn' | 'fail'
  total: number; passed: number; gaps: string[]
}
interface Milestone {
  id: string; type: string; title: string; status: string
  planned_end: string | null; actual_end: string | null; assigned_org: string | null
}
interface EvidenceItem {
  id: string; type: string; external_id: string; label: string | null
  has_evidence: boolean; evidence_count: number; recorded_at: string | null
}
interface KpeData {
  program: { id: string; name: string; short_name: string | null; status: string }
  kpe_score: number; audit_ready: boolean
  dimensions: { evidence: DimData; governance: DimData; provenance: DimData; settlement: DimData }
  gaps: string[]; milestones: Milestone[]; evidence_items: EvidenceItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function dimColor(status: string) {
  const c: Record<string, string> = { pass: '#22D37A', warn: '#F5A623', fail: '#FF4D6A' }
  return c[status] ?? '#4A5C78'
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
function badgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, string> = {
    pass: '#22D37A', warn: '#F5A623', fail: '#FF4D6A',
    completed: '#22D37A', in_progress: '#4467F2', pending: '#4A5C78',
    blocked: '#FF4D6A', cancelled: '#4A5C78',
  }
  return {
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
    color: colors[status] ?? '#4A5C78',
    background: `${colors[status] ?? '#4A5C78'}18`,
  }
}

// ---------------------------------------------------------------------------
// Report component
// ---------------------------------------------------------------------------
function KpeReport({ data }: { data: KpeData }) {
  const { program, kpe_score, audit_ready, dimensions, milestones, evidence_items } = data
  const dims = [
    { key: 'Evidence', dim: dimensions.evidence, icon: '📋' },
    { key: 'Governance', dim: dimensions.governance, icon: '⚖️' },
    { key: 'Provenance', dim: dimensions.provenance, icon: '🔗' },
    { key: 'Settlement', dim: dimensions.settlement, icon: '💰' },
  ]
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div style={reportStyles.page}>
      {/* ===== COVER / HEADER ===== */}
      <div style={reportStyles.header}>
        <div style={reportStyles.headerTop}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#4467F2', textTransform: 'uppercase' }}>
              Kadarn Proof of Execution
            </span>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: '6px 0 2px', color: '#E8EEF8' }}>
              {program.short_name ?? program.name}
            </h1>
            <p style={{ fontSize: 14, color: '#7A8FAF', margin: 0 }}>
              Program ID: {program.id} · Status: {program.status} · Generated: {today}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900,
              background: `conic-gradient(${audit_ready ? '#22D37A' : '#F5A623'} ${kpe_score}%, #2A3A55 ${kpe_score}%)`,
              color: '#E8EEF8',
            }}>
              {kpe_score}
            </div>
            <div style={{ fontSize: 9, color: '#7A8FAF', marginTop: 4, letterSpacing: 1 }}>KPE SCORE</div>
          </div>
        </div>
        <div style={reportStyles.auditRow}>
          {audit_ready ? (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#22D37A', letterSpacing: 1 }}>
              ✓ AUDIT READY — All dimensions meet their thresholds
            </span>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#F5A623', letterSpacing: 1 }}>
              ⚠ NOT AUDIT READY — {data.gaps.length} gap(s) to resolve
            </span>
          )}
        </div>
      </div>

      {/* ===== EXECUTIVE SUMMARY ===== */}
      <div style={reportStyles.section}>
        <h2 style={reportStyles.sectionTitle}>Executive Summary</h2>
        <p style={reportStyles.bodyText}>
          This KPE report assesses the audit-readiness of <strong>{program.name}</strong> across four
          dimensions: Evidence, Governance, Provenance, and Settlement. The overall KPE Score of
          <strong> {kpe_score}/100</strong> is a weighted composite (Evidence 30%, Governance 30%,
          Provenance 25%, Settlement 15%).
        </p>
        <p style={reportStyles.bodyText}>
          {audit_ready
            ? 'The program meets all audit-readiness thresholds and is ready for external audit.'
            : `The program does not yet meet all audit-readiness thresholds. ${data.gaps.length} gap(s) must be resolved before external audit. See the dimension detail below.`
          }
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <InfoChip label="Dimensions" value="4" />
          <InfoChip label="Milestones" value={String(milestones.length)} />
          <InfoChip label="Evidence Items" value={String(evidence_items.length)} />
          <InfoChip label="Gaps Found" value={String(data.gaps.length)} color={data.gaps.length > 0 ? '#FF4D6A' : '#22D37A'} />
        </div>
      </div>

      {/* ===== DIMENSION SCORES ===== */}
      <div style={reportStyles.section}>
        <h2 style={reportStyles.sectionTitle}>Dimension Scores</h2>
        <table style={reportStyles.table}>
          <thead>
            <tr>
              <th style={reportStyles.th}>Dimension</th>
              <th style={reportStyles.th}>Score</th>
              <th style={reportStyles.th}>Threshold</th>
              <th style={reportStyles.th}>Items</th>
              <th style={reportStyles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {dims.map(({ key, dim }) => (
              <tr key={key}>
                <td style={reportStyles.td}><strong>{key}</strong></td>
                <td style={reportStyles.td}>
                  <span style={{ fontWeight: 800, color: dimColor(dim.status) }}>{dim.score}%</span>
                </td>
                <td style={reportStyles.td}>{dim.threshold}%</td>
                <td style={reportStyles.td}>{dim.passed}/{dim.total}</td>
                <td style={reportStyles.td}>
                  <span style={badgeStyle(dim.status)}>
                    {dim.status === 'pass' ? 'PASS' : dim.status === 'warn' ? 'WARN' : 'FAIL'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Dimension detail */}
        {dims.map(({ key, dim }) => (
          <div key={key + '-detail'} style={reportStyles.dimDetail}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#2A3A55', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(dim.score, 100)}%`, height: '100%', borderRadius: 4, background: dimColor(dim.status) }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: dimColor(dim.status) }}>{dim.score}%</span>
            </div>
            {dim.gaps.length > 0 && (
              <div style={{ fontSize: 11, color: '#7A8FAF', marginTop: 4 }}>
                {dim.gaps.map((g, i) => (
                  <div key={i} style={{ padding: '2px 0' }}>· {g}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== GAPS ===== */}
      {data.gaps.length > 0 && (
        <div style={reportStyles.section}>
          <h2 style={reportStyles.sectionTitle}>Gaps Requiring Resolution ({data.gaps.length})</h2>
          {data.gaps.map((g, i) => (
            <div key={i} style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: '#FF4D6A0D',
              border: '1px solid #FF4D6A20',
              marginBottom: 6,
              fontSize: 12,
              color: '#E8EEF8',
            }}>
              {i + 1}. {g}
            </div>
          ))}
        </div>
      )}

      {/* ===== MILESTONE TIMELINE ===== */}
      <div style={reportStyles.section}>
        <h2 style={reportStyles.sectionTitle}>Milestone Timeline ({milestones.length})</h2>
        {milestones.length === 0 ? (
          <p style={{ ...reportStyles.bodyText, fontStyle: 'italic' }}>No milestones defined for this program.</p>
        ) : (
          <table style={reportStyles.table}>
            <thead>
              <tr>
                <th style={reportStyles.th}>Milestone</th>
                <th style={reportStyles.th}>Type</th>
                <th style={reportStyles.th}>Planned End</th>
                <th style={reportStyles.th}>Completed</th>
                <th style={reportStyles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map(m => (
                <tr key={m.id}>
                  <td style={reportStyles.td}><strong>{m.title}</strong></td>
                  <td style={reportStyles.td}>{m.type.replace(/_/g, ' ')}</td>
                  <td style={reportStyles.td}>{fmtDate(m.planned_end)}</td>
                  <td style={reportStyles.td}>{fmtDate(m.actual_end)}</td>
                  <td style={reportStyles.td}>
                    <span style={badgeStyle(m.status)}>
                      {m.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== EVIDENCE LEDGER ===== */}
      <div style={reportStyles.section}>
        <h2 style={reportStyles.sectionTitle}>Evidence Ledger ({evidence_items.length})</h2>
        {evidence_items.length === 0 ? (
          <p style={{ ...reportStyles.bodyText, fontStyle: 'italic' }}>No evidence items recorded for this program.</p>
        ) : (
          <table style={reportStyles.table}>
            <thead>
              <tr>
                <th style={reportStyles.th}>Item</th>
                <th style={reportStyles.th}>Type</th>
                <th style={reportStyles.th}>External ID</th>
                <th style={reportStyles.th}>Date</th>
                <th style={reportStyles.th}>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {evidence_items.map(item => (
                <tr key={item.id}>
                  <td style={reportStyles.td}>{item.label ?? '—'}</td>
                  <td style={reportStyles.td}>{item.type.replace(/_/g, ' ')}</td>
                  <td style={reportStyles.td}><code style={{ fontSize: 10 }}>{item.external_id}</code></td>
                  <td style={reportStyles.td}>{fmtDate(item.recorded_at)}</td>
                  <td style={reportStyles.td}>
                    {item.has_evidence ? (
                      <span style={{ color: '#22D37A', fontWeight: 600, fontSize: 11 }}>
                        ✓ {item.evidence_count} reference(s)
                      </span>
                    ) : (
                      <span style={{ color: '#FF4D6A', fontWeight: 600, fontSize: 11 }}>✗ Missing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== CONCLUSION ===== */}
      <div style={reportStyles.section}>
        <h2 style={reportStyles.sectionTitle}>Conclusion</h2>
        <p style={reportStyles.bodyText}>
          <strong>{program.name}</strong> has achieved a <strong>KPE Score of {kpe_score}/100</strong>.
          This assessment is based on data from the Kadarn platform as of {today}.
        </p>
        {audit_ready ? (
          <p style={{ ...reportStyles.bodyText, color: '#22D37A', fontWeight: 600 }}>
            The program is audit-ready. All four dimensions meet their required thresholds.
          </p>
        ) : (
          <p style={{ ...reportStyles.bodyText, color: '#F5A623' }}>
            The program is not yet audit-ready. {data.gaps.length} gap(s) must be addressed before external audit.
            Priority areas: {
              dims
                .filter(({ dim }) => dim.status !== 'pass')
                .map(({ key }) => key)
                .join(', ') || 'none'
            }.
          </p>
        )}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #2A3A55', fontSize: 10, color: '#4A5C78' }}>
          Kadarn Proof of Execution · KPE v1.0 · KRM-BNO Compliant · Generated {today} · {program.id}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Info chip for summary
// ---------------------------------------------------------------------------
function InfoChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      padding: '10px 16px',
      borderRadius: 8,
      background: '#111E33',
      border: '1px solid rgba(255,255,255,0.07)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: color ?? '#E8EEF8' }}>{value}</div>
      <div style={{ fontSize: 9, color: '#4A5C78', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{label}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const reportStyles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '40px 48px',
    color: '#E8EEF8',
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif`,
  },
  header: {
    padding: '32px 32px 24px',
    borderRadius: 16,
    background: '#111E33',
    border: '1px solid rgba(255,255,255,0.07)',
    marginBottom: 24,
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  auditRow: {
    marginTop: 16,
    padding: '12px 16px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    textAlign: 'center',
  },
  section: {
    padding: 24,
    borderRadius: 14,
    background: '#111E33',
    border: '1px solid rgba(255,255,255,0.07)',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#4467F2',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    margin: 0,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#7A8FAF',
    margin: 0,
    marginBottom: 8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    fontSize: 10,
    fontWeight: 700,
    color: '#4A5C78',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    color: '#E8EEF8',
  },
  dimDetail: {
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function KpeReportPage() {
  const params = useParams()
  const programId = params.id as string
  const [data, setData] = useState<KpeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API}/api/v1/programs/${programId}/kpe`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [programId])

  const handlePrint = () => window.print()

  if (loading) return (
    <div style={reportStyles.page}>
      <div style={{ textAlign: 'center', padding: 80, color: '#7A8FAF' }}>Loading KPE Report...</div>
    </div>
  )

  if (error) return (
    <div style={reportStyles.page}>
      <div style={{ maxWidth: 420, margin: '80px auto', padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#FF4D6A', marginBottom: 8 }}>Failed to load KPE Report</div>
        <div style={{ fontSize: 12, color: '#7A8FAF' }}>Could not reach the KPE endpoint for program {programId.slice(0, 8)}.</div>
      </div>
    </div>
  )

  if (!data) return (
    <div style={reportStyles.page}>
      <div style={{ textAlign: 'center', padding: 80, color: '#7A8FAF' }}>No KPE data available</div>
    </div>
  )

  return (
    <>
      {/* Print/Download toolbar — hidden when printing */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '12px 24px',
        background: '#0B1628',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }} className="no-print">
        <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EEF8', flex: 1 }}>
          KPE Report — {data.program.short_name ?? data.program.name}
        </span>
        <button
          onClick={handlePrint}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#4467F2',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ↓ Download PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            color: '#7A8FAF',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      {/* Spacer for fixed toolbar */}
      <div style={{ height: 56 }} className="no-print" />

      {/* Report content */}
      <div ref={printRef}>
        <KpeReport data={data} />
      </div>

      <style>{`
        @media print {
          @page { margin: 0.5in; size: A4; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: #fff !important; }
          .no-print { display: none !important; }
          * { background: #fff !important; color: #111 !important; }
          [class] { background: #fff !important; }
          div, span, h1, h2, h3, p, td, th, table, tr, section { background: #fff !important; }
          h1 { color: #111 !important; font-size: 24px !important; }
          h2 { color: #4467F2 !important; font-size: 13px !important; }
          strong { color: #111 !important; }
          code { background: #f5f5f5 !important; color: #333 !important; padding: 1px 4px; border-radius: 3px; }
          table { border-collapse: collapse; width: 100%; }
          th { color: #666 !important; border-bottom: 2px solid #ddd !important; }
          td { color: #333 !important; border-bottom: 1px solid #eee !important; }
          /* Override dark theme */
          [style*="background"] { background: #fff !important; }
          [style*="border"] { border-color: #ddd !important; }
          [style*="color"] { color: #333 !important; }
          [style*="color: #E8EEF8"] { color: #111 !important; }
          [style*="color: #7A8FAF"] { color: #555 !important; }
          [style*="color: #4A5C78"] { color: #666 !important; }
          [style*="background: #111E33"] { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
          [style*="background: #0B1628"] { background: #fff !important; }
          /* Keep status colors vivid */
          [style*="color: #22D37A"] { color: #1a8a4a !important; }
          [style*="color: #F5A623"] { color: #b87a0f !important; }
          [style*="color: #FF4D6A"] { color: #cc2244 !important; }
          [style*="color: #4467F2"] { color: #2244cc !important; }
          [style*="background: #FF4D6A0D"] { background: #fff0f0 !important; border-color: #ffcccc !important; }
          [style*="background: #2A3A55"] { background: #e0e0e0 !important; }
        }
      `}</style>
    </>
  )
}
