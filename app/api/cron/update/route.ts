import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vesselsurge.com'
    const endpoints = ['/api/maritime-intelligence', '/api/live-news', '/api/maritime-stats']
    await Promise.allSettled(endpoints.map(path => fetch(`${baseUrl}${path}`, { headers: { 'Cache-Control': 'no-cache' } })))
    console.log('[CRON] Hourly update completed at', new Date().toISOString())
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), message: 'Hourly update complete' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Cron update failed' }, { status: 500 })
  }
}
