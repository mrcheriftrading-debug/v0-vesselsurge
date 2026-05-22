import { NextResponse } from "next/server"
import {
  getFreshMaritimeDashboardCache,
  getLastMaritimeDashboardCache,
  reviewArticleForLiveMap,
} from "@/lib/maritime-dashboard-cache"
import {
  maritimeArticleIntelligenceScore,
  maritimeFreshnessScore,
  maritimeSourceQualityScore,
} from "@/lib/maritime-source-quality"
import { createClient } from "@/lib/supabase/server"
import { publicVercelCacheHeaders } from "@/lib/vercel-cache"

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

function reviewedArticle(article: any) {
  const timestamp = article.published_at || article.created_at
  const source = article.source || "VesselSurge source layer"
  const summary = article.summary || article.description || article.snippet || ""
  return {
    source,
    timestamp,
    title: article.title,
    summary,
    region: article.region,
    sourceQualityScore: maritimeSourceQualityScore(source),
    freshnessScore: maritimeFreshnessScore(timestamp),
    intelligenceScore: maritimeArticleIntelligenceScore({
      source,
      timestamp,
      title: article.title,
      summary,
      region: article.region,
    }),
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hotspotId = searchParams.get("hotspot") || "hormuz"
    const supabase = await createClient()
    const cache = await getFreshMaritimeDashboardCache(supabase) || await getLastMaritimeDashboardCache(supabase, "serving reviewed live-map stats")
    const cacheHotspot = cache?.data.hotspots.find((hotspot) => hotspot.hotspot === hotspotId)
    const cacheCoverage = cache?.data.qualityAudit?.coverageGaps.find((gap) => gap.hotspot === hotspotId)

    if (cacheHotspot) {
      return NextResponse.json({
        success: true,
        data: {
          id: hotspotId,
          name: HOTSPOT_NAMES[hotspotId] || hotspotId,
          activeVessels: cacheHotspot.activeVessels || 0,
          dailyTransits: cacheHotspot.dailyTransits || 0,
          avgWaitTime: cacheHotspot.avgWaitTime || "Source review",
          marketVolume: cacheHotspot.marketVolume || 0,
          riskLevel: cacheHotspot.riskLevel || "low",
          updatedAt: cacheHotspot.updatedAt,
          verifiedReports: cacheHotspot.verifiedReports || 0,
          sourceCount: cacheHotspot.sourceCount || 0,
          latestSource: cacheHotspot.latestSource || null,
          signalCount: cacheHotspot.signalCount || 0,
          officialSignalCount: cacheHotspot.officialSignalCount || 0,
          aisSignalCount: cacheHotspot.aisSignalCount || 0,
          confidenceScore: cacheHotspot.confidenceScore || 0,
          confidenceLabel: cacheHotspot.confidenceLabel || "Thin signal",
          riskSummary: cacheHotspot.riskSummary || null,
          riskDrivers: cacheHotspot.riskDrivers || [],
          sourceQualityStatus: cacheCoverage?.status || "watch",
          sourceQualityScore: cacheCoverage?.score || 0,
          missingEvidence: cacheCoverage?.missing || [],
          latestNewsAt: cacheCoverage?.latestNewsAt || null,
          latestSignalAt: cacheCoverage?.latestSignalAt || null,
          dataStatus: cache?.meta?.stale ? "reviewed_cache_stale" : "reviewed_live_map_cache",
        },
        source: "reviewed-live-map-cache",
        timestamp: new Date().toISOString(),
      }, {
        headers: publicVercelCacheHeaders("public, s-maxage=30, stale-while-revalidate=120", ["maritime-stats", `hotspot-${hotspotId}`]),
      })
    }

    const { data: row, error: statsError } = await supabase
      .from("hotspot_stats")
      .select("*")
      .eq("hotspot", hotspotId)
      .maybeSingle()

    if (statsError) throw statsError

    const { data: articles, error: articlesError } = await supabase
      .from("news_articles")
      .select("title, summary, description, snippet, source, source_url, url, region, published_at, created_at")
      .eq("is_active", true)
      .eq("region", hotspotId)
      .order("published_at", { ascending: false })
      .limit(50)

    if (articlesError) throw articlesError

    const reviewedArticles = (articles || [])
      .map(reviewedArticle)
      .map((article) => ({
        ...article,
        ...reviewArticleForLiveMap(article),
      }))
      .filter((article) => article.reviewStatus !== "blocked")
    const sources = new Set(reviewedArticles.map((article: any) => article.source).filter(Boolean))
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
          verifiedReports: reviewedArticles.length || 0,
          sourceCount: sources.size,
          latestSource: reviewedArticles?.[0]?.source || null,
          dataStatus: row.active_vessels || row.daily_transits || row.market_volume ? "traffic_verified" : "source_review_only",
        }
      : unavailableStats(hotspotId)

    return NextResponse.json({
      success: true,
      data,
      source: "openclaw-supabase-verified",
      timestamp: new Date().toISOString(),
    }, {
      headers: publicVercelCacheHeaders("public, s-maxage=30, stale-while-revalidate=120", ["maritime-stats", `hotspot-${hotspotId}`]),
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
