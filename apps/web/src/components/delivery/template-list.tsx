'use client'

import { useState } from 'react'
import type { DeliveryTemplate, TemplateSlot } from '@kadarn/delivery-domain'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TemplateListProps {
  templates: DeliveryTemplate[]
  onSelect: (id: string) => void
  selectedId?: string
}

type CategoryFilter = 'all' | 'report' | 'pack' | 'passport' | 'audit'

// ─── Helpers ────────────────────────────────────────────────────────────────

function truncateHash(hash: string, chars = 10): string {
  return hash.slice(0, chars) + '…' + hash.slice(-4)
}

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

function slotsCountLabel(slots: TemplateSlot[]): string {
  const r = slots.filter((s) => s.required).length
  const o = slots.length - r
  if (o === 0) return `${r} slots`
  return `${slots.length} slots (${r} required)`
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--navy2)',
  overflow: 'hidden',
}

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  background: 'var(--navy1)',
}

function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: active ? 700 : 500,
    color: active ? 'var(--tx)' : 'var(--txd)',
    background: active ? 'var(--border)' : 'transparent',
    border: '1px solid transparent',
    borderRadius: 6,
    cursor: 'pointer',
  }
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: 420,
  overflowY: 'auto',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--txd)',
  padding: '8px 12px',
  borderBottom: '1px solid var(--border)',
  position: 'sticky',
  top: 0,
  background: 'var(--navy2)',
  zIndex: 1,
}

function tdStyle(last = false): React.CSSProperties {
  return {
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--tx)',
    borderBottom: last ? 'none' : '1px solid var(--border)',
  }
}

function rowStyle(selected: boolean, deprecated: boolean): React.CSSProperties {
  return {
    cursor: 'pointer',
    background: selected ? 'rgba(20,184,166,.08)' : 'transparent',
    borderLeft: selected ? '3px solid var(--teal)' : '3px solid transparent',
    opacity: deprecated ? 0.55 : 1,
    transition: 'background 100ms',
  }
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

const ghostBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 4,
  border: '1px solid var(--border)',
  color: 'var(--txd)',
  letterSpacing: 0.3,
  textTransform: 'uppercase' as const,
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  color: 'var(--txd)',
  fontSize: 13,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TemplateList({ templates, onSelect, selectedId }: TemplateListProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all')

  const filtered = filter === 'all'
    ? templates
    : templates.filter((t) => t.metadata.category === filter)

  const categories: CategoryFilter[] = ['all', 'report', 'pack', 'passport', 'audit']
  const countByCat: Record<string, number> = {}
  for (const c of categories) {
    countByCat[c] = c === 'all' ? templates.length : templates.filter((t) => t.metadata.category === c).length
  }

  return (
    <div style={containerStyle}>
      {/* Filter bar */}
      <div style={filterBarStyle}>
        {categories.map((c) => (
          <button
            key={c}
            style={filterBtnStyle(filter === c)}
            onClick={() => setFilter(c)}
          >
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            &nbsp;
            <span style={{ opacity: 0.5, fontSize: 10 }}>({countByCat[c]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={tableStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Ver</th>
              <th style={thStyle}>Slots</th>
              <th style={thStyle}>Checksum</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const isDeprecated = t.metadata.deprecated === true
              const isLatest = !isDeprecated
              const isSelected = t.id === selectedId

              return (
                <tr
                  key={t.id}
                  style={rowStyle(isSelected, isDeprecated)}
                  onClick={() => onSelect(t.id)}
                >
                  <td style={tdStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                      {isDeprecated && <span style={badgeStyle('#6b7280')}>v1</span>}
                      {isLatest && t.version > 1 && <span style={badgeStyle('#22c55e')}>v{t.version}</span>}
                    </div>
                  </td>
                  <td style={tdStyle()}>
                    <span style={badgeStyle(categoryColor(t.metadata.category))}>
                      {t.metadata.category}
                    </span>
                  </td>
                  <td style={tdStyle()}>
                    <span style={badgeStyle(typeColor(t.artifactType))}>
                      {t.artifactType}
                    </span>
                  </td>
                  <td style={tdStyle()}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>
                      {t.version}
                    </span>
                  </td>
                  <td style={tdStyle()}>
                    <span style={{ fontSize: 12, color: 'var(--txd)' }}>
                      {slotsCountLabel(t.schema.slots)}
                    </span>
                  </td>
                  <td style={tdStyle(true)}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--txd)' }}>
                      {truncateHash(t.checksum, 8)}
                    </span>
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={emptyStyle}>
                  No templates match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
