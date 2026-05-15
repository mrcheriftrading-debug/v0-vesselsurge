export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const HOTSPOT_IDS = ['hormuz', 'bab', 'malacca', 'suez']

function unavailableStats() {
  return {
    activeVessels: 0,
    dailyTransits: 0,
    avgWaitTime: 'No verified traffic feed',
    marketVolume: 0,
    riskLevel: 'low',
    activeAlerts: [],
    dataStatus: 'unavailable',
  }
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

    for (const key of HOTSPOT_IDS) {
      if (!stats[key]) stats[key] = unavailableStats()
    }

    return NextResponse.json(
      { success: true, data: stats, timestamp: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    )
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
