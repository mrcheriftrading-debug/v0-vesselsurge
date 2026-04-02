import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
 
const TAVILY_API_KEY = process.env.TAVILY_API_KEY
 
const TOPIC_QUERIES: Record<string, string> = {
  hormuz: 'Strait of Hormuz shipping tanker Iran 2026',
  bab: 'Bab el-Mandeb Red Sea Houthi attack shipping 2026',
  malacca: 'Strait of Malacca shipping traffic piracy 2026',
  suez: 'Suez Canal shipping traffic Egypt 2026',
  global: 'maritime shipping news chokepoint 2026',
}
 
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || 'global'
 
  // 1. Try to get admin-curated articles from Supabase first
  try {
    const supabase = await createClient()
    const query = supabase
      .from('news_articles')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
 
    if (topic !== 'global') {
      query.eq('topic', topic)
    }
 
    const { data, error } = await query.limit(10)
 
    if (!error && data && data.length > 0) {
      const articles = data.map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source,
        snippet: a.snippet,
        publishedAt: a.updated_at,
        topic: a.topic,
      }))
      return NextResponse.json(
        { success: true, articles, source: 'admin' },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
          },
        }
      )
    }
  } catch (e) {
    // Supabase unavailable, fall through
  }
 
  // 2. Try Tavily live search
  const query = TOPIC_QUERIES[topic] || TOPIC_QUERIES.global
  try {
    if (!TAVILY_API_KEY) throw new Error('No Tavily key')
 
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        include_answer: false,
        max_results: 6,
        include_domains: [
          'reuters.com', 'bbc.com', 'gcaptain.com',
          'maritime-executive.com', 'splash247.com',
          'tradewindsnews.com', 'hellenicshippingnews.com',
          'aljazeera.com', 'apnews.com', 'bloomberg.com',
          'dw.com', 'france24.com', 'cnbc.com',
        ],
      }),
    })
 
    if (!res.ok) throw new Error('Tavily error')
 
    const data = await res.json()
    const articles = (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      source: new URL(r.url).hostname.replace('www.', ''),
      snippet: r.content?.slice(0, 140) + '...',
      publishedAt: r.published_date || null,
    }))
 
    return NextResponse.json({ success: true, articles, source: 'tavily' })
  } catch {
    // 3. Final fallback — empty with a clear message
    return NextResponse.json({
      success: true,
      articles: [],
      source: 'none',
      message: 'No articles found. Add some via the Admin panel.',
    })
  }
