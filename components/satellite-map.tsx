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

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    if (mapInstanceRef.current) return // Already initialized

    // Check if map already exists in container
    if ((mapRef.current as any)._leaflet_id) return

    import('leaflet').then((L) => {
      // Fix Leaflet default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [20, 50],
        zoom: 4,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // Esri World Imagery - free satellite tiles
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
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
        const markerHtml = `
          <div style="
            background:${color};
            border:3px solid white;
            border-radius:50%;
            width:22px;height:22px;
            box-shadow:0 0 0 4px ${color}55;
            animation:pulse 2s infinite;
          "></div>
        `
        const icon = L.divIcon({ html: markerHtml, className: '', iconSize: [22, 22], iconAnchor: [11, 11] })
        const marker = L.marker([h.lat, h.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:180px">
              <div style="font-weight:bold;font-size:14px;margin-bottom:4px">${h.name}</div>
              <div style="color:${color};font-weight:bold;font-size:12px">${h.risk}</div>
              <div style="font-size:12px;margin-top:4px">${h.dailyTransits} ships/day</div>
              <div style="font-size:11px;color:#666;margin-top:4px">${h.note}</div>
            </div>
          `)
        marker.on('click', () => onSelect(h))
        markersRef.current.push({ id: h.id, marker })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Pan to selected hotspot
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([selected.lat, selected.lng], 6, { duration: 1.2 })
    const found = markersRef.current.find((m) => m.id === selected.id)
    if (found) found.marker.openPopup()
  }, [selected])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-border">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 z-[999] bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        LIVE SATELLITE VIEW
      </div>
    </div>
  )
}
