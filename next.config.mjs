/** @type {import('next').NextConfig} */
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const projectRoot = dirname(fileURLToPath(import.meta.url))

// Build timestamp: 2026-03-30T12:00:00Z - Tavily-powered maritime stats
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com",
              "connect-src 'self' https://*.supabase.co https://*.vercel-insights.com https://vitals.vercel-insights.com https://api.stripe.com",
              "form-action 'self' https://checkout.stripe.com",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ]
  },
  // Permanent redirect for old routes
  async redirects() {
    return [
      {
        source: '/live-map',
        destination: '/map-dashboard',
        permanent: true,
      },
      {
        source: '/surveillance',
        destination: '/map-dashboard',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
// deploy:2026-04-04
// deployed: 2026-04-04-logo-seo
