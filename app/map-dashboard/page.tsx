'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Activity, ExternalLink, RefreshCw } from 'lucide-react'
import { useMaritimeData } from '@/lib/use-maritime-data'

const SatelliteMap = dynamic(() => import('@/components/satellite-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/20">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  ),
})

const HOTSPOT_META: Record<string, { lat: number; lng: number; name: string }> = {
  hormuz:  { lat: 26.34,  lng: 56.47,  name: 'Strait of Hormuz' },
  bab:     { lat: 12.65,  lng: 43.32,  name: 'Bab el-Mandeb' },
  malacca: { lat: 2.45,   lng: 102.15, name: 'Strait of Malacca' },
  suez:    { lat: 29.95,  lng: 32.58,  name: 'Suez Canal' },
}

const RISK_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

export default function MapDashboard() {
  const [selectedId, setSelectedId] = useState('hormuz')
  // FIX: hotspots is now a keyed map (Record<string, Hotspot>) not an array
  const { articles, hotspots, loading, refresh, lastUpdated } = useMaritimeData()

  const hotspotList = Object.entries(HOTSPOT_META).map(([id, m]) => {
    const data = hotspots[id]
    const riskLevel = data?.riskLevel || 'medium'
    return {
      id,
      name: m.name,
      lat: m.lat,
      lng: m.lng,
      risk: riskLevel.toUpperCase(),
      riskColor: RISK_COLOR[riskLevel] ?? RISK_COLOR.medium,
      dailyTransits: data?.dailyTransits ?? 0,
      note: 'No active alerts.',
    }
  })

  const selected = hotspots[selectedId]
  const meta = HOTSPOT_META[selectedId]
  const riskLevel = selected?.riskLevel || 'medium'
  const riskColor = RISK_COLOR[riskLevel] ?? RISK_COLOR.medium
  const feedArticles = articles.slice(0, 5)

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Live Maritime Intelligence</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Real-time chokepoint analysis —{' '}
              {lastUpdated
                ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
                : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refresh()}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* Hotspot list */}
            <div className="glass rounded-2xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Global Hotspots
              </h3>
              <div className="space-y-2">
                {loading
                  ? [1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />)
                  : hotspotList.map(h => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedId(h.id)}
                        className={
                          'w-full text-left p-3 rounded-xl border transition-all ' +
                          (selectedId === h.id ? 'border-primary bg-primary/10' : 'border-border bg-card/50 hover:bg-card')
                        }
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{h.name}</span>
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: h.riskColor + '22', color: h.riskColor }}
                          >
                            {h.risk}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          {h.dailyTransits} transits/day
                        </div>
                      </button>
                    ))}
              </div>
            </div>

            {/* Stats panel — shows when data loaded */}
            {selected ? (
              <div className="glass rounded-2xl border border-border p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {meta?.name}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Daily Transits</p>
                    <p className="text-3xl font-bold" style={{ color: riskColor }}>{selected.dailyTransits}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Active Vessels</p>
                    <p className="text-xl font-bold">{selected.activeVessels}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg Wait Time</p>
                    <p className="text-sm font-semibold">{selected.avgWaitTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Market Volume</p>
                    <p className="text-sm font-semibold">{selected.marketVolume?.toLocaleString()} MT</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded"
                      style={{ backgroundColor: riskColor + '22', color: riskColor }}
                    >
                      {riskLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ) : !loading && (
              <div className="glass rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Select a hotspot to view stats.</p>
              </div>
            )}
          </div>

          {/* Main right column */}
          <div className="lg:col-span-3 space-y-4">

            {/* Satellite map */}
            <div className="glass rounded-2xl border border-border overflow-hidden" style={{ height: 420 }}>
              {hotspotList.length > 0 ? (
                <SatelliteMap
                  hotspots={hotspotList}
                  selected={hotspotList.find(h => h.id === selectedId) || hotspotList[0]}
                  onSelect={(h: any) => setSelectedId(h.id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}
            </div>

            {/* Live news feed */}
            <div className="glass rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Live Intelligence Feed — {meta?.name}</h3>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
                </div>
              ) : feedArticles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No articles yet — data updates hourly.</p>
              ) : (
                <div className="space-y-3">
                  {feedArticles.map((article, i) => (
                    <a
                      key={i}
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </p>
                          {article.summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-primary">{article.source}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(article.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
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
