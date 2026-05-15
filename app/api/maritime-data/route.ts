import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Get verified vessel counts per hotspot. Do not synthesize live AIS counts.
async function getVesselCounts(supabase: any) {
  try {
    // Try to get from vessels table first
    const { data: vessels, error } = await supabase
      .from('vessels')
      .select('hotspot')
    
    if (!error && vessels && vessels.length > 0) {
      const counts: Record<string, number> = {}
      vessels.forEach((v: any) => {
        counts[v.hotspot] = (counts[v.hotspot] || 0) + 1
      })
      return counts
    }
  } catch (e) {
    console.log('[maritime-data] Could not fetch vessel counts:', e)
  }

  return {}
}

export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date()
    const timestamp = now.toISOString()

    // Fetch articles from Supabase
    const { data: articlesData, error: articlesError } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25)

    // Fetch hotspots from Supabase
    const { data: hotspotsData, error: hotspotsError } = await supabase
      .from('hotspot_stats')
      .select('*')
      .order('updated_at', { ascending: false })

    if (articlesError || hotspotsError) {
      console.error('[v0] Supabase fetch error:', { articlesError, hotspotsError })
      return NextResponse.json(
        { success: false, error: 'Failed to fetch maritime data' },
        { status: 500 }
      )
    }

    // Get actual vessel counts
    const vesselCounts = await getVesselCounts(supabase)

    // Transform articles
    const articles = (articlesData || []).map((article: any) => ({
      id: article.id,
      title: article.title,
      summary: article.summary || article.description || article.snippet,
      source: article.source,
      sourceUrl: article.source_url || article.url,
      category: article.category || 'industry',
      region: article.region || 'global',
      timestamp: article.created_at || timestamp,
      isBreaking: article.is_breaking || false,
    }))

    // Transform hotspots with correct vessel counts
    const hotspots = (hotspotsData || []).map((hotspot: any) => ({
      id: hotspot.id,
      hotspot: hotspot.hotspot,
      activeVessels: vesselCounts[hotspot.hotspot] || hotspot.active_vessels || 0,
      dailyTransits: hotspot.daily_transits,
      avgWaitTime: hotspot.avg_wait_time,
      marketVolume: hotspot.market_volume,
      riskLevel: hotspot.risk_level,
      updatedAt: hotspot.updated_at || timestamp,
    }))

    return NextResponse.json(
      {
        success: true,
        data: {
          articles,
          hotspots,
          timestamp,
          count: { articles: articles.length, hotspots: hotspots.length },
        },
        meta: {
          version: '3.0.0',
          source: 'VesselSurge Maritime Data API',
          cacheControl: 'no-cache, no-store, must-revalidate',
          cached: false,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  } catch (error) {
    console.error('[v0] Maritime data API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maritime data' },
      { status: 500 }
    )
  }
}
