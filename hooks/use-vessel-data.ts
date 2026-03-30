"use client"

import useSWR from "swr"

// Strait of Hormuz bounding box
export const HORMUZ_BOUNDS = {
  minLat: 26.0,
  maxLat: 27.5,
  minLon: 55.0,
  maxLon: 57.0,
}

export interface Vessel {
  mmsi: string
  imo: string
  name: string
  type: "Tanker" | "Cargo" | "Container" | "Bulk Carrier" | "Other"
  flag: string
  lat: number
  lon: number
  sog: number // Speed Over Ground (knots)
  cog: number // Course Over Ground (degrees)
  heading: number
  destination: string
  eta: string
  cargo: string
  status: "Cleared" | "In Transit" | "Stopped"
  timestamp: string
}

export interface VesselDataState {
  vessels: Vessel[]
  isLoading: boolean
  error: Error | null
  isConnected: boolean
  lastUpdate: Date | null
  uniqueCount: number
}

// Simulated vessel data for demonstration (used when API key not configured)
const generateSimulatedVessels = (): Vessel[] => {
  const vesselNames = [
    "PACIFIC VOYAGER", "NORDIC SPIRIT", "ARABIAN GULF", "EASTERN HORIZON",
    "BLUE MARLIN", "GOLDEN PHOENIX", "OCEAN NAVIGATOR", "PERSIAN STAR",
    "GULF TRADER", "ASIAN VENTURE", "CRIMSON TIDE", "EMERALD SEA",
    "HORIZON GLORY", "COASTAL EXPLORER", "MARITIME PIONEER"
  ]
  
  const flags = ["SG", "NO", "AE", "PA", "LR", "MT", "HK", "GR", "JP", "KR"]
  const types: Vessel["type"][] = ["Tanker", "Cargo", "Container", "Bulk Carrier"]
  const destinations = ["Singapore", "Rotterdam", "Shanghai", "Mumbai", "Fujairah", "Jebel Ali"]
  const cargoTypes = ["Crude Oil", "LNG", "Refined Products", "General Cargo", "Containers", "Bulk Grain"]

  return vesselNames.map((name, index) => {
    const lat = HORMUZ_BOUNDS.minLat + Math.random() * (HORMUZ_BOUNDS.maxLat - HORMUZ_BOUNDS.minLat)
    const lon = HORMUZ_BOUNDS.minLon + Math.random() * (HORMUZ_BOUNDS.maxLon - HORMUZ_BOUNDS.minLon)
    const sog = index === 2 ? 0 : index === 7 ? 0.3 : 8 + Math.random() * 10 // Some stopped
    
    let status: Vessel["status"] = "In Transit"
    if (sog < 0.5) status = "Stopped"
    else if (Math.random() > 0.7) status = "Cleared"

    return {
      mmsi: `${210000000 + index * 1000 + Math.floor(Math.random() * 1000)}`,
      imo: `IMO${9000000 + index * 100000 + Math.floor(Math.random() * 100000)}`,
      name,
      type: types[index % types.length],
      flag: flags[index % flags.length],
      lat,
      lon,
      sog: Math.round(sog * 10) / 10,
      cog: Math.floor(Math.random() * 360),
      heading: Math.floor(Math.random() * 360),
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      eta: new Date(Date.now() + Math.random() * 86400000 * 3).toISOString(),
      cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
      status,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
    }
  })
}

// API response interface
interface APIResponse {
  vessels: Vessel[]
  stats: {
    totalVessels: number
    tankers: number
    avgSpeed: number
    stoppedCount: number
  }
  lastUpdate: string
  demo: boolean
  error?: string
}

// Fetcher function - calls our secure API route
const fetcher = async (url: string): Promise<APIResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch vessel data")
  }
  
  const data = await response.json()
  
  // If error or demo mode, return simulated data with API response structure
  if (data.error || data.demo) {
    const simulatedVessels = generateSimulatedVessels()
    const tankers = simulatedVessels.filter(v => v.type === "Tanker").length
    const totalSpeed = simulatedVessels.reduce((sum, v) => sum + v.sog, 0)
    const avgSpeed = simulatedVessels.length > 0 
      ? Math.round((totalSpeed / simulatedVessels.length) * 10) / 10 
      : 0
    const stoppedCount = simulatedVessels.filter(v => v.sog < 0.5).length
    
    return {
      vessels: simulatedVessels,
      stats: {
        totalVessels: simulatedVessels.length,
        tankers,
        avgSpeed,
        stoppedCount,
      },
      lastUpdate: new Date().toISOString(),
      demo: true,
    }
  }
  
  return data as APIResponse
}

// Main hook for vessel data with automatic refresh
export function useVesselData() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<APIResponse>(
    "/api/vessels",
    fetcher,
    {
      refreshInterval: 15000, // Refresh every 15 seconds for more real-time feel
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      keepPreviousData: true, // Keep showing old data while refreshing
    }
  )

  const vessels = data?.vessels || []
  const stats = data?.stats || { totalVessels: 0, tankers: 0, avgSpeed: 0, stoppedCount: 0 }
  const uniqueMMSIs = new Set(vessels.map(v => v.mmsi))
  const stoppedVessels = vessels.filter(v => v.sog < 0.5)
  const isDemo = data?.demo ?? true
  const isRefreshing = isValidating && !isLoading // Background refresh in progress
  
  return {
    vessels,
    stats,
    isLoading,
    isRefreshing,
    error,
    isConnected: !error && !isLoading && !isDemo,
    isDemo,
    lastUpdate: data?.lastUpdate ? new Date(data.lastUpdate) : null,
    uniqueCount: uniqueMMSIs.size,
    stoppedVessels,
    refetch: mutate,
  }
}

// Hook for selected vessel state
export function useSelectedVessel() {
  // This will be managed by the page component
  return null
}
