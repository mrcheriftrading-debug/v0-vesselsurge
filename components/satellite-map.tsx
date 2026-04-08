'use client'

import { useEffect, useRef } from 'react'

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
    if (typeof window === 'undefined' || !mapRef.current) return
    if (initializingRef.current || mapInstanceRef.current) return

    initializingRef.current = true

    import('leaflet').then((L) => {
      try {
        if (!mapRef.current) return

        // Clear stale Leaflet id
        if ((mapRef.current as any)._leaflet_id) {
          delete (mapRef.current as any)._leaflet_id
        }

        // Fix Next.js/webpack broken default icon paths
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

        // Esri satellite tile layer
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: 'Tiles &copy; Esri', maxZoom: 19 }
        ).addTo(map)

        // Labels overlay
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19, opacity: 0.7 }
        ).addTo(map)

        mapInstanceRef.current = map

        // Add markers for each hotspot
        hotspots.forEach((h) => {
          const color = h.risk === 'CRITICAL' ? '#ef4444' : h.risk === 'HIGH' ? '#f97316' : '#eab308'
          const icon = L.divIcon({
            html: `<div style="
              width:22px;height:22px;border-radius:50%;
              background:${color};border:3px solid white;
              box-shadow:0 0 10px ${color}99;
              cursor:pointer;
            "></div>`,
            className: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          })

          const marker = L.marker([h.lat, h.lng], { icon }).addTo(map)
          marker.bindPopup(
            `<div style="font-weight:700;font-size:13px;margin-bottom:4px">${h.name}</div>
             <div style="font-size:11px;font-weight:700;color:${color};margin-bottom:2px">${h.risk}</div>
             <div style="font-size:11px;color:#666">${h.dailyTransits} ships/day</div>`,
            { maxWidth: 180 }
          )
          marker.on('click', () => onSelect(h))
          markersRef.current.push({ id: h.id, marker })
        })

        console.log('[vs] Map initialized')
      } catch (error) {
        console.error('[vs] Map init error:', error)
        initializingRef.current = false
      }
    }).catch((err) => {
      console.error('[vs] Leaflet import error:', err)
      initializingRef.current = false
    })

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          markersRef.current = []
          initializingRef.current = false
        } catch (e) {
          console.error('[vs] Map cleanup error:', e)
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to selected hotspot
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([selected.lat, selected.lng], 6, { duration: 1.2 })
  }, [selected])

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border relative bg-muted">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      {/* FIX: "Live" text was missing from the overlay badge */}
      <div className="absolute top-2 left-2 z-[999] bg-black/70 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
        <span>Live</span>
      </div>
    </div>
  )
}
