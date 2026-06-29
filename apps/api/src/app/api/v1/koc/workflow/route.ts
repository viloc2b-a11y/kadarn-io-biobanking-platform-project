import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

/**
 * GET /api/v1/koc/workflow
 * Workflow Dashboard: running, waiting, blocked, completed workflows
 */
export const GET = withAuth(async (_request, user) => {
  try {
    const supabase = await createRouteClient()

    const [instancesRes, tasksRes, definitionsRes] = await Promise.all([
      supabase.from('workflow_instances').select('id, status, workflow_type, priority, started_at, completed_at'),
      supabase.from('workflow_tasks').select('id, status, task_type, assigned_to'),
      supabase.from('workflow_definitions').select('id, name, status, version', { count: 'exact' }),
    ])

    const instances = instancesRes.data ?? []
    const tasks = tasksRes.data ?? []

    const running = instances.filter(i => i.status === 'running' || i.status === 'active')
    const waiting = instances.filter(i => i.status === 'pending' || i.status === 'waiting')
    const blocked = instances.filter(i => i.status === 'blocked' || i.status === 'failed')
    const completed = instances.filter(i => i.status === 'completed')

    const overdue = instances.filter(i =>
      i.status !== 'completed' && i.started_at &&
      new Date(i.started_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    return Response.json({
      data: {
        summary: {
          total: instances.length,
          running: running.length,
          waiting: waiting.length,
          blocked: blocked.length,
          completed: completed.length,
          overdue: overdue.length,
        },
        definitions: (definitionsRes.data ?? []).length,
        by_type: (() => {
          const map: Record<string, number> = {}
          for (const i of instances) {
            const t = i.workflow_type ?? 'unknown'
            map[t] = (map[t] ?? 0) + 1
          }
          return map
        })(),
        tasks: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          blocked: tasks.filter(t => t.status === 'blocked').length,
        },
        recent_instances: instances.slice(0, 10),
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
