'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Activity, ExternalLink, RefreshCw, Ship, Radio, TrendingDown, AlertCircle } from 'lucide-react'
import { useMaritimeData } from '@/lib/use-maritime-data'

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
      note: '',
    }
  })

  const selected = hotspots[selectedId]
  const meta = HOTSPOT_META[selectedId]
  const riskLevel = selected?.riskLevel || 'medium'
  const riskColor = RISK_COLOR[riskLevel] ?? RISK_COLOR.medium
  const riskBg = RISK_BG[riskLevel] ?? RISK_BG.medium
  const feedArticles = articles.slice(0, 6)

  return (
    <div className="min-h-screen bg-background">

      {/* Top bar */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <div className="h-4 w-px bg-border" />
            <div>
              <span className="text-sm font-bold text-foreground">Live Maritime Intelligence</span>
              <span className="ml-2 text-xs text-muted-foreground font-mono">
                {lastUpdated ? 'Updated ' + new Date(lastUpdated).toLocaleTimeString() : 'Loading...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* AIS live badge */}
            <div className="flex items-center gap-1.5 text-xs font-mono bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
              <Radio className="h-3 w-3 animate-pulse" />
              AIS LIVE · {vessels.length} vessels
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
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground truncate">{h.flag} {h.name}</span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded ml-1 flex-shrink-0"
                  style={{ background: h.riskColor + '22', color: h.riskColor }}>
                  {h.risk}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Ship className="h-3 w-3" />
                {loading ? '—' : h.activeVessels + ' vessels'}
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
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{meta?.name}</h3>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background: riskColor + '22', color: riskColor }}>
                    {riskLevel.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Daily Transits</p>
                    <p className="text-2xl font-black" style={{ color: riskColor }}>
                      {loading ? '—' : selected.dailyTransits}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Active Vessels</p>
                    <p className="text-2xl font-black text-foreground">
                      {loading ? '—' : selected.activeVessels}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Avg Wait</p>
                    <p className="text-lg font-bold text-foreground">{selected.avgWaitTime}</p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Vol (K bbl)</p>
                    <p className="text-lg font-bold text-foreground">
                      {loading ? '—' : (selected.marketVolume / 1000).toFixed(0) + 'K'}
                    </p>
                  </div>
                </div>

                {/* Volume bar */}
                {selected && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" /> Traffic vs normal
                      </span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: riskLevel === 'critical' ? '15%' : riskLevel === 'high' ? '45%' : riskLevel === 'medium' ? '70%' : '95%',
                          background: `linear-gradient(90deg, ${riskColor}, ${riskColor}88)`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span><span>Normal</span>
                    </div>
                  </div>
                )}
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
                <span className="text-xs font-mono text-green-400">{selectedVessels.length} tracked</span>
              </div>
              {selectedVessels.length === 0 ? (
                <p className="text-xs text-muted-foreground">Vessel data syncs hourly from AISstream</p>
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Maritime Intelligence Feed</h3>
                  <span className="text-xs text-muted-foreground">— {meta?.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground font-mono">Live</span>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />)}
                </div>
              ) : feedArticles.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  No articles yet — data refreshes hourly.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {feedArticles.map((article, i) => (
                    <a
                      key={i}
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
                          <div className="flex items-center gap-2 mt-2">
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
