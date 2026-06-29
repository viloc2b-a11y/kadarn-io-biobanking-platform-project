/**
 * Permanent redirect from deprecated /api/* routes to /api/v1/* equivalents.
 */
export function legacyRedirect(request: Request, targetPath: string): Response {
  const url = new URL(request.url)
  url.pathname = targetPath
  return Response.redirect(url.toString(), 308)
}

export function legacyRedirectWithId(
  request: Request,
  basePath: string,
  id: string,
): Response {
  const url = new URL(request.url)
  url.pathname = `${basePath}/${id}`
  return Response.redirect(url.toString(), 308)
}

/** Map legacy path segments to v1 (handles /api/me → /api/v1/account/me). */
export function legacyRedirectAuto(request: Request): Response {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname === '/api/me') {
    url.pathname = '/api/v1/account/me'
  } else if (pathname.startsWith('/api/') && !pathname.startsWith('/api/v1/')) {
    url.pathname = pathname.replace(/^\/api/, '/api/v1')
  }

  return Response.redirect(url.toString(), 308)
}

export const legacyMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

export function legacyRouteHandlers(): Record<string, (request: Request) => Response> {
  return Object.fromEntries(
    legacyMethods.map(method => [method, legacyRedirectAuto]),
  ) as Record<string, (request: Request) => Response>
}
