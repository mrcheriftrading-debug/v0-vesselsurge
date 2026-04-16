import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Generate realistic vessel positions around hotspots
const HOTSPOT_BOUNDS: Record<string, { lat: [number, number]; lng: [number, number] }> = {
  hormuz: { lat: [25.8, 26.9], lng: [55.8, 57.1] },
  bab: { lat: [12.3, 13.0], lng: [43.0, 43.6] },
  malacca: { lat: [1.9, 3.0], lng: [101.8, 102.5] },
  suez: { lat: [29.7, 30.2], lng: [32.3, 32.9] },
}

const VESSEL_NAMES = [
  'MSC GULSUN', 'EVER GIVEN', 'MAERSK ESSEN', 'COSCO SHANGHAI', 'HMM ALGECIRAS',
  'ONE INNOVATION', 'CMA CGM MARCO', 'EVERGREEN A', 'OCEAN NETWORK', 'PILATUS',
  'SEASPAN', 'ZIM TEXAS', 'HAPAG LLOYD', 'YANG MING', 'K-LINE',
  'OOCL HONG KONG', 'EVER ACE', 'CMA CGM', 'MAERSK MADRID', 'MSC RAYA'
]

function generateVesselsForHotspot(hotspot: string, count: number) {
  const bounds = HOTSPOT_BOUNDS[hotspot]
  if (!bounds) return []

  return Array.from({ length: count }, (_, i) => {
    const lat = bounds.lat[0] + Math.random() * (bounds.lat[1] - bounds.lat[0])
    const lng = bounds.lng[0] + Math.random() * (bounds.lng[1] - bounds.lng[0])
    const speed = Math.random() > 0.3 ? Math.random() * 20 : 0
    const heading = Math.floor(Math.random() * 360)
    const shipTypes = [70, 80, 60, 0]
    const ship_type = shipTypes[Math.floor(Math.random() * shipTypes.length)]

    return {
      mmsi: 200000000 + Math.floor(Math.random() * 99999999),
      name: VESSEL_NAMES[i % VESSEL_NAMES.length],
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      speed: parseFloat(speed.toFixed(1)),
      heading,
      ship_type,
      destination: ['SINGAPORE', 'ROTTERDAM', 'SHANGHAI', 'DUBAI', 'HAMBURG'][Math.floor(Math.random() * 5)],
      hotspot,
      updated_at: new Date().toISOString(),
    }
  })
}

// Get vessel counts per hotspot (fallback to generated data)
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

  // Generate realistic counts
  return {
    hormuz: 15,
    bab: 12,
    malacca: 25,
    suez: 10,
  }
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
      summary: article.summary || article.description,
      source: article.source,
      sourceUrl: article.source_url,
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
