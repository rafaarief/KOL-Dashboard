# KOL Finder

Internal TikTok KOL sourcing dashboard for the BoothyCall team. Turns a plain-language
brief ("photobooth blok m") into a ranked shortlist of TikTok creators, sourced from
publicly accessible TikTok pages — no official TikTok API, no login walls, no CAPTCHA
bypass.

See the original PRD/TDD for full product and design rationale. This README covers how
to actually run what's in this repo.

## Architecture

```
apps/web     Next.js dashboard (search UI, results, shortlists, CSV export, auth)
apps/worker  Node.js + Playwright scraping worker (BullMQ job consumer)
packages/
  schemas    Zod schemas shared by web + worker (query, video, creator, ranking, job)
  shared     Number/date normalizers, niche taxonomy, error codes, dedup helpers
  ranking    Deterministic creator ranking engine (never delegated to an LLM)
  database   Drizzle ORM schema + client (Postgres)
  ai         Query interpretation + niche classification (Claude, with deterministic
             fallback when no API key is configured)
```

The web app accepts a search, parses it (via `@kol-finder/ai`), writes a `searches` row,
and enqueues a BullMQ job. The worker consumes that job, drives headless Chromium against
TikTok's public search and profile pages, extracts data from TikTok's own embedded
JSON (`__UNIVERSAL_DATA_FOR_REHYDRATION__` / `SIGI_STATE` — the same payload TikTok
already ships in the page response, not a bypass of anything), scores creators
deterministically, and writes results back to Postgres. The dashboard polls for progress
and renders results as they land.

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- Docker (for local Postgres + Redis), or your own instances

## Setup

```bash
cp .env.example .env.local   # then edit values
docker compose up -d          # starts Postgres + Redis locally
pnpm install
pnpm --filter @kol-finder/database generate   # generate SQL migrations from schema.ts
pnpm --filter @kol-finder/database migrate    # apply them
npx playwright install --with-deps chromium   # once, for the worker's browser
```

Required env vars are documented in `.env.example`. Notable ones:

- `AI_API_KEY` — Anthropic API key. If empty, query interpretation and niche
  classification fall back to deterministic keyword-based logic (still functional,
  just less flexible about phrasing).
- `APP_PASSWORD` / `AUTH_ALLOWED_EMAILS` — the MVP's internal auth: a shared password
  plus an email allowlist. Swap for Supabase Auth (as named in the PRD) before any
  external rollout.
- `WORKER_SHARED_SECRET` — reserved for signing worker-facing requests if you later add
  an HTTP control surface to the worker; the current design only talks to it through the
  Redis-backed BullMQ queue, so nothing reads this yet.

## Running locally

```bash
pnpm dev:web      # Next.js dashboard on http://localhost:3000
pnpm dev:worker   # Playwright scraping worker (needs REDIS_URL + DATABASE_URL)
```

Log in with an email from `AUTH_ALLOWED_EMAILS` and `APP_PASSWORD`, then search e.g.
"photobooth blok m" from `/search`.

## Testing

```bash
pnpm test         # unit + fixture-based extractor tests across all packages/apps
```

`apps/worker/tests/fixtures/tiktok/*.json` contains sanitized, synthetic rehydration
payloads (not real scraped data) used to test the parsers without a live browser or
network access — see PRD section 26.2.

## What's deliberately not here yet

- The full `directives/` + `execution/` three-layer agent scaffolding from the PRD
  (section 17) — that's a workflow for iterating on this codebase with an AI coding
  agent, not something the running product needs. The equivalent logic lives directly
  in `apps/worker/src/jobs/searchJob.ts` and its collaborators.
- Supabase Auth / RLS — the MVP auth is a shared password + allowlist (see above).
- Google Sheets export, DM automation, and everything else listed under "Non-Goals" in
  the PRD (section 5) — intentionally out of scope.
- TikTok's markup and anti-bot behavior change often and can't be verified from this
  environment (no live network access while building this). `apps/worker/src/extractors/tiktok/`
  is deliberately isolated (`selectors.ts`, `rehydrationData.ts`, `accessGate.ts`) so
  you can patch it quickly once you run it against the real site — see PRD section 10.6.
  On CAPTCHA/login/access-denied it stops the job rather than trying to work around it.

## Safety

The scraper only reads what TikTok's public pages already serve. It does not log in,
solve CAPTCHAs, or access private accounts — see `accessGate.ts`, which detects these
conditions and stops the job (`CAPTCHA_REQUIRED` / `LOGIN_REQUIRED` / `ACCESS_DENIED`)
rather than working around them, per PRD section 11.
