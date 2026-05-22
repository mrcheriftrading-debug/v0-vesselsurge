import type { SupabaseClient } from '@supabase/supabase-js'
import {
  maritimeArticleIntelligenceScore,
  maritimeFreshnessScore,
  maritimeSourceQualityLabel,
  maritimeSourceQualityScore,
  maritimeSourceQualityTier,
} from '@/lib/maritime-source-quality'
import { sourceSweepAuditCount } from '@/lib/maritime-source-sweep'

const CACHE_KEY = 'live-map'
const REDIS_CACHE_KEY = `vesselsurge:maritime-dashboard-cache:${CACHE_KEY}`
const CACHE_TTL_MS = 5 * 60 * 1000
const STALE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const LIVE_HOTSPOTS = ['hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape']
export const LIVE_MAP_NEWS_MAX_AGE_HOURS = 48

type DashboardCacheRow = {
  payload: MaritimeDashboardResponse
  generated_at: string
}

export type DashboardCacheSource = 'redis-kv' | 'supabase-rest' | 'supabase-client'

export type DashboardCacheRead = {
  row: DashboardCacheRow
  source: DashboardCacheSource
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

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null
  return { url, token }
}

async function redisCommand<T>(command: unknown[], timeoutMs: number): Promise<T | null> {
  const config = getRedisConfig()
  if (!config) return null

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!response.ok) return null
    const body = await response.json() as { result?: T; error?: string }
    if (body.error) return null
    return body.result ?? null
  } catch {
    return null
  }
}

async function getDashboardCacheRowViaRedis(timeoutMs: number): Promise<DashboardCacheRow | null> {
  const cached = await redisCommand<string | DashboardCacheRow>(['GET', REDIS_CACHE_KEY], timeoutMs)
  if (!cached) return null

  try {
    const row = typeof cached === 'string' ? JSON.parse(cached) : cached
    if (!row?.payload || !row?.generated_at) return null
    return row as DashboardCacheRow
  } catch {
    return null
  }
}

async function upsertDashboardCacheRowViaRedis(row: DashboardCacheRow) {
  const ttlSeconds = Math.round(STALE_CACHE_TTL_MS / 1000)
  const result = await redisCommand<string>(['SET', REDIS_CACHE_KEY, JSON.stringify(row), 'EX', ttlSeconds], 2500)
  return result === 'OK'
}

async function getDashboardCacheRowViaRest(timeoutMs: number): Promise<DashboardCacheRow | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey) return null

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/maritime_dashboard_cache?cache_key=eq.${encodeURIComponent(CACHE_KEY)}&select=payload,generated_at&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          accept: 'application/json',
        },
        signal: AbortSignal.timeout(timeoutMs),
      },
    )

    if (!response.ok) return null
    const rows = (await response.json()) as DashboardCacheRow[]
    return rows[0] || null
  } catch {
    return null
  }
}

async function getDashboardCacheRowViaClient(supabase: SupabaseClient, timeoutMs: number, label: string) {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('maritime_dashboard_cache')
        .select('payload,generated_at')
        .eq('cache_key', CACHE_KEY)
        .maybeSingle(),
      timeoutMs,
      label,
    )

    if (error || !data) return null
    return data as DashboardCacheRow
  } catch {
    return null
  }
}

export async function getMaritimeDashboardCacheRead(supabase?: SupabaseClient, timeoutMs = 1400): Promise<DashboardCacheRead | null> {
  const redisRow = await getDashboardCacheRowViaRedis(timeoutMs)
  if (redisRow) return { row: redisRow, source: 'redis-kv' }

  const restRow = await getDashboardCacheRowViaRest(timeoutMs)
  if (restRow) return { row: restRow, source: 'supabase-rest' }

  if (supabase) {
    const clientRow = await getDashboardCacheRowViaClient(supabase, timeoutMs, 'maritime dashboard cache row')
    if (clientRow) return { row: clientRow, source: 'supabase-client' }
  }

  return null
}

export async function getMaritimeDashboardCacheRow(supabase?: SupabaseClient, timeoutMs = 1400) {
  return (await getMaritimeDashboardCacheRead(supabase, timeoutMs))?.row || null
}

export type MaritimeDashboardResponse = {
  success: true
  data: {
    articles: Array<{
      id: string
      title: string
      summary: string
      source: string
      sourceUrl: string
      category: string
      region: string
      timestamp: string
      isBreaking: boolean
      sourceQualityLabel?: string
      sourceQualityScore?: number
      sourceQualityTier?: string
      freshnessScore?: number
      intelligenceScore?: number
      reviewStatus?: 'approved' | 'watch' | 'blocked'
      reviewReason?: string
      reviewScore?: number
      reviewedAt?: string
    }>
    hotspots: Array<{
      id: string
      hotspot: string
      activeVessels: number
      dailyTransits: number
      avgWaitTime: string
      marketVolume: number
      riskLevel: string
      updatedAt: string
      verifiedReports: number
      sourceCount: number
      latestSource: string | null
      signalCount: number
      officialSignalCount: number
      aisSignalCount: number
      confidenceScore: number
      confidenceLabel: string
      riskSummary?: string
      riskDrivers?: string[]
    }>
    signals: Array<{
      signalKey: string
      source: string
      sourceUrl: string | null
      title: string
      summary: string | null
      region: string
      signalType: string
      severity: string
      confidence: number
      observedAt: string
      metadata?: Record<string, unknown> | null
      sourceAuditCount?: number
      sourceAuditSources?: string[]
    }>
    timestamp: string
    count: {
      articles: number
      hotspots: number
      signals: number
    }
    qualityAudit?: {
      status: 'healthy' | 'watch' | 'degraded'
      sourceMix: {
        official: number
        tierOne: number
        trade: number
        search: number
        general: number
        watch: number
      }
      reviewGate?: {
        approved: number
        watch: number
        blocked: number
        visible: number
      }
      coverageGaps: Array<{
        hotspot: string
        score: number
        status: 'strong' | 'good' | 'watch'
        missing: string[]
        sourceCount: number
        latestNewsAt: string | null
        latestSignalAt: string | null
      }>
      recommendations: string[]
    }
  }
  meta: {
    version: string
    source: string
    cacheControl: string
    cached: boolean
    generatedAt?: string
    stale?: boolean
    staleReason?: string
  }
}

function confidenceForHotspot(stats: {
  reports: number
  sources: Set<string>
  signals: any[]
  activeVessels: number
}) {
  const officialSignals = stats.signals.filter((signal) => signal.signal_type === 'official_alert' || signal.signal_type === 'navigation_warning')
  const aisSignals = stats.signals.filter((signal) => signal.signal_type === 'ais_anomaly')
  const weatherSignals = stats.signals.filter((signal) => signal.signal_type === 'weather_constraint')
  const maxSignalConfidence = stats.signals.reduce((max, signal) => Math.max(max, signal.confidence || 0), 0)
  const hasOperationalSignal = officialSignals.length > 0 || aisSignals.length > 0
  const score = Math.min(
    hasOperationalSignal ? 100 : 70,
    Math.round(
      Math.max(maxSignalConfidence, 0) +
        Math.min(20, officialSignals.length * 10) +
        Math.min(12, aisSignals.length * 6) +
        Math.min(6, weatherSignals.length * 3) +
        Math.min(10, stats.sources.size * 2) +
        Math.min(8, stats.activeVessels > 0 ? 8 : 0),
    ),
  )

  if (score > 0) return score
  if (stats.reports > 0) return Math.min(55, 30 + stats.sources.size * 4)
  return 0
}

function confidenceLabelForHotspot(score: number, stats: { officialSignalCount: number; aisSignalCount: number; sourceSweepOnly?: boolean }) {
  if (stats.sourceSweepOnly) return 'Source sweep'
  if (score >= 80 && (stats.officialSignalCount > 0 || stats.aisSignalCount > 0)) return 'Verified'
  if (score >= 65) return 'Corroborated'
  if (score >= 45) return 'Watchlist'
  return 'Thin signal'
}

function signalTypeLabel(type?: string | null) {
  switch (type) {
    case 'official_alert':
      return 'Official alert'
    case 'navigation_warning':
      return 'Navigation warning'
    case 'ais_anomaly':
      return 'AIS anomaly'
    case 'weather_constraint':
      return 'Marine condition'
    case 'news_corroboration':
      return 'News corroboration'
    case 'source_sweep':
      return 'Source sweep'
    default:
      return 'Watch signal'
  }
}

function riskSummaryForHotspot(stats: {
  riskLevel: string
  reports: number
  sourceCount: number
  signals: any[]
  latestSource: string | null
  activeVessels: number
}) {
  const sourceSweepOnly = stats.reports === 0 &&
    stats.activeVessels === 0 &&
    stats.signals.some((signal) => signal.signal_type === 'source_sweep') &&
    !stats.signals.some((signal) => signal.signal_type && signal.signal_type !== 'source_sweep')

  if (sourceSweepOnly) {
    return {
      riskSummary: `${stats.riskLevel.toUpperCase()} because the latest source sweep found no current source-backed disruption; no incident is being claimed.`,
      riskDrivers: ['No fresh source-backed disruption found by the latest source sweep'],
    }
  }

  const sortedSignals = [...stats.signals]
    .sort((a, b) => {
      const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
      const severityDiff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
      if (severityDiff !== 0) return severityDiff
      return (b.confidence || 0) - (a.confidence || 0)
    })
    .slice(0, 3)

  const drivers = sortedSignals.map((signal) => {
    const confidence = signal.confidence ? ` · ${signal.confidence}/100` : ''
    return `${signalTypeLabel(signal.signal_type)} from ${signal.source || 'VesselSurge watch'}${confidence}`
  })

  if (stats.reports > 0) {
    drivers.push(`${stats.reports} source-reviewed report${stats.reports === 1 ? '' : 's'}${stats.sourceCount ? ` across ${stats.sourceCount} source${stats.sourceCount === 1 ? '' : 's'}` : ''}`)
  }

  if (stats.activeVessels > 0) {
    drivers.push(`${stats.activeVessels} fresh AIS vessel position${stats.activeVessels === 1 ? '' : 's'} in watch boxes`)
  }

  const uniqueDrivers = Array.from(new Set(drivers)).slice(0, 4)
  const strongest = uniqueDrivers[0]

  const riskSummary = strongest
    ? `${stats.riskLevel.toUpperCase()} because ${strongest}${stats.latestSource ? `; latest source: ${stats.latestSource}` : ''}.`
    : `${stats.riskLevel.toUpperCase()} from operational watch coverage while fresh direct signals are thin.`

  return {
    riskSummary,
    riskDrivers: uniqueDrivers.length > 0 ? uniqueDrivers : ['Operational watch coverage active'],
  }
}

function articleText(article: { title?: string | null; summary?: string | null }) {
  return `${article.title || ''} ${article.summary || ''}`
}

function hasDirectOperationalIncident(text: string) {
  return /\b(attack|missile|strike|seized|hijack|warning shots|fired warning|incident|security warning|navigation warning|closure|closed|blocked|blockade|standstill|suspend|stopped|collision|explosion|fire|damaged|distress|piracy|armed|approach(?:ing)? craft|vessel fires|tanker fires)\b/i.test(text)
}

function hasRoutePressure(text: string) {
  return /\b(advisory|avoid|not to use|rerout|re-rout|divert|disruption|delay|queue|congestion|draft restriction|water level|war[-\s]?risk|insurance|threat|naval activity|military activity|transit restriction)\b/i.test(text)
}

function hasCriticalClosureContext(text: string) {
  return /\b(effective(?:ly)? closed|closed to (?:most )?(?:commercial|international|foreign)?\s*shipping|shipping (?:is )?at a standstill|traffic (?:is )?at a standstill|standstill|blockade|blocked maritime traffic|traffic collapse|almost completely collapsed|chokehold|reopen(?:ing)? the strait|transit(?:s)? remained impossible|not to use .*strait of hormuz|vessels? .* unable to transit)\b/i.test(text)
}

function deriveEvidenceRiskLevel(input: {
  articles: Array<{ title?: string | null; summary?: string | null; source?: string | null }>
  signals: Array<{ signal_type?: string | null; severity?: string | null; confidence?: number | null }>
  sourceCount: number
  fallbackRiskLevel?: string | null
}) {
  const operationalSignals = input.signals.filter((signal) => signal.signal_type && !['source_sweep', 'news_corroboration'].includes(signal.signal_type))
  const strongOperationalSignals = operationalSignals.filter((signal) =>
    ['critical', 'high'].includes(signal.severity || '') || (signal.confidence || 0) >= 78,
  )
  const directIncidentReports = input.articles.filter((article) => hasDirectOperationalIncident(articleText(article))).length
  const routePressureReports = input.articles.filter((article) => hasRoutePressure(articleText(article))).length
  const closureSources = new Set(input.articles
    .filter((article) => hasCriticalClosureContext(articleText(article)))
    .map((article) => article.source)
    .filter(Boolean))
  const reports = input.articles.length

  if (closureSources.size >= 2) return 'critical'
  if (closureSources.size >= 1 && input.sourceCount >= 3 && routePressureReports >= 2) return 'critical'
  if (strongOperationalSignals.length > 0) return 'high'
  if (directIncidentReports >= 2 && input.sourceCount >= 2) return 'high'
  if (directIncidentReports >= 1 && routePressureReports >= 2 && input.sourceCount >= 2) return 'high'
  if ((directIncidentReports >= 1 || routePressureReports >= 2) && input.sourceCount >= 2 && reports >= 2) return 'medium'
  if (operationalSignals.length >= 2) return 'medium'

  const fallback = input.fallbackRiskLevel || 'low'
  return fallback === 'critical' || fallback === 'high' ? 'medium' : 'low'
}

function dedupeArticles<T extends { title?: string | null; sourceUrl?: string | null; source?: string | null }>(articles: T[]) {
  const seen = new Set<string>()
  return articles.filter((article) => {
    const key = (article.sourceUrl || `${article.source || 'unknown'}:${article.title || ''}`)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function balanceDashboardArticles<T extends { region?: string | null; timestamp?: string | null }>(articles: T[], perHotspot = 10, limit = 64) {
  const selected: T[] = []
  const selectedIndexes = new Set<number>()
  const sorted = articles
    .map((article, index) => ({ article, index }))
    .sort((a, b) => Date.parse(b.article.timestamp || '') - Date.parse(a.article.timestamp || ''))

  for (const hotspot of LIVE_HOTSPOTS) {
    const rows = sorted.filter(({ article }) => article.region === hotspot).slice(0, perHotspot)
    for (const row of rows) {
      selected.push(row.article)
      selectedIndexes.add(row.index)
    }
  }

  for (const row of sorted) {
    if (selected.length >= limit) break
    if (selectedIndexes.has(row.index)) continue
    selected.push(row.article)
  }

  return selected.sort((a, b) => Date.parse(b.timestamp || '') - Date.parse(a.timestamp || ''))
}

type LiveMapReviewInput = {
  source?: string | null
  title?: string | null
  summary?: string | null
  region?: string | null
  timestamp?: string | null
  sourceQualityScore?: number | null
  freshnessScore?: number | null
  intelligenceScore?: number | null
}

export function reviewArticleForLiveMap(article: LiveMapReviewInput) {
  const sourceScore = article.sourceQualityScore ?? maritimeSourceQualityScore(article.source)
  const freshnessScore = article.freshnessScore ?? 0
  const intelligenceScore = article.intelligenceScore ?? 0
  const ageHours = hoursOld(article.timestamp)
  const text = `${article.title || ''} ${article.summary || ''} ${article.region || ''}`
  const region = article.region || ''
  const expansionRouteNeedsOperationalContext = ['panama', 'taiwan', 'turkish', 'gibraltar', 'cape'].includes(region)
  const expansionOperationalContext = !expansionRouteNeedsOperationalContext ||
    /\b(ship|shipping|vessel|tanker|cargo|container|maritime|port|transit|queue|draft|draught|water|drought|capacity|restriction|restrictions|reservation|booking|slot|slots|maintenance|delay|congestion|closure|traffic|rerout|re-rout|divert|freight|bunker|voyage|security|incident|naval|exercise|warning|alert|lng|energy export)\b/i.test(text)
  const governanceOnlyUpdate = expansionRouteNeedsOperationalContext &&
    /\b(appoint|appointed|appointment|names?|named|administrator|chief executive|ceo|board|chair|minister|president|director|leadership|election|resigns?|resignation)\b/i.test(text) &&
    !/\b(restrict|restriction|suspend|closed|closure|delay|queue|draft|water level|drought|congestion|traffic disruption|ship traffic|vessel traffic|security warning|navigation warning|incident|rerout|re-rout|divert)\b/i.test(text)
  const gibraltarLandTrafficNoise = region === 'gibraltar' &&
    /\b(airport|runway|road traffic|cars?|vehicles?|tunnel|border crossing|pedestrian|driving)\b/i.test(text) &&
    !/\b(ship|shipping|vessel|tanker|cargo|bunker|bunkering|port|maritime|strait|anchorage|pilotage|vts)\b/i.test(text)
  const routeEvidence = /\b(hormuz|red sea|bab el|suez|malacca|panama canal|taiwan strait|turkish straits|bosporus|bosphorus|dardanelles|gibraltar|cape of good hope|tanker|oil|crude|lng|freight|rerout|divert|war[-\s]?risk|insurance|ais|chokepoint|shipping|vessel|port|canal|strait)\b/i
    .test(text) && expansionOperationalContext
  const reviewScore = Math.round((intelligenceScore * 0.46) + (sourceScore * 0.28) + (freshnessScore * 0.18) + (routeEvidence ? 8 : 0))
  const sourceLabel = maritimeSourceQualityLabel(article.source)

  if (ageHours === null || ageHours > LIVE_MAP_NEWS_MAX_AGE_HOURS) {
    return {
      reviewStatus: 'blocked' as const,
      reviewReason: `Blocked before live map: event is ${ageHours === null ? 'missing a valid timestamp' : `${Math.round(ageHours)}h old`}; live reports must be under ${LIVE_MAP_NEWS_MAX_AGE_HOURS}h.`,
      reviewScore,
      reviewedAt: new Date().toISOString(),
    }
  }

  if (governanceOnlyUpdate) {
    return {
      reviewStatus: 'blocked' as const,
      reviewReason: 'Blocked before live map: governance or appointment update without a confirmed operational shipping impact.',
      reviewScore,
      reviewedAt: new Date().toISOString(),
    }
  }

  if (gibraltarLandTrafficNoise) {
    return {
      reviewStatus: 'blocked' as const,
      reviewReason: 'Blocked before live map: Gibraltar land, airport or road traffic item without confirmed maritime operating impact.',
      reviewScore,
      reviewedAt: new Date().toISOString(),
    }
  }

  if (reviewScore >= 68 && sourceScore >= 55 && routeEvidence) {
    return {
      reviewStatus: 'approved' as const,
      reviewReason: `Approved for live map: ${reviewScore}/100 review score, ${sourceLabel}, route evidence confirmed.`,
      reviewScore,
      reviewedAt: new Date().toISOString(),
    }
  }

  if (reviewScore >= 56 && sourceScore >= 55 && routeEvidence) {
    return {
      reviewStatus: 'watch' as const,
      reviewReason: `Watch-listed for live map: ${reviewScore}/100 review score; keep until fresher or stronger confirmation arrives.`,
      reviewScore,
      reviewedAt: new Date().toISOString(),
    }
  }

  return {
    reviewStatus: 'blocked' as const,
    reviewReason: `Blocked before live map: ${reviewScore}/100 review score lacks enough source, freshness or route evidence.`,
    reviewScore,
    reviewedAt: new Date().toISOString(),
  }
}

function reviewGateSummary(articles: Array<{ reviewStatus?: 'approved' | 'watch' | 'blocked' }>) {
  const summary = articles.reduce(
    (acc, article) => {
      if (article.reviewStatus === 'approved') acc.approved += 1
      else if (article.reviewStatus === 'watch') acc.watch += 1
      else if (article.reviewStatus === 'blocked') acc.blocked += 1
      return acc
    },
    { approved: 0, watch: 0, blocked: 0, visible: 0 },
  )

  summary.visible = summary.approved + summary.watch
  return summary
}

function hoursOld(value?: string | null) {
  if (!value) return null
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, (Date.now() - parsed) / 36e5)
}

function qualityCoverageScore(input: {
  latestNewsAt: string | null
  latestSignalAt: string | null
  sourceCount: number
  riskDrivers: string[]
}) {
  const newsAge = hoursOld(input.latestNewsAt)
  const signalAge = hoursOld(input.latestSignalAt)
  const newsScore = newsAge === null ? 0 : newsAge <= 24 ? 30 : newsAge <= 72 ? 18 : 8
  const signalScore = signalAge === null ? 0 : signalAge <= 12 ? 30 : signalAge <= 48 ? 18 : 8
  const sourceScore = input.sourceCount >= 4 ? 25 : input.sourceCount >= 2 ? 18 : input.sourceCount >= 1 ? 10 : 0
  const evidenceScore = input.riskDrivers.length > 0 ? 15 : 0
  return Math.min(100, newsScore + signalScore + sourceScore + evidenceScore)
}

function buildQualityAudit(
  hotspots: MaritimeDashboardResponse['data']['hotspots'],
  articles: MaritimeDashboardResponse['data']['articles'],
  signals: MaritimeDashboardResponse['data']['signals'],
  reviewGate = reviewGateSummary(articles),
) {
  const sourceMix = {
    official: 0,
    tierOne: 0,
    trade: 0,
    search: 0,
    general: 0,
    watch: 0,
  }

  const uniqueSources = new Set([
    ...articles.map((article) => article.source),
    ...signals.map((signal) => signal.source),
  ].filter(Boolean))

  for (const source of uniqueSources) {
    const tier = maritimeSourceQualityTier(source) as keyof typeof sourceMix
    sourceMix[tier] = (sourceMix[tier] || 0) + 1
  }

  const coverageGaps = hotspots.map((hotspot) => {
    const hotspotArticles = articles
      .filter((article) => article.region === hotspot.hotspot)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    const hotspotSignals = signals
      .filter((signal) => signal.region === hotspot.hotspot)
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))
    const latestNewsAt = hotspotArticles[0]?.timestamp || null
    const latestSignalAt = hotspotSignals[0]?.observedAt || null
    const hasFreshSourceSweep = hotspotSignals.some((signal) => signal.signalType === 'source_sweep') &&
      hoursOld(latestSignalAt) !== null &&
      (hoursOld(latestSignalAt) || 999) <= 12
    const sourceCount = Math.max(
      hotspot.sourceCount || 0,
      new Set([
        ...hotspotArticles.map((article) => article.source),
        ...hotspotSignals.map((signal) => signal.source),
      ].filter(Boolean)).size,
      ...hotspotSignals.map(sourceSweepAuditCount),
    )
    const sourceSweepOnlyScore = hasFreshSourceSweep && !latestNewsAt
      ? sourceCount >= 3 ? 70 : sourceCount >= 2 ? 64 : 54
      : 0
    const score = Math.max(sourceSweepOnlyScore, qualityCoverageScore({
      latestNewsAt,
      latestSignalAt,
      sourceCount,
      riskDrivers: hotspot.riskDrivers || [],
    }))
    const missing = [
      hoursOld(latestNewsAt) !== null && (hoursOld(latestNewsAt) || 999) <= 24 ? null : hasFreshSourceSweep ? 'no fresh source-linked disruption report' : 'fresh news under 24h',
      hoursOld(latestSignalAt) !== null && (hoursOld(latestSignalAt) || 999) <= 12 ? null : 'fresh signal under 12h',
      sourceCount >= 2 ? null : 'second independent source',
      hasFreshSourceSweep && !latestNewsAt && sourceCount < 3 ? 'replace source sweep with source-linked report' : null,
    ].filter(Boolean) as string[]

    return {
      hotspot: hotspot.hotspot,
      score,
      status: score >= 85 ? 'strong' as const : score >= 68 ? 'good' as const : 'watch' as const,
      missing,
      sourceCount,
      latestNewsAt,
      latestSignalAt,
    }
  })

  const watchRows = coverageGaps.filter((gap) => gap.status === 'watch')
  const recommendations = [
    watchRows.length ? `Prioritize ${watchRows.map((gap) => gap.hotspot).join(', ')} for the next source sweep.` : null,
    sourceMix.official + sourceMix.tierOne < 4 ? 'Increase official and Tier-1 confirmation density.' : null,
    coverageGaps.some((gap) => gap.missing.includes('fresh signal under 12h')) ? 'Refresh operational signals for routes with stale signal context.' : null,
    articles.some((article) => article.reviewStatus === 'watch') ? 'Some live-map reports are watch-listed and should be replaced when stronger confirmation arrives.' : null,
    reviewGate.blocked ? `${reviewGate.blocked} low-evidence reports were blocked before the live map.` : null,
  ].filter(Boolean) as string[]

  return {
    status: watchRows.length > 1 ? 'degraded' as const : watchRows.length === 1 ? 'watch' as const : 'healthy' as const,
    sourceMix,
    reviewGate,
    coverageGaps,
    recommendations: recommendations.length ? recommendations : ['Coverage, source mix and freshness are within current operating targets.'],
  }
}

async function fetchVesselCounts(supabase: SupabaseClient) {
  try {
    const freshCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data: vessels, error } = await supabase
      .from('vessels')
      .select('hotspot')
      .gte('updated_at', freshCutoff)

    if (error) throw error

    const counts: Record<string, number> = {}
    ;(vessels || []).forEach((v: any) => {
      counts[v.hotspot] = (counts[v.hotspot] || 0) + 1
    })
    return counts
  } catch (e) {
    console.log('[maritime-data] Could not fetch vessel counts:', e)
    return null
  }
}

export async function buildMaritimeDashboardPayload(supabase: SupabaseClient): Promise<MaritimeDashboardResponse> {
  const now = new Date()
  const timestamp = now.toISOString()
  const signalCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const [articlesResult, hotspotsResult, signalsResult, vesselCounts] = await Promise.all([
    supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(160),
    supabase
      .from('hotspot_stats')
      .select('id,hotspot,active_vessels,daily_transits,avg_wait_time,market_volume,risk_level,updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('maritime_signals')
      .select('signal_key,source,source_url,title,summary,region,signal_type,severity,confidence,observed_at,metadata')
      .gte('observed_at', signalCutoff)
      .order('observed_at', { ascending: false })
      .limit(80),
    fetchVesselCounts(supabase),
  ])

  const { data: articlesData, error: articlesError } = articlesResult
  const { data: hotspotsData, error: hotspotsError } = hotspotsResult
  const { data: signalsData, error: signalsError } = signalsResult

  if (articlesError || hotspotsError || signalsError) {
    console.error('[v0] Supabase fetch error:', { articlesError, hotspotsError, signalsError })
    throw new Error('Failed to fetch maritime data')
  }

  const rawArticles = (articlesData || []).map((article: any) => {
    const articleTimestamp = article.published_at || article.created_at || timestamp
    const source = article.source || 'VesselSurge source layer'
    const summary = article.summary || article.description || article.snippet || ''

    return {
      id: article.id,
      title: article.title,
      summary,
      source,
      sourceUrl: article.source_url || article.url,
      category: article.category || 'industry',
      region: article.region || 'global',
      timestamp: articleTimestamp,
      isBreaking: article.is_breaking || false,
      sourceQualityLabel: maritimeSourceQualityLabel(source),
      sourceQualityScore: maritimeSourceQualityScore(source),
      sourceQualityTier: maritimeSourceQualityTier(source),
      freshnessScore: maritimeFreshnessScore(articleTimestamp),
      intelligenceScore: maritimeArticleIntelligenceScore({
        source,
        timestamp: articleTimestamp,
        title: article.title,
        summary,
        region: article.region || 'global',
      }),
    }
  })

  const signals = (signalsData || []).map((signal: any) => ({
    signalKey: signal.signal_key,
    source: signal.source,
    sourceUrl: signal.source_url,
    title: signal.title,
    summary: signal.summary,
    region: signal.region,
    signalType: signal.signal_type,
    severity: signal.severity,
    confidence: signal.confidence,
    observedAt: signal.observed_at,
    metadata: signal.metadata || null,
    sourceAuditCount: sourceSweepAuditCount({
      signal_type: signal.signal_type,
      metadata: signal.metadata || null,
    }) || undefined,
    sourceAuditSources: Array.isArray(signal.metadata?.checkedSources)
      ? signal.metadata.checkedSources.map((source: any) => source?.source).filter(Boolean)
      : undefined,
  }))
  const signalBackedArticles = signals
    .filter((signal) => signal.signalType === 'news_corroboration' && signal.region && signal.title)
    .map((signal) => {
      const articleTimestamp = signal.observedAt || timestamp
      const source = signal.source || 'VesselSurge source signal'
      const summary = signal.summary || ''

      return {
        id: `signal-${signal.signalKey}`,
        title: signal.title,
        summary,
        source,
        sourceUrl: signal.sourceUrl || '',
        category: 'source_signal',
        region: signal.region || 'global',
        timestamp: articleTimestamp,
        isBreaking: false,
        sourceQualityLabel: maritimeSourceQualityLabel(source),
        sourceQualityScore: maritimeSourceQualityScore(source),
        sourceQualityTier: maritimeSourceQualityTier(source),
        freshnessScore: maritimeFreshnessScore(articleTimestamp),
        intelligenceScore: maritimeArticleIntelligenceScore({
          source,
          timestamp: articleTimestamp,
          title: signal.title,
          summary,
          region: signal.region || 'global',
        }),
      }
    })
  const reviewedCandidates = dedupeArticles([...rawArticles, ...signalBackedArticles]).map((article) => ({
    ...article,
    ...reviewArticleForLiveMap(article),
  }))
  const reviewGate = reviewGateSummary(reviewedCandidates)
  const articles = balanceDashboardArticles(reviewedCandidates.filter((article) => article.reviewStatus !== 'blocked'))

  const articleStats = articles.reduce((acc: Record<string, { reports: number; sources: Set<string>; latestSource: string | null; articles: any[] }>, article: any) => {
    const region = article.region || 'global'
    if (!acc[region]) acc[region] = { reports: 0, sources: new Set(), latestSource: null, articles: [] }
    acc[region].reports += 1
    acc[region].articles.push(article)
    if (article.source) acc[region].sources.add(article.source)
    if (!acc[region].latestSource && article.source) acc[region].latestSource = article.source
    return acc
  }, {})

  const signalStats = (signalsData || []).reduce((acc: Record<string, { signals: any[] }>, signal: any) => {
    const region = signal.region || 'global'
    if (!acc[region]) acc[region] = { signals: [] }
    acc[region].signals.push(signal)
    return acc
  }, {})

  const statsByHotspot = new Map((hotspotsData || []).map((hotspot: any) => [hotspot.hotspot, hotspot]))
  const hotspots = LIVE_HOTSPOTS.map((hotspotId) => {
    const hotspot = statsByHotspot.get(hotspotId) || {
      id: `derived-${hotspotId}`,
      hotspot: hotspotId,
      active_vessels: 0,
      daily_transits: 0,
      avg_wait_time: 'Source review',
      market_volume: 0,
      risk_level: 'low',
      updated_at: timestamp,
    }
    const activeVessels = vesselCounts ? (vesselCounts[hotspot.hotspot] || 0) : (hotspot.active_vessels || 0)
    const regionSignals = signalStats[hotspot.hotspot]?.signals || []
    const actionableSignals = regionSignals.filter((signal) => signal.signal_type !== 'source_sweep')
    const officialSignalCount = regionSignals.filter((signal) => signal.signal_type === 'official_alert' || signal.signal_type === 'navigation_warning').length
    const aisSignalCount = regionSignals.filter((signal) => signal.signal_type === 'ais_anomaly').length
    const reports = articleStats[hotspot.hotspot]?.reports || 0
    const sourceSweepOnly = regionSignals.some((signal) => signal.signal_type === 'source_sweep') && actionableSignals.length === 0 && reports === 0
    const sourceCount = articleStats[hotspot.hotspot]?.sources.size || 0
    const latestSource = articleStats[hotspot.hotspot]?.latestSource || null
    const derivedRiskLevel = deriveEvidenceRiskLevel({
      articles: articleStats[hotspot.hotspot]?.articles || [],
      signals: regionSignals,
      sourceCount,
      fallbackRiskLevel: regionSignals.some((signal) => signal.signal_type === 'source_sweep') ? 'low' : hotspot.risk_level,
    })
    const confidenceScore = confidenceForHotspot({
      reports,
      sources: articleStats[hotspot.hotspot]?.sources || new Set(),
      signals: regionSignals,
      activeVessels,
    })
    const riskEvidence = riskSummaryForHotspot({
      riskLevel: derivedRiskLevel,
      reports,
      sourceCount,
      signals: regionSignals,
      latestSource,
      activeVessels,
    })

    return {
      id: hotspot.id,
      hotspot: hotspot.hotspot,
      activeVessels,
      dailyTransits: hotspot.daily_transits,
      avgWaitTime: hotspot.avg_wait_time,
      marketVolume: hotspot.market_volume,
      riskLevel: derivedRiskLevel,
      updatedAt: hotspot.updated_at || timestamp,
      verifiedReports: reports,
      sourceCount,
      latestSource,
      signalCount: regionSignals.length,
      officialSignalCount,
      aisSignalCount,
      confidenceScore,
      confidenceLabel: confidenceLabelForHotspot(confidenceScore, { officialSignalCount, aisSignalCount, sourceSweepOnly }),
      riskSummary: riskEvidence.riskSummary,
      riskDrivers: riskEvidence.riskDrivers,
    }
  })
  const qualityAudit = buildQualityAudit(hotspots, articles, signals, reviewGate)

  return {
    success: true,
    data: {
      articles,
      hotspots,
      signals,
      timestamp,
      count: { articles: articles.length, hotspots: hotspots.length, signals: signals.length },
      qualityAudit,
    },
    meta: {
      version: '3.4.1-reviewed-live-map',
      source: 'VesselSurge Maritime Data API',
      cacheControl: 'public, s-maxage=30, stale-while-revalidate=120',
      cached: false,
    },
  }
}

export async function getFreshMaritimeDashboardCache(supabase: SupabaseClient) {
  const row = await getMaritimeDashboardCacheRow(supabase, 1400)

  if (!row) return null

  const generatedAt = new Date(row.generated_at).getTime()
  if (!Number.isFinite(generatedAt) || Date.now() - generatedAt > CACHE_TTL_MS) return null

  return {
    ...row.payload,
    meta: {
      ...(row.payload.meta || {}),
      cached: true,
      generatedAt: row.generated_at,
    },
  }
}

export async function getLastMaritimeDashboardCache(supabase: SupabaseClient, reason = 'serving last known VesselSurge cache') {
  const row = await getMaritimeDashboardCacheRow(supabase, 1400)

  if (!row) return null

  const generatedAt = new Date(row.generated_at).getTime()
  if (!Number.isFinite(generatedAt) || Date.now() - generatedAt > STALE_CACHE_TTL_MS) return null

  return {
    ...row.payload,
    meta: {
      ...(row.payload.meta || {}),
      cached: true,
      generatedAt: row.generated_at,
      stale: true,
      staleReason: reason,
    },
  }
}

export async function upsertMaritimeDashboardCache(supabase: SupabaseClient) {
  try {
    const payload = await buildMaritimeDashboardPayload(supabase)
    return upsertMaritimeDashboardCachePayload(supabase, payload)
  } catch (error) {
    console.warn('[maritime-data] Dashboard cache build skipped:', error)
    return false
  }
}

export async function upsertMaritimeDashboardCachePayload(supabase: SupabaseClient, payload: MaritimeDashboardResponse) {
  const generatedAt = payload.data.timestamp
  const row = {
    payload: {
      ...payload,
      meta: { ...payload.meta, cached: true, generatedAt },
    },
    generated_at: generatedAt,
  }

  if (await upsertDashboardCacheRowViaRedis(row)) return true

  const { error } = await supabase
    .from('maritime_dashboard_cache')
    .upsert(
      {
        cache_key: CACHE_KEY,
        payload: row.payload,
        generated_at: generatedAt,
        updated_at: generatedAt,
      },
      { onConflict: 'cache_key' },
    )

  if (error) {
    console.warn('[maritime-data] Dashboard cache upsert skipped:', error.message)
    return false
  }

  return true
}
