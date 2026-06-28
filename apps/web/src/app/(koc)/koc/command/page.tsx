'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const COMMANDS = [
  { id: 'go-overview',    label: 'Go to Overview',         href: '/koc',                icon: '◎', section: 'Navigate' },
  { id: 'go-activity',    label: 'Go to Activity Feed',    href: '/koc/activity',       icon: '⚡', section: 'Navigate' },
  { id: 'go-trust',       label: 'Go to Trust Index',      href: '/koc/trust',          icon: '◈', section: 'Navigate' },
  { id: 'go-policy',      label: 'Go to Policy Dashboard', href: '/koc/policy',         icon: '○', section: 'Navigate' },
  { id: 'go-workflow',    label: 'Go to Workflow',         href: '/koc/workflow',       icon: '⇄', section: 'Navigate' },
  { id: 'go-twins',       label: 'Go to Digital Twins',    href: '/koc/twins',          icon: '◆', section: 'Navigate' },
  { id: 'go-provenance',  label: 'Go to Provenance',       href: '/koc/provenance',     icon: '▱', section: 'Navigate' },
  { id: 'go-knowledge',   label: 'Go to Knowledge Graph',  href: '/koc/knowledge',      icon: '◈', section: 'Navigate' },
  { id: 'go-exceptions',  label: 'Go to Exceptions',       href: '/koc/exceptions',     icon: '▲', section: 'Navigate' },
  { id: 'go-kpe',         label: 'Go to KPE',              href: '/koc/kpe',            icon: '◇', section: 'Navigate' },
  { id: 'go-capacity',    label: 'Go to Capacity',         href: '/koc/capacity',       icon: '▦', section: 'Navigate' },
  { id: 'go-health',      label: 'Go to Network Health',   href: '/koc/health',         icon: '⬡', section: 'Navigate' },
  { id: 'go-program',     label: 'Go to Programs',         href: '/marketplace',        icon: '◈', section: 'Navigate' },
  { id: 'go-workspace',   label: 'Go to Workspace',        href: '/workspace',          icon: '⚙', section: 'Navigate' },
  { id: 'go-marketplace', label: 'Go to Marketplace',      href: '/marketplace',        icon: '◎', section: 'Navigate' },
]

export default function CommandPalette() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    const timer = setTimeout(() => {
      fetch(`${API}/api/v1/search?q=${encodeURIComponent(query)}`, { credentials: 'include' })
        .then(r => r.json())
        .then(d => { setSearchResults(d.data?.results ?? []); setSearching(false) })
        .catch(() => { setSearching(false) })
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const filteredCommands = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.section.toLowerCase().includes(query.toLowerCase())
  )

  const allItems = [
    ...filteredCommands.map(c => ({ ...c, isSearch: false })),
    ...searchResults.map(r => ({ id: r.id, label: r.label, href: `/${r.type}/${r.id}`, icon: '→', section: r.type, detail: r.detail, isSearch: true })),
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && allItems[selectedIndex]) {
      router.push(allItems[selectedIndex].href)
    }
    if (e.key === 'Escape') { router.back() }
  }

  // Group by section for display
  const sections = new Map<string, typeof allItems>()
  allItems.forEach(item => {
    if (!sections.has(item.section)) sections.set(item.section, [])
    sections.get(item.section)!.push(item)
  })

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Command Palette</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>Quick navigation and search across the platform</p>

      <div style={{ marginBottom: 20 }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or search…"
          style={{
            width: '100%', padding: '12px 16px', fontSize: 15, borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--tx)',
            outline: 'none',
          }}
        />
      </div>

      {searching && <div style={{ color: 'var(--txdd)', fontSize: 12, padding: 8 }}>Searching...</div>}

      {!query && (
        <div>
          {Array.from(sections.entries()).map(([section, items]) => (
            <div key={section} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, paddingLeft: 4 }}>
                {section}
              </div>
              {items.map((item, i) => (
                <div key={item.id} onClick={() => router.push(item.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                    cursor: 'pointer', fontSize: 13,
                    background: i === selectedIndex ? 'rgba(68,103,242,0.12)' : 'transparent',
                    color: i === selectedIndex ? 'var(--blue)' : 'var(--tx)',
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.isSearch && <span style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'capitalize' }}>{item.section}</span>}
                  <span style={{ fontSize: 10, color: 'var(--txdd)' }}>↵</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {query && query.length >= 2 && allItems.length === 0 && !searching && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--txdd)' }}>
          No results for "{query}"
        </div>
      )}
    </div>
  )
}
