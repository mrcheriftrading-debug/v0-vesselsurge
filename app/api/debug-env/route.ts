import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

/**
 * Debug API Route - Check Environment Variables and Database Connections
 * 
 * Usage:
 * - Local: http://localhost:3000/api/debug-env
 * - Production: https://your-domain.vercel.app/api/debug-env
 * 
 * IMPORTANT: Remove this route before going to production or protect it with authentication!
 */

export async function GET() {
  const results: Record<string, { status: "OK" | "FAIL" | "NOT_SET"; message?: string }> = {}

  // Check TAVILY_API_KEY
  if (process.env.TAVILY_API_KEY) {
    results.TAVILY_API_KEY = { 
      status: "OK", 
      message: `Set (${process.env.TAVILY_API_KEY.length} chars, starts with: ${process.env.TAVILY_API_KEY.substring(0, 4)}...)` 
    }
  } else {
    results.TAVILY_API_KEY = { status: "NOT_SET", message: "Environment variable not defined" }
  }

  // Check Upstash Redis URL (KV_REST_API_URL)
  const upstashUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  if (upstashUrl) {
    results.UPSTASH_REDIS_URL = { 
      status: "OK", 
      message: `Set (using ${process.env.KV_REST_API_URL ? "KV_REST_API_URL" : "UPSTASH_REDIS_REST_URL"})` 
    }
  } else {
    results.UPSTASH_REDIS_URL = { status: "NOT_SET", message: "Neither KV_REST_API_URL nor UPSTASH_REDIS_REST_URL defined" }
  }

  // Check Upstash Redis Token (KV_REST_API_TOKEN)
  const upstashToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (upstashToken) {
    results.UPSTASH_REDIS_TOKEN = { 
      status: "OK", 
      message: `Set (using ${process.env.KV_REST_API_TOKEN ? "KV_REST_API_TOKEN" : "UPSTASH_REDIS_REST_TOKEN"})` 
    }
  } else {
    results.UPSTASH_REDIS_TOKEN = { status: "NOT_SET", message: "Neither KV_REST_API_TOKEN nor UPSTASH_REDIS_REST_TOKEN defined" }
  }

  // Test Upstash Redis connection with ping
  if (upstashUrl && upstashToken) {
    try {
      const redis = new Redis({
        url: upstashUrl,
        token: upstashToken,
      })
      
      const pingResult = await redis.ping()
      
      if (pingResult === "PONG") {
        results.UPSTASH_CONNECTION = { status: "OK", message: "redis.ping() returned PONG" }
      } else {
        results.UPSTASH_CONNECTION = { status: "FAIL", message: `Unexpected ping response: ${pingResult}` }
      }
    } catch (error) {
      results.UPSTASH_CONNECTION = { 
        status: "FAIL", 
        message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}` 
      }
    }
  } else {
    results.UPSTASH_CONNECTION = { status: "FAIL", message: "Cannot test - missing URL or TOKEN" }
  }

  // Summary
  const allOk = Object.values(results).every(r => r.status === "OK")
  
  return NextResponse.json({
    success: allOk,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: results,
    instructions: {
      local: "curl http://localhost:3000/api/debug-env",
      production: "curl https://your-domain.vercel.app/api/debug-env",
      note: "Remove this route or add authentication before production deployment!"
    }
  }, { 
    status: allOk ? 200 : 500 
  })
}
