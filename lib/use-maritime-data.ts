'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Article, Hotspot } from '@/lib/maritime-data'

type HotspotMap = Record<string, Hotspot>

interface Vessel {
  mmsi: number
  name: string
  lat: number
  lng: number
  speed: number
  heading: number
  ship_type: number
  destination: string
  hotspot: string
}

interface UseMaritimeDataReturn {
  articles: Article[]
  hotspots: HotspotMap
  vessels: Vessel[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: Date | null
  vesselCount: number
}

export function useMaritimeData(): UseMaritimeDataReturn {
  const [articles, setArticles] = useState<Article[]>([])
  const [hotspots, setHotspots] = useState<HotspotMap>({})
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const subscriptionsRef = useRef<(() => void)[]>([])
  const vesselPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch hotspots + articles from our API
  const fetchMaritimeData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/maritime-data', {
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!response.ok) throw new Error('API error: ' + response.status)
      const { data } = await response.json()
      setArticles(data.articles || [])
      const map: HotspotMap = {}
      for (const h of data.hotspots || []) map[h.hotspot] = h
      setHotspots(map)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch live vessel positions from AIS
  const fetchVessels = useCallback(async () => {
    try {
      const res = await fetch('/api/ais-vessels', {
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!res.ok) return
      const { vessels: vesselData } = await res.json()
      if (Array.isArray(vesselData)) {
        setVessels(vesselData.filter((v: Vessel) => v.lat && v.lng))
      }
    } catch (_) { /* silent - vessels are optional enhancement */ }
  }, [])

  // Supabase realtime subscriptions
  const setupRealtime = useCallback(() => {
    try {
      const supabase = createClient()

      const articlesChannel = supabase
        .channel('articles-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'news_articles' },
          async () => { await fetchMaritimeData() }
        )
        .subscribe()

      const statsChannel = supabase
        .channel('hotspot-stats-realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hotspot_stats' },
          async () => { await fetchMaritimeData() }
        )
        .subscribe()

      // Vessel realtime - update positions live
      const vesselsChannel = supabase
        .channel('vessels-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vessels' },
          async () => { await fetchVessels() }
        )
        .subscribe()

      subscriptionsRef.current.push(() => {
        supabase.removeChannel(articlesChannel)
        supabase.removeChannel(statsChannel)
        supabase.removeChannel(vesselsChannel)
      })
    } catch (err) {
      console.error('[realtime] setup error:', err)
    }
  }, [fetchMaritimeData, fetchVessels])

  useEffect(() => {
    // Initial load
    fetchMaritimeData()
    fetchVessels()
    setupRealtime()

    // Refresh hotspot stats every 5 min
    const statsInterval = setInterval(fetchMaritimeData, 5 * 60 * 1000)

    // Poll vessel positions every 60 seconds (AIS data updates frequently)
    vesselPollRef.current = setInterval(fetchVessels, 60 * 1000)

    // Refresh on tab focus
    const onVisible = () => {
      if (!document.hidden) {
        fetchMaritimeData()
        fetchVessels()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(statsInterval)
      if (vesselPollRef.current) clearInterval(vesselPollRef.current)
      document.removeEventListener('visibilitychange', onVisible)
      subscriptionsRef.current.forEach(u => u())
      subscriptionsRef.current = []
    }
  }, [fetchMaritimeData, fetchVessels, setupRealtime])

  return {
    articles,
    hotspots,
    vessels,
    loading,
    error,
    refresh: async () => { await fetchMaritimeData(); await fetchVessels() },
    lastUpdated,
    vesselCount: vessels.length,
  }
}
