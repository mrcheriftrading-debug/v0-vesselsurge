import { createClient } from "@/lib/supabase/server"
import { getSafeNextPath } from "@/lib/auth-next"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const requestedNext = getSafeNextPath(searchParams.get("next"))
  const isPasswordRecovery =
    searchParams.get("type") === "recovery" ||
    requestedNext === "/auth/reset-password" ||
    requestedNext === "/auth/update-password"
  const next = isPasswordRecovery ? "/auth/reset-password" : requestedNext

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
