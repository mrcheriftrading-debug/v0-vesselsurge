import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || 'global'

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
      return NextResponse.json({ success: true, articles: data, source: 'admin' })
    }
  } catch (e) {}

  return NextResponse.json({ success: true, articles: [], source: 'none' })
}
