import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // FIX: was missing closing } — try block was trapped inside if block
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('[CRON] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Missing Supabase URL' }, { status: 500 })
    }

    console.log('[CRON] Triggering Supabase fetch-maritime-news edge function...')

    const edgeFnRes = await fetch(`${supabaseUrl}/functions/v1/fetch-maritime-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(supabaseAnonKey ? { Authorization: `Bearer ${supabaseAnonKey}` } : {}),
      },
    })

    let edgeResult: any = { status: edgeFnRes.status }
    try { edgeResult = await edgeFnRes.json() } catch {}

    console.log('[CRON] Edge result:', JSON.stringify(edgeResult))
    console.log('[CRON] Done at', new Date().toISOString())

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Hourly update complete',
      edge_function_result: edgeResult,
    })
  } catch (error: any) {
    console.error('[CRON] Error:', error?.message)
    return NextResponse.json(
      { success: false, error: error?.message || 'Cron update failed' },
      { status: 500 }
    )
  }
}
