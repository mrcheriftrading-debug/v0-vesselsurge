import { NextResponse } from 'next/server'
import { loadSourceTrustReport } from '@/lib/source-trust'
import { createAdminClient } from '@/lib/supabase/admin'
import { publicVercelCacheHeaders } from '@/lib/vercel-cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const report = await loadSourceTrustReport(createAdminClient())

    return NextResponse.json(
      {
        success: true,
        report,
      },
      {
        headers: {
          ...publicVercelCacheHeaders('public, s-maxage=60, stale-while-revalidate=180', ['source-trust']),
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Source trust report unavailable',
      },
      { status: 500 },
    )
  }
}
