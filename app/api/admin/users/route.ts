import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Admin email - only this user can access admin features
const ADMIN_EMAIL = "mrcheriftrading@gmail.com"

export async function GET(request: Request) {
  // Check for admin secret in headers
  const authHeader = request.headers.get("authorization")
  const adminSecret = authHeader?.replace("Bearer ", "")

  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Use service role to get all users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map users to a simpler format
  const mappedUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    companyName: user.user_metadata?.company_name || "Not specified",
    serviceType: user.user_metadata?.service_type || "Not specified",
    createdAt: user.created_at,
    lastSignIn: user.last_sign_in_at,
    emailConfirmed: user.email_confirmed_at ? true : false,
  }))

  return NextResponse.json({ users: mappedUsers })
}
