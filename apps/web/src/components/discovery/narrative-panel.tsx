import type { DashboardData } from './types'
import { DISCOVERY_COPY } from './discovery-copy'
import { EmptyPanel, JsonBlock, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

/**
 * Best-effort split of narrative sections into the three Institutional Story
 * framing buckets, derived only from existing narrative_engine section
 * titles/ids. Sections that don't match a known bucket fall back to
 * "What your evidence currently supports" so nothing is dropped.
 */
function bucketForSection(section: Record<string, unknown>): 'who' | 'supports' | 'strengthen' {
  const key = `${String(section.sectionId ?? '')} ${String(section.title ?? '')}`.toLowerCase()
  if (key.includes('who') || key.includes('identity') || key.includes('overview')) return 'who'
  if (key.includes('gap') || key.includes('strengthen') || key.includes('weak') || key.includes('risk')) return 'strengthen'
  return 'supports'
}

export function DiscoveryNarrativePanel({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="No institutional story available." />

  const narrativeOutput = data.agentOutputs['narrative_engine']?.output ?? null
  const sections = (narrativeOutput?.sections as Array<Record<string, unknown>> | undefined) ?? []
  const summary = narrativeOutput?.summary as string | undefined

  if (!narrativeOutput) {
    return (
      <EmptyPanel
        message="Kadarn has not synthesized an institutional story for this session yet."
        hint="Story sections appear once timeline, capabilities found, and evidence claims are available."
      />
    )
  }

  const buckets: Record<'who' | 'supports' | 'strengthen', Array<Record<string, unknown>>> = {
    who: [],
    supports: [],
    strengthen: [],
  }
  for (const section of sections) {
    buckets[bucketForSection(section)].push(section)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader title={DISCOVERY_COPY.storyTitle} description={DISCOVERY_COPY.storyDescription} />

      {summary ? (
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Executive summary
          </div>
          <p style={{ fontSize: 14, color: 'var(--tx)', lineHeight: 1.6, margin: 0 }}>{summary}</p>
        </div>
      ) : null}

      {sections.length > 0 ? (
        <>
          <StoryBucket title={DISCOVERY_COPY.storyWhoSection} sections={buckets.who} />
          <StoryBucket title={DISCOVERY_COPY.storyWhatSupportsSection} sections={buckets.supports} />
          <StoryBucket title={DISCOVERY_COPY.storyWhatToStrengthenSection} sections={buckets.strengthen} />
        </>
      ) : (
        <JsonBlock value={narrativeOutput} />
      )}
    </div>
  )
}

function StoryBucket({ title, sections }: { title: string; sections: Array<Record<string, unknown>> }) {
  return (
    <section>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>{title}</h3>
      {sections.length === 0 ? (
        <div style={{ ...cardStyle, fontSize: 12, color: 'var(--txdd)' }}>{DISCOVERY_COPY.notAvailableYet}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sections
            .slice()
            .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
            .map((section) => {
              const paragraphs = (section.paragraphs as Array<Record<string, unknown>> | undefined) ?? []
              return (
                <div key={String(section.sectionId ?? section.title)} style={cardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>
                    {String(section.title ?? 'Section')}
                  </div>
                  {paragraphs.length > 0 ? (
                    paragraphs.map((para, idx) => (
                      <p key={idx} style={{ fontSize: 13, color: 'var(--txd)', lineHeight: 1.6, margin: '0 0 10px' }}>
                        {String(para.text ?? '')}
                      </p>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--txdd)' }}>{DISCOVERY_COPY.notAvailableYet}</div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </section>
  )
}
