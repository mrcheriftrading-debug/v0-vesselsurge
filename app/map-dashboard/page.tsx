'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, RefreshCw, MapPin, Ship, Search, Newspaper, ChevronRight, ArrowLeft, ExternalLink, AlertTriangle, TrendingUp, Activity, Navigation as NavIcon } from 'lucide-react'

interface VesselData {
  mmsi: string
  name: string
  type: 'tanker' | 'cargo' | 'container' | 'lng'
  lat: number
  lng: number
  speed: number
  course: number
  destination: string
  eta: string
  flag: string
}

interface Stats {
  activeVessels: number
  dailyTransits: number
  avgWaitTime: string
  marketVolume: number
}

interface MaritimeHotspot {
  id: string
  name: string
  region: string
  center: { lat: number; lng: number }
  zoom: number
  stats: Stats
  vessels: VesselData[]
}

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  sourceUrl: string
  category: string
  region: string
  timestamp: string
  isBreaking: boolean
}

interface SecurityAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  source: string
  sourceUrl: string
  region: string
  timestamp: string
}

const maritimeData: Record<string, MaritimeHotspot> = {
  hormuz: {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    region: 'Persian Gulf / Gulf of Oman',
    center: { lat: 26.34, lng: 56.47 },
    zoom: 8,
    stats: { activeVessels: 55, dailyTransits: 56, avgWaitTime: '2.1h', marketVolume: 1380 },
    vessels: []
  },
  bab: {
    id: 'bab',
    name: 'Bab el-Mandeb',
    region: 'Red Sea / Gulf of Aden',
    center: { lat: 12.8, lng: 43.3 },
    zoom: 8,
    stats: { activeVessels: 28, dailyTransits: 42, avgWaitTime: '0.8h', marketVolume: 420 },
    vessels: []
  },
  malacca: {
    id: 'malacca',
    name: 'Strait of Malacca',
    region: 'Southeast Asia',
    center: { lat: 1.0, lng: 104.0 },
    zoom: 8,
    stats: { activeVessels: 90, dailyTransits: 248, avgWaitTime: '3.2h', marketVolume: 1920 },
    vessels: []
  },
  suez: {
    id: 'suez',
    name: 'Suez Canal',
    region: 'Egypt / Middle East',
    center: { lat: 30.8, lng: 32.3 },
    zoom: 9,
    stats: { activeVessels: 44, dailyTransits: 52, avgWaitTime: '8.4h', marketVolume: 780 },
    vessels: []
  }
}

export default function MapDashboard() {
  const [activeRegion, setActiveRegion] = useState<MaritimeHotspot>(maritimeData.hormuz)
  const [vessels, setVessels] = useState<VesselData[]>([])
  const [selectedVessel, setSelectedVessel] = useState<VesselData | null>(null)
  const [stats, setStats] = useState<Stats>(maritimeData.hormuz.stats)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [showNewsPanel, setShowNewsPanel] = useState(false)

  const fetchAISVessels = async (hotspotId: string) => {
    try {
      const res = await fetch(`/api/ais-vessels?hotspot=${hotspotId}`)
      const data = await res.json()
      if (data.success && data.data.vessels) {
        setVessels(data.data.vessels)
      }
    } catch {
      // silent
    }
  }

  const fetchLiveStats = async (hotspotId: string) => {
    try {
      const res = await fetch(`/api/maritime-stats?hotspot=${hotspotId}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch {
      // silent
    }
  }

  const fetchMaritimeNews = async (regionId?: string) => {
    try {
      const url = regionId ? `/api/maritime-news?region=${regionId}` : '/api/maritime-news'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setNewsItems(data.data.news)
        setSecurityAlerts(data.data.alerts)
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    setMounted(true)
    setLastUpdate(new Date())
    fetchAISVessels('hormuz')
    fetchLiveStats('hormuz')
    fetchMaritimeNews()
  }, [])

  useEffect(() => {
    setVessels(activeRegion.vessels)
    setStats(activeRegion.stats)
    setSelectedVessel(null)
    if (mounted) {
      fetchAISVessels(activeRegion.id)
      fetchLiveStats(activeRegion.id)
      fetchMaritimeNews(activeRegion.id)
    }
  }, [activeRegion, mounted])

  useEffect(() => {
    if (!mounted) return
    const vesselInterval = setInterval(() => {
      setIsRefreshing(true)
      fetchAISVessels(activeRegion.id)
      fetchLiveStats(activeRegion.id)
      setLastUpdate(new Date())
      setTimeout(() => setIsRefreshing(false), 500)
    }, 8000)
    const newsInterval = setInterval(() => fetchMaritimeNews(activeRegion.id), 30000)
    return () => {
      clearInterval(vesselInterval)
      clearInterval(newsInterval)
    }
  }, [mounted, activeRegion.id])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">VesselSurge</span>
          </Link>
          <div className="flex items-center gap-4">
            {isRefreshing && (
              <div className="flex items-center gap-2 text-accent">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Syncing...</span>
              </div>
            )}
            <Link href="/search" className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-muted-foreground hover:text-foreground transition-all">
              <Search className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">Search</span>
            </Link>
            <button onClick={() => setShowNewsPanel(!showNewsPanel)} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all ${showNewsPanel ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-card/50 text-muted-foreground'}`}>
              <Newspaper className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">News</span>
              {newsItems.filter(n => n.isBreaking).length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {newsItems.filter(n => n.isBreaking).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="glass rounded-2xl border border-border p-4">
          <div className="space-y-2">
            {Object.values(maritimeData).map((hotspot) => (
              <button key={hotspot.id} onClick={() => setActiveRegion(hotspot)} className={`w-full p-4 rounded-xl border transition-all text-left ${activeRegion.id === hotspot.id ? 'border-primary bg-primary/10' : 'border-border bg-card/50 hover:bg-card'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{hotspot.name}</h3>
                    <p className="text-xs text-muted-foreground">{hotspot.region}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Ship className="h-3 w-3" />
                      {hotspot.stats.activeVessels}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      {hotspot.stats.dailyTransits}/day
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl border border-border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Live Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold text-primary">{vessels.length}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Vessels</div>
            </div>
            <div className="rounded-xl bg-accent/10 border border-accent/20 p-3">
              <div className="flex items-center gap-2">
                <NavIcon className="h-4 w-4 text-accent" />
                <span className="text-2xl font-bold text-accent">{vessels.length > 0 ? (vessels.reduce((s, v) => s + v.speed, 0) / vessels.length).toFixed(1) : '0.0'}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Avg Speed (kn)</div>
            </div>
            <div className="rounded-xl bg-[#00E676]/10 border border-[#00E676]/20 p-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00E676]" />
                <span className="text-2xl font-bold text-[#00E676]">{stats.dailyTransits}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Transits/day</div>
            </div>
            <div className="rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#FFB800]" />
                <span className="text-2xl font-bold text-[#FFB800]">${stats.marketVolume}M</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Volume</div>
                </div>
              </div>
              {/* Hotspots end */}
              ))}
            </div>

        <div className="glass rounded-2xl border border-border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Vessels in {activeRegion.name}</h3>
          <div className="space-y-2">
            {vessels.map((vessel) => (
              <button key={vessel.mmsi} onClick={() => setSelectedVessel(vessel)} className={`w-full p-3 rounded-lg border text-left transition-all ${selectedVessel?.mmsi === vessel.mmsi ? 'border-primary bg-primary/10' : 'border-border hover:bg-card/50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{vessel.name}</p>
                    <p className="text-xs text-muted-foreground">{vessel.flag} • {vessel.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{vessel.speed.toFixed(1)} kn</p>
                    <p className="text-xs text-muted-foreground">→ {vessel.destination}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {showNewsPanel && (
          <div className="glass rounded-2xl border border-border p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold mb-3">Headlines</h3>
                <div className="space-y-2">
                  {newsItems.slice(0, 4).map((news) => (
                    <a key={news.id} href={news.sourceUrl} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg border border-border hover:bg-card/50 transition-all">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{news.source}</p>
                      <p className="text-sm font-medium text-foreground line-clamp-2">{news.title}</p>
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Alerts</h3>
                <div className="space-y-2">
                  {securityAlerts.slice(0, 4).map((alert) => (
                    <a key={alert.id} href={alert.sourceUrl} target="_blank" rel="noopener noreferrer" className={`block p-3 rounded-lg border transition-all ${alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-border hover:bg-card/50'}`}>
                      <p className={`text-xs font-bold ${alert.severity === 'critical' ? 'text-destructive' : 'text-primary'}`}>{alert.severity.toUpperCase()}</p>
                      <p className="text-sm font-medium text-foreground line-clamp-2 mt-1">{alert.title}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
