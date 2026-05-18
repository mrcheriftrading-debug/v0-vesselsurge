import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { assertSameOrigin } from "@/lib/security"

export const runtime = "nodejs"

type SignUpPayload = {
  email?: string
  password?: string
  companyName?: string
  serviceType?: string
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
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        company_name: companyName,
        service_type: serviceType,
      },
    })

    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes("already") || message.includes("registered") || message.includes("duplicate")) {
        return NextResponse.json(
          { error: "An account already exists for this email. Log in instead." },
          { status: 409 },
        )
      }

      return NextResponse.json({ error: "Could not create the account right now." }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: data.user?.id })
  } catch {
    return NextResponse.json({ error: "Account creation is not configured correctly." }, { status: 500 })
  }
}
