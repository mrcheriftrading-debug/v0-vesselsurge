import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { upsertMarketProAnalysisCache } from '@/lib/market-pro-cache'
import { buildLiveMarketProReport } from '@/lib/market-pro-report'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ success: false, error: 'Cron is not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    const startedAt = Date.now()
    const { report, sourceCounts } = await buildLiveMarketProReport(supabase)
    const cache = await upsertMarketProAnalysisCache(supabase, report, 'cron')

    return NextResponse.json({
      success: true,
      action: 'market-pro-analysis-updated',
      generatedAt: cache.generatedAt,
      durationMs: Date.now() - startedAt,
      marketPressureScore: report.marketPressureScore,
      marketTapeScore: report.marketTapeScore,
      confidence: report.confidence,
      analystSignal: report.analysisBrief.signal,
      sourceCounts,
      sourceSummary: report.sourceSummary,
      investmentTipCounts: {
        stocks: report.investmentTips.stocks.length,
        crypto: report.investmentTips.crypto.length,
        fx: report.investmentTips.fx.length,
      },
      topInvestmentTips: {
        stocks: report.investmentTips.stocks[0] || null,
        crypto: report.investmentTips.crypto[0] || null,
        fx: report.investmentTips.fx[0] || null,
      },
      note: 'Market Pro cron saved a real source-backed analyst report for paid subscribers.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[market-pro-cron] update failed:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
