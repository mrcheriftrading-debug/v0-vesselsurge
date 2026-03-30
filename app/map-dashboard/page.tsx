'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Ship, Activity, TrendingUp, MapPin, AlertTriangle, ArrowLeft } from 'lucide-react'

interface Hotspot {
  id: string
  name: string
  region: string
  dailyTransits: number
  riskLevel: string
  waitTime: string
  volume: number
}

const HOTSPOTS: Hotspot[] = [
  { id: 'hormuz', name: 'Strait of Hormuz', region: 'Persian Gulf', dailyTransits: 7, riskLevel: 'CRITICAL - WAR ZONE', waitTime: '48h+', volume: 85 },
  { id: 'bab', name: 'Bab el-Mandeb', region: 'Red Sea', dailyTransits: 24, riskLevel: 'CRITICAL - HOUTHI', waitTime: '6.5h', volume: 280 },
  { id: 'malacca', name: 'Strait of Malacca', region: 'Southeast Asia', dailyTransits: 471, riskLevel: 'Elevated', waitTime: '2.8h', volume: 2450 },
  { id: 'suez', name: 'Suez Canal', region: 'Egypt', dailyTransits: 39, riskLevel: 'High', waitTime: '6.2h', volume: 620 },
]

export default function MapDashboard() {
  const [activeHotspot, setActiveHotspot] = useState(HOTSPOTS[0])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">VesselSurge</span>
            <span className="text-xs text-muted-foreground">Live Maritime Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">LIVE</span>
            </div>
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Maritime Chokepoint Monitor</h1>
          <p className="text-sm text-muted-foreground">March 30, 2026 - Real-time data from BBC, Reuters, SCA</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Global Hotspots</h2>
            {HOTSPOTS.map((hotspot) => (
              <button
                key={hotspot.id}
                onClick={() => setActiveHotspot(hotspot)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  activeHotspot.id === hotspot.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{hotspot.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{hotspot.region}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Ship className="h-3 w-3" />
                    {hotspot.dailyTransits}/day
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {hotspot.waitTime}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">{activeHotspot.name}</h2>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  activeHotspot.riskLevel.includes('CRITICAL') ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {activeHotspot.riskLevel}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Ship className="h-5 w-5" />
                    <span className="text-2xl font-bold">{activeHotspot.dailyTransits}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Daily Transits</p>
                </div>
                <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                  <div className="flex items-center gap-2 text-accent">
                    <Activity className="h-5 w-5" />
                    <span className="text-2xl font-bold">{activeHotspot.waitTime}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Avg Wait Time</p>
                </div>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-2xl font-bold">${activeHotspot.volume}M</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Market Volume</p>
                </div>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-lg font-bold">{activeHotspot.riskLevel.split(' ')[0]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Risk Level</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Latest Intelligence</h3>
              <div className="space-y-3">
                {activeHotspot.id === 'hormuz' && (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-foreground">Iran War: Traffic down 94% since Feb 28</p>
                        <p className="text-xs text-muted-foreground">Source: BBC Verify, Mar 30</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Ship className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-foreground">Only 7 vessels transited in past 24 hours</p>
                        <p className="text-xs text-muted-foreground">Source: ShipTracker, Mar 30</p>
                      </div>
                    </div>
                  </>
                )}
                {activeHotspot.id === 'bab' && (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-foreground">Houthi attacks resumed March 28</p>
                        <p className="text-xs text-muted-foreground">Source: Reuters, Mar 29</p>
                      </div>
                    </div>
                  </>
                )}
                {activeHotspot.id === 'malacca' && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <TrendingUp className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground">Traffic surge from Hormuz/Suez diversions</p>
                      <p className="text-xs text-muted-foreground">Source: ShipTracker, Mar 30</p>
                    </div>
                  </div>
                )}
                {activeHotspot.id === 'suez' && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <Activity className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground">39 vessels transited on March 25</p>
                      <p className="text-xs text-muted-foreground">Source: Suez Canal Authority</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
