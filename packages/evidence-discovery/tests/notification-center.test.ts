// ==========================================================================
// Notification Center — Tests (Sprint 22E)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { NotificationCenter } from '../src/notification-center/center.js'

describe('NotificationCenter — generation', () => {
  it('generates notifications from changes', () => {
    const nc = new NotificationCenter()
    const notifs = nc.generateFromChanges([
      {
        category: 'assessment_change', title: 'Plasma blocked',
        description: 'Plasma is now blocked', source_engine: 'Assessment',
        affected_institution: 'Vilo Research',
      },
    ])
    expect(notifs).toHaveLength(1)
    expect(notifs[0].status).toBe('unread')
    expect(notifs[0].category).toBe('assessment_change')
  })
})

describe('NotificationCenter — assessment notifications', () => {
  it('detects status changes between previous and current', () => {
    const nc = new NotificationCenter()
    const notifs = nc.generateAssessmentNotifications(
      [{ capability_name: 'Plasma', assessment_status: 'healthy' }],
      [{ capability_name: 'Plasma', assessment_status: 'blocked' }],
      'Vilo',
    )
    expect(notifs).toHaveLength(1)
    expect(notifs[0].priority).toBe('high')
    expect(notifs[0].title).toContain('blocked')
  })

  it('detects new capabilities', () => {
    const nc = new NotificationCenter()
    const notifs = nc.generateAssessmentNotifications(
      [],
      [{ capability_name: 'New Cap', assessment_status: 'healthy' }],
      'Vilo',
    )
    expect(notifs).toHaveLength(1)
    expect(notifs[0].title).toContain('healthy')
  })

  it('no changes → no notifications', () => {
    const nc = new NotificationCenter()
    const notifs = nc.generateAssessmentNotifications(
      [{ capability_name: 'Plasma', assessment_status: 'healthy' }],
      [{ capability_name: 'Plasma', assessment_status: 'healthy' }],
      'Vilo',
    )
    expect(notifs).toHaveLength(0)
  })
})

describe('NotificationCenter — report notification', () => {
  it('generates report updated notification', () => {
    const nc = new NotificationCenter()
    const notifs = nc.generateReportNotification('Vilo')
    expect(notifs).toHaveLength(1)
    expect(notifs[0].category).toBe('report_updated')
  })
})

describe('NotificationCenter — feed management', () => {
  it('tracks unread count', () => {
    const nc = new NotificationCenter()
    nc.generateFromChanges([
      { category: 'gap_change', title: 'Gap', description: 'D', source_engine: 'GI', affected_institution: 'V' },
      { category: 'asset_change', title: 'Asset', description: 'D', source_engine: 'CI', affected_institution: 'V' },
    ])
    const feed = nc.getFeed()
    expect(feed.unread_count).toBe(2)
    expect(feed.total_count).toBe(2)
  })

  it('mark as read reduces unread count', () => {
    const nc = new NotificationCenter()
    const notifs = nc.generateFromChanges([
      { category: 'gap_change', title: 'G', description: 'D', source_engine: 'GI', affected_institution: 'V' },
    ])
    nc.markAsRead(notifs[0].id)
    expect(nc.getFeed().unread_count).toBe(0)
  })

  it('mark all as read clears all unread', () => {
    const nc = new NotificationCenter()
    nc.generateFromChanges([
      { category: 'g1' as any, title: 'A', description: 'D', source_engine: 'S', affected_institution: 'V' },
      { category: 'g2' as any, title: 'B', description: 'D', source_engine: 'S', affected_institution: 'V' },
    ])
    nc.markAllAsRead()
    expect(nc.getFeed().unread_count).toBe(0)
  })

  it('archive removes from feed by default', () => {
    const nc = new NotificationCenter()
    const notifs = nc.generateFromChanges([
      { category: 'gap_change', title: 'G', description: 'D', source_engine: 'GI', affected_institution: 'V' },
    ])
    nc.archive(notifs[0].id)
    expect(nc.getFeed().total_count).toBe(0)
    expect(nc.getFeed(true).total_count).toBe(1)
  })
})

describe('NotificationCenter — no forbidden language', () => {
  it('never uses verified, certified, confidence', () => {
    const nc = new NotificationCenter()
    nc.generateFromChanges([
      { category: 'assessment_change', title: 'Test', description: 'Test', source_engine: 'A', affected_institution: 'V' },
    ])
    const json = JSON.stringify(nc.getFeed())
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('"confidence"')
  })
})
