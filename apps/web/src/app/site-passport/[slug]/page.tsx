type PassportPageProps = {
  params: Promise<{ slug: string }>
}

async function loadPassport(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? ''
  const response = await fetch(`${base}/api/v1/continuity/passport/${slug}`, {
    cache: 'no-store',
  })
  if (!response.ok) return null
  const json = await response.json()
  return json.data
}

export default async function SitePassportPage({ params }: PassportPageProps) {
  const { slug } = await params
  const data = await loadPassport(slug)

  if (!data) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Site Passport unavailable</h1>
        <p>This passport is private, expired, or does not exist.</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 40, display: 'grid', gap: 24 }}>
      <section>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>{data.profile.headline ?? 'Site Passport'}</h1>
        <p style={{ maxWidth: 760 }}>{data.profile.summary ?? 'Verified site continuity profile.'}</p>
      </section>

      <section>
        <h2>Evidence-backed experience</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {data.claims.map((claim: any) => (
            <article key={claim.id} style={{ border: '1px solid #d1d5db', borderRadius: 12, padding: 16 }}>
              <strong>{claim.title}</strong>
              <p>{claim.description}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
                <span>{claim.category}</span>
                {claim.therapeutic_area && <span>{claim.therapeutic_area}</span>}
                {claim.study_phase && <span>{claim.study_phase}</span>}
                {claim.biospecimen_type && <span>{claim.biospecimen_type}</span>}
                <span>{claim.verification_label}</span>
                <span>Confidence {claim.confidence_score}/100</span>
                {claim.sponsor_display && <span>{claim.sponsor_display}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
