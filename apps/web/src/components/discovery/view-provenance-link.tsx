import type { ProvenanceTargetType } from './types'

const linkStyle: React.CSSProperties = {
  marginTop: 8,
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--blue)',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
}

export function ViewProvenanceLink({
  targetType,
  targetId,
  onViewProvenance,
}: {
  targetType: ProvenanceTargetType
  targetId: string | undefined | null
  onViewProvenance?: (targetType: ProvenanceTargetType, targetId: string) => void
}) {
  if (!targetId || !onViewProvenance) return null

  return (
    <button
      type="button"
      style={linkStyle}
      aria-label={`View provenance for ${targetType.replace(/_/g, ' ').toLowerCase()}`}
      onClick={() => onViewProvenance(targetType, targetId)}
    >
      View provenance
    </button>
  )
}
