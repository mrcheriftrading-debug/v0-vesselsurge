import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FALLBACK_STATS = {
  hormuz: { activeVessels: 52, dailyTransits: 54, avgWaitTime: '2.3h', marketVolume: 1350, riskLevel: 'high' },
  bab: { activeVessels: 18, dailyTransits: 22, avgWaitTime: '1.2h', marketVolume: 280, riskLevel: 'critical' },
  malacca: { activeVessels: 95, dailyTransits: 265, avgWaitTime: '3.5h', marketVolume: 2050, riskLevel: 'medium' },
  suez: { activeVessels: 38, dailyTransits: 41, avgWaitTime: '9.5h', marketVolume: 650, riskLevel: 'high' },
}

export async function GET() {
  const now = new Date()
  const timestamp = now.toISOString()

  try {
    const supabase = await createClient()

    const { data: statsData } = await supabase.from('hotspot_stats').select('*')
    const { data: alertsData } = await supabase
      .from('hotspot_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    const hotspotStats: Record<string, any> = { ...FALLBACK_STATS }
    if (statsData && statsData.length > 0) {
      statsData.forEach((row: any) => {
        hotspotStats[row.hotspot] = {
          activeVessels: row.active_vessels,
          dailyTransits: row.daily_transits,
          avgWaitTime: row.avg_wait_time,
          marketVolume: row.market_volume,
          riskLevel: row.risk_level,
        }
      })
    }

    const latestAlerts = alertsData && alertsData.length > 0
      ? alertsData.map((a: any) => ({
          id: a.id,
          hotspot: a.hotspot,
          severity: a.severity,
          message: a.message,
          source: a.source,
          timestamp: a.updated_at || timestamp,
        }))
      : [{ id: 'default-1', hotspot: 'bab', severity: 'info', message: 'No active alerts.', source: 'VesselSurge', timestamp }]

    return NextResponse.json(
      {
        success: true,
        data: { timestamp, hotspotStats, latestAlerts, nextUpdate: new Date(now.getTime() + 3600000).toISOString() },
        meta: { version: '2.0.0', source: 'VesselSurge Maritime Intelligence', refreshInterval: 3600 },
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } }
    )
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch maritime intelligence' }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
