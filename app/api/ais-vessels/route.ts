import { NextRequest, NextResponse } from 'next/server'
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
    const speed = Math.random() > 0.3 ? Math.random() * 20 : 0 // 70% moving
    const heading = Math.floor(Math.random() * 360)
    const shipTypes = [70, 80, 60, 0] // Cargo, Tanker, Passenger, Unknown
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hotspot = searchParams.get('hotspot') || null

    // Try Supabase first
    const supabase = await createClient()
    let query = supabase
      .from('vessels')
      .select('mmsi, name, lat, lng, speed, heading, ship_type, destination, hotspot, updated_at')
      .order('updated_at', { ascending: false })
      .limit(500)

    if (hotspot && hotspot !== 'all') {
      query = query.eq('hotspot', hotspot)
    }

    const { data, error } = await query

    // If no data from DB, generate mock data
    if (error || !data || data.length === 0) {
      console.log('[ais-vessels] No DB data, generating mock vessels')

      let vessels: any[] = []
      if (hotspot && HOTSPOT_BOUNDS[hotspot]) {
        vessels = generateVesselsForHotspot(hotspot, 15)
      } else {
        // Generate for all hotspots
        vessels = [
          ...generateVesselsForHotspot('hormuz', 15),
          ...generateVesselsForHotspot('bab', 12),
          ...generateVesselsForHotspot('malacca', 25),
          ...generateVesselsForHotspot('suez', 10),
        ]
      }

      return NextResponse.json(
        {
          success: true,
          vessels,
          count: vessels.length,
          hotspot,
          source: 'mock',
          note: 'Using generated vessel data (AIS database empty)'
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        vessels: data || [],
        count: data?.length || 0,
        hotspot,
        source: 'database'
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err: any) {
    console.error('[ais-vessels] error:', err)

    // Fallback: generate mock data on error
    const vessels = [
      ...generateVesselsForHotspot('hormuz', 10),
      ...generateVesselsForHotspot('bab', 8),
      ...generateVesselsForHotspot('malacca', 15),
      ...generateVesselsForHotspot('suez', 8),
    ]

    return NextResponse.json({
      success: true,
      vessels,
      count: vessels.length,
      error: err.message,
      source: 'mock-fallback'
    }, { status: 200 })
  }
}
