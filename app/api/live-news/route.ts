export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || null
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const supabase = await createClient()

    let query = supabase
      .from('news_articles')
      .select('id, title, summary, source, source_url, topic, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50))

    if (topic && topic !== 'all') {
      query = query.eq('topic', topic)
    }

    const { data, error } = await query

    if (error) {
      console.error('[live-news] Supabase error:', error)
      return NextResponse.json({ success: false, articles: [], error: error.message }, { status: 500 })
    }

    const articles = (data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      summary: a.summary || '',
      source: a.source,
      sourceUrl: a.source_url || null,   // FIX: correct field name
      topic: a.topic || 'global',
      timestamp: a.created_at,
    }))

    return NextResponse.json(
      { success: true, articles, count: articles.length },
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    )
  } catch (err: any) {
    return NextResponse.json({ success: false, articles: [], error: err.message }, { status: 500 })
  }
}
