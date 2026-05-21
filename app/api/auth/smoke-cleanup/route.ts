import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

type SmokeCleanupPayload = {
  email?: string
  password?: string
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: SmokeCleanupPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid cleanup request.' }, { status: 400 })
  }

  const email = payload.email?.trim().toLowerCase()
  const password = payload.password || ''

  if (!email || !/^codex-auth-smoke-\d+@example\.com$/.test(email) || !password) {
    return NextResponse.json({ error: 'Only Codex auth smoke users can be cleaned up here.' }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Supabase cleanup client is not configured.' }, { status: 503 })
  }

  const userClient = createSupabaseClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await withTimeout(
    userClient.auth.signInWithPassword({ email, password }),
    12000,
    'Supabase smoke user sign-in',
  )
  if (error || !data.user) {
    return NextResponse.json({ deleted: false, reason: 'Smoke user was not found or could not be signed in.' }, { status: 404 })
  }

  const { error: deleteError } = await withTimeout(
    createAdminClient().auth.admin.deleteUser(data.user.id),
    12000,
    'Supabase smoke user delete',
  )
  await userClient.auth.signOut()

  if (deleteError) {
    return NextResponse.json({ deleted: false, reason: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true, userId: data.user.id })
}
