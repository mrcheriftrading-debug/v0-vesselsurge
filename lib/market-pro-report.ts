import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { buildMarketImpactReport, MARKET_PRO_NEWS_MAX_AGE_HOURS, MARKET_PRO_SIGNAL_MAX_AGE_HOURS } from '@/lib/market-impact'
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache, type MaritimeDashboardResponse } from '@/lib/maritime-dashboard-cache'
import { getMarketSnapshot } from '@/lib/market-snapshot'

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function isExpectedFallbackReason(value: unknown) {
  const message = value instanceof Error ? value.message : String(value || '')
  return /timed out|timeout|aborted/i.test(message)
}

export function buildMarketProReportFromDashboardData(data: MaritimeDashboardResponse['data'], marketSnapshot: Awaited<ReturnType<typeof getMarketSnapshot>> | null) {
  return buildMarketImpactReport(
    data.articles.map((article) => ({
      id: article.id,
      title: article.title,
      snippet: article.summary,
      source: article.source,
      url: article.sourceUrl,
      topic: article.category,
      region: article.region,
      published_at: article.timestamp,
    })),
    data.signals.map((signal) => ({
      signal_key: signal.signalKey,
      title: signal.title,
      summary: signal.summary,
      source: signal.source,
      source_url: signal.sourceUrl,
      region: signal.region,
      signal_type: signal.signalType,
      observed_at: signal.observedAt,
      confidence: signal.confidence,
    })),
    marketSnapshot,
  )
}

export async function buildLiveMarketProReport(supabase: SupabaseClient) {
  const newsCutoff = new Date(Date.now() - MARKET_PRO_NEWS_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString()
  const signalCutoff = new Date(Date.now() - MARKET_PRO_SIGNAL_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString()

  const marketSnapshot = await withTimeout(getMarketSnapshot(), 3000, 'live market quotes').catch((error) => {
    if (!isExpectedFallbackReason(error)) {
      console.error('[market-pro] live market quotes unavailable:', error)
    }
    return null
  })

  const reviewedDashboard = await withTimeout(
    getFreshMaritimeDashboardCache(supabase),
    1200,
    'Market Pro reviewed live map cache',
  ).catch(() => null)

  if (reviewedDashboard?.data) {
    return {
      report: buildMarketProReportFromDashboardData(reviewedDashboard.data, marketSnapshot),
      sourceCounts: {
        news: reviewedDashboard.data.articles.length,
        signals: reviewedDashboard.data.signals.length,
        marketQuotes: marketSnapshot?.quotes.length || 0,
      },
    }
  }

  const databaseResult = await withTimeout(
    Promise.all([
      supabase
        .from('news_articles')
        .select('id, title, snippet, source, url, topic, region, published_at, created_at')
        .eq('is_active', true)
        .gte('published_at', newsCutoff)
        .order('published_at', { ascending: false })
        .limit(90),
      supabase
        .from('maritime_signals')
        .select('signal_key, title, summary, source, source_url, region, signal_type, observed_at, confidence')
        .gte('observed_at', signalCutoff)
        .order('observed_at', { ascending: false })
        .limit(70),
    ]),
    2500,
    'Market Pro source tables',
  ).catch((error) => {
    if (!isExpectedFallbackReason(error)) {
      console.warn('[market-pro] source tables unavailable; falling back to live dashboard cache:', error)
    }
    return null
  })

  if (databaseResult) {
    const [{ data: news, error: newsError }, { data: signals, error: signalsError }] = databaseResult
    if (!newsError && !signalsError) {
      return {
        report: buildMarketImpactReport(news || [], signals || [], marketSnapshot),
        sourceCounts: {
          news: news?.length || 0,
          signals: signals?.length || 0,
          marketQuotes: marketSnapshot?.quotes.length || 0,
        },
      }
    }

    console.warn('[market-pro] source tables returned errors; falling back to live dashboard cache:', newsError || signalsError)
  }

  const dashboard = await withTimeout(
    getLastMaritimeDashboardCache(supabase, 'Market Pro source tables unavailable; using last source-backed live map context'),
    1000,
    'Market Pro live dashboard cache',
  ).catch(() => null)

  if (dashboard?.data) {
    return {
      report: buildMarketProReportFromDashboardData(dashboard.data, marketSnapshot),
      sourceCounts: {
        news: dashboard.data.articles.length,
        signals: dashboard.data.signals.length,
        marketQuotes: marketSnapshot?.quotes.length || 0,
      },
    }
  }

  return {
    report: buildMarketImpactReport([], [], marketSnapshot),
    sourceCounts: {
      news: 0,
      signals: 0,
      marketQuotes: marketSnapshot?.quotes.length || 0,
    },
  }
}
