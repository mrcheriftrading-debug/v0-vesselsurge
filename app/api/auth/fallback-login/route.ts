import { NextResponse } from 'next/server'
import { setFallbackSessionCookie, verifyFallbackAccount } from '@/lib/fallback-auth'
import { assertSameOrigin } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type FallbackLoginPayload = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request)
  if (originError) return originError

  let payload: FallbackLoginPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid login request.' }, { status: 400 })
  }

  const email = payload.email?.trim().toLowerCase() || ''
  const password = payload.password || ''
  const account = await verifyFallbackAccount(email, password)

  if (!account) {
    return NextResponse.json({ error: 'Fallback account not found in this browser.' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true, fallback: true })
  setFallbackSessionCookie(response, account)
  return response
}
