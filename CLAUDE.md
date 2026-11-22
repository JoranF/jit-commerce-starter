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
- Dropshipping: module `src/modules/cj-dropshipping` (CJ API), alleen actief met `CJ_API_KEY`. Koppeling per variant via
  metadata `cj_vid`; status staat in `order.metadata.cj_*`. Tests: `pnpm run test:unit -- src/modules/cj-dropshipping`.
- Winkels (store factory): merk/teksten/beelden per winkel in `apps/storefront/src/stores/<id>.ts`,
  product en levertijden in `apps/backend/src/scripts/stores/definitions.ts`; kiezen met `STORE_ID`.
  Zie `apps/storefront/src/stores/README.md`. Termijnen in teksten via `{levertijd}` e.d., nooit hardcoded.
- Animaties in de storefront: Motion (`motion`, voorheen Framer Motion) via `@modules/common/components/motion`
  (`Reveal`, `Stagger`/`StaggerItem`, `m`). Spaarzaam, alleen transform/opacity; "minder beweging" wordt gerespecteerd.
- Beelden en video (productfoto's, sfeer, advertenties): fal.ai via de MCP-connector. Genereer pas na akkoord op de kosten.
- Keuzes per winkel (leverancier, prijzen, varianten, rekensom) staan in `docs/beslissingen/<id>.md`. Werk dat bij als je zo'n keuze wijzigt.
- Deploy: Dokploy met losse services per winkel (`<id>-db`, `<id>-redis`, `<id>-backend`, `<id>-storefront`), start-first updates + healthchecks; zie README. `docker-compose.yml` = lokaal/één host. Build-context = repo-root, `NEXT_PUBLIC_*` zijn build args.
- Checks: `pnpm --filter @dtc/backend build`, `pnpm --filter @dtc/storefront build`,
  `cd apps/storefront && npx tsc --noEmit` (0 fouten verwacht), `cd analytics && npm test`.

E-commerce skills staan in `.claude/skills/` (o.a. product-research-nl, frontend-design, webapp-testing,
medusa-development, ab-testing-ecommerce,
conversion-rate-optimization, checkout-flow-optimization, ecommerce-seo, tax-calculation, gdpr-ecommerce).
