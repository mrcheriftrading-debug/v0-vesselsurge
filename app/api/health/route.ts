import { NextResponse } from 'next/server'
import { buildOfflineMaritimeDashboardSnapshot } from '@/lib/maritime-offline-snapshot'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const HOTSPOTS = ['hormuz', 'bab', 'suez', 'malacca'] as const
const CACHE_DEGRADED_MS = 10 * 60 * 1000
const CACHE_UNHEALTHY_MS = 30 * 60 * 1000
const AIS_DEGRADED_MS = 2 * 60 * 60 * 1000
const WATCH_DEGRADED_MS = 15 * 60 * 1000
const WATCH_UNHEALTHY_MS = 60 * 60 * 1000

type Status = 'ok' | 'degraded' | 'unhealthy'

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

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function offlineHealthResponse(error: string) {
  const snapshot = buildOfflineMaritimeDashboardSnapshot('health check could not reach live data; bundled archive remains available')

  return NextResponse.json(
    {
      success: true,
      status: 'degraded',
      checkedAt: new Date().toISOString(),
      warning: error,
      components: {
        server: { status: 'ok' },
        offlineArchive: {
          status: 'ok',
          generatedAt: snapshot.meta.generatedAt,
          articles: snapshot.data.count.articles,
          hotspots: snapshot.data.count.hotspots,
          signals: snapshot.data.count.signals,
        },
        database: { status: 'degraded' },
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const cacheResult = await withTimeout(
      supabase
        .from('maritime_dashboard_cache')
        .select('payload,generated_at')
        .eq('cache_key', 'live-map')
        .maybeSingle(),
      1800,
      'health cache query',
    )

    const errors = [cacheResult.error]
      .filter(Boolean)
      .map((error) => error?.message || 'Unknown Supabase error')

    if (errors.length > 0) {
      return offlineHealthResponse(errors.join('; '))
    }

    const cacheAge = ageMs(cacheResult.data?.generated_at)
    const cachePayload = (cacheResult.data?.payload || {}) as {
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
      }
    }
    const hotspotRows = cachePayload.data?.hotspots || []
    const newsRows = cachePayload.data?.articles || []
    const signalRows = cachePayload.data?.signals || []
    const latestAisSignalAt = signalRows
      .filter((row) => row.signalType === 'ais_anomaly' && row.observedAt)
      .map((row) => row.observedAt as string)
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0]
    const aisLatestAt = latestAisSignalAt || cacheResult.data?.generated_at || null
    const aisAge = ageMs(aisLatestAt)
    const watchLatestAt = cacheResult.data?.generated_at || null
    const watchAge = ageMs(watchLatestAt)
    const hotspotSummary = HOTSPOTS.map((hotspot) => {
      const stats = hotspotRows.find((row) => row.hotspot === hotspot)
      const latestNews = newsRows.find((row) => row.region === hotspot)
      const latestSignal = signalRows.find((row) => row.region === hotspot)
      const hasRecentNews = ageMs(latestNews?.timestamp) < 7 * 24 * 60 * 60 * 1000
      const hasRecentSignal = ageMs(latestSignal?.observedAt) < 6 * 60 * 60 * 1000

      return {
        hotspot,
        riskLevel: stats?.riskLevel || 'unknown',
        statsUpdatedAt: stats?.updatedAt || null,
        latestNewsAt: latestNews?.timestamp || null,
        latestSignalAt: latestSignal?.observedAt || null,
        latestSignalType: latestSignal?.signalType || null,
        hasRecentNews,
        hasRecentSignal,
        hasRecentCoverage: hasRecentNews || hasRecentSignal,
      }
    })

    const coverageStatus: Status = hotspotSummary.every((row) => row.hasRecentCoverage) ? 'ok' : 'degraded'
    const componentStatuses = {
      cache: statusFromAge(cacheAge, CACHE_DEGRADED_MS, CACHE_UNHEALTHY_MS),
      ais: statusFromAge(aisAge, AIS_DEGRADED_MS, 6 * 60 * 60 * 1000),
      watch: statusFromAge(watchAge, WATCH_DEGRADED_MS, WATCH_UNHEALTHY_MS),
      coverage: coverageStatus,
      hotspots: hotspotRows.length === HOTSPOTS.length ? 'ok' as Status : 'unhealthy' as Status,
    }
    const status = worstStatus(Object.values(componentStatuses))

    return NextResponse.json(
      {
        success: status !== 'unhealthy',
        status,
        checkedAt: new Date().toISOString(),
        components: {
          cache: {
            status: componentStatuses.cache,
            generatedAt: cacheResult.data?.generated_at || null,
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
        },
      },
      {
        status: status === 'unhealthy' ? 503 : 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  } catch (error) {
    return offlineHealthResponse(error instanceof Error ? error.message : 'Health check failed')
  }
}
