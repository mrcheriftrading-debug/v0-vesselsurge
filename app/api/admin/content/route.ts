import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { assertSameOrigin } from "@/lib/security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "mrcheriftrading@gmail.com").toLowerCase()

type AdminResource = "article" | "alert" | "stat"
type AdminAction = "create" | "update" | "delete" | "toggle"

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { user }
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET() {
  const admin = await assertAdmin()
  if (admin.error) return admin.error

  const supabaseAdmin = createAdminClient()
  const [{ data: articles, error: articlesError }, { data: alerts, error: alertsError }, { data: stats, error: statsError }] =
    await Promise.all([
      supabaseAdmin.from("news_articles").select("*").order("updated_at", { ascending: false }),
      supabaseAdmin.from("hotspot_alerts").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("hotspot_stats").select("*"),
    ])

  const error = articlesError || alertsError || statsError
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    articles: articles || [],
    alerts: alerts || [],
    stats: stats || [],
  })
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request)
  if (originError) return originError

  const admin = await assertAdmin()
  if (admin.error) return admin.error

  const body = await request.json().catch(() => null)
  const resource = body?.resource as AdminResource | undefined
  const action = body?.action as AdminAction | undefined
  const payload = body?.payload

  if (!resource || !action) return badRequest("Missing admin resource or action")

  const supabaseAdmin = createAdminClient()

  if (resource === "article") {
    if (action === "create") {
      const { data, error } = await supabaseAdmin.from("news_articles").insert([payload]).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ item: data })
    }

    if (!payload?.id) return badRequest("Missing article id")

    if (action === "update") {
      const { data, error } = await supabaseAdmin
        .from("news_articles")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", payload.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ item: data })
    }

    if (action === "toggle") {
      const { data, error } = await supabaseAdmin
        .from("news_articles")
        .update({ is_active: !payload.is_active, updated_at: new Date().toISOString() })
        .eq("id", payload.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ item: data })
    }

    if (action === "delete") {
      const { error } = await supabaseAdmin.from("news_articles").delete().eq("id", payload.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
  }

  if (resource === "alert") {
    if (action === "create") {
      const { data, error } = await supabaseAdmin.from("hotspot_alerts").insert([payload]).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ item: data })
    }

    if (!payload?.id) return badRequest("Missing alert id")

    if (action === "update") {
      const { data, error } = await supabaseAdmin
        .from("hotspot_alerts")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", payload.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ item: data })
    }

    if (action === "toggle") {
      const { data, error } = await supabaseAdmin
        .from("hotspot_alerts")
        .update({ is_active: !payload.is_active, updated_at: new Date().toISOString() })
        .eq("id", payload.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ item: data })
    }

    if (action === "delete") {
      const { error } = await supabaseAdmin.from("hotspot_alerts").delete().eq("id", payload.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
  }

  if (resource === "stat") {
    if (!["create", "update"].includes(action)) return badRequest("Unsupported stat action")

    const { data, error } = await supabaseAdmin
      .from("hotspot_stats")
      .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: "hotspot" })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  return badRequest("Unsupported admin operation")
}
