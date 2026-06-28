import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { checkRouteAccess, resolveRole } from '@kadarn/auth'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  // Static assets and internal Next.js routes bypass middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|svg|jpg|jpeg|webp|css|js)$/)
  ) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          for (const { name, value, options } of cookies) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Refresh session — required for Supabase SSR to keep JWT alive
  const { data: { user } } = await supabase.auth.getUser()

  const role = user ? resolveRole(user.user_metadata) : null

  // Check org membership from user metadata (set on login by org selector)
  // Full membership details come from the API; middleware uses a lightweight flag
  const hasMembership = Boolean(user?.user_metadata?.active_org_id)

  const guard = checkRouteAccess(pathname, role, hasMembership)

  if (!guard.allowed) {
    return NextResponse.redirect(new URL(guard.redirectTo, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
