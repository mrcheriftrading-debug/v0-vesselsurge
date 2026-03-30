/** @type {import('next').NextConfig} */
// Build timestamp: 2026-03-30T12:00:00Z - Tavily-powered maritime stats
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
