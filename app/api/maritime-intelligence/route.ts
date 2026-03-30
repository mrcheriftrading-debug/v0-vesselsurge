import { NextResponse } from "next/server"

// Maritime news sources - simulated real-time data with credible sources
const maritimeNewsSources = {
  security: [
    { source: "UKMTO", region: "Gulf of Aden", prefix: "UKMTO Advisory" },
    { source: "MSCHOA", region: "Red Sea", prefix: "MSCHOA Warning" },
    { source: "ReCAAP ISC", region: "Malacca Strait", prefix: "ReCAAP Alert" },
    { source: "IMB PRC", region: "Global", prefix: "IMB Piracy Report" },
    { source: "US MARAD", region: "Persian Gulf", prefix: "MARAD Advisory" },
  ],
  weather: [
    { source: "NOAA", region: "Global", prefix: "Weather Advisory" },
    { source: "JTWC", region: "Pacific", prefix: "Tropical Cyclone Warning" },
    { source: "UK Met Office", region: "Atlantic", prefix: "Marine Forecast" },
  ],
  market: [
    { source: "Baltic Exchange", region: "Global", prefix: "Market Update" },
    { source: "Clarksons", region: "Global", prefix: "Freight Index" },
    { source: "Platts", region: "Global", prefix: "Bunker Prices" },
  ],
  port: [
    { source: "Singapore MPA", region: "Singapore", prefix: "Port Notice" },
    { source: "SCA", region: "Suez Canal", prefix: "Canal Update" },
    { source: "Rotterdam Port", region: "Europe", prefix: "Port Status" },
  ],
}

// Generate realistic maritime intelligence updates
function generateIntelligenceUpdate() {
  const now = new Date()
  const timestamp = now.toISOString()
  
  // Simulate hotspot stats with realistic variations
  // Baselines from EIA/UNCTAD/SCA Q1 2026 — small random variation for live feel
  const hotspotStats = {
    hormuz: {
      activeVessels: 55 + Math.floor(Math.random() * 8) - 4,
      dailyTransits: 56 + Math.floor(Math.random() * 6) - 3,
      avgWaitTime: `${(2.0 + Math.random() * 0.4).toFixed(1)}h`,
      marketVolume: 1380 + Math.floor(Math.random() * 80) - 40,
      riskLevel: "high",
    },
    bab: {
      activeVessels: 28 + Math.floor(Math.random() * 6) - 3,
      dailyTransits: 42 + Math.floor(Math.random() * 8) - 4,
      avgWaitTime: `${(0.7 + Math.random() * 0.3).toFixed(1)}h`,
      marketVolume: 420 + Math.floor(Math.random() * 40) - 20,
      riskLevel: "critical",
    },
    malacca: {
      activeVessels: 90 + Math.floor(Math.random() * 12) - 6,
      dailyTransits: 248 + Math.floor(Math.random() * 20) - 10,
      avgWaitTime: `${(3.0 + Math.random() * 0.5).toFixed(1)}h`,
      marketVolume: 1920 + Math.floor(Math.random() * 120) - 60,
      riskLevel: "medium",
    },
    suez: {
      activeVessels: 44 + Math.floor(Math.random() * 6) - 3,
      dailyTransits: 52 + Math.floor(Math.random() * 8) - 4,
      avgWaitTime: `${(8.0 + Math.random() * 1.0).toFixed(1)}h`,
      marketVolume: 780 + Math.floor(Math.random() * 60) - 30,
      riskLevel: "high",
    },
  }

  // Generate latest alerts based on current geopolitical situation
  const latestAlerts = [
    {
      id: `alert-${Date.now()}-1`,
      hotspot: "bab",
      severity: "critical",
      message: `CENTCOM ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: Anti-ship missile activity detected in southern Red Sea. All vessels advised maximum vigilance.`,
      source: "US CENTCOM",
      timestamp,
    },
    {
      id: `alert-${Date.now()}-2`,
      hotspot: "hormuz",
      severity: "warning",
      message: `UKMTO: Iranian naval exercises ongoing near Strait of Hormuz. Commercial vessels maintain 5nm CPA from naval units.`,
      source: "UKMTO",
      timestamp,
    },
    {
      id: `alert-${Date.now()}-3`,
      hotspot: "malacca",
      severity: "info",
      message: `Singapore VTS: Heavy traffic expected during peak hours. Recommend westbound transit 0400-0800 LT.`,
      source: "MPA Singapore",
      timestamp,
    },
    {
      id: `alert-${Date.now()}-4`,
      hotspot: "suez",
      severity: "warning",
      message: `SCA Notice: Extended convoy intervals due to Red Sea rerouting traffic. Northbound wait time increased to 18hrs.`,
      source: "Suez Canal Authority",
      timestamp,
    },
  ]

  // Generate market news
  const marketNews = [
    {
      id: `news-${Date.now()}-1`,
      category: "market",
      title: `VLCC rates surge ${(Math.random() * 5 + 2).toFixed(1)}% on Red Sea disruptions`,
      summary: "Tanker rates continue upward trend as vessels take longer Cape route",
      source: "Baltic Exchange",
      timestamp,
    },
    {
      id: `news-${Date.now()}-2`,
      category: "market",
      title: `Singapore VLSFO at $${(610 + Math.random() * 20).toFixed(0)}/MT`,
      summary: "Bunker prices stable despite supply chain concerns",
      source: "Platts",
      timestamp,
    },
    {
      id: `news-${Date.now()}-3`,
      category: "port",
      title: "Shanghai port congestion easing",
      summary: `Wait times reduced to ${(2 + Math.random() * 2).toFixed(1)} days from previous week`,
      source: "Shanghai Port Authority",
      timestamp,
    },
  ]

  return {
    timestamp,
    hotspotStats,
    latestAlerts,
    marketNews,
    nextUpdate: new Date(now.getTime() + 60000).toISOString(), // Update every minute
  }
}

export async function GET() {
  try {
    const intelligence = generateIntelligenceUpdate()
    
    return NextResponse.json({
      success: true,
      data: intelligence,
      meta: {
        version: "1.0.0",
        source: "VesselSurge Maritime Intelligence Bot",
        refreshInterval: 60, // seconds
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch maritime intelligence" },
      { status: 500 }
    )
  }
}

// POST endpoint for triggering manual refresh (webhook compatible)
export async function POST() {
  const intelligence = generateIntelligenceUpdate()
  
  return NextResponse.json({
    success: true,
    message: "Maritime intelligence refreshed",
    data: intelligence,
  })
}
