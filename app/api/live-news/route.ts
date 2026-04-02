import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
 
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || 'global'
 
  // 1. Try admin-curated articles from Supabase first
  try {
    const supabase = await createClient()
    let query = supabase
      .from('news_articles')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(10)
 
    if (topic !== 'global') {
      query = supabase
        .from('news_articles')
        .select('*')
        .eq('is_active', true)
        .eq('topic', topic)
        .order('updated_at', { ascending: false })
        .limit(10)
    }
 
    const { data, error } = await query
 
    if (!error && data && data.length > 0) {
      const articles = data.map((a: any) => ({
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
 
  // 2. No articles found
  return NextResponse.json({
    success: true,
    articles: [],
    source: 'none',
    message: 'No articles found. Add some via the Admin panel at /admin',
  })
}
 
