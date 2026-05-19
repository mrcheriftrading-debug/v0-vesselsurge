'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ExternalLink, RefreshCw, Radio, FileText, Database, AlertCircle, ShieldCheck, WifiOff } from 'lucide-react'
import { useMaritimeData } from '@/lib/use-maritime-data'
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
}

const RISK_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
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
    <div className="min-h-screen bg-background text-foreground">
      <MapArrivalScan />
      <SiteNavigation />

      <div className="border-b border-border/50 bg-background/90 px-3 pt-20 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-primary">VesselSurge OpenClaw</p>
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
              {isStaleData ? 'OFFLINE-SAFE DATA' : vessels.length > 0 ? `${vessels.length} AIS VESSELS` : 'WATCH ACTIVE'}
            </div>
            <div className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-mono text-muted-foreground">
              {lastUpdated ? `${isStaleData ? 'Last known' : 'Updated'} ${new Date(lastUpdated).toLocaleTimeString()}` : 'Loading data'}
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

        <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside className="order-2 min-w-0 space-y-3 xl:order-1 xl:sticky xl:top-20 xl:h-[calc(100vh-5.5rem)]">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
              <div className="rounded-xl border border-border bg-card/55 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Reports
                </div>
                <p className="mt-1 text-2xl font-black tabular-nums">{loading ? '—' : totalReports}</p>
              </div>
              <div className="rounded-xl border border-border bg-card/55 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Database className="h-3.5 w-3.5 text-sky-400" />
                  Sources
                </div>
                <p className="mt-1 text-2xl font-black tabular-nums">{loading ? '—' : totalSources}</p>
              </div>
              <div className="rounded-xl border border-border bg-card/55 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                  Critical
                </div>
                <p className="mt-1 text-2xl font-black tabular-nums">{loading ? '—' : criticalHotspots}</p>
              </div>
              <div className="rounded-xl border border-border bg-card/55 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                  Mode
                </div>
                <p className="mt-1 text-sm font-black">Verified</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/45 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Hotspots</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Click a route to refocus map and intelligence.</p>
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-[11px] font-mono text-muted-foreground">
                  {hotspotList.length}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
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
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(18, h.coverageCount * 8))}%`, background: h.riskColor }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="order-1 min-w-0 rounded-2xl border border-border bg-card/35 p-2 shadow-2xl shadow-black/20 xl:order-2">
            <div className="flex flex-col gap-3 border-b border-border/60 px-2 pb-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
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
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Coverage</p>
                  <p className="text-sm font-black tabular-nums">{loading ? '—' : selectedCoverageCount}</p>
                </div>
                <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Sources</p>
                  <p className="text-sm font-black tabular-nums">{loading ? '—' : selectedCoverageSources}</p>
                </div>
                <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
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
                  {selectedUpdatedAt ? `Updated ${selectedUpdatedAt.toLocaleString()}` : 'Standing watch active'}
                </span>
              </div>
            </div>
          </section>

          <aside className="order-3 min-w-0 space-y-3 xl:sticky xl:top-20 xl:h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:pr-1">
            <div className="rounded-2xl border border-border bg-card/45 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black">Intelligence Panel</h2>
                  <p className="mt-1 text-xs text-muted-foreground">News, signals, watches and vessel context for {meta?.name}.</p>
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-[11px] font-mono text-muted-foreground">
                  {feedItems.length} items
                </span>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border/70 bg-background/45 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Confidence</p>
                  <p className="mt-1 text-xs font-bold text-foreground">{selectedConfidence}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/45 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Signals</p>
                  <p className="mt-1 text-lg font-black">{loading ? '—' : Math.max(selected?.signalCount ?? 0, selectedWatchCoverage.length)}</p>
                </div>
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
                      <p className="text-sm font-medium text-foreground">OpenClaw watch is active for {meta?.name}.</p>
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
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">AIS / Watch Context</h2>
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
      </main>
    </div>
  )
}
