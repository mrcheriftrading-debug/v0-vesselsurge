export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache } from '@/lib/maritime-dashboard-cache'
import { MARITIME_SEARCH_FEEDS } from '@/lib/maritime-search-feeds'
import { isTierOneNewsSource, TIER_ONE_NEWS_SOURCE_NAMES } from '@/lib/maritime-source-quality'
import { publicVercelCacheHeaders } from '@/lib/vercel-cache'

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
  ...TIER_ONE_NEWS_SOURCE_NAMES,
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
const LIVE_REGIONS = ['hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'] as const
const LIVE_NEWS_CACHE_HEADERS = publicVercelCacheHeaders('public, max-age=15, s-maxage=30, stale-while-revalidate=120', ['live-news'])
const LIVE_NEWS_FALLBACK_CACHE_HEADERS = publicVercelCacheHeaders('public, max-age=30, s-maxage=120, stale-while-revalidate=300', ['live-news'])

function isExpectedFallbackReason(value: unknown) {
  const message = value instanceof Error ? value.message : String(value || '')
  return /timed out|timeout|aborted/i.test(message)
}

const REGION_KEYWORDS: Record<string, string[]> = {
  hormuz: ['hormuz', 'strait of hormuz', 'persian gulf', 'gulf of oman', 'iran', 'oman', 'uae'],
  bab: ['bab el-mandeb', 'bab el mandeb', 'red sea', 'gulf of aden', 'houthi', 'yemen', 'aden'],
  suez: ['suez', 'suez canal', 'port said', 'egypt', 'ismailia'],
  malacca: [
    'malacca',
    'strait of malacca',
    'straits of malacca',
    'singapore strait',
    'port of singapore',
    'singapore port',
    'singapore shipping',
    'southeast asia shipping',
    'recaap',
    'piracy',
    'armed robbery',
  ],
  panama: ['panama canal', 'panama canal authority', 'pancanal', 'gatun lake', 'neopanamax', 'miraflores', 'cocoli'],
  taiwan: ['taiwan strait', 'taiwan shipping', 'taiwan trade lane', 'kaohsiung', 'keelung', 'taiwan maritime'],
  turkish: ['turkish straits', 'bosporus', 'bosphorus', 'dardanelles', 'black sea', 'istanbul strait', 'canakkale strait'],
  gibraltar: ['strait of gibraltar', 'gibraltar', 'algeciras', 'atlantic-mediterranean', 'atlantic mediterranean'],
  cape: ['cape of good hope', 'cape route', 'red sea rerouting', 'red sea bypass', 'south africa shipping'],
}

const OPERATIONAL_NEWS_PATTERN = /\b(ship|shipping|vessel|tanker|cargo|freight|maritime|ais|port|canal|convoy|transit|route|reroute|re-route|divert|queue|draft|water|delay|congestion|piracy|armed robbery|attack|missile|drone|seized|hijack|warning|advisory|incident|threat|war risk|insurance|oil|crude|lng|naval|voyage|fuel|bunker)\b/i
const NOISE_PATTERN = /\b(stock|stocks|shares|dividend|earnings|equity|equities|bond|bonds|forex|crypto|bitcoin|railway|football|cricket|tourism|movie|celebrity)\b/i
const FINANCIAL_TITLE_PATTERN = /\b(stock|stocks|shares|dividend|earnings|equity|equities|bond|bonds|forex|market cap|price target)\b/i
const GOOGLE_NEWS_SOURCE_BLOCKLIST = /\b(crypto|bitcoin|blockchain|defi|decrypt|coingape|coinmarketcap|coin republic|unchained|facebook|mexc|forex|fxstreet|travel|tourism|sports|football|cricket|entertainment|msn|aol|barron|discovery alert|etv bharat|wlns|latteluxury|nomad lawyer|greek city times|korea herald|chosun|nation thailand|cgtn|okdiario)\b|조선일보|아시아경제/i
const HARD_NEWS_NOISE_PATTERN = /\b(crypto|bitcoin|blockchain|defi|token|coinmarketcap|football|cricket|celebrity|movie|tourism|historic|history|accidentally blocked|ever given)\b/i

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
  panama: [
    {
      title: 'Panama Canal source sweep active',
      summary: 'VesselSurge is monitoring Panama Canal transit, queue pressure, water constraints and Atlantic-Pacific route exposure.',
      source: 'OpenClaw Panama Canal Source Sweep',
      topic: 'canal_transit_context',
    },
  ],
  taiwan: [
    {
      title: 'Taiwan Strait source sweep active',
      summary: 'VesselSurge is monitoring Taiwan Strait maritime alerts, naval activity, ports and Asia cargo continuity signals.',
      source: 'OpenClaw Taiwan Strait Source Sweep',
      topic: 'asia_trade_lane_context',
    },
  ],
  turkish: [
    {
      title: 'Turkish Straits source sweep active',
      summary: 'VesselSurge is monitoring Bosporus, Dardanelles, Black Sea tanker flow, weather holds and transit interruptions.',
      source: 'OpenClaw Turkish Straits Source Sweep',
      topic: 'black_sea_route_context',
    },
  ],
  gibraltar: [
    {
      title: 'Strait of Gibraltar source sweep active',
      summary: 'VesselSurge is monitoring Atlantic-Mediterranean vessel flow, Gibraltar port context, congestion and security signals.',
      source: 'OpenClaw Gibraltar Source Sweep',
      topic: 'mediterranean_entry_context',
    },
  ],
  cape: [
    {
      title: 'Cape of Good Hope source sweep active',
      summary: 'VesselSurge is monitoring Red Sea bypass routing, Cape voyage time, fuel cost pressure and freight disruption signals.',
      source: 'OpenClaw Cape Route Source Sweep',
      topic: 'rerouting_context',
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
  if (NOISE_PATTERN.test(text) && !/\b(ship|shipping|vessel|tanker|cargo|freight|maritime|canal|port|transit|route|suez|malacca|hormuz|red sea|bab el|panama canal|taiwan strait|bosporus|bosphorus|dardanelles|gibraltar|cape of good hope)\b/i.test(text)) {
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

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;|&#8217;/g, "'")
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function between(value: string, start: string, end: string) {
  const from = value.indexOf(start)
  if (from === -1) return ''
  const to = value.indexOf(end, from + start.length)
  if (to === -1) return ''
  return value.slice(from + start.length, to)
}

function safeIsoDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function googleNewsSource(title: string) {
  const parts = title.split(' - ')
  return parts.length > 1 ? `Google News: ${parts.at(-1)}` : 'Google News'
}

function googleNewsTitle(title: string) {
  const parts = title.split(' - ')
  return parts.length > 1 ? parts.slice(0, -1).join(' - ').trim() : title.trim()
}

function broadenGoogleNewsWindow(url: string) {
  return url.replace('when%3A1d', 'when%3A7d').replace('when:1d', 'when:7d')
}

async function fetchDirectLiveNews(region: string | null, topic: string | null, limit: number) {
  const selectedFeeds = MARITIME_SEARCH_FEEDS
    .filter((feed) => !region || region === 'all' || feed.regionHint === region)
    .flatMap((feed) => feed.source.startsWith('Google News Search:')
      ? [
          { ...feed, url: feed.url, window: '24h' },
          { ...feed, url: broadenGoogleNewsWindow(feed.url), window: '7d' },
        ]
      : [{ ...feed, url: feed.url, window: 'live' }],
    )

  const results = await Promise.allSettled(selectedFeeds.map(async (feed) => {
    const response = await fetch(feed.url, {
      signal: AbortSignal.timeout(1800),
      headers: {
        accept: 'application/rss+xml,text/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'VesselSurge OpenClaw/1.0',
      },
      next: { revalidate: 120 },
    })

    if (!response.ok) return []
    const xml = await response.text()
    const items = xml.split('<item>').slice(1, 8)

    return items.map((item, index) => {
      const rawTitle = decodeHtml(between(item, '<title>', '</title>'))
      const source = feed.source.startsWith('Google News Search:') ? googleNewsSource(rawTitle) : feed.source
      const title = feed.source.startsWith('Google News Search:') ? googleNewsTitle(rawTitle) : rawTitle.trim()
      const summary = decodeHtml(between(item, '<description>', '</description>'))
      const url = decodeHtml(between(item, '<link>', '</link>'))
      const publishedAt = safeIsoDate(decodeHtml(between(item, '<pubDate>', '</pubDate>')))
      return {
        id: `direct-${feed.regionHint}-${feed.window}-${index}-${Buffer.from(url || title).toString('base64url').slice(0, 16)}`,
        title,
        snippet: summary,
        summary,
        source,
        sourceUrl: url || null,
        topic: topic && topic !== 'all' ? topic : 'live_maritime_news',
        region: feed.regionHint,
        timestamp: publishedAt,
        published_at: publishedAt,
        derivedFrom: 'direct_news_search_rss',
        tierOneSweep: feed.source.includes('Tier-1'),
      }
    })
  }))

  const seen = new Set<string>()
  const filtered = results
    .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    .filter((article) => article.title && article.sourceUrl)
    .filter((article) => !article.tierOneSweep || isTierOneNewsSource(`${article.source} ${article.sourceUrl}`))
    .filter((article) => !GOOGLE_NEWS_SOURCE_BLOCKLIST.test(article.source))
    .filter((article) => !HARD_NEWS_NOISE_PATTERN.test(`${article.title} ${article.summary} ${article.source}`))
    .filter((article) => isOperationalMaritimeNews(article))
    .filter((article) => {
      const key = article.sourceUrl || article.title
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  const max = Math.min(limit, 50)
  const sorted = filtered.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  const balancedRegions = LIVE_REGIONS
  const byRegion = new Map(balancedRegions.map((itemRegion) => [
    itemRegion,
    sorted.filter((article) => article.region === itemRegion),
  ]))
  const balanced: typeof sorted = []

  while (balanced.length < max && balancedRegions.some((itemRegion) => (byRegion.get(itemRegion)?.length || 0) > 0)) {
    for (const itemRegion of balancedRegions) {
      const next = byRegion.get(itemRegion)?.shift()
      if (next) balanced.push(next)
      if (balanced.length >= max) break
    }
  }

  return balanced
    .map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      source: article.source,
      sourceUrl: article.sourceUrl,
      topic: article.topic,
      region: article.region,
      timestamp: article.timestamp,
      derivedFrom: article.derivedFrom,
    }))
}

function buildWatchFallback(region: string | null) {
  const regions = region && region !== 'all' ? [region] : [...LIVE_REGIONS]
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

function dedupeNewsItems<T extends { title?: string | null; source?: string | null; sourceUrl?: string | null; url?: string | null }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = (item.sourceUrl || item.url || `${item.source || 'unknown'}:${item.title || ''}`)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || null
  const region = searchParams.get('region') || null
  const limit = parseInt(searchParams.get('limit') || '20')
  const directOnly = searchParams.get('source') === 'direct' || searchParams.get('direct') === '1'

  if (directOnly) {
    const directNews = await fetchDirectLiveNews(region, topic, limit).catch((directError) => {
      console.warn('[live-news] Direct-only source sweep fallback:', directError)
      return []
    })
    const fallback = directNews.length > 0 ? directNews : buildWatchFallback(region).slice(0, Math.min(limit, 50))

    return NextResponse.json({
      success: true,
      articles: fallback,
      count: fallback.length,
      fallbackCount: 0,
      watchCount: directNews.length > 0 ? 0 : fallback.length,
      directNewsCount: directNews.length,
      sourceMode: 'direct',
      warning: directNews.length > 0 ? null : 'direct source sweep empty; showing live watch context',
    }, { headers: LIVE_NEWS_FALLBACK_CACHE_HEADERS })
  }

  try {
    const supabase = createAdminClient()
    const cached = await withTimeout(getFreshMaritimeDashboardCache(supabase), 700, 'dashboard cache')
      .catch(() => withTimeout(getLastMaritimeDashboardCache(supabase, 'fresh news query unavailable; serving last known source-reviewed news'), 700, 'stale dashboard cache').catch(() => null))
    if (cached?.data?.articles?.length) {
      const cachedArticles = dedupeNewsItems(cached.data.articles
        .filter((article: any) => !region || region === 'all' || article.region === region)
        .filter((article: any) => !topic || topic === 'all' || article.category === topic)
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
        })))
        .slice(0, Math.min(limit, 50))

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
          { headers: LIVE_NEWS_CACHE_HEADERS },
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
      newsResult = await withTimeout(query, 900, 'news query')
    } catch (error) {
      if (!isExpectedFallbackReason(error)) console.warn('[live-news] News query fallback:', error)
      const directNews = await fetchDirectLiveNews(region, topic, limit).catch((directError) => {
        if (!isExpectedFallbackReason(directError)) console.warn('[live-news] Direct news fallback unavailable:', directError)
        return []
      })
      const fallback = directNews.length > 0 ? directNews : buildWatchFallback(region).slice(0, Math.min(limit, 50))
      return NextResponse.json({
        success: true,
        articles: fallback,
        count: fallback.length,
        fallbackCount: 0,
        watchCount: directNews.length > 0 ? 0 : fallback.length,
        directNewsCount: directNews.length,
        warning: directNews.length > 0 ? 'database news query timed out; served live source-linked web news' : 'news query timed out; showing live watch context',
      }, { headers: LIVE_NEWS_FALLBACK_CACHE_HEADERS })
    }

    const { data, error } = newsResult

    if (error) {
      if (!isExpectedFallbackReason(error)) console.warn('[live-news] Supabase news fallback:', error)
      const directNews = await fetchDirectLiveNews(region, topic, limit).catch(() => [])
      const fallback = directNews.length > 0 ? directNews : buildWatchFallback(region).slice(0, Math.min(limit, 50))
      return NextResponse.json({
        success: true,
        articles: fallback,
        count: fallback.length,
        fallbackCount: 0,
        watchCount: directNews.length > 0 ? 0 : fallback.length,
        directNewsCount: directNews.length,
        warning: directNews.length > 0 ? 'database news query failed; served live source-linked web news' : 'news query failed; showing live watch context',
      }, { headers: LIVE_NEWS_FALLBACK_CACHE_HEADERS })
    }

    const articles = dedupeNewsItems((data || [])
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
      })))

    const articleUrls = new Set(articles.map((article: any) => article.sourceUrl).filter(Boolean))
    const signalLimit = Math.max(0, Math.min(limit, 50) - articles.length)
    let signalFallback: any[] = []

    if (signalLimit > 0) {
      let signalQuery = supabase
        .from('maritime_signals')
        .select('signal_key, title, summary, source, source_url, region, signal_type, observed_at, confidence')
        .in('signal_type', ['official_alert', 'navigation_warning', 'news_corroboration', 'source_sweep'])
        .order('observed_at', { ascending: false })
        .limit(Math.min(signalLimit * 4, 40))

      if (region && region !== 'all') {
        signalQuery = signalQuery.eq('region', region)
      }

      let signalResult
      try {
        signalResult = await withTimeout(signalQuery, 800, 'signal query')
      } catch (error) {
        console.warn('[live-news] Signal query fallback:', error)
        signalResult = { data: [], error: null }
      }

      const { data: signalData, error: signalError } = signalResult
      if (signalError) {
        console.warn('[live-news] Signal fallback unavailable:', signalError)
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

    const mergedArticles = dedupeNewsItems([...articles, ...signalFallback, ...watchFallback]).slice(0, Math.min(limit, 50))

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
