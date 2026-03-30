import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import type { HormuzLiveData } from "../update/route"

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export const revalidate = 0 // Disable caching

export async function GET() {
  try {
    // Fetch live data from Redis
    const rawData = await redis.get("hormuz_live_data")
    
    if (!rawData) {
      // Return default data if no live data exists yet
      return NextResponse.json({
        success: true,
        source: "default",
        data: {
          vesselCount: 58,
          riskLevel: "moderate",
          dailyTransits: 174,
          avgWaitTime: "2.1h",
          marketVolume: 1380,
          latestIncidents: [],
          vessels: [],
          summary: "No live data available yet. Data will be updated on the next scheduled refresh.",
          lastUpdated: null,
        },
      })
    }
    
    // Parse the stored data
    const liveData: HormuzLiveData = typeof rawData === "string" ? JSON.parse(rawData) : rawData
    
    return NextResponse.json({
      success: true,
      source: "live",
      data: liveData,
    })
  } catch (error) {
    console.error("[v0] Error fetching live data:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch live data",
        source: "error",
        data: null,
      },
      { status: 500 }
    )
  }
}
