import type {
  CapabilityIntelligenceData,
  AssessmentIntelligenceData,
  GapIntelligenceData,
  SponsorReadinessData,
  RecommendationEngineData,
} from './types'
import { Badge, cardStyle } from './panel-primitives'

// ==========================================================================
// Public Institution Profile — Sprint 22F
// ==========================================================================
// Public-facing institutional profile for kadarn.io/institutions/{slug}
// Business language only. No internal IDs. No Evidence Core. No engine names.
// Responsive. SEO-friendly.
// ==========================================================================

export interface PublicProfileData {
  institution_name: string
  institution_slug: string
  institution_story: string
  location?: string
  capabilities: CapabilityIntelligenceData | null
  assessment: AssessmentIntelligenceData | null
  gaps: GapIntelligenceData | null
  readiness: SponsorReadinessData | null
  recommendations: RecommendationEngineData | null
  generated_at: string
}

export function PublicInstitutionProfile({ data }: { data: PublicProfileData }) {
  const { institution_name, institution_story, location, capabilities, assessment, readiness, recommendations } = data

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* SEO: Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: institution_name,
            description: institution_story,
            url: `https://kadarn.io/institutions/${data.institution_slug}`,
          }),
        }}
      />

      {/* Hero */}
      <header style={{ marginBottom: 40, textAlign: 'center' }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 32, fontWeight: 700,
          }}
        >
          {institution_name.charAt(0)}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
          {institution_name}
        </h1>
        {location && <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{location}</p>}
        <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, maxWidth: 600, margin: '16px auto 0' }}>
          {institution_story}
        </p>
      </header>

      {/* Stats */}
      {assessment && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12,
          marginBottom: 40, ...cardStyle,
        }}>
          <PublicStat value={assessment.summary.healthy} label="Healthy capabilities" />
          <PublicStat value={assessment.summary.attention_needed} label="Need attention" amber />
          <PublicStat value={assessment.summary.blocked} label="Blocked" red />
          <PublicStat
            value={
              capabilities
                ? new Set(capabilities.capabilities.flatMap((c) => c.research_assets_enabled)).size
                : 0
            }
            label="Research assets"
          />
        </div>
      )}

      {/* Sponsor Readiness */}
      {readiness && (
        <section style={{ marginBottom: 40, ...cardStyle }}>
          <h2 style={sectionTitle}>Sponsor Readiness</h2>
          <div style={{ marginBottom: 12 }}>
            <Badge
              label={readiness.readiness_label}
              tone={
                readiness.readiness_label === 'Presentation Ready' ? 'green'
                : readiness.readiness_label === 'Not Enough Evidence Yet' ? 'default'
                : 'amber'
              }
            />
          </div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>
            {readiness.summary}
          </p>
          {readiness.strengths.length > 0 && (
            <PublicList title="Institutional Strengths" items={readiness.strengths} />
          )}
        </section>
      )}

      {/* Capabilities */}
      {assessment && (
        <section style={{ marginBottom: 40, ...cardStyle }}>
          <h2 style={sectionTitle}>Institutional Capabilities</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assessment.assessment.slice(0, 12).map((cap) => (
              <div key={cap.capability_id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid #e2e8f0',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{cap.capability_name}</div>
                  {cap.research_assets_enabled.length > 0 && (
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Enables: {cap.research_assets_enabled.join(', ')}
                    </div>
                  )}
                </div>
                <Badge
                  label={cap.assessment_status}
                  tone={cap.assessment_status === 'healthy' ? 'green' : cap.assessment_status === 'blocked' ? 'red' : 'amber'}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Research Assets */}
      {assessment && (
        <section style={{ marginBottom: 40, ...cardStyle }}>
          <h2 style={sectionTitle}>Research Assets Enabled</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(() => {
              const allAssets = new Set(assessment.assessment.flatMap((a) => a.research_assets_enabled))
              return Array.from(allAssets).map((asset) => (
                <span key={asset} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  background: '#dbeafe', color: '#1e40af',
                }}>
                  {asset}
                </span>
              ))
            })()}
          </div>
        </section>
      )}

      {/* Evidence Highlights */}
      {capabilities && (
        <section style={{ marginBottom: 40, ...cardStyle }}>
          <h2 style={sectionTitle}>Evidence Highlights</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {capabilities.capabilities
              .filter((c) => c.status === 'supported' && c.supporting_evidence.length > 0)
              .slice(0, 5)
              .map((cap) => (
                <div key={cap.id} style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{cap.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    Supported by {cap.supporting_evidence.length} evidence references
                    {cap.supporting_claims.length > 0 && ` and ${cap.supporting_claims.length} claims`}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').length > 0 && (
        <section style={{ marginBottom: 40, ...cardStyle }}>
          <h2 style={sectionTitle}>Priority Improvements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.recommendations
              .filter((r) => r.priority === 'critical' || r.priority === 'high')
              .slice(0, 3)
              .map((rec) => (
                <div key={rec.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <Badge label={rec.priority} tone={rec.priority === 'critical' ? 'red' : 'amber'} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{rec.title}</div>
                    <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 2 }}>{rec.recommended_action}</div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Timeline placeholder */}
      <section style={{ marginBottom: 40, ...cardStyle }}>
        <h2 style={sectionTitle}>Institutional Timeline</h2>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Full institutional timeline available through the Kadarn platform.
        </p>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid #e2e8f0', marginTop: 40 }}>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
          Generated by Kadarn Institutional Intelligence Platform · {data.generated_at}
        </p>
        <p style={{ fontSize: 12, color: '#cbd5e1', margin: '6px 0 0' }}>
          This profile is derived from verifiable institutional evidence. No AI-generated content.
        </p>
      </footer>
    </div>
  )
}

// --------------------------------------------------------------------------
// Shared components
// --------------------------------------------------------------------------

const sectionTitle: React.CSSProperties = {
  fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 16px',
}

function PublicStat({ value, label, amber, red }: { value: number; label: string; amber?: boolean; red?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px' }}>
      <div style={{
        fontSize: 28, fontWeight: 700,
        color: red ? '#ef4444' : amber ? '#f59e0b' : '#1e293b',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function PublicList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', marginBottom: 6 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 14, color: '#475569' }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
