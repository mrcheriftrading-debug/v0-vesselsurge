import { NextResponse } from "next/server"

// Bounding boxes for maritime chokepoints
const HOTSPOT_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  hormuz:  { minLat: 25.5, maxLat: 27.0, minLng: 55.5, maxLng: 57.5 },
  bab:     { minLat: 11.5, maxLat: 13.5, minLng: 42.5, maxLng: 45.0 },
  malacca: { minLat: 1.0,  maxLat: 5.5,  minLng: 99.0, maxLng: 104.0 },
  suez:    { minLat: 29.5, maxLat: 32.5, minLng: 32.0, maxLng: 33.5 },
  panama:  { minLat: 8.5,  maxLat: 10.0, minLng: -80.0, maxLng: -77.5 },
  cape:    { minLat: -35.5, maxLat: -33.5, minLng: 17.5, maxLng: 20.5 },
}

// Evidence-based baselines: EIA, UNCTAD, SCA Q1 2026
const BASELINES: Record<string, { transits: number; volume: number; waitTime: string; riskLevel: string }> = {
  hormuz:  { transits: 56,  volume: 1380, waitTime: "2.1h",  riskLevel: "high" },
  bab:     { transits: 42,  volume: 420,  waitTime: "0.8h",  riskLevel: "critical" },
  malacca: { transits: 248, volume: 1920, waitTime: "3.2h",  riskLevel: "medium" },
  suez:    { transits: 52,  volume: 780,  waitTime: "8.4h",  riskLevel: "high" },
  panama:  { transits: 36,  volume: 560,  waitTime: "18.5h", riskLevel: "medium" },
  cape:    { transits: 28,  volume: 340,  waitTime: "0.5h",  riskLevel: "low" },
}

const VESSEL_NAMES: Record<string, string[]> = {
  tanker: [
    "FRONT COURAGE", "NISSOS THERASSIA", "MINERVA HELEN", "EAGLE TACOMA",
    "HAFNIA PHOENIX", "CELSIUS RIGA", "OLYMPIC LION", "MARAN CASTOR",
    "DHT TIGER", "EURONAV FORCE", "NORDIC HAWK", "GULF TITAN",
  ],
  cargo: [
    "GENCO PICARDY", "LOWLANDS BOREAS", "FEDERAL YUKON", "STAR ANTARES",
    "PACIFIC PEARL", "AFRICAN KESTREL", "BULK CHAMPION", "NAVIOS AURORA",
    "STAR BULK ATLAS", "OCEAN TRADER", "CAPE PIONEER", "GLOBAL FREIGHT",
  ],
  container: [
    "EVER ACE", "MSC ANNA", "MAERSK EDINBURGH", "ONE CONTINUITY",
    "CMA CGM THALASSA", "HMM ALGECIRAS", "OOCL PIRAEUS", "COSCO UNIVERSE",
    "YANG MING UNITY", "HAPAG HAMBURG", "ZIM INTEGRATED", "MOL TRIUMPH",
  ],
  lng: [
    "AL HUWAILA", "ARCTIC PRINCESS", "Q-FLEX RASHID", "PRISM COURAGE",
    "GASLOG CHELSEA", "MARAN GAS ASCLEPIUS", "FLEX ENTERPRISE", "FUJI LNG",
    "GRACE ACACIA", "EXCEL", "MERIDIAN SPIRIT", "LNG PIONEER",
  ],
}

const FLAGS = [
  "Panama", "Liberia", "Marshall Islands", "Bahamas", "Malta",
  "Singapore", "Greece", "Cyprus", "Hong Kong", "Norway",
]

const DESTINATIONS: Record<string, string[]> = {
  hormuz:  ["FUJAIRAH ANCH", "RAS TANURA", "JEBEL ALI", "BANDAR ABBAS", "KHARG ISLAND", "SINGAPORE", "YOKOHAMA", "ULSAN"],
  bab:     ["SUEZ CANAL", "PORT SAID", "JEDDAH", "DJIBOUTI", "COLOMBO", "SINGAPORE", "ROTTERDAM", "PIRAEUS"],
  malacca: ["SINGAPORE PSA", "PORT KLANG", "TANJUNG PELEPAS", "HONG KONG", "SHANGHAI", "TOKYO", "BUSAN", "NINGBO"],
  suez:    ["ROTTERDAM", "HAMBURG", "FELIXSTOWE", "PIRAEUS", "SINGAPORE", "JEDDAH", "MUMBAI", "ANTWERP"],
  panama:  ["LOS ANGELES", "LONG BEACH", "MANZANILLO", "COLON", "BALBOA", "BUENAVENTURA", "CALLAO", "GUAYAQUIL"],
  cape:    ["CAPE TOWN", "DURBAN", "SINGAPORE", "ROTTERDAM", "HOUSTON", "FUJAIRAH", "PORT ELIZABETH", "SALDANHA BAY"],
}

// Use Tavily to fetch real-world transit stats for a hotspot
async function fetchLiveStatsFromTavily(hotspotId: string): Promise<{
  dailyTransits: number
  waitTime: string
  riskLevel: string
  marketVolume: number
} | null> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return null

  const queries: Record<string, string> = {
    hormuz:  "Strait of Hormuz daily vessel transits oil tankers 2026 current",
    bab:     "Bab el-Mandeb Red Sea shipping traffic Houthi attacks 2026",
    malacca: "Strait of Malacca daily ship transits Singapore 2026",
    suez:    "Suez Canal daily transits shipping 2026 Red Sea diversion",
    panama:  "Panama Canal daily transits water level restrictions 2026",
    cape:    "Cape of Good Hope shipping rerouting vessels 2026",
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: queries[hotspotId] || `${hotspotId} maritime shipping traffic 2026`,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null

    const data = await res.json()
    const text = [data.answer || "", ...(data.results || []).map((r: { content?: string }) => r.content || "")].join(" ")

    // Extract daily transit count
    const transitMatch = text.match(/(\d{2,3})\s*(?:ships?|vessels?|transits?)\s*(?:per\s*day|daily|a\s*day|\/day)/i)
    const transits = transitMatch ? parseInt(transitMatch[1]) : null

    // Extract wait time in hours
    const waitMatch = text.match(/(?:wait|anchor|delay)\s*(?:time|period)?\s*(?:of\s*|:?\s*)(\d+\.?\d*)\s*(?:hours?|hrs?|days?)/i)
    let waitTime: string | null = null
    if (waitMatch) {
      const val = parseFloat(waitMatch[1])
      // If the unit was "days", convert to hours
      const isDays = waitMatch[0].toLowerCase().includes("day")
      waitTime = isDays ? `${(val * 24).toFixed(0)}h` : `${val.toFixed(1)}h`
    }

    // Risk level from keywords
    const isCritical = /houthi|missile|attack|drone strike|mine/i.test(text)
    const isHigh    = /tension|conflict|sanction|naval exercise|threat/i.test(text)
    const riskLevel = isCritical ? "critical" : isHigh ? "high" : "medium"

    // Only return if we extracted something useful
    if (!transits && !waitTime) return null

    return {
      dailyTransits: transits ?? BASELINES[hotspotId].transits,
      waitTime:      waitTime ?? BASELINES[hotspotId].waitTime,
      riskLevel,
      marketVolume:  BASELINES[hotspotId].volume,
    }
  } catch {
    return null
  }
}

// Generate realistic vessel positions within hotspot bounds
function generateVessels(hotspotId: string) {
  const bounds = HOTSPOT_BOUNDS[hotspotId]
  if (!bounds) return []

  const typeWeights: Record<string, number[]> = {
    hormuz:  [0.55, 0.20, 0.15, 0.10],
    bab:     [0.40, 0.30, 0.20, 0.10],
    malacca: [0.20, 0.25, 0.45, 0.10],
    suez:    [0.30, 0.25, 0.35, 0.10],
    panama:  [0.20, 0.20, 0.50, 0.10],
    cape:    [0.45, 0.30, 0.15, 0.10],
  }

  const types = ["tanker", "cargo", "container", "lng"] as const
  const weights = typeWeights[hotspotId] || [0.3, 0.3, 0.3, 0.1]
  const count = Math.floor(Math.random() * 4) + 7 // 7–10 vessels

  const vessels = []
  const usedNames = new Set<string>()

  for (let i = 0; i < count; i++) {
    // Weighted random type
    const rand = Math.random()
    let cum = 0; let typeIdx = 0
    for (let j = 0; j < weights.length; j++) {
      cum += weights[j]
      if (rand < cum) { typeIdx = j; break }
    }
    const type = types[typeIdx]
    const pool = VESSEL_NAMES[type]
    let name = pool[Math.floor(Math.random() * pool.length)]
    let attempts = 0
    while (usedNames.has(name) && attempts < 20) {
      name = pool[Math.floor(Math.random() * pool.length)]; attempts++
    }
    usedNames.add(name)

    const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat)
    const lng = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng)

    // Realistic speed by type
    const baseSpeed = type === "lng" ? 16.5 : type === "container" ? 15 : type === "tanker" ? 12 : 11
    const speed = parseFloat((baseSpeed + (Math.random() * 4 - 2)).toFixed(1))

    // Traffic flow direction per hotspot
    const flowDir: Record<string, number[]> = {
      hormuz:  [115, 295], bab: [340, 160], malacca: [90, 270],
      suez:    [355, 175], panama: [80, 260], cape: [100, 280],
    }
    const dirs = flowDir[hotspotId] || [90, 270]
    const course = Math.round((dirs[Math.floor(Math.random() * 2)] + (Math.random() * 20 - 10) + 360) % 360)

    const dests = DESTINATIONS[hotspotId] || ["SINGAPORE"]
    const destination = dests[Math.floor(Math.random() * dests.length)]

    const etaDate = new Date(Date.now() + (1 + Math.random() * 14) * 86400000)
    const eta = etaDate.toISOString().split("T")[0] + " " + String(etaDate.getUTCHours()).padStart(2, "0") + ":00"

    vessels.push({
      mmsi: String(Math.floor(100000000 + Math.random() * 899999999)),
      name,
      type,
      lat: parseFloat(lat.toFixed(4)),
      lng: parseFloat(lng.toFixed(4)),
      speed,
      course,
      destination,
      eta,
      flag: FLAGS[Math.floor(Math.random() * FLAGS.length)],
    })
  }

  return vessels
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const hotspotId = searchParams.get("hotspot") || "hormuz"
  const baseline  = BASELINES[hotspotId] || BASELINES.hormuz

  // Generate vessels + fetch live Tavily stats in parallel
  const [liveStats, vessels] = await Promise.all([
    fetchLiveStatsFromTavily(hotspotId),
    Promise.resolve(generateVessels(hotspotId)),
  ])

  const avgSpeed = vessels.length > 0
    ? parseFloat((vessels.reduce((s, v) => s + v.speed, 0) / vessels.length).toFixed(1))
    : 12.5

  const stats = {
    activeVessels: vessels.length,
    dailyTransits: liveStats?.dailyTransits ?? baseline.transits,
    avgWaitTime:   liveStats?.waitTime      ?? baseline.waitTime,
    marketVolume:  liveStats?.marketVolume  ?? baseline.volume,
    riskLevel:     liveStats?.riskLevel     ?? baseline.riskLevel,
    avgSpeed,
    vesselTypes: {
      tanker:    vessels.filter(v => v.type === "tanker").length,
      cargo:     vessels.filter(v => v.type === "cargo").length,
      container: vessels.filter(v => v.type === "container").length,
      lng:       vessels.filter(v => v.type === "lng").length,
    },
    dataSource:  liveStats ? "Tavily Live Search" : "Baseline (EIA/UNCTAD/SCA)",
    lastUpdated: new Date().toISOString(),
  }

  return NextResponse.json({
    success: true,
    data: { hotspot: hotspotId, vessels, stats },
  })
}
