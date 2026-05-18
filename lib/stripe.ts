import 'server-only'

import Stripe from 'stripe'

export const VESSELSURGE_PRO_PRICE = {
  id: process.env.STRIPE_MARKET_PRO_PRICE_ID || 'price_1TYXq8DVgBfqtWgdlruCFPHh',
  paymentLink: process.env.STRIPE_MARKET_PRO_PAYMENT_LINK || 'https://buy.stripe.com/cNi14n7Cd0Ja31c47WfMA00',
  currency: 'sek',
  unitAmount: 19900,
  interval: 'day' as const,
  intervalCount: 14,
  productName: 'VesselSurge Market Impact Pro',
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!hasUsableStripeSecret()) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  return new Stripe(secretKey!, {
    apiVersion: '2026-04-22.dahlia',
    appInfo: {
      name: 'VesselSurge',
      version: '1.0.0',
    },
  })
}

export function hasUsableStripeSecret() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  return Boolean(secretKey && /^(sk|rk)_(test|live)_/.test(secretKey))
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL
    || process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`
    || 'http://localhost:3000'
}
