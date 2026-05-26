# VesselSurge External Scheduler

Vercel Cron is no longer the primary scheduler for VesselSurge. The previous high-frequency Vercel jobs ran `/api/cron/watch` every 2 minutes and `/api/cron/market-pro` every 5 minutes, which made Vercel function time the largest controllable runtime cost.

## Primary Path

Use one external scheduler and point it at the VesselSurge cron endpoints:

- `news`: `/api/cron/update?scope=news` every 15 minutes
- `hourly`: `/api/cron/update?scope=news` plus `/api/cron/market-pro` every hour
- `full`: `/api/cron/update` every 3 hours; this route already refreshes trusted news, AIS context, marine conditions, signals, and dashboard cache

Required secrets:

- `VESSELSURGE_CRON_BASE_URL`: the active app base URL, without a trailing slash
- `CRON_SECRET`: the same bearer secret used by the production cron endpoints

## GitHub Actions Option

The workflow at `.github/workflows/vesselsurge-free-scheduler.yml` runs on GitHub-hosted runners and calls `scripts/external-cron-runner.mjs` without installing app dependencies.

Add repository secrets:

- `VESSELSURGE_CRON_BASE_URL`
- `CRON_SECRET`

Then run the workflow manually once with `mode=news` and confirm the endpoint returns success.

## Cloudflare Workers Option

The worker in `workers/vesselsurge-scheduler/worker.js` can run the same schedule outside Vercel. Copy `wrangler.toml.example` to `wrangler.toml`, set the base URL, and add the secret:

```bash
wrangler secret put CRON_SECRET
wrangler deploy
```

The worker exposes `/health` so the ops agent can confirm it is configured.

## Vercel Cost Guard

`vercel.json` intentionally has no scheduled crons. `npm run ops:hotspots` and `npm run ops:agents` now fail if an aggressive Vercel cron such as every 2 or 5 minutes is reintroduced.

## Emergency Read-Only Mirror

If the primary deployment is unavailable, run:

```bash
npm run emergency:pages
```

This generates `emergency-pages/` directly from the Supabase `maritime_dashboard_cache` row. The GitHub Actions workflow `.github/workflows/vesselsurge-emergency-pages.yml` publishes the same read-only cache to GitHub Pages every 30 minutes without using Vercel.
