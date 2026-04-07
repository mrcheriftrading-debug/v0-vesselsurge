// Server-side helpers for maritime data from Supabase
import { createClient } from '@/lib/supabase/server'

export interface Article {
  id: string
  title: string
  summary: string
  source: string
  sourceUrl: string
  category: string
  region: string
  timestamp: string
  isBreaking: boolean
}

export interface Hotspot {
  id: string
  hotspot: string
  activeVessels: number
  dailyTransits: number
  avgWaitTime: string
  marketVolume: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  updatedAt: string
}

export async function getMaritimeArticles(limit: number = 25, region?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (region && region !== 'global') {
      query = query.eq('region', region)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] Error fetching articles:', error)
      return []
    }

    return (data || []).map((article: any) => ({
      id: article.id,
      title: article.title,
      summary: article.summary || article.description,
      source: article.source,
      sourceUrl: article.source_url,
      category: article.category || 'industry',
      region: article.region || 'global',
      timestamp: article.created_at,
      isBreaking: article.is_breaking || false,
    }))
  } catch (error) {
    console.error('[v0] Maritime articles fetch failed:', error)
    return []
  }
}

export async function getHotspotStats() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('hotspot_stats')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching hotspot stats:', error)
      return []
    }

    return (data || []).map((hotspot: any) => ({
      id: hotspot.id,
      hotspot: hotspot.hotspot,
      activeVessels: hotspot.active_vessels,
      dailyTransits: hotspot.daily_transits,
      avgWaitTime: hotspot.avg_wait_time,
      marketVolume: hotspot.market_volume,
      riskLevel: hotspot.risk_level,
      updatedAt: hotspot.updated_at,
    }))
  } catch (error) {
    console.error('[v0] Hotspot stats fetch failed:', error)
    return []
  }
}

export async function getHotspotAlerts(limit: number = 10) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('hotspot_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[v0] Error fetching hotspot alerts:', error)
      return []
    }

    return (data || []).map((alert: any) => ({
      id: alert.id,
      hotspot: alert.hotspot,
      severity: alert.severity,
      message: alert.message,
      source: alert.source,
      timestamp: alert.updated_at || alert.created_at,
    }))
  } catch (error) {
    console.error('[v0] Hotspot alerts fetch failed:', error)
    return []
  }
}
