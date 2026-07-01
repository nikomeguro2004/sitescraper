# RoastMySite

Internal website audit and SaaS-roast tool. Enter a URL, get an investor-grade
audit of design, branding, trust, and conversion performance — powered by
Playwright scraping, Cheerio extraction, and an LLM via OpenRouter.

Single workflow, no marketing pages: enter URL → analyze → view report → export PDF.

## Setup

```bash
npm install
cp .env.example .env.local   # add OPENROUTER_API_KEY
npx playwright install chromium   # first time only, for local scraping
npm run dev
```

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) ·
Framer Motion · Zustand · React Hook Form + Zod · Playwright/Cheerio ·
OpenRouter · Recharts · @react-pdf/renderer

## Deployment (Vercel)

- Set `OPENROUTER_API_KEY` in Vercel project env vars.
- The scraper auto-detects Vercel/Lambda (`VERCEL` env var) and switches from
  the local `playwright` browser to `@sparticuz/chromium` + `playwright-core`,
  which is what actually runs on serverless functions.
- `/api/analyze` runs on the Node.js runtime with `maxDuration = 60`.

## Architecture

- `lib/scraper/` — browser launch (env-aware), page capture, Cheerio extraction
- `lib/ai/` — OpenRouter client, prompt builder, Zod schema for structured output
- `lib/store/` — Zustand stores (report history in localStorage, ephemeral analysis state)
- `lib/types/audit.ts` — the report schema shared by scraper, AI, and UI
- `app/api/analyze/route.ts` — SSE endpoint streaming pipeline stages + final report
- `components/analyze/` — URL form, mode selector, loading screen, error view
- `components/report/` — score radar/cards, audit sections, PDF export
- `components/layout/` — top nav, theme toggle, report history panel
