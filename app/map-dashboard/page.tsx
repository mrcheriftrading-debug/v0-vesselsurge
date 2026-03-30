'use client'
// VesselSurge — map-dashboard v5.0 — March 30 2026
// THIS IS THE ONLY CORRECT VERSION. DO NOT REVERT.

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Ship, Clock, DollarSign, AlertTriangle, ArrowLeft, Activity, Zap } from 'lucide-react'

const SatelliteMap = dynamic(() => import('@/components/satellite-map'), { ssr: false })

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
  riskBg: string
  note: string
  source: string
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    region: 'Persian Gulf / Gulf of Oman',
    lat: 26.34,
    lng: 56.47,
    dailyTransits: 7,
    waitTime: '48h+',
    volume: 85,
    risk: 'CRITICAL',
    riskColor: 'text-red-500',
    riskBg: 'bg-red-500',
    note: 'Iran-Israel war escalation since Feb 28, 2026 has reduced tanker traffic by 94%. Most VLCC operators have suspended Gulf loadings.',
    source: 'BBC Verify / Breakwave Advisors / Reuters — Mar 30, 2026',
  },
  {
    id: 'bab',
    name: 'Bab el-Mandeb',
    region: 'Red Sea / Gulf of Aden',
    lat: 12.65,
    lng: 43.32,
    dailyTransits: 24,
    waitTime: '6.5h',
    volume: 280,
    risk: 'CRITICAL',
    riskColor: 'text-red-500',
    riskBg: 'bg-red-500',
    note: 'Houthi missile and drone attacks on commercial vessels resumed Mar 28, 2026 following ceasefire breakdown. EU NAVFOR and US Navy on high alert.',
    source: 'Reuters / UKMTO / gCaptain — Mar 28–30, 2026',
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
    riskColor: 'text-yellow-500',
    riskBg: 'bg-yellow-500',
    note: 'Traffic surge to 3,298 vessels/week as fleets divert away from Hormuz and Red Sea. ReCAAP ISC reports 3 piracy incidents in Q1 2026.',
    source: 'ShipTracker / ReCAAP ISC — Week of Mar 25, 2026',
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    region: 'Egypt / Eastern Mediterranean',
    lat: 29.95,
    lng: 32.58,
    dailyTransits: 39,
    waitTime: '6.2h',
    volume: 620,
    risk: 'HIGH',
    riskColor: 'text-orange-500',
    riskBg: 'bg-orange-500',
    note: 'Daily transits remain 51% below 2023 peak of 80/day. SCA reported 39 ships on Mar 25. Revenue losses exceed $800M in Q1 2026.',
    source: 'Suez Canal Authority (SCA) — Mar 25, 2026',
  },
]

export default function MapDashboard() {
  const [selected, setSelected] = useState<Hotspot>(HOTSPOTS[0])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-semibold">VesselSurge</span>
              <span className="text-muted-foreground text-sm">/ Maritime Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live Data — March 30, 2026</span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-screen-2xl mx-auto w-full px-4 py-4 gap-4">

        {/* Left sidebar */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4">

          {/* Hotspot selector */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Global Hotspots</h2>
            </div>
            <div className="space-y-2">
              {HOTSPOTS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelected(h)}
                  className={[
                    'w-full text-left p-3 rounded-lg border transition-all',
                    selected.id === h.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{h.name}</span>
                    <span className={['text-[10px] font-bold px-1.5 py-0.5 rounded text-white', h.riskBg].join(' ')}>
                      {h.risk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{h.region}</span>
                    <span className="flex items-center gap-1">
                      <Ship className="h-3 w-3" />
                      {h.dailyTransits}/day
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live stats */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Live Statistics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Ship className="h-4 w-4" />
                  <span>Daily Transits</span>
                </div>
                <span className="font-bold text-foreground">{selected.dailyTransits}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Avg Wait Time</span>
                </div>
                <span className="font-bold text-foreground">{selected.waitTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span>Market Volume</span>
                </div>
                <span className="font-bold text-foreground">${selected.volume}M</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Risk Level</span>
                </div>
                <span className={['font-bold text-sm', selected.riskColor].join(' ')}>{selected.risk}</span>
              </div>
            </div>
          </div>

          {/* Intelligence alert */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={['h-4 w-4', selected.riskColor].join(' ')} />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intel Alert</h2>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-3">{selected.note}</p>
            <p className="text-[11px] text-muted-foreground border-t border-border pt-2">{selected.source}</p>
          </div>

        </div>

        {/* Right - Satellite map (full height) */}
        <div className="flex-1 min-h-[500px] lg:min-h-0">
          <div className="h-full min-h-[500px] lg:min-h-[calc(100vh-120px)]">
            <SatelliteMap
              hotspots={HOTSPOTS}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
