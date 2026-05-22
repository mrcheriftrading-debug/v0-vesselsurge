import { NextResponse } from 'next/server'
import {
  getFallbackAccountForEmail,
  setFallbackAccountCookie,
  setFallbackSessionCookie,
} from '@/lib/fallback-auth'
import { assertSameOrigin } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type FallbackPasswordResetPayload = {
  email?: string
  password?: string
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || ''
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request)
  if (originError) return originError

  let payload: FallbackPasswordResetPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid password reset request.' }, { status: 400 })
  }

  const email = normalizeEmail(payload.email)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 })
  }

  const account = await getFallbackAccountForEmail(email)
  if (!account) {
    return NextResponse.json({ success: true, available: false })
  }

  if (!payload.password) {
    return NextResponse.json({ success: true, available: true })
  }

  if (payload.password.length < 6 || payload.password.length > 128) {
    return NextResponse.json({ success: false, error: 'Password must be 6-128 characters.' }, { status: 400 })
  }

  const response = NextResponse.json({ success: true, available: true, fallback: true })
  const session = {
    email: account.email,
    companyName: account.companyName,
    serviceType: account.serviceType,
    createdAt: account.createdAt,
  }
  setFallbackAccountCookie(response, session, payload.password)
  setFallbackSessionCookie(response, session)
  return response
}
