import type { PassportIdentity } from '../passport-types'
import { cardStyle, cardTitleStyle, fieldLabelStyle, fieldValueStyle, sourceStyle } from '../passport-styles'

export function IdentitySection({ identity }: { identity: PassportIdentity }) {
  return (
    <section id="passport-identity" style={cardStyle} aria-labelledby="passport-identity-heading">
      <h2 id="passport-identity-heading" style={cardTitleStyle}>Identity</h2>
      <p style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 16, lineHeight: 1.45 }}>
        Who this institution is — names, locations, and relationships as Kadarn currently understands them.
      </p>

      <h3 style={{ ...fieldLabelStyle, fontSize: 11, marginBottom: 8 }}>Names</h3>
      {identity.names.map((row) => (
        <div key={`${row.label}-${row.value}`} style={{ marginBottom: 12 }}>
          <div style={fieldLabelStyle}>{row.label}</div>
          <div style={fieldValueStyle}>{row.value}</div>
          <div style={sourceStyle}>Source: {row.source}</div>
        </div>
      ))}

      <h3 style={{ ...fieldLabelStyle, fontSize: 11, marginBottom: 8, marginTop: 8 }}>Locations</h3>
      {identity.locations.map((row) => (
        <div key={`${row.label}-${row.value}`} style={{ marginBottom: 12 }}>
          <div style={fieldLabelStyle}>{row.label}</div>
          <div style={fieldValueStyle}>{row.value}</div>
          <div style={sourceStyle}>Source: {row.source}</div>
        </div>
      ))}

      {identity.relationships.length > 0 && (
        <>
          <h3 style={{ ...fieldLabelStyle, fontSize: 11, marginBottom: 8, marginTop: 8 }}>Relationships</h3>
          {identity.relationships.map((row) => (
            <div key={`${row.label}-${row.value}`} style={{ marginBottom: 12 }}>
              <div style={fieldLabelStyle}>{row.label}</div>
              <div style={fieldValueStyle}>{row.value}</div>
              <div style={sourceStyle}>Source: {row.source}</div>
            </div>
          ))}
        </>
      )}
    </section>
  )
}
