export type HotspotMarinePoint = {
  id: 'hormuz' | 'bab' | 'suez' | 'malacca' | 'panama' | 'taiwan' | 'turkish' | 'gibraltar' | 'cape' | 'stockholm'
  name: string
  latitude: number
  longitude: number
}

export type MarineCondition = {
  hotspot: HotspotMarinePoint['id']
  source: string
  sourceUrl: string
  observedAt: string
  waveHeightM: number | null
  wavePeriodS: number | null
  seaLevelM: number | null
  seaSurfaceTemperatureC: number | null
  oceanCurrentVelocityKmh: number | null
  oceanCurrentDirectionDeg: number | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  title: string
  summary: string
}

export const HOTSPOT_MARINE_POINTS: HotspotMarinePoint[] = [
  { id: 'hormuz', name: 'Strait of Hormuz', latitude: 26.34, longitude: 56.47 },
  { id: 'bab', name: 'Bab el-Mandeb', latitude: 12.65, longitude: 43.32 },
  { id: 'suez', name: 'Suez Canal approaches', latitude: 29.95, longitude: 32.58 },
  { id: 'malacca', name: 'Strait of Malacca', latitude: 2.45, longitude: 102.15 },
  { id: "stockholm", name: "Stockholm Archipelago", latitude: 59.33, longitude: 18.07 },
  { id: 'panama', name: 'Panama Canal approaches', latitude: 9.08, longitude: -79.68 },
  { id: 'taiwan', name: 'Taiwan Strait', latitude: 24.4, longitude: 120.8 },
  { id: 'turkish', name: 'Turkish Straits', latitude: 41.08, longitude: 29.05 },
  { id: 'gibraltar', name: 'Strait of Gibraltar', latitude: 35.96, longitude: -5.6 },
  { id: 'cape', name: 'Cape of Good Hope', latitude: -34.36, longitude: 18.47 },
]

function numberOrNull(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function severityFromConditions(waveHeightM: number | null, currentVelocityKmh: number | null): MarineCondition['severity'] {
  if ((waveHeightM || 0) >= 4 || (currentVelocityKmh || 0) >= 8) return 'high'
  if ((waveHeightM || 0) >= 2.5 || (currentVelocityKmh || 0) >= 5.5) return 'medium'
  return 'low'
}

export async function fetchMarineCondition(point: HotspotMarinePoint): Promise<MarineCondition> {
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    current: [
      'wave_height',
      'wave_period',
      'sea_level_height_msl',
      'sea_surface_temperature',
      'ocean_current_velocity',
      'ocean_current_direction',
    ].join(','),
    timezone: 'UTC',
  })
  const sourceUrl = `https://marine-api.open-meteo.com/v1/marine?${params}`
  const response = await fetch(sourceUrl, {
    headers: { accept: 'application/json', 'user-agent': 'VesselSurge Marine Conditions/1.0' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) throw new Error(`Open-Meteo marine returned ${response.status} for ${point.id}`)

  const payload = await response.json()
  const current = payload.current || {}
  const waveHeightM = numberOrNull(current.wave_height)
  const wavePeriodS = numberOrNull(current.wave_period)
  const seaLevelM = numberOrNull(current.sea_level_height_msl)
  const seaSurfaceTemperatureC = numberOrNull(current.sea_surface_temperature)
  const oceanCurrentVelocityKmh = numberOrNull(current.ocean_current_velocity)
  const oceanCurrentDirectionDeg = numberOrNull(current.ocean_current_direction)
  const observedAt = current.time ? new Date(`${current.time}Z`).toISOString() : new Date().toISOString()
  const severity = severityFromConditions(waveHeightM, oceanCurrentVelocityKmh)
  const title = `${point.name} marine conditions: ${waveHeightM ?? 'n/a'} m waves, ${oceanCurrentVelocityKmh ?? 'n/a'} km/h current`

  return {
    hotspot: point.id,
    source: 'Open-Meteo Marine API',
    sourceUrl: 'https://open-meteo.com/en/docs/marine-weather-api',
    observedAt,
    waveHeightM,
    wavePeriodS,
    seaLevelM,
    seaSurfaceTemperatureC,
    oceanCurrentVelocityKmh,
    oceanCurrentDirectionDeg,
    severity,
    confidence: 58,
    title,
    summary: `Modeled marine conditions near ${point.name}: wave height ${waveHeightM ?? 'n/a'} m, wave period ${wavePeriodS ?? 'n/a'} s, ocean current ${oceanCurrentVelocityKmh ?? 'n/a'} km/h. Not a navigation warning; use as context only.`,
  }
}

export async function fetchAllMarineConditions() {
  const results = await Promise.allSettled(HOTSPOT_MARINE_POINTS.map(fetchMarineCondition))
  return results
    .filter((result): result is PromiseFulfilledResult<MarineCondition> => result.status === 'fulfilled')
    .map((result) => result.value)
}
