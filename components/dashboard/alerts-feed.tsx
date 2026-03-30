"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CloudRain, Shield, Ship, Waves, Zap, Clock } from "lucide-react"
import { type MaritimeHotspot } from "@/lib/maritime-intelligence"

interface AlertsFeedProps {
  activeRegion: MaritimeHotspot
  isRefreshing: boolean
}

const getAlertIcon = (alert: string) => {
  const lowerAlert = alert.toLowerCase()
  if (lowerAlert.includes("weather") || lowerAlert.includes("wind") || lowerAlert.includes("gale") || lowerAlert.includes("visibility") || lowerAlert.includes("haze")) {
    return <CloudRain className="h-4 w-4" />
  }
  if (lowerAlert.includes("security") || lowerAlert.includes("naval") || lowerAlert.includes("patrol") || lowerAlert.includes("piracy")) {
    return <Shield className="h-4 w-4" />
  }
  if (lowerAlert.includes("traffic") || lowerAlert.includes("congestion") || lowerAlert.includes("convoy")) {
    return <Ship className="h-4 w-4" />
  }
  if (lowerAlert.includes("maintenance") || lowerAlert.includes("bypass")) {
    return <Zap className="h-4 w-4" />
  }
  if (lowerAlert.includes("autonomous") || lowerAlert.includes("mass")) {
    return <Waves className="h-4 w-4" />
  }
  return <AlertTriangle className="h-4 w-4" />
}

const getAlertColor = (alert: string) => {
  const lowerAlert = alert.toLowerCase()
  if (lowerAlert.includes("warning") || lowerAlert.includes("gale") || lowerAlert.includes("security")) {
    return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: "text-red-500" }
  }
  if (lowerAlert.includes("advisory") || lowerAlert.includes("haze") || lowerAlert.includes("congestion") || lowerAlert.includes("delay")) {
    return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: "text-amber-500" }
  }
  if (lowerAlert.includes("green") || lowerAlert.includes("active") || lowerAlert.includes("patrol")) {
    return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: "text-green-500" }
  }
  return { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", icon: "text-primary" }
}

// Generate stable timestamps that don't cause hydration issues
const alertTimestamps = [5, 12, 18, 25, 8, 15, 22, 30]

export function AlertsFeed({ activeRegion, isRefreshing }: AlertsFeedProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Trigger fade animation on region change
  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 150)
    return () => clearTimeout(timer)
  }, [activeRegion.id])

  return (
    <div className="glass rounded-xl border border-border overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {isRefreshing && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-foreground">Regional Alerts</span>
        </div>
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
          {activeRegion.alerts.length} Active
        </span>
      </div>

      {/* Alert List */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        {activeRegion.alerts.map((alert, index) => {
          const colors = getAlertColor(alert)
          const timestamp = alertTimestamps[index % alertTimestamps.length]
          
          return (
            <div
              key={`${activeRegion.id}-${index}`}
              className={`rounded-lg border ${colors.border} ${colors.bg} p-3 transition-all duration-300`}
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: isVisible ? "fadeInLeft 0.3s ease-out forwards" : "none"
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${colors.icon}`}>
                  {getAlertIcon(alert)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${colors.text}`}>{alert}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Updated {timestamp}m ago</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Monitoring: {activeRegion.name}</span>
          <span className="font-mono">2026-03-26</span>
        </div>
      </div>
    </div>
  )
}
