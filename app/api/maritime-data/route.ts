import { NextResponse } from 'next/server'
import { buildMaritimeDashboardPayload, getFreshMaritimeDashboardCache } from '@/lib/maritime-dashboard-cache'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const RESPONSE_HEADERS = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
  'X-Content-Type-Options': 'nosniff',
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const cached = await getFreshMaritimeDashboardCache(supabase)

    if (cached) {
      return NextResponse.json(cached, { headers: RESPONSE_HEADERS })
    }

    return NextResponse.json(await buildMaritimeDashboardPayload(supabase), { headers: RESPONSE_HEADERS })
  } catch (error) {
    console.error('[v0] Maritime data API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maritime data' },
      { status: 500 },
    )
  }
}
