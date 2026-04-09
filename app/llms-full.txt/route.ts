import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // Try to read from public folder
    const filePath = join(process.cwd(), 'public', 'llms-full.txt')
    const content = readFileSync(filePath, 'utf-8')
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Robots-Tag': 'index, follow',
      },
    })
  } catch {
    // Fallback content if file not found
    return new NextResponse('# VesselSurge Documentation\n\nVisit https://www.vesselsurge.com for maritime intelligence.', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }
}
