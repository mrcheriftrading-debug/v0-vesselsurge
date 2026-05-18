import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

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

async function fetchVesselCounts(supabase: any) {
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

export async function GET() {
  try {
    const supabase = createAdminClient()
    const now = new Date()
    const timestamp = now.toISOString()
    const signalCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const [articlesResult, hotspotsResult, signalsResult, vesselCounts] = await Promise.all([
      supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(48),
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
      return NextResponse.json(
        { success: false, error: 'Failed to fetch maritime data' },
        { status: 500 }
      )
    }

    // Transform articles
    const articles = (articlesData || []).map((article: any) => ({
      id: article.id,
      title: article.title,
      summary: article.summary || article.description || article.snippet,
      source: article.source,
      sourceUrl: article.source_url || article.url,
      category: article.category || 'industry',
      region: article.region || 'global',
      timestamp: article.published_at || article.created_at || timestamp,
      isBreaking: article.is_breaking || false,
    }))

    const articleStats = articles.reduce((acc: Record<string, { reports: number; sources: Set<string>; latestSource: string | null }>, article: any) => {
      const region = article.region || 'global'
      if (!acc[region]) acc[region] = { reports: 0, sources: new Set(), latestSource: null }
      acc[region].reports += 1
      if (article.source) acc[region].sources.add(article.source)
      if (!acc[region].latestSource && article.source) acc[region].latestSource = article.source
      return acc
    }, {})

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

    const signalStats = (signalsData || []).reduce((acc: Record<string, { signals: any[] }>, signal: any) => {
      const region = signal.region || 'global'
      if (!acc[region]) acc[region] = { signals: [] }
      acc[region].signals.push(signal)
      return acc
    }, {})

    // Transform hotspots with correct vessel counts
    const hotspots = (hotspotsData || []).map((hotspot: any) => {
      const activeVessels = vesselCounts ? (vesselCounts[hotspot.hotspot] || 0) : (hotspot.active_vessels || 0)
      const regionSignals = signalStats[hotspot.hotspot]?.signals || []
      const officialSignalCount = regionSignals.filter((signal) => signal.signal_type === 'official_alert' || signal.signal_type === 'navigation_warning').length
      const aisSignalCount = regionSignals.filter((signal) => signal.signal_type === 'ais_anomaly').length
      const confidenceScore = confidenceForHotspot({
        reports: articleStats[hotspot.hotspot]?.reports || 0,
        sources: articleStats[hotspot.hotspot]?.sources || new Set(),
        signals: regionSignals,
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
        verifiedReports: articleStats[hotspot.hotspot]?.reports || 0,
        sourceCount: articleStats[hotspot.hotspot]?.sources.size || 0,
        latestSource: articleStats[hotspot.hotspot]?.latestSource || null,
        signalCount: regionSignals.length,
        officialSignalCount,
        aisSignalCount,
        confidenceScore,
        confidenceLabel: confidenceLabelForHotspot(confidenceScore, { officialSignalCount, aisSignalCount }),
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          articles,
          hotspots,
          signals,
          timestamp,
          count: { articles: articles.length, hotspots: hotspots.length, signals: signals.length },
        },
        meta: {
          version: '3.0.0',
          source: 'VesselSurge Maritime Data API',
          cacheControl: 'public, s-maxage=30, stale-while-revalidate=120',
          cached: false,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  } catch (error) {
    console.error('[v0] Maritime data API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maritime data' },
      { status: 500 }
    )
  }
}
