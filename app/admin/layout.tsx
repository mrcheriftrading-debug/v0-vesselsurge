// Force admin to be server-rendered at request time (not prerendered at build)
// This prevents build failure when SUPABASE env vars are not present
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
