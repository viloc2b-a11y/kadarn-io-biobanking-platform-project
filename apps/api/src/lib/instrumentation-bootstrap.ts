import { initInstrumentation } from '@kadarn/instrumentation'
import { createClient } from '@supabase/supabase-js'

let bootstrapped = false

export function bootstrapInstrumentation(): void {
  if (bootstrapped) return
  bootstrapped = true

  initInstrumentation({
    service: 'kadarn-api',
    supabasePing: async () => {
      const url = process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY
      if (!url || !key) return false
      try {
        const client = createClient(url, key, { auth: { persistSession: false } })
        const { error } = await client.from('organizations').select('id').limit(1)
        return !error
      } catch {
        return false
      }
    },
  })
}
