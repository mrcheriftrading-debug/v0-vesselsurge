/** @type {import('next').NextConfig} */
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
