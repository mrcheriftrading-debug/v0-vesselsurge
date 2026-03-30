"use client"

import { AlertTriangle, X, ExternalLink } from "lucide-react"
import { useState } from "react"

interface RiskAlertProps {
  vesselName: string
  vesselId: string
  location: string
  timestamp: string
}

export function RiskAlert({ vesselName, vesselId, location, timestamp }: RiskAlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="glass animate-in slide-in-from-top-2 rounded-lg border border-amber-500/50 bg-amber-500/10">
      <div className="flex items-start gap-4 p-4">
        <div className="rounded-md bg-amber-500/20 p-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-amber-500">Vessel Stopped in Shipping Lane</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Speed Over Ground (SOG) dropped to 0 knots
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Vessel:</span>
              <span className="font-mono font-medium text-foreground">{vesselName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">IMO:</span>
              <span className="font-mono text-foreground">{vesselId}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-mono text-foreground">{location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Detected:</span>
              <span className="font-mono text-foreground">{timestamp}</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-500 transition-colors hover:bg-amber-500/30">
              View on Map
              <ExternalLink className="h-3 w-3" />
            </button>
            <button className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground">
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ActiveAlerts() {
  return (
    <RiskAlert
      vesselName="ARABIAN GULF"
      vesselId="IMO9345678"
      location="26.4521°N, 56.2847°E"
      timestamp="8 min ago"
    />
  )
}
