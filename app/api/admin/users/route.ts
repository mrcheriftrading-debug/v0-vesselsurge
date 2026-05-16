import pg from "pg"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "mrcheriftrading@gmail.com").toLowerCase()

type AuthUserRow = {
  id: string
  email: string | null
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  created_at: string
  raw_user_meta_data: Record<string, unknown> | null
  raw_app_meta_data: Record<string, unknown> | null
}

async function assertAdmin(request: Request) {
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.replace("Bearer ", "")

  if (bearerToken && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
    const {
      data: { user },
    } = await supabase.auth.getUser(bearerToken)

    if (user?.email?.toLowerCase() === ADMIN_EMAIL) {
      return true
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.email?.toLowerCase() === ADMIN_EMAIL
}

function getDatabaseUrl() {
  return process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL
}

function metadataValue(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key]
  return typeof value === "string" && value.trim() ? value : null
}

function mapAuthUser(user: AuthUserRow) {
  const userMetadata = user.raw_user_meta_data || {}
  const appMetadata = user.raw_app_meta_data || {}

  return {
    id: user.id,
    email: user.email,
    companyName:
      metadataValue(userMetadata, "company_name") ||
      metadataValue(userMetadata, "company") ||
      "Not specified",
    serviceType:
      metadataValue(userMetadata, "service_type") ||
      metadataValue(userMetadata, "role") ||
      metadataValue(appMetadata, "role") ||
      "Not specified",
    createdAt: user.created_at,
    lastSignIn: user.last_sign_in_at,
    emailConfirmed: Boolean(user.email_confirmed_at),
    source: "auth.users",
  }
}

async function listUsersFromDatabase() {
  const connectionString = getDatabaseUrl()
  if (!connectionString) {
    throw new Error("Missing Postgres connection string")
  }

  const { Client } = pg
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    const { rows } = await client.query<AuthUserRow>(`
      select
        id,
        email,
        email_confirmed_at,
        last_sign_in_at,
        created_at,
        raw_user_meta_data,
        raw_app_meta_data
      from auth.users
      order by created_at desc
      limit 250
    `)

    return rows.map(mapAuthUser)
  } finally {
    await client.end()
  }
}

export async function GET(request: Request) {
  if (!(await assertAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const users = await listUsersFromDatabase()
    return NextResponse.json({ users, source: "auth.users" })
  } catch (databaseError) {
    console.error("[admin/users] direct database list failed:", databaseError)
  }

  const supabaseAdmin = createAdminClient()

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id,email,company_name,role,created_at")
      .order("created_at", { ascending: false })

    if (profilesError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      users: (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        companyName: profile.company_name || "Not specified",
        serviceType: profile.role || "Not specified",
        createdAt: profile.created_at,
        lastSignIn: null,
        emailConfirmed: true,
        source: "profiles",
      })),
      warning: "Loaded users from profiles because Supabase Auth admin listing was unavailable.",
    })
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
