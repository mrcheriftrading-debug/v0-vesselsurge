// Maritime Intelligence Data Module - VesselSurge 2026

export interface VesselData {
  id: string
  name: string
  imo: string
  type: "Tanker" | "Container" | "Bulk" | "LNG" | "Cargo"
  flag: string
  lat: number
  lng: number
  speed: number
  course: number
  status: "Underway" | "Anchored" | "Moored" | "Stopped"
  destination: string
  aiMatchScore: number
}

export interface MaritimeHotspot {
  id: string
  name: string
  shortName: string
  coordinates: { lat: number; lng: number }
  zoom: number
  description: string
  stats: {
    marketVolume: number
    avgTransitTime: number
    activeAlerts: number
  }
  alerts: string[]
  vessels: VesselData[]
}

export const maritimeIntelligence: Record<string, MaritimeHotspot> = {
  hormuz: {
    id: "hormuz",
    name: "Strait of Hormuz",
    shortName: "Hormuz",
    coordinates: { lat: 26.5, lng: 56.2 },
    zoom: 9,
    description: "Critical oil chokepoint",
    stats: { marketVolume: 312, avgTransitTime: 4.2, activeAlerts: 3 },
    alerts: ["High Density", "Security Active"],
    vessels: [
      { id: "v1", name: "PACIFIC VOYAGER", imo: "IMO9834521", type: "Tanker", flag: "SG", lat: 26.52, lng: 56.15, speed: 12.3, course: 285, status: "Underway", destination: "Rotterdam", aiMatchScore: 94 },
      { id: "v2", name: "ARABIAN SPIRIT", imo: "IMO9756123", type: "LNG", flag: "QA", lat: 26.48, lng: 56.22, speed: 14.1, course: 310, status: "Underway", destination: "Tokyo", aiMatchScore: 88 },
      { id: "v3", name: "GOLDEN HORIZON", imo: "IMO9812456", type: "Tanker", flag: "PA", lat: 26.55, lng: 56.08, speed: 11.8, course: 275, status: "Underway", destination: "Mumbai", aiMatchScore: 91 },
    ],
  },
  suez: {
    id: "suez",
    name: "Suez Canal",
    shortName: "Suez",
    coordinates: { lat: 29.9, lng: 32.5 },
    zoom: 10,
    description: "Global trade artery",
    stats: { marketVolume: 245, avgTransitTime: 12.8, activeAlerts: 1 },
    alerts: ["Clear Transit"],
    vessels: [
      { id: "s1", name: "MAERSK SEALAND", imo: "IMO9778234", type: "Container", flag: "DK", lat: 29.95, lng: 32.55, speed: 8.5, course: 175, status: "Underway", destination: "Singapore", aiMatchScore: 96 },
      { id: "s2", name: "EVER GLORY", imo: "IMO9811234", type: "Container", flag: "TW", lat: 30.02, lng: 32.48, speed: 9.2, course: 180, status: "Underway", destination: "Rotterdam", aiMatchScore: 89 },
    ],
  },
  malacca: {
    id: "malacca",
    name: "Malacca Strait",
    shortName: "Malacca",
    coordinates: { lat: 2.5, lng: 101.5 },
    zoom: 8,
    description: "Asia-Pacific gateway",
    stats: { marketVolume: 198, avgTransitTime: 8.4, activeAlerts: 2 },
    alerts: ["Heavy Traffic", "Weather Advisory"],
    vessels: [
      { id: "m1", name: "COSCO SHIPPING", imo: "IMO9734567", type: "Container", flag: "CN", lat: 2.52, lng: 101.48, speed: 15.2, course: 135, status: "Underway", destination: "Los Angeles", aiMatchScore: 92 },
    ],
  },
}

// Helper function to apply stats jitter for live updates
export function applyStatsJitter(stats: MaritimeHotspot["stats"]): MaritimeHotspot["stats"] {
  return {
    ...stats,
    marketVolume: stats.marketVolume + Math.floor((Math.random() - 0.5) * 2),
  }
}

// Helper function to apply vessel position jitter for live tracking effect
export function applyVesselJitter(vessel: VesselData): VesselData {
  return {
    ...vessel,
    lat: vessel.lat + (Math.random() - 0.5) * 0.002,
    lng: vessel.lng + (Math.random() - 0.5) * 0.002,
    speed: Math.max(0, vessel.speed + (Math.random() - 0.5) * 0.4),
    course: (vessel.course + (Math.random() - 0.5) * 2 + 360) % 360,
  }
}
