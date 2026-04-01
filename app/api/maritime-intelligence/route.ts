import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
 
// Fallback static data if Supabase is empty
const FALLBACK_STATS = {
  hormuz: { activeVessels: 55, dailyTransits: 56, avgWaitTime: '2.1h', marketVolume: 1380, riskLevel: 'high' },
  bab: { activeVessels: 28, dailyTransits: 42, avgWaitTime: '0.8h', marketVolume: 420, riskLevel: 'critical' },
  malacca: { activeVessels: 90, dailyTransits: 248, avgWaitTime: '3.2h', marketVolume: 1920, riskLevel: 'medium' },
  suez: { activeVessels: 44, dailyTransits: 52, avgWaitTime: '8.3h', marketVolume: 780, riskLevel: 'high' },
}
 
export async function GET() {
  const now = new Date()
  const timestamp = now.toISOString()
 
  try {
    const supabase = await createClient()
 
    // Fetch stats from Supabase
    const { data: statsData } = await supabase
      .from('hotspot_stats')
      .select('*')
 
    // Fetch active alerts from Supabase
    const { data: alertsData } = await supabase
      .from('hotspot_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)
 
    // Build hotspot stats object
    const hotspotStats: Record<string, any> = { ...FALLBACK_STATS }
    if (statsData && statsData.length > 0) {
      statsData.forEach((row) => {
        hotspotStats[row.hotspot] = {
          activeVessels: row.active_vessels,
          dailyTransits: row.daily_transits,
          avgWaitTime: row.avg_wait_time,
          marketVolume: row.market_volume,
          riskLevel: row.risk_level,
        }
      })
    }
 
    // Build alerts array
    const latestAlerts = alertsData && alertsData.length > 0
      ? alertsData.map((a) => ({
          id: a.id,
          hotspot: a.hotspot,
          severity: a.severity,
          message: a.message,
          source: a.source,
          timestamp: a.updated_at || timestamp,
        }))
      : [
          {
            id: 'default-1',
            hotspot: 'bab',
            severity: 'warning',
            message: 'No active alerts. Add alerts via the Admin panel.',
            source: 'VesselSurge Admin',
            timestamp,
          },
        ]
 
    return NextResponse.json(
      {
        success: true,
        data: {
          timestamp,
          hotspotStats,
          latestAlerts,
          nextUpdate: new Date(now.getTime() + 3600000).toISOString(),
        },
        meta: {
          version: '2.0.0',
          source: 'VesselSurge Maritime Intelligence',
          refreshInterval: 3600,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maritime intelligence' },
      { status: 500 }
    )
  }
}
 
export async function POST() {
  return GET()
}
