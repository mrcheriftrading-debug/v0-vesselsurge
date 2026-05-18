import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hotspot = searchParams.get('hotspot') || null
    const supabase = await createClient()

    let query = supabase
      .from('vessels')
      .select('mmsi, name, lat, lng, speed, heading, ship_type, destination, hotspot, updated_at')
      .order('updated_at', { ascending: false })
      .limit(250)

    if (hotspot && hotspot !== 'all') {
      query = query.eq('hotspot', hotspot)
    }

    const { data, error } = await query

    if (error) {
      console.error('[ais-vessels] database error:', error)
      return NextResponse.json(
        {
          success: false,
          vessels: [],
          count: 0,
          hotspot,
          source: 'database',
          note: 'Verified AIS database query failed. Mock vessel data is disabled.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        vessels: data || [],
        count: data?.length || 0,
        hotspot,
        source: 'database',
        note: data?.length ? 'Verified AIS database rows.' : 'No verified AIS rows available. Mock vessel data is disabled.',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (err: any) {
    console.error('[ais-vessels] error:', err)
    return NextResponse.json(
      {
        success: false,
        vessels: [],
        count: 0,
        error: err.message,
        source: 'database',
        note: 'Verified AIS fetch failed. Mock vessel data is disabled.',
      },
      { status: 500 },
    )
  }
}
