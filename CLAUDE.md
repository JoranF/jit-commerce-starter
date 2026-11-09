# JIT Commerce Starter — context voor Claude Code

Monorepo met losse apps (elk eigen `yarn.lock`, geen workspaces):
- `apps/backend` — Medusa v2.18 (yarn 4). Build: `yarn build` → `.medusa/server`. Scripts via `npx medusa exec ./src/scripts/<x>.ts`.
- `apps/storefront` — Next.js 15 Medusa-starter (yarn 4). Upstream heeft TS-fouten; `ignoreBuildErrors` staat aan, controleer eigen bestanden met `npx tsc --noEmit`.
- `analytics/` — PostHog-automatisering (npm, tsx). `npm test` draait unit + e2e tegen een nep-PostHog.

Afspraken:
- Event-namen en experiment-keys staan op twee plekken die gelijk moeten blijven:
  `apps/storefront/src/lib/analytics/constants.ts` en `analytics/src/config.ts`.
- `order_completed` wordt alleen server-side gestuurd (`apps/backend/src/subscribers/analytics-order-placed.ts`).
  De distinct_id komt uit `cart.metadata.ph_distinct_id` (gezet door `attachAnalyticsToCart`).
- Prijzen zijn inclusief btw (price preference op `currency_code=eur`).
- Teksten richting klant in het Nederlands.
- Deploy: `docker-compose.yml` (Dokploy Compose). `NEXT_PUBLIC_*` zijn build args.

Relevante skills staan in `.claude/skills/` (o.a. medusa-development, ab-testing-ecommerce,
conversion-rate-optimization, checkout-flow-optimization, ecommerce-seo, tax-calculation, gdpr-ecommerce).
