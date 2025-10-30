# Repository Guidelines

## Project Structure & Module Organization
This Next.js 15 app targets Vercel for the UI while a dedicated Cloudflare Worker (`worker/src/index.ts`) serves traffic data. Routes and server components live in `app/`, shared UI in `components/`, and utilities or data helpers in `lib/`. Static assets (icons, sprites, mock tiles) belong in `public/`. Worker configuration lives under `worker/wrangler.jsonc`; legacy OpenNext settings remain in `open-next.config.ts` if you need a full Worker build.

## Build, Test, and Development Commands
- `npm run dev` – local Turbopack dev server with hot reload.
- `npm run build` – production bundle for Vercel or static export.
- `npm run start` – serve the build locally for smoke tests.
- `npm run lint` – eslint with `eslint.config.mjs`; fix before commit.
- `npm run worker:dev` – run the Cloudflare Worker API at `http://localhost:8787`.
- `npm run worker:deploy` – publish the Worker using `worker/wrangler.jsonc`.
- `npm run deploy` / `npm run preview` – legacy OpenNext flow; use only if you need the entire app on Workers.
- `npm run cf-typegen` – regenerate Worker env typings if `wrangler.jsonc` changes.

## Coding Style & Naming Conventions
Use TypeScript with ES2023 features and functional React components. Match the existing 2-space indentation, single quotes in TS/JS, and Tailwind utility-first styling. Components stay PascalCase (`TrafficLayer.tsx`), hooks and helpers camelCase, environment constants SCREAMING_CASE. Let eslint decide formatting disputes and keep lines comfortably under 100 columns.

## Testing Guidelines
Add automated coverage with each feature even though no harness is bundled yet. Favor React integration tests (`@testing-library/react`) or API contract tests via Vitest/Jest, stored alongside code as `<name>.test.ts(x)`. Validate map rendering paths, SWR fetching logic, and Cloudflare runtime branches, and document any manual test steps in pull requests.

## Commit & Pull Request Guidelines
Adopt Conventional Commit prefixes (`feat`, `fix`, `chore`, `refactor`, `docs`, etc.) with concise imperatives, matching the existing history. Keep commits scoped to a single concern and reference issues in the body when relevant. Pull requests should describe the change, call out environment or migration updates, attach UI screenshots when visuals shift, and request review only after local checks pass.

## Cloudflare & Environment Tips
Keep `wrangler.jsonc` and `cloudflare-env.d.ts` in sync with dashboard secrets or KV bindings; mismatches block deployment. Authenticate with `npx wrangler login` before running deploy or preview targets. Never commit real keys—set them via `wrangler secret put` and list required names in documentation or PR notes.
