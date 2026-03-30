"use client"

import { Globe, Anchor, Ship, MapPin, Waves } from "lucide-react"
import { type MaritimeHotspot } from "@/lib/maritime-intelligence"

interface HotspotSelectorProps {
  hotspots: MaritimeHotspot[]
  activeHotspot: MaritimeHotspot
  onSelect: (hotspot: MaritimeHotspot) => void
}

const hotspotIcons: Record<string, React.ReactNode> = {
  global: <Globe className="h-4 w-4" />,
  hormuz: <Anchor className="h-4 w-4" />,
  suez: <Ship className="h-4 w-4" />,
  malacca: <Waves className="h-4 w-4" />,
  english: <MapPin className="h-4 w-4" />,
}

export function HotspotSelector({ hotspots, activeHotspot, onSelect }: HotspotSelectorProps) {
  return (
    <div className="glass rounded-xl border border-border p-4">
      <div className="mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Global Hotspots
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {hotspots.map((hotspot) => {
          const isActive = hotspot.id === activeHotspot.id
          
          return (
            <button
              key={hotspot.id}
              onClick={() => onSelect(hotspot)}
              className={`relative flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                isActive 
                  ? "bg-primary/20 border border-primary/50" 
                  : "bg-secondary/50 border border-transparent hover:bg-secondary hover:border-border"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-primary transition-all duration-300" />
              )}

              <div className={`rounded-lg p-2 transition-colors duration-200 ${
                isActive ? "bg-primary/30 text-primary" : "bg-secondary text-muted-foreground"
              }`}>
                {hotspotIcons[hotspot.id] || <MapPin className="h-4 w-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium transition-colors duration-200 ${isActive ? "text-primary" : "text-foreground"}`}>
                  {hotspot.shortName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {hotspot.vessels.length > 0 ? `${hotspot.vessels.length} vessels` : "Overview"}
                </div>
              </div>

              {/* Alert count badge */}
              {hotspot.stats.activeAlerts > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200 ${
                  isActive 
                    ? "bg-amber-500/30 text-amber-400" 
                    : "bg-amber-500/20 text-amber-500"
                }`}>
                  {hotspot.stats.activeAlerts}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
