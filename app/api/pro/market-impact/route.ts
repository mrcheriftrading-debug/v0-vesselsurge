import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFreshMarketProAnalysisCache, getLastMarketProAnalysisCache, upsertMarketProAnalysisCache } from '@/lib/market-pro-cache'
import { buildLiveMarketProReport } from '@/lib/market-pro-report'
import { userHasProAccess } from '@/lib/pro-subscription'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401, headers: PRIVATE_NO_STORE })
  }

  const hasAccess = await userHasProAccess(user.id, user.email)
  if (!hasAccess) {
    return NextResponse.json({ success: false, error: 'Subscription required' }, { status: 402, headers: PRIVATE_NO_STORE })
  }

  const admin = createAdminClient()
  const cached = await getFreshMarketProAnalysisCache(admin).catch(() => null)
  if (cached) {
    return NextResponse.json(
      { success: true, report: cached.report, cached: true, generatedAt: cached.generatedAt },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    )
  }

  try {
    const { report } = await buildLiveMarketProReport(admin)
    await upsertMarketProAnalysisCache(admin, report, 'live-fallback').catch((error) => {
      console.error('[market-impact] cache refresh skipped:', error)
    })

    return NextResponse.json(
      { success: true, report, cached: false },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    )
  } catch (error) {
    console.error('[market-impact] data fetch failed:', error)
    const stale = await getLastMarketProAnalysisCache(admin, 'fresh Market Pro build failed; serving last saved analysis').catch(() => null)
    if (stale) {
      return NextResponse.json(
        { success: true, report: stale.report, cached: true, stale: true, staleReason: stale.staleReason },
        { headers: { 'Cache-Control': 'private, max-age=30' } },
      )
    }

    return NextResponse.json({ success: false, error: 'Market impact data unavailable' }, { status: 500, headers: PRIVATE_NO_STORE })
  }
}
