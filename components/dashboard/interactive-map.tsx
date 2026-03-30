"use client"

import { useState, useEffect, useRef } from "react"
import { Ship, Anchor, Navigation2, Zap, X, Gauge, Compass, ChevronRight, Waves, MapPin } from "lucide-react"
import { type MaritimeHotspot, type VesselData } from "@/lib/maritime-intelligence"

interface InteractiveMapProps {
  activeRegion: MaritimeHotspot
  vessels: VesselData[]
  onVesselSelect: (vessel: VesselData | null) => void
  selectedVessel: VesselData | null
}

// Get vessel icon color based on type
const getVesselColor = (type: string) => {
  switch (type) {
    case "tanker": return { main: "#f59e0b", glow: "rgba(245, 158, 11, 0.5)" }
    case "cargo": return { main: "#22c55e", glow: "rgba(34, 197, 94, 0.5)" }
    case "container": return { main: "#3b82f6", glow: "rgba(59, 130, 246, 0.5)" }
    case "lng": return { main: "#8b5cf6", glow: "rgba(139, 92, 246, 0.5)" }
    default: return { main: "#0077ff", glow: "rgba(0, 119, 255, 0.5)" }
  }
}

const getVesselIcon = (type: string) => {
  switch (type) {
    case "tanker": return "T"
    case "cargo": return "C"
    case "container": return "B"
    case "lng": return "L"
    default: return "V"
  }
}

export function InteractiveMap({ activeRegion, vessels, onVesselSelect, selectedVessel }: InteractiveMapProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevRegionRef = useRef(activeRegion.id)

  useEffect(() => {
    if (prevRegionRef.current !== activeRegion.id) {
      setIsTransitioning(true)
      setTimeout(() => setIsTransitioning(false), 500)
      prevRegionRef.current = activeRegion.id
    }
  }, [activeRegion.id])

  // Convert lat/lng to relative position on map
  const getVesselPosition = (vessel: VesselData) => {
    const latRange = 2.5
    const lngRange = 4
    const centerLat = activeRegion.coordinates.lat
    const centerLng = activeRegion.coordinates.lng
    
    const x = 50 + ((vessel.lng - centerLng) / lngRange) * 50
    const y = 50 - ((vessel.lat - centerLat) / latRange) * 50
    
    return { 
      x: Math.max(8, Math.min(92, x)), 
      y: Math.max(8, Math.min(92, y)) 
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050a18]">
      {/* Ocean background with depth effect */}
      <div className="absolute inset-0">
        <div 
          className={`absolute inset-0 transition-opacity duration-700 ${isTransitioning ? "opacity-30" : "opacity-100"}`}
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at 50% 40%, rgba(0, 60, 120, 0.3) 0%, transparent 60%),
              radial-gradient(ellipse 80% 60% at 30% 70%, rgba(0, 80, 140, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 70% 30%, rgba(0, 100, 160, 0.15) 0%, transparent 50%),
              linear-gradient(180deg, #030810 0%, #0a1525 50%, #051020 100%)
            `
          }}
        />
        
        {/* Animated water effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 animate-pulse" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 Q15 25 30 30 T60 30' fill='none' stroke='%23004080' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 30px'
          }} />
        </div>

        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 150, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 150, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }}
        />
      </div>

      {/* Shipping lane indicators */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
        <defs>
          <linearGradient id="laneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#0077ff" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {/* Main shipping lane */}
        <path
          d="M 10% 60% Q 30% 45% 50% 50% T 90% 40%"
          fill="none"
          stroke="url(#laneGradient)"
          strokeWidth="3"
          strokeDasharray="10,5"
          className="animate-pulse"
        />
        <path
          d="M 5% 30% Q 25% 50% 50% 45% T 95% 55%"
          fill="none"
          stroke="url(#laneGradient)"
          strokeWidth="2"
          strokeDasharray="8,4"
          style={{ opacity: 0.6 }}
        />
      </svg>

      {/* Region Label */}
      <div className="absolute top-4 left-4 z-20">
        <div className="rounded-xl border border-primary/30 bg-[#0a1628]/90 backdrop-blur-sm px-4 py-3 shadow-lg shadow-primary/10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">{activeRegion.name}</span>
              <div className="text-[10px] font-mono text-muted-foreground">
                {activeRegion.coordinates.lat.toFixed(3)}°N, {activeRegion.coordinates.lng.toFixed(3)}°E
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vessel Legend */}
      <div className="absolute top-4 right-4 z-20">
        <div className="rounded-xl border border-border bg-[#0a1628]/90 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Vessel Types</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}>T</span>
              <span className="text-muted-foreground">Tanker</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.3)', color: '#22c55e' }}>C</span>
              <span className="text-muted-foreground">Cargo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)', color: '#3b82f6' }}>B</span>
              <span className="text-muted-foreground">Container</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)', color: '#8b5cf6' }}>L</span>
              <span className="text-muted-foreground">LNG</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Active</span>
            <span className="font-mono text-sm font-bold text-primary">{vessels.length}</span>
          </div>
        </div>
      </div>

      {/* Compass Rose */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="rounded-full border border-border bg-[#0a1628]/90 backdrop-blur-sm p-2 shadow-lg">
          <div className="relative h-12 w-12">
            <Compass className="h-12 w-12 text-muted-foreground/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[8px] font-bold text-primary">N</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vessels */}
      <div className="absolute inset-0 z-10">
        {vessels.map((vessel) => {
          const pos = getVesselPosition(vessel)
          const isSelected = selectedVessel?.id === vessel.id
          const colors = getVesselColor(vessel.type)
          const icon = getVesselIcon(vessel.type)
          
          return (
            <button
              key={vessel.id}
              onClick={() => onVesselSelect(isSelected ? null : vessel)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group ${
                isSelected ? "z-30 scale-110" : "z-10 hover:scale-110 hover:z-20"
              }`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              title={`${vessel.name} - ${vessel.type}`}
            >
              <div className="relative">
                {/* Pulse ring for selected */}
                {isSelected && (
                  <>
                    <span 
                      className="absolute inset-[-8px] animate-ping rounded-full opacity-40" 
                      style={{ backgroundColor: colors.main }} 
                    />
                    <span 
                      className="absolute inset-[-4px] rounded-full opacity-60" 
                      style={{ backgroundColor: colors.glow }} 
                    />
                  </>
                )}
                
                {/* Direction indicator line */}
                <div 
                  className="absolute left-1/2 top-1/2 h-8 w-0.5 origin-bottom transition-opacity"
                  style={{ 
                    backgroundColor: colors.main,
                    transform: `translate(-50%, -100%) rotate(${vessel.course}deg)`,
                    opacity: isSelected ? 0.8 : 0.4
                  }}
                />
                
                {/* Vessel marker */}
                <div 
                  className={`relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all shadow-lg ${
                    isSelected ? "border-white" : "border-transparent group-hover:border-white/50"
                  }`}
                  style={{ 
                    backgroundColor: `${colors.main}40`,
                    boxShadow: `0 0 ${isSelected ? '25px' : '15px'} ${colors.glow}, inset 0 0 20px ${colors.glow}`
                  }}
                >
                  <span 
                    className="text-sm font-bold"
                    style={{ color: colors.main }}
                  >
                    {icon}
                  </span>
                </div>

                {/* Vessel name on hover */}
                <div className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-200 pointer-events-none ${
                  isSelected ? "bottom-[-36px] opacity-100" : "bottom-[-30px] opacity-0 group-hover:opacity-100 group-hover:bottom-[-36px]"
                }`}>
                  <div className="rounded-md border border-border bg-[#0a1628] px-2 py-1 text-[10px] font-medium text-foreground shadow-lg">
                    {vessel.name}
                    <div className="text-[8px] text-muted-foreground">{vessel.speed.toFixed(1)} kn</div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Vessel Detail Panel */}
      {selectedVessel && (
        <div className="absolute bottom-4 left-4 z-30 w-80 animate-in slide-in-from-left-4 duration-300">
          <div className="rounded-2xl border border-primary/30 bg-[#0a1628]/95 backdrop-blur-md overflow-hidden shadow-2xl shadow-primary/20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/20 to-transparent px-4 py-3">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
                  style={{ 
                    backgroundColor: `${getVesselColor(selectedVessel.type).main}30`,
                    color: getVesselColor(selectedVessel.type).main
                  }}
                >
                  {getVesselIcon(selectedVessel.type)}
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">{selectedVessel.name}</span>
                  <div className="text-[10px] text-muted-foreground capitalize">{selectedVessel.type} Vessel</div>
                </div>
              </div>
              <button 
                onClick={() => onVesselSelect(null)}
                className="rounded-full p-1.5 hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-secondary/30 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    <Gauge className="h-3 w-3" />
                    Speed
                  </div>
                  <div className="font-mono text-lg font-bold text-foreground">{selectedVessel.speed.toFixed(1)}<span className="text-xs text-muted-foreground ml-1">kn</span></div>
                </div>
                <div className="rounded-xl bg-secondary/30 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    <Navigation2 className="h-3 w-3" />
                    Course
                  </div>
                  <div className="font-mono text-lg font-bold text-foreground">{Math.round(selectedVessel.course)}<span className="text-xs text-muted-foreground ml-1">°</span></div>
                </div>
              </div>

              <div className="rounded-xl bg-secondary/30 p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  <Anchor className="h-3 w-3" />
                  Position
                </div>
                <div className="font-mono text-sm text-foreground">
                  {selectedVessel.lat.toFixed(4)}°N, {selectedVessel.lng.toFixed(4)}°E
                </div>
              </div>

              {/* AI Match Score */}
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium text-foreground">AI Match Score</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{selectedVessel.aiMatchScore}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-700"
                    style={{ width: `${selectedVessel.aiMatchScore}%` }}
                  />
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground">
                  Based on your fleet requirements and cargo preferences
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30">
                Request Partnership Quote
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex flex-col items-center gap-1">
          <div className="h-0.5 w-24 bg-muted-foreground/50 relative">
            <div className="absolute left-0 top-0 h-2 w-0.5 bg-muted-foreground/50 -translate-y-1/2" />
            <div className="absolute right-0 top-0 h-2 w-0.5 bg-muted-foreground/50 -translate-y-1/2" />
          </div>
          <span className="text-[10px] text-muted-foreground">~50 nm</span>
        </div>
      </div>

      {/* No vessels message */}
      {vessels.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center rounded-xl border border-border bg-[#0a1628]/90 backdrop-blur-sm p-8">
            <Waves className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-foreground">No Active Vessels</p>
            <p className="mt-1 text-sm text-muted-foreground">No vessels detected in this region</p>
          </div>
        </div>
      )}
    </div>
  )
}
