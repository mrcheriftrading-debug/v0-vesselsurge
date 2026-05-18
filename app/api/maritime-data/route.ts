import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { buildMaritimeDashboardPayload, getFreshMaritimeDashboardCache } from '@/lib/maritime-dashboard-cache'
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

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const cached = await getFreshMaritimeDashboardCache(supabase)

    if (cached) {
      return buildValidatedJsonResponse(cached, request)
    }

    return buildValidatedJsonResponse(await buildMaritimeDashboardPayload(supabase), request)
  } catch (error) {
    console.error('[v0] Maritime data API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maritime data' },
      { status: 500, headers: { 'X-Content-Type-Options': 'nosniff' } },
    )
  }
}
