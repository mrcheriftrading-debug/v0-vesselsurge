'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Activity, Zap, ExternalLink, RefreshCw, Newspaper } from 'lucide-react'

const SatelliteMap = dynamic(() => import('@/components/satellite-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/20">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  ),
})

interface Hotspot {
  id: string
  name: string
  lat: number
  lng: number
  risk: string
  riskColor: string
  dailyTransits: number
  note: string
}

interface NewsArticle {
  title: string
  url: string
  source: string
  snippet: string
  publishedAt?: string | null
}

const hotspots: Hotspot[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    lat: 26.34,
    lng: 56.47,
    risk: 'CRITICAL',
    riskColor: '#ef4444',
    dailyTransits: 7,
    note: 'Iran War (Feb 28) — 94% traffic drop. 21M bbl/day at risk. Avg wait: 48h+.',
  },
  {
    id: 'bab',
    name: 'Bab el-Mandeb',
    lat: 12.65,
    lng: 43.32,
    risk: 'CRITICAL',
    riskColor: '#ef4444',
    dailyTransits: 24,
    note: 'Houthi attacks resumed (Mar 28). $280M daily volume. Avg wait: 6.5h.',
  },
  {
    id: 'malacca',
    name: 'Strait of Malacca',
    lat: 2.45,
    lng: 102.15,
    risk: 'HIGH',
    riskColor: '#f97316',
    dailyTransits: 471,
    note: "World's busiest strait. +89% traffic from diversions. 3,298 vessels/week.",
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    lat: 29.95,
    lng: 32.58,
    risk: 'HIGH',
    riskColor: '#f97316',
    dailyTransits: 39,
    note: 'Mar 25 SCA data. Decade-low transits. Red Sea diversions ongoing.',
  },
]

export default function MapDashboard() {
  const [selected, setSelected] = useState<Hotspot>(hotspots[0])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchNews = async (topic: string) => {
    setNewsLoading(true)
    try {
      const res = await fetch(`/api/live-news?topic=${topic}`)
      const data = await res.json()
      if (data.success && data.articles?.length > 0) {
        setNews(data.articles)
      }
    } catch {
      // silent
    } finally {
      setNewsLoading(false)
      setLastRefresh(new Date())
    }
  }

  useEffect(() => {
    fetchNews(selected.id)
  }, [selected.id])

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance">Live Maritime Intelligence</h1>
            <p className="text-muted-foreground mt-1 text-sm">Real-time vessel tracking and chokepoint analysis — March 30, 2026</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* Hotspot selector */}
            <div className="glass rounded-2xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Global Hotspots
              </h3>
              <div className="space-y-2">
                {hotspots.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    onClick={() => setSelected(hotspot)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selected.id === hotspot.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card/50 hover:bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{hotspot.name}</span>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: hotspot.riskColor + '22', color: hotspot.riskColor }}
                      >
                        {hotspot.risk}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      {hotspot.dailyTransits} vessels/day
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected hotspot details */}
            <div className="glass rounded-2xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {selected.name}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Daily Transits</p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: selected.riskColor }}
                  >
                    {selected.dailyTransits}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Intelligence</p>
                  <p className="text-xs leading-relaxed">{selected.note}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Coordinates</p>
                  <p className="text-xs font-mono">{selected.lat}°N, {selected.lng}°E</p>
                </div>
              </div>
            </div>

            {/* Sources */}
            <div className="glass rounded-2xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Data Sources
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                {['BBC Verify', 'Reuters', 'Suez Canal Authority', 'VesselTracker', 'Breakwave Advisors', 'gCaptain', 'Tavily Search'].map((src) => (
                  <li key={src} className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary flex-shrink-0" />
                    {src}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Center + Right: Map + News */}
          <div className="lg:col-span-3 space-y-4">

            {/* Satellite map */}
            <div className="glass rounded-2xl border border-border overflow-hidden" style={{ height: 420 }}>
              <SatelliteMap hotspots={hotspots} selected={selected} onSelect={setSelected} />
            </div>

            {/* Alert banner */}
            <div className="glass rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">
                <span className="font-semibold text-destructive">CRITICAL — March 30, 2026: </span>
                Iran War (Feb 28) cut Hormuz traffic 94%. Houthi attacks resumed Mar 28.
                60%+ of global container capacity now rerouting via Cape of Good Hope (+10-14 days).
              </p>
            </div>

            {/* Live news panel - full scrollable */}
            <div className="glass rounded-2xl border border-border p-4 flex flex-col" style={{ maxHeight: 600 }}>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Latest Maritime News</h3>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Live</span>
                  </span>
                </div>
                <button
                  onClick={() => fetchNews(selected.id)}
                  disabled={newsLoading}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${newsLoading ? 'animate-spin' : ''}`} />
                  {mounted && lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2 space-y-3">
                {newsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : news.length > 0 ? (
                  news.map((article, i) => (
                    <a
                      key={i}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-1.5 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all block"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                          {article.title}
                        </p>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {article.snippet}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/50">
                        <span className="text-xs font-medium text-primary">{article.source}</span>
                        {article.publishedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">No news found for this region.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
