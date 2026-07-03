'use client'

import { useState } from 'react'
import type { DeliveryChannel, ChannelConfig } from '@kadarn/delivery-domain'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChannelDetailProps {
  channel: DeliveryChannel
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function channelTypeColor(type: string): string {
  const map: Record<string, string> = {
    email: '#3b82f6', webhook: '#a855f7', sftp: '#f97316',
    api: '#14b8a6', portal: '#22c55e', s3: '#eab308',
  }
  return map[type] ?? '#6b7280'
}

function maskSecret(value: string): string {
  if (value.length <= 8) return '••••'
  return value.slice(0, 4) + '••••' + value.slice(-4)
}

type ConnectionResult = { success: true; message: string } | { success: false; message: string } | null

// ─── Styles ─────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--navy2)',
  padding: '20px',
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 260px)',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 20,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--txd)',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  marginBottom: 8,
}

const fieldRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  borderBottom: '1px solid var(--border)',
  fontSize: 13,
}

const fieldLabelStyle: React.CSSProperties = {
  color: 'var(--txd)',
  fontWeight: 500,
}

const fieldValueStyle: React.CSSProperties = {
  color: 'var(--tx)',
  fontWeight: 600,
  textAlign: 'right',
  maxWidth: '65%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: 'monospace',
  fontSize: 12,
}

const badgeStyle = (bg: string): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 4,
  color: '#fff',
  background: bg,
  letterSpacing: 0.3,
  textTransform: 'uppercase' as const,
})

const dotStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: active ? '#22c55e' : '#6b7280',
  marginRight: 6,
})

const configTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const configThStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--txd)',
  padding: '6px 8px',
  borderBottom: '1px solid var(--border)',
  width: '40%',
}

const configTdStyle: React.CSSProperties = {
  padding: '8px',
  fontSize: 12,
  color: 'var(--tx)',
  borderBottom: '1px solid var(--border)',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
}

const testBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  background: 'var(--teal)',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  width: '100%',
  transition: 'opacity 150ms',
}

const testBtnDisabledStyle: React.CSSProperties = {
  ...testBtnStyle,
  opacity: 0.5,
  cursor: 'not-allowed',
}

const resultBannerStyle = (success: boolean): React.CSSProperties => ({
  marginTop: 12,
  padding: '10px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  background: success ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
  border: `1px solid ${success ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
  color: success ? '#22c55e' : '#ef4444',
})

// ─── Component ──────────────────────────────────────────────────────────────

export function ChannelDetail({ channel }: ChannelDetailProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ConnectionResult>(null)

  const handleTestConnection = async () => {
    setTesting(true)
    setResult(null)
    // Simulate 1s delay
    await new Promise((r) => setTimeout(r, 1000))
    // Simulate success for active, random fail for inactive
    const success = channel.isActive ? Math.random() > 0.15 : false
    setResult(
      success
        ? { success: true, message: `Connection to ${channel.channelType} successful — 200 OK (simulated)` }
        : { success: false, message: `Connection to ${channel.channelType} failed — timeout after 5s (simulated)` },
    )
    setTesting(false)
  }

  // Build config key-value pairs, filtering out internal/empty
  const config: ChannelConfig = channel.config as ChannelConfig
  const configEntries: [string, string][] = []
  const skipKeys = new Set(['secret', 'credentials', 'auth'])
  for (const [key, value] of Object.entries(config)) {
    if (skipKeys.has(key)) continue
    if (value === undefined || value === null || value === '') continue
    if (typeof value === 'object') continue
    configEntries.push([key, String(value)])
  }
  // Add secret/credential entries if present
  if (config.secret) {
    configEntries.push(['secret', maskSecret(config.secret)])
  }
  if (config.authType) {
    configEntries.push(['authType', config.authType])
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={badgeStyle(channelTypeColor(channel.channelType))}>
            {channel.channelType}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600 }}>
            <span style={dotStyle(channel.isActive)} />
            <span style={{ color: channel.isActive ? '#22c55e' : '#6b7280' }}>
              {channel.isActive ? 'Active' : 'Inactive'}
            </span>
          </span>
        </div>
      </div>

      {/* Config fields */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Configuration</h3>
        {configEntries.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--txd)' }}>No configuration fields</p>
        ) : (
          <table style={configTableStyle}>
            <tbody>
              {configEntries.map(([key, value]) => (
                <tr key={key}>
                  <td style={{ ...configThStyle, borderBottom: '1px solid var(--border)' }}>
                    {key}
                  </td>
                  <td style={configTdStyle}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Retry policy */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Retry Policy</h3>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Max attempts</span>
          <span style={fieldValueStyle}>{channel.retryPolicy.maxAttempts}</span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Backoff</span>
          <span style={fieldValueStyle}>{channel.retryPolicy.backoffMs}ms</span>
        </div>
      </div>

      {/* Test Connection */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Test Connection</h3>
        <button
          style={testing ? testBtnDisabledStyle : testBtnStyle}
          disabled={testing}
          onClick={handleTestConnection}
        >
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        {result && (
          <div style={resultBannerStyle(result.success)}>
            {result.success ? '✅ ' : '❌ '}
            {result.message}
          </div>
        )}
      </div>

      {/* Channel ID */}
      <div style={{ marginTop: 16, fontSize: 10, color: 'var(--txhd)', fontFamily: 'monospace' }}>
        ID: {channel.id}
      </div>
    </div>
  )
}
