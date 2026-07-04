import type { PassportRecommendation } from '../passport-types'
import { cardStyle, cardTitleStyle } from '../passport-styles'

export function RecommendationsSection({ recommendations }: { recommendations: PassportRecommendation[] }) {
  return (
    <section id="passport-recommendations" style={cardStyle} aria-labelledby="passport-recommendations-heading">
      <h2 id="passport-recommendations-heading" style={cardTitleStyle}>Recommendations</h2>
      <p style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 16, lineHeight: 1.45 }}>
        What Kadarn suggests you consider next — advisory, not prescriptive.
      </p>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {recommendations.map((rec) => (
          <li
            key={rec.id}
            style={{
              padding: '14px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {rec.isNextAction && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: 'var(--teal)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Suggested next action
              </span>
            )}
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 6 }}>
              {rec.action}
            </div>
            <p style={{ fontSize: 13, color: 'var(--txd)', margin: '0 0 6px', lineHeight: 1.45 }}>
              {rec.reason}
            </p>
            <p style={{ fontSize: 11, color: 'var(--txdd)', margin: 0, lineHeight: 1.4 }}>
              Expected impact: {rec.expectedImpact}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
