import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const HOTSPOT_NAMES: Record<string, string> = {
  hormuz: "Strait of Hormuz",
  bab: "Bab el-Mandeb",
  malacca: "Strait of Malacca",
  suez: "Suez Canal",
  panama: "Panama Canal",
  taiwan: "Taiwan Strait",
  turkish: "Turkish Straits",
  gibraltar: "Strait of Gibraltar",
  cape: "Cape of Good Hope",
}

function unavailableStats(hotspotId: string) {
  return {
    id: hotspotId,
    name: HOTSPOT_NAMES[hotspotId] || hotspotId,
    activeVessels: 0,
    dailyTransits: 0,
    avgWaitTime: "No verified traffic feed",
    marketVolume: 0,
    riskLevel: "low",
    verifiedReports: 0,
    sourceCount: 0,
    latestSource: null,
    dataStatus: "unavailable",
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hotspotId = searchParams.get("hotspot") || "hormuz"
    const supabase = await createClient()

    const { data: row, error: statsError } = await supabase
      .from("hotspot_stats")
      .select("*")
      .eq("hotspot", hotspotId)
      .maybeSingle()

    if (statsError) throw statsError

    const { data: articles, error: articlesError } = await supabase
      .from("news_articles")
      .select("source, created_at")
      .eq("is_active", true)
      .eq("region", hotspotId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (articlesError) throw articlesError

    const sources = new Set((articles || []).map((article: any) => article.source).filter(Boolean))
    const data = row
      ? {
          id: hotspotId,
          name: HOTSPOT_NAMES[hotspotId] || hotspotId,
          activeVessels: row.active_vessels || 0,
          dailyTransits: row.daily_transits || 0,
          avgWaitTime: row.avg_wait_time || "No verified traffic feed",
          marketVolume: row.market_volume || 0,
          riskLevel: row.risk_level || "low",
          updatedAt: row.updated_at,
          verifiedReports: articles?.length || 0,
          sourceCount: sources.size,
          latestSource: articles?.[0]?.source || null,
          dataStatus: row.active_vessels || row.daily_transits || row.market_volume ? "traffic_verified" : "source_review_only",
        }
      : unavailableStats(hotspotId)

    return NextResponse.json({
      success: true,
      data,
      source: "openclaw-supabase-verified",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch maritime stats",
      },
      { status: 500 },
    )
  }
}
