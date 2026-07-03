'use client'

import { ROLE_PERMISSIONS, VISIBILITY_RULES } from './mock-data'

// ─── Styles ─────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  marginBottom: 20,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--tx)',
  marginBottom: 10,
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--navy2)',
  overflow: 'hidden',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 600,
  color: 'var(--txd)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid var(--border)',
  background: 'var(--navy1)',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--tx)',
  verticalAlign: 'top',
}

const roleBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  padding: '2px 8px',
  borderRadius: 6,
  background: 'var(--teal-alpha, rgba(20,184,166,.12))',
  color: 'var(--teal)',
}

const permChipStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  padding: '2px 6px',
  borderRadius: 4,
  marginRight: 4,
  marginBottom: 3,
  background: '#e0e7ff',
  color: '#3730a3',
  fontWeight: 500,
}

const ruleEffectStyle = (effect: string): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  padding: '2px 8px',
  borderRadius: 6,
  background: effect === 'ALLOW' ? '#f0fdf4' : '#fef2f2',
  color: effect === 'ALLOW' ? '#16a34a' : '#dc2626',
})

const condMonoStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  color: 'var(--txd)',
  background: 'var(--navy1)',
  padding: '2px 6px',
  borderRadius: 4,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PolicyOverview() {
  return (
    <div>
      {/* ── RBAC ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>RBAC — Role Permissions</h3>
        <div style={cardStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                <tr key={role}>
                  <td style={{ ...tdStyle, width: 120 }}>
                    <span style={roleBadgeStyle}>{role}</span>
                  </td>
                  <td style={tdStyle}>
                    {perms.map((p) => (
                      <span key={p} style={permChipStyle}>{p}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Visibility Rules ── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Visibility / ABAC Rules</h3>
        <div style={cardStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Rule</th>
                <th style={thStyle}>Condition</th>
                <th style={thStyle}>Effect</th>
                <th style={{ ...thStyle, width: 60 }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {VISIBILITY_RULES.map((rule) => (
                <tr key={rule.id}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: 'var(--tx)' }}>{rule.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--txd)', marginTop: 2 }}>{rule.description}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={condMonoStyle}>{rule.condition}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={ruleEffectStyle(rule.effect)}>{rule.effect}</span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--tx)' }}>{rule.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
