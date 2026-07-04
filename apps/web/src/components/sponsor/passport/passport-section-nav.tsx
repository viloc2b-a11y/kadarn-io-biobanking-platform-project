'use client'

import type { PassportSectionId } from './passport-types'
import { sectionNavLinkStyle, sectionNavStyle } from './passport-styles'

const SECTIONS: Array<{ id: PassportSectionId; label: string }> = [
  { id: 'identity', label: 'Identity' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'claims', label: 'Claims' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'history', label: 'History' },
]

export function PassportSectionNav({ activeSection }: { activeSection: PassportSectionId }) {
  return (
    <nav aria-label="Passport sections" style={sectionNavStyle}>
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#passport-${section.id}`}
          style={sectionNavLinkStyle(activeSection === section.id)}
          aria-current={activeSection === section.id ? 'true' : undefined}
        >
          {section.label}
        </a>
      ))}
    </nav>
  )
}

export const PASSPORT_SECTION_IDS = SECTIONS.map((s) => s.id)
