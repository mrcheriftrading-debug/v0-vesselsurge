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

async function getMarketProCacheRow(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('ingestion_state')
    .select('value, updated_at')
    .eq('key', MARKET_PRO_CACHE_KEY)
    .maybeSingle()

  if (error || !data?.value) return null
  return data as IngestionStateRow
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
