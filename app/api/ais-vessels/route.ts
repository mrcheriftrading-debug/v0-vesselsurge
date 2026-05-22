import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { publicVercelCacheHeaders } from '@/lib/vercel-cache'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'fra1'

const AIS_QUERY_TIMEOUT_MS = 1200
const AIS_CACHE_CONTROL = 'public, s-maxage=20, stale-while-revalidate=120'
const AIS_CACHE_HEADERS = publicVercelCacheHeaders(AIS_CACHE_CONTROL, ['ais-vessels', 'live-map'])

function isExpectedFallbackReason(value: unknown) {
  const message = value instanceof Error ? value.message : String(value || '')
  return /timed out|timeout|aborted/i.test(message)
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function unavailableVesselsResponse(hotspot: string | null, reason: string) {
  return NextResponse.json(
    {
      success: true,
      degraded: true,
      vessels: [],
      count: 0,
      hotspot,
      source: 'database-fallback',
      note: 'Verified AIS vessel rows are temporarily unavailable. VesselSurge is keeping the live map active with source-reviewed hotspot, news, and signal layers instead of serving mock vessels.',
      warning: reason,
    },
    {
      headers: {
        ...AIS_CACHE_HEADERS,
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'X-VesselSurge-Fallback': 'ais-database-unavailable',
      },
    },
  )
}

export async function GET(request: NextRequest) {
  let hotspot: string | null = null

  try {
    const { searchParams } = new URL(request.url)
    hotspot = searchParams.get('hotspot') || null
    const supabase = createAdminClient()

    let query = supabase
      .from('vessels')
      .select('mmsi, name, lat, lng, speed, heading, ship_type, destination, hotspot, updated_at')
      .order('updated_at', { ascending: false })
      .limit(250)

    if (hotspot && hotspot !== 'all') {
      query = query.eq('hotspot', hotspot)
    }

    const { data, error } = await withTimeout(query, AIS_QUERY_TIMEOUT_MS, 'ais-vessels query')

    if (error) {
      if (!isExpectedFallbackReason(error)) console.warn('[ais-vessels] database fallback:', error)
      return unavailableVesselsResponse(hotspot, error.message || 'AIS database query failed')
    }

    return NextResponse.json(
      {
        success: true,
        vessels: data || [],
        count: data?.length || 0,
        hotspot,
        source: 'database',
        note: data?.length ? 'Verified AIS database rows.' : 'No verified AIS rows available. Mock vessel data is disabled.',
      },
      {
        headers: {
          ...AIS_CACHE_HEADERS,
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  } catch (err: any) {
    if (!isExpectedFallbackReason(err)) console.warn('[ais-vessels] serving fallback:', err?.message || err)
    return unavailableVesselsResponse(hotspot, err?.message || 'AIS database unavailable')
  }
}
