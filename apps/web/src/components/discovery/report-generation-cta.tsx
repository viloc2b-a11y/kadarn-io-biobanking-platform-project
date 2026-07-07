'use client'

import { useState } from 'react'
import { DISCOVERY_COPY } from './discovery-copy'
import { cardStyle } from './panel-primitives'
import { fetchDiscoveryReport } from './discovery-api'
import type { InstitutionRecognitionReportData } from './types'

interface ReportGenerationCtaProps {
  sessionId: string | null
}

export function ReportGenerationCta({ sessionId }: ReportGenerationCtaProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<InstitutionRecognitionReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!sessionId) {
      setError('Select a discovery session first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDiscoveryReport(sessionId)
      setReport(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        type="button"
        disabled={loading || !sessionId}
        aria-disabled={loading || !sessionId}
        onClick={handleGenerate}
        style={{
          alignSelf: 'start',
          padding: '10px 16px',
          borderRadius: 10,
          border: '1px solid rgba(59,130,246,.45)',
          background: loading ? 'rgba(15,23,42,.35)' : 'rgba(59,130,246,.15)',
          color: sessionId ? 'var(--tx)' : 'var(--txdd)',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading || !sessionId ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating…' : DISCOVERY_COPY.reportCtaLabel}
      </button>
      <p style={{ fontSize: 11, color: 'var(--txdd)', margin: 0 }}>{DISCOVERY_COPY.reportCtaHelper}</p>
      {error ? <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p> : null}
      {report ? (
        <div style={{ marginTop: 8, padding: 12, borderRadius: 10, background: 'rgba(15,23,42,.25)', fontSize: 13, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Executive summary</div>
          <p style={{ margin: 0, color: 'var(--txd)' }}>{report.executive_summary}</p>
        </div>
      ) : null}
    </div>
  )
}
