// ==========================================================================
// Notification Center — Types + Generator (Sprint 22E)
// ==========================================================================
//
// Converts institutional changes into explainable notifications.
// Generated only from canonical engine output. Never from raw Discovery.
// No AI summaries. No duplicated assessment. No confidence computation.
// ==========================================================================

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type NotificationCategory =
  | 'capability_change'
  | 'gap_change'
  | 'assessment_change'
  | 'readiness_change'
  | 'recommendation_change'
  | 'asset_change'
  | 'report_updated'

export type NotificationStatus = 'unread' | 'read' | 'archived'

export interface Notification {
  id: string
  title: string
  description: string
  category: NotificationCategory
  status: NotificationStatus
  priority: 'high' | 'normal' | 'low'
  source_engine: string
  affected_institution: string
  affected_capability?: string
  affected_asset?: string
  action_label: string
  created_at: string
  read_at: string | null
}

export interface NotificationFeed {
  notifications: Notification[]
  unread_count: number
  total_count: number
  generated_at: string
}

// --------------------------------------------------------------------------
// NotificationCenter
// --------------------------------------------------------------------------

export class NotificationCenter {
  private notifications: Notification[] = []

  /**
   * Generate notifications from engine output deltas.
   * In production, this would compare current vs previous engine state.
   */
  generateFromChanges(
    changes: Array<{
      category: NotificationCategory
      title: string
      description: string
      priority?: 'high' | 'normal' | 'low'
      source_engine: string
      affected_institution: string
      affected_capability?: string
      affected_asset?: string
    }>,
  ): Notification[] {
    const now = new Date().toISOString()
    const newNotifications: Notification[] = changes.map((c, i) => ({
      id: `notif:${now.slice(0, 10)}:${i.toString().padStart(3, '0')}`,
      title: c.title,
      description: c.description,
      category: c.category,
      status: 'unread',
      priority: c.priority ?? 'normal',
      source_engine: c.source_engine,
      affected_institution: c.affected_institution,
      affected_capability: c.affected_capability,
      affected_asset: c.affected_asset,
      action_label: this.actionLabel(c.category),
      created_at: now,
      read_at: null,
    }))

    this.notifications = [...newNotifications, ...this.notifications]
    return newNotifications
  }

  /** Generate notifications from assessment changes */
  generateAssessmentNotifications(
    previous: Array<{ capability_name: string; assessment_status: string }>,
    current: Array<{ capability_name: string; assessment_status: string }>,
    institution: string,
  ): Notification[] {
    const changes: Array<{
      category: NotificationCategory
      title: string
      description: string
      priority: 'high' | 'normal' | 'low'
      source_engine: string
      affected_institution: string
      affected_capability?: string
    }> = []

    const prevMap = new Map(previous.map((p) => [p.capability_name, p]))
    for (const curr of current) {
      const prev = prevMap.get(curr.capability_name)
      if (!prev || prev.assessment_status !== curr.assessment_status) {
        const isDegraded =
          curr.assessment_status === 'blocked' ||
          (prev && prev.assessment_status === 'healthy' && curr.assessment_status !== 'healthy')

        changes.push({
          category: 'assessment_change',
          title: `${curr.capability_name} is now ${curr.assessment_status}`,
          description: prev
            ? `Changed from ${prev.assessment_status} to ${curr.assessment_status}`
            : `New capability detected: ${curr.assessment_status}`,
          priority: isDegraded ? 'high' : 'normal',
          source_engine: 'Institutional Capability Assessment Engine',
          affected_institution: institution,
          affected_capability: curr.capability_name,
        })
      }
    }

    return this.generateFromChanges(changes)
  }

  /** Generate notification from report regeneration */
  generateReportNotification(institution: string): Notification[] {
    return this.generateFromChanges([
      {
        category: 'report_updated',
        title: 'Institution Recognition Report updated',
        description: `A new recognition report has been generated for ${institution} based on the latest evidence.`,
        priority: 'normal',
        source_engine: 'Institution Recognition Report',
        affected_institution: institution,
      },
    ])
  }

  /** Mark a notification as read */
  markAsRead(notificationId: string): void {
    const notif = this.notifications.find((n) => n.id === notificationId)
    if (notif) {
      notif.status = 'read'
      notif.read_at = new Date().toISOString()
    }
  }

  /** Mark all as read */
  markAllAsRead(): void {
    const now = new Date().toISOString()
    for (const n of this.notifications) {
      if (n.status === 'unread') {
        n.status = 'read'
        n.read_at = now
      }
    }
  }

  /** Archive a notification */
  archive(notificationId: string): void {
    const notif = this.notifications.find((n) => n.id === notificationId)
    if (notif) notif.status = 'archived'
  }

  /** Get the current feed */
  getFeed(includeArchived = false): NotificationFeed {
    const visible = includeArchived
      ? this.notifications
      : this.notifications.filter((n) => n.status !== 'archived')

    return {
      notifications: visible.slice(0, 50),
      unread_count: visible.filter((n) => n.status === 'unread').length,
      total_count: visible.length,
      generated_at: new Date().toISOString(),
    }
  }

  private actionLabel(category: NotificationCategory): string {
    switch (category) {
      case 'capability_change': return 'View capability'
      case 'gap_change': return 'Review gap'
      case 'assessment_change': return 'View assessment'
      case 'readiness_change': return 'View readiness'
      case 'recommendation_change': return 'View recommendation'
      case 'asset_change': return 'View research assets'
      case 'report_updated': return 'Open report'
      default: return 'View details'
    }
  }
}
