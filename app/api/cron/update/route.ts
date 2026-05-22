import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { collectAisStreamVessels } from '@/lib/aisstream'
import { upsertMaritimeDashboardCachePayload, type MaritimeDashboardResponse } from '@/lib/maritime-dashboard-cache'
import { fetchAllMarineConditions } from '@/lib/marine-conditions'
import { ADDITIONAL_TRUSTED_NEWS_FEEDS, MARITIME_SEARCH_FEEDS } from '@/lib/maritime-search-feeds'
import { isTierOneNewsSource } from '@/lib/maritime-source-quality'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

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
  signal_type: 'official_alert' | 'navigation_warning' | 'ais_anomaly' | 'weather_constraint' | 'news_corroboration' | 'source_sweep'
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
  ...ADDITIONAL_TRUSTED_NEWS_FEEDS,
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

const FAST_NEWS_SEARCH_PREFIXES = ['Google News Search:', 'Bing News Search:']
const LIVE_REGIONS = ['hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'] as const

const ROUTE_LABELS: Record<string, { name: string; url: string }> = {
  hormuz: { name: 'Strait of Hormuz', url: 'https://www.vesselsurge.com/topics/strait-of-hormuz-oil-risk' },
  bab: { name: 'Bab el-Mandeb', url: 'https://www.vesselsurge.com/topics/red-sea-shipping-risk' },
  suez: { name: 'Suez Canal', url: 'https://www.vesselsurge.com/topics/suez-canal-traffic-delays' },
  malacca: { name: 'Strait of Malacca', url: 'https://www.vesselsurge.com/topics/malacca-strait-vessel-traffic' },
  panama: { name: 'Panama Canal', url: 'https://www.vesselsurge.com/topics/panama-canal-shipping-risk' },
  taiwan: { name: 'Taiwan Strait', url: 'https://www.vesselsurge.com/topics/taiwan-strait-shipping-risk' },
  turkish: { name: 'Turkish Straits', url: 'https://www.vesselsurge.com/topics/turkish-straits-shipping-risk' },
  gibraltar: { name: 'Strait of Gibraltar', url: 'https://www.vesselsurge.com/topics/strait-of-gibraltar-vessel-traffic' },
  cape: { name: 'Cape of Good Hope', url: 'https://www.vesselsurge.com/topics/cape-of-good-hope-rerouting' },
}

const REGION_KEYWORDS: Record<string, string[]> = {
  hormuz: ['hormuz', 'strait of hormuz', 'persian gulf', 'gulf of oman', 'oman', 'iran', 'uae'],
  bab: ['bab el-mandeb', 'bab el mandeb', 'red sea', 'houthi', 'yemen', 'aden', 'gulf of aden', 'djibouti', 'eritrea'],
  suez: ['suez', 'suez canal', 'egypt', 'port said', 'ismailia', 'sinai'],
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
    'sea robbery',
  ],
  panama: ['panama canal', 'panama canal authority', 'pancanal', 'atlantic-pacific', 'atlantic pacific', 'gatun lake', 'neopanamax', 'miraflores', 'cocoli'],
  taiwan: ['taiwan strait', 'taiwan shipping', 'taiwan trade lane', 'taiwan port', 'kaohsiung', 'keelung', 'taiwan maritime'],
  turkish: ['turkish straits', 'bosporus', 'bosphorus', 'dardanelles', 'black sea', 'istanbul strait', 'canakkale strait', 'turkiye straits'],
  gibraltar: ['strait of gibraltar', 'gibraltar', 'algeciras', 'atlantic-mediterranean', 'atlantic mediterranean', 'mediterranean entry'],
  cape: ['cape of good hope', 'cape route', 'red sea rerouting', 'cape town', 'south africa shipping', 'red sea bypass'],
}

const SEVERITY_KEYWORDS = {
  critical: ['attack', 'seized', 'sunk', 'missile', 'strike', 'closure', 'closed', 'blocked', 'blockade', 'war', 'explosion', 'hijack'],
  high: ['warning', 'advisory', 'incident', 'disrupt', 'divert', 'reroute', 'avoid', 'piracy', 'armed robbery', 'tension'],
  medium: ['delay', 'congestion', 'monitor', 'caution', 'security', 'risk', 'alert', 'threat'],
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
  'msn',
  'forex',
  'fxstreet',
  'ad hoc news',
  'aol.com',
  'barron',
  'discovery alert',
  'etv bharat',
  'yahoo finance',
  'wlns',
  'latteluxury',
  'nomad lawyer',
  'greek city times',
  'korea herald',
  'chosun',
  '조선일보',
  '아시아경제',
  'ndtv profit',
  'nation thailand',
  'cgtn',
  'okdiario',
  'thestreet',
  'binance',
  'financialexpress',
  'financial express',
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
  if (/\bthreat\b/i.test(lower) && /\b(attack|missile|strike|seized|hijack|naval|security|houthi|war[-\s]?risk|shipping|vessel|tanker|maritime)\b/i.test(lower)) return 'high'
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
    'panama canal',
    'taiwan strait',
    'turkish straits',
    'bosporus',
    'bosphorus',
    'dardanelles',
    'gibraltar',
    'cape of good hope',
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
  const hasVesselOrRoute = /\b(ship|shipping|vessel|tanker|maritime|ais|cargo|freight|transit|route|reroute|re-rout|divert|port|canal|convoy|queue|draft|water constraint|delay|congestion|piracy|armed robbery|voyage|fuel|bunker)\b/i.test(text)
  const hasSecurityIncident = /\b(attack|missile|strike|seized|hijack|warning|advisory|incident|threat|houthi|naval|navy|war risk|insurance)\b/i.test(text)
  const hasNamedExpansionRoute = /\b(panama canal|taiwan strait|turkish straits|bosporus|bosphorus|dardanelles|strait of gibraltar|cape of good hope|red sea rerouting|cape route)\b/i.test(text)
  const hasEnergyRoute = article.region === 'hormuz' && hasRegionEnergySignal(article)

  return hasEnergyRoute || hasVesselOrRoute || hasSecurityIncident || hasNamedExpansionRoute
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
  const titleHasOperationalSignal = /\b(ship|shipping|vessel|tanker|maritime|cargo|freight|transit|route|reroute|divert|port|canal|convoy|queue|delay|congestion|piracy|armed robbery|hormuz|suez|malacca|red sea|bab el|panama canal|taiwan strait|bosporus|bosphorus|dardanelles|gibraltar|cape of good hope)\b/i.test(title)
  if (financialNoise && !titleHasOperationalSignal) return true
  return financialNoise && !hasOperationalChokepointSignal(article)
}

function isGlobalSupplyChainNoise(article: TrustedArticle) {
  const text = `${article.title} ${article.snippet}`.toLowerCase()
  const broadIndustryStory = /\b(global supply|covid|pandemic|container manufacturer|container manufacturers|antitrust|price fixing|conspiracy|shipyard order|offshore wind|ctv)\b/i.test(text)
  if (!broadIndustryStory) return false

  return !/\b(strait of malacca|malacca strait|singapore strait|port of singapore|suez canal|bab el-mandeb|red sea|strait of hormuz|gulf of aden|gulf of oman|panama canal|taiwan strait|turkish straits|bosporus|bosphorus|dardanelles|strait of gibraltar|cape of good hope)\b/i.test(text)
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
    return hasReroutePressure && /\b(malacca|singapore strait|port of singapore|singapore port|singapore shipping|nicobar|land bridge|recaap|piracy)\b/i.test(text)
  }

  if (article.region === 'panama') {
    return /\b(ship|shipping|vessel|tanker|cargo|container|transit|queue|draft|water|drought|delay|maintenance|reservation|slot|locks?)\b/i.test(text)
      && /\b(panama canal|panama canal authority|pancanal|gatun lake|neopanamax|miraflores|cocoli)\b/i.test(text)
  }

  if (article.region === 'taiwan') {
    return /\b(ship|shipping|vessel|cargo|container|maritime|port|naval|exercise|warning|alert|trade lane|route|disruption)\b/i.test(text)
      && /\b(taiwan strait|taiwan shipping|taiwan trade lane|kaohsiung|keelung|taiwan maritime)\b/i.test(text)
  }

  if (article.region === 'turkish') {
    return /\b(ship|shipping|vessel|tanker|transit|traffic|closure|delay|weather|black sea|grain|oil|cargo)\b/i.test(text)
      && /\b(turkish straits|bosporus|bosphorus|dardanelles|istanbul strait|canakkale strait|black sea)\b/i.test(text)
  }

  if (article.region === 'gibraltar') {
    return /\b(ship|shipping|vessel|tanker|cargo|traffic|port|bunker|congestion|incident|security|flow)\b/i.test(text)
      && /\b(strait of gibraltar|gibraltar|algeciras|atlantic-mediterranean|atlantic mediterranean)\b/i.test(text)
  }

  if (article.region === 'cape') {
    return /\b(ship|shipping|vessel|container|tanker|freight|rerout|re-rout|divert|delay|voyage|fuel|bunker|sailing|route)\b/i.test(text)
      && /\b(cape of good hope|cape route|red sea rerouting|red sea bypass|south africa shipping)\b/i.test(text)
  }

  return false
}

function hasRegionOrRouteSignal(article: TrustedArticle) {
  if (['panama', 'taiwan', 'turkish', 'gibraltar', 'cape'].includes(article.region)) {
    return hasRouteSpilloverSignal(article)
  }

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

async function fetchText(url: string, timeoutMs = 7000) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'VesselSurge OpenClaw/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

function parseRss(xml: string, feed: TrustedFeed): TrustedArticle[] {
  const tierOneSweep = feed.source.includes('Tier-1')
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
    .filter((article) => !tierOneSweep || isTierOneNewsSource(`${article.source} ${article.url}`))
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

  for (const hotspot of LIVE_REGIONS) {
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

async function collectTrustedArticles(now = new Date(), options: { fast?: boolean } = {}) {
  const feeds = options.fast
    ? TRUSTED_FEEDS.filter((feed) => FAST_NEWS_SEARCH_PREFIXES.some((prefix) => feed.source.startsWith(prefix)))
    : TRUSTED_FEEDS
  const pages = options.fast ? [] : TRUSTED_PAGES
  const fetchTimeoutMs = options.fast ? 1800 : 7000

  const sourceResults = await Promise.all([
    ...feeds.map(async (feed) => {
      try {
        return parseRss(await fetchText(feed.url, fetchTimeoutMs), feed)
      } catch (error) {
        console.warn('[trusted-update] feed failed', feed.source, error)
        return []
      }
    }),
    ...pages.map(async (page) => {
      try {
        return parseTrustedPage(await fetchText(page.url, fetchTimeoutMs), page.source, page.url, page.credibility, page.region)
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
    .filter((article) => !isGlobalSupplyChainNoise(article))
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
    .filter((article) => !isGlobalSupplyChainNoise(article))
    .filter((article) => !isMisassignedDominantRegionArticle(article))
    .filter((article) => hasRegionOrRouteSignal(article))
    .filter((article) => !isWebSearchArticle(article) || hasOperationalChokepointSignal(article))
    .filter((article) => !isNoisyGoogleNewsArticle(article))
    .filter((article) => isCurrentYear(article))
    .filter((article) => isWithinLatestDays(article, now, 7))
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))

  const fallback = LIVE_REGIONS.flatMap((region) => {
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
  return LIVE_REGIONS.map((hotspot) => {
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

function isWithinHours(value: string | null | undefined, now: Date, hours: number) {
  if (!value) return false
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return false
  const ageMs = now.getTime() - timestamp
  return ageMs >= 0 && ageMs <= hours * 60 * 60 * 1000
}

function buildSourceSweepSignals(articles: TrustedArticle[], currentSignals: MaritimeSignal[], observedAt: string): MaritimeSignal[] {
  const sweepTime = new Date(observedAt)
  return LIVE_REGIONS
    .filter((region) => {
      const hasFreshArticle = articles.some((article) => article.region === region && isWithinLatest24Hours(article, sweepTime))
      const hasFreshActionableSignal = currentSignals.some((signal) =>
        signal.region === region &&
        signal.signal_type !== 'source_sweep' &&
        isWithinHours(signal.observed_at, sweepTime, 24),
      )
      return !hasFreshArticle && !hasFreshActionableSignal
    })
    .map((region) => {
      const route = ROUTE_LABELS[region]
      return {
        signal_key: stableSignalKey(['source-sweep', region, observedAt.slice(0, 13)]),
        source: 'VesselSurge Source Sweep',
        source_url: route.url,
        title: `${route.name}: no fresh source-backed disruption found`,
        summary: `The latest VesselSurge sweep found no current source-backed disruption for ${route.name}. The route remains live and will update when trusted sources match.`,
        region,
        signal_type: 'source_sweep' as const,
        severity: 'low' as const,
        confidence: 68,
        observed_at: observedAt,
        metadata: {
          derivedFrom: 'vesselsurge-source-sweep',
          policy: 'No invented incidents: source sweep signals are used only when trusted current news and actionable route signals are absent.',
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function withOperationTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function buildStatsFromSignals(articles: TrustedArticle[], signals: MaritimeSignal[]) {
  const base = buildStats(articles)
  return base.map((row) => {
    const hotspotSignals = signals.filter((signal) => signal.region === row.hotspot)
    const actionableSignals = hotspotSignals.filter((signal) => signal.signal_type !== 'source_sweep')
    const operationalSignals = actionableSignals.filter((signal) => signal.signal_type !== 'news_corroboration')
    const strongestSignal = operationalSignals.reduce((max, signal) => Math.max(max, riskScore(signal.severity)), 0)
    const officialSignalCount = hotspotSignals.filter((signal) => signal.signal_type === 'official_alert' || signal.signal_type === 'navigation_warning').length
    const aisSignalCount = hotspotSignals.filter((signal) => signal.signal_type === 'ais_anomaly').length
    const confidenceBoost = officialSignalCount ? 1 : aisSignalCount && row.risk_level === 'low' ? 1 : 0
    const baseRiskScore = hotspotSignals.some((signal) => signal.signal_type === 'source_sweep') && actionableSignals.length === 0
      ? riskScore('low')
      : riskScore(row.risk_level)
    const risk_level = riskFromScore(Math.max(baseRiskScore, strongestSignal, confidenceBoost))

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
    signal: init.signal || AbortSignal.timeout(8000),
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

async function postRowsInBatches<T>({
  path,
  rows,
  batchSize,
  timeoutMs,
  describe,
}: {
  path: string
  rows: T[]
  batchSize: number
  timeoutMs: number
  describe: string
}) {
  let written = 0
  const warnings: string[] = []

  async function postBatch(batch: T[], batchLabel: string, retryTimeoutMs = timeoutMs) {
    const response = await supabaseRequest(path, {
      method: 'POST',
      headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
      signal: AbortSignal.timeout(retryTimeoutMs),
      body: JSON.stringify(batch),
    })

    if (response.ok) return null

    const body = await response.text().catch(() => '')
    return `${batchLabel} skipped: ${response.status}${body ? ` ${body.slice(0, 220)}` : ''}`
  }

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize)
    const batchNumber = Math.floor(index / batchSize) + 1

    try {
      const batchWarning = await postBatch(batch, `${describe} batch ${batchNumber}`)
      if (!batchWarning) {
        written += batch.length
      } else {
        warnings.push(batchWarning)
        console.warn('[trusted-update]', batchWarning)

        if (batch.length <= 1) continue

        for (const [rowIndex, row] of batch.entries()) {
          try {
            const rowWarning = await postBatch([row], `${describe} row ${index + rowIndex + 1}`, Math.max(timeoutMs, 6500))
            if (!rowWarning) {
              written += 1
            } else {
              warnings.push(rowWarning)
              console.warn('[trusted-update]', rowWarning)
            }
          } catch (error) {
            const warning = `${describe} row ${index + rowIndex + 1} skipped: ${errorMessage(error)}`
            warnings.push(warning)
            console.warn('[trusted-update]', warning)
          }
        }
      }
    } catch (error) {
      const warning = `${describe} batch ${batchNumber} skipped: ${errorMessage(error)}`
      warnings.push(warning)
      console.warn('[trusted-update]', warning)
    }
  }

  return { written, warnings }
}

async function upsertLiveSurfaceDashboardCache(request: Request) {
  const response = await fetch(new URL(`/api/maritime-data?cache_refresh=${Date.now()}`, request.url), {
    headers: {
      accept: 'application/json',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
    signal: AbortSignal.timeout(7000),
  })

  if (!response.ok) {
    throw new Error(`live surface cache source returned ${response.status}`)
  }

  const payload = await response.json() as MaritimeDashboardResponse
  if (!payload?.success || !payload.data?.timestamp) {
    throw new Error('live surface cache source returned an invalid payload')
  }

  return upsertMaritimeDashboardCachePayload(createAdminClient(), payload)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') || 'all'
  const newsOnly = scope === 'news'

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const timestamp = now.toISOString()
  const articlesPromise = collectTrustedArticles(now, { fast: newsOnly }).then((rows) => rows.map((article) => ({
    ...article,
    created_at: timestamp,
    updated_at: timestamp,
  })))

  const articles = await articlesPromise

  if (newsOnly) {
    let articlesInserted = 0
    let fastWriteWarning: string | null = null
    if (articles.length > 0) {
      try {
        const insertNews = await supabaseRequest('news_articles?on_conflict=url', {
          method: 'POST',
          headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
          signal: AbortSignal.timeout(3500),
          body: JSON.stringify(articles),
        })
        if (insertNews.ok) {
          articlesInserted = articles.length
        } else {
          fastWriteWarning = `fast news insert skipped: ${insertNews.status}`
          console.warn('[trusted-update]', fastWriteWarning, await insertNews.text())
        }
      } catch (error) {
        fastWriteWarning = 'fast news insert timed out'
        console.warn('[trusted-update] fast news insert timed out:', error)
      }
    }

    const articleSignals = buildArticleSignals(articles)
    const sourceSweepSignals = buildSourceSweepSignals(articles, articleSignals, timestamp)
    let signalsWritten = 0

    if (articleSignals.length > 0 || sourceSweepSignals.length > 0) {
      try {
        const upsertArticleSignals = await supabaseRequest('maritime_signals?on_conflict=signal_key', {
          method: 'POST',
          headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
          signal: AbortSignal.timeout(3500),
          body: JSON.stringify([...articleSignals, ...sourceSweepSignals].map((signal) => ({ ...signal, updated_at: timestamp }))),
        })
        if (upsertArticleSignals.ok) {
          signalsWritten = articleSignals.length + sourceSweepSignals.length
        } else {
          fastWriteWarning ||= `fast news signal upsert skipped: ${upsertArticleSignals.status}`
          console.warn('[trusted-update] fast news signal upsert skipped:', upsertArticleSignals.status, await upsertArticleSignals.text())
        }
      } catch (error) {
        fastWriteWarning ||= 'fast news signal upsert timed out'
        console.warn('[trusted-update] fast news signal upsert timed out:', error)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp,
      scope: 'news',
      source: 'openclaw-trusted-web',
      articles_fetched: articles.length,
      articles_inserted: articlesInserted,
      signals_found: articleSignals.length + sourceSweepSignals.length,
      signals_written: signalsWritten,
      verified: articles.length,
      dashboard_cache_updated: false,
      warning: fastWriteWarning,
      window: {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: timestamp,
        policy: 'Latest 24h source-published articles are prioritized; up to 7d fallback is allowed per hotspot when needed to prevent empty route coverage.',
      },
      sources: [...new Set(articles.map((article) => article.source))],
      note: 'Fast news-only update. AIS, weather, vessel tables, destructive news clearing and dashboard cache rebuilds are left untouched so news freshness cannot be blocked by heavier data jobs.',
    })
  }

  let stage = 'pruning stale news'
  let maintenanceWarning: string | null = null
  let articlesWritten = 0
  let signalsWritten = 0
  let statsWritten = 0

  try {
    const staleNewsCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    try {
      const deleteNews = await supabaseRequest(`news_articles?published_at=lt.${encodeURIComponent(staleNewsCutoff)}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(2500),
      })
      if (!deleteNews.ok) {
        maintenanceWarning = `stale news prune skipped: ${deleteNews.status}`
        console.warn('[trusted-update]', maintenanceWarning, await deleteNews.text())
      }
    } catch (error) {
      maintenanceWarning = `stale news prune skipped: ${errorMessage(error)}`
      console.warn('[trusted-update] stale news prune skipped:', error)
    }

    if (articles.length > 0) {
      stage = 'upserting trusted news'
      try {
        const insertNews = await supabaseRequest('news_articles?on_conflict=url', {
          method: 'POST',
          headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
          signal: AbortSignal.timeout(3500),
          body: JSON.stringify(articles),
        })
        if (insertNews.ok) {
          articlesWritten = articles.length
        } else {
          maintenanceWarning ||= `trusted news upsert skipped: ${insertNews.status}`
          console.warn('[trusted-update] trusted news upsert skipped:', insertNews.status, await insertNews.text())
        }
      } catch (error) {
        maintenanceWarning ||= `trusted news upsert skipped: ${errorMessage(error)}`
        console.warn('[trusted-update] trusted news upsert skipped:', error)
      }
    }

    stage = 'collecting AIS and marine conditions'
    const aisPromise = collectAisStreamVessels({ timeoutMs: 10000, maxVessels: 80 })
    const marineConditionsPromise = fetchAllMarineConditions()
    const [ais, marineConditions] = await Promise.all([aisPromise, marineConditionsPromise])
    const articleSignals = buildArticleSignals(articles)
    const sourceSweepSignals = buildSourceSweepSignals(articles, articleSignals, timestamp)
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
    const signals = [...articleSignals, ...sourceSweepSignals, ...aisSignals, ...marineSignals]
    const stats = buildStatsFromSignals(articles, signals)

    stage = 'deleting old maritime signals'
    try {
      const deleteOldSignals = await supabaseRequest(`maritime_signals?observed_at=lt.${encodeURIComponent(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(2500),
      })
      if (!deleteOldSignals.ok) {
        maintenanceWarning ||= `old signal prune skipped: ${deleteOldSignals.status}`
        console.warn('[trusted-update] old signal prune skipped:', deleteOldSignals.status, await deleteOldSignals.text())
      }
    } catch (error) {
      maintenanceWarning ||= `old signal prune skipped: ${errorMessage(error)}`
      console.warn('[trusted-update] old signal prune skipped:', error)
    }

    stage = 'refreshing transient maritime signals'
    try {
      const deleteTransientSignals = await supabaseRequest('maritime_signals?signal_type=in.(news_corroboration,source_sweep,ais_anomaly,weather_constraint)', {
        method: 'DELETE',
        signal: AbortSignal.timeout(2500),
      })
      if (!deleteTransientSignals.ok) {
        maintenanceWarning ||= `transient signal refresh skipped: ${deleteTransientSignals.status}`
        console.warn(
          '[trusted-update] transient signal refresh skipped:',
          deleteTransientSignals.status,
          await deleteTransientSignals.text(),
        )
      }
    } catch (error) {
      maintenanceWarning ||= `transient signal refresh skipped: ${errorMessage(error)}`
      console.warn('[trusted-update] transient signal refresh skipped:', error)
    }

    if (signals.length > 0) {
      stage = 'upserting maritime signals'
      const signalWrite = await postRowsInBatches({
        path: 'maritime_signals?on_conflict=signal_key',
        rows: signals.map((signal) => ({ ...signal, updated_at: timestamp })),
        batchSize: 12,
        timeoutMs: 1800,
        describe: 'maritime signal upsert',
      })
      if (signalWrite.warnings.length > 0) {
        maintenanceWarning ||= signalWrite.warnings[0]
      }
      signalsWritten = signalWrite.written
      if (signalWrite.written === 0) {
        maintenanceWarning ||= `maritime signal upsert wrote 0 rows across ${signalWrite.warnings.length || 1} batch attempt(s); continuing with last known signal layer`
        console.warn('[trusted-update]', maintenanceWarning)
      }
    }

    stage = 'upserting hotspot stats'
    try {
      const upsertStats = await supabaseRequest('hotspot_stats?on_conflict=hotspot', {
        method: 'POST',
        headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
        signal: AbortSignal.timeout(2500),
        body: JSON.stringify(stats),
      })
      if (upsertStats.ok) {
        statsWritten = stats.length
      } else {
        const body = await upsertStats.text().catch(() => '')
        maintenanceWarning ||= `hotspot stats upsert skipped: ${upsertStats.status}${body ? ` ${body.slice(0, 220)}` : ''}`
        console.warn('[trusted-update]', maintenanceWarning)
      }
    } catch (error) {
      maintenanceWarning ||= `hotspot stats upsert skipped: ${errorMessage(error)}`
      console.warn('[trusted-update]', maintenanceWarning)
    }

    let vesselsUpdated = 0
    if (ais.vessels.length > 0) {
      try {
        stage = 'deleting stale vessels'
        const staleCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        const deleteStaleVessels = await supabaseRequest(`vessels?updated_at=lt.${encodeURIComponent(staleCutoff)}`, {
          method: 'DELETE',
          signal: AbortSignal.timeout(1800),
        })
        if (!deleteStaleVessels.ok) {
          maintenanceWarning ||= `stale AIS vessel prune skipped: ${deleteStaleVessels.status}`
          console.warn('[trusted-update]', maintenanceWarning, await deleteStaleVessels.text())
        }

        stage = 'upserting vessels'
        const upsertVessels = await supabaseRequest('vessels?on_conflict=mmsi', {
          method: 'POST',
          headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
          signal: AbortSignal.timeout(2800),
          body: JSON.stringify(ais.vessels),
        })
        if (!upsertVessels.ok) {
          maintenanceWarning ||= `AIS vessel upsert skipped: ${upsertVessels.status}`
          console.warn('[trusted-update]', maintenanceWarning, await upsertVessels.text())
        } else {
          vesselsUpdated = ais.vessels.length
        }

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
        stage = 'inserting AIS history'
        const insertHistory = await supabaseRequest('ais_position_history', {
          method: 'POST',
          headers: { prefer: 'return=minimal' },
          signal: AbortSignal.timeout(2500),
          body: JSON.stringify(historyRows),
        })
        if (!insertHistory.ok) {
          maintenanceWarning ||= `AIS history insert skipped: ${insertHistory.status}`
          console.warn('[trusted-update]', maintenanceWarning, await insertHistory.text())
        }

        stage = 'deleting old AIS history'
        const staleHistoryCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        const deleteOldHistory = await supabaseRequest(`ais_position_history?captured_at=lt.${encodeURIComponent(staleHistoryCutoff)}`, {
          method: 'DELETE',
          signal: AbortSignal.timeout(1800),
        })
        if (!deleteOldHistory.ok) {
          maintenanceWarning ||= `old AIS history prune skipped: ${deleteOldHistory.status}`
          console.warn('[trusted-update]', maintenanceWarning, await deleteOldHistory.text())
        }

        const vesselCounts = ais.vessels.reduce<Record<string, number>>((acc, vessel) => {
          acc[vessel.hotspot] = (acc[vessel.hotspot] || 0) + 1
          return acc
        }, {})

        const statsWithAis = stats.map((row) => ({
          ...row,
          active_vessels: vesselCounts[row.hotspot] || 0,
        }))
        stage = 'upserting AIS stats'
        const upsertAisStats = await supabaseRequest('hotspot_stats?on_conflict=hotspot', {
          method: 'POST',
          headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
          signal: AbortSignal.timeout(2500),
          body: JSON.stringify(statsWithAis),
        })
        if (!upsertAisStats.ok) {
          maintenanceWarning ||= `AIS stats upsert skipped: ${upsertAisStats.status}`
          console.warn('[trusted-update]', maintenanceWarning, await upsertAisStats.text())
        }
      } catch (error) {
        maintenanceWarning ||= `AIS vessel persistence skipped: ${errorMessage(error)}`
        console.warn('[trusted-update]', maintenanceWarning)
      }
    }

    stage = 'upserting dashboard cache'
    let dashboardCacheUpdated = false
    try {
      dashboardCacheUpdated = await withOperationTimeout(
        upsertLiveSurfaceDashboardCache(request),
        10000,
        'dashboard cache upsert',
      )
    } catch (error) {
      maintenanceWarning ||= `dashboard cache upsert skipped: ${errorMessage(error)}`
      console.warn('[trusted-update]', maintenanceWarning)
    }

    return NextResponse.json({
      success: true,
      timestamp,
      source: 'openclaw-trusted-web',
      articles_fetched: articles.length,
      articles_inserted: articlesWritten,
      stats_updated: stats.length,
      stats_written: statsWritten,
      signals_found: signals.length,
      signals_written: signalsWritten,
      official_signals: signals.filter((signal) => signal.signal_type === 'official_alert' || signal.signal_type === 'navigation_warning').length,
      ais_signals: signals.filter((signal) => signal.signal_type === 'ais_anomaly').length,
      marine_conditions: marineConditions.length,
      vessels_found: ais.vessels.length,
      vessels_updated: vesselsUpdated,
      dashboard_cache_updated: dashboardCacheUpdated,
      ais_status: ais.reason,
      verified: articles.length,
      warning: maintenanceWarning,
      window: {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: timestamp,
        policy: 'Latest 24h source-published articles are prioritized; up to 7d fallback is allowed per hotspot when needed to prevent empty route coverage.',
      },
      sources: [...new Set(articles.map((article) => article.source))],
      note: 'Old broad NewsData/RSS feed disabled. Only trusted allowlisted sources from the latest 24 hours are written.',
    })
  } catch (error) {
    const message = errorMessage(error)
    console.error('[trusted-update] full update failed:', { stage, message })
    return NextResponse.json(
      {
        success: false,
        timestamp,
        scope: 'all',
        stage,
        error: message,
        articles_fetched: articles.length,
        source: 'openclaw-trusted-web',
        nextAction: 'Fix the reported full-update stage, then rerun `npm run maritime:update:full`.',
      },
      { status: 500 },
    )
  }
}
