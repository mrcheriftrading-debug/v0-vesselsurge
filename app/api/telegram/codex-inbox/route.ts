import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('telegram_codex_inbox')
    .select('id, telegram_user_id, telegram_first_name, chat_id, message, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: data?.length || 0, items: data || [] })
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const id = body?.id
  const status = body?.status || 'handled'
  const response = body?.response || null

  if (!id || !['handled', 'pending', 'ignored'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'Invalid inbox update' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('telegram_codex_inbox')
    .update({
      status,
      response,
      handled_at: status === 'pending' ? null : new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
