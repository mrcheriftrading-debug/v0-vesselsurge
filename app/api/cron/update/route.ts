import { NextResponse } from 'next/server'
 
// This runs every hour automatically via Vercel cron
// It touches the maritime-intelligence endpoint to bust cache
// and keeps the site data fresh for visitors
 
export async function GET(request: Request) {
  // Verify this is called by Vercel cron (not a random visitor)
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
 
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vesselsurge.com'
 
    // Revalidate all data endpoints
    const endpoints = [
      '/api/maritime-intelligence',
      '/api/live-news?topic=global',
      '/api/live-news?topic=hormuz',
      '/api/live-news?topic=bab',
      '/api/live-news?topic=malacca',
      '/api/live-news?topic=suez',
      '/api/maritime-stats',
    ]
 
    const results = await Promise.allSettled(
      endpoints.map((path) =>
        fetch(`${baseUrl}${path}`, {
          headers: { 'Cache-Control': 'no-cache' },
        })
      )
    )
 
    const summary = results.map((r, i) => ({
      endpoint: endpoints[i],
      status: r.status === 'fulfilled' ? r.value.status : 'failed',
    }))
 
    console.log('[CRON] Hourly update completed:', summary)
 
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Hourly update complete',
      results: summary,
    })
  } catch (error) {
    console.error('[CRON] Hourly update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Cron update failed' },
      { status: 500 }
    )
  }
}
