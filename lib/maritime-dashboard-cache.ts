import type { SupabaseClient } from '@supabase/supabase-js'
import {
  maritimeArticleIntelligenceScore,
  maritimeFreshnessScore,
  maritimeSourceQualityLabel,
  maritimeSourceQualityScore,
  maritimeSourceQualityTier,
} from '@/lib/maritime-source-quality'

const CACHE_KEY = 'live-map'
const CACHE_TTL_MS = 5 * 60 * 1000
const STALE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const LIVE_HOTSPOTS = ['hormuz', 'bab', 'suez', 'malacca']

type DashboardCacheRow = {
  payload: MaritimeDashboardResponse
  generated_at: string
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

export async function getMaritimeDashboardCacheRow(supabase?: SupabaseClient, timeoutMs = 1400) {
  return (
    await getDashboardCacheRowViaRest(timeoutMs) ||
    (supabase ? await getDashboardCacheRowViaClient(supabase, timeoutMs, 'maritime dashboard cache row') : null)
  )
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

function confidenceLabelForHotspot(score: number, stats: { officialSignalCount: number; aisSignalCount: number }) {
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
    : `${stats.riskLevel.toUpperCase()} from standing watch coverage while fresh direct signals are thin.`

  return {
    riskSummary,
    riskDrivers: uniqueDrivers.length > 0 ? uniqueDrivers : ['Standing watch coverage active'],
  }
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
) {
  const sourceMix = {
    official: 0,
    tierOne: 0,
    trade: 0,
    search: 0,
    general: 0,
    watch: 0,
  }

  for (const article of articles) {
    const tier = maritimeSourceQualityTier(article.source) as keyof typeof sourceMix
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
    const sourceCount = Math.max(
      hotspot.sourceCount || 0,
      new Set([
        ...hotspotArticles.map((article) => article.source),
        ...hotspotSignals.map((signal) => signal.source),
      ].filter(Boolean)).size,
    )
    const score = qualityCoverageScore({
      latestNewsAt,
      latestSignalAt,
      sourceCount,
      riskDrivers: hotspot.riskDrivers || [],
    })
    const missing = [
      hoursOld(latestNewsAt) !== null && (hoursOld(latestNewsAt) || 999) <= 24 ? null : 'fresh news under 24h',
      hoursOld(latestSignalAt) !== null && (hoursOld(latestSignalAt) || 999) <= 12 ? null : 'fresh signal under 12h',
      sourceCount >= 2 ? null : 'second independent source',
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
  ].filter(Boolean) as string[]

  return {
    status: watchRows.length > 1 ? 'degraded' as const : watchRows.length === 1 ? 'watch' as const : 'healthy' as const,
    sourceMix,
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
      .select('signal_key,source,source_url,title,summary,region,signal_type,severity,confidence,observed_at')
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
  const articles = balanceDashboardArticles(dedupeArticles([...rawArticles, ...signalBackedArticles]))

  const articleStats = articles.reduce((acc: Record<string, { reports: number; sources: Set<string>; latestSource: string | null }>, article: any) => {
    const region = article.region || 'global'
    if (!acc[region]) acc[region] = { reports: 0, sources: new Set(), latestSource: null }
    acc[region].reports += 1
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

  const hotspots = (hotspotsData || []).map((hotspot: any) => {
    const activeVessels = vesselCounts ? (vesselCounts[hotspot.hotspot] || 0) : (hotspot.active_vessels || 0)
    const regionSignals = signalStats[hotspot.hotspot]?.signals || []
    const officialSignalCount = regionSignals.filter((signal) => signal.signal_type === 'official_alert' || signal.signal_type === 'navigation_warning').length
    const aisSignalCount = regionSignals.filter((signal) => signal.signal_type === 'ais_anomaly').length
    const reports = articleStats[hotspot.hotspot]?.reports || 0
    const sourceCount = articleStats[hotspot.hotspot]?.sources.size || 0
    const latestSource = articleStats[hotspot.hotspot]?.latestSource || null
    const confidenceScore = confidenceForHotspot({
      reports,
      sources: articleStats[hotspot.hotspot]?.sources || new Set(),
      signals: regionSignals,
      activeVessels,
    })
    const riskEvidence = riskSummaryForHotspot({
      riskLevel: hotspot.risk_level,
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
      riskLevel: hotspot.risk_level,
      updatedAt: hotspot.updated_at || timestamp,
      verifiedReports: reports,
      sourceCount,
      latestSource,
      signalCount: regionSignals.length,
      officialSignalCount,
      aisSignalCount,
      confidenceScore,
      confidenceLabel: confidenceLabelForHotspot(confidenceScore, { officialSignalCount, aisSignalCount }),
      riskSummary: riskEvidence.riskSummary,
      riskDrivers: riskEvidence.riskDrivers,
    }
  })
  const qualityAudit = buildQualityAudit(hotspots, articles, signals)

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
      version: '3.1.0',
      source: 'VesselSurge Maritime Data API',
      cacheControl: 'public, s-maxage=30, stale-while-revalidate=120',
      cached: false,
    },
  }
}

export async function getFreshMaritimeDashboardCache(supabase: SupabaseClient) {
  const row =
    await getDashboardCacheRowViaRest(1400) ||
    await getDashboardCacheRowViaClient(supabase, 1200, 'fresh maritime dashboard cache')

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
  const row =
    await getDashboardCacheRowViaRest(1400) ||
    await getDashboardCacheRowViaClient(supabase, 1200, 'last maritime dashboard cache')

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
    const generatedAt = payload.data.timestamp
    const { error } = await supabase
      .from('maritime_dashboard_cache')
      .upsert(
        {
          cache_key: CACHE_KEY,
          payload: {
            ...payload,
            meta: { ...payload.meta, cached: true, generatedAt },
          },
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
  } catch (error) {
    console.warn('[maritime-data] Dashboard cache build skipped:', error)
    return false
  }
}
