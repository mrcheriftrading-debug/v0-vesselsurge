import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This route bypasses caching by using force-dynamic
// All requests bypass the Vercel edge cache and hit Supabase directly
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date()
    const timestamp = now.toISOString()

    // Fetch articles from Supabase - get 25 latest
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

    // Transform articles to match expected format
    const articles = (articlesData || []).map((article: any) => ({
      id: article.id,
      title: article.title,
      summary: article.summary || article.description,
      source: article.source,
      sourceUrl: article.source_url,
      category: article.category || 'industry',
      region: article.region || 'global',
      timestamp: article.created_at || timestamp,
      isBreaking: article.is_breaking || false,
    }))

    // Transform hotspots to match expected format
    const hotspots = (hotspotsData || []).map((hotspot: any) => ({
      id: hotspot.id,
      hotspot: hotspot.hotspot,
      activeVessels: hotspot.active_vessels,
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
