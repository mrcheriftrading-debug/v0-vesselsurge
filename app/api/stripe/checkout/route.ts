import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBaseUrl, getStripe, hasUsableStripeSecret, VESSELSURGE_PRO_PRICE } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

type MarketAssetCategory = 'stocks' | 'crypto' | 'fx'

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

export async function POST(request: Request) {
  const asset = await readAssetCategory(request)
  const selectedMarketPath = `/pro-market?asset=${asset}`
  const supabase = await createClient()
  const { data: { user } } = await withTimeout(
    supabase.auth.getUser(),
    1800,
    'Stripe checkout auth',
  ).catch(() => ({ data: { user: null } }))

  if (!user?.email) {
    return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(selectedMarketPath)}`, getBaseUrl()), 303)
  }

  try {
    if (!hasUsableStripeSecret() && VESSELSURGE_PRO_PRICE.paymentLink) {
      return NextResponse.redirect(VESSELSURGE_PRO_PRICE.paymentLink, 303)
    }

    const stripe = getStripe()
    const baseUrl = getBaseUrl()
    const successParams = new URLSearchParams({ asset, checkout: 'success' })
    const cancelParams = new URLSearchParams({ asset, checkout: 'cancelled' })
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: `${baseUrl}/pro-market?${successParams.toString()}`,
      cancel_url: `${baseUrl}/pro-market?${cancelParams.toString()}`,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        product: 'vesselsurge_market_impact_pro',
        selectedMarketCategory: asset,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          product: 'vesselsurge_market_impact_pro',
          selectedMarketCategory: asset,
        },
      },
      line_items: [
        {
          quantity: 1,
          price: VESSELSURGE_PRO_PRICE.id,
        },
      ],
    })

    if (!session.url) {
      return NextResponse.json({ success: false, error: 'Stripe session URL missing' }, { status: 500 })
    }

    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    console.error('[stripe-checkout] failed:', error)
    return NextResponse.json({ success: false, error: 'Checkout unavailable' }, { status: 500 })
  }
}

async function readAssetCategory(request: Request): Promise<MarketAssetCategory> {
  try {
    const formData = await request.formData()
    const value = formData.get('asset')
    if (value === 'crypto' || value === 'fx' || value === 'stocks') return value
  } catch {
    // Keep checkout resilient for direct POSTs without form data.
  }

  return 'stocks'
}
