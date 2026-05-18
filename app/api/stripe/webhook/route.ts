import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, VESSELSURGE_PRO_PRICE } from '@/lib/stripe'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null
}

async function upsertSubscription(subscription: Stripe.Subscription, userId: string | null) {
  if (!userId) return

  const supabase = createAdminClient()
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  const { error } = await supabase
    .from('pro_subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: subscriptionPeriodEnd(subscription),
      price_amount: VESSELSURGE_PRO_PRICE.unitAmount,
      currency: VESSELSURGE_PRO_PRICE.currency,
      interval: VESSELSURGE_PRO_PRICE.interval,
      interval_count: VESSELSURGE_PRO_PRICE.intervalCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' })

  if (error) {
    throw error
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ success: false, error: 'Webhook secret missing' }, { status: 500 })
  }

  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ success: false, error: 'Missing Stripe signature' }, { status: 400 })
  }

  const body = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('[stripe-webhook] signature failed:', error)
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await upsertSubscription(subscription, session.metadata?.userId || session.client_reference_id || null)
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      await upsertSubscription(subscription, subscription.metadata?.userId || null)
    }
  } catch (error) {
    console.error('[stripe-webhook] processing failed:', error)
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
