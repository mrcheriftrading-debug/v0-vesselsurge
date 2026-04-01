import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hotspot = searchParams.get('hotspot') || null

    // Fetch hotspot statistics from Supabase
    let statsQuery = supabase.from('hotspot_stats').select('*')
    if (hotspot) {
      statsQuery = statsQuery.eq('hotspot_id', hotspot)
    }
    const { data: stats, error: statsError } = await statsQuery

    if (statsError) throw statsError

    // Fetch active alerts from Supabase
    let alertsQuery = supabase
      .from('hotspot_alerts')
      .select('*')
      .eq('is_active', true)
    if (hotspot) {
      alertsQuery = alertsQuery.eq('hotspot_id', hotspot)
    }
    const { data: alerts, error: alertsError } = await alertsQuery

    if (alertsError) throw alertsError

    return NextResponse.json({
      success: true,
      hotspot: hotspot || 'global',
      stats: stats || [],
      alerts: alerts || [],
      timestamp: new Date().toISOString(),
      meta: {
        version: '2.0.0',
        source: 'VesselSurge Maritime Intelligence (Supabase)',
        refreshInterval: 3600, // 1 hour
      },
    })
  } catch (error) {
    console.error('[maritime-intelligence] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maritime intelligence' },
      { status: 500 }
    )
  }
}

