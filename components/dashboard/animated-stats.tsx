"use client"

import { useEffect, useState, useRef } from "react"
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, RefreshCw } from "lucide-react"
import { type MaritimeHotspot } from "@/lib/maritime-intelligence"

interface AnimatedStatsProps {
  activeRegion: MaritimeHotspot
  isRefreshing: boolean
}

export function AnimatedStats({ activeRegion, isRefreshing }: AnimatedStatsProps) {
  const [stats, setStats] = useState(activeRegion.stats)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevRegionRef = useRef(activeRegion.id)

  useEffect(() => {
    if (prevRegionRef.current !== activeRegion.id) {
      setIsAnimating(true)
      setTimeout(() => {
        setStats(activeRegion.stats)
        setIsAnimating(false)
      }, 150)
      prevRegionRef.current = activeRegion.id
    }
  }, [activeRegion])

  // Add small fluctuations for live feel
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        marketVolume: prev.marketVolume + Math.floor((Math.random() - 0.5) * 6),
        avgTransitTime: Math.round((prev.avgTransitTime + (Math.random() - 0.5) * 0.3) * 10) / 10,
        activeAlerts: Math.max(0, prev.activeAlerts + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    {
      title: "Market Volume",
      value: stats.marketVolume,
      suffix: "M",
      change: 12.5,
      icon: DollarSign,
      color: "#0077ff",
    },
    {
      title: "Avg Transit Time",
      value: stats.avgTransitTime.toFixed(1),
      suffix: "h",
      change: -8.3,
      icon: Clock,
      color: "#22c55e",
    },
    {
      title: "Active Alerts",
      value: stats.activeAlerts,
      suffix: "",
      change: stats.activeAlerts > 2 ? 15.0 : -5.0,
      icon: AlertTriangle,
      color: "#f59e0b",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {statCards.map((card) => {
        const Icon = card.icon
        const isPositive = card.change >= 0
        return (
          <div
            key={card.title}
            className={`glass rounded-xl border border-border p-5 relative overflow-hidden transition-all duration-300 ${isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
          >
            {/* Refresh indicator */}
            {isRefreshing && (
              <div className="absolute top-3 right-3">
                <RefreshCw className="h-3 w-3 animate-spin text-accent" />
              </div>
            )}

            {/* Background glow */}
            <div 
              className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: card.color }}
            />

            <div className="relative">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <div className="rounded-lg p-2" style={{ backgroundColor: `${card.color}20` }}>
                  <Icon className="h-4 w-4" style={{ color: card.color }} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider">{card.title}</span>
              </div>

              <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
                {card.value}{card.suffix}
              </span>

              <div className="mt-3 flex items-center gap-2">
                <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isPositive 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-red-500/10 text-red-500"
                }`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isPositive ? "+" : ""}{card.change.toFixed(1)}%
                </div>
                <span className="text-xs text-muted-foreground">vs. yesterday</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
