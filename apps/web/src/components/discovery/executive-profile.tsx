import type {
  DashboardData,
  AssessmentIntelligenceData,
  GapIntelligenceData,
  SponsorReadinessData,
  RecommendationEngineData,
  CapabilityIntelligenceData,
} from './types'
import { DASHBOARD_TABS } from './types'
import { Badge, cardStyle } from './panel-primitives'

// ==========================================================================
// Executive Institution Profile — Sprint 22B
// ==========================================================================
// The primary institutional identity page of Kadarn.
// Consumes canonical engine outputs. Owns only presentation.
// Business language only — no engine names, no technical terms.
// ==========================================================================

interface ExecutiveProfileProps {
  data: DashboardData | null
  loading: boolean
}

export function ExecutiveInstitutionProfile({ data, loading }: ExecutiveProfileProps) {
  if (loading && !data) return <ProfileSkeleton />
  if (!data) return <EmptyProfile />

  const institutionName = 'Institution'
  const caps = data.capabilityIntelligence
  const gaps = data.gapIntelligence
  const assessment = data.assessmentIntelligence
  const readiness = data.sponsorReadiness
  const recs = data.recommendations

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* 1. Hero */}
      <ProfileHero name={institutionName} story={caps} />

      {/* 2. Executive Summary */}
      <ExecutiveSummaryCard
        caps={caps}
        assessment={assessment}
        readiness={readiness}
        session={data.session}
      />

      {/* 3. Sponsor Readiness */}
      {readiness && <SponsorReadinessCard readiness={readiness} />}

      {/* 4. Institutional Capabilities */}
      {assessment && <CapabilitiesCard assessment={assessment} />}

      {/* 5. Research Assets Enabled */}
      {assessment && <ResearchAssetsCard assessment={assessment} />}

      {/* 6. Recommended Next Actions */}
      {recs && <RecommendationsCard recs={recs} />}

      {/* 7. Evidence Highlights */}
      {caps && <HighlightsCard caps={caps} />}

      {/* 8. Evidence Gaps */}
      {gaps && <GapsCard gaps={gaps} />}

      {/* 9. Quick Actions */}
      <QuickActionsCard />
    </div>
  )
}

// --------------------------------------------------------------------------
// Hero
// --------------------------------------------------------------------------

function ProfileHero({ name, story }: { name: string; story?: CapabilityIntelligenceData }) {
  const storyText = story
    ? `${name} demonstrates ${story.capabilities.filter((c) => c.status === 'supported').length} evidence-supported institutional capabilities enabling ${new Set(story.capabilities.flatMap((c) => c.research_assets_enabled)).size} research asset types for clinical and translational research.`
    : `${name} is enrolled in Kadarn's institutional intelligence platform. Discovery data is being processed to reconstruct the institution's evidence profile.`

  return (
    <div style={{ ...cardStyle, padding: '32px 24px', borderLeft: '4px solid var(--blue, #3b82f6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)', margin: 0 }}>{name}</h1>
          <p style={{ fontSize: 13, color: 'var(--txd)', margin: '4px 0 0' }}>Institutional Profile</p>
        </div>
      </div>
      <p style={{ fontSize: 14, color: 'var(--txd)', lineHeight: 1.7, margin: 0 }}>{storyText}</p>
    </div>
  )
}

// --------------------------------------------------------------------------
// Executive Summary
// --------------------------------------------------------------------------

function ExecutiveSummaryCard({
  caps,
  assessment,
  readiness,
  session,
}: {
  caps?: CapabilityIntelligenceData
  assessment?: AssessmentIntelligenceData
  readiness?: SponsorReadinessData
  session?: DashboardData['session']
}) {
  const totalCaps = caps?.capabilities.length ?? 0
  const totalAssets = new Set(caps?.capabilities.flatMap((c) => c.research_assets_enabled) ?? []).size
  const summary = assessment?.summary

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', margin: '0 0 16px' }}>Institution Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatBox label="Capabilities Detected" value={totalCaps} />
        <StatBox label="Research Assets Enabled" value={totalAssets} />
        {summary && <StatBox label="Healthy" value={summary.healthy} tone="green" />}
        {summary && summary.blocked > 0 && <StatBox label="Blocked" value={summary.blocked} tone="red" />}
      </div>
      {readiness && (
        <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'var(--bg2)' }}>
          <span style={{ fontSize: 12, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Sponsor Presentation Status
          </span>
          <div style={{ marginTop: 6 }}>
            <Badge
              label={readiness.readiness_label}
              tone={
                readiness.readiness_label === 'Presentation Ready' ? 'green'
                : readiness.readiness_label === 'Not Enough Evidence Yet' ? 'default'
                : 'amber'
              }
            />
          </div>
        </div>
      )}
      {session?.updated_at && (
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--txdd)' }}>
          Last updated: {new Date(session.updated_at).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}

// --------------------------------------------------------------------------
// Sponsor Readiness
// --------------------------------------------------------------------------

function SponsorReadinessCard({ readiness }: { readiness: SponsorReadinessData }) {
  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', margin: '0 0 16px' }}>Sponsor Readiness</h2>
      <p style={{ fontSize: 13, color: 'var(--txd)', lineHeight: 1.6, margin: '0 0 16px' }}>{readiness.summary}</p>
      {readiness.strengths.length > 0 && (
        <ListSection title="Strengths" items={readiness.strengths} tone="green" />
      )}
      {readiness.concerns.length > 0 && (
        <ListSection title="Areas for Improvement" items={readiness.concerns} tone="amber" />
      )}
      {readiness.blocking_items.length > 0 && (
        <ListSection title="Blocking Items" items={readiness.blocking_items} tone="red" />
      )}
    </div>
  )
}

// --------------------------------------------------------------------------
// Institutional Capabilities
// --------------------------------------------------------------------------

function CapabilitiesCard({ assessment }: { assessment: AssessmentIntelligenceData }) {
  const grouped = new Map<string, typeof assessment.assessment>()
  for (const a of assessment.assessment) {
    const cat = a.category || 'Other'
    const list = grouped.get(cat) ?? []
    list.push(a)
    grouped.set(cat, list)
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', margin: '0 0 16px' }}>Institutional Capabilities</h2>
      {Array.from(grouped.entries()).map(([category, caps]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--txd)', margin: '0 0 8px' }}>{category}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {caps.slice(0, 5).map((cap) => (
              <CapabilityRow key={cap.capability_id} cap={cap} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CapabilityRow({ cap }: { cap: AssessmentIntelligenceData['assessment'][number] }) {
  const tone = cap.assessment_status === 'healthy' ? 'green'
    : cap.assessment_status === 'blocked' ? 'red'
    : cap.assessment_status === 'attention_needed' ? 'amber'
    : 'default'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--tx)' }}>{cap.capability_name}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--txdd)' }}>{cap.operational_maturity}</span>
        <Badge label={cap.assessment_status} tone={tone} />
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Research Assets
// --------------------------------------------------------------------------

function ResearchAssetsCard({ assessment }: { assessment: AssessmentIntelligenceData }) {
  const assetMap = new Map<string, string[]>()
  for (const a of assessment.assessment) {
    for (const asset of a.research_assets_enabled) {
      const caps = assetMap.get(asset) ?? []
      caps.push(a.capability_name)
      assetMap.set(asset, caps)
    }
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', margin: '0 0 16px' }}>Research Assets Enabled</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {Array.from(assetMap.entries()).map(([asset, capabilities]) => (
          <div key={asset} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg2)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{asset}</div>
            <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 4 }}>
              Supported by {capabilities.length} capability
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Recommendations
// --------------------------------------------------------------------------

function RecommendationsCard({ recs }: { recs: RecommendationEngineData }) {
  const top = recs.recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').slice(0, 5)

  if (top.length === 0) return null

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', margin: '0 0 16px' }}>Recommended Next Actions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {top.map((rec) => (
          <div key={rec.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <Badge label={rec.priority} tone={rec.priority === 'critical' ? 'red' : 'amber'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{rec.title}</div>
              <div style={{ fontSize: 12, color: 'var(--txd)', marginTop: 2 }}>{rec.reason}</div>
              <div style={{ fontSize: 11, color: 'var(--blue, #3b82f6)', marginTop: 4 }}>{rec.recommended_action}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Evidence Highlights
// --------------------------------------------------------------------------

function HighlightsCard({ caps }: { caps: CapabilityIntelligenceData }) {
  const supported = caps.capabilities
    .filter((c) => c.status === 'supported' && c.supporting_evidence.length > 0)
    .slice(0, 5)

  if (supported.length === 0) return null

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', margin: '0 0 16px' }}>Evidence Highlights</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {supported.map((cap) => (
          <div key={cap.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{cap.name}</div>
            <div style={{ fontSize: 12, color: 'var(--txd)', marginTop: 2 }}>
              {cap.supporting_evidence.length} pieces of supporting evidence
              {cap.supporting_claims.length > 0 && ` · ${cap.supporting_claims.length} supporting claims`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Evidence Gaps
// --------------------------------------------------------------------------

function GapsCard({ gaps }: { gaps: GapIntelligenceData }) {
  const blocking = gaps.gaps.filter((g) => g.blocking).slice(0, 5)

  if (blocking.length === 0) return null

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', margin: '0 0 16px' }}>Areas for Improvement</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {blocking.map((gap) => (
          <div key={gap.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <Badge label={gap.severity} tone="red" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{gap.title}</div>
              <div style={{ fontSize: 12, color: 'var(--txd)', marginTop: 2 }}>
                {gap.evidence_needed.slice(0, 2).join('; ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Quick Actions
// --------------------------------------------------------------------------

function QuickActionsCard() {
  const actions = [
    { label: 'Generate Recognition Report', icon: '📄' },
    { label: 'Open Discovery', icon: '🔍' },
    { label: 'View Evidence Timeline', icon: '📅' },
    { label: 'Review Validation Notes', icon: '✓' },
  ]

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', margin: '0 0 12px' }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,.25)',
              background: 'var(--bg2)',
              color: 'var(--tx)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------
// Shared components
// --------------------------------------------------------------------------

function StatBox({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'red' }) {
  return (
    <div style={{ padding: '12px', borderRadius: 8, background: 'var(--bg2)', textAlign: 'center' }}>
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: tone === 'green' ? 'var(--green, #22c55e)'
          : tone === 'red' ? 'var(--red, #ef4444)'
          : 'var(--tx)',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function ListSection({ title, items, tone }: { title: string; items: string[]; tone?: 'green' | 'amber' | 'red' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: tone === 'green' ? 'var(--green, #22c55e)'
          : tone === 'amber' ? 'var(--amber, #f59e0b)'
          : 'var(--red, #ef4444)',
        marginBottom: 6,
      }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 13, color: 'var(--txd)' }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

// --------------------------------------------------------------------------
// Empty / Loading states
// --------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
      <div style={{ ...cardStyle, height: 120, opacity: 0.5 }} />
      <div style={{ ...cardStyle, height: 80, marginTop: 24, opacity: 0.3 }} />
    </div>
  )
}

function EmptyProfile() {
  return (
    <div style={{ maxWidth: 960, margin: '80px auto', textAlign: 'center', padding: 32 }}>
      <h2 style={{ fontSize: 20, color: 'var(--tx)', margin: '0 0 8px' }}>No institution data available</h2>
      <p style={{ fontSize: 14, color: 'var(--txdd)' }}>
        Start a discovery session to begin building this institution's profile.
      </p>
    </div>
  )
}
