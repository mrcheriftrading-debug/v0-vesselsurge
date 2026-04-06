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
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50))

    if (topic && topic !== 'all') {
      query = query.eq('topic', topic)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(
      {
        success: true,
        articles: data || [],
        count: data?.length || 0,
        timestamp: new Date().toISOString(),
        source: 'supabase',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error: any) {
    console.error('[live-news] error:', error?.message)
    return NextResponse.json({ success: false, error: error?.message, articles: [] }, { status: 500 })
  }
}
