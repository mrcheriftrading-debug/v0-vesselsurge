import WebSocket from 'ws'

export type AisVesselRow = {
  mmsi: number
  name: string
  lat: number
  lng: number
  speed: number
  heading: number
  ship_type: number
  destination: string
  hotspot: string
  updated_at: string
}

type HotspotBounds = {
  id: string
  bounds: [[number, number], [number, number]]
}

const HOTSPOT_BOUNDS: HotspotBounds[] = [
  // Slightly wider boxes catch approaches/anchorages without pretending to cover an ocean basin.
  { id: 'hormuz', bounds: [[24.8, 54.0], [27.9, 58.4]] },
  { id: 'bab', bounds: [[11.2, 41.8], [13.8, 45.0]] },
  { id: 'malacca', bounds: [[0.8, 99.5], [4.2, 104.8]] },
  { id: 'suez', bounds: [[28.8, 31.5], [31.6, 33.4]] },
]

export function getAisStreamKey() {
  return process.env.AISSTREAM_API_KEY || process.env.NEXT_PUBLIC_AISSTREAM_API_KEY || ''
}

export async function collectAisStreamVessels(options: { timeoutMs?: number; maxVessels?: number; maxVesselsPerHotspot?: number } = {}) {
  const apiKey = getAisStreamKey()
  if (!apiKey) {
    return {
      ok: false,
      reason: 'AISSTREAM_API_KEY is not configured',
      vessels: [] as AisVesselRow[],
    }
  }

  const timeoutMs = options.timeoutMs ?? 18000
  const maxVessels = options.maxVessels ?? 80
  const maxVesselsPerHotspot = options.maxVesselsPerHotspot ?? Math.max(20, Math.ceil(maxVessels / HOTSPOT_BOUNDS.length))
  const vessels = new Map<number, AisVesselRow>()
  const hotspotCounts = new Map<string, number>()
  const startedAt = Date.now()

  return new Promise<{ ok: boolean; reason: string; vessels: AisVesselRow[] }>((resolve) => {
    const socket = new WebSocket('wss://stream.aisstream.io/v0/stream')
    let settled = false

    const finish = (reason: string) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        socket.close()
      } catch {}
      resolve({ ok: vessels.size > 0, reason, vessels: [...vessels.values()] })
    }

    const timer = setTimeout(() => finish(vessels.size ? 'timeout-with-data' : 'timeout-no-data'), timeoutMs)

    socket.on('open', () => {
      socket.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: HOTSPOT_BOUNDS.map((item) => item.bounds),
        FilterMessageTypes: ['PositionReport'],
      }))
    })

    socket.on('message', (raw) => {
      try {
        const text = typeof raw === 'string' ? raw : raw.toString('utf8')
        const message = JSON.parse(text)
        const report = message.Message?.PositionReport
        const meta = message.MetaData || message.Metadata || {}
        const mmsi = Number(report?.UserID || meta.MMSI || meta.Mmsi)
        const lat = Number(report?.Latitude ?? meta.Latitude)
        const lng = Number(report?.Longitude ?? meta.Longitude)

        if (!Number.isFinite(mmsi) || !Number.isFinite(lat) || !Number.isFinite(lng)) return

        const hotspot = getHotspotForPosition(lat, lng)
        if (!hotspot) return
        const isNewVessel = !vessels.has(mmsi)
        const hotspotCount = hotspotCounts.get(hotspot) || 0
        if (isNewVessel && hotspotCount >= maxVesselsPerHotspot) return

        vessels.set(mmsi, {
          mmsi,
          name: cleanShipName(meta.ShipName || meta.Name || `MMSI ${mmsi}`),
          lat,
          lng,
          speed: Number(report?.Sog ?? report?.SpeedOverGround ?? 0) || 0,
          heading: Number(report?.TrueHeading ?? report?.Cog ?? report?.CourseOverGround ?? 0) || 0,
          ship_type: Number(meta.ShipType || meta.ShipTypeCode || 0) || 0,
          destination: cleanShipName(meta.Destination || ''),
          hotspot,
          updated_at: new Date().toISOString(),
        })
        if (isNewVessel) hotspotCounts.set(hotspot, hotspotCount + 1)

        const allHotspotsFull = HOTSPOT_BOUNDS.every((item) => (hotspotCounts.get(item.id) || 0) >= maxVesselsPerHotspot)
        if (vessels.size >= maxVessels || allHotspotsFull || Date.now() - startedAt >= timeoutMs) {
          finish('collected')
        }
      } catch {
        // Ignore malformed AIS frames and keep collecting until timeout.
      }
    })

    socket.on('error', () => finish(vessels.size ? 'socket-error-with-data' : 'socket-error'))
    socket.on('close', () => finish(vessels.size ? 'closed-with-data' : 'closed-no-data'))
  })
}

function getHotspotForPosition(lat: number, lng: number) {
  for (const hotspot of HOTSPOT_BOUNDS) {
    const [[latA, lngA], [latB, lngB]] = hotspot.bounds
    const minLat = Math.min(latA, latB)
    const maxLat = Math.max(latA, latB)
    const minLng = Math.min(lngA, lngB)
    const maxLng = Math.max(lngA, lngB)
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) return hotspot.id
  }

  return null
}

function cleanShipName(value: string) {
  return value.replace(/\s+/g, ' ').trim() || 'Unknown'
}
