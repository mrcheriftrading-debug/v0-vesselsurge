"use client"

export function MapSkeleton() {
  return (
    <div className="glass relative h-full min-h-[500px] overflow-hidden rounded-lg border border-border animate-pulse">
      {/* Header skeleton */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded bg-secondary"></div>
          <div className="h-4 w-32 rounded bg-secondary"></div>
          <div className="h-5 w-24 rounded bg-secondary"></div>
        </div>
        <div className="h-6 w-24 rounded bg-secondary"></div>
      </div>

      {/* Map area skeleton */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#050505] via-[#0a1628] to-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
          <span className="text-sm text-muted-foreground">Loading maritime data...</span>
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="absolute right-4 bottom-16 flex flex-col gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-8 rounded-md bg-secondary"></div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-md border border-border bg-card/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-secondary"></div>
          <div className="h-4 w-48 rounded bg-secondary"></div>
        </div>
        <div className="h-5 w-20 rounded bg-secondary"></div>
      </div>
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="glass flex h-full flex-col rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-secondary animate-pulse"></div>
          <div className="h-4 w-28 rounded bg-secondary animate-pulse"></div>
        </div>
        <div className="h-3 w-20 rounded bg-secondary animate-pulse"></div>
      </div>

      {/* Feed items skeleton */}
      <div className="flex-1 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b border-border px-4 py-3 animate-pulse">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-secondary"></div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-32 rounded bg-secondary"></div>
                    <div className="h-4 w-8 rounded bg-secondary"></div>
                  </div>
                  <div className="h-3 w-40 rounded bg-secondary"></div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-5 w-20 rounded bg-secondary"></div>
                <div className="h-3 w-24 rounded bg-secondary"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <div className="h-9 w-full rounded-md bg-secondary animate-pulse"></div>
      </div>
    </div>
  )
}

export function KPICardSkeleton() {
  return (
    <div className="glass rounded-lg border border-border p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-secondary"></div>
          <div className="h-3 w-32 rounded bg-secondary"></div>
        </div>
        <div className="h-3 w-12 rounded bg-secondary"></div>
      </div>
      <div className="mt-3">
        <div className="h-9 w-20 rounded bg-secondary"></div>
      </div>
      <div className="mt-4 h-16 rounded bg-secondary"></div>
    </div>
  )
}
