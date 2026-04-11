import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Only run proxy on auth-protected routes — NOT on public pages
    // This prevents vs_work Vercel auth wall from blocking the whole site
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/callback',
    '/auth/sign-out',
  ],
}
