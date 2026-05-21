import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildMarketImpactReport } from '@/lib/market-impact'
import { userHasProAccess } from '@/lib/pro-subscription'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  }

  const hasAccess = await userHasProAccess(user.id)
  if (!hasAccess) {
    return NextResponse.json({ success: false, error: 'Subscription required' }, { status: 402 })
  }

  const admin = createAdminClient()
  const [{ data: news, error: newsError }, { data: signals, error: signalsError }] = await Promise.all([
    admin
      .from('news_articles')
      .select('id, title, snippet, source, url, topic, region, published_at, created_at')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(90),
    admin
      .from('maritime_signals')
      .select('signal_key, title, summary, source, source_url, region, signal_type, observed_at, confidence')
      .order('observed_at', { ascending: false })
      .limit(70),
  ])

  if (newsError || signalsError) {
    console.error('[market-impact] data fetch failed:', newsError || signalsError)
    return NextResponse.json({ success: false, error: 'Market impact data unavailable' }, { status: 500 })
  }

  return NextResponse.json(
    { success: true, report: buildMarketImpactReport(news || [], signals || []) },
    { headers: { 'Cache-Control': 'private, max-age=30' } },
  )
}
