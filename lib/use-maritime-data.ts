'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Article, Hotspot } from '@/lib/maritime-data'

// Hotspots keyed by id: hotspots['hormuz'], hotspots['bab'], etc.
type HotspotMap = Record<string, Hotspot>

interface UseMaritimeDataReturn {
  articles: Article[]
  hotspots: HotspotMap
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: Date | null
}

export function useMaritimeData(): UseMaritimeDataReturn {
  const [articles, setArticles] = useState<Article[]>([])
  const [hotspots, setHotspots] = useState<HotspotMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const subscriptionsRef = useRef<(() => void)[]>([])

  const fetchMaritimeData = useCallback(async () => {
    try {
      console.log('[vs] Fetching maritime data')
      setLoading(true)
      setError(null)

      const response = await fetch('/api/maritime-data', {
        headers: { 'Cache-Control': 'no-cache' },
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const { data } = await response.json()

      setArticles(data.articles || [])

      // FIX: convert array → keyed map so page can do hotspots['hormuz']
      const hotspotMap: HotspotMap = {}
      for (const h of (data.hotspots || [])) {
        hotspotMap[h.hotspot] = h
      }
      setHotspots(hotspotMap)
      setLastUpdated(new Date())
      console.log('[vs] Data loaded — articles:', data.articles?.length, 'hotspots:', Object.keys(hotspotMap).length)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch maritime data'
      setError(message)
      console.error('[vs] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const setupRealtimeSubscriptions = useCallback(() => {
    try {
      const supabase = createClient()

      // FIX: missing closing ) on .on() before .subscribe()
      const articlesChannel = supabase
        .channel('articles-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'news_articles' },
          async (payload) => {
            console.log('[vs] Articles change:', payload.eventType)
            await fetchMaritimeData()
          }
        )
        .subscribe((status) => {
          console.log('[vs] Articles channel:', status)
        })

      const hotspotsChannel = supabase
        .channel('hotspots-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'hotspot_stats' },
          async (payload) => {
            console.log('[vs] Hotspots change:', payload.eventType)
            await fetchMaritimeData()
          }
        )
        .subscribe((status) => {
          console.log('[vs] Hotspots channel:', status)
        })

      subscriptionsRef.current.push(() => {
        supabase.removeChannel(articlesChannel)
        supabase.removeChannel(hotspotsChannel)
      })
    } catch (err) {
      console.error('[vs] Realtime setup error:', err)
    }
  }, [fetchMaritimeData])

  useEffect(() => {
    fetchMaritimeData()
    setupRealtimeSubscriptions()

    // Fallback poll every 5 minutes
    const pollingInterval = setInterval(() => fetchMaritimeData(), 5 * 60 * 1000)

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchMaritimeData()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(pollingInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      subscriptionsRef.current.forEach((unsub) => unsub())
      subscriptionsRef.current = []
    }
  }, [fetchMaritimeData, setupRealtimeSubscriptions])

  return { articles, hotspots, loading, error, refresh: fetchMaritimeData, lastUpdated }
}
