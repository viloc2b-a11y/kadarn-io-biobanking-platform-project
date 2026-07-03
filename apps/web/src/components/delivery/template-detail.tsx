'use client'

import type { DeliveryTemplate, TemplateSlot } from '@kadarn/delivery-domain'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TemplateDetailProps {
  template: DeliveryTemplate
  previousVersion?: DeliveryTemplate
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    report: '#3b82f6', pack: '#14b8a6', passport: '#22c55e', audit: '#a855f7',
  }
  return map[cat] ?? '#6b7280'
}

function typeColor(type: string): string {
  const map: Record<string, string> = {
    pdf: '#ef4444', json: '#f59e0b', zip: '#8b5cf6', html: '#3b82f6', csv: '#22c55e',
  }
  return map[type] ?? '#6b7280'
}

function slotTypeColor(type: string): string {
  const map: Record<string, string> = {
    text: '#3b82f6', table: '#8b5cf6', chart: '#ec4899',
    list: '#f59e0b', json: '#14b8a6', markdown: '#22c55e',
  }
  return map[type] ?? '#6b7280'
}

function formatValidation(v: TemplateSlot['validation']): string {
  if (!v) return '—'
  const parts: string[] = []
  if (v.minLength) parts.push(`min ${v.minLength}`)
  if (v.maxLength) parts.push(`max ${v.maxLength}`)
  if (v.pattern) parts.push(`/${v.pattern}/`)
  if (v.minItems) parts.push(`≥${v.minItems} items`)
  if (v.maxItems) parts.push(`≤${v.maxItems} items`)
  return parts.join(', ') || '—'
}

function isSlotNew(slotName: string, prev?: DeliveryTemplate): boolean {
  if (!prev) return false
  return !prev.schema.slots.some((s) => s.name === slotName)
}

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

const tagChipStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  color: 'var(--txd)',
  marginRight: 6,
  marginBottom: 6,
}

const warningBannerStyle: React.CSSProperties = {
  background: 'rgba(245,158,11,.12)',
  border: '1px solid rgba(245,158,11,.3)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 12,
  color: '#f59e0b',
  marginBottom: 16,
}

const checksumStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  color: 'var(--txd)',
  background: 'var(--navy1)',
  padding: '8px 12px',
  borderRadius: 6,
  wordBreak: 'break-all',
  lineHeight: 1.6,
}

const slotTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: 4,
}

const slotThStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--txd)',
  padding: '6px 8px',
  borderBottom: '1px solid var(--border)',
}

const slotTdStyle: React.CSSProperties = {
  padding: '8px',
  fontSize: 12,
  color: 'var(--tx)',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'top',
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  color: 'var(--txd)',
  fontSize: 13,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TemplateDetail({ template, previousVersion }: TemplateDetailProps) {
  const isDeprecated = template.metadata.deprecated === true

  return (
    <div style={cardStyle}>
      {/* Deprecated warning */}
      {isDeprecated && (
        <div style={warningBannerStyle}>
          ⚠️ This template is deprecated
          {template.metadata.supersededBy && (
            <span> — superseded by v{previousVersion?.version ?? '?'}</span>
          )}
        </div>
      )}

      {/* Header */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)' }}>
            {template.metadata.displayName}
          </span>
          <span style={badgeStyle(categoryColor(template.metadata.category))}>
            {template.metadata.category}
          </span>
          <span style={badgeStyle(typeColor(template.artifactType))}>
            {template.artifactType}
          </span>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--teal)',
          }}>
            v{template.version}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--txd)', margin: '4px 0 0', lineHeight: 1.5 }}>
          {template.metadata.description}
        </p>
      </div>

      {/* Tags */}
      {(template.metadata.tags?.length ?? 0) > 0 && (
        <div style={{ ...sectionStyle, marginBottom: 12 }}>
          {template.metadata.tags!.map((tag: string) => (
            <span key={tag} style={tagChipStyle}>{tag}</span>
          ))}
        </div>
      )}

      {/* Details grid */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Template Details</h3>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Schema version</span>
          <span style={fieldValueStyle}>{template.schema.version}</span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Layout</span>
          <span style={fieldValueStyle}>{template.schema.layout ?? 'default'}</span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Render engine</span>
          <span style={fieldValueStyle}>{template.renderEngine}</span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Created</span>
          <span style={fieldValueStyle}>
            {new Date(template.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Updated</span>
          <span style={fieldValueStyle}>
            {new Date(template.updatedAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Checksum</span>
          <span style={fieldValueStyle}>{template.checksum.slice(0, 16)}…</span>
        </div>
      </div>

      {/* Slots */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          Slots ({template.schema.slots.length})
          {previousVersion && (
            <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--txd)', marginLeft: 6 }}>
              — new slots highlighted
            </span>
          )}
        </h3>
        <table style={slotTableStyle}>
          <thead>
            <tr>
              <th style={slotThStyle}>Name</th>
              <th style={slotThStyle}>Type</th>
              <th style={slotThStyle}>Req</th>
              <th style={slotThStyle}>Description</th>
              <th style={slotThStyle}>Validation</th>
            </tr>
          </thead>
          <tbody>
            {template.schema.slots.map((slot) => {
              const isNew = isSlotNew(slot.name, previousVersion)
              return (
                <tr
                  key={slot.name}
                  style={isNew ? { background: 'rgba(20,184,166,.06)' } : undefined}
                >
                  <td style={slotTdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 600 }}>{slot.name}</span>
                      {isNew && (
                        <span style={{
                          fontSize: 9,
                          background: 'var(--teal)',
                          color: '#fff',
                          padding: '1px 5px',
                          borderRadius: 3,
                          fontWeight: 700,
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={slotTdStyle}>
                    <span style={badgeStyle(slotTypeColor(slot.type))}>{slot.type}</span>
                  </td>
                  <td style={{ ...slotTdStyle, textAlign: 'center' }}>
                    {slot.required ? (
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>✅</span>
                    ) : (
                      <span style={{ color: 'var(--txd)' }}>○</span>
                    )}
                  </td>
                  <td style={{ ...slotTdStyle, fontSize: 11, color: 'var(--txd)', maxWidth: 180 }}>
                    {slot.description}
                    {slot.defaultValue !== undefined && (
                      <span style={{ display: 'block', fontSize: 10, marginTop: 2, color: 'var(--txhd)' }}>
                        Default: {JSON.stringify(slot.defaultValue)}
                      </span>
                    )}
                  </td>
                  <td style={{ ...slotTdStyle, fontSize: 11, color: 'var(--txd)' }}>
                    {formatValidation(slot.validation)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Side-by-side version comparison (compact) */}
      {previousVersion && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            Changes from v{previousVersion.version} → v{template.version}
          </h3>
          <div style={{ fontSize: 12, color: 'var(--txd)', lineHeight: 1.6 }}>
            <p style={{ margin: '4px 0' }}>
              ▸ <strong>+{template.schema.slots.length - previousVersion.schema.slots.length} slots</strong> added
            </p>
            <p style={{ margin: '4px 0' }}>
              ▸ Schema version: {previousVersion.schema.version} → {template.schema.version}
            </p>
            {template.metadata.tags && previousVersion.metadata.tags && (
              <p style={{ margin: '4px 0' }}>
                ▸ Tags: {previousVersion.metadata.tags.length} → {template.metadata.tags.length}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Full checksum */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Full Checksum (SHA-256)</h3>
        <div style={checksumStyle}>{template.checksum}</div>
      </div>
    </div>
  )
}
