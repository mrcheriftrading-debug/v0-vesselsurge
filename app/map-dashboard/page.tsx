'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ExternalLink, RefreshCw, Radio, FileText, Database, AlertCircle, ShieldCheck, WifiOff } from 'lucide-react'
import { useMaritimeData } from '@/lib/use-maritime-data'
import { maritimeSourceQualityLabel, maritimeSourceQualityTier } from '@/lib/maritime-source-quality'
import { MapArrivalScan } from '@/components/maritime-motion-effects'
import { SiteNavigation } from '@/components/site-navigation'

const SatelliteMap = dynamic(() => import('@/components/satellite-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="h-8 w-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400 font-mono">Initialising satellite view...</p>
      </div>
    </div>
  ),
})

const HOTSPOT_META: Record<string, { lat: number; lng: number; name: string; flag: string }> = {
  hormuz:  { lat: 26.34,  lng: 56.47,  name: 'Strait of Hormuz',  flag: '🇮🇷' },
  bab:     { lat: 12.65,  lng: 43.32,  name: 'Bab el-Mandeb',     flag: '🇾🇪' },
  malacca: { lat: 2.45,   lng: 102.15, name: 'Strait of Malacca', flag: '🇲🇾' },
  suez:    { lat: 29.95,  lng: 32.58,  name: 'Suez Canal',        flag: '🇪🇬' },
  panama:  { lat: 9.08,   lng: -79.68, name: 'Panama Canal',      flag: '🇵🇦' },
  taiwan:  { lat: 24.4,   lng: 120.8,  name: 'Taiwan Strait',     flag: '🇹🇼' },
  turkish: { lat: 41.08,  lng: 29.05,  name: 'Turkish Straits',   flag: '🇹🇷' },
  gibraltar: { lat: 35.96, lng: -5.6,  name: 'Strait of Gibraltar', flag: '🇬🇮' },
  cape:    { lat: -34.36, lng: 18.47,  name: 'Cape of Good Hope', flag: '🇿🇦' },
}

const RISK_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

const RISK_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const RISK_BASIS: Record<string, string> = {
  critical: 'Critical means confirmed severe disruption, closure, attack impact, or major operational interruption.',
  high: 'High means direct vessel/security incident or multiple current reports with operational impact.',
  medium: 'Medium means verified route pressure, but no confirmed closure, attack impact, major delay, or traffic halt.',
  low: 'Low means the latest source sweep found no fresh source-backed disruption for this route.',
}

type FeedItem = {
  id: string
  title: string
  summary?: string | null
  source: string
  sourceUrl?: string | null
  timestamp: string
  type: 'report' | 'signal'
  label: string
  sourceQualityLabel?: string
  intelligenceScore?: number
  reviewStatus?: 'approved' | 'watch' | 'blocked'
  reviewReason?: string
  reviewScore?: number
}

const WATCH_COVERAGE: Record<string, Array<{ source: string; signalType: string; title: string; summary: string }>> = {
  hormuz: [
    {
      source: 'VesselSurge Hormuz Watch',
      signalType: 'oil route watch',
      title: 'Operational watch on Hormuz tanker flow and Gulf export routing',
      summary: 'Coverage tracks tanker movement, oil-route exposure, port pressure and verified regional reporting.',
    },
    {
      source: 'VesselSurge Insurance Watch',
      signalType: 'war risk watch',
      title: 'War-risk and freight signal layer active for Gulf-linked cargo',
      summary: 'VesselSurge keeps this layer ready for insurance, freight and chokepoint disruption signals.',
    },
  ],
  bab: [
    {
      source: 'VesselSurge Red Sea Watch',
      signalType: 'red sea watch',
      title: 'Operational watch on Bab el-Mandeb and southern Red Sea routing',
      summary: 'Coverage tracks rerouting pressure, security advisories, AIS context and Red Sea operating constraints.',
    },
    {
      source: 'VesselSurge Chokepoint Watch',
      signalType: 'chokepoint watch',
      title: 'Bab el-Mandeb cargo-vessel matching risk layer active',
      summary: 'VesselSurge keeps this corridor covered even when direct reports are temporarily thin.',
    },
  ],
  suez: [
    {
      source: 'VesselSurge Suez Watch',
      signalType: 'canal watch',
      title: 'Operational watch on Suez Canal transit and queue pressure',
      summary: 'Coverage tracks canal throughput, convoy movement, weather constraints and operational source updates.',
    },
    {
      source: 'VesselSurge Freight Watch',
      signalType: 'freight rate watch',
      title: 'Suez freight-rate and delay signal layer active',
      summary: 'VesselSurge monitors disruption signals that can affect Asia-Europe cargo planning.',
    },
  ],
  malacca: [
    {
      source: 'VesselSurge Malacca Watch',
      signalType: 'ais density watch',
      title: 'Operational watch on Malacca AIS density and tanker lanes',
      summary: 'Coverage tracks dense vessel movement, port approach pressure and Singapore-linked routing signals.',
    },
    {
      source: 'VesselSurge Port Watch',
      signalType: 'port flow watch',
      title: 'Malacca port-flow and cargo matching signal layer active',
      summary: 'VesselSurge keeps Southeast Asia chokepoint context visible for matching and route planning.',
    },
  ],
  panama: [
    {
      source: 'VesselSurge Panama Canal Source Sweep',
      signalType: 'canal transit context',
      title: 'Source sweep on Panama Canal transit and queue pressure',
      summary: 'Coverage tracks canal transit, water constraints, queues, maintenance windows and Atlantic-Pacific routing exposure.',
    },
  ],
  taiwan: [
    {
      source: 'VesselSurge Taiwan Strait Source Sweep',
      signalType: 'asia trade lane context',
      title: 'Source sweep on Taiwan Strait maritime and cargo continuity',
      summary: 'Coverage tracks maritime alerts, naval activity, port context and source-backed Asia cargo continuity signals.',
    },
  ],
  turkish: [
    {
      source: 'VesselSurge Turkish Straits Source Sweep',
      signalType: 'black sea route context',
      title: 'Source sweep on Bosporus, Dardanelles and Black Sea route risk',
      summary: 'Coverage tracks transit interruptions, weather holds, tanker constraints and Black Sea route exposure.',
    },
  ],
  gibraltar: [
    {
      source: 'VesselSurge Gibraltar Source Sweep',
      signalType: 'mediterranean entry context',
      title: 'Source sweep on Strait of Gibraltar vessel flow',
      summary: 'Coverage tracks Atlantic-Mediterranean entry flow, port approach pressure, congestion and security context.',
    },
  ],
  cape: [
    {
      source: 'VesselSurge Cape Route Source Sweep',
      signalType: 'rerouting context',
      title: 'Source sweep on Cape of Good Hope rerouting pressure',
      summary: 'Coverage tracks Red Sea bypass routing, voyage time, fuel burn and freight cost impact.',
    },
  ],
}

const STANDING_WATCH_TIMESTAMP = '2026-05-20T00:00:00.000Z'

function watchCoverageFor(region: string) {
  return WATCH_COVERAGE[region] || [{
    source: 'VesselSurge Source Sweep',
    signalType: 'source sweep',
    title: 'Maritime source sweep active',
    summary: 'VesselSurge keeps this route covered with source reports, operational signals and route context.',
  }]
}

function formatRelativePublishedTime(value: string) {
  const publishedAt = new Date(value)
  if (Number.isNaN(publishedAt.getTime())) return 'time unavailable'

  const diffMs = Date.now() - publishedAt.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  return `${Math.floor(diffHours / 24)}d ago`
}

function formatExactPublishedTime(value: string) {
  const publishedAt = new Date(value)
  if (Number.isNaN(publishedAt.getTime())) return 'time unavailable'

  return publishedAt.toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDashboardClock(value: Date) {
  return value.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDashboardDateTime(value: Date) {
  return value.toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ageHours(value?: string | null) {
  if (!value) return null
  const publishedAt = new Date(value)
  if (Number.isNaN(publishedAt.getTime())) return null

  return Math.max(0, (Date.now() - publishedAt.getTime()) / 36e5)
}

function formatQualityAge(value?: string | null) {
  if (!value) return 'missing'
  const hours = ageHours(value)
  if (hours === null) return 'time unavailable'
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m old`
  if (hours < 24) return `${Math.round(hours)}h old`
  return `${Math.round(hours / 24)}d old`
}

function readableSignalType(value?: string | null) {
  if (!value) return 'Watch signal'
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeFeedTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function MapDashboard() {
  const [selectedId, setSelectedId] = useState('hormuz')
  const { articles, hotspots, signals, vessels, qualityAudit, meta: dataMeta, loading, refresh, lastUpdated } = useMaritimeData()

  const selectHotspot = useCallback((id: string) => {
    if (!(id in HOTSPOT_META)) return
    setSelectedId(id)

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('hotspot', id)
      window.history.replaceState(null, '', url)
    }
  }, [])

  useEffect(() => {
    const initialHotspot = new URLSearchParams(window.location.search).get('hotspot')
    if (initialHotspot && initialHotspot in HOTSPOT_META) setSelectedId(initialHotspot)

    const onPopState = () => {
      const hotspot = new URLSearchParams(window.location.search).get('hotspot')
      if (hotspot && hotspot in HOTSPOT_META) setSelectedId(hotspot)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Vessels for selected hotspot
  const selectedVessels = vessels.filter(v => v.hotspot === selectedId)

  const hotspotList = Object.entries(HOTSPOT_META).map(([id, m]) => {
    const data = hotspots[id]
    const hotspotSignals = signals.filter((signal) => signal.region?.toLowerCase() === id)
    const signalSources = new Set(hotspotSignals.map((signal) => signal.source).filter(Boolean))
    const watchSources = new Set(watchCoverageFor(id).map((item) => item.source))
    const riskLevel = data?.riskLevel || 'medium'
    const coverageCount = (data?.verifiedReports ?? 0) + hotspotSignals.length
    return {
      id,
      name: m.name,
      flag: m.flag,
      lat: m.lat,
      lng: m.lng,
      risk: riskLevel.toUpperCase(),
      riskColor: RISK_COLOR[riskLevel] ?? RISK_COLOR.medium,
      dailyTransits: data?.dailyTransits ?? 0,
      activeVessels: data?.activeVessels ?? 0,
      verifiedReports: data?.verifiedReports ?? 0,
      sourceCount: data?.sourceCount ?? 0,
      coverageCount: Math.max(coverageCount, watchCoverageFor(id).length),
      coverageSources: Math.max(data?.sourceCount ?? 0, signalSources.size, watchSources.size),
      note: '',
    }
  })

  const selected = hotspots[selectedId]
  const meta = HOTSPOT_META[selectedId]
  const riskLevel = selected?.riskLevel || 'medium'
  const riskColor = RISK_COLOR[riskLevel] ?? RISK_COLOR.medium
  const selectedArticles = articles.filter((article) => article.region?.toLowerCase() === selectedId)
  const selectedSignals = signals.filter((signal) => signal.region?.toLowerCase() === selectedId)
  const selectedWatchCoverage = watchCoverageFor(selectedId)
  const watchTimestamp = lastUpdated?.toISOString() || dataMeta?.generatedAt || STANDING_WATCH_TIMESTAMP
  const latestSignal = selectedSignals[0]
  const rawFeedItems: FeedItem[] = [
    ...selectedArticles.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      source: article.source,
      sourceUrl: article.sourceUrl,
      timestamp: article.timestamp,
      type: 'report' as const,
      label: 'SOURCE REPORT',
      sourceQualityLabel: article.sourceQualityLabel || maritimeSourceQualityLabel(article.source),
      intelligenceScore: article.intelligenceScore,
      reviewStatus: article.reviewStatus,
      reviewReason: article.reviewReason,
      reviewScore: article.reviewScore,
    })),
    ...selectedSignals.map((signal) => ({
      id: signal.signalKey,
      title: signal.title,
      summary: signal.summary,
      source: signal.source,
      sourceUrl: signal.sourceUrl,
      timestamp: signal.observedAt,
      type: 'signal' as const,
      label: signal.signalType.replace(/_/g, ' ').toUpperCase(),
      sourceQualityLabel: maritimeSourceQualityLabel(signal.source),
      intelligenceScore: Math.min(100, Math.round((signal.confidence || 0) * 0.8 + 18)),
    })),
    ...(selectedArticles.length === 0 && selectedSignals.length === 0
      ? selectedWatchCoverage.map((item, index) => ({
          id: `${selectedId}-watch-${index}`,
          title: item.title,
          summary: item.summary,
          source: item.source,
          sourceUrl: null,
          timestamp: watchTimestamp,
          type: 'signal' as const,
          label: item.signalType.toUpperCase(),
          sourceQualityLabel: 'Source sweep',
          intelligenceScore: 45,
        }))
      : []),
  ]
  const seenFeedItems = new Set<string>()
  const feedItems = rawFeedItems
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .filter((item) => {
      const key = `${normalizeFeedTitle(item.title)}:${item.source}`
      if (seenFeedItems.has(key)) return false
      seenFeedItems.add(key)
      return true
    })
    .sort((a, b) => {
      const timeDiff = Date.parse(b.timestamp) - Date.parse(a.timestamp)
      const scoreDiff = (b.intelligenceScore || 0) - (a.intelligenceScore || 0)
      return scoreDiff || timeDiff
    })
    .slice(0, 8)
  const totalReports = Object.values(hotspots).reduce((sum, hotspot) => sum + (hotspot.verifiedReports || 0), 0)
  const totalSources = new Set([
    ...articles.map((article) => article.source).filter(Boolean),
    ...signals.map((signal) => signal.source).filter(Boolean),
  ]).size
  const criticalHotspots = Object.values(hotspots).filter((hotspot) => hotspot.riskLevel === 'critical').length
  const latestArticle = selectedArticles[0]
  const selectedCoverageCount = Math.max((selected?.verifiedReports ?? 0) + selectedSignals.length, selectedWatchCoverage.length)
  const selectedCoverageSources = Math.max(
    selected?.sourceCount ?? 0,
    new Set(selectedSignals.map((signal) => signal.source).filter(Boolean)).size,
    new Set(selectedWatchCoverage.map((item) => item.source)).size,
  )
  const selectedUpdatedAt = selected?.updatedAt ? new Date(selected.updatedAt) : null
  const isStaleData = Boolean(dataMeta?.stale)
  const selectedConfidence = selected
    ? selected.confidenceLabel
      ? `${selected.confidenceLabel} · ${selected.confidenceScore ?? 0}/100`
      : selected.verifiedReports && selected.sourceCount
        ? 'Verified source review'
        : 'Source sweep active'
    : 'Source sweep active'
  const fallbackRiskDrivers = [
    ...(latestSignal ? [`${readableSignalType(latestSignal.signalType)} from ${latestSignal.source} · ${latestSignal.confidence}/100`] : []),
    ...(latestArticle ? [`Latest report from ${latestArticle.source}`] : []),
    `${selectedCoverageCount} coverage item${selectedCoverageCount === 1 ? '' : 's'} across ${selectedCoverageSources} source${selectedCoverageSources === 1 ? '' : 's'}`,
  ]
  const selectedRiskDrivers = (selected?.riskDrivers?.length ? selected.riskDrivers : fallbackRiskDrivers).slice(0, 4)
  const selectedRiskSummary = selected?.riskSummary ||
    `${riskLevel.toUpperCase()} based on ${selectedRiskDrivers[0] || 'VesselSurge source-review coverage'}.`
  const coverageQualityRows = Object.entries(HOTSPOT_META)
    .map(([id, hotspotMeta]) => {
      const data = hotspots[id]
      const hotspotArticles = articles
        .filter((article) => article.region?.toLowerCase() === id)
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      const hotspotSignals = signals
        .filter((signal) => signal.region?.toLowerCase() === id)
        .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))
      const latestNews = hotspotArticles[0]
      const latestRouteSignal = hotspotSignals[0]
      const newsFresh = latestNews ? (ageHours(latestNews.timestamp) ?? 999) <= 24 : false
      const signalFresh = latestRouteSignal ? (ageHours(latestRouteSignal.observedAt) ?? 999) <= 12 : false
      const sourceCount = Math.max(
        data?.sourceCount ?? 0,
        new Set([
          ...hotspotArticles.map((article) => article.source),
          ...hotspotSignals.map((signal) => signal.source),
          ...watchCoverageFor(id).map((item) => item.source),
        ].filter(Boolean)).size,
      )
      const hasRiskDrivers = Boolean(data?.riskDrivers?.length || hotspotSignals.length || hotspotArticles.length)
      const score = Math.min(
        100,
        (newsFresh ? 30 : latestNews ? 18 : 0) +
          (signalFresh ? 30 : latestRouteSignal ? 18 : 0) +
          (sourceCount >= 3 ? 25 : sourceCount >= 2 ? 18 : 8) +
          (hasRiskDrivers ? 15 : 0),
      )
      const missing = [
        latestNews ? (newsFresh ? null : 'fresh news') : 'news',
        latestRouteSignal ? (signalFresh ? null : 'fresh signal') : 'signal',
        sourceCount >= 2 ? null : 'second source',
      ].filter(Boolean) as string[]
      const tier = score >= 85 ? 'Strong' : score >= 68 ? 'Good' : 'Watch'
      const tone = score >= 85
        ? 'text-green-400 border-green-500/25 bg-green-500/10'
        : score >= 68
          ? 'text-sky-300 border-sky-500/25 bg-sky-500/10'
          : 'text-amber-300 border-amber-500/25 bg-amber-500/10'

      return {
        id,
        name: hotspotMeta.name,
        flag: hotspotMeta.flag,
        risk: data?.riskLevel || 'medium',
        riskColor: RISK_COLOR[data?.riskLevel || 'medium'] ?? RISK_COLOR.medium,
        tier,
        score,
        tone,
        sourceCount,
        newsFresh,
        signalFresh,
        latestNews,
        latestRouteSignal,
        missing,
        sourceQuality: maritimeSourceQualityLabel(latestNews?.source || latestRouteSignal?.source),
      }
    })
    .sort((a, b) => a.score - b.score || (RISK_RANK[b.risk] || 0) - (RISK_RANK[a.risk] || 0))
  const derivedSourceMix = articles.reduce((mix, article) => {
    const tier = maritimeSourceQualityTier(article.source) as keyof typeof mix
    mix[tier] += 1
    return mix
  }, {
    official: 0,
    tierOne: 0,
    trade: 0,
    search: 0,
    general: 0,
    watch: 0,
  })
  const derivedReviewGate = articles.reduce(
    (gate, article) => {
      if (article.reviewStatus === 'approved') gate.approved += 1
      else if (article.reviewStatus === 'watch') gate.watch += 1
      gate.visible += 1
      return gate
    },
    { approved: 0, watch: 0, blocked: 0, visible: 0 },
  )
  const effectiveQualityAudit = qualityAudit || {
    status: coverageQualityRows.every((row) => row.score >= 85) ? 'healthy' as const : coverageQualityRows.some((row) => row.score < 68) ? 'degraded' as const : 'watch' as const,
    sourceMix: derivedSourceMix,
    reviewGate: derivedReviewGate,
    coverageGaps: coverageQualityRows.map((row) => ({
      hotspot: row.id,
      score: row.score,
      status: row.score >= 85 ? 'strong' as const : row.score >= 68 ? 'good' as const : 'watch' as const,
      missing: row.missing,
      sourceCount: row.sourceCount,
      latestNewsAt: row.latestNews?.timestamp || null,
      latestSignalAt: row.latestRouteSignal?.observedAt || null,
    })),
    recommendations: ['Client-side quality review active until the next server cache refresh writes the full audit.'],
  }
  const selectedAudit = effectiveQualityAudit.coverageGaps.find((gap) => gap.hotspot === selectedId)
  const sourceMix = effectiveQualityAudit.sourceMix
  const reviewGate = effectiveQualityAudit.reviewGate || derivedReviewGate
  const totalQualitySources = sourceMix
    ? sourceMix.official + sourceMix.tierOne + sourceMix.trade + sourceMix.search + sourceMix.general + sourceMix.watch
    : 0
  const qualityAuditTone = effectiveQualityAudit.status === 'healthy'
    ? 'border-green-500/25 bg-green-500/10 text-green-300'
    : effectiveQualityAudit.status === 'watch'
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
      : 'border-red-500/25 bg-red-500/10 text-red-300'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MapArrivalScan />
      <SiteNavigation />

      <div className="border-b border-border/50 bg-background/90 px-3 pt-20 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-primary">VesselSurge Operations</p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-foreground sm:text-2xl">Live Maritime Intelligence Map</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Chokepoint risk, source-backed news, AIS context and fallback coverage in one live operating view.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-mono ${
              isStaleData
                ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                : 'border-green-500/20 bg-green-500/10 text-green-400'
            }`}>
              {isStaleData ? <WifiOff className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5 animate-pulse" />}
              {isStaleData ? 'OFFLINE-SAFE DATA' : vessels.length > 0 ? `${vessels.length} AIS VESSELS` : 'SOURCE SWEEP'}
            </div>
            <div className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-mono text-muted-foreground">
              {lastUpdated ? `${isStaleData ? 'Last known' : 'Updated'} ${formatDashboardClock(lastUpdated)}` : 'Loading data'}
            </div>
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-3 py-3 sm:px-4">
        {isStaleData && (
          <div className="mb-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div>
                <p className="font-semibold">Offline-safe mode: showing last known real VesselSurge data.</p>
                <p className="mt-1 text-xs text-amber-100/80">
                  {dataMeta?.staleReason || 'Fresh refresh is unavailable, so the map keeps serving saved hotspot statistics, source-reviewed news and maritime signals.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <section className="rounded-2xl border border-border bg-card/45 p-3">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Route focus</p>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${
                    isStaleData
                      ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                      : 'border-green-500/20 bg-green-500/10 text-green-400'
                  }`}>
                    {isStaleData ? 'Fallback' : 'Live'}
                  </span>
                </div>
                <h2 className="mt-1 text-sm font-black text-foreground">Choose one route. The map, source trail and risk explanation update around it.</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span><FileText className="mr-1 inline h-3.5 w-3.5 text-primary" />{loading ? '—' : totalReports} reports</span>
                  <span><Database className="mr-1 inline h-3.5 w-3.5 text-sky-400" />{loading ? '—' : totalSources} sources</span>
                  <span><AlertCircle className="mr-1 inline h-3.5 w-3.5 text-red-400" />{loading ? '—' : criticalHotspots} critical</span>
                  <span><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-green-400" />Verified method</span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[780px]">
                {hotspotList.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => selectHotspot(h.id)}
                    className="rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-card"
                    style={{
                      borderColor: selectedId === h.id ? h.riskColor : 'rgba(255,255,255,0.09)',
                      background: selectedId === h.id ? h.riskColor + '18' : 'rgba(255,255,255,0.025)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-foreground">{h.flag} {h.name}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {loading ? 'Loading coverage' : `${h.coverageCount} coverage · ${h.coverageSources} sources`}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-1 text-[10px] font-black"
                        style={{ background: h.riskColor + '22', color: h.riskColor }}
                      >
                        {h.risk}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="min-w-0 rounded-2xl border border-border bg-card/35 p-2 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-3 border-b border-border/60 px-2 pb-3 pt-1 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Live map</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-black"
                    style={{ background: riskColor + '22', color: riskColor }}
                  >
                    {riskLevel.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{selectedConfidence}</span>
                </div>
                <h2 className="mt-2 truncate text-lg font-black sm:text-xl">{meta?.flag} {meta?.name}</h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
                  Map-first operating view for route risk, AIS context and verified VesselSurge intelligence.
                </p>
              </div>
              <div className="grid w-full grid-cols-3 gap-2 text-center sm:w-auto">
                <div className="rounded-lg border border-border bg-background/45 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Coverage</p>
                  <p className="text-sm font-black tabular-nums">{loading ? '—' : selectedCoverageCount}</p>
                </div>
                <div className="rounded-lg border border-border bg-background/45 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Sources</p>
                  <p className="text-sm font-black tabular-nums">{loading ? '—' : selectedCoverageSources}</p>
                </div>
                <div className="rounded-lg border border-border bg-background/45 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">AIS</p>
                  <p className="text-sm font-black tabular-nums">{loading ? '—' : selectedVessels.length || selected?.activeVessels || 0}</p>
                </div>
              </div>
            </div>

            <div className="relative mt-2 h-[48vh] min-h-[340px] overflow-hidden rounded-xl border border-border sm:min-h-[420px] xl:h-[calc(100vh-15rem)] xl:min-h-[610px]">
              {hotspotList.length > 0 ? (
                <SatelliteMap
                  hotspots={hotspotList}
                  selected={hotspotList.find(h => h.id === selectedId) || hotspotList[0]}
                  onSelect={(h: any) => selectHotspot(h.id)}
                  vessels={vessels}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <div className="h-8 w-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                </div>
              )}
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/85 px-3 py-2 text-xs backdrop-blur">
                <span className="font-semibold text-foreground">Live route focus</span>
                <span className="font-mono text-muted-foreground">
                  {selectedUpdatedAt ? `Updated ${formatDashboardDateTime(selectedUpdatedAt)}` : 'Source sweep active'}
                </span>
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-3 xl:sticky xl:top-20 xl:h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:pr-1">
            <div className="rounded-2xl border border-border bg-card/45 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Risk evidence</p>
                  <h2 className="mt-1 text-sm font-black text-foreground">Risk evidence</h2>
                  <p className="mt-1 text-xs text-muted-foreground">The short explanation behind the current {riskLevel} level.</p>
                </div>
                <span
                  className="rounded-full px-2 py-1 text-[10px] font-black uppercase"
                  style={{ background: riskColor + '22', color: riskColor }}
                >
                  {riskLevel}
                </span>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/45 p-3">
                <p className="text-xs leading-5 text-foreground">{selectedRiskSummary}</p>
                <p className="mt-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-[11px] leading-5 text-muted-foreground">
                  {RISK_BASIS[riskLevel] || 'Risk level is set from current source-reviewed reports, signals and route coverage.'}
                </p>
                <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                  {selectedRiskDrivers.map((driver, index) => (
                    <div key={driver} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 text-xs text-muted-foreground">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-background"
                        style={{ background: riskColor }}
                      >
                        {index + 1}
                      </span>
                      <span className="leading-5">{driver}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/70 bg-background/35 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Confidence</p>
                  <p className="mt-1 text-xs font-bold text-foreground">{selectedConfidence}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/35 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Signals</p>
                  <p className="mt-1 text-sm font-black">{loading ? '—' : Math.max(selected?.signalCount ?? 0, selectedWatchCoverage.length)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/45 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Latest intelligence</p>
                  <h2 className="mt-1 text-sm font-black text-foreground">Latest intelligence</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Source-backed news, signals and source-sweep items for {meta?.name}.</p>
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-[11px] font-mono text-muted-foreground">
                  {feedItems.length} items
                </span>
              </div>

              {(latestArticle || latestSignal) && (
                <div className="mb-3 space-y-2">
                  {latestArticle && (
                    <a
                      href={latestArticle.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-border/70 bg-background/45 p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Latest source report</p>
                          <p className="mt-1 line-clamp-2 text-xs font-semibold text-foreground">{latestArticle.title}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{latestArticle.source}</p>
                          <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                            {formatRelativePublishedTime(latestArticle.timestamp)} · {formatExactPublishedTime(latestArticle.timestamp)}
                          </p>
                        </div>
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </div>
                    </a>
                  )}

                  {latestSignal && (
                    <a
                      href={latestSignal.sourceUrl || '#'}
                      target={latestSignal.sourceUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-primary/30 bg-primary/10 p-3 transition-colors hover:border-primary/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {latestSignal.signalType.replace(/_/g, ' ')} · {latestSignal.confidence}/100
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs font-semibold text-foreground">{latestSignal.title}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{latestSignal.source}</p>
                          <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                            {formatRelativePublishedTime(latestSignal.observedAt)} · {formatExactPublishedTime(latestSignal.observedAt)}
                          </p>
                        </div>
                        {latestSignal.sourceUrl ? <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
                      </div>
                    </a>
                  )}
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />)}
                </div>
              ) : feedItems.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card/30 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-4 w-4 flex-shrink-0 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">VesselSurge source review is active for {meta?.name}.</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        VesselSurge is monitoring this hotspot and will promote fresh source reports or signals as soon as they arrive.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={selectedId} className="space-y-2">
                  {feedItems.map((item, i) => (
                    <a
                      key={`${selectedId}-${item.type}-${item.id || item.sourceUrl || i}`}
                      href={item.sourceUrl || '#'}
                      target={item.sourceUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="group block rounded-xl border border-border bg-background/40 p-3 transition-all hover:border-primary/30 hover:bg-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
                            {item.title}
                          </p>
                          {item.summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.summary}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 rounded"
                              style={{ background: riskColor + '22', color: riskColor }}
                            >
                              {item.label}
                            </span>
                            <span className="text-xs font-semibold text-primary">{item.source}</span>
                            <span className="rounded border border-border bg-card/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {item.sourceQualityLabel || maritimeSourceQualityLabel(item.source)}
                            </span>
                            {typeof item.intelligenceScore === 'number' ? (
                              <span className="rounded border border-cyan-300/20 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                                Evidence {item.intelligenceScore}
                              </span>
                            ) : null}
                            {item.reviewStatus ? (
                              <span
                                className="rounded border px-1.5 py-0.5 text-[10px] font-black"
                                title={item.reviewReason}
                                style={{
                                  borderColor: item.reviewStatus === 'approved' ? '#22c55e55' : '#eab30855',
                                  background: item.reviewStatus === 'approved' ? '#22c55e18' : '#eab30818',
                                  color: item.reviewStatus === 'approved' ? '#86efac' : '#fde68a',
                                }}
                              >
                                {item.reviewStatus === 'approved' ? 'REVIEWED' : 'WATCH REVIEW'} {item.reviewScore ?? ''}
                              </span>
                            ) : null}
                            <span className="text-xs text-muted-foreground" title={`Published ${formatExactPublishedTime(item.timestamp)}`}>
                              Published {formatRelativePublishedTime(item.timestamp)}
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {formatExactPublishedTime(item.timestamp)}
                            </span>
                          </div>
                        </div>
                        {item.sourceUrl ? <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" /> : null}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card/45 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">AIS context</p>
                  <h2 className="mt-1 text-sm font-black text-foreground">AIS / source context</h2>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{selectedVessels.length} verified</span>
              </div>
              {selectedVessels.length === 0 ? (
                <div className="space-y-2">
                  {(selectedSignals.length > 0 ? selectedSignals.slice(0, 6) : selectedWatchCoverage.map((item, index) => ({
                    signalKey: `${selectedId}-watch-ais-${index}`,
                    sourceUrl: null,
                    title: item.title,
                    source: item.source,
                    signalType: item.signalType,
                  }))).map((signal) => (
                    <a
                      key={`ais-fallback-${signal.signalKey}`}
                      href={signal.sourceUrl || '#'}
                      target={signal.sourceUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg bg-background/45 p-2 text-xs transition-colors hover:bg-card"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">{signal.title}</span>
                        <span className="block truncate text-muted-foreground">{signal.source}</span>
                      </span>
                      <span className="shrink-0 font-mono text-muted-foreground">
                        {signal.signalType.replace(/_/g, ' ')}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedVessels.slice(0, 12).map((v) => (
                    <div key={v.mmsi} className="flex items-center justify-between rounded-lg bg-background/45 p-2 text-xs">
                      <span className="mr-2 flex-1 truncate font-medium">{v.name || 'Unknown'}</span>
                      <span className="shrink-0 font-mono text-muted-foreground">
                        {v.speed > 0.5 ? `${v.speed.toFixed(1)}kts` : 'Anchored'}
                      </span>
                    </div>
                  ))}
                  {selectedVessels.length > 12 && (
                    <p className="pt-1 text-center text-xs text-muted-foreground">
                      +{selectedVessels.length - 12} more on map
                    </p>
                  )}
                </div>
              )}
            </div>
            </aside>
          </div>

          <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-2xl border border-border bg-card/35 p-3 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Operational quality</p>
                  <h2 className="mt-1 text-sm font-black text-foreground">Coverage health, weakest routes first.</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className={`rounded-full border px-2.5 py-1 font-black uppercase ${qualityAuditTone}`}>
                    {effectiveQualityAudit.status}
                  </span>
                  <span className="rounded-full border border-border bg-background/45 px-2.5 py-1 text-muted-foreground">
                    Selected audit {selectedAudit?.score ?? '—'}/100
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {coverageQualityRows.map((row) => (
                  <button
                    key={`coverage-quality-${row.id}`}
                    onClick={() => selectHotspot(row.id)}
                    className="rounded-xl border border-border/70 bg-background/35 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-foreground">{row.flag} {row.name}</p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {row.sourceCount} sources · {row.score}/100 · {row.sourceQuality}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${row.tone}`}>
                        {row.tier}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1.5 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                      <p className="truncate">
                        <span className="font-mono uppercase">News</span>
                        {' '}· {row.latestNews ? `${formatQualityAge(row.latestNews.timestamp)} from ${row.latestNews.source}` : 'No source report'}
                      </p>
                      <p className="truncate">
                        <span className="font-mono uppercase">Signal</span>
                        {' '}· {row.latestRouteSignal ? `${formatQualityAge(row.latestRouteSignal.observedAt)} from ${row.latestRouteSignal.source}` : 'Source sweep'}
                      </p>
                      <p className="truncate">
                        <span className="font-mono uppercase">Needs</span>
                        {' '}· {row.missing.length ? row.missing.join(', ') : 'No immediate gap'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/35 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Source + expansion</p>
                  <h2 className="mt-1 text-sm font-black text-foreground">Expansion routes follow the same standard.</h2>
                </div>
                <Link
                  href="/topics/global-shipping-route-risk"
                  className="shrink-0 rounded-md border border-border bg-background/45 px-2.5 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  Global risk
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border/70 bg-background/35 px-2 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Official</p>
                  <p className="text-lg font-black text-foreground">{sourceMix?.official ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/35 px-2 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Tier-1</p>
                  <p className="text-lg font-black text-foreground">{sourceMix?.tierOne ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/35 px-2 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Total</p>
                  <p className="text-lg font-black text-foreground">{totalQualitySources || '—'}</p>
                </div>
              </div>

              <p className="mt-3 rounded-xl border border-border/70 bg-background/35 p-3 text-xs leading-5 text-muted-foreground">
                {effectiveQualityAudit.recommendations[0] || 'Keep current live-map monitoring active.'}
              </p>

              <p className="mt-2 rounded-xl border border-border/70 bg-background/35 p-3 text-xs leading-5 text-muted-foreground">
                Review gate: <span className="font-black text-green-300">{reviewGate.approved}</span> approved ·{' '}
                <span className="font-black text-amber-300">{reviewGate.watch}</span> watch ·{' '}
                <span className="font-black text-red-300">{reviewGate.blocked}</span> blocked before map.
              </p>

              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3">
                <p className="text-xs font-black text-foreground">Nine live routes are now in the same source sweep.</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Panama Canal, Taiwan Strait, Turkish Straits, Gibraltar and Cape of Good Hope are treated as live route coverage
                  with the same source-review standard as the core chokepoints.
                </p>
                <Link
                  href="/source-trust"
                  className="mt-3 inline-flex rounded-md border border-border bg-background/45 px-2.5 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  View source trust
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
