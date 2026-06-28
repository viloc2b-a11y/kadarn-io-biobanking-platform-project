import { cookies } from 'next/headers'
import { createKadarnServerClient } from '@kadarn/auth'

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createKadarnServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) => {
      for (const { name, value, options } of toSet) {
        cookieStore.set(name, value, options)
      }
    },
  })
}

export async function getServerUser() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}
