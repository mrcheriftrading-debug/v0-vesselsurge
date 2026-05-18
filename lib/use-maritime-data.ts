'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Article, Hotspot, MaritimeSignal } from '@/lib/maritime-data'

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
  signals: MaritimeSignal[]
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
  const [signals, setSignals] = useState<MaritimeSignal[]>([])
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const vesselPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch hotspots + articles from our API
  const fetchMaritimeData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/maritime-data', {
        cache: 'default',
      })
      if (!response.ok) throw new Error('API error: ' + response.status)
      const { data } = await response.json()
      setArticles(data.articles || [])
      setSignals(data.signals || [])
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

  // Fetch vessel rows from the AIS-backed API.
  const fetchVessels = useCallback(async () => {
    try {
      const res = await fetch('/api/ais-vessels', {
        cache: 'default',
      })
      if (!res.ok) return
      const { vessels: vesselData } = await res.json()
      if (Array.isArray(vesselData)) {
        setVessels(vesselData.filter((v: Vessel) => v.lat && v.lng))
      }
    } catch { /* silent - vessels are optional enhancement */ }
  }, [])

  useEffect(() => {
    // Initial load
    fetchMaritimeData()
    fetchVessels()

    // Keep the UI fresh without opening multiple realtime sockets.
    const statsInterval = setInterval(fetchMaritimeData, 60 * 1000)

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
    }
  }, [fetchMaritimeData, fetchVessels])

  return {
    articles,
    hotspots,
    signals,
    vessels,
    loading,
    error,
    refresh: async () => { await fetchMaritimeData(); await fetchVessels() },
    lastUpdated,
    vesselCount: vessels.length,
  }
}
