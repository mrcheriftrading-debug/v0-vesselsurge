'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Activity, ExternalLink, RefreshCw } from 'lucide-react'

const SatelliteMap = dynamic(() => import('@/components/satellite-map'), {
  ssr: false,
  loading: () => (<div className="w-full h-full flex items-center justify-center bg-muted/20"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>),
})

const HOTSPOT_META: Record<string, { lat: number; lng: number; name: string }> = {
  hormuz:  { lat: 26.34, lng: 56.47, name: 'Strait of Hormuz' },
  bab:     { lat: 12.65, lng: 43.32, name: 'Bab el-Mandeb' },
  malacca: { lat: 2.45,  lng: 102.15, name: 'Strait of Malacca' },
  suez:    { lat: 29.95, lng: 32.58,  name: 'Suez Canal' },
}
const RISK_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }

interface HotspotStat { activeVessels: number; dailyTransits: number; avgWaitTime: string; marketVolume: number; riskLevel: string }
interface Alert { id: string; hotspot: string; severity: string; message: string; source: string; timestamp: string }
interface NewsArticle { title: string; url: string; source: string; snippet: string; publishedAt?: string | null }

export default function MapDashboard() {
  const [selectedId, setSelectedId] = useState('hormuz')
  const [stats, setStats] = useState<Record<string, HotspotStat>>({})
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [newsLoading, setNewsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const fetchIntelligence = async () => {
    try {
      const res = await fetch('/api/maritime-intelligence', { cache: 'no-store' })
      const data = await res.json()
      if (data.success && data.data) {
        setStats(data.data.hotspotStats || {})
        setAlerts(data.data.latestAlerts || [])
      }
    } catch (e) {}
    setLoading(false)
    setLastRefresh(new Date().toLocaleTimeString())
  }

  const fetchNews = async (topic: string) => {
    setNewsLoading(true)
    try {
      const res = await fetch('/api/live-news?topic=' + topic, { cache: 'no-store' })
      const data = await res.json()
      if (data.success && data.articles?.length > 0) setNews(data.articles)
      else setNews([])
    } catch (e) { setNews([]) }
    setNewsLoading(false)
  }

  useEffect(() => {
    fetchIntelligence()
    const interval = setInterval(fetchIntelligence, 3600000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { fetchNews(selectedId) }, [selectedId])

  const selected = stats[selectedId]
  const meta = HOTSPOT_META[selectedId]
  const riskColor = RISK_COLOR[selected?.riskLevel || 'medium']
  const hotspots = Object.entries(HOTSPOT_META).map(([id, m]) => ({
    id, name: m.name, lat: m.lat, lng: m.lng,
    risk: (stats[id]?.riskLevel || 'medium').toUpperCase(),
    riskColor: RISK_COLOR[stats[id]?.riskLevel || 'medium'],
    dailyTransits: stats[id]?.dailyTransits || 0,
    note: alerts.find(a => a.hotspot === id)?.message || 'No active alerts.',
  }))
  const selectedAlerts = alerts.filter(a => a.hotspot === selectedId)

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Live Maritime Intelligence</h1>
            <p className="text-muted-foreground mt-1 text-sm">Real-time chokepoint analysis — {mounted ? lastRefresh || 'Loading...' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { fetchIntelligence(); fetchNews(selectedId) }} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-2xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Global Hotspots</h3>
              <div className="space-y-2">
                {loading ? [1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />) : hotspots.map(h => (
                  <button key={h.id} onClick={() => setSelectedId(h.id)} className={'w-full text-left p-3 rounded-xl border transition-all ' + (selectedId === h.id ? 'border-primary bg-primary/10' : 'border-border bg-card/50 hover:bg-card')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{h.name}</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: h.riskColor + '22', color: h.riskColor }}>{h.risk}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Activity className="h-3 w-3" />{h.dailyTransits} transits/day</div>
                  </button>
                ))}
              </div>
            </div>
            {selected && (
              <div className="glass rounded-2xl border border-border p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{meta?.name}</h3>
                <div className="space-y-3">
                  <div><p className="text-xs text-muted-foreground mb-1">Daily Transits</p><p className="text-3xl font-bold" style={{ color: riskColor }}>{selected.dailyTransits}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Active Vessels</p><p className="text-xl font-bold">{selected.activeVessels}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Avg Wait Time</p><p className="text-sm font-semibold">{selected.avgWaitTime}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Market Volume</p><p className="text-sm font-semibold">{selected.marketVolume.toLocaleString()} MT</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Risk Level</p><span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: riskColor + '22', color: riskColor }}>{selected.riskLevel.toUpperCase()}</span></div>
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="glass rounded-2xl border border-border overflow-hidden" style={{ height: 420 }}>
              {hotspots.length > 0 ? (
                <SatelliteMap hotspots={hotspots} selected={hotspots.find(h => h.id === selectedId) || hotspots[0]} onSelect={(h: any) => setSelectedId(h.id)} />
              ) : <div className="w-full h-full flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}
            </div>
            {selectedAlerts.length > 0 && (
              <div className="space-y-2">
                {selectedAlerts.map(alert => (
                  <div key={alert.id} className="glass rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div><p className="text-xs font-semibold text-destructive mb-1">{alert.severity.toUpperCase()} — {alert.source}</p><p className="text-xs text-foreground leading-relaxed">{alert.message}</p></div>
                  </div>
                ))}
              </div>
            )}
            <div className="glass rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Live Intelligence Feed — {meta?.name}</h3>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs text-muted-foreground">Live</span></div>
              </div>
              {newsLoading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}</div>
              : news.length === 0 ? <p className="text-xs text-muted-foreground">No articles. Add via admin panel at /admin.</p>
              : <div className="space-y-3">{news.map((article, i) => (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">{article.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.snippet}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-medium text-primary">{article.source}</span>
                        {article.publishedAt && <span className="text-xs text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </a>
              ))}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
