import { NextResponse } from 'next/server'
import { collectAisStreamVessels } from '@/lib/aisstream'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

type TrustedArticle = {
  title: string
  snippet: string
  url: string
  source: string
  region: string
  topic: string
  is_active: boolean
  verified: boolean
  credibility: number
  published_at: string
  created_at?: string
  updated_at?: string
}

type TrustedFeed = {
  source: string
  url: string
  credibility: number
  regionHint?: string
}

const TRUSTED_FEEDS = [
  { source: 'USNI News', url: 'https://news.usni.org/feed', credibility: 9 },
  { source: 'gCaptain', url: 'https://gcaptain.com/feed/', credibility: 8 },
  { source: 'Hellenic Shipping News', url: 'https://www.hellenicshippingnews.com/feed/', credibility: 8 },
  { source: 'Splash247', url: 'https://splash247.com/feed/', credibility: 8 },
  { source: 'Offshore Energy', url: 'https://www.offshore-energy.biz/feed/', credibility: 8 },
  { source: 'Seatrade Maritime News', url: 'https://www.seatrade-maritime.com/rss.xml', credibility: 8 },
  { source: 'MarineLink', url: 'https://www.marinelink.com/news/rss', credibility: 8 },
  { source: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', credibility: 8 },
  { source: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', credibility: 8 },
  { source: 'Bloomberg Politics', url: 'https://feeds.bloomberg.com/politics/news.rss', credibility: 8 },
  { source: 'Bloomberg Economics', url: 'https://feeds.bloomberg.com/economics/news.rss', credibility: 8 },
  { source: 'Bloomberg Business', url: 'https://feeds.bloomberg.com/business/news.rss', credibility: 8 },
  { source: 'Safety4Sea', url: 'https://safety4sea.com/feed/', credibility: 8 },
  { source: 'MarineLog', url: 'https://www.marinelog.com/feed/', credibility: 8 },
  { source: 'World Oil', url: 'https://www.worldoil.com/rss', credibility: 7 },
  { source: 'Arab News', url: 'https://www.arabnews.com/rss.xml', credibility: 7 },
  {
    source: 'Google News Strait of Hormuz',
    url: 'https://news.google.com/rss/search?q=(%22Strait%20of%20Hormuz%22%20OR%20%22Hormuz%22%20OR%20%22Persian%20Gulf%22%20OR%20%22Gulf%20of%20Oman%22)%20(shipping%20OR%20vessel%20OR%20tanker%20OR%20maritime%20OR%20oil%20OR%20crude%20OR%20Iran)%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
    credibility: 7,
    regionHint: 'hormuz',
  },
  {
    source: 'Google News Bab el-Mandeb',
    url: 'https://news.google.com/rss/search?q=(%22Bab%20el-Mandeb%22%20OR%20%22Bab%20el%20Mandeb%22%20OR%20%22Red%20Sea%22%20OR%20%22Gulf%20of%20Aden%22)%20(shipping%20OR%20vessel%20OR%20tanker%20OR%20maritime%20OR%20Houthi)%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
    credibility: 7,
    regionHint: 'bab',
  },
  {
    source: 'Google News Suez Canal',
    url: 'https://news.google.com/rss/search?q=(%22Suez%20Canal%22%20OR%20%22Port%20Said%22%20OR%20%22Suez%22)%20(shipping%20OR%20vessel%20OR%20tanker%20OR%20maritime%20OR%20transit)%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
    credibility: 7,
    regionHint: 'suez',
  },
  {
    source: 'Google News Malacca Strait',
    url: 'https://news.google.com/rss/search?q=(%22Strait%20of%20Malacca%22%20OR%20%22Straits%20of%20Malacca%22%20OR%20%22Singapore%20Strait%22)%20(shipping%20OR%20vessel%20OR%20tanker%20OR%20maritime%20OR%20piracy)%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
    credibility: 7,
    regionHint: 'malacca',
  },
] satisfies TrustedFeed[]

const TRUSTED_PAGES = [
  { source: 'ReCAAP ISC Alerts', url: 'https://www.recaap.org/alerts', credibility: 10, region: 'malacca' },
  { source: 'ReCAAP ISC Reports', url: 'https://www.recaap.org/reports', credibility: 10, region: 'malacca' },
  { source: 'Norwegian Maritime Authority', url: 'https://www.sdir.no/en/accidents-and-safety/maritim-sikring/security-level-for-norwegian-vessels/gulf-of-aden-bab-el-mandeb-red-sea/', credibility: 9, region: 'bab' },
  { source: 'MARAD Maritime Security Advisory', url: 'https://www.maritime.dot.gov/msci/2025-001-southern-red-sea-bab-el-mandeb-strait-and-gulf-aden-houthi-attacks-commercial-vessels', credibility: 9, region: 'bab' },
  { source: 'Suez Canal Authority', url: 'https://www.suezcanal.gov.eg/English/MediaCenter/News/Pages/default.aspx', credibility: 10, region: 'suez' },
]

const REGION_KEYWORDS: Record<string, string[]> = {
  hormuz: ['hormuz', 'strait of hormuz', 'persian gulf', 'gulf of oman', 'oman', 'iran', 'uae'],
  bab: ['bab el-mandeb', 'bab el mandeb', 'red sea', 'houthi', 'yemen', 'aden', 'gulf of aden', 'djibouti', 'eritrea'],
  suez: ['suez', 'suez canal', 'egypt', 'port said', 'ismailia', 'sinai'],
  malacca: ['malacca', 'strait of malacca', 'straits of malacca', 'singapore strait', 'singapore', 'recaap', 'piracy', 'armed robbery', 'sea robbery', 'malaysia', 'indonesia'],
}

const SEVERITY_KEYWORDS = {
  critical: ['attack', 'seized', 'sunk', 'missile', 'strike', 'closure', 'closed', 'blocked', 'blockade', 'war', 'explosion', 'hijack'],
  high: ['warning', 'advisory', 'threat', 'incident', 'disrupt', 'divert', 'reroute', 'avoid', 'piracy', 'armed robbery', 'tension'],
  medium: ['delay', 'congestion', 'monitor', 'caution', 'security', 'risk', 'alert'],
}

const HARD_MARITIME_SIGNAL_KEYWORDS = [
  'shipping',
  'ship',
  'vessel',
  'tanker',
  'maritime',
  'ais',
  'cargo',
  'freight',
  'insurance',
  'war risk',
  'transit',
  'route',
  'reroute',
  'divert',
  'chokepoint',
  'canal',
  'port',
  'piracy',
  'armed robbery',
  'houthi',
  'naval',
  'navy',
]

const GOOGLE_NEWS_NOISE_KEYWORDS = [
  'railway',
  'rail line',
  'high-speed rail',
  'tourism',
  'football',
  'cricket',
  'movie',
  'celebrity',
  'weather forecast',
  'bitcoin',
  'cryptocurrency',
  'crypto',
  'equities',
  'stock market',
  'shares',
]

const GOOGLE_NEWS_SOURCE_BLOCKLIST = [
  'crypto',
  'travel',
  'tourism',
  'sports',
  'football',
  'cricket',
  'entertainment',
]

const CURRENT_YEAR = new Date().getUTCFullYear()
const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;|&#8217;/g, "'")
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeIsoDate(value: string, fallback = '1970-01-01T00:00:00.000Z') {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function parseSourceDate(text: string, fallback = '1970-01-01T00:00:00.000Z') {
  const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/)
  if (numeric) {
    const [, day, month, year] = numeric
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString()
  }

  const named = text.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/i)
  if (named) {
    const [, day, monthName, year] = named
    return new Date(Date.UTC(Number(year), MONTHS[monthName.toLowerCase()], Number(day))).toISOString()
  }

  const urlDate = text.match(/\b(\d{1,2})-(\d{1,2})-(\d{4})\b/)
  if (urlDate) {
    const [, day, month, year] = urlDate
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString()
  }

  return fallback
}

function isCurrentYear(article: TrustedArticle) {
  return new Date(article.published_at).getUTCFullYear() >= CURRENT_YEAR
}

function isWithinLatest24Hours(article: TrustedArticle, now: Date) {
  const publishedAt = Date.parse(article.published_at)
  if (Number.isNaN(publishedAt)) return false

  const nowMs = now.getTime()
  const oneDayAgo = nowMs - 24 * 60 * 60 * 1000
  const clockSkewAllowance = nowMs + 5 * 60 * 1000

  return publishedAt >= oneDayAgo && publishedAt <= clockSkewAllowance
}

function between(value: string, start: string, end: string) {
  const from = value.indexOf(start)
  if (from === -1) return ''
  const to = value.indexOf(end, from + start.length)
  if (to === -1) return ''
  return value.slice(from + start.length, to)
}

function classifyRegion(text: string) {
  const lower = text.toLowerCase()
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) return region
  }
  return 'global'
}

function classifyRisk(text: string): RiskLevel {
  const lower = text.toLowerCase()
  if (SEVERITY_KEYWORDS.critical.some((keyword) => lower.includes(keyword))) return 'critical'
  if (SEVERITY_KEYWORDS.high.some((keyword) => lower.includes(keyword))) return 'high'
  if (SEVERITY_KEYWORDS.medium.some((keyword) => lower.includes(keyword))) return 'medium'
  return 'low'
}

function isRelevant(text: string) {
  const lower = text.toLowerCase()
  return [
    'hormuz',
    'red sea',
    'bab el',
    'suez',
    'malacca',
    'singapore strait',
    'shipping',
    'maritime',
    'vessel',
    'tanker',
    'piracy',
    'armed robbery',
    'seized',
    'oil',
    'crude',
    'sanction',
    'sanctions',
    'supply chain',
    'trade',
    'freight',
    'naval',
    'navy',
    'geopolitics',
  ].some((keyword) => lower.includes(keyword))
}

function hasHardMaritimeSignal(text: string) {
  const lower = text.toLowerCase()
  return HARD_MARITIME_SIGNAL_KEYWORDS.some((keyword) => lower.includes(keyword))
}

function hasRegionEnergySignal(article: TrustedArticle) {
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const regionKeywords = REGION_KEYWORDS[article.region] || []
  const hasRegion = regionKeywords.some((keyword) => text.includes(keyword))
  const hasEnergy = /\b(oil|crude|lng|energy|iran|sanction|sanctions)\b/i.test(text)
  return hasRegion && hasEnergy
}

function isNoisyGoogleNewsArticle(article: TrustedArticle) {
  if (!article.source.startsWith('Google News:')) return false

  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const sourceName = article.source.replace(/^Google News:\s*/i, '').toLowerCase()
  if (GOOGLE_NEWS_SOURCE_BLOCKLIST.some((keyword) => sourceName.includes(keyword))) return true
  if (!hasHardMaritimeSignal(text) && !hasRegionEnergySignal(article)) return true

  const hasNoise = GOOGLE_NEWS_NOISE_KEYWORDS.some((keyword) => text.includes(keyword))
  if (!hasNoise) return false

  // Keep infrastructure items only when they also mention a maritime operating signal.
  return !/(ship|shipping|vessel|tanker|maritime|port|canal|freight|cargo|transit|route|reroute|insurance)/i.test(text)
}

function hasDirectRegionSignal(article: TrustedArticle) {
  if (article.source.startsWith('ReCAAP ISC') && article.region === 'malacca') return true
  if ((article.source === 'Norwegian Maritime Authority' || article.source === 'MARAD Maritime Security Advisory') && article.region === 'bab') return true
  if (article.source === 'Suez Canal Authority' && article.region === 'suez') return true
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const keywords = REGION_KEYWORDS[article.region] || []
  return keywords.some((keyword) => text.includes(keyword))
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'VesselSurge OpenClaw/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

function parseRss(xml: string, feed: TrustedFeed): TrustedArticle[] {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0])
  return items
    .map((item) => {
      const title = decodeHtml(between(item, '<title>', '</title>'))
      const snippet = decodeHtml(between(item, '<description>', '</description>') || title)
      const url = decodeHtml(between(item, '<link>', '</link>'))
      const published_at = decodeHtml(between(item, '<pubDate>', '</pubDate>'))
      const googlePublisher = feed.source.startsWith('Google News')
        ? decodeHtml(item.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || '')
        : ''
      const text = `${title} ${snippet}`
      const region = feed.regionHint || classifyRegion(text)

      return {
        title,
        snippet: snippet.slice(0, 600),
        url,
        source: googlePublisher ? `Google News: ${googlePublisher}` : feed.source,
        region,
        topic: region,
        is_active: true,
        verified: true,
        credibility: feed.credibility,
        published_at: safeIsoDate(published_at),
      }
    })
    .filter((article) => article.title && article.url && isRelevant(`${article.title} ${article.snippet}`))
    .filter((article) => !isNoisyGoogleNewsArticle(article))
    .filter((article) => {
      if (!article.source.startsWith('Bloomberg')) return true
      if (/\/news\/(audio|videos)\//i.test(article.url)) return false
      if (/^Source:\s*Bloomberg,\s*\d+/i.test(article.snippet)) return false
      return true
    })
}

function balanceByHotspot(articles: TrustedArticle[]) {
  const preferred: TrustedArticle[] = []
  const overflow: TrustedArticle[] = []

  for (const hotspot of ['hormuz', 'bab', 'suez', 'malacca']) {
    const hotspotArticles = articles.filter((article) => article.region === hotspot)
    preferred.push(...hotspotArticles.slice(0, 8))
    overflow.push(...hotspotArticles.slice(8))
  }

  return [...preferred, ...overflow]
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
    .slice(0, 36)
}

function parseTrustedPage(html: string, source: string, pageUrl: string, credibility: number, regionHint?: string): TrustedArticle[] {
  const title = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || source)
  const bodyText = decodeHtml(html).slice(0, 1200)
  const isSuezNewsPage = pageUrl.includes('suezcanal.gov.eg')
  const isRecaapPage = pageUrl.includes('recaap.org')
  const isBabReferencePage = regionHint === 'bab'
  const rawLinks = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      const href = match[1].startsWith('http') ? match[1] : new URL(match[1], pageUrl).toString()
      const linkText = decodeHtml(match[2])
      return { href, linkText }
    })

  const candidates = rawLinks
    .filter(({ href, linkText }) => {
      if (linkText.length <= 18) return false
      if (linkText.includes('{{') || linkText.toLowerCase().includes('language.displayname')) return false
      if (isRecaapPage && !href.toLowerCase().endsWith('.pdf')) return false
      if (isRecaapPage && !new RegExp(String(CURRENT_YEAR), 'i').test(linkText)) return false
      if (isRecaapPage && !/(malacca|singapore strait|weekly report|quarter|piracy|armed robbery|sea robbery)/i.test(linkText)) return false
      if (isSuezNewsPage && !href.includes('/MediaCenter/News/Pages/')) return false
      if (isSuezNewsPage && !/(suez|canal|navigation|vessel|transit|ship|maritime|tugboat|convoy)/i.test(linkText)) return false
      if (isBabReferencePage) return false
      return isRelevant(linkText)
    })
    .slice(0, 8)

  if (isRecaapPage && candidates.length === 0) return []

  const rows = candidates.length > 0 ? candidates : [{ href: pageUrl, linkText: title }]
  return rows.map(({ href, linkText }) => {
    const text = `${linkText} ${bodyText}`
    const region = regionHint || classifyRegion(text)
    return {
      title: linkText.slice(0, 200),
      snippet: bodyText.slice(0, 600),
      url: href,
      source,
      region,
      topic: region,
      is_active: true,
      verified: true,
      credibility,
      published_at: parseSourceDate(`${linkText} ${href}`),
    }
  })
}

async function collectTrustedArticles(now = new Date()) {
  const feedResults = await Promise.all(
    TRUSTED_FEEDS.map(async (feed) => {
      try {
        return parseRss(await fetchText(feed.url), feed)
      } catch (error) {
        console.warn('[trusted-update] feed failed', feed.source, error)
        return []
      }
    }),
  )

  const pageResults = await Promise.all(
    TRUSTED_PAGES.map(async (page) => {
      try {
        return parseTrustedPage(await fetchText(page.url), page.source, page.url, page.credibility, page.region)
      } catch (error) {
        console.warn('[trusted-update] page failed', page.source, error)
        return []
      }
    }),
  )

  const articles = [...feedResults, ...pageResults].flat()

  const seen = new Set<string>()
  const filtered = articles
    .filter((article) => !seen.has(article.url) && seen.add(article.url))
    .filter((article) => article.region !== 'global')
    .filter((article) => hasDirectRegionSignal(article))
    .filter((article) => !article.source.startsWith('Google News:') || hasHardMaritimeSignal(`${article.title} ${article.snippet}`) || hasRegionEnergySignal(article))
    .filter((article) => !isNoisyGoogleNewsArticle(article))
    .filter((article) => isCurrentYear(article))
    .filter((article) => isWithinLatest24Hours(article, now))
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))

  return balanceByHotspot(filtered)
}

function buildStats(articles: TrustedArticle[]) {
  const now = new Date().toISOString()
  return ['hormuz', 'bab', 'suez', 'malacca'].map((hotspot) => {
    const relevant = articles.filter((article) => article.region === hotspot)
    const risk = relevant.reduce<RiskLevel>((level, article) => {
      const articleRisk = classifyRisk(`${article.title} ${article.snippet}`)
      if (articleRisk === 'critical') return 'critical'
      if (articleRisk === 'high' && level !== 'critical') return 'high'
      if (articleRisk === 'medium' && level === 'low') return 'medium'
      return level
    }, 'low')

    return {
      hotspot,
      active_vessels: 0,
      daily_transits: 0,
      avg_wait_time: relevant.length ? 'Source review' : 'No verified update',
      market_volume: 0,
      risk_level: risk,
      updated_at: now,
    }
  })
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or service role key')
  }

  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const timestamp = now.toISOString()
  const articles = (await collectTrustedArticles(now)).map((article) => ({
    ...article,
    created_at: timestamp,
    updated_at: timestamp,
  }))

  const deleteNews = await supabaseRequest('news_articles?created_at=gte.2000-01-01', { method: 'DELETE' })
  if (!deleteNews.ok) throw new Error(`Failed to clear old news: ${deleteNews.status}`)

  if (articles.length > 0) {
    const insertNews = await supabaseRequest('news_articles', {
      method: 'POST',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify(articles),
    })
    if (!insertNews.ok) throw new Error(`Failed to insert trusted news: ${insertNews.status} ${await insertNews.text()}`)
  }

  const stats = buildStats(articles)
  const upsertStats = await supabaseRequest('hotspot_stats?on_conflict=hotspot', {
    method: 'POST',
    headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(stats),
  })
  if (!upsertStats.ok) throw new Error(`Failed to update hotspot stats: ${upsertStats.status} ${await upsertStats.text()}`)

  const ais = await collectAisStreamVessels({ timeoutMs: 18000, maxVessels: 120 })
  let vesselsUpdated = 0
  if (ais.vessels.length > 0) {
    const staleCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const deleteStaleVessels = await supabaseRequest(`vessels?updated_at=lt.${encodeURIComponent(staleCutoff)}`, { method: 'DELETE' })
    if (!deleteStaleVessels.ok) throw new Error(`Failed to delete stale AIS vessels: ${deleteStaleVessels.status} ${await deleteStaleVessels.text()}`)

    const upsertVessels = await supabaseRequest('vessels?on_conflict=mmsi', {
      method: 'POST',
      headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(ais.vessels),
    })
    if (!upsertVessels.ok) throw new Error(`Failed to update AIS vessels: ${upsertVessels.status} ${await upsertVessels.text()}`)
    vesselsUpdated = ais.vessels.length

    const vesselCounts = ais.vessels.reduce<Record<string, number>>((acc, vessel) => {
      acc[vessel.hotspot] = (acc[vessel.hotspot] || 0) + 1
      return acc
    }, {})

    const statsWithAis = stats.map((row) => ({
      ...row,
      active_vessels: vesselCounts[row.hotspot] || 0,
    }))
    const upsertAisStats = await supabaseRequest('hotspot_stats?on_conflict=hotspot', {
      method: 'POST',
      headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(statsWithAis),
    })
    if (!upsertAisStats.ok) throw new Error(`Failed to update AIS stats: ${upsertAisStats.status} ${await upsertAisStats.text()}`)
  }

  return NextResponse.json({
    success: true,
    timestamp,
    source: 'openclaw-trusted-web',
    articles_fetched: articles.length,
    articles_inserted: articles.length,
    stats_updated: stats.length,
    vessels_found: ais.vessels.length,
    vessels_updated: vesselsUpdated,
    ais_status: ais.reason,
    verified: articles.length,
    window: {
      from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      to: timestamp,
      policy: 'Only source-published articles from the latest 24 hours are written.',
    },
    sources: [...new Set(articles.map((article) => article.source))],
    note: 'Old broad NewsData/RSS feed disabled. Only trusted allowlisted sources from the latest 24 hours are written.',
  })
}
