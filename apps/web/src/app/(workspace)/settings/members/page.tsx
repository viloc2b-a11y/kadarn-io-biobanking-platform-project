export default function SettingsMembersPage() {
  return (
    <div>
      <header style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>
            Organization settings
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
            Members
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txd)', maxWidth: 680 }}>
            Manage organization access through memberships and invitations. Invitation sending is intentionally disabled until PCP-1.2b implements the invitation API.
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Invitation workflow will be implemented in PCP-1.2b"
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(68,103,242,0.22)',
            background: 'rgba(68,103,242,0.08)',
            color: 'var(--txdd)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'not-allowed',
          }}
        >
          Invite Member
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <MembershipSection
          title="Current Members"
          description="Active organization members will appear here after PCP-1.2d implements membership administration."
        />
        <MembershipSection
          title="Pending Invitations"
          description="Created, sent, and pending invitations will appear here after PCP-1.2b and PCP-1.2c implement invitation workflow and acceptance."
        />
      </div>

      <section style={{
        marginTop: 18,
        padding: '18px 20px',
        borderRadius: 12,
        border: '1px solid rgba(245, 158, 11, 0.25)',
        background: 'rgba(245, 158, 11, 0.06)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--amber)', marginBottom: 6 }}>
          Safe slice placeholder
        </div>
        <p style={{ fontSize: 13, color: 'var(--txd)', margin: 0, lineHeight: 1.6 }}>
          PCP-1.2a only exposes the Invitations page and navigation entry. It does not call APIs, send invitations, create memberships, assign roles, or change authorization behavior.
        </p>
      </section>
    </div>
  )
}

function MembershipSection({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section style={{
      minHeight: 220,
      padding: '18px 20px',
      borderRadius: 12,
      border: '1px solid var(--border)',
      background: 'var(--navy2)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--txdd)', marginBottom: 14 }}>
        {title}
      </div>
      <div style={{
        minHeight: 140,
        borderRadius: 10,
        border: '1px dashed rgba(148, 163, 184, 0.25)',
        background: 'rgba(148, 163, 184, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 20,
      }}>
        <p style={{ fontSize: 13, color: 'var(--txdd)', lineHeight: 1.6, maxWidth: 360 }}>
          {description}
        </p>
      </div>
    </section>
  )
}
