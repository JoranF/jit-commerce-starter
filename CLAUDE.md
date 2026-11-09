# CLAUDE.md

Read [AGENTS.md](./AGENTS.md) — it holds Medusa's directory structure, commands, conventions,
and off-limits paths for this monorepo. Package manager: **pnpm** (workspace); `analytics/` is a
separate npm package.

## JIT-specifieke afspraken (bovenop AGENTS.md)

- Basis: `medusajs/dtc-starter`. Eigen toevoegingen staan in de README onder "Wat er al geregeld is".
- Event-namen en experiment-keys staan op twee plekken die gelijk moeten blijven:
  `apps/storefront/src/lib/analytics/constants.ts` en `analytics/src/config.ts`.
- `order_completed` wordt alleen server-side gestuurd (`apps/backend/src/subscribers/analytics-order-placed.ts`).
  De distinct_id komt uit `cart.metadata.ph_distinct_id` (gezet door `attachAnalyticsToCart`).
- Prijzen zijn inclusief btw (price preference op `currency_code=eur`, zie `setTaxInclusive`).
- `initial-data-seed.ts` moet idempotent blijven (draait als migration script).
- Teksten richting klant in het Nederlands; prijzen via `nl-NL`.
- Deploy: `docker-compose.yml` (Dokploy Compose), build-context = repo-root. `NEXT_PUBLIC_*` zijn build args.
- Checks: `pnpm --filter @dtc/backend build`, `pnpm --filter @dtc/storefront build`,
  `cd apps/storefront && npx tsc --noEmit` (0 fouten verwacht), `cd analytics && npm test`.

E-commerce skills staan in `.claude/skills/` (o.a. medusa-development, ab-testing-ecommerce,
conversion-rate-optimization, checkout-flow-optimization, ecommerce-seo, tax-calculation, gdpr-ecommerce).
