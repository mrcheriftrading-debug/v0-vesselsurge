'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[vesselsurge-global-error]', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main style={{
          minHeight: '100vh',
          background: '#020617',
          color: '#ffffff',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          padding: '80px 24px',
        }}>
          <section style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 28 }}>
            <div style={{
              width: 'fit-content',
              border: '1px solid rgba(103, 232, 249, 0.25)',
              background: 'rgba(103, 232, 249, 0.10)',
              color: '#cffafe',
              borderRadius: 999,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>
              VesselSurge recovery
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(36px, 8vw, 56px)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                We could not load VesselSurge.
              </h1>
              <p style={{ marginTop: 18, maxWidth: 620, color: '#cbd5e1', fontSize: 17, lineHeight: 1.65 }}>
                The live maritime data layer is protected. Try again, open the live map, or return to the sign-in page.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  border: 0,
                  borderRadius: 6,
                  background: '#67e8f9',
                  color: '#020617',
                  padding: '12px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <a href="/map-dashboard" style={{
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 6,
                color: '#ffffff',
                padding: '12px 18px',
                fontWeight: 700,
                textDecoration: 'none',
              }}>
                Open live map
              </a>
              <a href="/auth/login" style={{
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 6,
                color: '#ffffff',
                padding: '12px 18px',
                fontWeight: 700,
                textDecoration: 'none',
              }}>
                Sign in
              </a>
            </div>
            {error.digest ? (
              <p style={{ color: '#64748b', fontSize: 12 }}>Error reference: {error.digest}</p>
            ) : null}
          </section>
        </main>
      </body>
    </html>
  )
}
