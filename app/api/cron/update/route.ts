import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Missing Supabase URL' }, { status: 500 })
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(supabaseAnonKey ? { Authorization: `Bearer ${supabaseAnonKey}` } : {}),
  }

  const timestamp = new Date().toISOString()
  console.log('[CRON] Starting hourly update at', timestamp)

  // Run both edge functions in parallel
  const [newsResult, aisResult] = await Promise.allSettled([
    // 1. Fetch maritime news (Tavily)
    fetch(`${supabaseUrl}/functions/v1/fetch-maritime-news`, {
      method: 'POST',
      headers,
    }).then(r => r.json()).catch(e => ({ error: e.message })),

    // 2. Fetch live AIS vessel data (AISstream)
    fetch(`${supabaseUrl}/functions/v1/fetch-ais-data`, {
      method: 'POST',
      headers,
    }).then(r => r.json()).catch(e => ({ error: e.message })),
  ])

  const newsData = newsResult.status === 'fulfilled' ? newsResult.value : { error: 'failed' }
  const aisData  = aisResult.status === 'fulfilled'  ? aisResult.value  : { error: 'failed' }

  console.log('[CRON] News result:', JSON.stringify(newsData))
  console.log('[CRON] AIS result:', JSON.stringify(aisData))
  console.log('[CRON] Completed at', new Date().toISOString())

  return NextResponse.json({
    success: true,
    timestamp,
    news: newsData,
    ais: aisData,
  })
}
