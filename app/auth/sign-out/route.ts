import { createClient } from "@/lib/supabase/server"
import { clearFallbackSessionCookie } from "@/lib/fallback-auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  const { origin } = new URL(request.url)
  const response = NextResponse.redirect(`${origin}/auth/login`, { status: 303 })
  clearFallbackSessionCookie(response)
  return response
}
