import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type ProSubscription = {
  status: string
  current_period_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

const PAID_STATUSES = new Set(['active'])

export async function getUserProSubscription(userId: string): Promise<ProSubscription | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('pro_subscriptions')
    .select('status, current_period_end, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[pro-subscription] lookup failed:', error)
    return null
  }

  return data
}

export function isActiveProSubscription(subscription: ProSubscription | null) {
  if (!subscription || !PAID_STATUSES.has(subscription.status)) return false
  if (!subscription.stripe_subscription_id || !subscription.current_period_end) return false

  const periodEnd = Date.parse(subscription.current_period_end)
  return Number.isFinite(periodEnd) && periodEnd > Date.now()
}

export async function userHasProAccess(userId: string) {
  return isActiveProSubscription(await getUserProSubscription(userId))
}
