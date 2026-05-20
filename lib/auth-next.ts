const AUTH_PATH_PREFIX = '/auth'

export function getSafeNextPath(nextPath: string | null | undefined, fallback = '/dashboard') {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return fallback
  }

  try {
    const parsed = new URL(nextPath, 'https://www.vesselsurge.com')
    if (parsed.origin !== 'https://www.vesselsurge.com') return fallback
    if (parsed.pathname.startsWith(AUTH_PATH_PREFIX)) return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
