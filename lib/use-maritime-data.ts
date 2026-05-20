'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Article, Hotspot, MaritimeSignal } from '@/lib/maritime-data'

type HotspotMap = Record<string, Hotspot>

type QualityAudit = {
  status: 'healthy' | 'watch' | 'degraded'
  sourceMix: {
    official: number
    tierOne: number
    trade: number
    search: number
    general: number
    watch: number
  }
  coverageGaps: Array<{
    hotspot: string
    score: number
    status: 'strong' | 'good' | 'watch'
    missing: string[]
    sourceCount: number
    latestNewsAt: string | null
    latestSignalAt: string | null
  }>
  recommendations: string[]
}

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
  qualityAudit: QualityAudit | null
  meta: {
    cached?: boolean
    generatedAt?: string
    stale?: boolean
    staleReason?: string
  } | null
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
  const [qualityAudit, setQualityAudit] = useState<QualityAudit | null>(null)
  const [meta, setMeta] = useState<UseMaritimeDataReturn['meta']>(null)
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
      const payload = await response.json()
      const { data } = payload
      setArticles(data.articles || [])
      setSignals(data.signals || [])
      setQualityAudit(data.qualityAudit || null)
      const map: HotspotMap = {}
      for (const h of data.hotspots || []) map[h.hotspot] = h
      setHotspots(map)
      setMeta(payload.meta || null)
      setLastUpdated(new Date(payload.meta?.generatedAt || data.timestamp || Date.now()))
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
    qualityAudit,
    meta,
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
