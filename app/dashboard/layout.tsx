import type { Metadata } from 'next'
import { noIndexMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = noIndexMetadata('Dashboard | VesselSurge')

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
