## CA Traffics

This repository contains a Next.js 15 front-end that visualizes California highway conditions with MapLibre along with a lightweight Cloudflare Worker that serves traffic data in a friendly shape for the UI. The goal is to provide a faster, easier-to-use alternative to [QuickMap](https://quickmap.dot.ca.gov).

---

## Prerequisites

- Node.js 20+
- pnpm or npm (examples below use npm)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Optional: [Vercel CLI](https://vercel.com/docs/cli) for local previews

Install dependencies:

```bash
npm install
```

Copy the sample environment file and adjust values as needed:

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_API_BASE` should point to your Worker endpoint. When developing locally, keep the default `http://localhost:8787`.

---

## Local Development

1. Start the Cloudflare Worker API in one terminal:

   ```bash
   npm run worker:dev
   ```

   Wrangler hosts the Worker at `http://localhost:8787`.

2. Start the Next.js app in another terminal:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to interact with the map. The UI polls `/v1/traffic/incidents`, `/v1/traffic/roads`, and `/v1/meta/sources` from the Worker. Without real Caltrans feeds configured, the Worker returns demo data so the interface stays functional.

---

## Deployment

### Cloudflare Worker (Traffic API)

1. Configure environment variables in the Cloudflare dashboard (or via `wrangler secret/vars`), e.g.:
   - `INCIDENTS_FEED_URL`
   - `ROADS_FEED_URL`
   - `META_FEED_URL`
   - `CORS_ALLOW_ORIGIN` (set to your Vercel domain)
2. Deploy the Worker:

   ```bash
   npm run worker:deploy
   ```

   The published URL (e.g. `https://ca-traffics-api.your-account.workers.dev`) becomes the base for `NEXT_PUBLIC_API_BASE`.

### Vercel (Web App)

1. Connect this repository to Vercel and set build command to `npm run build`.
2. Add the following environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_API_BASE` → `https://<worker-hostname>`
   - Optional map styling variables such as `NEXT_PUBLIC_MAP_STYLE` and `NEXT_PUBLIC_MAPTILER_KEY`.
3. Trigger a deployment (push to the main branch or run `vercel --prod`).

Once both surfaces are live, the Vercel-hosted UI will consume data from the Cloudflare Worker, and the Worker can be updated independently as new data integrations are added.
