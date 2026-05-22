import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getMaritimeDashboardCacheRow } from '@/lib/maritime-dashboard-cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { MARITIME_WATCH_SOURCES, type MaritimeWatchSource } from '@/lib/maritime-watch-sources'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type WatchState = {
  fingerprint?: string
  lastHeavyUpdateAt?: string
  lastStartedAt?: string
  lastCompletedAt?: string
  lastFailedAt?: string
  lastError?: string
  lastDurationMs?: number
  lastRunId?: string
  lastSkipReason?: string
  lastChangeSummary?: string[]
}

const WATCH_STATE_KEY = 'maritime-watch'
const LOCK_TTL_MS = 55 * 1000
const AIS_STALE_MS = 5 * 60 * 1000
const MIN_HEAVY_INTERVAL_MS = 60 * 1000
const HEAVY_UPDATE_TIMEOUT_MS = 42_000
const DASHBOARD_CACHE_REFRESH_MS = 7 * 60 * 1000

function compact(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;|&#8217;/g, "'")
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function between(value: string, start: string, end: string) {
  const from = value.indexOf(start)
  if (from === -1) return ''
  const to = value.indexOf(end, from + start.length)
  if (to === -1) return ''
  return value.slice(from + start.length, to)
}

function hashJson(value: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function parseRssFingerprintItems(xml: string, source: MaritimeWatchSource) {
  return [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)]
    .slice(0, 12)
    .map((match) => {
      const item = match[0]
      return {
        source: source.source,
        region: source.regionHint || null,
        title: decodeHtml(between(item, '<title>', '</title>')).slice(0, 180),
        link: decodeHtml(between(item, '<link>', '</link>')).slice(0, 500),
        pubDate: decodeHtml(between(item, '<pubDate>', '</pubDate>')).slice(0, 80),
        publisher: decodeHtml(item.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || '').slice(0, 120),
      }
    })
    .filter((item) => item.title || item.link)
}

function parseHtmlFingerprintItems(html: string, source: MaritimeWatchSource) {
  const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      const href = match[1].startsWith('http') ? match[1] : new URL(match[1], source.url).toString()
      const title = decodeHtml(match[2])
      return {
        source: source.source,
        region: source.regionHint || null,
        title: title.slice(0, 180),
        link: href.slice(0, 500),
      }
    })
    .filter((item) => item.title.length > 16)
    .slice(0, 16)

  if (links.length > 0) return links

  return [
    {
      source: source.source,
      region: source.regionHint || null,
      title: compact(decodeHtml(html)).slice(0, 500),
      link: source.url,
    },
  ]
}

async function fetchSourceFingerprint(source: MaritimeWatchSource) {
  const response = await fetch(source.url, {
    headers: {
      accept: source.kind === 'rss' ? 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8' : 'text/html,*/*;q=0.8',
      'user-agent': 'VesselSurge Watcher/1.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) throw new Error(`${source.source} returned ${response.status}`)
  const text = await response.text()
  const items = source.kind === 'rss' ? parseRssFingerprintItems(text, source) : parseHtmlFingerprintItems(text, source)

  return {
    source: source.source,
    url: source.url,
    region: source.regionHint || null,
    status: response.status,
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
    items,
    hash: hashJson({ source: source.source, items }),
  }
}

async function buildSourceFingerprint() {
  const results = await Promise.allSettled(MARITIME_WATCH_SOURCES.map(fetchSourceFingerprint))
  const ok = results
    .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchSourceFingerprint>>> => result.status === 'fulfilled')
    .map((result) => result.value)
  const failed = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result, index) => ({ source: MARITIME_WATCH_SOURCES[index]?.source || 'unknown', error: result.reason?.message || String(result.reason) }))

  return {
    fingerprint: hashJson(ok.map((item) => ({ source: item.source, hash: item.hash }))),
    sourcesChecked: ok.length,
    sourcesFailed: failed,
    sourceHashes: ok.map((item) => ({ source: item.source, region: item.region, hash: item.hash })),
    sample: ok.flatMap((item) => item.items.slice(0, 2)).slice(0, 8),
  }
}

function isRecent(iso: string | undefined, windowMs: number) {
  const timestamp = Date.parse(iso || '')
  return Number.isFinite(timestamp) && Date.now() - timestamp < windowMs
}

function ageMs(iso: string | undefined | null) {
  const timestamp = Date.parse(iso || '')
  return Number.isFinite(timestamp) ? Date.now() - timestamp : Number.POSITIVE_INFINITY
}

function errorMessage(error: unknown, fallback = 'watch failed') {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message || fallback)
  return fallback
}

async function getWatchState(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase.from('ingestion_state').select('value').eq('key', WATCH_STATE_KEY).maybeSingle()
  if (error) throw error
  return (data?.value || {}) as WatchState
}

async function setWatchState(supabase: ReturnType<typeof createAdminClient>, value: WatchState) {
  const { error } = await supabase
    .from('ingestion_state')
    .upsert({ key: WATCH_STATE_KEY, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

async function getAisStaleness(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase.from('vessels').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  const latest = data?.updated_at || null
  const ageMs = latest ? Date.now() - Date.parse(latest) : Number.POSITIVE_INFINITY
  return { latest, ageMs, stale: !latest || ageMs >= AIS_STALE_MS }
}

function appBaseUrl(request: Request) {
  const configured = process.env.MARITIME_UPDATE_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

async function runHeavyUpdate(request: Request, cronSecret: string, scope: 'all' | 'news') {
  const response = await fetch(`${appBaseUrl(request)}/api/cron/update?scope=${scope}`, {
    headers: {
      authorization: `Bearer ${cronSecret}`,
      accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(HEAVY_UPDATE_TIMEOUT_MS),
  })
  const text = await response.text()
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text.slice(0, 1000) }
  }
  return { ok: response.ok, status: response.status, body }
}

export async function GET(request: Request) {
  const startedMs = Date.now()
  const runId = crypto.randomUUID()
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 })
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dashboardCache = await getMaritimeDashboardCacheRow(undefined, 800).catch(() => null)
  const dashboardCacheAgeMs = ageMs(dashboardCache?.generated_at)
  if (dashboardCache && dashboardCacheAgeMs < DASHBOARD_CACHE_REFRESH_MS) {
    return NextResponse.json({
      success: true,
      action: 'skipped',
      reason: 'dashboard cache fresh',
      runId,
      durationMs: Date.now() - startedMs,
      cacheGeneratedAt: dashboardCache.generated_at,
      cacheAgeSeconds: Math.round(dashboardCacheAgeMs / 1000),
      nextRefreshAfterSeconds: Math.max(0, Math.round((DASHBOARD_CACHE_REFRESH_MS - dashboardCacheAgeMs) / 1000)),
    })
  }

  const update = await runHeavyUpdate(request, cronSecret, 'all')
  return NextResponse.json(
    {
      success: update.ok,
      action: update.ok ? 'updated' : 'failed',
      reason: dashboardCache ? 'dashboard cache stale' : 'dashboard cache missing',
      runId,
      durationMs: Date.now() - startedMs,
      cacheGeneratedAt: dashboardCache?.generated_at || null,
      cacheAgeSeconds: Number.isFinite(dashboardCacheAgeMs) ? Math.round(dashboardCacheAgeMs / 1000) : null,
      update,
    },
    { status: update.ok ? 200 : 502 },
  )

  const supabase = createAdminClient()
  let state: WatchState = {}

  try {
    const now = new Date().toISOString()
    state = await getWatchState(supabase)

    if (isRecent(state.lastStartedAt, LOCK_TTL_MS) && !isRecent(state.lastCompletedAt, LOCK_TTL_MS)) {
      return NextResponse.json({ success: true, action: 'skipped', reason: 'update already running', runId, state })
    }

    const [sourceFingerprint, ais] = await Promise.all([buildSourceFingerprint(), getAisStaleness(supabase)])
    const sourceChanged = Boolean(state.fingerprint && state.fingerprint !== sourceFingerprint.fingerprint)
    const firstRun = !state.fingerprint
    const heavyUpdateRecent = isRecent(state.lastHeavyUpdateAt, MIN_HEAVY_INTERVAL_MS)
    const shouldUpdate = !heavyUpdateRecent && (firstRun || sourceChanged || ais.stale)
    const reasons = [
      firstRun ? 'first-run fingerprint seed' : null,
      sourceChanged ? 'source fingerprint changed' : null,
      ais.stale ? 'AIS data stale' : null,
    ].filter(Boolean) as string[]

    const nextState: WatchState = {
      ...state,
      fingerprint: sourceFingerprint.fingerprint,
      lastRunId: runId,
      lastDurationMs: Date.now() - startedMs,
      lastError: undefined,
      lastSkipReason: shouldUpdate ? undefined : heavyUpdateRecent ? 'heavy update ran recently' : 'no new source fingerprint and AIS fresh',
      lastChangeSummary: reasons,
    }

    if (!shouldUpdate) {
      await setWatchState(supabase, { ...nextState, lastCompletedAt: now, lastDurationMs: Date.now() - startedMs })
      return NextResponse.json({
        success: true,
        action: 'skipped',
        reason: nextState.lastSkipReason,
        runId,
        durationMs: Date.now() - startedMs,
        sourcesChecked: sourceFingerprint.sourcesChecked,
        sourcesFailed: sourceFingerprint.sourcesFailed,
        ais,
      })
    }

    await setWatchState(supabase, { ...nextState, lastStartedAt: now })
    const updateScope = ais.stale ? 'all' : 'news'
    const update = await runHeavyUpdate(request, cronSecret!, updateScope)
    const completedAt = new Date().toISOString()
    const durationMs = Date.now() - startedMs
    await setWatchState(supabase, {
      ...nextState,
      lastStartedAt: now,
      lastCompletedAt: completedAt,
      lastFailedAt: update.ok ? state.lastFailedAt : completedAt,
      lastError: update.ok ? undefined : `heavy update failed with ${update.status}`,
      lastDurationMs: durationMs,
      lastHeavyUpdateAt: update.ok ? completedAt : state.lastHeavyUpdateAt,
      lastSkipReason: update.ok ? undefined : `heavy update failed with ${update.status}`,
    })

    return NextResponse.json(
      {
        success: update.ok,
        action: update.ok ? 'updated' : 'failed',
        runId,
        durationMs,
        reasons,
        updateScope,
        sourcesChecked: sourceFingerprint.sourcesChecked,
        sourcesFailed: sourceFingerprint.sourcesFailed,
        ais,
        update,
      },
      { status: update.ok ? 200 : 502 },
    )
  } catch (error) {
    const failedAt = new Date().toISOString()
    const message = errorMessage(error)
    const durationMs = Date.now() - startedMs

    try {
      await setWatchState(supabase, {
        ...state,
        lastRunId: runId,
        lastFailedAt: failedAt,
        lastCompletedAt: failedAt,
        lastError: message,
        lastDurationMs: durationMs,
        lastSkipReason: `watch failed: ${message}`,
      })
    } catch (stateError) {
      console.error('[cron-watch] Failed to persist failure state:', stateError)
    }

    return NextResponse.json(
      {
        success: false,
        action: 'failed',
        runId,
        durationMs,
        error: message,
      },
      { status: 500 },
    )
  }
}
