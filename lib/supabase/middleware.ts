import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminEmail } from '@/lib/admin-access'
import { getSafeNextPath } from '@/lib/auth-next'

const FALLBACK_SESSION_COOKIE = 'vesselsurge_fallback_session'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Gracefully skip if env vars missing (prevents vs_work crash)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[middleware] Missing Supabase env vars — skipping session refresh')
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session — required to keep user logged in
  const { data: { user } } = await supabase.auth.getUser()

  // Protect private routes and skip auth entry pages for users who already have a session.
  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const isPasswordUpdatePage = pathname === '/auth/update-password'
  const isProtected = 
    pathname.startsWith('/dashboard') ||
    isAdminRoute ||
    isPasswordUpdatePage
  const isAuthEntryPage =
    pathname === '/auth/login' ||
    pathname === '/auth/sign-up' ||
    pathname === '/auth/sign-up-success'

  const hasFallbackDashboardSession =
    pathname.startsWith('/dashboard') &&
    Boolean(request.cookies.get(FALLBACK_SESSION_COOKIE)?.value)

  if (isProtected && !user && !hasFallbackDashboardSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  if (isAdminRoute && user) {
    if (!isAdminEmail(user.email)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  if (isAuthEntryPage && user) {
    const url = request.nextUrl.clone()
    const nextPath = getSafeNextPath(request.nextUrl.searchParams.get('next'))
    url.pathname = nextPath
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
