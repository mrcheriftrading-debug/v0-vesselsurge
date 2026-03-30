"use client"

import { MapPin, Radio, Layers, ZoomIn, ZoomOut, Maximize2, X, Navigation, Anchor, Package, Ship } from "lucide-react"
import { HORMUZ_BOUNDS, type Vessel } from "@/hooks/use-vessel-data"
import { MapSkeleton } from "./skeletons"

interface StraitMapProps {
  vessels: Vessel[]
  isLoading: boolean
  isConnected: boolean
  lastUpdate: Date | null
  selectedVessel: Vessel | null
  onSelectVessel: (vessel: Vessel | null) => void
}

export function StraitMap({ 
  vessels, 
  isLoading, 
  isConnected, 
  lastUpdate, 
  selectedVessel,
  onSelectVessel 
}: StraitMapProps) {
  
  if (isLoading) {
    return <MapSkeleton />
  }

  // Convert lat/lon to SVG coordinates
  const toSvgCoords = (lat: number, lon: number) => {
    const x = ((lon - HORMUZ_BOUNDS.minLon) / (HORMUZ_BOUNDS.maxLon - HORMUZ_BOUNDS.minLon)) * 800
    const y = ((HORMUZ_BOUNDS.maxLat - lat) / (HORMUZ_BOUNDS.maxLat - HORMUZ_BOUNDS.minLat)) * 500
    return { x, y }
  }

  const getVesselColor = (vessel: Vessel) => {
    if (vessel.sog < 0.5) return "#f59e0b" // Stopped - Amber
    if (vessel.status === "Cleared") return "#22c55e" // Cleared - Green
    return "#0077ff" // In Transit - Blue
  }

  const getTypeIcon = (type: Vessel["type"]) => {
    switch (type) {
      case "Tanker": return <Anchor className="h-4 w-4" />
      case "Container": return <Package className="h-4 w-4" />
      default: return <Ship className="h-4 w-4" />
    }
  }

  const lastUpdateStr = lastUpdate 
    ? `${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago`
    : "--:--"

  return (
    <div className="glass relative h-full min-h-[240px] overflow-hidden rounded-lg border border-border">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Strait of Hormuz</span>
          </div>
          <span className="rounded border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {HORMUZ_BOUNDS.minLat}°-{HORMUZ_BOUNDS.maxLat}°N, {HORMUZ_BOUNDS.minLon}°-{HORMUZ_BOUNDS.maxLon}°E
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            <span className="text-xs font-medium text-primary">Live AIS Feed</span>
          </div>
        </div>
      </div>

      {/* Map Placeholder with Grid Overlay */}
      <div className="grid-overlay absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#050505] via-[#0a1628] to-[#050505]">
        {/* Simulated Coastline */}
        <svg 
          className="absolute inset-0 h-full w-full cursor-crosshair" 
          viewBox="0 0 800 500" 
          preserveAspectRatio="xMidYMid slice"
          onClick={() => onSelectVessel(null)}
        >
          {/* Iran Coast */}
          <path
            d="M0,50 Q200,80 350,120 T500,150 Q600,180 700,200 L800,180 L800,0 L0,0 Z"
            fill="#1a1a1a"
            stroke="#2a2a2a"
            strokeWidth="1"
          />
          {/* UAE/Oman Coast */}
          <path
            d="M0,450 Q100,400 200,380 T400,350 Q500,330 650,320 T800,350 L800,500 L0,500 Z"
            fill="#1a1a1a"
            stroke="#2a2a2a"
            strokeWidth="1"
          />
          
          {/* Shipping Lane */}
          <path
            d="M50,250 Q200,230 400,240 T700,260"
            fill="none"
            stroke="#0077ff"
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity="0.4"
          />
          
          {/* Vessel Markers */}
          <g>
            {vessels.map((vessel) => {
              const coords = toSvgCoords(vessel.lat, vessel.lon)
              const color = getVesselColor(vessel)
              const isSelected = selectedVessel?.mmsi === vessel.mmsi
              const isStopped = vessel.sog < 0.5

              return (
                <g 
                  key={vessel.mmsi} 
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectVessel(vessel)
                  }}
                >
                  {/* Pulse ring for stopped/selected vessels */}
                  {(isStopped || isSelected) && (
                    <circle 
                      cx={coords.x} 
                      cy={coords.y} 
                      r={isSelected ? 16 : 12} 
                      fill="none" 
                      stroke={color} 
                      strokeWidth="2" 
                      opacity="0.5"
                      className={isStopped ? "animate-pulse" : ""}
                    />
                  )}
                  {/* Main marker */}
                  <circle 
                    cx={coords.x} 
                    cy={coords.y} 
                    r={isSelected ? 8 : 6} 
                    fill={color}
                    className={isStopped ? "animate-pulse" : ""}
                  />
                  {/* Direction indicator */}
                  <line
                    x1={coords.x}
                    y1={coords.y}
                    x2={coords.x + Math.sin((vessel.cog * Math.PI) / 180) * 15}
                    y2={coords.y - Math.cos((vessel.cog * Math.PI) / 180) * 15}
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.6"
                  />
                </g>
              )
            })}
          </g>

          {/* Labels */}
          <text x="100" y="100" fill="#737373" fontSize="12" fontFamily="monospace">IRAN</text>
          <text x="150" y="420" fill="#737373" fontSize="12" fontFamily="monospace">UAE</text>
          <text x="600" y="400" fill="#737373" fontSize="12" fontFamily="monospace">OMAN</text>
        </svg>

        {/* Selected Vessel Popup */}
        {selectedVessel && (
          <div 
            className="absolute z-20 w-72 rounded-lg border border-border bg-card/95 shadow-xl backdrop-blur-sm"
            style={{
              left: `${Math.min(Math.max(toSvgCoords(selectedVessel.lat, selectedVessel.lon).x / 8, 10), 60)}%`,
              top: `${Math.min(Math.max(toSvgCoords(selectedVessel.lat, selectedVessel.lon).y / 5 + 10, 20), 60)}%`,
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`rounded-md p-1.5 ${selectedVessel.sog < 0.5 ? "bg-amber-500/20 text-amber-500" : "bg-primary/20 text-primary"}`}>
                  {getTypeIcon(selectedVessel.type)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedVessel.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{selectedVessel.imo}</p>
                </div>
              </div>
              <button 
                onClick={() => onSelectVessel(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Type</span>
                <p className="text-sm text-foreground">{selectedVessel.type}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Flag</span>
                <p className="text-sm text-foreground">{selectedVessel.flag}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Speed</span>
                <p className={`text-sm font-mono ${selectedVessel.sog < 0.5 ? "text-amber-500" : "text-foreground"}`}>
                  {selectedVessel.sog} kn
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Course</span>
                <p className="text-sm font-mono text-foreground">{selectedVessel.cog}°</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Cargo Info</span>
                <p className="text-sm text-foreground">{selectedVessel.cargo}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Destination</span>
                <p className="text-sm text-foreground">{selectedVessel.destination}</p>
              </div>
            </div>
            {selectedVessel.sog < 0.5 && (
              <div className="mx-4 mb-4 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <Navigation className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-500">
                  <strong>Warning:</strong> Vessel stopped in shipping lane
                </span>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-16 left-4 flex flex-col gap-2 rounded-md border border-border bg-card/90 p-3 backdrop-blur-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Legend</span>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary"></span>
            <span className="text-xs text-muted-foreground">In Transit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
            <span className="text-xs text-muted-foreground">Cleared</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500"></span>
            <span className="text-xs text-muted-foreground">Stopped / Alert</span>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute right-4 bottom-16 flex flex-col gap-1">
        <button className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Layers className="h-4 w-4" />
        </button>
        <button className="rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* MarineTraffic API Status */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-md border border-border bg-card/80 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Data source: MarineTraffic API | Last update: <span className="font-mono text-foreground">{lastUpdateStr}</span>
          </span>
        </div>
        <span className={`rounded border px-2 py-0.5 text-xs ${
          isConnected 
            ? "border-green-500/30 bg-green-500/10 text-green-500" 
            : "border-red-500/30 bg-red-500/10 text-red-500"
        }`}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  )
}
