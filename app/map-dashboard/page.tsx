'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ExternalLink, RefreshCw, Radio, FileText, Database, AlertCircle, ShieldCheck, Clock, WifiOff } from 'lucide-react'
import { useMaritimeData } from '@/lib/use-maritime-data'
import type { Article } from '@/lib/maritime-data'
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

export default function MapDashboard() {
  const [selectedId, setSelectedId] = useState('hormuz')
  const [feedItems, setFeedItems] = useState<Article[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)
  const { articles, hotspots, vessels, loading, refresh, lastUpdated } = useMaritimeData()

  // Vessels for selected hotspot
  const selectedVessels = vessels.filter(v => v.hotspot === selectedId)
  const movingVessels = selectedVessels.filter(v => v.speed > 0.5)

  const hotspotList = Object.entries(HOTSPOT_META).map(([id, m]) => {
    const data = hotspots[id]
    const riskLevel = data?.riskLevel || 'medium'
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
      note: '',
    }
  })

  const selected = hotspots[selectedId]
  const meta = HOTSPOT_META[selectedId]
  const riskLevel = selected?.riskLevel || 'medium'
  const riskColor = RISK_COLOR[riskLevel] ?? RISK_COLOR.medium
  const riskBg = RISK_BG[riskLevel] ?? RISK_BG.medium
  const selectedArticles = articles.filter((article) => article.region?.toLowerCase() === selectedId)
  const feedArticles = feedItems
  const totalReports = Object.values(hotspots).reduce((sum, hotspot) => sum + (hotspot.verifiedReports || 0), 0)
  const totalSources = new Set(articles.map((article) => article.source).filter(Boolean)).size
  const criticalHotspots = Object.values(hotspots).filter((hotspot) => hotspot.riskLevel === 'critical').length
  const sourceBreakdown = selectedArticles.reduce((acc: Record<string, number>, article) => {
    acc[article.source] = (acc[article.source] || 0) + 1
    return acc
  }, {})
  const latestArticle = selectedArticles[0]
  const selectedUpdatedAt = selected?.updatedAt ? new Date(selected.updatedAt) : null
  const selectedConfidence = selected
    ? selected.verifiedReports && selected.sourceCount
      ? 'Verified source review'
      : 'Awaiting source update'
    : 'Loading'

  useEffect(() => {
    const controller = new AbortController()

    async function fetchHotspotFeed() {
      setFeedLoading(true)
      setFeedError(null)

      try {
        const response = await fetch(`/api/live-news?region=${selectedId}&limit=12&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Feed API ${response.status}`)
        const payload = await response.json()
        setFeedItems(Array.isArray(payload.articles) ? payload.articles : [])
      } catch (error) {
        if (!controller.signal.aborted) {
          setFeedError(error instanceof Error ? error.message : 'Could not load hotspot feed')
          setFeedItems([])
        }
      } finally {
        if (!controller.signal.aborted) setFeedLoading(false)
      }
    }

    fetchHotspotFeed()
    return () => controller.abort()
  }, [selectedId])

  return (
    <div className="min-h-screen bg-background">
      <MapArrivalScan />
      <SiteNavigation />

      {/* Top bar */}
      <div className="border-b border-border/50 bg-background/80 px-4 py-3 pt-20 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-bold text-foreground">Live Maritime Intelligence</span>
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                {lastUpdated ? 'Updated ' + new Date(lastUpdated).toLocaleTimeString() : 'Loading...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
              <Radio className="h-3 w-3 animate-pulse" />
              {vessels.length > 0 ? `AIS VERIFIED · ${vessels.length} vessels` : 'AIS VERIFIED · waiting for data'}
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
              onClick={() => setSelectedId(h.id)}
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
                  <div className="text-muted-foreground">Reports</div>
                  <div className="font-bold text-foreground tabular-nums">{loading ? '—' : h.verifiedReports}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Sources</div>
                  <div className="font-bold text-foreground tabular-nums">{loading ? '—' : h.sourceCount}</div>
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
            {selected ? (
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
                    reports={selected.verifiedReports ?? 0}
                    sources={selected.sourceCount ?? 0}
                  />
                  <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Risk orbital</p>
                      <p className="text-xs font-semibold text-foreground">Signals scale with reports and sources</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 px-2 py-1 text-right backdrop-blur">
                      <p className="text-[10px] text-muted-foreground">Live pulse</p>
                      <p className="text-xs font-mono font-bold" style={{ color: riskColor }}>{selected.verifiedReports ?? 0}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Source Reports</p>
                    <p className="text-2xl font-black" style={{ color: riskColor }}>
                      {loading ? '—' : selected.verifiedReports ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Trusted Sources</p>
                    <p className="text-2xl font-black text-foreground">
                      {loading ? '—' : selected.sourceCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">AIS Vessels</p>
                    <p className="text-sm font-bold text-foreground">
                      {loading ? '—' : selected.activeVessels > 0 ? selected.activeVessels : 'Not verified'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Daily Transits</p>
                    <p className="text-sm font-bold text-foreground">
                      {loading ? '—' : selected.dailyTransits > 0 ? selected.dailyTransits : 'Not verified'}
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
                          {selectedUpdatedAt ? selectedUpdatedAt.toLocaleString() : 'Waiting for first update'}
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
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </a>
                  ) : null}

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
                      <p className="text-xs text-muted-foreground">No trusted source coverage for this hotspot yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-black/20 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Database className="h-3.5 w-3.5 mt-0.5" />
                    <span>
                      OpenClaw updates this panel from trusted maritime sources. Traffic/AIS figures stay hidden until a verified feed is connected.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <WifiOff className="h-3.5 w-3.5 mt-0.5" />
                    <span>
                      AIS/transit/volume fields are not displayed as live numbers until a verified provider is connected.
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
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">No verified AIS rows are available for this hotspot.</p>
                  <p className="text-xs text-muted-foreground">Mock vessel positions are disabled, so this section will stay empty until real AIS data is ingested.</p>
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
                  onSelect={(h: any) => setSelectedId(h.id)}
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
                      Showing verified OpenClaw reports for {meta?.name} only.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-black px-2 py-1 rounded-full"
                      style={{ background: riskColor + '22', color: riskColor }}
                    >
                      {riskLevel.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{feedArticles.length} items</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {hotspotList.map((h) => (
                    <button
                      key={`feed-${h.id}`}
                      onClick={() => setSelectedId(h.id)}
                      className="rounded-lg border px-3 py-2 text-left transition-colors"
                      style={{
                        borderColor: selectedId === h.id ? h.riskColor : 'rgba(255,255,255,0.08)',
                        background: selectedId === h.id ? h.riskColor + '14' : 'rgba(255,255,255,0.025)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">{h.flag} {h.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{h.verifiedReports}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {loading || feedLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />)}
                </div>
              ) : feedError ? (
                <div className="rounded-xl border border-border/50 bg-card/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Could not load {meta?.name} feed.</p>
                      <p className="mt-1 text-xs text-muted-foreground">{feedError}</p>
                    </div>
                  </div>
                </div>
              ) : feedArticles.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">No verified reports for {meta?.name} yet.</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        OpenClaw keeps checking trusted sources hourly and will populate this feed as soon as this hotspot has matching reports.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={selectedId} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {feedArticles.map((article, i) => (
                    <a
                      key={`${selectedId}-${article.id || article.sourceUrl || i}`}
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl border border-border bg-card/30 hover:bg-card transition-all group hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </p>
                          {article.summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{article.summary}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 rounded"
                              style={{ background: riskColor + '22', color: riskColor }}
                            >
                              {meta?.name}
                            </span>
                            <span className="text-xs font-semibold text-primary">{article.source}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(article.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
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
