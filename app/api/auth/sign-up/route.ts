import { NextResponse } from "next/server"
import { setFallbackAccountCookie, setFallbackSessionCookie } from "@/lib/fallback-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { assertSameOrigin } from "@/lib/security"

export const runtime = "nodejs"
export const preferredRegion = "fra1"

const SUPABASE_SIGNUP_TIMEOUT_MS = 5500

type SignUpPayload = {
  email?: string
  password?: string
  companyName?: string
  serviceType?: string
}

function fallbackSignUpResponse(email: string, password: string, companyName: string, serviceType: string, reason: string) {
  try {
    const response = NextResponse.json({
      success: true,
      fallback: true,
      userId: `fallback:${email}`,
      warning: reason,
    })
    setFallbackSessionCookie(response, {
      email,
      companyName,
      serviceType,
      createdAt: new Date().toISOString(),
    })
    setFallbackAccountCookie(response, {
      email,
      companyName,
      serviceType,
      createdAt: new Date().toISOString(),
    }, password)
    return response
  } catch (fallbackError) {
    console.error("[auth/sign-up] fallback session failed:", fallbackError)
    return NextResponse.json({ error: "Account creation is temporarily unavailable. Please try again." }, { status: 503 })
  }
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function isExpectedAuthFallbackReason(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /timed out|timeout|aborted|fetch failed|network|522|504/i.test(message)
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request)
  if (originError) return originError

  let payload: SignUpPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid sign-up request." }, { status: 400 })
  }

  const email = payload.email?.trim().toLowerCase()
  const password = payload.password || ""
  const companyName = payload.companyName?.trim() || ""
  const allowedServiceTypes = new Set(["ship-owner", "cargo-owner", "trader"])
  const serviceType = allowedServiceTypes.has(payload.serviceType || "")
    ? payload.serviceType!
    : "ship-owner"

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
  }

  if (companyName.length < 2) {
    return NextResponse.json({ error: "Enter your company name." }, { status: 400 })
  }

  if (companyName.length > 120 || email.length > 254 || password.length > 128) {
    return NextResponse.json({ error: "Account details are too long." }, { status: 400 })
  }

  try {
    const supabaseAdmin = createAdminClient()
    const { data, error } = await withTimeout(
      supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          company_name: companyName,
          service_type: serviceType,
        },
      }),
      SUPABASE_SIGNUP_TIMEOUT_MS,
      "Supabase Auth account creation",
    )

    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes("already") || message.includes("registered") || message.includes("duplicate")) {
        return NextResponse.json(
          { error: "An account already exists for this email. Log in instead.", code: "account_exists" },
          { status: 409 },
        )
      }

      return NextResponse.json({ error: "Could not create the account right now." }, { status: 500 })
    }

    const response = NextResponse.json({ success: true, userId: data.user?.id })
    const backupSession = {
      email,
      companyName,
      serviceType,
      createdAt: data.user?.created_at || new Date().toISOString(),
    }
    setFallbackSessionCookie(response, backupSession)
    setFallbackAccountCookie(response, backupSession, password)
    return response
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Supabase Auth unavailable"
    if (isExpectedAuthFallbackReason(error)) {
      console.info("[auth/sign-up] using fallback account creation:", reason)
    } else {
      console.error("[auth/sign-up] account creation failed:", error)
    }
    return fallbackSignUpResponse(email, password, companyName, serviceType, reason)
  }
}
