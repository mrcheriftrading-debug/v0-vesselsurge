import { createHash } from 'crypto'
import {
  buildMaritimeDashboardPayload,
  getFreshMaritimeDashboardCache,
  getLastMaritimeDashboardCache,
  reviewArticleForLiveMap,
  type MaritimeDashboardResponse,
} from '@/lib/maritime-dashboard-cache'
import { buildOfflineMaritimeDashboardSnapshot } from '@/lib/maritime-offline-snapshot'
import {
  maritimeArticleIntelligenceScore,
  maritimeFreshnessScore,
  maritimeSourceQualityLabel,
  maritimeSourceQualityScore,
  maritimeSourceQualityTier,
} from '@/lib/maritime-source-quality'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

const RESPONSE_HEADERS = {
  'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120',
  'X-Content-Type-Options': 'nosniff',
}

function buildValidatedJsonResponse(payload: unknown, request: Request) {
  const body = JSON.stringify(payload)
  const etag = `"${createHash('sha1').update(body).digest('base64url')}"`
  const ifNoneMatch = request.headers.get('if-none-match')
  const generatedAt = payload && typeof payload === 'object' && 'meta' in payload
    ? (payload as { meta?: { generatedAt?: string } }).meta?.generatedAt
    : null

  const headers = {
    ...RESPONSE_HEADERS,
    ETag: etag,
    ...(generatedAt ? { 'Last-Modified': new Date(generatedAt).toUTCString() } : {}),
  }

  if (ifNoneMatch?.split(',').map((tag) => tag.trim()).includes(etag)) {
    return new Response(null, { status: 304, headers })
  }

  return new Response(body, {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
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

type DirectLiveNewsArticle = {
  id?: string
  title?: string
  summary?: string
  source?: string
  sourceUrl?: string | null
  topic?: string
  region?: string
  timestamp?: string
}

const HOTSPOT_MARKET_VOLUME: Record<string, number> = {
  hormuz: 21000000,
  bab: 280000000,
  suez: 150000000,
  malacca: 500000000,
}

const HOTSPOTS = ['hormuz', 'bab', 'suez', 'malacca']

function directRiskLevel(articles: MaritimeDashboardResponse['data']['articles']) {
  const highSignalCount = articles.filter((article) =>
    /\b(attack|missile|strike|seized|hijack|warning|advisory|incident|threat|war[-\s]?risk|rerout|divert|disruption|closure|blocked)\b/i
      .test(`${article.title} ${article.summary}`),
  ).length

  if (highSignalCount >= 3) return 'high'
  if (highSignalCount > 0 || articles.length > 0) return 'medium'
  return 'low'
}

function qualityStatus(score: number) {
  if (score >= 85) return 'strong' as const
  if (score >= 68) return 'good' as const
  return 'watch' as const
}

function buildDirectMaritimePayload(articles: DirectLiveNewsArticle[]): MaritimeDashboardResponse | null {
  const timestamp = new Date().toISOString()
  const reviewCandidates = articles
    .filter((article) => article.title && article.region && HOTSPOTS.includes(article.region))
    .map((article, index) => {
      const articleTimestamp = article.timestamp || timestamp
      const source = article.source || 'VesselSurge direct source sweep'
      const summary = article.summary || ''

      return {
        id: article.id || `direct-live-${index}`,
        title: article.title || 'VesselSurge live maritime signal',
        summary,
        source,
        sourceUrl: article.sourceUrl || '',
        category: article.topic || 'live_maritime_news',
        region: article.region || 'global',
        timestamp: articleTimestamp,
        isBreaking: false,
        sourceQualityLabel: maritimeSourceQualityLabel(source),
        sourceQualityScore: maritimeSourceQualityScore(source),
        sourceQualityTier: maritimeSourceQualityTier(source),
        freshnessScore: maritimeFreshnessScore(articleTimestamp),
        intelligenceScore: maritimeArticleIntelligenceScore({
          source,
          timestamp: articleTimestamp,
          title: article.title,
          summary,
          region: article.region,
        }),
      }
    })
    .map((article) => ({
      ...article,
      ...reviewArticleForLiveMap(article),
    }))
  const reviewGate = reviewCandidates.reduce(
    (acc, article) => {
      if (article.reviewStatus === 'approved') acc.approved += 1
      else if (article.reviewStatus === 'watch') acc.watch += 1
      else if (article.reviewStatus === 'blocked') acc.blocked += 1
      return acc
    },
    { approved: 0, watch: 0, blocked: 0, visible: 0 },
  )
  reviewGate.visible = reviewGate.approved + reviewGate.watch
  const normalizedArticles = reviewCandidates.filter((article) => article.reviewStatus !== 'blocked')

  if (normalizedArticles.length === 0) return null

  const signals = normalizedArticles.map((article) => ({
    signalKey: `direct-live-${createHash('sha1').update(article.sourceUrl || `${article.source}:${article.title}`).digest('base64url').slice(0, 22)}`,
    source: article.source,
    sourceUrl: article.sourceUrl,
    title: article.title,
    summary: article.summary,
    region: article.region,
    signalType: 'news_corroboration',
    severity: directRiskLevel([article]),
    confidence: Math.max(45, Math.min(82, Math.round((article.sourceQualityScore || 55) * 0.65 + (article.freshnessScore || 0) * 0.35))),
    observedAt: article.timestamp,
  }))

  const hotspots = HOTSPOTS.map((hotspot) => {
    const hotspotArticles = normalizedArticles
      .filter((article) => article.region === hotspot)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    const hotspotSignals = signals.filter((signal) => signal.region === hotspot)
    const sourceCount = new Set(hotspotArticles.map((article) => article.source)).size
    const riskLevel = directRiskLevel(hotspotArticles)
    const confidenceScore = hotspotArticles.length
      ? Math.min(88, 40 + Math.min(20, sourceCount * 6) + Math.min(24, hotspotArticles.length * 4))
      : 35
    const latestSource = hotspotArticles[0]?.source || 'OpenClaw standing watch'
    const riskDrivers = hotspotArticles.slice(0, 3).map((article) => `${article.source}: ${article.title}`)

    return {
      id: `direct-live-${hotspot}`,
      hotspot,
      activeVessels: 0,
      dailyTransits: 0,
      avgWaitTime: hotspotSignals.length ? `${hotspotSignals.length} live source signals` : 'Standing watch active',
      marketVolume: HOTSPOT_MARKET_VOLUME[hotspot] || 0,
      riskLevel,
      updatedAt: timestamp,
      verifiedReports: hotspotArticles.length,
      sourceCount,
      latestSource,
      signalCount: hotspotSignals.length,
      officialSignalCount: 0,
      aisSignalCount: 0,
      confidenceScore,
      confidenceLabel: confidenceScore >= 70 ? 'Corroborated' : hotspotArticles.length ? 'Watchlist' : 'Thin signal',
      riskSummary: hotspotArticles.length
        ? `${riskLevel.toUpperCase()} from ${hotspotArticles.length} live source-linked report${hotspotArticles.length === 1 ? '' : 's'}; latest source: ${latestSource}.`
        : 'LOW from standing watch coverage while the direct source sweep found no current report.',
      riskDrivers: riskDrivers.length ? riskDrivers : ['Standing watch coverage active'],
    }
  })

  const coverageGaps = hotspots.map((hotspot) => {
    const latestArticle = normalizedArticles
      .filter((article) => article.region === hotspot.hotspot)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]
    const latestSignal = signals
      .filter((signal) => signal.region === hotspot.hotspot)
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0]
    const score = Math.min(100, (hotspot.verifiedReports > 0 ? 42 : 0) + Math.min(24, hotspot.sourceCount * 8) + (latestSignal ? 28 : 0))

    return {
      hotspot: hotspot.hotspot,
      score,
      status: qualityStatus(score),
      missing: [
        latestArticle ? null : 'fresh source-linked news',
        hotspot.sourceCount >= 2 ? null : 'second independent source',
        latestSignal ? null : 'fresh signal under 12h',
      ].filter(Boolean) as string[],
      sourceCount: hotspot.sourceCount,
      latestNewsAt: latestArticle?.timestamp || null,
      latestSignalAt: latestSignal?.observedAt || null,
    }
  })

  const watchRows = coverageGaps.filter((gap) => gap.status === 'watch')
  const sourceMix = normalizedArticles.reduce(
    (mix, article) => {
      const tier = maritimeSourceQualityTier(article.source) as keyof typeof mix
      mix[tier] = (mix[tier] || 0) + 1
      return mix
    },
    { official: 0, tierOne: 0, trade: 0, search: 0, general: 0, watch: 0 },
  )
  const recommendations = [
    watchRows.length ? `Prioritize ${watchRows.map((gap) => gap.hotspot).join(', ')} for the next source sweep.` : null,
    reviewGate.blocked ? `${reviewGate.blocked} low-evidence direct reports were blocked before the live map.` : null,
    reviewGate.watch ? `${reviewGate.watch} direct reports are watch-listed until stronger confirmation arrives.` : null,
  ].filter(Boolean) as string[]

  return {
    success: true,
    data: {
      articles: normalizedArticles,
      hotspots,
      signals,
      timestamp,
      count: {
        articles: normalizedArticles.length,
        hotspots: hotspots.length,
        signals: signals.length,
      },
      qualityAudit: {
        status: watchRows.length > 1 ? 'degraded' : watchRows.length === 1 ? 'watch' : 'healthy',
        sourceMix,
        reviewGate,
        coverageGaps,
        recommendations: recommendations.length ? recommendations : ['Direct source sweep coverage is active across all live map hotspots.'],
      },
    },
    meta: {
      version: '3.4.1-direct-live-reviewed',
      source: 'VesselSurge direct source sweep',
      cacheControl: 'public, s-maxage=120, stale-while-revalidate=300',
      cached: false,
      generatedAt: timestamp,
      stale: false,
    },
  }
}

async function fetchDirectMaritimePayload(request: Request) {
  try {
    const directUrl = new URL('/api/live-news?source=direct&limit=44', request.url)
    const response = await fetch(directUrl, {
      headers: { accept: 'application/json' },
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(5500),
    })

    if (!response.ok) return null
    const body = await response.json()
    return buildDirectMaritimePayload(Array.isArray(body?.articles) ? body.articles : [])
  } catch (error) {
    console.warn('[maritime-data] Direct source sweep fallback skipped:', error)
    return null
  }
}

export async function GET(request: Request) {
  const supabase = createAdminClient()
  const cached = await withTimeout(getFreshMaritimeDashboardCache(supabase), 1500, 'fresh dashboard cache').catch(() => null)

  if (cached) {
    return buildValidatedJsonResponse(cached, request)
  }

  const directLivePayload = await fetchDirectMaritimePayload(request)
  if (directLivePayload) {
    return buildValidatedJsonResponse(directLivePayload, request)
  }

  try {
    return buildValidatedJsonResponse(await withTimeout(buildMaritimeDashboardPayload(supabase), 5000, 'live maritime payload'), request)
  } catch (error) {
    console.error('[v0] Maritime data API error:', error)
    const stale = await withTimeout(
      getLastMaritimeDashboardCache(supabase, 'live refresh failed; serving last known real hotspot statistics and news'),
      1500,
      'stale dashboard cache',
    ).catch(() => null)

    if (stale) {
      return buildValidatedJsonResponse(stale, request)
    }

    return buildValidatedJsonResponse(
      buildOfflineMaritimeDashboardSnapshot('live refresh and database cache unavailable; serving bundled source-reviewed route context'),
      request,
    )
  }
}
