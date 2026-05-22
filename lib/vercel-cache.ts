export function publicVercelCacheHeaders(cacheControl: string, tags: string[] = []) {
  const headers: Record<string, string> = {
    'Cache-Control': cacheControl,
  }

  if (!/\b(private|no-store|no-cache)\b/i.test(cacheControl)) {
    headers['CDN-Cache-Control'] = cacheControl
    headers['Vercel-CDN-Cache-Control'] = cacheControl
    if (tags.length > 0) headers['Vercel-Cache-Tag'] = tags.slice(0, 128).join(',')
  }

  return headers
}
