'use client'

import { createKadarnBrowserClient } from '@kadarn/auth'

// Singleton — one client per browser session
let client: ReturnType<typeof createKadarnBrowserClient> | null = null

export function getSupabaseClient() {
  if (!client) client = createKadarnBrowserClient()
  return client
}
