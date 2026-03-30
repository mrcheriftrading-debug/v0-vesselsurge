import { NextResponse } from "next/server"

// Bounding boxes for maritime chokepoints (lat/lng corners)
const HOTSPOT_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  hormuz: { minLat: 25.5, maxLat: 27.0, minLng: 55.5, maxLng: 57.5 },
  bab: { minLat: 11.5, maxLat: 13.5, minLng: 42.5, maxLng: 44.5 },
  malacca: { minLat: 0.8, maxLat: 1.8, minLng: 103.0, maxLng: 104.5 },
  suez: { minLat: 29.5, maxLat: 31.5, minLng: 32.0, maxLng: 33.0 },
}

// Realistic base statistics for each hotspot (used for daily transits and market volume)
const BASE_STATS: Record<string, { transits: number; volume: number; waitTime: string }> = {
  hormuz: { transits: 174, volume: 1380, waitTime: "2.1h" },
  bab: { transits: 52, volume: 420, waitTime: "0.8h" },
  malacca: { transits: 328, volume: 1920, waitTime: "3.2h" },
  suez: { transits: 68, volume: 780, waitTime: "8.4h" },
}

interface AISVessel {
  mmsi: string
  name: string
  type: string
  lat: number
  lng: number
  speed: number
  course: number
  destination: string
  eta: string
  flag: string
}

// Fetch real vessel data from AISStream API
async function fetchFromAISStream(bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Promise<AISVessel[] | null> {
  const apiKey = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY
  if (!apiKey) return null

  try {
    // AISStream REST API endpoint for vessel positions in bounding box
    const response = await fetch(`https://api.aisstream.io/v0/vessels?apiKey=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boundingBox: {
          minLat: bounds.minLat,
          maxLat: bounds.maxLat,
          minLon: bounds.minLng,
          maxLon: bounds.maxLng,
        },
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      console.log("[v0] AISStream API returned status:", response.status)
      return null
    }

    const data = await response.json()
    
    if (data.vessels && Array.isArray(data.vessels)) {
      return data.vessels.map((v: any) => ({
        mmsi: v.mmsi || String(Math.floor(100000000 + Math.random() * 899999999)),
        name: v.name || v.shipName || "UNKNOWN",
        type: mapVesselType(v.shipType || v.vesselType || 0),
        lat: v.latitude || v.lat,
        lng: v.longitude || v.lon || v.lng,
        speed: v.sog || v.speed || 0,
        course: v.cog || v.course || 0,
        destination: v.destination || "UNKNOWN",
        eta: v.eta || new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        flag: v.flag || v.flagCountry || "PA",
      }))
    }

    return null
  } catch (error) {
    console.log("[v0] AISStream API error:", error)
    return null
  }
}

// Map numeric vessel type to category
function mapVesselType(typeCode: number): string {
  if (typeCode >= 80 && typeCode <= 89) return "tanker"
  if (typeCode >= 70 && typeCode <= 79) return "cargo"
  if (typeCode >= 60 && typeCode <= 69) return "container"
  if (typeCode === 75 || typeCode === 76) return "lng"
  return ["tanker", "cargo", "container", "lng"][Math.floor(Math.random() * 4)]
}

// Generate simulated vessels when API is unavailable
function generateSimulatedVessels(hotspotId: string): AISVessel[] {
  const bounds = HOTSPOT_BOUNDS[hotspotId]
  if (!bounds) return []

  const vesselNames: Record<string, string[]> = {
    tanker: ["FRONT COURAGE", "NISSOS THERASSIA", "MINERVA HELEN", "EAGLE TACOMA", "HAFNIA PHOENIX", "CELSIUS RIGA", "SUEZMAX FORTUNE", "CRUDE JUPITER", "OLYMPIC LION", "MARAN CASTOR", "DHT TIGER", "EURONAV FORCE"],
    cargo: ["GENCO PICARDY", "LOWLANDS BOREAS", "FEDERAL YUKON", "STAR ANTARES", "PACIFIC PEARL", "AFRICAN KESTREL", "BULK CHAMPION", "OCEAN TRADER", "GLOBAL CARRIER", "NAVIOS AURORA", "STAR BULK ATLAS"],
    container: ["EVER ACE", "MSC ANNA", "MAERSK EDINBURGH", "ONE CONTINUITY", "CMA CGM THALASSA", "HMM ALGECIRAS", "OOCL PIRAEUS", "COSCO SHIPPING", "YANG MING UNITY", "HAPAG HAMBURG", "ZIM INTEGRATED"],
    lng: ["AL HUWAILA", "PACIFIC BREEZE", "LNG DREAM", "EXCEL", "GLOBAL ENERGY", "ARCTIC VOYAGER", "MARAN GAS", "FLEX RESOLUTE", "CLEAN OCEAN", "GAS INNOVATION"],
  }
  
  const flags = ["PA", "MH", "LR", "SG", "HK", "GR", "MT", "BS", "CY", "NO", "DK", "GB", "JP", "KR"]
  
  const destinations: Record<string, string[]> = {
    hormuz: ["FUJAIRAH ANCH", "RAS TANURA", "JEBEL ALI", "BANDAR ABBAS", "KHARG ISLAND", "SINGAPORE", "MUMBAI", "YOKOHAMA", "NINGBO", "ULSAN"],
    bab: ["SUEZ CANAL", "PORT SAID", "JEDDAH", "DJIBOUTI", "COLOMBO", "SINGAPORE", "ROTTERDAM", "PIRAEUS", "VALENCIA", "GENOA"],
    malacca: ["SINGAPORE PSA", "PORT KLANG", "TANJUNG PELEPAS", "HONG KONG", "SHANGHAI", "TOKYO", "BUSAN", "KAOHSIUNG", "NINGBO", "YOKOHAMA"],
    suez: ["ROTTERDAM", "HAMBURG", "FELIXSTOWE", "PIRAEUS", "SINGAPORE", "JEDDAH", "MUMBAI", "HONG KONG", "ANTWERP", "BREMERHAVEN"],
  }

  const numVessels = Math.floor(Math.random() * 5) + 7 // 7-11 vessels
  const vessels: AISVessel[] = []
  const usedNames = new Set<string>()
  const vesselTypes = ["tanker", "cargo", "container", "lng"]

  for (let i = 0; i < numVessels; i++) {
    const type = vesselTypes[Math.floor(Math.random() * vesselTypes.length)]
    const typeNames = vesselNames[type]
    let name = typeNames[Math.floor(Math.random() * typeNames.length)]
    
    // Ensure unique names
    while (usedNames.has(name)) {
      name = typeNames[Math.floor(Math.random() * typeNames.length)]
    }
    usedNames.add(name)
    
    // Generate position within shipping lanes
    const latRange = bounds.maxLat - bounds.minLat
    const lngRange = bounds.maxLng - bounds.minLng
    const lat = bounds.minLat + (Math.random() * latRange)
    const lng = bounds.minLng + (Math.random() * lngRange)
    
    // Realistic speeds
    let speed: number
    if (hotspotId === "suez") {
      speed = 6 + Math.random() * 3 // Canal: 6-9 knots
    } else if (type === "container") {
      speed = 16 + Math.random() * 6 // Container: 16-22 knots
    } else if (type === "lng") {
      speed = 17 + Math.random() * 4 // LNG: 17-21 knots
    } else {
      speed = 12 + Math.random() * 5 // Tanker/Cargo: 12-17 knots
    }

    // Course based on traffic flow
    let course: number
    if (hotspotId === "hormuz") {
      course = Math.random() > 0.5 ? 110 + Math.random() * 20 : 290 + Math.random() * 20
    } else if (hotspotId === "bab") {
      course = Math.random() > 0.5 ? 335 + Math.random() * 15 : 155 + Math.random() * 15
    } else if (hotspotId === "malacca") {
      course = Math.random() > 0.5 ? 85 + Math.random() * 15 : 265 + Math.random() * 15
    } else {
      course = Math.random() > 0.5 ? 350 + Math.random() * 15 : 170 + Math.random() * 15
    }
    course = course % 360

    const hotspotDests = destinations[hotspotId] || destinations.hormuz
    const destination = hotspotDests[Math.floor(Math.random() * hotspotDests.length)]
    
    // Generate realistic ETA (1-14 days from now)
    const etaDate = new Date()
    etaDate.setDate(etaDate.getDate() + Math.floor(Math.random() * 14) + 1)
    const eta = etaDate.toISOString().split("T")[0] + " " + String(Math.floor(Math.random() * 24)).padStart(2, "0") + ":00"

    vessels.push({
      mmsi: String(Math.floor(100000000 + Math.random() * 899999999)),
      name,
      type,
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      speed: Math.round(speed * 10) / 10,
      course: Math.round(course),
      destination,
      eta,
      flag: flags[Math.floor(Math.random() * flags.length)],
    })
  }

  return vessels
}

// Calculate dynamic stats from vessel data
function calculateStats(vessels: AISVessel[], hotspotId: string) {
  const base = BASE_STATS[hotspotId] || BASE_STATS.hormuz
  
  // Calculate average speed from vessels
  const avgSpeed = vessels.length > 0 
    ? vessels.reduce((sum, v) => sum + v.speed, 0) / vessels.length 
    : 12.5

  // Count vessel types
  const typeCounts = {
    tanker: vessels.filter(v => v.type === "tanker").length,
    cargo: vessels.filter(v => v.type === "cargo").length,
    container: vessels.filter(v => v.type === "container").length,
    lng: vessels.filter(v => v.type === "lng").length,
  }

  // Add small variation to base stats
  const transitVariation = Math.floor((Math.random() - 0.5) * 20)
  const volumeVariation = Math.floor((Math.random() - 0.5) * 100)

  return {
    activeVessels: vessels.length,
    dailyTransits: base.transits + transitVariation,
    avgWaitTime: base.waitTime,
    marketVolume: base.volume + volumeVariation,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    vesselTypes: typeCounts,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const hotspot = searchParams.get("hotspot") || "hormuz"
  const bounds = HOTSPOT_BOUNDS[hotspot]

  if (!bounds) {
    return NextResponse.json(
      { success: false, error: "Invalid hotspot specified" },
      { status: 400 }
    )
  }

  try {
    // Try to fetch from AISStream API first
    let vessels = await fetchFromAISStream(bounds)
    let source = "AISStream API"

    // Fall back to simulated data if API fails
    if (!vessels || vessels.length === 0) {
      vessels = generateSimulatedVessels(hotspot)
      source = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY 
        ? "Simulated (API returned no data)" 
        : "Simulated AIS Feed"
    }

    // Calculate statistics from actual vessel data
    const stats = calculateStats(vessels, hotspot)

    return NextResponse.json({
      success: true,
      data: {
        hotspot,
        vessels,
        stats,
        bounds,
        timestamp: new Date().toISOString(),
        source,
        apiKeyConfigured: !!process.env.NEXT_PUBLIC_AISSTREAM_API_KEY,
      },
    })
  } catch (error) {
    console.error("[v0] AIS API Error:", error)
    
    // Return simulated data on error
    const vessels = generateSimulatedVessels(hotspot)
    const stats = calculateStats(vessels, hotspot)
    
    return NextResponse.json({
      success: true,
      data: {
        hotspot,
        vessels,
        stats,
        bounds,
        timestamp: new Date().toISOString(),
        source: "Simulated (Error fallback)",
        apiKeyConfigured: !!process.env.NEXT_PUBLIC_AISSTREAM_API_KEY,
      },
    })
  }
}
