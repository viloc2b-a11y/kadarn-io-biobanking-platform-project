'use client'

import { useState } from 'react'
import { evaluatePolicy, ROLE_PERMISSIONS } from './mock-data'

// ─── Types ──────────────────────────────────────────────────────────────────

type Role = 'admin' | 'sponsor' | 'institution' | 'researcher' | 'auditor' | 'system'
type Action = 'artifact:read' | 'artifact:deliver' | 'artifact:revoke' | 'artifact:expire' | 'policy:manage' | 'channel:manage' | 'lineage:view'
type Classification = 'public' | 'confidential' | 'counter-evidence' | 'restricted'

const ROLES: Role[] = ['admin', 'sponsor', 'institution', 'researcher', 'auditor', 'system']
const ACTIONS: Action[] = ['artifact:read', 'artifact:deliver', 'artifact:revoke', 'artifact:expire', 'policy:manage', 'channel:manage', 'lineage:view']
const CLASSIFICATIONS: Classification[] = ['public', 'confidential', 'counter-evidence', 'restricted']

// ─── Styles ─────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--navy2)',
  padding: 20,
}

const headingStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--tx)',
  marginBottom: 12,
}

const selectRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  marginBottom: 12,
  flexWrap: 'wrap',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--txd)',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  marginRight: 2,
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 12,
  border: '1px solid var(--border)',
  borderRadius: 6,
  background: 'var(--navy1)',
  color: 'var(--tx)',
  cursor: 'pointer',
  minWidth: 130,
}

const btnStyle: React.CSSProperties = {
  padding: '6px 16px',
  fontSize: 12,
  fontWeight: 700,
  border: 'none',
  borderRadius: 6,
  background: 'var(--teal)',
  color: '#fff',
  cursor: 'pointer',
}

const resultCardStyle = (decision: 'ALLOW' | 'DENY'): React.CSSProperties => ({
  padding: 14,
  borderRadius: 8,
  background: decision === 'ALLOW' ? '#f0fdf4' : '#fef2f2',
  border: `1px solid ${decision === 'ALLOW' ? '#bbf7d0' : '#fecaca'}`,
  marginTop: 10,
})

const resultBadgeStyle = (decision: 'ALLOW' | 'DENY'): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: 13,
  fontWeight: 800,
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
  color: decision === 'ALLOW' ? '#16a34a' : '#dc2626',
  marginBottom: 6,
})

const resultReasonStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--txd)',
  lineHeight: 1.5,
}

const permChipStyle = (hasPerm: boolean): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: 9,
  padding: '1px 5px',
  borderRadius: 3,
  marginRight: 3,
  background: hasPerm ? '#e0e7ff' : '#f3f4f6',
  color: hasPerm ? '#3730a3' : '#9ca3af',
  fontWeight: 500,
})

// ─── Component ──────────────────────────────────────────────────────────────

export function PolicyTester() {
  const [role, setRole] = useState<Role>('sponsor')
  const [action, setAction] = useState<Action>('artifact:read')
  const [classification, setClassification] = useState<Classification>('public')
  const [result, setResult] = useState<{ decision: 'ALLOW' | 'DENY'; reason: string } | null>(null)

  const handleEvaluate = () => {
    const r = evaluatePolicy(role, action, classification)
    setResult(r)
  }

  const rolePerms = ROLE_PERMISSIONS[role] || []

  return (
    <div style={cardStyle}>
      <h3 style={headingStyle}>Policy Tester — Evaluate Access</h3>

      {/* ── Selectors ── */}
      <div style={selectRowStyle}>
        <span style={labelStyle}>Role</span>
        <select style={selectStyle} value={role} onChange={(e) => { setRole(e.target.value as Role); setResult(null) }}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <span style={labelStyle}>Action</span>
        <select style={{ ...selectStyle, minWidth: 150 }} value={action} onChange={(e) => { setAction(e.target.value as Action); setResult(null) }}>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <span style={labelStyle}>Classification</span>
        <select style={selectStyle} value={classification} onChange={(e) => { setClassification(e.target.value as Classification); setResult(null) }}>
          {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <button style={btnStyle} onClick={handleEvaluate}>Evaluate</button>
      </div>

      {/* ── Role permissions ── */}
      <div style={{ marginBottom: 10 }}>
        <span style={{ ...labelStyle, display: 'inline-block', marginBottom: 4 }}>Role Permissions</span>
        <div>
          {ACTIONS.map((a) => (
            <span key={a} style={permChipStyle(rolePerms.includes(a))}>{a}</span>
          ))}
        </div>
      </div>

      {/* ── Result ── */}
      {result && (
        <div style={resultCardStyle(result.decision)}>
          <div style={resultBadgeStyle(result.decision)}>{result.decision}</div>
          <div style={resultReasonStyle}>{result.reason}</div>
        </div>
      )}

      {!result && (
        <div style={{ padding: 14, textAlign: 'center', color: 'var(--txd)', fontSize: 12 }}>
          Select role, action, and classification, then click Evaluate.
        </div>
      )}
    </div>
  )
}
