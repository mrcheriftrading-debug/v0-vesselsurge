create table if not exists public.pro_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  current_period_end timestamptz,
  price_amount integer not null default 19900,
  currency text not null default 'sek',
  interval text not null default 'day',
  interval_count integer not null default 14,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pro_subscriptions_user_id on public.pro_subscriptions(user_id);
create index if not exists idx_pro_subscriptions_status on public.pro_subscriptions(status);
create index if not exists idx_pro_subscriptions_customer on public.pro_subscriptions(stripe_customer_id);

alter table public.pro_subscriptions enable row level security;

drop policy if exists "pro_subscriptions_select_own" on public.pro_subscriptions;
create policy "pro_subscriptions_select_own" on public.pro_subscriptions
  for select using (auth.uid() = user_id);

-- Inserts and updates are handled server-side with the Supabase service role from Stripe webhooks.
