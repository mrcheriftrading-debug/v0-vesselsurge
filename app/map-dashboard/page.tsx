'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Activity, Zap } from 'lucide-react'

interface Hotspot {
  id: string
  name: string
  risk: string
  riskColor: string
  dailyTransits: number
  note: string
}

const hotspots: Hotspot[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    risk: 'CRITICAL',
    riskColor: '#ef4444',
    dailyTransits: 7,
    note: 'Iran War (Feb 28) - 94% traffic drop. 21M bbl/day at risk. Average wait: 48+ hours.',
  },
  {
    id: 'bab',
    name: 'Bab el-Mandeb',
    risk: 'CRITICAL',
    riskColor: '#ef4444',
    dailyTransits: 24,
    note: 'Houthi attacks resumed (Mar 28). $280M daily volume. Average wait: 6.5 hours.',
  },
  {
    id: 'malacca',
    name: 'Strait of Malacca',
    risk: 'HIGH',
    riskColor: '#f97316',
    dailyTransits: 471,
    note: 'World\'s busiest strait. Elevated due to diversions. 3,298 ships/week.',
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    risk: 'HIGH',
    riskColor: '#f97316',
    dailyTransits: 39,
    note: 'Mar 25 SCA data. Red Sea diversions ongoing. Average wait: 6.2 hours.',
  },
]

export default function MapDashboard() {
  const [selected, setSelected] = useState<Hotspot>(hotspots[0])

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Live Maritime Intelligence</h1>
            <p className="text-muted-foreground mt-1">Real-time vessel tracking & chokepoint analysis</p>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Hotspots & Stats */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Critical Hotspots</h3>
              <div className="space-y-2">
                {hotspots.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    onClick={() => setSelected(hotspot)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selected.id === hotspot.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card/50 hover:bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{hotspot.name}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded`} style={{ backgroundColor: hotspot.riskColor + '20', color: hotspot.riskColor }}>
                        {hotspot.risk}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      {hotspot.dailyTransits} ships/day
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Hotspot Details */}
            <div className="glass rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Daily Transits</p>
                  <p className="text-3xl font-bold text-primary">{selected.dailyTransits}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="text-sm leading-relaxed">{selected.note}</p>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="glass rounded-2xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Data Sources</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> BBC Verify</li>
                <li className="flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> Reuters</li>
                <li className="flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> Suez Canal Authority</li>
                <li className="flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> ShipTracker</li>
                <li className="flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> Breakwave Advisors</li>
              </ul>
            </div>
          </div>

          {/* Right Content - Map Placeholder & Alert */}
          <div className="lg:col-span-2 space-y-4">
            {/* Satellite Map Placeholder */}
            <div className="glass rounded-2xl border border-border p-8 h-[400px] flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="font-semibold text-foreground">Live Satellite Map</p>
                <p className="text-sm text-muted-foreground">Esri World Imagery with real-time vessel tracking</p>
              </div>
            </div>

            {/* Alert Banner */}
            <div className="glass rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-destructive mb-1">Critical Maritime Events - March 30, 2026</p>
                <p className="text-xs text-foreground leading-relaxed">
                  <strong>Iran War (Feb 28):</strong> Hormuz traffic down 94% (7→100+ ships/day). 21M barrels/day at risk.
                  <br />
                  <strong>Houthi Attacks (Mar 28):</strong> Red Sea routes critical. Malacca traffic surged 89% due to diversions.
                  <br />
                  <strong>Global Impact:</strong> $280M daily volume rerouted. Supply chains using Cape of Good Hope alternative.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

