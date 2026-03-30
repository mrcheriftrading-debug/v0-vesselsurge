"use client"

import { Ship, Clock, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { type Vessel } from "@/hooks/use-vessel-data"
import { KPICardSkeleton } from "./skeletons"

interface KPICardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ReactNode
  data: { value: number }[]
  color: string
}

function KPICard({ title, value, change, trend, icon, data, color }: KPICardProps) {
  return (
    <div className="glass rounded-lg border border-border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs ${
          trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
        }`}>
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : trend === "down" ? (
            <TrendingDown className="h-3 w-3" />
          ) : null}
          <span>{change}</span>
        </div>
      </div>
      
      <div className="mt-3">
        <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
      </div>

      <div className="mt-4 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#gradient-${title.replace(/\s/g, '-')})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Generate chart data with some trend
const generateChartData = (points: number, variance: number, base: number) => {
  return Array.from({ length: points }, (_, i) => ({
    value: base + Math.sin(i * 0.5) * variance * 0.5 + Math.random() * variance * 0.3,
  }))
}

interface KPICardsProps {
  vessels: Vessel[]
  isLoading: boolean
  stoppedCount: number
}

export function KPICards({ vessels, isLoading, stoppedCount }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    )
  }

  // Calculate real vessel count from unique MMSIs
  const uniqueMMSIs = new Set(vessels.map(v => v.mmsi))
  const vesselCount = uniqueMMSIs.size

  // Calculate average transit speed (as proxy for transit time)
  const inTransitVessels = vessels.filter(v => v.sog >= 0.5)
  const avgSpeed = inTransitVessels.length > 0 
    ? inTransitVessels.reduce((sum, v) => sum + v.sog, 0) / inTransitVessels.length 
    : 0
  // Estimate transit time based on strait length (~200km) and avg speed
  const avgTransitHours = avgSpeed > 0 ? (200 / (avgSpeed * 1.852)).toFixed(1) : "N/A"

  // Calculate percentage change (simulated based on time of day)
  const hour = new Date().getHours()
  const vesselChangePercent = hour > 12 ? "+12.3%" : "+8.7%"
  const transitChange = avgSpeed > 12 ? "-8.5%" : "+3.2%"

  const kpis: KPICardProps[] = [
    {
      title: "Vessels Passed Today",
      value: vesselCount.toString(),
      change: vesselChangePercent,
      trend: "up",
      icon: <Ship className="h-4 w-4" />,
      data: generateChartData(20, 50, vesselCount),
      color: "#0077ff",
    },
    {
      title: "Avg Transit Time",
      value: `${avgTransitHours}h`,
      change: transitChange,
      trend: transitChange.startsWith("-") ? "down" : "up",
      icon: <Clock className="h-4 w-4" />,
      data: generateChartData(20, 2, parseFloat(avgTransitHours) || 4),
      color: "#22c55e",
    },
    {
      title: "Active Alerts",
      value: stoppedCount.toString(),
      change: stoppedCount > 0 ? `+${stoppedCount}` : "0",
      trend: stoppedCount > 0 ? "up" : "neutral",
      icon: <AlertTriangle className="h-4 w-4" />,
      data: generateChartData(20, 3, stoppedCount),
      color: "#f59e0b",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  )
}
