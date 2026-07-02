'use client'

import { useCallback, useRef } from 'react'
import { DASHBOARD_TABS, type DashboardTab } from './types'

export function DiscoveryTabBar({
  activeTab,
  onTabChange,
  tabPanelId,
  tabOrder,
}: {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  tabPanelId: string
  /** Optional role-specific tab ordering. Defaults to DASHBOARD_TABS order. */
  tabOrder?: DashboardTab[]
}) {
  const tabRefs = useRef<Partial<Record<DashboardTab, HTMLButtonElement>>>({})
  const labelById = new Map(DASHBOARD_TABS.map((tab) => [tab.id, tab.label]))
  const orderedIds = tabOrder ?? DASHBOARD_TABS.map((tab) => tab.id)
  const tabs = orderedIds
    .filter((id) => labelById.has(id))
    .map((id) => ({ id, label: labelById.get(id)! }))

  const focusTab = useCallback((tabId: DashboardTab) => {
    tabRefs.current[tabId]?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = tabs.length - 1
      let nextIndex = index

      if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1
      else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1
      else if (event.key === 'Home') nextIndex = 0
      else if (event.key === 'End') nextIndex = lastIndex
      else return

      event.preventDefault()
      const nextTab = tabs[nextIndex].id
      onTabChange(nextTab)
      focusTab(nextTab)
    },
    [focusTab, onTabChange, tabs],
  )

  return (
    <div className="discovery-tab-bar" role="tablist" aria-label="Discovery workbench panels">
      {tabs.map((tab, index) => {
        const active = activeTab === tab.id
        const tabId = `discovery-tab-${tab.id}`

        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) tabRefs.current[tab.id] = node
            }}
            type="button"
            role="tab"
            id={tabId}
            className={`discovery-tab-bar__tab${active ? ' discovery-tab-bar__tab--active' : ''}`}
            aria-selected={active}
            aria-controls={tabPanelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
