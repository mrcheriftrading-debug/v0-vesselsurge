import { createHash } from 'crypto'
import { buildMaritimeDashboardPayload, getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache } from '@/lib/maritime-dashboard-cache'
import { buildOfflineMaritimeDashboardSnapshot } from '@/lib/maritime-offline-snapshot'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const RESPONSE_HEADERS = {
  'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120',
  'X-Content-Type-Options': 'nosniff',
}

function buildValidatedJsonResponse(payload: unknown, request: Request) {
  const body = JSON.stringify(payload)
  const etag = `"${createHash('sha1').update(body).digest('base64url')}"`
  const ifNoneMatch = request.headers.get('if-none-match')
  const generatedAt = payload && typeof payload === 'object' && 'meta' in payload
    ? (payload as { meta?: { generatedAt?: string } }).meta?.generatedAt
    : null

  const headers = {
    ...RESPONSE_HEADERS,
    ETag: etag,
    ...(generatedAt ? { 'Last-Modified': new Date(generatedAt).toUTCString() } : {}),
  }

  if (ifNoneMatch?.split(',').map((tag) => tag.trim()).includes(etag)) {
    return new Response(null, { status: 304, headers })
  }

  return new Response(body, {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
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

export async function GET(request: Request) {
  const supabase = createAdminClient()
  const cached = await withTimeout(getFreshMaritimeDashboardCache(supabase), 1500, 'fresh dashboard cache').catch(() => null)

  if (cached) {
    return buildValidatedJsonResponse(cached, request)
  }

  try {
    return buildValidatedJsonResponse(await withTimeout(buildMaritimeDashboardPayload(supabase), 5000, 'live maritime payload'), request)
  } catch (error) {
    console.error('[v0] Maritime data API error:', error)
    const stale = await withTimeout(
      getLastMaritimeDashboardCache(supabase, 'live refresh failed; serving last known real hotspot statistics and news'),
      1500,
      'stale dashboard cache',
    ).catch(() => null)

    if (stale) {
      return buildValidatedJsonResponse(stale, request)
    }

    return buildValidatedJsonResponse(
      buildOfflineMaritimeDashboardSnapshot('live refresh and database cache unavailable; serving bundled source-reviewed route context'),
      request,
    )
  }
}
