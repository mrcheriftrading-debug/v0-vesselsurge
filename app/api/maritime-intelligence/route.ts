export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FALLBACK_STATS: Record<string, any> = {
  hormuz:  { activeVessels: 52,  dailyTransits: 14,  avgWaitTime: '18h',  marketVolume: 9800,  riskLevel: 'critical' },
  bab:     { activeVessels: 18,  dailyTransits: 6,   avgWaitTime: '32h',  marketVolume: 2800,  riskLevel: 'critical' },
  malacca: { activeVessels: 250, dailyTransits: 195, avgWaitTime: '2.5h', marketVolume: 12000, riskLevel: 'medium'   },
  suez:    { activeVessels: 38,  dailyTransits: 22,  avgWaitTime: '28h',  marketVolume: 2500,  riskLevel: 'high'     },
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: statsData } = await supabase.from('hotspot_stats').select('*')
    const { data: alertsData } = await supabase
      .from('hotspot_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    const stats: Record<string, any> = {}
    for (const row of statsData || []) {
      stats[row.hotspot] = {
        activeVessels: row.active_vessels,
        dailyTransits: row.daily_transits,
        avgWaitTime:   row.avg_wait_time,
        marketVolume:  row.market_volume,
        riskLevel:     row.risk_level,
        updatedAt:     row.updated_at,
        activeAlerts:  [],
      }
    }

    // Attach alerts to their hotspot
    for (const alert of alertsData || []) {
      if (stats[alert.hotspot]) {
        stats[alert.hotspot].activeAlerts.push({
          id: alert.id,
          severity: alert.severity,
          message: alert.message,
          source: alert.source,
        })
      }
    }

    // Fall back for any missing hotspots
    for (const [key, fallback] of Object.entries(FALLBACK_STATS)) {
      if (!stats[key]) stats[key] = { ...fallback, activeAlerts: [] }
    }

    return NextResponse.json(
      { success: true, data: stats, timestamp: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    )
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
