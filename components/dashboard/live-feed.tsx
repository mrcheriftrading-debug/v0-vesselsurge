"use client"

import { Ship, Anchor, Package, Clock, CheckCircle2, AlertCircle, StopCircle, AlertTriangle, MapPin } from "lucide-react"
import { type Vessel } from "@/hooks/use-vessel-data"
import { FeedSkeleton } from "./skeletons"

interface LiveFeedProps {
  vessels: Vessel[]
  isLoading: boolean
  selectedVessel: Vessel | null
  onSelectVessel: (vessel: Vessel | null) => void
}

const getTypeIcon = (type: Vessel["type"]) => {
  switch (type) {
    case "Tanker":
      return <Anchor className="h-4 w-4" />
    case "Cargo":
    case "Container":
      return <Package className="h-4 w-4" />
    default:
      return <Ship className="h-4 w-4" />
  }
}

const getStatusConfig = (status: Vessel["status"], sog: number) => {
  // Override status based on SOG for stoppage detection
  if (sog < 0.5) {
    return {
      icon: <StopCircle className="h-3.5 w-3.5" />,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      label: "Stopped",
    }
  }
  
  switch (status) {
    case "Cleared":
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        color: "text-green-500",
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        label: "Cleared",
      }
    case "In Transit":
      return {
        icon: <Clock className="h-3.5 w-3.5" />,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/30",
        label: "In Transit",
      }
    default:
      return {
        icon: <StopCircle className="h-3.5 w-3.5" />,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        label: "Stopped",
      }
  }
}

const formatTimeAgo = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function LiveFeed({ vessels, isLoading, selectedVessel, onSelectVessel }: LiveFeedProps) {
  if (isLoading) {
    return <FeedSkeleton />
  }

  // Sort by timestamp (most recent first) and limit to latest 10
  const sortedVessels = [...vessels]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  const stoppedCount = vessels.filter(v => v.sog < 0.5).length

  return (
    <div className="glass flex h-full flex-col rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Ship className="h-4 w-4 text-primary" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
          </div>
          <span className="text-sm font-medium text-foreground">Live Transit Feed</span>
        </div>
        <div className="flex items-center gap-2">
          {stoppedCount > 0 && (
            <span className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              {stoppedCount} Stopped
            </span>
          )}
          <span className="text-xs text-muted-foreground">{vessels.length} vessels</span>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto">
        {sortedVessels.map((vessel) => {
          const statusConfig = getStatusConfig(vessel.status, vessel.sog)
          const isAlert = vessel.sog < 0.5
          const isSelected = selectedVessel?.mmsi === vessel.mmsi

          return (
            <div
              key={vessel.mmsi}
              onClick={() => onSelectVessel(vessel)}
              className={`cursor-pointer border-b border-border px-4 py-3 transition-colors hover:bg-secondary/50 ${
                isAlert ? "bg-amber-500/5" : ""
              } ${isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-md p-1.5 ${
                    isAlert 
                      ? "bg-amber-500/20 text-amber-500" 
                      : isSelected 
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}>
                    {getTypeIcon(vessel.type)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{vessel.name}</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                        {vessel.flag}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{vessel.type}</span>
                      <span>|</span>
                      <span className="font-mono">{vessel.imo}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div
                    className={`flex items-center gap-1 rounded border px-2 py-0.5 ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}
                  >
                    {statusConfig.icon}
                    <span className="text-xs font-medium">{statusConfig.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">
                      SOG: <span className={isAlert ? "text-amber-500 font-semibold" : ""}>{vessel.sog}</span> kn
                    </span>
                    <span>|</span>
                    <span>{formatTimeAgo(vessel.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Risk Alert for stopped vessels */}
              {isAlert && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 pulse-glow" />
                    <span className="text-xs text-amber-500">
                      <strong>Risk Alert:</strong> SOG {"<"} 0.5 kn in shipping lane
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectVessel(vessel)
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-amber-500 transition-colors hover:bg-amber-500/20"
                  >
                    <MapPin className="h-3 w-3" />
                    View on Map
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <button className="w-full rounded-md border border-border bg-secondary py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground">
          View All Transits ({vessels.length})
        </button>
      </div>
    </div>
  )
}
