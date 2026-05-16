export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TRUSTED_SOURCES = [
  'USNI News',
  'gCaptain',
  'Hellenic Shipping News',
  'Splash247',
  'Offshore Energy',
  'Seatrade Maritime News',
  'MarineLink',
  'Al Jazeera',
  'Bloomberg Markets',
  'Bloomberg Politics',
  'Bloomberg Economics',
  'Bloomberg Business',
  'ReCAAP ISC Alerts',
  'ReCAAP ISC Reports',
  'Norwegian Maritime Authority',
  'MARAD Maritime Security Advisory',
  'Suez Canal Authority',
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || null
  const region = searchParams.get('region') || null
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const supabase = await createClient()

    let query = supabase
      .from('news_articles')
      .select('id, title, snippet, url, source, topic, region, published_at, created_at')
      .eq('is_active', true)
      .in('source', TRUSTED_SOURCES)
      .order('published_at', { ascending: false })
      .limit(Math.min(limit, 50))

    if (region && region !== 'all') {
      query = query.eq('region', region)
    } else if (topic && topic !== 'all') {
      query = query.eq('topic', topic)
    }

    const { data, error } = await query

    if (error) {
      console.error('[live-news] Supabase error:', error)
      return NextResponse.json({ success: false, articles: [], error: error.message }, { status: 500 })
    }

    const articles = (data || [])
      .filter((a: any) => !region || region === 'all' || a.region === region)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        summary: a.snippet || '',
        source: a.source,
        sourceUrl: a.url || null,
        topic: a.topic || 'global',
        region: a.region || 'global',
        timestamp: a.published_at || a.created_at,
      }))

    return NextResponse.json(
      { success: true, articles, count: articles.length },
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    )
  } catch (err: any) {
    return NextResponse.json({ success: false, articles: [], error: err.message }, { status: 500 })
  }
}
