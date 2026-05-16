import { NextResponse } from "next/server"

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return null

  try {
    if (new URL(origin).host === new URL(request.url).host) return null
  } catch {
    // Fall through to a forbidden response.
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
