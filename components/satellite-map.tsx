'use client'

import { useEffect, useRef, useState } from 'react'

interface Hotspot {
  id: string
  name: string
  lat: number
  lng: number
  risk: string
  riskColor: string
  dailyTransits: number
  note: string
}

interface SatelliteMapProps {
  hotspots: Hotspot[]
  selected: Hotspot
  onSelect: (h: Hotspot) => void
}

export default function SatelliteMap({ hotspots, selected, onSelect }: SatelliteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const initializingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mapRef.current) {
      console.log('[v0] mapRef.current is null')
      return
    }
    if (initializingRef.current || mapInstanceRef.current) {
      console.log('[v0] Map already initializing or initialized')
      return
    }

    initializingRef.current = true

    import('leaflet').then((L) => {
      try {
        if (!mapRef.current) {
          console.log('[v0] mapRef lost during async')
          return
        }

        // Clear any existing map
        if ((mapRef.current as any)._leaflet_id) {
          delete (mapRef.current as any)._leaflet_id
        }

        // Fix Leaflet icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        const map = L.map(mapRef.current, {
          center: [20, 50],
          zoom: 4,
          zoomControl: true,
          scrollWheelZoom: true,
        })

        // Esri satellite imagery
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 19,
        }).addTo(map)

        // Labels
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          opacity: 0.7,
        }).addTo(map)

        mapInstanceRef.current = map

        // Add markers
        hotspots.forEach((h) => {
          const color = h.risk === 'CRITICAL' ? '#ef4444' : h.risk === 'HIGH' ? '#f97316' : '#eab308'
          const icon = L.divIcon({
            html: `<div style="background:${color};border:3px solid white;border-radius:50%;width:20px;height:20px;box-shadow:0 0 0 4px ${color}55"></div>`,
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          const marker = L.marker([h.lat, h.lng], { icon }).addTo(map)
          marker.bindPopup(`<strong>${h.name}</strong><br/>${h.dailyTransits} ships/day`)
          marker.on('click', () => onSelect(h))
          markersRef.current.push({ id: h.id, marker })
        })

        console.log('[v0] Map initialized successfully')
      } catch (error) {
        console.error('[v0] Map init error:', error)
        initializingRef.current = false
      }
    }).catch((err) => {
      console.error('[v0] Leaflet import error:', err)
      initializingRef.current = false
    })

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          markersRef.current = []
        } catch (e) {
          console.error('[v0] Cleanup error:', e)
        }
      }
    }
  }, [])

  // Fly to selected hotspot
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([selected.lat, selected.lng], 6, { duration: 1.2 })
  }, [selected])

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border relative bg-muted">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      <div className="absolute top-2 left-2 z-[999] bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
        <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
        LIVE
      </div>
    </div>
  )
}
