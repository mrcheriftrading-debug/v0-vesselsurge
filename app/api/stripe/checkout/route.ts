import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBaseUrl, getStripe, VESSELSURGE_PRO_PRICE } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.redirect(new URL('/auth/login?next=/pro-market', getBaseUrl()), 303)
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY && VESSELSURGE_PRO_PRICE.paymentLink) {
      return NextResponse.redirect(VESSELSURGE_PRO_PRICE.paymentLink, 303)
    }

    const stripe = getStripe()
    const baseUrl = getBaseUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: `${baseUrl}/pro-market?checkout=success`,
      cancel_url: `${baseUrl}/pro-market?checkout=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        product: 'vesselsurge_market_impact_pro',
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          product: 'vesselsurge_market_impact_pro',
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
