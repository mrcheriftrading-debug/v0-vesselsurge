import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLastMarketProAnalysisCache, upsertMarketProAnalysisCache } from '@/lib/market-pro-cache'
import { buildLiveMarketProReport } from '@/lib/market-pro-report'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

const MARKET_PRO_MIN_REFRESH_MS = 4 * 60 * 1000
const MARKET_PRO_CACHE_WRITE_TIMEOUT_MS = 3500
const MARKET_PRO_CACHE_READ_TIMEOUT_MS = 900

function ageMs(iso: string | undefined | null) {
  const timestamp = Date.parse(iso || '')
  return Number.isFinite(timestamp) ? Date.now() - timestamp : Number.POSITIVE_INFINITY
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

function isExpectedFallbackReason(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  return /timed out|timeout|aborted|fetch failed|network|522|504/i.test(message)
}

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
    const existingCache = await withTimeout(
      getLastMarketProAnalysisCache(supabase, 'checking Market Pro refresh freshness'),
      MARKET_PRO_CACHE_READ_TIMEOUT_MS,
      'Market Pro cache freshness',
    ).catch(() => null)
    const existingAgeMs = ageMs(existingCache?.generatedAt)

    if (existingCache && existingAgeMs < MARKET_PRO_MIN_REFRESH_MS) {
      return NextResponse.json({
        success: true,
        action: 'skipped',
        reason: 'market-pro cache is still fresh',
        generatedAt: existingCache.generatedAt,
        cacheAgeSeconds: Math.round(existingAgeMs / 1000),
        durationMs: Date.now() - startedAt,
      })
    }

    const { report, sourceCounts } = await buildLiveMarketProReport(supabase)
    const cache = await withTimeout(
      upsertMarketProAnalysisCache(supabase, report, 'cron'),
      MARKET_PRO_CACHE_WRITE_TIMEOUT_MS,
      'Market Pro cache write',
    )

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
    if (isExpectedFallbackReason(error)) {
      console.info('[market-pro-cron] using fallback cache:', message)
    } else {
      console.error('[market-pro-cron] update failed:', message)
    }

    const fallbackCache = await withTimeout(
      getLastMarketProAnalysisCache(supabase, 'Market Pro cron refresh failed; serving last source-backed report'),
      MARKET_PRO_CACHE_READ_TIMEOUT_MS,
      'Market Pro fallback cache',
    ).catch(() => null)

    return NextResponse.json(
      {
        success: false,
        action: 'degraded',
        error: message,
        fallbackCache: Boolean(fallbackCache),
        generatedAt: fallbackCache?.generatedAt || null,
        note: fallbackCache
          ? 'Market Pro kept the last source-backed report online and will retry on the next cron.'
          : 'Market Pro refresh failed and no recent fallback report was available.',
      },
      { status: 200 },
    )
  }
}
