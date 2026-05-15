import { NextResponse } from 'next/server'

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

const TRUSTED_FEEDS = [
  { source: 'USNI News', url: 'https://news.usni.org/feed', credibility: 9 },
  { source: 'gCaptain', url: 'https://gcaptain.com/feed/', credibility: 8 },
  { source: 'Hellenic Shipping News', url: 'https://www.hellenicshippingnews.com/feed/', credibility: 8 },
]

const TRUSTED_PAGES = [
  { source: 'ReCAAP ISC Alerts', url: 'https://www.recaap.org/alerts', credibility: 10, region: 'malacca' },
  { source: 'ReCAAP ISC Reports', url: 'https://www.recaap.org/reports', credibility: 10, region: 'malacca' },
  { source: 'Norwegian Maritime Authority', url: 'https://www.sdir.no/en/accidents-and-safety/maritim-sikring/security-level-for-norwegian-vessels/gulf-of-aden-bab-el-mandeb-red-sea/', credibility: 9, region: 'bab' },
  { source: 'MARAD Maritime Security Advisory', url: 'https://www.maritime.dot.gov/msci/2025-001-southern-red-sea-bab-el-mandeb-strait-and-gulf-aden-houthi-attacks-commercial-vessels', credibility: 9, region: 'bab' },
  { source: 'Suez Canal Authority', url: 'https://www.suezcanal.gov.eg/English/MediaCenter/News/Pages/default.aspx', credibility: 10, region: 'suez' },
]

const REGION_KEYWORDS: Record<string, string[]> = {
  hormuz: ['hormuz', 'strait of hormuz', 'persian gulf', 'gulf of oman', 'oman', 'iran', 'uae'],
  bab: ['bab el-mandeb', 'bab el mandeb', 'red sea', 'houthi', 'yemen', 'aden'],
  suez: ['suez', 'suez canal', 'egypt'],
  malacca: ['malacca', 'singapore strait', 'singapore', 'recaap', 'piracy', 'armed robbery'],
}

const SEVERITY_KEYWORDS = {
  critical: ['attack', 'seized', 'sunk', 'missile', 'strike', 'closure', 'closed', 'blocked', 'blockade', 'war', 'explosion', 'hijack'],
  high: ['warning', 'advisory', 'threat', 'incident', 'disrupt', 'divert', 'reroute', 'avoid', 'piracy', 'armed robbery', 'tension'],
  medium: ['delay', 'congestion', 'monitor', 'caution', 'security', 'risk', 'alert'],
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
  ].some((keyword) => lower.includes(keyword))
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
    },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

function parseRss(xml: string, source: string, credibility: number): TrustedArticle[] {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0])
  return items
    .map((item) => {
      const title = decodeHtml(between(item, '<title>', '</title>'))
      const snippet = decodeHtml(between(item, '<description>', '</description>') || title)
      const url = decodeHtml(between(item, '<link>', '</link>'))
      const published_at = decodeHtml(between(item, '<pubDate>', '</pubDate>')) || new Date().toISOString()
      const text = `${title} ${snippet}`
      const region = classifyRegion(text)

      return {
        title,
        snippet: snippet.slice(0, 600),
        url,
        source,
        region,
        topic: region,
        is_active: true,
        verified: true,
        credibility,
        published_at: new Date(published_at).toISOString(),
      }
    })
    .filter((article) => article.title && article.url && isRelevant(`${article.title} ${article.snippet}`))
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
      if (isRecaapPage && !/(2026|2025)/i.test(linkText)) return false
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
    const risk = classifyRisk(text)
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
      published_at: new Date().toISOString(),
    }
  })
}

async function collectTrustedArticles() {
  const articles: TrustedArticle[] = []

  for (const feed of TRUSTED_FEEDS) {
    try {
      articles.push(...parseRss(await fetchText(feed.url), feed.source, feed.credibility))
    } catch (error) {
      console.warn('[trusted-update] feed failed', feed.source, error)
    }
  }

  for (const page of TRUSTED_PAGES) {
    try {
      articles.push(...parseTrustedPage(await fetchText(page.url), page.source, page.url, page.credibility, page.region))
    } catch (error) {
      console.warn('[trusted-update] page failed', page.source, error)
    }
  }

  const seen = new Set<string>()
  return articles
    .filter((article) => !seen.has(article.url) && seen.add(article.url))
    .filter((article) => article.region !== 'global')
    .filter((article) => hasDirectRegionSignal(article))
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
    .slice(0, 40)
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

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const timestamp = new Date().toISOString()
  const articles = (await collectTrustedArticles()).map((article) => ({
    ...article,
    created_at: timestamp,
    updated_at: timestamp,
  }))

  if (articles.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No trusted maritime source articles collected', timestamp },
      { status: 502 },
    )
  }

  const deleteNews = await supabaseRequest('news_articles?created_at=gte.2000-01-01', { method: 'DELETE' })
  if (!deleteNews.ok) throw new Error(`Failed to clear old news: ${deleteNews.status}`)

  const insertNews = await supabaseRequest('news_articles', {
    method: 'POST',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify(articles),
  })
  if (!insertNews.ok) throw new Error(`Failed to insert trusted news: ${insertNews.status} ${await insertNews.text()}`)

  const stats = buildStats(articles)
  const upsertStats = await supabaseRequest('hotspot_stats?on_conflict=hotspot', {
    method: 'POST',
    headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(stats),
  })
  if (!upsertStats.ok) throw new Error(`Failed to update hotspot stats: ${upsertStats.status} ${await upsertStats.text()}`)

  return NextResponse.json({
    success: true,
    timestamp,
    source: 'openclaw-trusted-web',
    articles_fetched: articles.length,
    articles_inserted: articles.length,
    stats_updated: stats.length,
    verified: articles.length,
    sources: [...new Set(articles.map((article) => article.source))],
    note: 'Old broad NewsData/RSS feed disabled. Only trusted allowlisted maritime sources are written.',
  })
}
