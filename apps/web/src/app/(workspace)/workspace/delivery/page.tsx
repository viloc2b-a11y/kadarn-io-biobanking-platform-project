'use client'

import { useState, useMemo } from 'react'
import { ArtifactList } from '@/components/delivery/artifact-list'
import { ArtifactDetail } from '@/components/delivery/artifact-detail'
import { HistoryTimeline } from '@/components/delivery/history-timeline'
import { SubscriptionList } from '@/components/delivery/subscription-list'
import { SubscriptionDetail } from '@/components/delivery/subscription-detail'
import { PolicyOverview } from '@/components/delivery/policy-overview'
import { PolicyTester } from '@/components/delivery/policy-tester'
import { TemplateList } from '@/components/delivery/template-list'
import { TemplateDetail } from '@/components/delivery/template-detail'
import { ChannelList } from '@/components/delivery/channel-list'
import { ChannelDetail } from '@/components/delivery/channel-detail'
import { AuditViewer } from '@/components/delivery/audit-viewer'
import { AuditReplay } from '@/components/delivery/audit-replay'
import { RetryManager } from '@/components/delivery/retry-manager'
import {
  MOCK_ARTIFACTS,
  MOCK_AUDIT_TRAIL,
  MOCK_SUBSCRIPTIONS,
  MOCK_TEMPLATES,
  MOCK_CHANNELS,
  MOCK_QUEUE,
  MOCK_DLQ,
  getArtifactById,
  getAuditForArtifact,
} from '@/components/delivery/mock-data'

// ─── Types ──────────────────────────────────────────────────────────────────

type DeliveryTab =
  | 'artifacts'
  | 'history'
  | 'subscriptions'
  | 'policies'
  | 'templates'
  | 'channels'
  | 'queue'
  | 'audit'

interface TabDefinition {
  id: DeliveryTab
  label: string
  icon: string
  placeholder: string
}

const TABS: TabDefinition[] = [
  { id: 'artifacts',     label: 'Artifacts',     icon: '\u{1F4E6}', placeholder: '' },
  { id: 'history',       label: 'History',       icon: '\u{1F4DC}', placeholder: '' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '\u{1F514}', placeholder: '' },
  { id: 'policies',      label: 'Policies',      icon: '\u{1F6E1}\uFE0F', placeholder: '' },
  { id: 'templates',     label: 'Templates',     icon: '\u{1F4CB}', placeholder: '' },
  { id: 'channels',      label: 'Channels',      icon: '\u{1F4E1}', placeholder: '' },
  { id: 'queue',         label: 'Queue',         icon: '\u{1F504}', placeholder: '' },
  { id: 'audit',         label: 'Audit',         icon: '\u{1F50D}', placeholder: '' },
]

// ─── Styles ─────────────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  marginBottom: 24,
}

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  letterSpacing: -0.5,
  marginBottom: 4,
  color: 'var(--tx)',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--txd)',
  lineHeight: 1.5,
}

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid var(--border)',
  marginBottom: 20,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
}

function tabStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--tx)' : 'var(--txd)',
    borderBottom: isActive ? '2px solid var(--teal)' : '2px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color 150ms, border-color 150ms',
    marginBottom: -1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  background: 'var(--navy2)',
  padding: '28px 24px',
  textAlign: 'center',
  minHeight: 280,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}

const cardIconStyle: React.CSSProperties = {
  fontSize: 40,
  marginBottom: 16,
  opacity: 0.6,
}

const cardHeadingStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--tx)',
  marginBottom: 8,
}

const cardTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--txd)',
  maxWidth: 400,
  lineHeight: 1.6,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase' as const,
  color: 'var(--teal)',
  background: 'var(--teal-alpha, rgba(20,184,166,.12))',
  padding: '2px 8px',
  borderRadius: 6,
  marginTop: 14,
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function DeliveryWorkspacePage() {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('artifacts')
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | undefined>()
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | undefined>()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>()
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>()
  const [subscriptions, setSubscriptions] = useState(MOCK_SUBSCRIPTIONS)

  const currentTab = TABS.find((t) => t.id === activeTab) ?? TABS[0]
  const selectedArtifact = useMemo(
    () => selectedArtifactId ? getArtifactById(selectedArtifactId) : undefined,
    [selectedArtifactId],
  )

  const selectedTemplate = useMemo(
    () => selectedTemplateId ? MOCK_TEMPLATES.find((t) => t.id === selectedTemplateId) : undefined,
    [selectedTemplateId],
  )

  // Smart previousVersion: if SponsorReport v2 selected, pass v1
  const previousTemplate = useMemo(() => {
    if (!selectedTemplate) return undefined
    if (selectedTemplate.metadata.supersededBy) {
      return MOCK_TEMPLATES.find((t) => t.id === selectedTemplate.metadata.supersededBy)
    }
    if (selectedTemplate.name === 'SponsorReport' && selectedTemplate.version === 2) {
      return MOCK_TEMPLATES.find((t) => t.name === 'SponsorReport' && t.version === 1)
    }
    return undefined
  }, [selectedTemplate])

  const selectedChannel = useMemo(
    () => selectedChannelId ? MOCK_CHANNELS.find((c) => c.id === selectedChannelId) : undefined,
    [selectedChannelId],
  )

  const selectedSubscription = useMemo(
    () => selectedSubscriptionId ? subscriptions.find((s) => s.id === selectedSubscriptionId) : undefined,
    [selectedSubscriptionId, subscriptions],
  )

  const handleToggleSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    )
  }

  const clearSelections = () => {
    setSelectedArtifactId(undefined)
    setSelectedSubscriptionId(undefined)
    setSelectedTemplateId(undefined)
    setSelectedChannelId(undefined)
  }

  const artifactIds = useMemo(() => [...new Set(MOCK_AUDIT_TRAIL.map(e => e.artifactId))], [])

  return (
    <div>
      {/* ── Header ── */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>Delivery Workspace</h1>
        <p style={subtitleStyle}>
          Manage evidence delivery artifacts, channels, policies, and audit trails.
        </p>
      </header>

      {/* ── Tab Bar ── */}
      <nav style={tabBarStyle} role="tablist" aria-label="Delivery workspace sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            aria-controls={`delivery-panel-${tab.id}`}
            style={tabStyle(tab.id === activeTab)}
            onClick={() => { setActiveTab(tab.id); clearSelections() }}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Content Panels ── */}

      {/* Tab: Artifacts (9.12B) */}
      {activeTab === 'artifacts' && (
        <section
          id="delivery-panel-artifacts"
          role="tabpanel"
          aria-labelledby="delivery-tab-artifacts"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}
        >
          <ArtifactList
            artifacts={MOCK_ARTIFACTS}
            onSelectArtifact={setSelectedArtifactId}
            selectedArtifactId={selectedArtifactId}
          />
          {selectedArtifact ? (
            <ArtifactDetail
              artifact={selectedArtifact}
              auditTrail={getAuditForArtifact(selectedArtifact.id)}
            />
          ) : (
            <div style={cardStyle}>
              <div style={cardIconStyle} aria-hidden="true">{'\u{1F4E6}'}</div>
              <h2 style={cardHeadingStyle}>Select an Artifact</h2>
              <p style={cardTextStyle}>Click on an artifact from the list to view its details and audit trail.</p>
            </div>
          )}
        </section>
      )}

      {/* Tab: History (9.12B) */}
      {activeTab === 'history' && (
        <section
          id="delivery-panel-history"
          role="tabpanel"
          aria-labelledby="delivery-tab-history"
        >
          <HistoryTimeline entries={MOCK_AUDIT_TRAIL} />
        </section>
      )}

      {/* Tab: Subscriptions (9.12C) */}
      {activeTab === 'subscriptions' && (
        <section
          id="delivery-panel-subscriptions"
          role="tabpanel"
          aria-labelledby="delivery-tab-subscriptions"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}
        >
          <SubscriptionList
            subscriptions={subscriptions}
            onToggle={handleToggleSubscription}
            onSelect={setSelectedSubscriptionId}
            selectedId={selectedSubscriptionId}
          />
          {selectedSubscription ? (
            <SubscriptionDetail subscription={selectedSubscription} />
          ) : (
            <div style={cardStyle}>
              <div style={cardIconStyle} aria-hidden="true">{'\u{1F514}'}</div>
              <h2 style={cardHeadingStyle}>Select a Subscription</h2>
              <p style={cardTextStyle}>Click on a subscription from the list to view its details.</p>
            </div>
          )}
        </section>
      )}

      {/* Tab: Policies (9.12C) */}
      {activeTab === 'policies' && (
        <section
          id="delivery-panel-policies"
          role="tabpanel"
          aria-labelledby="delivery-tab-policies"
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <PolicyOverview />
          <PolicyTester />
        </section>
      )}

      {/* Tab: Templates (9.12D) */}
      {activeTab === 'templates' && (
        <section
          id="delivery-panel-templates"
          role="tabpanel"
          aria-labelledby="delivery-tab-templates"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}
        >
          <TemplateList
            templates={MOCK_TEMPLATES}
            onSelect={setSelectedTemplateId}
            selectedId={selectedTemplateId}
          />
          {selectedTemplate ? (
            <TemplateDetail
              template={selectedTemplate}
              previousVersion={previousTemplate}
            />
          ) : (
            <div style={cardStyle}>
              <div style={cardIconStyle} aria-hidden="true">{'\u{1F4CB}'}</div>
              <h2 style={cardHeadingStyle}>Select a Template</h2>
              <p style={cardTextStyle}>Click on a template from the list to view its slots, schema, and version history.</p>
            </div>
          )}
        </section>
      )}

      {/* Tab: Channels (9.12D) */}
      {activeTab === 'channels' && (
        <section
          id="delivery-panel-channels"
          role="tabpanel"
          aria-labelledby="delivery-tab-channels"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}
        >
          <ChannelList
            channels={MOCK_CHANNELS}
            onSelect={setSelectedChannelId}
            selectedId={selectedChannelId}
          />
          {selectedChannel ? (
            <ChannelDetail channel={selectedChannel} />
          ) : (
            <div style={cardStyle}>
              <div style={cardIconStyle} aria-hidden="true">{'\u{1F4E1}'}</div>
              <h2 style={cardHeadingStyle}>Select a Channel</h2>
              <p style={cardTextStyle}>Click on a channel from the list to view its configuration and test connectivity.</p>
            </div>
          )}
        </section>
      )}

      {/* Tab: Queue (9.12E) */}
      {activeTab === 'queue' && (
        <section
          id="delivery-panel-queue"
          role="tabpanel"
          aria-labelledby="delivery-tab-queue"
        >
          <RetryManager queue={MOCK_QUEUE} dlq={MOCK_DLQ} />
        </section>
      )}

      {/* Tab: Audit (9.12E) */}
      {activeTab === 'audit' && (
        <section
          id="delivery-panel-audit"
          role="tabpanel"
          aria-labelledby="delivery-tab-audit"
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <AuditViewer entries={MOCK_AUDIT_TRAIL} artifactIds={artifactIds} />
          <AuditReplay entries={MOCK_AUDIT_TRAIL} artifactIds={artifactIds} />
        </section>
      )}
    </div>
  )
}
