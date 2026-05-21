import 'server-only'

import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'

const COOKIE_NAME = 'vesselsurge_fallback_session'
const MAX_AGE_SECONDS = 14 * 24 * 60 * 60

type FallbackSessionPayload = {
  email: string
  companyName: string
  serviceType: string
  createdAt: string
}

function fallbackSecret() {
  return process.env.FALLBACK_AUTH_SECRET || process.env.SUPABASE_JWT_SECRET || process.env.CRON_SECRET || ''
}

function sign(value: string) {
  const secret = fallbackSecret()
  if (!secret) throw new Error('Fallback auth secret is not configured')
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

function encodePayload(payload: FallbackSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodePayload(value: string): FallbackSessionPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (!payload?.email || !payload?.companyName || !payload?.serviceType || !payload?.createdAt) return null
    return payload
  } catch {
    return null
  }
}

export function createFallbackSessionToken(payload: FallbackSessionPayload) {
  const encoded = encodePayload(payload)
  return `${encoded}.${sign(encoded)}`
}

export function setFallbackSessionCookie(response: NextResponse, payload: FallbackSessionPayload) {
  response.cookies.set(COOKIE_NAME, createFallbackSessionToken(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export function clearFallbackSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0,
  })
}

export async function getFallbackUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(encoded)))) return null
  } catch {
    return null
  }

  const payload = decodePayload(encoded)
  if (!payload) return null

  const id = `fallback:${crypto.createHash('sha256').update(payload.email).digest('base64url').slice(0, 24)}`
  return {
    id,
    email: payload.email,
    created_at: payload.createdAt,
    user_metadata: {
      company_name: payload.companyName,
      service_type: payload.serviceType,
      auth_mode: 'fallback',
    },
  }
}
