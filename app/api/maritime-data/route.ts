import { createHash } from 'crypto'
import { buildHotspotAnalysisBrief } from '@/lib/maritime-analysis'
import {
  buildMaritimeDashboardPayload,
  getFreshMaritimeDashboardCache,
  getLastMaritimeDashboardCache,
  reviewArticleForLiveMap,
  upsertMaritimeDashboardCachePayload,
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
import { sourceSweepAuditSourcesForRegion, sourceSweepLayerLabel, sourceSweepSummary } from '@/lib/maritime-source-sweep'
import { createAdminClient } from '@/lib/supabase/admin'
import { publicVercelCacheHeaders } from '@/lib/vercel-cache'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

const RESPONSE_HEADERS = {
  ...publicVercelCacheHeaders('public, max-age=15, s-maxage=30, stale-while-revalidate=120', ['maritime-data', 'live-map']),
  'X-Content-Type-Options': 'nosniff',
}

function buildValidatedJsonResponse(payload: unknown, request: Request) {
  const body = JSON.stringify(payload)
  const etag = `"${createHash('sha1').update(body).digest('base64url')}"`
  const ifNoneMatch = request.headers.get('if-none-match')
  const searchParams = new URL(request.url).searchParams
  const forceRefresh = searchParams.has('cache_refresh') || searchParams.get('refresh') === '1'
  const generatedAt = payload && typeof payload === 'object' && 'meta' in payload
    ? (payload as { meta?: { generatedAt?: string } }).meta?.generatedAt
    : null
  const cached = payload && typeof payload === 'object' && 'meta' in payload
    ? Boolean((payload as { meta?: { cached?: boolean } }).meta?.cached)
    : false

  const headers = {
    ...RESPONSE_HEADERS,
    ETag: etag,
    'X-VesselSurge-Cache-Mode': forceRefresh ? 'refresh' : cached ? 'hit' : 'live',
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
  derivedFrom?: string
}

const HOTSPOT_MARKET_VOLUME: Record<string, number> = {
  hormuz: 21000000,
  bab: 280000000,
  suez: 150000000,
  malacca: 500000000,
  panama: 0,
  taiwan: 0,
  turkish: 0,
  gibraltar: 0,
  cape: 0,
}

const HOTSPOTS = ['hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape']
const CURRENT_LIVE_MAP_HOURS = 48

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

function hasCriticalClosureContext(text: string) {
  return /\b(effective(?:ly)? closed|closed to (?:most )?(?:commercial|international|foreign)?\s*shipping|shipping (?:is )?at a standstill|traffic (?:is )?at a standstill|standstill|blockade|blocked maritime traffic|traffic collapse|almost completely collapsed|chokehold|reopen(?:ing)? the strait|transit(?:s)? remained impossible|not to use .*strait of hormuz|vessels? .* unable to transit)\b/i.test(text)
}

function hasDirectIncidentContext(text: string) {
  return /\b(attack|missile|strike|seized|hijack|warning shots|fired warning|incident|security warning|navigation warning|closure|closed|blocked|blockade|standstill|suspend|stopped|collision|explosion|fire|damaged|distress|piracy|armed|approach(?:ing)? craft|vessel fires|tanker fires)\b/i.test(text)
}

function hasRoutePressureContext(text: string) {
  return /\b(advisory|avoid|not to use|rerout|re-rout|divert|disruption|delay|queue|congestion|draft restriction|water level|war[-\s]?risk|insurance|threat|naval activity|military activity|transit restriction)\b/i.test(text)
}

function directRiskEvidence(articles: MaritimeDashboardResponse['data']['articles']) {
  const sources = new Set(articles.map((article) => article.source).filter(Boolean))
  const closureSources = new Set(articles
    .filter((article) => hasCriticalClosureContext(`${article.title} ${article.summary}`))
    .map((article) => article.source)
    .filter(Boolean))
  const directIncidentCount = articles.filter((article) => hasDirectIncidentContext(`${article.title} ${article.summary}`)).length
  const routePressureCount = articles.filter((article) => hasRoutePressureContext(`${article.title} ${article.summary}`)).length

  const riskLevel =
    closureSources.size >= 2 ? 'critical'
      : closureSources.size >= 1 && sources.size >= 3 && routePressureCount >= 2 ? 'critical'
        : directIncidentCount >= 2 && sources.size >= 2 ? 'high'
          : directIncidentCount >= 1 && routePressureCount >= 2 && sources.size >= 2 ? 'high'
            : (directIncidentCount >= 1 || routePressureCount >= 2) && sources.size >= 2 && articles.length >= 2 ? 'medium'
              : 'low'

  return {
    riskLevel,
    sourceCount: sources.size,
    closureSourceCount: closureSources.size,
    directIncidentCount,
    routePressureCount,
  }
}

function directRiskLevel(articles: MaritimeDashboardResponse['data']['articles']) {
  return directRiskEvidence(articles).riskLevel
}

function qualityStatus(score: number) {
  if (score >= 85) return 'strong' as const
  if (score >= 68) return 'good' as const
  return 'watch' as const
}

function isCurrentLiveMapItem(timestamp: string | null | undefined, nowIso: string) {
  if (!timestamp) return false
  const observedAt = Date.parse(timestamp)
  const now = Date.parse(nowIso)
  if (!Number.isFinite(observedAt) || !Number.isFinite(now)) return false
  const ageMs = now - observedAt
  return ageMs >= 0 && ageMs <= CURRENT_LIVE_MAP_HOURS * 60 * 60 * 1000
}

function buildSourceMix(sources: Array<string | null | undefined>) {
  return [...new Set(sources.filter(Boolean) as string[])].reduce(
    (mix, source) => {
      const tier = maritimeSourceQualityTier(source) as keyof typeof mix
      mix[tier] = (mix[tier] || 0) + 1
      return mix
    },
    { official: 0, tierOne: 0, trade: 0, search: 0, general: 0, watch: 0 },
  )
}

function isSourceSweepAuditArticle(article: { derivedFrom?: string | null; topic?: string | null }) {
  return article.derivedFrom === 'source_sweep_audit' || article.topic === 'source_sweep'
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
        derivedFrom: article.derivedFrom || 'direct_live_news',
      }
    })
    .map((article) => isSourceSweepAuditArticle(article)
      ? {
          ...article,
          reviewStatus: 'watch' as const,
          reviewReason: 'Source-sweep context: shown as source coverage only, not counted as a verified incident report.',
          reviewScore: 68,
          reviewedAt: new Date().toISOString(),
        }
      : {
          ...article,
          ...reviewArticleForLiveMap(article),
        })
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
  const evidenceArticles = normalizedArticles.filter((article) => !isSourceSweepAuditArticle(article))

  if (normalizedArticles.length === 0) return null

  const signals = evidenceArticles.map((article) => ({
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
    sourceAuditCount: 0,
    sourceAuditSources: [],
  }))
  const sourceSweepSignals = HOTSPOTS
    .filter((hotspot) => !evidenceArticles.some((article) => article.region === hotspot && isCurrentLiveMapItem(article.timestamp, timestamp)))
    .flatMap((hotspot) => {
      const route = ROUTE_LABELS[hotspot]
      const auditSources = sourceSweepAuditSourcesForRegion(hotspot)
      const checkedSources = auditSources.length
        ? auditSources
        : [{ source: 'VesselSurge Source Sweep', url: route.url, layer: 'search' as const }]

      return checkedSources.map((checkedSource, index) => ({
        signalKey: `direct-source-sweep-${hotspot}-${index}-${createHash('sha1').update(`${checkedSource.source}:${checkedSource.url}:${timestamp.slice(0, 13)}`).digest('base64url').slice(0, 12)}`,
        source: checkedSource.source,
        sourceUrl: checkedSource.url,
        title: `${route.name}: ${sourceSweepLayerLabel(checkedSource.layer)} checked`,
        summary: index === 0
          ? `${sourceSweepSummary(route.name, auditSources)} Additional sweep layers are shown separately for source transparency.`
          : `VesselSurge also checked ${checkedSource.source}; no current source-backed disruption is being claimed for ${route.name}.`,
        region: hotspot,
        signalType: 'source_sweep',
        severity: 'low',
        confidence: 68,
        observedAt: timestamp,
        sourceAuditCount: auditSources.length,
        sourceAuditSources: auditSources.map((source) => source.source),
      }))
    })
  const allSignals = [...signals, ...sourceSweepSignals]

  const hotspots = HOTSPOTS.map((hotspot) => {
    const hotspotArticles = evidenceArticles
      .filter((article) => article.region === hotspot)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    const currentArticles = hotspotArticles.filter((article) => isCurrentLiveMapItem(article.timestamp, timestamp))
    const hotspotSignals = allSignals.filter((signal) => signal.region === hotspot)
    const sourceSweepSignal = hotspotSignals.find((signal) => signal.signalType === 'source_sweep')
    const explicitSourceCount = new Set([
      ...currentArticles.map((article) => article.source),
      ...hotspotSignals.map((signal) => signal.source),
    ].filter(Boolean)).size
    const sourceSweepAuditCount = Math.max(0, ...hotspotSignals.map((signal) => signal.signalType === 'source_sweep' ? signal.sourceAuditCount || 0 : 0))
    const sourceCount = Math.max(explicitSourceCount, sourceSweepAuditCount)
    const riskEvidence = directRiskEvidence(currentArticles)
    const riskLevel = riskEvidence.riskLevel
    const confidenceScore = currentArticles.length
      ? Math.min(88, 40 + Math.min(20, sourceCount * 6) + Math.min(24, currentArticles.length * 4))
      : 35
    const sourceSweepOnly = currentArticles.length === 0 && Boolean(sourceSweepSignal)
    const latestSource = currentArticles[0]?.source || sourceSweepSignal?.source || 'VesselSurge operational watch'
    const priorityDriverArticles = riskLevel === 'critical'
      ? currentArticles.filter((article) => {
          const text = `${article.title} ${article.summary}`
          return hasCriticalClosureContext(text) || hasRoutePressureContext(text)
        })
      : currentArticles
    const riskDrivers = currentArticles.length
      ? (priorityDriverArticles.length ? priorityDriverArticles : currentArticles)
        .slice(0, 3)
        .map((article) => `${article.source}: ${article.title}`)
      : sourceSweepOnly
        ? ['No fresh source-backed disruption found by the latest source sweep']
        : hotspotSignals.slice(0, 2).map((signal) => `${signal.source}: ${signal.title}`)
    const riskSummary = currentArticles.length
      ? riskLevel === 'critical'
        ? riskEvidence.closureSourceCount >= 2
          ? `CRITICAL because ${riskEvidence.closureSourceCount} independent current sources describe closure, blockade or standstill context; ${currentArticles.length} total reports across ${sourceCount} sources; latest source: ${latestSource}.`
          : `CRITICAL because a current closure or standstill source is backed by ${riskEvidence.routePressureCount} route-pressure reports across ${sourceCount} sources; latest source: ${latestSource}.`
        : riskLevel === 'low'
        ? `LOW because ${currentArticles.length} current report${currentArticles.length === 1 ? '' : 's'} did not meet corroboration or operational-impact thresholds; latest source: ${latestSource}.`
        : `${riskLevel.toUpperCase()} from ${currentArticles.length} current source-linked report${currentArticles.length === 1 ? '' : 's'} across ${sourceCount} source${sourceCount === 1 ? '' : 's'}; latest source: ${latestSource}.`
      : hotspotArticles.length
        ? 'LOW because the latest source sweep found no current source-backed disruption; older reports remain context only.'
        : 'LOW because the latest source sweep found no current source-backed disruption; no incident is being claimed.'

    return {
      id: `direct-live-${hotspot}`,
      hotspot,
      activeVessels: 0,
      dailyTransits: 0,
      avgWaitTime: hotspotSignals.length ? `${hotspotSignals.length} live source signals` : 'Operational watch active',
      marketVolume: HOTSPOT_MARKET_VOLUME[hotspot] || 0,
      riskLevel,
      updatedAt: timestamp,
      verifiedReports: currentArticles.length,
      sourceCount,
      latestSource,
      signalCount: hotspotSignals.length,
      officialSignalCount: 0,
      aisSignalCount: 0,
      confidenceScore,
      confidenceLabel: sourceSweepOnly ? 'Source sweep' : confidenceScore >= 70 ? 'Corroborated' : currentArticles.length ? 'Watchlist' : 'Thin signal',
      riskSummary,
      riskDrivers: riskDrivers.length ? riskDrivers : ['Operational watch coverage active'],
      analysisBrief: buildHotspotAnalysisBrief({
        hotspot,
        riskLevel,
        verifiedReports: currentArticles.length,
        sourceCount,
        latestSource,
        riskSummary,
        riskDrivers,
        articles: currentArticles,
        signals: hotspotSignals,
      }),
    }
  })

  const coverageGaps = hotspots.map((hotspot) => {
    const latestArticle = evidenceArticles
      .filter((article) => article.region === hotspot.hotspot && isCurrentLiveMapItem(article.timestamp, timestamp))
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0]
    const latestSignal = allSignals
      .filter((signal) => signal.region === hotspot.hotspot)
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0]
    const hasSourceSweepSignal = latestSignal?.signalType === 'source_sweep'
    const sourceSweepOnlyScore = hasSourceSweepSignal && hotspot.verifiedReports === 0
      ? hotspot.sourceCount >= 3 ? 70 : hotspot.sourceCount >= 2 ? 64 : 54
      : 0
    const score = Math.max(
      sourceSweepOnlyScore,
      Math.min(100, (hotspot.verifiedReports > 0 ? 42 : 0) + Math.min(24, hotspot.sourceCount * 8) + (latestSignal ? 28 : 0)),
    )

    return {
      hotspot: hotspot.hotspot,
      score,
      status: qualityStatus(score),
      missing: [
        latestArticle ? null : hasSourceSweepSignal ? 'no fresh source-linked disruption report' : 'fresh source-linked news',
        hotspot.sourceCount >= 2 ? null : 'second independent source',
        latestSignal ? null : 'fresh signal under 12h',
        hasSourceSweepSignal && !latestArticle && hotspot.sourceCount < 3 ? 'replace source sweep with source-linked report' : null,
      ].filter(Boolean) as string[],
      sourceCount: hotspot.sourceCount,
      latestNewsAt: latestArticle?.timestamp || null,
      latestSignalAt: latestSignal?.observedAt || null,
    }
  })

  const watchRows = coverageGaps.filter((gap) => gap.status === 'watch')
  const sourceMix = buildSourceMix([
    ...normalizedArticles.map((article) => article.source),
    ...allSignals.map((signal) => signal.source),
  ])
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
      signals: allSignals,
      timestamp,
      count: {
        articles: normalizedArticles.length,
        hotspots: hotspots.length,
        signals: allSignals.length,
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
    const directUrl = new URL('/api/live-news?source=direct&limit=72', request.url)
    directUrl.searchParams.set('sweep', Math.floor(Date.now() / 120000).toString())
    const response = await fetch(directUrl, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
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
  const searchParams = new URL(request.url).searchParams
  const forceRefresh = searchParams.has('cache_refresh') || searchParams.get('refresh') === '1'
  const cached = forceRefresh
    ? null
    : await withTimeout(getFreshMaritimeDashboardCache(supabase), 1500, 'fresh dashboard cache').catch(() => null)

  if (cached) {
    return buildValidatedJsonResponse(cached, request)
  }

  const directLivePayload = await fetchDirectMaritimePayload(request)
  if (directLivePayload) {
    await withTimeout(
      upsertMaritimeDashboardCachePayload(supabase, directLivePayload),
      3000,
      'direct live dashboard cache write',
    ).catch((error) => {
      console.warn('[maritime-data] Direct live dashboard cache write skipped:', error)
    })
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
