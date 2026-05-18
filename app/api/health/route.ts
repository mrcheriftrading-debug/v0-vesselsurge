import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    const supabase = createAdminClient()

    const [cacheResult, vesselResult, hotspotStatsResult, newsResult, signalsResult, watchResult] = await Promise.all([
      supabase
        .from('maritime_dashboard_cache')
        .select('generated_at')
        .eq('cache_key', 'live-map')
        .maybeSingle(),
      supabase
        .from('vessels')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('hotspot_stats')
        .select('hotspot,risk_level,updated_at')
        .in('hotspot', [...HOTSPOTS]),
      supabase
        .from('news_articles')
        .select('region,published_at')
        .in('region', [...HOTSPOTS])
        .order('published_at', { ascending: false })
        .limit(60),
      supabase
        .from('maritime_signals')
        .select('region,signal_type,severity,observed_at')
        .in('region', [...HOTSPOTS])
        .order('observed_at', { ascending: false })
        .limit(80),
      supabase
        .from('ingestion_state')
        .select('value,updated_at')
        .eq('key', 'maritime-watch')
        .maybeSingle(),
    ])

    const errors = [cacheResult.error, vesselResult.error, hotspotStatsResult.error, newsResult.error, signalsResult.error, watchResult.error]
      .filter(Boolean)
      .map((error) => error?.message || 'Unknown Supabase error')

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          status: 'unhealthy',
          checkedAt: new Date().toISOString(),
          errors,
        },
        { status: 503 },
      )
    }

    const cacheAge = ageMs(cacheResult.data?.generated_at)
    const aisAge = ageMs(vesselResult.data?.updated_at)
    const watchValue = (watchResult.data?.value || {}) as { lastCompletedAt?: string; lastHeavyUpdateAt?: string; lastSkipReason?: string }
    const watchAge = ageMs(watchValue.lastCompletedAt || watchResult.data?.updated_at)

    const hotspotRows = hotspotStatsResult.data || []
    const newsRows = newsResult.data || []
    const signalRows = signalsResult.data || []
    const hotspotSummary = HOTSPOTS.map((hotspot) => {
      const stats = hotspotRows.find((row) => row.hotspot === hotspot)
      const latestNews = newsRows.find((row) => row.region === hotspot)
      const latestSignal = signalRows.find((row) => row.region === hotspot)
      const hasRecentNews = ageMs(latestNews?.published_at) < 7 * 24 * 60 * 60 * 1000
      const hasRecentSignal = ageMs(latestSignal?.observed_at) < 6 * 60 * 60 * 1000

      return {
        hotspot,
        riskLevel: stats?.risk_level || 'unknown',
        statsUpdatedAt: stats?.updated_at || null,
        latestNewsAt: latestNews?.published_at || null,
        latestSignalAt: latestSignal?.observed_at || null,
        latestSignalType: latestSignal?.signal_type || null,
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
            latestAt: vesselResult.data?.updated_at || null,
            ageSeconds: Number.isFinite(aisAge) ? Math.round(aisAge / 1000) : null,
          },
          watch: {
            status: componentStatuses.watch,
            lastCompletedAt: watchValue.lastCompletedAt || null,
            lastHeavyUpdateAt: watchValue.lastHeavyUpdateAt || null,
            lastSkipReason: watchValue.lastSkipReason || null,
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
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 },
    )
  }
}
