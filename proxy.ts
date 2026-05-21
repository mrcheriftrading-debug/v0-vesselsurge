import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Refresh Supabase auth cookies on real page navigations so users stay
     * signed in while moving between public, dashboard, and Market Pro pages.
     * Static assets and high-volume public API routes stay out of this path.
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|feed.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json|webmanifest)$).*)',
    '/api/auth/:path*',
    '/api/pro/:path*',
    '/api/stripe/checkout',
  ],
}
