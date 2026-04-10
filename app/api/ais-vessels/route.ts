import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hotspot = searchParams.get('hotspot') || null

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
    if (error) throw error

    return NextResponse.json(
      { success: true, vessels: data || [], count: data?.length || 0, hotspot },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err: any) {
    console.error('[ais-vessels] error:', err)
    return NextResponse.json({ success: false, vessels: [], error: err.message }, { status: 500 })
  }
}
