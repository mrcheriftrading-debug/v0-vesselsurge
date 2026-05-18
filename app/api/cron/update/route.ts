import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { collectAisStreamVessels } from '@/lib/aisstream'
import { upsertMaritimeDashboardCache } from '@/lib/maritime-dashboard-cache'
import { fetchAllMarineConditions } from '@/lib/marine-conditions'
import { MARITIME_SEARCH_FEEDS } from '@/lib/maritime-search-feeds'
import { createAdminClient } from '@/lib/supabase/admin'

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

type MaritimeSignal = {
  signal_key: string
  source: string
  source_url: string | null
  title: string
  summary: string
  region: string
  signal_type: 'official_alert' | 'navigation_warning' | 'ais_anomaly' | 'weather_constraint' | 'news_corroboration'
  severity: RiskLevel
  confidence: number
  observed_at: string
  metadata: Record<string, unknown>
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
  ...MARITIME_SEARCH_FEEDS,
] satisfies TrustedFeed[]

const TRUSTED_PAGES = [
  { source: 'ReCAAP ISC Alerts', url: 'https://www.recaap.org/alerts', credibility: 10, region: 'malacca' },
  { source: 'ReCAAP ISC Reports', url: 'https://www.recaap.org/reports', credibility: 10, region: 'malacca' },
  { source: 'Norwegian Maritime Authority', url: 'https://www.sdir.no/en/accidents-and-safety/maritim-sikring/security-level-for-norwegian-vessels/gulf-of-aden-bab-el-mandeb-red-sea/', credibility: 9, region: 'bab' },
  { source: 'MARAD Maritime Security Advisory', url: 'https://www.maritime.dot.gov/msci/2026-006-red-sea-bab-el-mandeb-strait-gulf-aden-arabian-sea-and-somali-basin-houthi-attacks', credibility: 9, region: 'bab' },
  { source: 'Suez Canal Authority', url: 'https://www.suezcanal.gov.eg/English/MediaCenter/News/Pages/default.aspx', credibility: 10, region: 'suez' },
  { source: 'MSCIO Alerts', url: 'https://www.mscio.eu/alerts/', credibility: 10, region: 'bab' },
  { source: 'UKMTO Products', url: 'https://www.ukmto.org/ukmto-products', credibility: 10, region: 'bab' },
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

const GOOGLE_NEWS_NOISE_KEYWORDS = [
  'railway',
  'rail line',
  'high-speed rail',
  'delegation',
  'partnership',
  'diplomatic',
  'diplomacy',
  'accidentally blocked',
  'giant ship',
  'ever given',
  'history',
  'historic',
  'missile deal',
  'weapons deal',
  'export licenses',
  'export licence',
  'scrapped missile',
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
  'bitcoin',
  'blockchain',
  'defi',
  'decrypt',
  'coingape',
  'bitbo',
  'bloomingbit',
  'facebook',
  'mexc',
  'forex',
  'fxstreet',
  'ad hoc news',
  'yahoo finance',
  'ndtv profit',
  'thestreet',
  'indexbox',
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
  return isWithinLatestDays(article, now, 1)
}

function isWithinLatestDays(article: TrustedArticle, now: Date, days: number) {
  const publishedAt = Date.parse(article.published_at)
  if (Number.isNaN(publishedAt)) return false

  const nowMs = now.getTime()
  const earliest = nowMs - days * 24 * 60 * 60 * 1000
  const clockSkewAllowance = nowMs + 5 * 60 * 1000

  return publishedAt >= earliest && publishedAt <= clockSkewAllowance
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

function classifyNewsRisk(text: string): RiskLevel {
  const risk = classifyRisk(text)
  return risk === 'critical' ? 'high' : risk
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

function hasRegionEnergySignal(article: TrustedArticle) {
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const regionKeywords = REGION_KEYWORDS[article.region] || []
  const hasRegion = regionKeywords.some((keyword) => text.includes(keyword))
  const hasEnergy = /\b(oil|crude|lng|energy|iran|sanction|sanctions)\b/i.test(text)
  return hasRegion && hasEnergy
}

function hasOperationalChokepointSignal(article: TrustedArticle) {
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const hasVesselOrRoute = /\b(ship|shipping|vessel|tanker|maritime|ais|cargo|freight|transit|route|reroute|divert|port|canal|convoy|queue|delay|congestion|piracy|armed robbery)\b/i.test(text)
  const hasSecurityIncident = /\b(attack|missile|strike|seized|hijack|warning|advisory|incident|threat|houthi|naval|navy|war risk|insurance)\b/i.test(text)
  const hasEnergyRoute = article.region === 'hormuz' && hasRegionEnergySignal(article)

  return hasEnergyRoute || hasVesselOrRoute || hasSecurityIncident
}

function isNoisyGoogleNewsArticle(article: TrustedArticle) {
  if (!isWebSearchArticle(article)) return false

  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const sourceName = article.source.replace(/^(Google|Bing) News(?: Search)?:\s*/i, '').toLowerCase()
  if (GOOGLE_NEWS_SOURCE_BLOCKLIST.some((keyword) => sourceName.includes(keyword))) return true
  if (/(accidentally blocked|giant ship|ever given|historic|history|what happened when)/i.test(text)) return true
  if (/\b(railway|rail line|high-speed rail|on rails)\b/i.test(text) && !/\b(ship|shipping|vessel|tanker|maritime|cargo|freight|port|convoy)\b/i.test(text)) return true
  if (!hasOperationalChokepointSignal(article)) return true

  const hasNoise = GOOGLE_NEWS_NOISE_KEYWORDS.some((keyword) => text.includes(keyword))
  if (!hasNoise) return false

  // Keep infrastructure items only when they also mention a maritime operating signal.
  return !hasOperationalChokepointSignal(article)
}

function isDefenseProcurementNoise(article: TrustedArticle) {
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  return /(missile deal|weapons deal|export licenses|export licence|scrapped missile|defence contract|defense contract)/i.test(text)
}

function isFinancialMarketNoise(article: TrustedArticle) {
  const title = article.title.toLowerCase()
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const titleFinancialNoise = /\b(stock|stocks|shares|dividend|earnings|equity|equities|bond|bonds|forex|market cap|price target)\b/i.test(title)
  if (titleFinancialNoise) return true

  const financialNoise = /\b(carry trade|emerging carry|rand|real|equities|stocks|shares|dividend|earnings|bonds|treasury yields|forex|currency traders|market rebound|favorites)\b/i.test(text)
  const titleHasOperationalSignal = /\b(ship|shipping|vessel|tanker|maritime|cargo|freight|transit|route|reroute|divert|port|canal|convoy|queue|delay|congestion|piracy|armed robbery|hormuz|suez|malacca|red sea|bab el)\b/i.test(title)
  if (financialNoise && !titleHasOperationalSignal) return true
  return financialNoise && !hasOperationalChokepointSignal(article)
}

function hasDirectRegionSignal(article: TrustedArticle) {
  if (article.source.startsWith('ReCAAP ISC') && article.region === 'malacca') return true
  if ((article.source === 'Norwegian Maritime Authority' || article.source === 'MARAD Maritime Security Advisory') && article.region === 'bab') return true
  if (article.source === 'Suez Canal Authority' && article.region === 'suez') return true
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const keywords = REGION_KEYWORDS[article.region] || []
  return keywords.some((keyword) => text.includes(keyword))
}

function hasRouteSpilloverSignal(article: TrustedArticle) {
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const hasReroutePressure = /\b(rerout|re-rout|divert|alternative route|cape of good hope|freight|transit|shipping companies|vessel|ship|tanker|cargo)\b/i.test(text)

  if (article.region === 'suez') {
    return hasReroutePressure && /\b(red sea|suez|canal|cape of good hope|mediterranean|port said)\b/i.test(text)
  }

  if (article.region === 'bab') {
    return hasReroutePressure && /\b(red sea|bab el|gulf of aden|houthi|yemen|somali piracy|somalia)\b/i.test(text)
  }

  if (article.region === 'malacca') {
    return hasReroutePressure && /\b(malacca|singapore strait|singapore|nicobar|land bridge|recaap|piracy)\b/i.test(text)
  }

  return false
}

function hasRegionOrRouteSignal(article: TrustedArticle) {
  return hasDirectRegionSignal(article) || hasRouteSpilloverSignal(article)
}

function isMisassignedDominantRegionArticle(article: TrustedArticle) {
  if (article.region === 'hormuz') return false

  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const isHormuzDominant = /\b(hormuz|persian gulf|gulf of oman)\b/i.test(text)
  if (!isHormuzDominant) return false

  const hasTargetRegion = (REGION_KEYWORDS[article.region] || []).some((keyword) => text.includes(keyword))
  if (hasTargetRegion) return false

  const isRouteSpillover = /\b(rerout|re-rout|divert|avoid|cape route|cape of good hope|red sea|suez|freight|shipping companies|maersk)\b/i.test(text)
    && /\b(ship|shipping|vessel|tanker|cargo|freight|transit|route|maersk)\b/i.test(text)

  return !isRouteSpillover
}

function isWebSearchArticle(article: TrustedArticle) {
  return article.source.startsWith('Google News:') || article.source.startsWith('Bing News')
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'VesselSurge OpenClaw/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(7000),
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
  const selected: TrustedArticle[] = []
  const selectedUrls = new Set<string>()

  for (const hotspot of ['hormuz', 'bab', 'suez', 'malacca']) {
    const hotspotArticles = articles
      .filter((article) => article.region === hotspot)
      .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))

    for (const article of hotspotArticles.slice(0, 6)) {
      selected.push(article)
      selectedUrls.add(article.url)
    }
  }

  const overflow = articles
    .filter((article) => !selectedUrls.has(article.url))
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))

  return [...selected, ...overflow].slice(0, 36)
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
  const sourceResults = await Promise.all([
    ...TRUSTED_FEEDS.map(async (feed) => {
      try {
        return parseRss(await fetchText(feed.url), feed)
      } catch (error) {
        console.warn('[trusted-update] feed failed', feed.source, error)
        return []
      }
    }),
    ...TRUSTED_PAGES.map(async (page) => {
      try {
        return parseTrustedPage(await fetchText(page.url), page.source, page.url, page.credibility, page.region)
      } catch (error) {
        console.warn('[trusted-update] page failed', page.source, error)
        return []
      }
    }),
  ])

  const articles = sourceResults.flat()

  const seen = new Set<string>()
  const dedupedArticles = articles
    .filter((article) => {
      const key = articleDedupeKey(article)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  const coreFiltered = dedupedArticles
    .filter((article) => article.region !== 'global')
    .filter((article) => !isDefenseProcurementNoise(article))
    .filter((article) => !isFinancialMarketNoise(article))
    .filter((article) => !isMisassignedDominantRegionArticle(article))
    .filter((article) => hasRegionOrRouteSignal(article))
    .filter((article) => !isWebSearchArticle(article) || hasOperationalChokepointSignal(article))
    .filter((article) => !isNoisyGoogleNewsArticle(article))
    .filter((article) => isCurrentYear(article))
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))

  const latest = coreFiltered.filter((article) => isWithinLatest24Hours(article, now))
  const latestKeys = new Set(latest.map(articleDedupeKey))
  const regionMinimum = 4
  const relaxedFallbackCandidates = dedupedArticles
    .filter((article) => article.region !== 'global')
    .filter((article) => !isDefenseProcurementNoise(article))
    .filter((article) => !isFinancialMarketNoise(article))
    .filter((article) => !isMisassignedDominantRegionArticle(article))
    .filter((article) => hasRegionOrRouteSignal(article))
    .filter((article) => !isWebSearchArticle(article) || hasOperationalChokepointSignal(article))
    .filter((article) => !isNoisyGoogleNewsArticle(article))
    .filter((article) => isCurrentYear(article))
    .filter((article) => isWithinLatestDays(article, now, 7))
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))

  const fallback = ['hormuz', 'bab', 'suez', 'malacca'].flatMap((region) => {
    const currentCount = latest.filter((article) => article.region === region).length
    if (currentCount >= regionMinimum) return []

    return relaxedFallbackCandidates
      .filter((article) => article.region === region)
      .filter((article) => !latestKeys.has(articleDedupeKey(article)))
      .slice(0, regionMinimum - currentCount)
  })

  return balanceByHotspot([...latest, ...fallback])
}

function buildStats(articles: TrustedArticle[]) {
  const now = new Date().toISOString()
  return ['hormuz', 'bab', 'suez', 'malacca'].map((hotspot) => {
    const relevant = articles.filter((article) => article.region === hotspot)
    const riskCounts = relevant.reduce(
      (counts, article) => {
        const articleRisk = classifyNewsRisk(`${article.title} ${article.snippet}`)
        counts[articleRisk] += 1
        if (articleRisk === 'high' && article.source) counts.highSources.add(article.source)
        return counts
      },
      { low: 0, medium: 0, high: 0, critical: 0, highSources: new Set<string>() },
    )
    const risk: RiskLevel = riskCounts.high >= 6 && riskCounts.highSources.size >= 3
      ? 'high'
      : riskCounts.high > 0 || riskCounts.medium > 0
        ? 'medium'
        : 'low'

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

function stableSignalKey(parts: string[]) {
  return crypto.createHash('sha256').update(parts.filter(Boolean).join('|')).digest('hex')
}

function normalizedArticleTitle(article: TrustedArticle) {
  return article.title
    .toLowerCase()
    .replace(/\s+-\s+[^-]+$/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function articleDedupeKey(article: TrustedArticle) {
  if (isWebSearchArticle(article)) return `${article.region}:${normalizedArticleTitle(article)}`
  return `${article.region}:${article.url || normalizedArticleTitle(article)}`
}

function signalConfidence(article: TrustedArticle, signalType: MaritimeSignal['signal_type']) {
  if (signalType === 'official_alert' || signalType === 'navigation_warning') return Math.min(100, article.credibility * 10)
  if (article.source.startsWith('Google News:')) return article.source.includes('Bloomberg') ? 65 : 52
  if (article.source.startsWith('Bing News')) return 50
  return Math.min(85, article.credibility * 9)
}

function signalTypeForArticle(article: TrustedArticle): MaritimeSignal['signal_type'] {
  if (/recaap|marad|mscio|ukmto|norwegian maritime authority/i.test(article.source)) return 'official_alert'
  if (/suez canal authority/i.test(article.source)) return 'navigation_warning'
  return 'news_corroboration'
}

function buildArticleSignals(articles: TrustedArticle[]): MaritimeSignal[] {
  return articles.map((article) => {
    const signalType = signalTypeForArticle(article)
    const rawSeverity = classifyRisk(`${article.title} ${article.snippet}`)
    const severity = signalType === 'news_corroboration' && rawSeverity === 'critical' ? 'high' : rawSeverity

    return {
      signal_key: stableSignalKey([signalType, article.region, article.url || article.title]),
      source: article.source,
      source_url: article.url || null,
      title: article.title,
      summary: article.snippet,
      region: article.region,
      signal_type: signalType,
      severity,
      confidence: signalConfidence(article, signalType),
      observed_at: article.published_at,
      metadata: {
        credibility: article.credibility,
        topic: article.topic,
        derivedFrom: 'trusted-source-ingest',
      },
    }
  })
}

function buildAisSignals(vessels: Awaited<ReturnType<typeof collectAisStreamVessels>>['vessels'], capturedAt: string): MaritimeSignal[] {
  const byHotspot = vessels.reduce<Record<string, typeof vessels>>((acc, vessel) => {
    acc[vessel.hotspot] ||= []
    acc[vessel.hotspot].push(vessel)
    return acc
  }, {})

  return Object.entries(byHotspot).flatMap(([hotspot, rows]) => {
    const stopped = rows.filter((vessel) => vessel.speed < 0.5)
    const slow = rows.filter((vessel) => vessel.speed >= 0.5 && vessel.speed < 3)
    const signals: MaritimeSignal[] = []

    if (stopped.length >= 3) {
      signals.push({
        signal_key: stableSignalKey(['ais-stoppage', hotspot, capturedAt.slice(0, 13)]),
        source: 'AISStream live AIS',
        source_url: 'https://aisstream.io/documentation',
        title: `${stopped.length} stopped AIS vessels detected near ${hotspot}`,
        summary: `${stopped.length} vessels reported speed below 0.5 kn inside the VesselSurge ${hotspot} watch box.`,
        region: hotspot,
        signal_type: 'ais_anomaly',
        severity: stopped.length >= 50 ? 'high' : 'medium',
        confidence: stopped.length >= 20 ? 68 : 62,
        observed_at: capturedAt,
        metadata: {
          stoppedCount: stopped.length,
          sample: stopped.slice(0, 8).map((vessel) => ({ mmsi: vessel.mmsi, name: vessel.name, speed: vessel.speed })),
        },
      })
    }

    if (slow.length >= 8) {
      signals.push({
        signal_key: stableSignalKey(['ais-slowdown', hotspot, capturedAt.slice(0, 13)]),
        source: 'AISStream live AIS',
        source_url: 'https://aisstream.io/documentation',
        title: `${slow.length} slow-moving AIS vessels detected near ${hotspot}`,
        summary: `${slow.length} vessels reported speeds between 0.5 and 3 kn inside the VesselSurge ${hotspot} watch box.`,
        region: hotspot,
        signal_type: 'ais_anomaly',
        severity: slow.length >= 20 ? 'medium' : 'low',
        confidence: 64,
        observed_at: capturedAt,
        metadata: {
          slowCount: slow.length,
          sample: slow.slice(0, 8).map((vessel) => ({ mmsi: vessel.mmsi, name: vessel.name, speed: vessel.speed })),
        },
      })
    }

    return signals
  })
}

function riskScore(level: RiskLevel) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[level]
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 4) return 'critical'
  if (score >= 3) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

function buildStatsFromSignals(articles: TrustedArticle[], signals: MaritimeSignal[]) {
  const base = buildStats(articles)
  return base.map((row) => {
    const hotspotSignals = signals.filter((signal) => signal.region === row.hotspot)
    const operationalSignals = hotspotSignals.filter((signal) => signal.signal_type !== 'news_corroboration')
    const strongestSignal = operationalSignals.reduce((max, signal) => Math.max(max, riskScore(signal.severity)), 0)
    const officialSignalCount = hotspotSignals.filter((signal) => signal.signal_type === 'official_alert' || signal.signal_type === 'navigation_warning').length
    const aisSignalCount = hotspotSignals.filter((signal) => signal.signal_type === 'ais_anomaly').length
    const confidenceBoost = officialSignalCount ? 1 : aisSignalCount && row.risk_level === 'low' ? 1 : 0
    const risk_level = riskFromScore(Math.max(riskScore(row.risk_level), strongestSignal, confidenceBoost))

    return {
      ...row,
      risk_level,
      avg_wait_time: hotspotSignals.length ? `${hotspotSignals.length} live signals` : row.avg_wait_time,
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
  const articlesPromise = collectTrustedArticles(now).then((rows) => rows.map((article) => ({
    ...article,
    created_at: timestamp,
    updated_at: timestamp,
  })))
  const aisPromise = collectAisStreamVessels({ timeoutMs: 10000, maxVessels: 80 })
  const marineConditionsPromise = fetchAllMarineConditions()

  const articles = await articlesPromise

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

  const [ais, marineConditions] = await Promise.all([aisPromise, marineConditionsPromise])
  const articleSignals = buildArticleSignals(articles)
  const aisSignals = buildAisSignals(ais.vessels, timestamp)
  const marineSignals = marineConditions.map((condition) => ({
    signal_key: stableSignalKey(['marine-conditions', condition.hotspot, condition.observedAt.slice(0, 13)]),
    source: condition.source,
    source_url: condition.sourceUrl,
    title: condition.title,
    summary: condition.summary,
    region: condition.hotspot,
    signal_type: 'weather_constraint' as const,
    severity: condition.severity,
    confidence: condition.confidence,
    observed_at: condition.observedAt,
    metadata: {
      waveHeightM: condition.waveHeightM,
      wavePeriodS: condition.wavePeriodS,
      seaLevelM: condition.seaLevelM,
      seaSurfaceTemperatureC: condition.seaSurfaceTemperatureC,
      oceanCurrentVelocityKmh: condition.oceanCurrentVelocityKmh,
      oceanCurrentDirectionDeg: condition.oceanCurrentDirectionDeg,
      note: 'Modeled marine context only. Not a navigation warning.',
    },
  }))
  const signals = [...articleSignals, ...aisSignals, ...marineSignals]
  const stats = buildStatsFromSignals(articles, signals)

  const deleteOldSignals = await supabaseRequest(`maritime_signals?observed_at=lt.${encodeURIComponent(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())}`, { method: 'DELETE' })
  if (!deleteOldSignals.ok) throw new Error(`Failed to delete old maritime signals: ${deleteOldSignals.status} ${await deleteOldSignals.text()}`)

  const deleteTransientSignals = await supabaseRequest('maritime_signals?signal_type=in.(news_corroboration,ais_anomaly,weather_constraint)', { method: 'DELETE' })
  if (!deleteTransientSignals.ok) throw new Error(`Failed to refresh transient maritime signals: ${deleteTransientSignals.status} ${await deleteTransientSignals.text()}`)

  if (signals.length > 0) {
    const upsertSignals = await supabaseRequest('maritime_signals?on_conflict=signal_key', {
      method: 'POST',
      headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(signals.map((signal) => ({ ...signal, updated_at: timestamp }))),
    })
    if (!upsertSignals.ok) throw new Error(`Failed to upsert maritime signals: ${upsertSignals.status} ${await upsertSignals.text()}`)
  }

  const upsertStats = await supabaseRequest('hotspot_stats?on_conflict=hotspot', {
    method: 'POST',
    headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(stats),
  })
  if (!upsertStats.ok) throw new Error(`Failed to update hotspot stats: ${upsertStats.status} ${await upsertStats.text()}`)

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

    const historyRows = ais.vessels.map((vessel) => ({
      mmsi: vessel.mmsi,
      name: vessel.name,
      lat: vessel.lat,
      lng: vessel.lng,
      speed: vessel.speed,
      heading: vessel.heading,
      ship_type: vessel.ship_type,
      destination: vessel.destination,
      hotspot: vessel.hotspot,
      captured_at: timestamp,
    }))
    const insertHistory = await supabaseRequest('ais_position_history', {
      method: 'POST',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify(historyRows),
    })
    if (!insertHistory.ok) throw new Error(`Failed to insert AIS history: ${insertHistory.status} ${await insertHistory.text()}`)

    const staleHistoryCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const deleteOldHistory = await supabaseRequest(`ais_position_history?captured_at=lt.${encodeURIComponent(staleHistoryCutoff)}`, { method: 'DELETE' })
    if (!deleteOldHistory.ok) throw new Error(`Failed to delete old AIS history: ${deleteOldHistory.status} ${await deleteOldHistory.text()}`)

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

  const dashboardCacheUpdated = await upsertMaritimeDashboardCache(createAdminClient())

  return NextResponse.json({
    success: true,
    timestamp,
    source: 'openclaw-trusted-web',
    articles_fetched: articles.length,
    articles_inserted: articles.length,
    stats_updated: stats.length,
    signals_found: signals.length,
    official_signals: signals.filter((signal) => signal.signal_type === 'official_alert' || signal.signal_type === 'navigation_warning').length,
    ais_signals: signals.filter((signal) => signal.signal_type === 'ais_anomaly').length,
    marine_conditions: marineConditions.length,
    vessels_found: ais.vessels.length,
    vessels_updated: vesselsUpdated,
    dashboard_cache_updated: dashboardCacheUpdated,
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
