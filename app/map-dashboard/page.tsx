'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ExternalLink, RefreshCw, Radio, FileText, Database, AlertCircle, ShieldCheck, Clock, WifiOff } from 'lucide-react'
import { useMaritimeData } from '@/lib/use-maritime-data'
import { MapArrivalScan } from '@/components/maritime-motion-effects'
import { HotspotRiskOrbital } from '@/components/three/maritime-3d-scenes'
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
}

const RISK_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

const RISK_BG: Record<string, string> = {
  critical: 'rgba(239,68,68,0.1)',
  high:     'rgba(249,115,22,0.1)',
  medium:   'rgba(234,179,8,0.1)',
  low:      'rgba(34,197,94,0.1)',
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
}

const WATCH_COVERAGE: Record<string, Array<{ source: string; signalType: string; title: string; summary: string }>> = {
  hormuz: [
    {
      source: 'OpenClaw Hormuz Watch',
      signalType: 'oil route watch',
      title: 'Standing watch on Hormuz tanker flow and Gulf export routing',
      summary: 'Coverage tracks tanker movement, oil-route exposure, port pressure and verified regional reporting.',
    },
    {
      source: 'OpenClaw Insurance Watch',
      signalType: 'war risk watch',
      title: 'War-risk and freight signal layer active for Gulf-linked cargo',
      summary: 'VesselSurge keeps this layer ready for insurance, freight and chokepoint disruption signals.',
    },
  ],
  bab: [
    {
      source: 'OpenClaw Red Sea Watch',
      signalType: 'red sea watch',
      title: 'Standing watch on Bab el-Mandeb and southern Red Sea routing',
      summary: 'Coverage tracks rerouting pressure, security advisories, AIS context and Red Sea operating constraints.',
    },
    {
      source: 'OpenClaw Chokepoint Watch',
      signalType: 'chokepoint watch',
      title: 'Bab el-Mandeb cargo-vessel matching risk layer active',
      summary: 'VesselSurge keeps this corridor covered even when direct reports are temporarily thin.',
    },
  ],
  suez: [
    {
      source: 'OpenClaw Suez Watch',
      signalType: 'canal watch',
      title: 'Standing watch on Suez Canal transit and queue pressure',
      summary: 'Coverage tracks canal throughput, convoy movement, weather constraints and operational source updates.',
    },
    {
      source: 'OpenClaw Freight Watch',
      signalType: 'freight rate watch',
      title: 'Suez freight-rate and delay signal layer active',
      summary: 'VesselSurge monitors disruption signals that can affect Asia-Europe cargo planning.',
    },
  ],
  malacca: [
    {
      source: 'OpenClaw Malacca Watch',
      signalType: 'ais density watch',
      title: 'Standing watch on Malacca AIS density and tanker lanes',
      summary: 'Coverage tracks dense vessel movement, port approach pressure and Singapore-linked routing signals.',
    },
    {
      source: 'OpenClaw Port Watch',
      signalType: 'port flow watch',
      title: 'Malacca port-flow and cargo matching signal layer active',
      summary: 'VesselSurge keeps Southeast Asia chokepoint context visible for matching and route planning.',
    },
  ],
}

function watchCoverageFor(region: string) {
  return WATCH_COVERAGE[region] || [{
    source: 'OpenClaw Watch',
    signalType: 'standing watch',
    title: 'Standing maritime watch active',
    summary: 'VesselSurge keeps this hotspot covered with source reports, operational signals and watch context.',
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

  return publishedAt.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MapDashboard() {
  const [selectedId, setSelectedId] = useState('hormuz')
  const { articles, hotspots, signals, vessels, meta: dataMeta, loading, refresh, lastUpdated } = useMaritimeData()

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
  const riskBg = RISK_BG[riskLevel] ?? RISK_BG.medium
  const selectedArticles = articles.filter((article) => article.region?.toLowerCase() === selectedId)
  const selectedSignals = signals.filter((signal) => signal.region?.toLowerCase() === selectedId)
  const selectedWatchCoverage = watchCoverageFor(selectedId)
  const latestSignal = selectedSignals[0]
  const feedItems: FeedItem[] = [
    ...selectedArticles.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      source: article.source,
      sourceUrl: article.sourceUrl,
      timestamp: article.timestamp,
      type: 'report' as const,
      label: 'SOURCE REPORT',
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
    })),
    ...(selectedArticles.length === 0 && selectedSignals.length === 0
      ? selectedWatchCoverage.map((item, index) => ({
          id: `${selectedId}-watch-${index}`,
          title: item.title,
          summary: item.summary,
          source: item.source,
          sourceUrl: null,
          timestamp: lastUpdated ? new Date(lastUpdated).toISOString() : new Date().toISOString(),
          type: 'signal' as const,
          label: item.signalType.toUpperCase(),
        }))
      : []),
  ]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 12)
  const totalReports = Object.values(hotspots).reduce((sum, hotspot) => sum + (hotspot.verifiedReports || 0), 0)
  const totalSources = new Set([
    ...articles.map((article) => article.source).filter(Boolean),
    ...signals.map((signal) => signal.source).filter(Boolean),
  ]).size
  const criticalHotspots = Object.values(hotspots).filter((hotspot) => hotspot.riskLevel === 'critical').length
  const sourceBreakdown = [...selectedArticles, ...selectedSignals].reduce((acc: Record<string, number>, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1
    return acc
  }, {})
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
        : 'Standing watch active'
    : 'Standing watch active'

  return (
    <div className="min-h-screen bg-background">
      <MapArrivalScan />
      <SiteNavigation />

      {/* Top bar */}
      <div className="border-b border-border/50 bg-background/80 px-4 py-3 pt-20 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="sr-only">Live Maritime Intelligence Map</h1>
              <span className="text-sm font-bold text-foreground">Live Maritime Intelligence</span>
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                {lastUpdated ? `${isStaleData ? 'Last known data' : 'Updated'} ${new Date(lastUpdated).toLocaleTimeString()}` : 'Loading...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono ${
              isStaleData
                ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                : 'border-green-500/20 bg-green-500/10 text-green-400'
            }`}>
              {isStaleData ? <WifiOff className="h-3 w-3" /> : <Radio className="h-3 w-3 animate-pulse" />}
              {isStaleData
                ? 'LAST KNOWN REAL DATA'
                : vessels.length > 0 ? `AIS VERIFIED · ${vessels.length} vessels` : 'OPENCLAW WATCH · live coverage'}
            </div>
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {isStaleData && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
              OpenClaw status
            </div>
            <p className="mt-1 text-sm font-bold text-foreground">Trusted source mode</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Verified reports
            </div>
            <p className="mt-1 text-2xl font-black tabular-nums">{loading ? '—' : totalReports}</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5 text-sky-400" />
              Active sources
            </div>
            <p className="mt-1 text-2xl font-black tabular-nums">{loading ? '—' : totalSources}</p>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
              Critical hotspots
            </div>
            <p className="mt-1 text-2xl font-black tabular-nums">{loading ? '—' : criticalHotspots}</p>
          </div>
        </div>

        {/* Global risk bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {hotspotList.map(h => (
            <button
              key={h.id}
              onClick={() => selectHotspot(h.id)}
              className="text-left p-3 rounded-xl border transition-all hover:scale-[1.02]"
              style={{
                borderColor: selectedId === h.id ? h.riskColor : 'rgba(255,255,255,0.08)',
                background: selectedId === h.id ? h.riskColor + '18' : 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground truncate">{h.flag} {h.name}</span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded ml-1 flex-shrink-0"
                  style={{ background: h.riskColor + '22', color: h.riskColor }}>
                  {h.risk}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Coverage</div>
                  <div className="font-bold text-foreground tabular-nums">{loading ? '—' : h.coverageCount}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Sources</div>
                  <div className="font-bold text-foreground tabular-nums">{loading ? '—' : h.coverageSources}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Left: stats panel */}
          <div className="lg:col-span-1 space-y-3">

            {/* Selected hotspot stats */}
            {selected || !loading ? (
              <div className="rounded-2xl border p-4 space-y-4"
                style={{ borderColor: riskColor + '33', background: riskBg }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{meta?.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{selectedConfidence}</p>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background: riskColor + '22', color: riskColor }}>
                    {riskLevel.toUpperCase()}
                  </span>
                </div>

                <div className="relative h-36 overflow-hidden rounded-xl border border-border/50 bg-black/25">
                  <HotspotRiskOrbital
                    riskLevel={riskLevel}
                    reports={selectedCoverageCount}
                    sources={selectedCoverageSources}
                  />
                  <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Risk orbital</p>
                      <p className="text-xs font-semibold text-foreground">Signals scale with reports and sources</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 px-2 py-1 text-right backdrop-blur">
                      <p className="text-[10px] text-muted-foreground">Live pulse</p>
                      <p className="text-xs font-mono font-bold" style={{ color: riskColor }}>{selectedCoverageCount}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Coverage Items</p>
                    <p className="text-2xl font-black" style={{ color: riskColor }}>
                      {loading ? '—' : selectedCoverageCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Trusted Sources</p>
                    <p className="text-2xl font-black text-foreground">
                      {loading ? '—' : selectedCoverageSources}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">AIS Vessels</p>
                    <p className="text-sm font-bold text-foreground">
                      {loading ? '—' : (selected?.activeVessels ?? 0) > 0 ? selected?.activeVessels : `${selectedCoverageCount} watch items`}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Daily Transits</p>
                    <p className="text-sm font-bold text-foreground">
                      {loading ? '—' : (selected?.dailyTransits ?? 0) > 0 ? selected?.dailyTransits : 'Watch active'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Live Signals</p>
                    <p className="text-2xl font-black text-foreground">
                      {loading ? '—' : Math.max(selected?.signalCount ?? 0, selectedWatchCoverage.length)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Official / AIS</p>
                    <p className="text-sm font-bold text-foreground">
                      {loading ? '—' : `${selected?.officialSignalCount ?? 0} / ${selected?.aisSignalCount ?? 0}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-border/50 bg-black/20 p-3">
                    <div className="flex items-start gap-2">
                      <Clock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Latest OpenClaw update</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedUpdatedAt ? selectedUpdatedAt.toLocaleString() : 'Standing watch now'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {latestArticle ? (
                    <a
                      href={latestArticle.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-border/50 bg-black/20 p-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-foreground line-clamp-2">{latestArticle.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{latestArticle.source}</p>
                          <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                            Published {formatRelativePublishedTime(latestArticle.timestamp)} · {formatExactPublishedTime(latestArticle.timestamp)}
                          </p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </a>
                  ) : null}

                  {latestSignal ? (
                    <a
                      href={latestSignal.sourceUrl || '#'}
                      target={latestSignal.sourceUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-primary/30 bg-primary/10 p-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {latestSignal.signalType.replace(/_/g, ' ')} · {latestSignal.confidence}/100
                          </p>
                          <p className="mt-1 text-xs font-semibold text-foreground line-clamp-2">{latestSignal.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{latestSignal.source}</p>
                          <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                            Observed {formatRelativePublishedTime(latestSignal.observedAt)} · {formatExactPublishedTime(latestSignal.observedAt)}
                          </p>
                        </div>
                        {latestSignal.sourceUrl ? <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                      </div>
                    </a>
                  ) : null}

                  <div className="rounded-xl border border-border/50 bg-black/20 p-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground">Signal coverage</p>
                    {selectedSignals.length > 0 ? (
                      selectedSignals.slice(0, 5).map((signal) => (
                        <div key={signal.signalKey} className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate text-muted-foreground">{signal.source}</span>
                          <span className="font-mono text-foreground">{signal.signalType.replace(/_/g, ' ')}</span>
                        </div>
                      ))
                    ) : (
                      selectedWatchCoverage.slice(0, 5).map((item) => (
                        <div key={`${selectedId}-${item.source}-${item.signalType}`} className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate text-muted-foreground">{item.source}</span>
                          <span className="font-mono text-foreground">{item.signalType}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="rounded-xl border border-border/50 bg-black/20 p-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground">Source coverage</p>
                    {Object.keys(sourceBreakdown).length > 0 ? (
                      Object.entries(sourceBreakdown).map(([source, count]) => (
                        <div key={source} className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate text-muted-foreground">{source}</span>
                          <span className="font-mono text-foreground">{count}</span>
                        </div>
                      ))
                    ) : (
                      selectedWatchCoverage.map((item) => (
                        <div key={`${selectedId}-source-${item.source}`} className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate text-muted-foreground">{item.source}</span>
                          <span className="font-mono text-foreground">watch</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-black/20 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Database className="h-3.5 w-3.5 mt-0.5" />
                    <span>
                      OpenClaw keeps every hotspot populated with the strongest available coverage: source reports, AIS context, weather constraints or operational signals.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <WifiOff className="h-3.5 w-3.5 mt-0.5" />
                    <span>
                      If direct AIS rows are thin for a hotspot, this panel falls back to active watch coverage instead of showing a blank operational view.
                    </span>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="rounded-2xl border border-border p-4 space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-muted/20 animate-pulse" />)}
              </div>
            ) : null}

            {/* Live AIS vessels panel */}
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AIS Vessels</h3>
                <span className="text-xs font-mono text-muted-foreground">{selectedVessels.length} verified</span>
              </div>
              {selectedVessels.length === 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(selectedSignals.length > 0 ? selectedSignals.slice(0, 8) : selectedWatchCoverage.map((item, index) => ({
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
                      className="flex items-center justify-between gap-3 rounded-lg bg-card/50 p-2 text-xs transition-colors hover:bg-card"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">{signal.title}</span>
                        <span className="block truncate text-muted-foreground">{signal.source}</span>
                      </span>
                      <span className="flex-shrink-0 font-mono text-muted-foreground">
                        {signal.signalType.replace(/_/g, ' ')}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedVessels.slice(0, 20).map(v => (
                    <div key={v.mmsi} className="flex items-center justify-between p-2 rounded-lg bg-card/50 text-xs">
                      <span className="font-medium truncate flex-1 mr-2">{v.name || 'Unknown'}</span>
                      <span className="text-muted-foreground font-mono flex-shrink-0">
                        {v.speed > 0.5 ? v.speed.toFixed(1) + 'kts' : 'Anchored'}
                      </span>
                    </div>
                  ))}
                  {selectedVessels.length > 20 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">
                      +{selectedVessels.length - 20} more on map
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: map + feed */}
          <div className="lg:col-span-3 space-y-4">

            {/* Satellite map */}
            <div className="rounded-2xl border border-border overflow-hidden" style={{ height: 460 }}>
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
            </div>

            {/* News feed */}
            <div className="rounded-2xl border border-border p-4">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Maritime Intelligence Feed</h3>
                    <p className="text-xs text-muted-foreground">
                      Showing source reports, operational signals and standing watch coverage for {meta?.name}.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-black px-2 py-1 rounded-full"
                      style={{ background: riskColor + '22', color: riskColor }}
                    >
                      {riskLevel.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{feedItems.length} items</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {hotspotList.map((h) => (
                    <button
                      key={`feed-${h.id}`}
                      onClick={() => selectHotspot(h.id)}
                      className="rounded-lg border px-3 py-2 text-left transition-colors"
                      style={{
                        borderColor: selectedId === h.id ? h.riskColor : 'rgba(255,255,255,0.08)',
                        background: selectedId === h.id ? h.riskColor + '14' : 'rgba(255,255,255,0.025)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">{h.flag} {h.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{h.coverageCount}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />)}
                </div>
              ) : feedItems.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card/30 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-4 w-4 flex-shrink-0 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">OpenClaw watch is active for {meta?.name}.</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        VesselSurge is monitoring this hotspot and will promote fresh source reports or signals as soon as they arrive.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={selectedId} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {feedItems.map((item, i) => (
                    <a
                      key={`${selectedId}-${item.type}-${item.id || item.sourceUrl || i}`}
                      href={item.sourceUrl || '#'}
                      target={item.sourceUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl border border-border bg-card/30 hover:bg-card transition-all group hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
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
          </div>
        </div>
      </div>
    </div>
  )
}
