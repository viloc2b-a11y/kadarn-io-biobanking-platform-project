import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { checkRouteAccess, resolveRole } from '@kadarn/auth'
import {
  E2E_SESSION_COOKIE,
  E2E_SESSION_VALUE,
  isE2EAuthServerEnabled,
} from '@/lib/e2e/mock-session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/auth/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next({ request })

  // Static assets and internal Next.js routes bypass middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|svg|jpg|jpeg|webp|css|js)$/)
  ) {
    return response
  }

  // RC-9.2 / RC-10.0: controlled E2E bypass — only when server flag + cookie (Playwright harness)
  if (
    isE2EAuthServerEnabled() &&
    (pathname.startsWith('/workspace') || pathname.startsWith('/sponsor')) &&
    request.cookies.get(E2E_SESSION_COOKIE)?.value === E2E_SESSION_VALUE
  ) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => {
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

  // RC-10.0: Sponsor workspace — authenticated org member (mirrors /workspace guard; packages/auth unchanged)
  if (pathname.startsWith('/sponsor')) {
    if (!role) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (!hasMembership) {
      return NextResponse.redirect(new URL('/marketplace', request.url))
    }
  }

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
