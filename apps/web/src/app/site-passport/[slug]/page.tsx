type PassportPageProps = {
  params: Promise<{ slug: string }>
}

async function fetchJson(url: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? ''
  try {
    const res = await fetch(`${base}${url}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? json
  } catch {
    return null
  }
}

// dashboard-next-best-action Phase B — replaces the deleted institutional
// composite score card (formerly /100) with factual, non-evaluative counts
// sourced from computeSiteScore()'s additive fields (claimEvidenceLevels,
// claimsWithEvidence, claimsAwaitingEvidence — see apply-progress id 1007).
// `evidenceCoverage`/`referenceCoverage` are intentionally NOT rendered here:
// computeSiteScore() still returns them as percentages (not yet converted to
// counts per design D1's stated end-state), and this summary region must
// contain zero %/100 glyphs (design Testing Strategy). Re-surfacing them as
// count-based metrics is a backend change out of PR-B's UI-only scope —
// flagged for a follow-up decision.
function EvidenceSummary({ score }: { score: any }) {
  if (!score) return null
  const claimsWithEvidence: number = score.claimsWithEvidence ?? 0
  const claimsAwaitingEvidence: number = score.claimsAwaitingEvidence ?? 0
  const totalClaims = claimsWithEvidence + claimsAwaitingEvidence
  const claimEvidenceLevels: Array<{ claimId: string; evidenceLevel: string }> = score.claimEvidenceLevels ?? []
  const levelCounts = claimEvidenceLevels.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.evidenceLevel] = (acc[entry.evidenceLevel] ?? 0) + 1
    return acc
  }, {})

  return (
    <section data-testid="evidence-summary" style={{ border: '1px solid #d1d5db', borderRadius: 16, padding: 24, background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: '#94a3b8', marginBottom: 4 }}>KADARN SITE PASSPORT</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>Evidence Summary</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Factual counts — not an institutional rating</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Metric label="Total Claims" value={String(totalClaims)} />
        <Metric label="Claims With Evidence" value={String(claimsWithEvidence)} color="#10b981" />
        <Metric label="Claims Awaiting Evidence" value={String(claimsAwaitingEvidence)} />
        <Metric label="Legacy Experience" value={`${score.legacyYears} years`} />
        <Metric label="Clinical Studies" value={String(score.clinicalStudies)} />
        <Metric label="Therapeutic Areas" value={String(score.therapeuticAreas)} />
        <Metric label="Biospecimens" value={formatNum(score.biospecimens)} />
        <Metric label="Infrastructure" value={score.infrastructure} />
        <Metric label="Regulatory Readiness" value={score.regulatoryReadiness} />
      </div>
      {Object.keys(levelCounts).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: '#94a3b8', marginBottom: 8 }}>Claims by evidence level</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(levelCounts).map(([level, count]) => (
              <span key={level} style={{ background: 'rgba(148,163,184,.12)', color: '#e2e8f0', padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>
                {level}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color ?? '#e2e8f0' }}>{value}</div>
    </div>
  )
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function Recommendations({ data }: { data: any }) {
  if (!data) return null
  return (
    <section style={{ border: '1px solid #d1d5db', borderRadius: 16, padding: 20 }}>
      <h2 style={{ fontSize: 18, marginTop: 0 }}>Profile Completion</h2>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>
        {data.recommendations.length} recommended action{data.recommendations.length !== 1 ? 's' : ''} to strengthen your Continuity Profile. Estimated Evidence Level Increase: <strong style={{ color: '#10b981' }}>+{data.recommendations.reduce((s: number, r: any) => s + r.estimatedEvidenceLevelIncrease, 0)} points</strong>
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {data.recommendations.map((rec: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, padding: '8px 12px', background: rec.priority === 'high' ? 'rgba(239,68,68,.1)' : 'rgba(234,179,8,.08)', borderRadius: 8 }}>
            <span style={{ fontSize: 16 }}>{rec.priority === 'high' ? '\u2716' : '\u26A0'}</span>
            <div style={{ flex: 1 }}>
              <span style={{ color: '#e2e8f0' }}>{rec.action}</span>
              <span style={{ color: '#64748b', marginLeft: 8 }}>({rec.category})</span>
            </div>
            <span style={{ color: '#10b981', fontWeight: 600 }}>+{rec.estimatedEvidenceLevelIncrease}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Timeline({ data }: { data: any }) {
  if (!data?.milestones) return null
  const colors: Record<string, string> = {
    founding: '#10b981', milestone: '#3b82f6', growth: '#8b5cf6',
    capability: '#f59e0b', infrastructure: '#06b6d4', regulatory: '#ec4899',
    ivd: '#f97316', verified: '#10b981', future: '#64748b',
  }
  return (
    <section style={{ border: '1px solid #d1d5db', borderRadius: 16, padding: 24 }}>
      <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 20 }}>Institutional Growth Timeline</h2>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: '#334155' }} />
        {data.milestones.map((m: any, i: number) => (
          <div key={i} style={{ position: 'relative', paddingBottom: 20, paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: -18, top: 4, width: 12, height: 12, borderRadius: '50%', background: colors[m.type] ?? '#3b82f6', border: '2px solid #0f172a' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: colors[m.type] ?? '#94a3b8' }}>{m.label}</div>
            <div style={{ fontSize: 14, color: '#e2e8f0', marginTop: 2 }}>{m.description}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Opportunities({ data }: { data: any }) {
  if (!data) return null
  return (
    <section style={{ border: '1px solid #d1d5db', borderRadius: 16, padding: 20 }}>
      <h2 style={{ fontSize: 18, marginTop: 0 }}>Opportunity Readiness</h2>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.readyFor.map((opp: any, i: number) => (
          <span key={i} style={{ background: 'rgba(16,185,129,.15)', color: '#10b981', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            {opp.area}
          </span>
        ))}
      </div>
      {data.needs.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, color: '#f59e0b', marginBottom: 8 }}>Needs</h3>
          <div style={{ display: 'grid', gap: 6 }}>
            {data.needs.map((need: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#94a3b8' }}>
                <span style={{ color: '#ef4444' }}>\u2718</span> {need}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default async function SitePassportPage({ params }: PassportPageProps) {
  const { slug } = await params
  const data = await fetchJson(`/api/v1/continuity/passport/${slug}`)
  const score = await fetchJson(`/api/v1/continuity/passport/${slug}/score`)
  const recommendations = await fetchJson(`/api/v1/continuity/passport/${slug}/recommendations`)
  const opportunities = await fetchJson(`/api/v1/continuity/passport/${slug}/opportunities`)
  const timeline = await fetchJson(`/api/v1/continuity/passport/${slug}/timeline`)

  if (!data) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Site Passport unavailable</h1>
        <p>This passport is private, expired, or does not exist.</p>
      </main>
    )
  }

  const scorecardData = score?.score ?? score

  return (
    <main style={{ padding: 40, display: 'grid', gap: 24, maxWidth: 960, margin: '0 auto' }}>
      <section>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>{data.profile?.headline ?? 'Site Passport'}</h1>
        <p style={{ maxWidth: 760 }}>{data.profile?.summary ?? 'Evidence-backed site continuity profile.'}</p>
      </section>

      <EvidenceSummary score={scorecardData} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Recommendations data={recommendations} />
        <Opportunities data={opportunities} />
      </div>

      <Timeline data={timeline} />

      <section>
        <h2>Evidence-backed experience</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {(data.claims ?? []).map((claim: any) => (
            <article key={claim.id} style={{ border: '1px solid #d1d5db', borderRadius: 12, padding: 16 }}>
              <strong>{claim.title}</strong>
              <p>{claim.description}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
                <span>{claim.category}</span>
                {claim.therapeutic_area && <span>{claim.therapeutic_area}</span>}
                {claim.study_phase && <span>{claim.study_phase}</span>}
                {claim.biospecimen_type && <span>{claim.biospecimen_type}</span>}
                {/* dashboard-next-best-action CRITICAL #1 fix (verify-report id
                    1010): never render a bare confidence number. `verification`
                    and `confidenceLevel`/`confidenceExplanation` are the real
                    fields legacy-adapter.ts returns (see packages/published-view/
                    src/legacy-adapter.ts) — the state is always shown together
                    with its explanation (spec id 980, "Bare label is invalid"). */}
                <span>{claim.verification}</span>
                <span>Confidence: {claim.confidenceLevel} — {claim.confidenceExplanation}</span>
                {claim.sponsor_display && <span>{claim.sponsor_display}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
