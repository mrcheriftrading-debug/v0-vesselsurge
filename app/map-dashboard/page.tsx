'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ship, Clock, DollarSign, AlertTriangle, ArrowLeft, MapPin } from 'lucide-react'

interface Hotspot {
  id: string
  name: string
  region: string
  lat: number
  lng: number
  dailyTransits: number
  waitTime: string
  volume: number
  risk: string
  riskColor: string
  note: string
}

const hotspotData: Hotspot[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    region: 'Persian Gulf',
    lat: 26.34,
    lng: 56.47,
    dailyTransits: 7,
    waitTime: '48h+',
    volume: 85,
    risk: 'CRITICAL',
    riskColor: 'bg-red-500',
    note: 'Iran War began Feb 28, 2026 - Traffic down 94%',
  },
  {
    id: 'bab',
    name: 'Bab el-Mandeb',
    region: 'Red Sea',
    lat: 12.65,
    lng: 43.32,
    dailyTransits: 24,
    waitTime: '6.5h',
    volume: 280,
    risk: 'CRITICAL',
    riskColor: 'bg-red-500',
    note: 'Houthi attacks resumed Mar 28, 2026',
  },
  {
    id: 'malacca',
    name: 'Strait of Malacca',
    region: 'Southeast Asia',
    lat: 2.45,
    lng: 102.15,
    dailyTransits: 471,
    waitTime: '2.8h',
    volume: 2450,
    risk: 'ELEVATED',
    riskColor: 'bg-yellow-500',
    note: 'Surge from Hormuz/Suez diversions',
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    region: 'Egypt',
    lat: 29.95,
    lng: 32.58,
    dailyTransits: 39,
    waitTime: '6.2h',
    volume: 620,
    risk: 'HIGH',
    riskColor: 'bg-orange-500',
    note: 'Red Sea diversions ongoing - Mar 25 SCA data',
  },
]

export default function MapDashboard() {
  const [selected, setSelected] = useState<Hotspot>(hotspotData[0])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Link>
            <h1 className="text-lg font-semibold">Maritime Intelligence</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Live - March 30, 2026</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">GLOBAL HOTSPOTS</h2>
              <div className="space-y-2">
                {hotspotData.map(function(h) {
                  return (
                    <button
                      key={h.id}
                      onClick={function() { setSelected(h) }}
                      className={'w-full text-left p-3 rounded-lg border transition-all ' + (selected.id === h.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{h.name}</div>
                          <div className="text-xs text-muted-foreground">{h.region}</div>
                        </div>
                        <div className={'px-2 py-0.5 rounded text-xs font-bold text-white ' + h.riskColor}>
                          {h.risk}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground">{selected.region}</p>
                </div>
                <div className={'px-3 py-1 rounded-full text-xs font-bold text-white ' + selected.riskColor}>
                  {selected.risk}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Ship className="h-4 w-4" />
                    <span className="text-xs">Daily Transits</span>
                  </div>
                  <div className="text-2xl font-bold">{selected.dailyTransits}</div>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Wait Time</span>
                  </div>
                  <div className="text-2xl font-bold">{selected.waitTime}</div>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Volume ($M)</span>
                  </div>
                  <div className="text-2xl font-bold">{selected.volume}</div>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs">Coordinates</span>
                  </div>
                  <div className="text-sm font-mono">{selected.lat}N, {selected.lng}E</div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-500">Intelligence Alert</div>
                    <p className="text-sm text-muted-foreground mt-1">{selected.note}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">DATA SOURCES</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-background border border-border rounded text-xs">BBC Verify</span>
                <span className="px-2 py-1 bg-background border border-border rounded text-xs">Reuters</span>
                <span className="px-2 py-1 bg-background border border-border rounded text-xs">Suez Canal Authority</span>
                <span className="px-2 py-1 bg-background border border-border rounded text-xs">ShipTracker</span>
                <span className="px-2 py-1 bg-background border border-border rounded text-xs">Tavily API</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
