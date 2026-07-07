'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect, useMemo } from 'react'

// ─── Country → approximate SVG coordinates (x%, y%) ─────────────────────────
const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  US: { x: 20, y: 25 },
  CA: { x: 18, y: 18 },
  MX: { x: 22, y: 33 },
  GB: { x: 48, y: 22 },
  DE: { x: 52, y: 25 },
  FR: { x: 49, y: 29 },
  NL: { x: 51, y: 23 },
  CH: { x: 53, y: 30 },
  SE: { x: 56, y: 16 },
  DK: { x: 54, y: 19 },
  ES: { x: 46, y: 35 },
  IT: { x: 54, y: 34 },
  PT: { x: 44, y: 36 },
  BE: { x: 50, y: 26 },
  NO: { x: 54, y: 13 },
  FI: { x: 62, y: 14 },
  PL: { x: 58, y: 24 },
  CZ: { x: 56, y: 27 },
  AT: { x: 56, y: 30 },
  IE: { x: 44, y: 22 },
  AU: { x: 88, y: 55 },
  NZ: { x: 92, y: 60 },
  JP: { x: 84, y: 28 },
  CN: { x: 78, y: 30 },
  KR: { x: 82, y: 26 },
  SG: { x: 78, y: 42 },
  IN: { x: 72, y: 37 },
  IL: { x: 63, y: 33 },
  SA: { x: 64, y: 38 },
  AE: { x: 66, y: 36 },
  BR: { x: 30, y: 55 },
  AR: { x: 30, y: 62 },
  CL: { x: 28, y: 58 },
  ZA: { x: 55, y: 58 },
  NG: { x: 53, y: 46 },
  KE: { x: 60, y: 42 },
  EG: { x: 59, y: 35 },
  default: { x: 50, y: 40 },
}

// ─── Region groups for connection clustering ─────────────────────────────────
const REGIONS: Record<string, { label: string; color: string; countries: string[]; centroid: { x: number; y: number } }> = {
  americas:   { label: 'Americas',   color: '#4467F2',  countries: ['US','CA','MX','BR','AR','CL'], centroid: { x: 25, y: 40 } },
  europe:     { label: 'Europe',     color: '#0CC5C1',  countries: ['GB','DE','FR','NL','CH','SE','DK','ES','IT','PT','BE','NO','FI','PL','CZ','AT','IE'], centroid: { x: 52, y: 25 } },
  meast:      { label: 'Middle East',color: '#F5A623',  countries: ['IL','SA','AE','EG'],          centroid: { x: 63, y: 36 } },
  asia:       { label: 'Asia',       color: '#8B44FF',  countries: ['IN','CN','JP','KR','SG'],     centroid: { x: 78, y: 33 } },
  pacific:    { label: 'Pacific',    color: '#0CC5C1',  countries: ['AU','NZ'],                    centroid: { x: 90, y: 57 } },
  africa:     { label: 'Africa',     color: '#F5A623',  countries: ['ZA','NG','KE'],               centroid: { x: 55, y: 50 } },
}

function getRegionForCountry(country: string | null): string {
  if (!country) return 'other'
  for (const [key, reg] of Object.entries(REGIONS)) {
    if (reg.countries.includes(country)) return key
  }
  return 'other'
}


// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--br)', background: 'var(--card)' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: color ?? 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function NetworkPage() {
  const [ecosystemData, setEcosystemData] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [logisticsData, setLogisticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      kocFetch(`/api/v1/koc/ecosystem`).then(r => r.ok ? r.json() : { data: {} }),
      kocFetch(`/api/v1/koc/analytics`).then(r => r.ok ? r.json() : { data: {} }),
      kocFetch(`/api/v1/koc/logistics`).then(r => r.ok ? r.json() : { data: { summary: {} } }),
    ])
      .then(([eco, an, log]) => {
        setEcosystemData(eco.data)
        setAnalyticsData(an.data)
        setLogisticsData(log.data)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  // ── Derive map markers from data ───────────────────────────────────────────
  const { markers, connections, regionCounts } = useMemo(() => {
    const orgs: any[] = []
    const topBanks = ecosystemData?.top_biobanks ?? []

    // Build a lookup: org_name → details
    const orgMap = new Map<string, any>()
    for (const o of orgs) {
      orgMap.set(o.org_name, o)
    }

    // Match top biobanks with trust data by name
    const matched: any[] = []
    const seenOrgs = new Set<string>()
    for (const tb of topBanks) {
      const detail = orgMap.get(tb.name)
      const country = detail?.country ?? null
      const coords = COUNTRY_COORDS[country ?? ''] ?? COUNTRY_COORDS.default
      matched.push({
        org_id: tb.organization_id,
        name: tb.name,
        program_count: tb.program_count,
        country,
        risk_level: 'low' as const,
        x: coords.x,
        y: coords.y,
      })
      if (country) seenOrgs.add(country)
    }

    // Fill in remaining trust orgs that aren't in top_biobanks
    for (const o of orgs) {
      if (!topBanks.some((tb: any) => tb.name === o.org_name) && !matched.some(m => m.name === o.org_name)) {
        const coords = COUNTRY_COORDS[o.country ?? ''] ?? COUNTRY_COORDS.default
        matched.push({
          org_id: o.org_id,
          name: o.org_name,
          program_count: 0,
          country: o.country,
          risk_level: 'low' as const,
          x: coords.x,
          y: coords.y,
        })
      }
    }

    // Build connections between orgs in the same region
    const conns: { from: any; to: any }[] = []
    const byRegion: Record<string, any[]> = {}
    for (const m of matched) {
      const region = getRegionForCountry(m.country)
      if (!byRegion[region]) byRegion[region] = []
      byRegion[region].push(m)
    }
    for (const [, orgs] of Object.entries(byRegion)) {
      if (orgs.length >= 2) {
        for (let i = 0; i < orgs.length - 1; i++) {
          conns.push({ from: orgs[i], to: orgs[i + 1] })
        }
      }
    }

    // Region counts
    const rc: Record<string, number> = {}
    for (const m of matched) {
      const region = getRegionForCountry(m.country)
      rc[region] = (rc[region] ?? 0) + 1
    }

    return { markers: matched, connections: conns, regionCounts: rc }
  }, [ecosystemData])

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    orgs: analyticsData?.network?.active_orgs ?? markers.length,
    programs: analyticsData?.programs?.active ?? ecosystemData?.top_biobanks?.length ?? 0,
    shipments_in_transit: logisticsData?.summary?.in_transit ?? 0,
    fulfillment_rate: analyticsData?.fulfillment?.rate ?? 0,
    delayed: logisticsData?.summary?.delayed ?? 0,
    deals: ecosystemData?.demand_supply?.deals ?? 0,
  }), [analyticsData, ecosystemData, logisticsData, markers.length])

  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading network map...</div>
  if (error) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load network data</div>
    </div>
  )

  const markerDots = markers.map(m => ({
    ...m,
    radius: Math.max(2, Math.min(6, 2 + (m.program_count ?? 0) * 0.5)),
  }))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Network Map</h1>
        <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>
          {markers.length} organizations across {Object.keys(regionCounts).length} regions
        </p>
      </div>

      {/* Stats bar — all from real data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="Active Orgs" value={stats.orgs} />
        <StatCard label="Programs" value={stats.programs} />
        <StatCard label="In Transit" value={stats.shipments_in_transit} color="var(--blue)" />
        <StatCard label="Delayed" value={stats.delayed} color={stats.delayed > 0 ? 'var(--red)' : 'var(--teal)'} />
        <StatCard label="Fulfillment" value={`${stats.fulfillment_rate}%`} color={stats.fulfillment_rate >= 80 ? 'var(--teal)' : 'var(--amber)'} />
        <StatCard label="Deals" value={stats.deals} color="var(--teal)" />
      </div>

      {/* Map */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '45%',
        borderRadius: 16,
        border: '1px solid var(--border)',
        background: 'var(--navy2)',
        overflow: 'hidden',
      }}>
        <svg viewBox="0 0 100 60" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {/* Grid lines */}
          {[25, 50, 75].map(x => (
            <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={60} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
          ))}
          {[20, 40].map(y => (
            <line key={`gy${y}`} x1={0} y1={y} x2={100} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
          ))}

          {/* Region labels */}
          {Object.entries(REGIONS).map(([key, reg]) =>
            regionCounts[key] && regionCounts[key] > 0 ? (
              <text key={key} x={reg.centroid.x} y={reg.centroid.y} textAnchor="middle" fontSize="2.8"
                fill={reg.color} opacity={0.2} fontWeight="800" letterSpacing="2" style={{textTransform:"uppercase"}}>
                {reg.label}
              </text>
            ) : null
          )}

          {/* Connection lines — between orgs in same region */}
          {connections.map((conn, i) => (
            <line
              key={`conn${i}`}
              x1={conn.from.x} y1={conn.from.y}
              x2={conn.to.x} y2={conn.to.y}
              stroke="rgba(68,103,242,0.12)"
              strokeWidth="0.4"
            />
          ))}

          {/* Connection pulses */}
          {connections.slice(0, 5).map((conn, i) => {
            const midX = (conn.from.x + conn.to.x) / 2
            const midY = (conn.from.y + conn.to.y) / 2
            return (
              <circle key={`pulse${i}`} cx={midX} cy={midY} r={1.2} fill="var(--teal)" opacity={0.5}>
                <animate attributeName="opacity" values="0.5;0.05;0.5" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="1.2;3.5;1.2" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
              </circle>
            )
          })}

          {/* Organization markers — data-driven */}
          {markerDots.map((m, i) => (
            <g key={m.org_id ?? i} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrg(selectedOrg?.org_id === m.org_id ? null : m)}>
              {/* Glow */}
              <circle cx={m.x} cy={m.y} r={m.radius * 2.5} fill="var(--blue)" opacity={0.08} />
              {/* Dot */}
              <circle cx={m.x} cy={m.y} r={m.radius} fill="var(--blue)" opacity={0.85}>
                <animate attributeName="opacity" values="0.85;0.6;0.85" dur="3s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              </circle>
              {/* Label for larger dots */}
              {m.radius >= 4 && (
                <text x={m.x} y={m.y - m.radius - 1.5} textAnchor="middle" fontSize="2.2" fill="rgba(255,255,255,0.6)" fontWeight="600">
                  {m.name.length > 14 ? m.name.slice(0, 12) + '…' : m.name}
                </text>
              )}
            </g>
          ))}

          {/* Legend */}
          <rect x={1.5} y={55} width={38} height={4} rx={1} fill="rgba(0,0,0,0.5)" />
          <text x={2.5} y={56.6} fontSize="1.8" fill="rgba(255,255,255,0.4)">● Low risk</text>
          <text x={12} y={56.6} fontSize="1.8" fill="rgba(255,255,255,0.4)">● Medium</text>
          <text x={22} y={56.6} fontSize="1.8" fill="rgba(255,255,255,0.4)">● High risk</text>
          <text x={32} y={56.6} fontSize="1.8" fill="rgba(255,255,255,0.4)">● Unknown</text>
          <circle cx={2.5} cy={55.8} r={0.7} fill="var(--teal)" />
          <circle cx={11.5} cy={55.8} r={0.7} fill="var(--amber)" />
          <circle cx={21.5} cy={55.8} r={0.7} fill="var(--red)" />
          <circle cx={31.5} cy={55.8} r={0.7} fill="var(--txdd)" />
        </svg>
      </div>

      {/* Legend + Region stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(REGIONS).filter(([k]) => regionCounts[k]).map(([key, reg]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6,
              background: 'var(--card)', border: '1px solid var(--br)',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: reg.color }} />
              <span style={{ fontSize: 10, color: 'var(--txd)' }}>{reg.label}</span>
              <span style={{ fontSize: 9, color: 'var(--txdd)' }}>({regionCounts[key]})</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { label: 'Low', color: 'var(--teal)' },
            { label: 'Med', color: 'var(--amber)' },
            { label: 'High', color: 'var(--red)' },
          ].map(level => (
            <span key={level.label} style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 4,
              background: `${level.color}15`, color: level.color, fontWeight: 600,
            }}>
              ● {level.label}
            </span>
          ))}
        </div>
      </div>

      {/* Selected org detail */}
      {selectedOrg && (
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 12,
          border: `1px solid ${"var(--blue)"}30`,
          background: `${"var(--blue)"}05`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: "var(--blue)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedOrg.name}</div>
              <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 2 }}>
                {selectedOrg.country ?? '—'} · {selectedOrg.program_count ?? 0} programs
              </div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              color: "var(--blue)",
              background: `${"var(--blue)"}15`,
              textTransform: 'uppercase',
            }}>
              Active
            </span>
          </div>
        </div>
      )}

      {/* Logistics summary */}
      {logisticsData?.summary && (
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 12,
          border: '1px solid var(--border)', background: 'var(--navy2)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Logistics Activity
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            <LogStat label="In Transit" value={logisticsData.summary.in_transit} color="var(--blue)" />
            <LogStat label="Delayed" value={logisticsData.summary.delayed} color={logisticsData.summary.delayed > 0 ? 'var(--red)' : 'var(--teal)'} />
            <LogStat label="Customs" value={logisticsData.summary.customs_hold} color={logisticsData.summary.customs_hold > 0 ? 'var(--amber)' : 'var(--txdd)'} />
            <LogStat label="Excursions" value={logisticsData.summary.temperature_excursions} color={logisticsData.summary.temperature_excursions > 0 ? 'var(--red)' : 'var(--teal)'} />
            <LogStat label="Delivered Today" value={logisticsData.summary.delivered_today} color="var(--teal)" />
          </div>
        </div>
      )}
    </div>
  )
}

function LogStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: color ?? 'var(--tx)' }}>{value ?? 0}</div>
      <div style={{ fontSize: 9, color: 'var(--txdd)', marginTop: 2 }}>{label}</div>
    </div>
  )
}
