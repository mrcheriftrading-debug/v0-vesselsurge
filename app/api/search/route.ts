import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { assertSameOrigin } from "@/lib/security"

interface SearchRequest {
  query: string
  maxResults?: number
}

interface SearchResult {
  title: string
  link: string
  snippet: string
  source: string
  date?: string
}

interface SearchResponse {
  success: boolean
  query: string
  results: SearchResult[]
  count: number
  timestamp: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const originError = assertSameOrigin(request)
    if (originError) return originError as NextResponse

    const body: SearchRequest = await request.json()
    const { query, maxResults = 5 } = body
    const normalizedQuery = typeof query === "string" ? query.trim() : ""
    const safeMaxResults = Math.min(Math.max(Number(maxResults) || 5, 1), 10)

    if (!normalizedQuery) {
      return NextResponse.json(
        { success: false, error: "Query parameter is required" },
        { status: 400 }
      )
    }

    if (normalizedQuery.length > 160) {
      return NextResponse.json(
        { success: false, error: "Query is too long" },
        { status: 400 }
      )
    }

    const tavilyKey = process.env.TAVILY_API_KEY
    if (!tavilyKey) {
      return searchStoredMaritimeIntel(normalizedQuery, safeMaxResults)
    }

    // Call Tavily API for real-time web search
    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: normalizedQuery,
        max_results: safeMaxResults,
        include_answer: true,
        include_raw_content: false,
      }),
    })

    if (!tavilyResponse.ok) {
      console.error("[v0] Tavily API error:", tavilyResponse.statusText)
      return NextResponse.json(
        {
          success: false,
          error: `Tavily API error: ${tavilyResponse.statusText}`,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    const tavilyData = await tavilyResponse.json()

    // Transform Tavily results to our format
    const results: SearchResult[] = (tavilyData.results || []).map(
      (result: any) => ({
        title: result.title,
        link: result.url,
        snippet: result.content,
        source: new URL(result.url).hostname.replace("www.", ""),
        date: result.published_date || undefined,
      })
    )

    const response: SearchResponse = {
      success: true,
      query: normalizedQuery,
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("[v0] Search API error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

async function searchStoredMaritimeIntel(query: string, maxResults: number) {
  const supabase = await createClient()
  const normalizedQuery = query.trim()
  const terms = normalizedQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2)

  const { data, error } = await supabase
    .from("news_articles")
    .select("title, snippet, source, url, published_at, created_at, region")
    .order("published_at", { ascending: false })
    .limit(80)

  if (error) {
    console.error("[v0] Stored search fallback error:", error)
    return NextResponse.json(
      {
        success: false,
        query: normalizedQuery,
        results: [],
        count: 0,
        error: "Search is temporarily unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }

  const scored = (data || [])
    .map((article: any) => {
      const title = String(article.title || "")
      const snippet = cleanSearchText(String(article.snippet || ""))
      const haystack = `${title} ${snippet} ${article.source || ""} ${article.region || ""}`.toLowerCase()
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0)

      return { article, title, snippet, score }
    })
    .filter(({ score }) => score > 0 || terms.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(maxResults, 10))

  const results: SearchResult[] = scored.map(({ article, title, snippet }) => {
    const link = String(article.url || "https://www.vesselsurge.com/latest")
    let source = String(article.source || "")
    try {
      source ||= new URL(link).hostname.replace("www.", "")
    } catch {
      source ||= "VesselSurge"
    }

    return {
      title,
      link,
      snippet,
      source,
      date: article.published_at || article.created_at || undefined,
    }
  })

  return NextResponse.json({
    success: true,
    query: normalizedQuery,
    results,
    count: results.length,
    timestamp: new Date().toISOString(),
    source: "stored-maritime-intelligence",
  })
}

function cleanSearchText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
