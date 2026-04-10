'use client'

import { useEffect, useRef, useCallback } from 'react'

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
  vessels?: Vessel[]
}

const SHIP_TYPE_LABEL: Record<number, string> = {
  70: 'Cargo', 71: 'Cargo', 72: 'Cargo', 73: 'Cargo', 74: 'Cargo', 79: 'Cargo',
  80: 'Tanker', 81: 'Tanker', 82: 'Tanker', 83: 'Tanker', 84: 'Tanker', 89: 'Tanker',
  60: 'Passenger', 69: 'Passenger',
  30: 'Fishing',
  50: 'Pilot', 51: 'SAR', 52: 'Tug', 55: 'Law Enforcement',
}

function getShipColor(ship_type: number, speed: number): string {
  if (speed < 0.5) return '#94a3b8' // anchored/moored — grey
  if (ship_type >= 80 && ship_type <= 89) return '#f97316' // tanker — orange
  if (ship_type >= 70 && ship_type <= 79) return '#3b82f6' // cargo — blue
  if (ship_type >= 60 && ship_type <= 69) return '#8b5cf6' // passenger — purple
  return '#22c55e' // other moving — green
}

function makeShipIcon(L: any, color: string, heading: number, speed: number) {
  const size = speed > 5 ? 10 : 8
  const opacity = speed < 0.5 ? 0.5 : 0.9
  const rot = isNaN(heading) || heading === 511 ? 0 : heading
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size * 1.6}px;
      background:${color};
      clip-path:polygon(50% 0%,100% 100%,50% 75%,0% 100%);
      transform:rotate(${rot}deg);
      transform-origin:center center;
      opacity:${opacity};
      filter:drop-shadow(0 0 3px ${color}88);
    "></div>`,
    className: '',
    iconSize: [size, size * 1.6],
    iconAnchor: [size / 2, size * 0.8],
  })
}

export default function SatelliteMap({ hotspots, selected, onSelect, vessels = [] }: SatelliteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const hotspotMarkersRef = useRef<any[]>([])
  const vesselMarkersRef = useRef<Map<number, any>>(new Map())
  const vesselLayerRef = useRef<any>(null)
  const initializingRef = useRef(false)

  // Draw / update vessel dots
  const updateVesselMarkers = useCallback((L: any, vesselList: Vessel[]) => {
    if (!mapInstanceRef.current || !L) return

    // Ensure layer group exists
    if (!vesselLayerRef.current) {
      vesselLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current)
    }

    const seen = new Set<number>()

    for (const v of vesselList) {
      if (!v.lat || !v.lng || isNaN(v.lat) || isNaN(v.lng)) continue
      seen.add(v.mmsi)

      const color = getShipColor(v.ship_type, v.speed)
      const icon = makeShipIcon(L, color, v.heading, v.speed)
      const typeLabel = SHIP_TYPE_LABEL[v.ship_type] || 'Vessel'
      const speedKts = v.speed?.toFixed(1) || '0.0'

      const popup = `
        <div style="font-family:monospace;font-size:11px;min-width:140px">
          <div style="font-weight:700;font-size:12px;margin-bottom:4px;color:#0ea5e9">${v.name || 'Unknown'}</div>
          <div style="color:#94a3b8">MMSI: ${v.mmsi}</div>
          <div>Type: <span style="color:${color}">${typeLabel}</span></div>
          <div>Speed: ${speedKts} kts</div>
          ${v.destination ? '<div>Dest: ' + v.destination + '</div>' : ''}
        </div>`

      const existing = vesselMarkersRef.current.get(v.mmsi)
      if (existing) {
        existing.setLatLng([v.lat, v.lng])
        existing.setIcon(icon)
        existing.getPopup()?.setContent(popup)
      } else {
        const marker = L.marker([v.lat, v.lng], { icon, zIndexOffset: 100 })
        marker.bindPopup(popup, { maxWidth: 200 })
        vesselLayerRef.current.addLayer(marker)
        vesselMarkersRef.current.set(v.mmsi, marker)
      }
    }

    // Remove stale vessels
    for (const [mmsi, marker] of vesselMarkersRef.current.entries()) {
      if (!seen.has(mmsi)) {
        vesselLayerRef.current.removeLayer(marker)
        vesselMarkersRef.current.delete(mmsi)
      }
    }
  }, [])

  // Init map once
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    if (initializingRef.current || mapInstanceRef.current) return
    initializingRef.current = true

    import('leaflet').then((L) => {
      try {
        if (!mapRef.current) return
        if ((mapRef.current as any)._leaflet_id) {
          delete (mapRef.current as any)._leaflet_id
        }

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        const map = L.map(mapRef.current, {
          center: [20, 60],
          zoom: 4,
          zoomControl: true,
          scrollWheelZoom: true,
          preferCanvas: true, // faster rendering for many markers
        })

        // Satellite layer
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: '&copy; Esri', maxZoom: 19 }
        ).addTo(map)

        // Labels
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19, opacity: 0.6 }
        ).addTo(map)

        mapInstanceRef.current = map

        // Hotspot pulse markers
        hotspots.forEach((h) => {
          const color = h.risk === 'CRITICAL' ? '#ef4444' : h.risk === 'HIGH' ? '#f97316' : h.risk === 'MEDIUM' ? '#eab308' : '#22c55e'
          const icon = L.divIcon({
            html: `<div style="position:relative;width:28px;height:28px">
              <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.2;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
              <div style="position:absolute;inset:4px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px ${color}"></div>
            </div>
            <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>`,
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })

          const marker = L.marker([h.lat, h.lng], { icon, zIndexOffset: 1000 })
          marker.bindPopup(
            `<div style="font-family:monospace;font-size:11px">
              <div style="font-weight:700;color:${color};font-size:12px">${h.name}</div>
              <div style="color:#94a3b8">Risk: <span style="color:${color}">${h.risk}</span></div>
              <div>${h.dailyTransits} transits/day</div>
            </div>`,
            { maxWidth: 180 }
          )
          marker.on('click', () => onSelect(h))
          hotspotMarkersRef.current.push({ id: h.id, marker })
          marker.addTo(map)
        })

        // Draw initial vessels
        if (vessels.length > 0) updateVesselMarkers(L, vessels)

        console.log('[map] initialized with', vessels.length, 'vessels')
      } catch (e) {
        console.error('[map] init error:', e)
        initializingRef.current = false
      }
    }).catch((e) => {
      console.error('[map] leaflet error:', e)
      initializingRef.current = false
    })

    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove() } catch (_) {}
        mapInstanceRef.current = null
        hotspotMarkersRef.current = []
        vesselMarkersRef.current.clear()
        vesselLayerRef.current = null
        initializingRef.current = false
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to selected hotspot
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.flyTo([selected.lat, selected.lng], 6, { duration: 1.0 })
  }, [selected])

  // Update vessel positions when data changes
  useEffect(() => {
    import('leaflet').then((L) => {
      updateVesselMarkers(L, vessels)
    }).catch(() => {})
  }, [vessels, updateVesselMarkers])

  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative bg-slate-900">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />

      {/* Live badge */}
      <div className="absolute top-3 left-3 z-[999] bg-black/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
        <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
        <span className="font-mono">AIS LIVE</span>
      </div>

      {/* Vessel count badge */}
      {vessels.length > 0 && (
        <div className="absolute top-3 right-3 z-[999] bg-black/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-white/10 font-mono">
          {vessels.length} vessels tracked
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[999] bg-black/80 backdrop-blur text-white text-xs px-3 py-2 rounded-xl border border-white/10 space-y-1">
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> Tanker</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Cargo</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> Passenger</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400" /> Anchored</div>
      </div>
    </div>
  )
}
