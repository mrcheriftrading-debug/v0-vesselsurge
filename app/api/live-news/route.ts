export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache } from '@/lib/maritime-dashboard-cache'

const TRUSTED_SOURCES = [
  'USNI News',
  'gCaptain',
  'Hellenic Shipping News',
  'Splash247',
  'Offshore Energy',
  'Seatrade Maritime News',
  'MarineLink',
  'Al Jazeera',
  'Bloomberg Markets',
  'Bloomberg Politics',
  'Bloomberg Economics',
  'Bloomberg Business',
  'Safety4Sea',
  'MarineLog',
  'World Oil',
  'Arab News',
  'Google News Bab el-Mandeb',
  'Google News Suez Canal',
  'Google News Malacca Strait',
  'ReCAAP ISC Alerts',
  'ReCAAP ISC Reports',
  'Norwegian Maritime Authority',
  'MARAD Maritime Security Advisory',
  'Suez Canal Authority',
]

const TRUSTED_SOURCE_PREFIXES = ['Google News:']
const TRUSTED_SEARCH_PREFIXES = ['Bing News Search:']

const REGION_KEYWORDS: Record<string, string[]> = {
  hormuz: ['hormuz', 'strait of hormuz', 'persian gulf', 'gulf of oman', 'iran', 'oman', 'uae'],
  bab: ['bab el-mandeb', 'bab el mandeb', 'red sea', 'gulf of aden', 'houthi', 'yemen', 'aden'],
  suez: ['suez', 'suez canal', 'port said', 'egypt', 'ismailia'],
  malacca: ['malacca', 'strait of malacca', 'straits of malacca', 'singapore strait', 'recaap', 'singapore', 'malaysia', 'indonesia'],
}

const OPERATIONAL_NEWS_PATTERN = /\b(ship|shipping|vessel|tanker|cargo|freight|maritime|ais|port|canal|convoy|transit|route|reroute|re-route|divert|queue|delay|congestion|piracy|armed robbery|attack|missile|drone|seized|hijack|warning|advisory|incident|threat|war risk|insurance|oil|crude|lng)\b/i
const NOISE_PATTERN = /\b(stock|stocks|shares|dividend|earnings|equity|equities|bond|bonds|forex|crypto|bitcoin|railway|football|cricket|tourism|movie|celebrity)\b/i
const FINANCIAL_TITLE_PATTERN = /\b(stock|stocks|shares|dividend|earnings|equity|equities|bond|bonds|forex|market cap|price target)\b/i

const WATCH_NEWS_CONTEXT: Record<string, Array<{ title: string; summary: string; source: string; topic: string }>> = {
  hormuz: [
    {
      title: 'OpenClaw Hormuz news watch active',
      summary: 'VesselSurge is monitoring tanker flow, oil-route exposure, Iran-linked shipping risk and Gulf export routing.',
      source: 'OpenClaw Hormuz Watch',
      topic: 'oil_route_watch',
    },
  ],
  bab: [
    {
      title: 'OpenClaw Red Sea news watch active',
      summary: 'VesselSurge is monitoring Bab el-Mandeb, Gulf of Aden, Red Sea routing, advisories, rerouting and war-risk insurance signals.',
      source: 'OpenClaw Red Sea Watch',
      topic: 'red_sea_watch',
    },
    {
      title: 'Bab el-Mandeb source sweep active',
      summary: 'Fresh reports from trusted maritime and official-warning sources will be promoted here as soon as they clear the noise filters.',
      source: 'OpenClaw Chokepoint Watch',
      topic: 'source_sweep',
    },
  ],
  suez: [
    {
      title: 'OpenClaw Suez news watch active',
      summary: 'VesselSurge is monitoring canal transit, convoy operations, delay signals, Red Sea spillover and freight-route pressure.',
      source: 'OpenClaw Suez Watch',
      topic: 'canal_watch',
    },
  ],
  malacca: [
    {
      title: 'OpenClaw Malacca news watch active',
      summary: 'VesselSurge is monitoring Malacca and Singapore Strait traffic density, piracy reports, ReCAAP context and port-flow signals.',
      source: 'OpenClaw Malacca Watch',
      topic: 'ais_density_watch',
    },
  ],
}

function isTrustedSource(source: string) {
  return TRUSTED_SOURCES.includes(source)
    || TRUSTED_SOURCE_PREFIXES.some((prefix) => source.startsWith(prefix))
    || TRUSTED_SEARCH_PREFIXES.some((prefix) => source.startsWith(prefix))
}

function hasRegionSignal(article: any) {
  const articleRegion = article.region || 'global'
  if (articleRegion === 'global') return false
  const text = `${article.title || ''} ${article.snippet || ''}`.toLowerCase()
  return (REGION_KEYWORDS[articleRegion] || []).some((keyword) => text.includes(keyword))
}

function isOperationalMaritimeNews(article: any) {
  const text = `${article.title || ''} ${article.snippet || ''}`.toLowerCase()
  if (FINANCIAL_TITLE_PATTERN.test(article.title || '')) return false
  if (!OPERATIONAL_NEWS_PATTERN.test(text)) return false
  if (NOISE_PATTERN.test(text) && !/\b(ship|shipping|vessel|tanker|cargo|freight|maritime|canal|port|transit|route|suez|malacca|hormuz|red sea|bab el)\b/i.test(text)) {
    return false
  }
  return hasRegionSignal(article)
}

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

function buildWatchFallback(region: string | null) {
  const regions = region && region !== 'all' ? [region] : ['hormuz', 'bab', 'suez', 'malacca']
  return regions.flatMap((itemRegion) => (WATCH_NEWS_CONTEXT[itemRegion] || []).map((item, index) => ({
    id: `openclaw-watch-${itemRegion}-${index}`,
    title: item.title,
    summary: item.summary,
    source: item.source,
    sourceUrl: null,
    topic: item.topic,
    region: itemRegion,
    timestamp: new Date().toISOString(),
    derivedFrom: 'openclaw_watch',
  })))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || null
  const region = searchParams.get('region') || null
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const supabase = createAdminClient()
    const cached = await withTimeout(getFreshMaritimeDashboardCache(supabase), 1200, 'dashboard cache')
      .catch(() => withTimeout(getLastMaritimeDashboardCache(supabase, 'fresh news query unavailable; serving last known source-reviewed news'), 1200, 'stale dashboard cache').catch(() => null))
    if (cached?.data?.articles?.length) {
      const cachedArticles = cached.data.articles
        .filter((article: any) => !region || region === 'all' || article.region === region)
        .filter((article: any) => !topic || topic === 'all' || article.category === topic)
        .slice(0, Math.min(limit, 50))
        .map((article: any) => ({
          id: article.id,
          title: article.title,
          summary: article.summary || '',
          source: article.source,
          sourceUrl: article.sourceUrl || null,
          topic: article.category || 'global',
          region: article.region || 'global',
          timestamp: article.timestamp,
          derivedFrom: 'maritime_dashboard_cache',
        }))

      if (cachedArticles.length > 0) {
        return NextResponse.json(
          {
            success: true,
            articles: cachedArticles,
            count: cachedArticles.length,
            fallbackCount: 0,
            watchCount: 0,
            cached: true,
            generatedAt: cached.meta.generatedAt,
          },
          { headers: { 'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120' } },
        )
      }
    }

    let query = supabase
      .from('news_articles')
      .select('id, title, snippet, url, source, topic, region, published_at, created_at')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(Math.min(limit * 4, 100))

    if (region && region !== 'all') {
      query = query.eq('region', region)
    } else if (topic && topic !== 'all') {
      query = query.eq('topic', topic)
    }

    let newsResult
    try {
      newsResult = await withTimeout(query, 3500, 'news query')
    } catch (error) {
      console.error('[live-news] News query timeout:', error)
      const fallback = buildWatchFallback(region).slice(0, Math.min(limit, 50))
      return NextResponse.json({
        success: true,
        articles: fallback,
        count: fallback.length,
        fallbackCount: 0,
        watchCount: fallback.length,
        warning: 'news query timed out; showing live watch context',
      })
    }

    const { data, error } = newsResult

    if (error) {
      console.error('[live-news] Supabase error:', error)
      const fallback = buildWatchFallback(region).slice(0, Math.min(limit, 50))
      return NextResponse.json({
        success: true,
        articles: fallback,
        count: fallback.length,
        fallbackCount: 0,
        watchCount: fallback.length,
        warning: 'news query failed; showing live watch context',
      })
    }

    const articles = (data || [])
      .filter((a: any) => isTrustedSource(a.source || ''))
      .filter((a: any) => isOperationalMaritimeNews(a))
      .filter((a: any) => !region || region === 'all' || a.region === region)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        summary: a.snippet || '',
        source: a.source,
        sourceUrl: a.url || null,
        topic: a.topic || 'global',
        region: a.region || 'global',
        timestamp: a.published_at || a.created_at,
      }))

    const articleUrls = new Set(articles.map((article: any) => article.sourceUrl).filter(Boolean))
    const signalLimit = Math.max(0, Math.min(limit, 50) - articles.length)
    let signalFallback: any[] = []

    if (signalLimit > 0) {
      let signalQuery = supabase
        .from('maritime_signals')
        .select('signal_key, title, summary, source, source_url, region, signal_type, observed_at, confidence')
        .in('signal_type', ['official_alert', 'navigation_warning', 'news_corroboration'])
        .order('observed_at', { ascending: false })
        .limit(Math.min(signalLimit * 4, 40))

      if (region && region !== 'all') {
        signalQuery = signalQuery.eq('region', region)
      }

      let signalResult
      try {
        signalResult = await withTimeout(signalQuery, 2500, 'signal query')
      } catch (error) {
        console.error('[live-news] Signal query timeout:', error)
        signalResult = { data: [], error: null }
      }

      const { data: signalData, error: signalError } = signalResult
      if (signalError) {
        console.error('[live-news] Signal fallback error:', signalError)
      } else {
        signalFallback = (signalData || [])
          .filter((signal: any) => !signal.source_url || !articleUrls.has(signal.source_url))
          .filter((signal: any) => !region || region === 'all' || signal.region === region)
          .slice(0, signalLimit)
          .map((signal: any) => ({
            id: signal.signal_key,
            title: signal.title,
            summary: signal.summary || '',
            source: signal.source,
            sourceUrl: signal.source_url || null,
            topic: signal.signal_type,
            region: signal.region || 'global',
            timestamp: signal.observed_at,
            confidence: signal.confidence,
            derivedFrom: 'maritime_signals',
          }))
      }
    }

    const currentCount = articles.length + signalFallback.length
    const watchFallback = currentCount > 0 ? [] : buildWatchFallback(region)

    const mergedArticles = [...articles, ...signalFallback, ...watchFallback].slice(0, Math.min(limit, 50))

    return NextResponse.json(
      {
        success: true,
        articles: mergedArticles,
        count: mergedArticles.length,
        fallbackCount: signalFallback.length,
        watchCount: watchFallback.length,
      },
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    )
  } catch (err: any) {
    const fallback = buildWatchFallback(region).slice(0, Math.min(limit, 50))
    return NextResponse.json({
      success: true,
      articles: fallback,
      count: fallback.length,
      fallbackCount: 0,
      watchCount: fallback.length,
      warning: err?.message || 'live news fallback active',
    })
  }
}
