import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { buildMarketImpactReport } from '@/lib/market-impact'

export type MarketProReport = ReturnType<typeof buildMarketImpactReport>

export type MarketProAnalysisCache = {
  report: MarketProReport
  generatedAt: string
  source: 'cron' | 'live-fallback'
  stale?: boolean
  staleReason?: string
}

const MARKET_PRO_CACHE_KEY = 'market-pro-analysis'
const REDIS_MARKET_PRO_CACHE_KEY = `vesselsurge:${MARKET_PRO_CACHE_KEY}`
const FRESH_TTL_MS = 6 * 60 * 1000
const STALE_TTL_MS = 24 * 60 * 60 * 1000

type IngestionStateRow = {
  value: MarketProAnalysisCache
  updated_at: string
}

function cacheAgeMs(value?: string | null) {
  const timestamp = Date.parse(value || '')
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY
  return Date.now() - timestamp
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

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null
  return { url, token }
}

async function redisCommand<T>(command: unknown[], timeoutMs: number): Promise<T | null> {
  const config = getRedisConfig()
  if (!config) return null

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!response.ok) return null
    const body = await response.json() as { result?: T; error?: string }
    if (body.error) return null
    return body.result ?? null
  } catch {
    return null
  }
}

async function getMarketProCacheRowViaRedis(timeoutMs: number): Promise<IngestionStateRow | null> {
  const cached = await redisCommand<string | IngestionStateRow>(['GET', REDIS_MARKET_PRO_CACHE_KEY], timeoutMs)
  if (!cached) return null

  try {
    const row = typeof cached === 'string' ? JSON.parse(cached) : cached
    if (!row?.value?.report || !row?.updated_at) return null
    return row as IngestionStateRow
  } catch {
    return null
  }
}

async function upsertMarketProCacheRowViaRedis(row: IngestionStateRow) {
  const ttlSeconds = Math.round(STALE_TTL_MS / 1000)
  const result = await redisCommand<string>(['SET', REDIS_MARKET_PRO_CACHE_KEY, JSON.stringify(row), 'EX', ttlSeconds], 2500)
  return result === 'OK'
}

async function getMarketProCacheRowViaSupabase(supabase: SupabaseClient, timeoutMs: number) {
  const { data, error } = await withTimeout(
    supabase
      .from('ingestion_state')
      .select('value, updated_at')
      .eq('key', MARKET_PRO_CACHE_KEY)
      .maybeSingle(),
    timeoutMs,
    'Market Pro cache row',
  )

  if (error || !data?.value) return null
  return data as IngestionStateRow
}

async function getMarketProCacheRow(supabase: SupabaseClient) {
  return (
    await getMarketProCacheRowViaRedis(1000) ||
    await getMarketProCacheRowViaSupabase(supabase, 1200).catch(() => null)
  )
}

export async function getFreshMarketProAnalysisCache(supabase: SupabaseClient) {
  const row = await getMarketProCacheRow(supabase)
  if (!row?.value?.report) return null
  if (cacheAgeMs(row.value.generatedAt || row.updated_at) > FRESH_TTL_MS) return null
  return {
    ...row.value,
    stale: false,
  }
}

export async function getLastMarketProAnalysisCache(supabase: SupabaseClient, staleReason = 'serving last saved Market Pro analysis') {
  const row = await getMarketProCacheRow(supabase)
  if (!row?.value?.report) return null
  if (cacheAgeMs(row.value.generatedAt || row.updated_at) > STALE_TTL_MS) return null
  return {
    ...row.value,
    stale: true,
    staleReason,
  }
}

export async function upsertMarketProAnalysisCache(
  supabase: SupabaseClient,
  report: MarketProReport,
  source: MarketProAnalysisCache['source'] = 'cron',
) {
  const generatedAt = report.generatedAt || new Date().toISOString()
  const value: MarketProAnalysisCache = {
    report,
    generatedAt,
    source,
  }
  const row: IngestionStateRow = {
    value,
    updated_at: generatedAt,
  }

  if (await upsertMarketProCacheRowViaRedis(row)) return value

  const { error } = await supabase
    .from('ingestion_state')
    .upsert(
      {
        key: MARKET_PRO_CACHE_KEY,
        value,
        updated_at: generatedAt,
      },
      { onConflict: 'key' },
    )

  if (error) throw error
  return value
}
