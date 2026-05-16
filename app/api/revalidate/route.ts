import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

function getRevalidateSecret() {
  return process.env.REVALIDATE_SECRET
}

export async function POST(request: NextRequest) {
  try {
    const revalidateSecret = getRevalidateSecret()
    if (!revalidateSecret) {
      return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 })
    }

    // Verify the secret token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token !== revalidateSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid revalidation token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { path = '/', type = 'layout' } = body

    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Log revalidation request
    console.log(`[v0] Revalidating path: ${path}, type: ${type}`)

    // Revalidate the specified path
    if (type === 'layout') {
      revalidatePath(path, 'layout')
    } else if (type === 'page') {
      revalidatePath(path, 'page')
    } else {
      revalidatePath(path)
    }

    return NextResponse.json(
      {
        revalidated: true,
        path,
        timestamp: new Date().toISOString(),
        message: `Successfully revalidated ${path}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Revalidation error:', error)
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    )
  }
}

// Allow GET for testing
export async function GET(request: NextRequest) {
  const revalidateSecret = getRevalidateSecret()
  if (!revalidateSecret) {
    return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== revalidateSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    message: 'Revalidation endpoint ready. Use POST with Bearer token and path in body.',
    example: {
      method: 'POST',
      headers: { 'Authorization': 'Bearer <REVALIDATE_SECRET>' },
      body: { path: '/', type: 'layout' },
    },
  })
}
