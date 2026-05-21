import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { buildMarketImpactReport } from '@/lib/market-impact'
import { getMarketSnapshot } from '@/lib/market-snapshot'

export async function buildLiveMarketProReport(supabase: SupabaseClient) {
  const [{ data: news, error: newsError }, { data: signals, error: signalsError }, marketSnapshot] = await Promise.all([
    supabase
      .from('news_articles')
      .select('id, title, snippet, source, url, topic, region, published_at, created_at')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(90),
    supabase
      .from('maritime_signals')
      .select('signal_key, title, summary, source, source_url, region, signal_type, observed_at, confidence')
      .order('observed_at', { ascending: false })
      .limit(70),
    getMarketSnapshot().catch((error) => {
      console.error('[market-pro] live market quotes unavailable:', error)
      return null
    }),
  ])

  if (newsError || signalsError) {
    throw newsError || signalsError
  }

  return {
    report: buildMarketImpactReport(news || [], signals || [], marketSnapshot),
    sourceCounts: {
      news: news?.length || 0,
      signals: signals?.length || 0,
      marketQuotes: marketSnapshot?.quotes.length || 0,
    },
  }
}
