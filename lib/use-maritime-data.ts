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

interface RefreshOptions {
  force?: boolean
  showLoading?: boolean
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
  const statsPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasLoadedRef = useRef(false)
  const maritimeAbortRef = useRef<AbortController | null>(null)
  const vesselAbortRef = useRef<AbortController | null>(null)

  // Fetch hotspots + articles from our API
  const fetchMaritimeData = useCallback(async (options: RefreshOptions = {}) => {
    if (!options.force && typeof document !== 'undefined' && document.hidden) return

    maritimeAbortRef.current?.abort()
    const controller = new AbortController()
    maritimeAbortRef.current = controller

    try {
      if (!hasLoadedRef.current || options.showLoading) setLoading(true)
      setError(null)
      const response = await fetch('/api/maritime-data', {
        cache: 'default',
        signal: controller.signal,
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
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      if (maritimeAbortRef.current === controller) {
        maritimeAbortRef.current = null
        hasLoadedRef.current = true
        setLoading(false)
      }
    }
  }, [])

  // Fetch vessel rows from the AIS-backed API.
  const fetchVessels = useCallback(async (options: RefreshOptions = {}) => {
    if (!options.force && typeof document !== 'undefined' && document.hidden) return

    vesselAbortRef.current?.abort()
    const controller = new AbortController()
    vesselAbortRef.current = controller

    try {
      const res = await fetch('/api/ais-vessels', {
        cache: 'default',
        signal: controller.signal,
      })
      if (!res.ok) return
      const { vessels: vesselData } = await res.json()
      if (Array.isArray(vesselData)) {
        setVessels(vesselData.filter((v: Vessel) => v.lat && v.lng))
      }
    } catch { /* silent - vessels are optional enhancement */ }
    finally {
      if (vesselAbortRef.current === controller) vesselAbortRef.current = null
    }
  }, [])

  useEffect(() => {
    // Initial load
    fetchMaritimeData({ force: true, showLoading: true })
    fetchVessels({ force: true })

    // Keep the UI fresh without opening multiple realtime sockets.
    statsPollRef.current = setInterval(fetchMaritimeData, 60 * 1000)

    // Poll vessel positions every 60 seconds (AIS data updates frequently)
    vesselPollRef.current = setInterval(fetchVessels, 60 * 1000)

    // Refresh on tab focus
    const onVisible = () => {
      if (!document.hidden) {
        fetchMaritimeData({ force: true })
        fetchVessels({ force: true })
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      if (statsPollRef.current) clearInterval(statsPollRef.current)
      if (vesselPollRef.current) clearInterval(vesselPollRef.current)
      maritimeAbortRef.current?.abort()
      vesselAbortRef.current?.abort()
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
    refresh: async () => {
      await fetchMaritimeData({ force: true, showLoading: true })
      await fetchVessels({ force: true })
    },
    lastUpdated,
    vesselCount: vessels.length,
  }
}
