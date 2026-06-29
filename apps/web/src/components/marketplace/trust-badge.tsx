interface TrustScore {
  overall: number
  operational?: number
  regulatory?: number
  financial?: number
  technical?: number
  fulfillments?: number
  success_rate?: number | null
}

interface TrustBadgeProps {
  trust: TrustScore | null
  size?: 'sm' | 'md'
}

export function TrustBadge({ trust, size = 'md' }: TrustBadgeProps) {
  if (!trust) {
    return (
      <span style={{ fontSize: 11, color: 'var(--txdd)', fontStyle: 'italic' }}>
        No score
      </span>
    )
  }

  const pct   = Math.round(trust.overall * 100)
  const color = pct >= 85 ? 'var(--teal)' : pct >= 65 ? 'var(--amber)' : 'var(--red)'
  const label = pct >= 85 ? 'High trust' : pct >= 65 ? 'Moderate' : 'Low trust'

  if (size === 'sm') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 6,
        background: `${color}12`,
        border: `1px solid ${color}25`,
        color,
        fontWeight: 700,
      }}>
        <TrustDot color={color} />
        {pct}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ScoreRing value={pct} color={color} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color }}>{label}</div>
          {trust.fulfillments !== undefined && trust.fulfillments > 0 && (
            <div style={{ fontSize: 11, color: 'var(--txdd)' }}>
              {trust.fulfillments} fulfillments
              {trust.success_rate != null && ` · ${trust.success_rate}% success`}
            </div>
          )}
        </div>
      </div>

      {(trust.operational || trust.regulatory || trust.financial || trust.technical) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <DimBar label="Ops"  value={trust.operational} color={color} />
          <DimBar label="Reg"  value={trust.regulatory}  color={color} />
          <DimBar label="Fin"  value={trust.financial}   color={color} />
          <DimBar label="Tech" value={trust.technical}   color={color} />
        </div>
      )}
    </div>
  )
}

function TrustDot({ color }: { color: string }) {
  return (
    <span style={{
      width: 6, height: 6,
      borderRadius: '50%',
      background: color,
      display: 'inline-block',
      flexShrink: 0,
    }} />
  )
}

function ScoreRing({ value, color }: { value: number; color: string }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ

  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx="24" cy="24" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="28" textAnchor="middle" fill={color} fontSize="12" fontWeight="800">
        {value}
      </text>
    </svg>
  )
}

function DimBar({ label, value, color }: { label: string; value?: number; color: string }) {
  if (value == null) return null
  const pct = Math.round(value * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 10, color: 'var(--txdd)', width: 28 }}>{label}</span>
      <div style={{ width: 48, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: color }} />
      </div>
      <span style={{ fontSize: 10, color: 'var(--txdd)' }}>{pct}</span>
    </div>
  )
}
