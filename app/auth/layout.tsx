import type { Metadata } from 'next'
import { noIndexMetadata } from '@/lib/seo'

export const metadata: Metadata = noIndexMetadata('Account Access | VesselSurge')

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
