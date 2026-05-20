import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-static'

const LLMS_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
  'X-Robots-Tag': 'index, follow',
}

function loadLlmsFullContent() {
  try {
    const filePath = join(process.cwd(), 'public', 'llms-full.txt')
    return readFileSync(filePath, 'utf-8')
  } catch {
    return '# VesselSurge Documentation\n\nVisit https://www.vesselsurge.com for maritime intelligence.'
  }
}

const LLMS_FULL_CONTENT = loadLlmsFullContent()

export async function GET() {
  return new NextResponse(LLMS_FULL_CONTENT, {
    headers: LLMS_HEADERS,
  })
}
