import { NextRequest, NextResponse } from "next/server"

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
    const body: SearchRequest = await request.json()
    const { query, maxResults = 5 } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Query parameter is required" },
        { status: 400 }
      )
    }

    const tavilyKey = process.env.TAVILY_API_KEY
    if (!tavilyKey) {
      return NextResponse.json(
        {
          success: false,
          error: "TAVILY_API_KEY is not configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    // Call Tavily API for real-time web search
    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: query,
        max_results: Math.min(maxResults, 10),
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
      query,
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
