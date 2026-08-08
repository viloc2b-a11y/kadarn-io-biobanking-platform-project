'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'
import Link from 'next/link'
import {
  derivePriorityToday,
  deriveReadinessBlock,
  deriveRecentChanges,
  deriveReviewQueue,
  derivePassportBlock,
  buildConfidenceExplanation,
  type PriorityItem,
  type ReadinessBlock,
  type ChangeItem,
  type ReviewQueueItem,
  type PassportBlock,
  type ConfidenceExplanation,
  type ClaimSummary,
  type EvidenceSummary,
  type ReviewTaskSummary,
  type GapItem,
  type StaleConfidenceItem,
  type RecentEvent,
} from '@/lib/home/home-aggregator'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  navy: '#1E2E40',
  ice: '#E8F0FA',
  accent: '#536DE2',
  white: '#FFFFFF',
  border: 'rgba(30, 46, 64, 0.1)',
  tx: '#1E2E40',
  txd: '#4A5568',
  txdd: '#8896A6',
  green: '#20A6A8',
  amber: '#E8A838',
  red: '#D64545',
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface HomeData {
  orgName: string
  orgId: string
  claims: ClaimSummary[]
  evidenceSummary: EvidenceSummary | null
  reviewTasks: ReviewTaskSummary[]
  gaps: GapItem[]
  staleConfidence: StaleConfidenceItem[]
  passportGeneratedAt: string | null
  events: RecentEvent[]
  capabilities: { id: string; name: string }[]
  /** Identity fields from profile — never a percentage threshold. */
  identityFields: { name: boolean; type: boolean; location: boolean }
  /** APIs that failed — empty means all succeeded. */
  apiErrors: string[]
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { user } = useSession()
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const token = (user as { access_token?: string }).access_token
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {}

    fetchHomeData(headers)
      .then(setData)
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <HomeSkeleton />
  if (!data) return <HomeEmpty />

  // ─── Derive blocks from factual data ────────────────────────────────────
  const priorityItems = derivePriorityToday({
    claims: data.claims,
    evidenceSummary: data.evidenceSummary,
    staleConfidence: data.staleConfidence,
    gaps: data.gaps,
    reviewTasks: data.reviewTasks,
  })

  const readiness = deriveReadinessBlock({
    claims: data.claims,
    capabilities: data.capabilities,
    evidenceSummary: data.evidenceSummary,
  })

  const recentChanges = deriveRecentChanges({
    claims: data.claims,
    events: data.events,
  })

  const reviewQueue = deriveReviewQueue({
    reviewTasks: data.reviewTasks,
    claims: data.claims,
  })

  const passport = derivePassportBlock({
    institutionName: data.orgName,
    institutionId: data.orgId,
    identityFields: data.identityFields,
    claims: data.claims,
    evidenceSummary: data.evidenceSummary,
    passportGeneratedAt: data.passportGeneratedAt,
    gaps: data.gaps,
  })

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 900,
          color: C.navy,
          margin: 0,
          letterSpacing: -0.5,
        }}>
          {data.orgName || 'KADARN'}
        </h1>
        <p style={{
          fontSize: 13,
          color: C.txd,
          margin: '4px 0 0 0',
        }}>
          Next Best Action Center — qu&eacute; necesita atenci&oacute;n ahora
        </p>
      </header>

      {/* ─── API Error Banner ────────────────────────────────────────── */}
      {data.apiErrors.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: `${C.amber}12`,
          border: `1px solid ${C.amber}30`,
          marginBottom: 20,
          fontSize: 12,
          color: C.amber,
          fontWeight: 500,
        }}>
          Algunos datos no pudieron cargarse: {data.apiErrors.join(', ')}.
          La informaci&oacute;n mostrada puede estar incompleta.
        </div>
      )}

      {/* ─── Block 1: PRIORITY TODAY ────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <BlockHeader
          title="Prioridad Hoy"
          subtitle="Acciones que requieren intervención inmediata"
        />
        {priorityItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {priorityItems.map(item => (
              <PriorityCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyBlock message={
            data.apiErrors.length > 0
              ? 'No se pudo verificar el estado del perfil. Revisar conexión con las APIs.'
              : 'No hay acciones prioritarias detectadas. El perfil institucional está al día.'
          } />
        )}
      </section>

      {/* ─── Block 2: READINESS ─────────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <BlockHeader
          title="Readiness"
          subtitle="Estado factual de claims, evidencia y capacidades"
        />
        <ReadinessGrid readiness={readiness} />
      </section>

      {/* ─── Two-column: Changes + Review Queue | Passport ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Block 3: RECENT CHANGES */}
          <section>
            <BlockHeader title="Cambios Recientes" subtitle={undefined} />
            {recentChanges.length > 0 ? (
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {recentChanges.map((change, i) => (
                    <ChangeRow key={change.id} change={change} isLast={i === recentChanges.length - 1} />
                  ))}
                </div>
              </Card>
            ) : (
              <EmptyBlock message="Sin actividad reciente." />
            )}
          </section>

          {/* Block 4: REVIEW QUEUE */}
          <section>
            <BlockHeader title="Cola de Revisión" subtitle={undefined} />
            {reviewQueue.length > 0 ? (
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {reviewQueue.map((item, i) => (
                    <ReviewRow key={item.id} item={item} isLast={i === reviewQueue.length - 1} />
                  ))}
                </div>
              </Card>
            ) : (
              <EmptyBlock message="No hay elementos pendientes de revisión." />
            )}
          </section>
        </div>

        {/* Right column: Block 5: PASSPORT */}
        <div>
          <section>
            <BlockHeader title="Passport" subtitle={undefined} />
            <PassportCard passport={passport} orgId={data.orgId} claims={data.claims} />
          </section>
        </div>
      </div>
    </div>
  )
}

// ─── Block Components ──────────────────────────────────────────────────────

function BlockHeader({ title, subtitle }: { title: string; subtitle: string | undefined }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: C.txdd,
        margin: 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 12, color: C.txdd, margin: '2px 0 0 0' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

// ─── Priority Card ─────────────────────────────────────────────────────────

function PriorityCard({ item }: { item: PriorityItem }) {
  const accentColor = item.kind === 'expired_evidence' || item.kind === 'contradiction'
    ? C.red
    : item.kind === 'expiring_evidence' || item.kind === 'stale_confidence'
    ? C.amber
    : C.accent

  return (
    <Link
      href={item.href}
      style={{
        display: 'block',
        padding: '16px 20px',
        borderRadius: 10,
        border: `1px solid ${accentColor}30`,
        background: `${accentColor}08`,
        textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Badge */}
        <span style={{
          flexShrink: 0,
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 700,
          background: `${accentColor}15`,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 1,
        }}>
          {item.entityType}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.tx, marginBottom: 4 }}>
            {item.title}
          </div>
          {/* Explainability: why this matters */}
          <div style={{ fontSize: 12, color: C.txd, marginBottom: 6, lineHeight: 1.5 }}>
            {item.whyItMatters}
          </div>
          {/* Action */}
          <div style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>
            → {item.action}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Readiness Grid ────────────────────────────────────────────────────────

function ReadinessGrid({ readiness }: { readiness: ReadinessBlock }) {
  const cs = readiness.claimsByStatus
  const ef = readiness.evidenceFreshness

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Claims breakdown */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.txd, marginBottom: 12 }}>
          Claims por estado de evidencia
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCell label="Sustentados" value={cs.supported} color={C.green} />
          <StatCell label="Declarados" value={cs.declared} color={C.amber} />
          <StatCell label="Expirados/Stale" value={cs.staleExpired} color={C.red} />
          <StatCell label="En disputa" value={cs.disputed} color={C.red} />
        </div>
        {cs.unknown > 0 && (
          <div style={{ fontSize: 11, color: C.txdd, marginTop: 8 }}>
            {cs.unknown} claim(s) en estado desconocido — no evaluados a&uacute;n.
            <strong> Unknown &ne; no.</strong>
          </div>
        )}
      </Card>

      {/* Evidence freshness */}
      {ef.active + ef.expiringSoon + ef.expired > 0 && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.txd, marginBottom: 12 }}>
            Frescura de evidencia
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <StatCell label="Vigente" value={ef.active} color={C.green} />
            <StatCell label="Próximo a expirar" value={ef.expiringSoon} color={C.amber} />
            <StatCell label="Expirado" value={ef.expired} color={C.red} />
          </div>
        </Card>
      )}

      {/* Capability coverage — per-capability, never rolled up */}
      {readiness.capabilityCoverage.length > 0 && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.txd, marginBottom: 12 }}>
            Cobertura por capacidad
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {readiness.capabilityCoverage.slice(0, 5).map(cap => (
              <div key={cap.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid ' + C.border,
              }}>
                <span style={{ flex: 1, fontSize: 12, color: C.tx, fontWeight: 500 }}>
                  {cap.name}
                </span>
                <span style={{ fontSize: 11, color: cap.supportedClaims > 0 ? C.green : C.txdd }}>
                  {cap.supportedClaims}/{cap.totalClaims} sustentados
                </span>
                {cap.unknownClaims > 0 && (
                  <span style={{ fontSize: 10, color: C.txdd }}>
                    ({cap.unknownClaims} desconocidos)
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: C.txdd, lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

// ─── Change Row ────────────────────────────────────────────────────────────

function ChangeRow({ change, isLast }: { change: ChangeItem; isLast: boolean }) {
  const iconColor = change.kind === 'document_expired' || change.kind === 'counter_evidence'
    ? C.red
    : change.kind === 'new_evidence'
    ? C.green
    : C.accent

  return (
    <Link
      href={change.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        textDecoration: 'none',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: iconColor, flexShrink: 0,
      }} />
      <span style={{ flex: 1, fontSize: 12, color: C.tx, lineHeight: 1.4 }}>
        {change.summary}
      </span>
      <span style={{ fontSize: 10, color: C.txdd, flexShrink: 0 }}>
        {formatRelativeTime(change.timestamp)}
      </span>
    </Link>
  )
}

// ─── Review Row ────────────────────────────────────────────────────────────

function ReviewRow({ item, isLast }: { item: ReviewQueueItem; isLast: boolean }) {
  const statusColor = item.status === 'pending' ? C.amber : C.txdd

  return (
    <Link
      href={item.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        textDecoration: 'none',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: C.tx, marginBottom: 2 }}>
          {item.title}
        </div>
        <div style={{ fontSize: 10, color: C.txdd }}>
          {item.entityType} · {formatRelativeTime(item.createdAt)}
        </div>
      </div>
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 4,
        background: `${statusColor}12`,
        color: statusColor,
        textTransform: 'capitalize',
      }}>
        {item.status}
      </span>
    </Link>
  )
}

// ─── Passport Card ─────────────────────────────────────────────────────────

function PassportCard({ passport, orgId, claims }: {
  passport: PassportBlock
  orgId: string
  claims: ClaimSummary[]
}) {
  const identityLabel =
    passport.identityStatus === 'available' ? 'Identidad institucional disponible' :
    passport.identityStatus === 'partial' ? 'Identidad institucional parcial' :
    'Datos de identidad pendientes'

  const identityColor =
    passport.identityStatus === 'available' ? C.green :
    passport.identityStatus === 'partial' ? C.amber :
    C.red

  // Wire confidence explanation for the first claim with evidence
  const claimForConfidence = claims.find(c => c.evidenceCount && c.evidenceCount > 0)
  const confidenceExplanation = claimForConfidence
    ? buildConfidenceExplanation(claimForConfidence)
    : null

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.txdd, marginBottom: 8 }}>
          Estado del Information Product
        </div>

        {/* Core metrics */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.navy }}>
              {passport.claimsWithSupport}/{passport.totalClaims}
            </div>
            <div style={{ fontSize: 10, color: C.txdd }}>Claims con soporte</div>
          </div>
        </div>

        {/* Identity status — factual fields, never percentage threshold */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginBottom: 16,
          padding: '10px 12px',
          borderRadius: 6,
          background: `${identityColor}10`,
          border: `1px solid ${identityColor}20`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: identityColor }}>
              {passport.identityStatus === 'available' ? '✓' :
               passport.identityStatus === 'partial' ? '◐' : '○'}
            </span>
            <span style={{ fontSize: 12, color: identityColor, fontWeight: 500 }}>
              {identityLabel}
            </span>
          </div>
          {passport.identityStatus !== 'available' && (
            <div style={{ fontSize: 10, color: C.txdd, paddingLeft: 22 }}>
              {!passport.identityFields.name && 'Nombre · '}
              {!passport.identityFields.type && 'Tipo · '}
              {!passport.identityFields.location && 'Ubicación · '}
              pendiente
            </div>
          )}
        </div>

        {/* Confidence explanation — wired to runtime */}
        {confidenceExplanation && (
          <div style={{
            marginBottom: 12,
            padding: '8px 12px',
            borderRadius: 6,
            background: `${C.ice}80`,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.txdd, marginBottom: 4 }}>
              Confianza de claim representativo
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 2 }}>
              {confidenceExplanation.level} ({confidenceExplanation.evidenceCount} evidencia)
            </div>
            <div style={{ fontSize: 10, color: C.txd, lineHeight: 1.4 }}>
              {confidenceExplanation.explanation}
            </div>
            <div style={{ fontSize: 9, color: C.txdd, marginTop: 2 }}>
              {confidenceExplanation.freshness}
            </div>
          </div>
        )}

        {/* Pending before share */}
        {passport.pendingBeforeShare.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.txd, marginBottom: 6 }}>
              Pendiente antes de compartir
            </div>
            {passport.pendingBeforeShare.map((p, i) => (
              <div key={i} style={{
                fontSize: 11,
                color: C.txdd,
                padding: '3px 0',
              }}>
                — {p}
              </div>
            ))}
          </div>
        )}

        {/* Visible gaps */}
        {passport.visibleGaps.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.txd, marginBottom: 6 }}>
              Gaps visibles
            </div>
            {passport.visibleGaps.map((g, i) => (
              <div key={i} style={{
                fontSize: 11,
                color: C.txdd,
                padding: '3px 0',
              }}>
                — {g}
              </div>
            ))}
          </div>
        )}

        {/* Last updated */}
        {passport.lastUpdated && (
          <div style={{ fontSize: 10, color: C.txdd, marginBottom: 12 }}>
            Última actualización: {new Date(passport.lastUpdated).toLocaleDateString('es-AR')}
          </div>
        )}

        <Link
          href={`/workspace/site-passport/${orgId}`}
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px 0',
            borderRadius: 6,
            border: `1px solid ${C.accent}40`,
            color: C.accent,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Ver Passport completo →
        </Link>
      </div>
    </Card>
  )
}

// ─── Shared Components ─────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '18px 20px',
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      background: C.white,
    }}>
      {children}
    </div>
  )
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '24px 0', color: C.txdd, fontSize: 13 }}>
        {message}
      </div>
    </Card>
  )
}

// ─── Loading & Empty States ────────────────────────────────────────────────

function HomeSkeleton() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ height: 36, width: 200, borderRadius: 8, background: `${C.navy}15`, marginBottom: 28 }} />
      <div style={{ height: 120, borderRadius: 12, background: `${C.navy}08`, marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 12, background: `${C.navy}08` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          <div style={{ height: 200, borderRadius: 12, background: `${C.navy}08`, marginBottom: 16 }} />
          <div style={{ height: 200, borderRadius: 12, background: `${C.navy}08` }} />
        </div>
        <div style={{ height: 300, borderRadius: 12, background: `${C.navy}08` }} />
      </div>
    </div>
  )
}

function HomeEmpty() {
  return (
    <div style={{
      padding: '60px 36px',
      maxWidth: 500,
      margin: '0 auto',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
        Sin datos disponibles
      </div>
      <div style={{ fontSize: 13, color: C.txdd, lineHeight: 1.5 }}>
        No se pudo cargar la información institucional.
        Verific&aacute; que tu organizaci&oacute;n est&eacute; configurada correctamente.
      </div>
    </div>
  )
}

// ─── Data Fetching ─────────────────────────────────────────────────────────

async function fetchHomeData(headers: Record<string, string>): Promise<HomeData> {
  const apiErrors: string[] = []

  const fetchJSON = (label: string, url: string) =>
    fetch(`${API}${url}`, { headers })
      .then(r => {
        if (!r.ok) { apiErrors.push(label); return null }
        return r.json()
      })
      .then(j => j?.data ?? j)
      .catch(() => { apiErrors.push(label); return null })

  const [profile, claimsRes, reviewRes, gapsRes, staleRes, passportRes, eventsRes] =
    await Promise.all([
      fetchJSON('profile', '/api/v1/workspace/profile'),
      fetchJSON('claims', '/api/v1/claims?limit=50'),
      fetchJSON('review', '/api/v1/review/tasks'),
      fetchJSON('gaps', '/api/v1/institutions/self/gaps'),
      fetchJSON('stale', '/api/v1/institutions/self/confidence/stale'),
      fetchJSON('passport', '/api/v1/continuity/passport/default'),
      fetchJSON('events', '/api/v1/events?limit=10'),
    ])

  const orgName = profile?.active_org?.org_name ?? profile?.active_org?.name ?? 'KADARN'
  const orgId = profile?.active_org?.org_id ?? profile?.active_org?.id ?? ''

  // Identity fields derived from actual profile data, never from a percentage
  const identityFields = {
    name: !!(orgName && orgName !== 'KADARN'),
    type: !!(profile?.active_org?.type || profile?.active_org?.org_type),
    location: !!(profile?.active_org?.primary_location || profile?.active_org?.location),
  }

  return {
    orgName,
    orgId,
    apiErrors,
    claims: Array.isArray(claimsRes) ? claimsRes : Array.isArray(claimsRes?.claims) ? claimsRes.claims : [],
    evidenceSummary: passportRes?.evidence?.evidenceSummary ?? null,
    reviewTasks: Array.isArray(reviewRes) ? reviewRes : Array.isArray(reviewRes?.tasks) ? reviewRes.tasks : [],
    gaps: Array.isArray(gapsRes) ? gapsRes : Array.isArray(gapsRes?.gaps) ? gapsRes.gaps : [],
    staleConfidence: Array.isArray(staleRes) ? staleRes : Array.isArray(staleRes?.items) ? staleRes.items : [],
    passportGeneratedAt: passportRes?.generatedAt ?? null,
    events: Array.isArray(eventsRes) ? eventsRes : Array.isArray(eventsRes?.events) ? eventsRes.events : [],
    identityFields,
    capabilities: Array.isArray(profile?.active_org?.capabilities)
      ? profile.active_org.capabilities.map((c: string) => ({ id: c, name: c }))
      : [],
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(iso).toLocaleDateString('es-AR')
}
