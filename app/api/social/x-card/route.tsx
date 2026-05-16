import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const HOTSPOT_LABELS: Record<string, string> = {
  hormuz: 'Strait of Hormuz',
  bab: 'Bab el-Mandeb',
  malacca: 'Strait of Malacca',
  suez: 'Suez Canal',
}

const RISK_COLORS: Record<string, { bg: string; fg: string; accent: string }> = {
  critical: { bg: '#331012', fg: '#fee2e2', accent: '#ef4444' },
  high: { bg: '#33210b', fg: '#ffedd5', accent: '#f97316' },
  medium: { bg: '#1f2937', fg: '#e0f2fe', accent: '#38bdf8' },
  low: { bg: '#10261b', fg: '#dcfce7', accent: '#22c55e' },
}

function clean(value: string | null, fallback: string) {
  return (value || fallback).replace(/\s+/g, ' ').trim().slice(0, 180)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const region = clean(url.searchParams.get('region'), 'global')
  const risk = clean(url.searchParams.get('risk'), 'medium').toLowerCase()
  const source = clean(url.searchParams.get('source'), 'verified source')
  const title = clean(url.searchParams.get('title'), 'New maritime intelligence update')
  const hotspot = HOTSPOT_LABELS[region] || region.toUpperCase()
  const palette = RISK_COLORS[risk] || RISK_COLORS.medium
  const timestamp = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Stockholm',
  }).format(new Date())

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '675px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#071014',
          color: '#f8fafc',
          fontFamily: 'Arial, Helvetica, sans-serif',
          padding: '58px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(20,184,166,.24), transparent 42%), radial-gradient(circle at 80% 15%, rgba(239,68,68,.22), transparent 28%), linear-gradient(180deg, rgba(255,255,255,.06), transparent)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: '#f8fafc',
                color: '#071014',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 31,
                fontWeight: 900,
              }}
            >
              VS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 30, fontWeight: 800 }}>VesselSurge</div>
              <div style={{ fontSize: 20, color: '#a7f3d0' }}>Live Maritime Intelligence</div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: palette.bg,
              color: palette.fg,
              border: `2px solid ${palette.accent}`,
              borderRadius: 999,
              padding: '14px 22px',
              fontSize: 24,
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            {risk}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: 99, background: palette.accent }} />
            <div style={{ fontSize: 34, color: '#bae6fd', fontWeight: 800 }}>{hotspot}</div>
          </div>
          <div style={{ fontSize: 62, lineHeight: 1.05, fontWeight: 900, letterSpacing: 0 }}>{title}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 24, color: '#cbd5e1' }}>Source: {source}</div>
            <div style={{ fontSize: 22, color: '#94a3b8' }}>Updated {timestamp} CET</div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#f8fafc' }}>vesselsurge.com/map-dashboard</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 675,
    },
  )
}
