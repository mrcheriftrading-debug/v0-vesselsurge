# Maritime Data Cache-Busting & Realtime Implementation

## Overview

This implementation solves the 5-minute edge cache issue by moving from static rendering to a hybrid approach combining:
- **Force-dynamic API routes** for cache-busting (bypasses Vercel edge cache)
- **Supabase Realtime subscriptions** for live data updates
- **Fallback polling** (5-minute interval) as redundancy
- **On-demand revalidation** for ISR optimization

## Architecture Changes

### 1. Cache-Busting API Routes

#### `/api/maritime-data` (NEW)
- **Dynamic**: `export const dynamic = 'force-dynamic'` and `revalidate = 0`
- **Purpose**: Returns 25 latest maritime articles + hotspot stats from Supabase
- **Response**: JSON with articles, hotspots, and metadata
- **Headers**: Explicit `Cache-Control: no-cache, no-store, must-revalidate`
- **Usage**: Called by `useMaritimeData` hook

#### `/api/revalidate` (NEW)
- **Purpose**: On-demand revalidation endpoint
- **Auth**: Bearer token (REVALIDATE_SECRET env var)
- **Payload**: `{ path: '/', type: 'layout' | 'page' }`
- **Usage**: Trigger revalidatePath() on Supabase webhook events

### 2. Server-Side Helpers

#### `lib/maritime-data.ts` (NEW)
Exports three async functions:
- `getMaritimeArticles(limit, region?)` - Fetch articles from Supabase
- `getHotspotStats()` - Fetch hotspot statistics
- `getHotspotAlerts(limit)` - Fetch active alerts

These can be used in Server Components for initial data loading.

### 3. Client-Side Realtime Hook

#### `lib/use-maritime-data.ts` (NEW)
**`useMaritimeData()` React Hook**

Features:
- Initial fetch from `/api/maritime-data`
- Supabase Realtime subscriptions on `news_articles` and `hotspot_stats` tables
- Auto-refetch on any table change (INSERT, UPDATE, DELETE)
- Fallback polling every 5 minutes
- Auto-refresh when page becomes visible (tab switching)
- Returns: `{ articles, hotspots, loading, error, refresh(), lastUpdated }`

Usage in components:
```tsx
const { articles, hotspots, loading, error, refresh } = useMaritimeData()
```

### 4. Updated Components

#### `components/dashboard/news-feed.tsx` (UPDATED)
- Replaced simulated data with `useMaritimeData()` hook
- Now displays 25 latest articles from Supabase in realtime
- Supports breaking news badges
- Better category styling with 6 categories (security, industry, port, regulatory, etc.)
- Manual refresh button + auto-updates

### 5. SEO & Metadata

#### `lib/seo-metadata.ts` (NEW)
- `generateJSONLD()` - Website schema
- `generateNewsArticleJSONLD()` - Article schema
- `generateBreadcrumbJSONLD()` - Navigation breadcrumbs
- `getMetadataForRegion()` - Region-specific SEO

#### `app/sitemap.ts` (NEW)
- Dynamic sitemap with main pages + regional pages
- Priorities: main (1.0), map-dashboard (0.9), regions (0.7)
- Change frequency: hourly for live data, daily for static

#### `app/robots.txt` (NEW)
- Allow public access to `/`
- Disallow `/admin` and `/auth`
- Block GPTBot from crawling

## Data Flow

### Realtime Update Path
```
Supabase database change
    ↓
Realtime subscription triggers
    ↓
useMaritimeData refetches /api/maritime-data
    ↓
Component re-renders with new data
```

### Fallback Path (5-minute polling)
```
Poll interval triggers every 5 minutes
    ↓
Fetch /api/maritime-data
    ↓
Update state if different
```

### Manual Refresh
```
User clicks refresh button
    ↓
Call refresh() from hook
    ↓
Fetch /api/maritime-data
```

## Environment Variables Required

```bash
# Existing (should already be set)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# New (optional, recommended for security)
REVALIDATE_SECRET=vesselsurge-revalidate-2026
```

## Configuration

### Supabase Realtime Prerequisites

Ensure these tables exist with Row Level Security:
- `news_articles` (columns: id, title, summary, source, source_url, category, region, created_at, is_breaking)
- `hotspot_stats` (columns: id, hotspot, active_vessels, daily_transits, avg_wait_time, market_volume, risk_level, updated_at)
- `hotspot_alerts` (columns: id, hotspot, severity, message, source, is_active, created_at, updated_at)

### Enable Realtime

In Supabase dashboard:
1. Go to Database → Replication
2. Enable replication for `news_articles` and `hotspot_stats`
3. Ensure anon key has SELECT permissions

## Performance Benefits

| Metric | Before | After |
|--------|--------|-------|
| Cache Control | 5-minute edge cache | No cache (force-dynamic) |
| Update Latency | 5 minutes | <100ms (realtime) |
| Initial Load | Cached (good) | Dynamic (fresh) |
| Polling | None | 5-minute fallback |
| API Calls | Single request | ~2 subscriptions + polling |

## Deployment Notes

1. Add `REVALIDATE_SECRET` to Vercel environment variables
2. Ensure Supabase has realtime enabled (may require upgrade)
3. Test realtime with: `curl https://your-domain/api/maritime-data`
4. Monitor realtime subscriptions in Supabase dashboard

## Debugging

Enable debug logs by checking browser console and server logs for `[v0]` messages:
- `[v0] Fetching maritime data from API`
- `[v0] Articles update received: insert`
- `[v0] Polling maritime data (fallback)`
- `[v0] Page became visible, refreshing maritime data`
