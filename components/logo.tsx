import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  /** Width of the logo in pixels */
  width?: number
  /** Height of the logo in pixels */
  height?: number
  /** Whether to prioritize loading (use for above-the-fold) */
  priority?: boolean
  /** Whether to link to home page */
  asLink?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * VesselSurge Logo Component
 * Optimized with Next.js Image for performance and lazy loading
 */
export function Logo({
  width = 180,
  height = 60,
  priority = false,
  asLink = true,
  className = '',
}: LogoProps) {
  const logoImage = (
    <Image
      src="/logo.png"
      alt="VesselSurge - Real-time Vessel Tracking & Maritime Data Platform"
      width={width}
      height={height}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      className={`object-contain ${className}`}
      style={{ width: 'auto', height: 'auto' }}
    />
  )

  if (asLink) {
    return (
      <Link 
        href="/" 
        className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        aria-label="VesselSurge Home"
      >
        {logoImage}
      </Link>
    )
  }

  return logoImage
}

/**
 * Large Logo for hero sections and social sharing
 */
export function LogoLarge({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="VesselSurge - Real-time Vessel Tracking & Maritime Data Platform"
      width={400}
      height={200}
      priority={true}
      loading="eager"
      className={`object-contain ${className}`}
      style={{ width: 'auto', height: 'auto' }}
    />
  )
}

/**
 * Logo icon only (smaller variant)
 */
export function LogoIcon({ 
  size = 40, 
  className = '' 
}: { 
  size?: number
  className?: string 
}) {
  return (
    <Image
      src="/logo.png"
      alt="VesselSurge"
      width={size}
      height={size}
      loading="lazy"
      className={`object-contain ${className}`}
      style={{ width: 'auto', height: 'auto' }}
    />
  )
}
