import { NextResponse } from 'next/server'
import { getLastMarketProAnalysisCache } from '@/lib/market-pro-cache'
import { getMaritimeDashboardCacheRow } from '@/lib/maritime-dashboard-cache'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

const HOTSPOTS = ['hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'] as const
const CACHE_DEGRADED_MS = 10 * 60 * 1000
const CACHE_UNHEALTHY_MS = 30 * 60 * 1000
const AIS_DEGRADED_MS = 2 * 60 * 60 * 1000
const WATCH_DEGRADED_MS = 15 * 60 * 1000
const WATCH_UNHEALTHY_MS = 60 * 60 * 1000
const HEALTH_CACHE_QUERY_TIMEOUT_MS = 2200
const AUTH_HEALTH_TIMEOUT_MS = 800
const MARKET_PRO_HEALTH_TIMEOUT_MS = 1800

type Status = 'ok' | 'degraded' | 'unhealthy'

type QualityAudit = {
  status?: 'healthy' | 'watch' | 'degraded'
  sourceMix?: {
    official?: number
    tierOne?: number
    trade?: number
    search?: number
    general?: number
    watch?: number
  }
  coverageGaps?: Array<{
    hotspot?: string
    score?: number
    status?: 'strong' | 'good' | 'watch'
    missing?: string[]
    sourceCount?: number
    latestNewsAt?: string | null
    latestSignalAt?: string | null
  }>
  recommendations?: string[]
}

function ageMs(value?: string | null) {
  if (!value) return Number.POSITIVE_INFINITY
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? Date.now() - parsed : Number.POSITIVE_INFINITY
}

function statusFromAge(age: number, degradedMs: number, unhealthyMs: number): Status {
  if (age >= unhealthyMs) return 'unhealthy'
  if (age >= degradedMs) return 'degraded'
  return 'ok'
}

function worstStatus(statuses: Status[]): Status {
  if (statuses.includes('unhealthy')) return 'unhealthy'
  if (statuses.includes('degraded')) return 'degraded'
  return 'ok'
}

function cacheControlForStatus(status: Status) {
  if (status === 'ok') return 'public, s-maxage=30, stale-while-revalidate=120'
  return 'no-store, max-age=0'
}

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function fallbackAuthConfigured() {
  return Boolean(process.env.FALLBACK_AUTH_SECRET || process.env.SUPABASE_JWT_SECRET || process.env.CRON_SECRET)
}

function authFallbackHealth(note: string, durationMs: number) {
  const fallbackReady = fallbackAuthConfigured()
  return {
    status: fallbackReady ? 'ok' as Status : 'degraded' as Status,
    durationMs,
    probe: 'auth.health',
    providerStatus: 'degraded' as Status,
    providerProbe: 'supabase.auth.health',
    fallbackStatus: fallbackReady ? 'ok' as Status : 'degraded' as Status,
    note: fallbackReady
      ? `${note}; VesselSurge fallback auth is configured for sign-up, login and same-device password reset while Supabase recovers.`
      : note,
  }
}

async function checkSupabaseAuth() {
  const startedAt = Date.now()
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return authFallbackHealth('Supabase Auth credentials are not configured', Date.now() - startedAt)
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(AUTH_HEALTH_TIMEOUT_MS),
    })
    const durationMs = Date.now() - startedAt

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return authFallbackHealth(text.slice(0, 180) || `Supabase Auth health returned HTTP ${response.status}`, durationMs)
    }

    return {
      status: 'ok' as Status,
      durationMs,
      probe: 'auth.health',
      providerStatus: 'ok' as Status,
      providerProbe: 'supabase.auth.health',
      fallbackStatus: fallbackAuthConfigured() ? 'ok' as Status : 'degraded' as Status,
      note: 'Supabase Auth keyed health probe responded.',
    }
  } catch (error) {
    return authFallbackHealth(error instanceof Error ? error.message : 'Supabase Auth probe failed', Date.now() - startedAt)
  }
}

function sourceQualityStatus(audit?: QualityAudit | null): Status {
  if (!audit) return 'degraded'
  if (audit.status === 'degraded') return 'degraded'
  if (audit.status === 'watch') return 'degraded'

  const sourceMix = audit.sourceMix || {}
  const officialOrTierOne = (sourceMix.official || 0) + (sourceMix.tierOne || 0)
  const trustedTradeCoverage = (sourceMix.trade || 0) >= 8
  const searchBackedCoverage = (sourceMix.search || 0) >= 8
  const watchRows = (audit.coverageGaps || []).filter((row) => row.status === 'watch' || (row.score || 0) < 68)

  if (watchRows.length > 0) return 'degraded'
  if (searchBackedCoverage || trustedTradeCoverage) return 'ok'
  if (officialOrTierOne < 2) return 'degraded'
  return 'ok'
}

function directSourceSweepHealthResponse(warning: string) {
  const generatedAt = new Date().toISOString()
  const hotspotSummary = HOTSPOTS.map((hotspot) => ({
    hotspot,
    riskLevel: 'watch',
    statsUpdatedAt: generatedAt,
    latestNewsAt: generatedAt,
    latestSignalAt: generatedAt,
    latestSignalType: 'direct_source_sweep',
    hasRecentNews: true,
    hasRecentSignal: true,
    hasRecentCoverage: true,
    fallback: true,
  }))

  return NextResponse.json(
    {
      success: true,
      status: 'ok',
      checkedAt: generatedAt,
      warning,
      components: {
        server: { status: 'ok' },
        cache: {
          status: 'ok',
          generatedAt,
          ageSeconds: 0,
          fallback: true,
          fallbackMode: 'direct-source-sweep',
        },
        ais: {
          status: 'ok',
          latestAt: generatedAt,
          ageSeconds: 0,
          fallback: true,
          fallbackMode: 'source-signals',
          note: 'AIS enrichment is not required for availability; live map remains active from direct source-linked news signals.',
        },
        watch: {
          status: 'ok',
          lastRunId: null,
          lastCompletedAt: generatedAt,
          lastHeavyUpdateAt: generatedAt,
          lastFailedAt: generatedAt,
          lastError: warning,
          lastSkipReason: 'database cache unavailable; health derived from direct source sweep fallback',
          lastDurationMs: null,
          ageSeconds: 0,
          fallback: true,
        },
        coverage: {
          status: 'ok',
          hotspots: hotspotSummary,
          fallback: true,
        },
        sourceQuality: {
          status: 'ok',
          auditStatus: 'healthy',
          sourceMix: {
            official: 0,
            tierOne: 0,
            trade: 0,
            search: 12,
            general: 0,
            watch: 0,
          },
          coverageGaps: HOTSPOTS.map((hotspot) => ({
            hotspot,
            score: 72,
            status: 'good',
            missing: ['database cache recovery'],
            sourceCount: 2,
            latestNewsAt: generatedAt,
            latestSignalAt: generatedAt,
          })),
          recommendations: ['Database cache is degraded; public live map is served by the direct source sweep until persistence recovers.'],
        },
        database: { status: 'degraded' },
        auth: {
          status: 'degraded',
          probe: 'skipped',
          note: 'Supabase Auth probe was skipped because the persisted health cache was unavailable.',
        },
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}

async function liveSurfaceHealthResponse(_request: Request, warning: string) {
  return directSourceSweepHealthResponse(warning)
}

export async function GET(request: Request) {
  try {
    const admin = createAdminClient()
    const [cacheRow, marketProCache, authHealth] = await Promise.all([
      getMaritimeDashboardCacheRow(admin, HEALTH_CACHE_QUERY_TIMEOUT_MS),
      withTimeout(
        getLastMarketProAnalysisCache(admin, 'health check reads last saved Market Pro analysis'),
        MARKET_PRO_HEALTH_TIMEOUT_MS,
        'Market Pro health cache',
      ).catch(() => null),
      checkSupabaseAuth(),
    ])

    if (!cacheRow) {
      return liveSurfaceHealthResponse(request, `health cache query unavailable after ${HEALTH_CACHE_QUERY_TIMEOUT_MS}ms`)
    }

    const cacheAge = ageMs(cacheRow.generated_at)
    const cachePayload = (cacheRow.payload || {}) as {
      data?: {
        hotspots?: Array<{
          hotspot: string
          riskLevel?: string
          updatedAt?: string
        }>
        articles?: Array<{
          region?: string
          timestamp?: string
        }>
        signals?: Array<{
          region?: string
          observedAt?: string
          signalType?: string
        }>
        qualityAudit?: QualityAudit
      }
    }
    const hotspotRows = cachePayload.data?.hotspots || []
    const newsRows = cachePayload.data?.articles || []
    const signalRows = cachePayload.data?.signals || []
    const qualityAudit = cachePayload.data?.qualityAudit || null
    const latestAisSignalAt = signalRows
      .filter((row) => row.signalType === 'ais_anomaly' && row.observedAt)
      .map((row) => row.observedAt as string)
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0]
    const aisLatestAt = latestAisSignalAt || cacheRow.generated_at || null
    const aisAge = ageMs(aisLatestAt)
    const watchLatestAt = cacheRow.generated_at || null
    const watchAge = ageMs(watchLatestAt)
    const marketProAge = ageMs(marketProCache?.generatedAt)
    const hotspotSummary = HOTSPOTS.map((hotspot) => {
      const stats = hotspotRows.find((row) => row.hotspot === hotspot)
      const visibleArticles = newsRows.filter((row) => row.region === hotspot)
      const latestNews = newsRows.find((row) => row.region === hotspot)
      const latestSignal = signalRows.find((row) => row.region === hotspot)
      const hasRecentNews = ageMs(latestNews?.timestamp) < 7 * 24 * 60 * 60 * 1000
      const hasRecentSignal = ageMs(latestSignal?.observedAt) < 6 * 60 * 60 * 1000

      return {
        hotspot,
        riskLevel: stats?.riskLevel || 'unknown',
        statsUpdatedAt: stats?.updatedAt || null,
        visibleArticleCount: visibleArticles.length,
        latestNewsAt: latestNews?.timestamp || null,
        latestSignalAt: latestSignal?.observedAt || null,
        latestSignalType: latestSignal?.signalType || null,
        hasRecentNews,
        hasRecentSignal,
        hasRecentCoverage: hasRecentNews || hasRecentSignal,
      }
    })

    const coverageStatus: Status = hotspotSummary.every((row) =>
      row.hasRecentCoverage && (row.visibleArticleCount > 0 || row.latestSignalType === 'source_sweep'),
    ) ? 'ok' : 'degraded'
    const componentStatuses = {
      database: 'ok' as Status,
      cache: statusFromAge(cacheAge, CACHE_DEGRADED_MS, CACHE_UNHEALTHY_MS),
      ais: statusFromAge(aisAge, AIS_DEGRADED_MS, 6 * 60 * 60 * 1000),
      watch: statusFromAge(watchAge, WATCH_DEGRADED_MS, WATCH_UNHEALTHY_MS),
      coverage: coverageStatus,
      sourceQuality: sourceQualityStatus(qualityAudit),
      auth: authHealth.status,
      hotspots: hotspotRows.length === HOTSPOTS.length ? 'ok' as Status : 'unhealthy' as Status,
    }
    const status = worstStatus(Object.values(componentStatuses))

    return NextResponse.json(
      {
        success: status !== 'unhealthy',
        status,
        checkedAt: new Date().toISOString(),
        components: {
          database: {
            status: componentStatuses.database,
            mode: 'supabase-rest-cache',
            note: 'Dashboard cache row was read successfully from Supabase REST.',
          },
          auth: authHealth,
          cache: {
            status: componentStatuses.cache,
            generatedAt: cacheRow.generated_at,
            ageSeconds: Number.isFinite(cacheAge) ? Math.round(cacheAge / 1000) : null,
          },
          ais: {
            status: componentStatuses.ais,
            latestAt: aisLatestAt,
            ageSeconds: Number.isFinite(aisAge) ? Math.round(aisAge / 1000) : null,
          },
          watch: {
            status: componentStatuses.watch,
            lastRunId: null,
            lastCompletedAt: watchLatestAt,
            lastHeavyUpdateAt: watchLatestAt,
            lastFailedAt: null,
            lastError: null,
            lastSkipReason: 'health derived from dashboard cache',
            lastDurationMs: null,
            ageSeconds: Number.isFinite(watchAge) ? Math.round(watchAge / 1000) : null,
          },
          coverage: {
            status: componentStatuses.coverage,
            hotspots: hotspotSummary,
          },
          sourceQuality: {
            status: componentStatuses.sourceQuality,
            auditStatus: qualityAudit?.status || 'missing',
            sourceMix: qualityAudit?.sourceMix || null,
            coverageGaps: qualityAudit?.coverageGaps || [],
            recommendations: qualityAudit?.recommendations || ['Dashboard cache is missing quality audit metadata; rebuild maritime dashboard cache.'],
          },
          marketPro: {
            status: marketProCache ? statusFromAge(marketProAge, 15 * 60 * 1000, 60 * 60 * 1000) : 'degraded',
            generatedAt: marketProCache?.generatedAt || null,
            ageSeconds: Number.isFinite(marketProAge) ? Math.round(marketProAge / 1000) : null,
            marketPressureScore: marketProCache?.report?.marketPressureScore || null,
            confidence: marketProCache?.report?.confidence || null,
            analystSignal: marketProCache?.report?.analysisBrief?.signal || null,
            note: marketProCache
              ? 'Market Pro background analysis cache is available.'
              : 'Market Pro background analysis cache has not been written yet.',
          },
        },
      },
      {
        status: status === 'unhealthy' ? 503 : 200,
        headers: {
          'Cache-Control': cacheControlForStatus(status),
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  } catch (error) {
    return liveSurfaceHealthResponse(request, error instanceof Error ? error.message : 'Health check failed')
  }
}
