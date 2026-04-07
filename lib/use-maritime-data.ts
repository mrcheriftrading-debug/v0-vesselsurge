'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Article, Hotspot } from '@/lib/maritime-data'

interface UseMaritimeDataReturn {
  articles: Article[]
  hotspots: Hotspot[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: Date | null
}

export function useMaritimeData(): UseMaritimeDataReturn {
  const [articles, setArticles] = useState<Article[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const subscriptionsRef = useRef<(() => void)[]>([])

  // Initial fetch from cache-busting API
  const fetchMaritimeData = useCallback(async () => {
    try {
      console.log('[v0] Fetching maritime data from API')
      setLoading(true)
      setError(null)

      const response = await fetch('/api/maritime-data', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const { data } = await response.json()
      setArticles(data.articles || [])
      setHotspots(data.hotspots || [])
      setLastUpdated(new Date())
      console.log('[v0] Maritime data fetched successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch maritime data'
      setError(message)
      console.error('[v0] Error fetching maritime data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Setup Supabase Realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    try {
      const supabase = createClient()

      // Subscribe to articles changes
      const articlesChannel = supabase
        .channel('articles-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'news_articles',
          },
          async (payload) => {
            console.log('[v0] Articles update received:', payload.eventType)
            // Refetch articles on any change
            await fetchMaritimeData()
          }
        )
        .subscribe((status) => {
          console.log('[v0] Articles channel status:', status)
        })

      // Subscribe to hotspots changes
      const hotspotsChannel = supabase
        .channel('hotspots-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'hotspot_stats',
          },
          async (payload) => {
            console.log('[v0] Hotspots update received:', payload.eventType)
            // Refetch hotspots on any change
            await fetchMaritimeData()
          }
        )
        .subscribe((status) => {
          console.log('[v0] Hotspots channel status:', status)
        })

      // Store unsubscribe functions
      subscriptionsRef.current.push(() => {
        supabase.removeChannel(articlesChannel)
        supabase.removeChannel(hotspotsChannel)
      })
    } catch (err) {
      console.error('[v0] Error setting up realtime subscriptions:', err)
    }
  }, [fetchMaritimeData])

  // Fallback polling mechanism (every 5 minutes)
  useEffect(() => {
    // Initial fetch
    fetchMaritimeData()

    // Setup realtime
    setupRealtimeSubscriptions()

    // Fallback polling: 5 minutes
    const pollingInterval = setInterval(() => {
      console.log('[v0] Polling maritime data (fallback)')
      fetchMaritimeData()
    }, 5 * 60 * 1000)

    // Refresh on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[v0] Page became visible, refreshing maritime data')
        fetchMaritimeData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(pollingInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Cleanup subscriptions
      subscriptionsRef.current.forEach((unsubscribe) => unsubscribe())
      subscriptionsRef.current = []
    }
  }, [fetchMaritimeData, setupRealtimeSubscriptions])

  return {
    articles,
    hotspots,
    loading,
    error,
    refresh: fetchMaritimeData,
    lastUpdated,
  }
}
