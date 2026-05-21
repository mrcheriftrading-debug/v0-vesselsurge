import { createClient } from "@/lib/supabase/server"
import { getSafeNextPath } from "@/lib/auth-next"
import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

const OTP_TYPES = new Set<EmailOtpType>(["signup", "invite", "magiclink", "recovery", "email_change", "email"])

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const rawNext = searchParams.get("next")
  const isPasswordRecovery =
    type === "recovery" ||
    rawNext === "/auth/reset-password" ||
    rawNext === "/auth/update-password"
  const next = isPasswordRecovery ? "/auth/reset-password" : getSafeNextPath(rawNext)

  if (tokenHash && type && OTP_TYPES.has(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
