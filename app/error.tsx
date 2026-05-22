'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[vesselsurge-page-error]', error)
  }, [error])

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <section className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="inline-flex w-fit rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
          VesselSurge recovery
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            VesselSurge hit a loading error.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            The live systems are still running. Retry the page, open the live map, or sign in again if your session expired.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Try again
          </button>
          <Link
            href="/map-dashboard"
            className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-200/70 hover:bg-white/10"
          >
            Open live map
          </Link>
          <Link
            href="/auth/login"
            className="rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-200/70 hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>
        {error.digest ? (
          <p className="text-xs text-slate-500">Error reference: {error.digest}</p>
        ) : null}
      </section>
    </main>
  )
}
