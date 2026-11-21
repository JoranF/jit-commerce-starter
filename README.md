# JIT Commerce Starter

Volledig open-source webshop-stack, klaar voor Nederland, met ingebouwde analytics en A/B-testen.
Gebouwd op de officiële [Medusa DTC Starter](https://github.com/medusajs/dtc-starter) (pnpm + Turborepo monorepo).

| Onderdeel | Techniek | Map |
|---|---|---|
| Winkel-backend + admin | [Medusa 2.22](https://medusajs.com) (Node/TypeScript, PostgreSQL) | `apps/backend` |
| Storefront | Next.js 16 (Medusa DTC-storefront, NL-vertaald waar het telt) | `apps/storefront` |
| Betalingen | Mollie: iDEAL, Bancontact, creditcard, PayPal, Apple Pay | plugin in backend |
| Analytics + A/B-tests | PostHog (EU-cloud of zelf gehost) | storefront + backend |
| Automatisering | Dashboards, weekrapport, A/B-evaluatie, AI-testideeën | `analytics/` |
| Deploy | Dokploy: losse services (db, redis, backend, storefront) | README → Live zetten |
| Claude Code skills | 24 e-commerce skills (CRO, A/B, SEO, btw, Medusa…) | `.claude/skills/` |

## Wat er al geregeld is

**Uit de DTC-starter**
- Zoeken (instantsearch), klantaccounts, orderhistorie, kortingscodes, order-overdracht
- SEO: `sitemap.xml`, `robots.txt`, JSON-LD, `llms.txt`, productpagina's als Markdown voor AI-crawlers
- **UCP** (Universal Commerce Protocol): AI-assistenten kunnen je catalogus doorzoeken en afrekenen (`/.well-known/ucp`, `/ucp/mcp`)
- Winkelwagen-herstellinks en "koop nu"-links (`/buy/...`)
- Winkelbeleid per regio in metadata (retourtermijn, levertijd) → verzend-/retourpagina's en structured data

**Winkel (NL-klaar)**
- Regio *Benelux & Duitsland* (NL/BE/DE), EUR, **prijzen incl. btw** (21% / 21% / 19%)
- Verzending: Standaard €4,95 · Express €7,95 (aan te passen in de admin)
- Mollie-checkout met redirect + webhook (bestelling wordt ook afgerond als de klant het tabblad sluit)
- Prijzen in NL-notatie (`€ 24,95`), winkelbeleid: 14 dagen herroepingsrecht, 1-2 dagen levertijd
- Eerste `db:migrate` seedt de winkel + demo-producten (`src/migration-scripts/initial-data-seed.ts`, idempotent; `SEED_DEMO=false` = zonder demo-producten)
- Container-start: vaste publishable key en admin-account (`src/scripts/bootstrap.ts`)

**Winkels (store factory)**
- Eén codebase, meerdere winkels: merk, kleuren, fonts, teksten en beelden per winkel in `apps/storefront/src/stores/<id>.ts`
- Winkel met één product (`catalog: false`): homepage = landingspagina met "de lamp gaat aan"-moment, eigen productpagina, minimale navigatie
- Backend-setup per winkel (`STORE_ID`): product met foto's, levertijden, verzendopties (idempotent, draait bij elke start)
- Eerste winkel: **Lichtval** (wandlamp met waterlicht). Uitleg: [`apps/storefront/src/stores/README.md`](apps/storefront/src/stores/README.md)

**Dropshipping (CJ Dropshipping)**
- Verkopen zonder voorraad: betaalde bestellingen met CJ-producten (variant metadata `cj_vid`) gaan automatisch naar CJ
- Track & trace komt terug (job elke 30 min) en de bestelling staat in Medusa op verzonden; blok met status + knoppen op de bestelpagina in de admin
- Aan met `CJ_API_KEY`; uitleg in [`apps/backend/src/modules/cj-dropshipping/README.md`](apps/backend/src/modules/cj-dropshipping/README.md)

**Meten**
- Browser-events via eigen domein (`/ingest`) → minder last van adblockers
- E-commerce funnel: `product_viewed` → `product_added_to_cart` → `cart_viewed` → `checkout_started` → `payment_redirected` → **`order_completed`**
- `order_completed` komt **server-side** uit Medusa (subscriber), met omzet, btw, producten, land en de A/B-varianten. Daardoor klopt de omzet altijd, ook bij adblockers.
- Eén bezoekers-ID (`jit_vid` cookie, gezet in middleware) voor browser én server → experimenten worden correct toegeschreven
- Cookiebanner: zonder toestemming meet PostHog alleen **cookieless** (anoniem)

**A/B-testen**
- Voorbeeldexperiment `pdp-cta-text` op de winkelwagen-knop (`In winkelwagen` vs. `Bestel nu – morgen in huis`)
- Client: `useExperiment("flag")` · Server (zonder flikkering): `getExperimentVariant("flag")`

**Automatisering (`analytics/`)**
| Commando | Wat | Wanneer (GitHub Actions) |
|---|---|---|
| `npm run setup` | Maakt dashboard (funnel, omzet, AOV, conversie, landen) + experimenten in PostHog | eenmalig / na wijzigingen |
| `npm run report` | Weekrapport: KPI's vs. vorige week, grootste funnel-lek, top-producten, A/B-status, optioneel 3 testideeën van Claude | elke maandag |
| `npm run experiments` | Bayesiaanse evaluatie van lopende tests; met `AUTO_SHIP_WINNERS=true` wordt een winnaar automatisch op 100% gezet | dagelijks |

Rapporten gaan naar `analytics/reports/`, de GitHub job summary en optioneel Discord/Slack (`REPORT_WEBHOOK_URL`).

---

## Lokaal draaien

Vereist: **Node 22.23+**, **pnpm** (`corepack enable`) en **Docker Desktop** (voor Postgres/Redis).
Werkt op Windows, macOS en Linux.

```bash
git clone https://github.com/JoranF/jit-commerce-starter.git
cd jit-commerce-starter
corepack enable
pnpm install
pnpm setup:local     # env-bestanden, Postgres+Redis (Docker), migraties + NL-winkel, admin-account
pnpm dev             # backend + storefront samen
```

| | URL | Login |
|---|---|---|
| Winkel | http://localhost:8000 | – |
| Admin | http://localhost:9000/app | `admin@webshop.local` / `supersecret` |

Afrekenen lokaal: kies **Testbetaling (handmatig)**. Geen Docker? Zet je eigen `DATABASE_URL` in
`apps/backend/.env` (wordt bij de eerste run aangemaakt) en gebruik `pnpm setup:local --no-docker`.
`setup:local` is idempotent: opnieuw draaien kan altijd.

## Live zetten op Dokploy (losse services)

Op Dokploy draait elke winkel als **vier losse services** in één project. Zo kan de backend
updaten terwijl de winkel online blijft, en bouwt een push alleen wat veranderd is.

| Service | Type | Bron | Domein |
|---|---|---|---|
| `<id>-db` | Postgres 16 (Dokploy database) | — | geen (intern) |
| `<id>-redis` | Redis 7 (Dokploy database) | — | geen (intern) |
| `<id>-backend` | Application, Dockerfile `apps/backend/Dockerfile`, context `.` | watch: `apps/backend/**` | `api…` → poort **9000** |
| `<id>-storefront` | Application, Dockerfile `apps/storefront/Dockerfile`, context `.` | watch: `apps/storefront/**` | winkel → poort **8000** |

Per application (Advanced → Swarm):
- **Health check**: backend `wget -qO- http://127.0.0.1:9000/health`, storefront `…:8000/api/health`
- **Update config**: `Order: start-first`, `FailureAction: rollback` → de nieuwe versie start naast de
  oude en neemt pas over als hij gezond is; faalt hij, dan blijft de oude draaien.
- Backend: volume `/app/static` (geüploade productfoto's).

Environment backend: zie `docker-compose.yml` (sectie `backend.environment`), met
`DATABASE_URL=postgres://medusa:<pw>@<db-appName>:5432/medusa?sslmode=disable` (Medusa zet anders SSL aan)
en `REDIS_URL=redis://default:<pw>@<redis-appName>:6379`. Build arg: `MEDUSA_BACKEND_URL`.
Storefront: alleen build args (`NEXT_PUBLIC_*`, zie `docker-compose.yml`) en `REVALIDATE_SECRET`.

Eerste start: migraties, demo-seed, admin-account, en met `STORE_ID` het product van de winkel.
Admin: `https://<api-domein>/app`.

> `NEXT_PUBLIC_*`-waarden worden tijdens de build in de storefront gebakken; na wijzigen opnieuw deployen.
> De storefront praat via de **publieke** backend-URL met Medusa.

`docker-compose.yml` is voor lokaal testen of één Docker-host (`docker compose up --build`).

## Mollie aanzetten

1. Account op [mollie.com](https://www.mollie.com), activeer iDEAL e.d., kopieer de **test**-key (`test_...`)
2. Dokploy → `<id>-backend` → Environment → `MOLLIE_API_KEY=test_...` → Redeploy
3. Koppel de methodes aan je regio: Admin → Settings → Regions → *Benelux & Duitsland* → Payment providers → vink `mollie-ideal`, `mollie-bancontact`, … aan
   (staat `MOLLIE_API_KEY` al bij de allereerste start, dan doet de seed dit automatisch)
4. Test een bestelling, en zet daarna `live_...`

De Mollie-plugin (`@variablevic/mollie-payments-medusa`) is een community-plugin (v0.0.x, vastgepind op `0.0.13`). Test hem grondig voordat je live gaat.

## PostHog + automatisering aanzetten

1. Account op [eu.posthog.com](https://eu.posthog.com) (gratis tier), project aanmaken
2. Project settings → zet **cookieless server hash mode** aan (voor bezoekers die cookies weigeren)
3. Dokploy → `POSTHOG_EVENTS_KEY=phc_...` op de backend en build arg `NEXT_PUBLIC_POSTHOG_KEY=phc_...` op de storefront → Redeploy
4. Maak een **Personal API key** (scopes: query:read, insight:write, dashboard:write, experiment:write, feature_flag:write)
5. Eenmalig: `cd analytics && cp .env.example .env && npm ci && npx --yes dotenv-cli -- npm run setup`
   (of zet de variabelen in je shell)
6. **GitHub** → repo → Settings → Secrets and variables → Actions:
   - Secrets: `POSTHOG_PERSONAL_API_KEY`, optioneel `REPORT_WEBHOOK_URL`, `ANTHROPIC_API_KEY`
   - Variables: `POSTHOG_PROJECT_ID`, `ANALYTICS_ENABLED=true`, optioneel `AUTO_SHIP_WINNERS=true`
7. Start het experiment in PostHog (Experiments → *Launch*)

### Een nieuw experiment toevoegen
1. Voeg de key toe aan `EXPERIMENTS` in `apps/storefront/src/lib/analytics/constants.ts` en aan `analytics/src/config.ts` (hypothese, varianten, beslisregels)
2. Gebruik hem in een component: `const { variant } = useExperiment(EXPERIMENTS.mijnTest)`
3. `npm run setup` maakt hem aan in PostHog → Launch → de dagelijkse check houdt hem in de gaten

**Vuistregels:** minimaal 2 weken, minimaal ~500 bezoekers per variant, en niet tussentijds stoppen omdat het er goed uitziet. De scripts dwingen dit af. Bij weinig verkeer: test grote veranderingen (prijs, aanbod, productpagina), niet een knopkleur.

## Projectstructuur

```
apps/backend/                          (@dtc/backend)
  medusa-config.ts                     Mollie, PostHog, Redis, bestanden
  src/migration-scripts/initial-data-seed.ts   NL-winkel (btw, verzending, Mollie)
  src/lib/region-store-policies.ts     retourtermijn, levertijd, verzendkosten
  src/subscribers/analytics-order-placed.ts    server-side order_completed
  src/scripts/bootstrap.ts             vaste key + admin (bij container-start)
apps/storefront/                       (@dtc/storefront)
  src/lib/analytics/                   event-namen, experiment-keys, server-helpers
  src/modules/analytics/               PostHog provider + cookiebanner, track(), useExperiment()
  src/app/api/mollie/return/route.ts   terugkeer na Mollie-betaling
  src/lib/ucp/, src/app/ucp/           AI-shopping (UCP) — uit de DTC-starter
  src/middleware.ts                    regio + bezoekers-ID cookie
analytics/                             PostHog-automatisering (npm, los van pnpm)
.github/workflows/                     CI, weekrapport, dagelijkse A/B-check
.claude/skills/                        e-commerce skills voor Claude Code
AGENTS.md                              conventies van Medusa (gelezen door Claude Code)
```

### Medusa updaten
`pnpm up "@medusajs/*@<versie>" -r` en daarna lokaal testen. De Mollie-plugin heeft
strikte peer-dependencies (2.5.1) maar werkt met 2.22; pnpm geeft daar een waarschuwing over.

## Checklist voor je live gaat (NL)

- [ ] KvK-inschrijving en btw-nummer; bij verkoop aan consumenten in andere EU-landen: **OSS-regeling** (> €10.000/jaar)
- [ ] Algemene voorwaarden, **14 dagen herroepingsrecht** + modelformulier, retourbeleid
- [ ] Privacyverklaring (`/privacy`, de cookiebanner linkt hiernaar) en verwerkersovereenkomsten (Mollie, PostHog)
- [ ] Bedrijfsgegevens in de footer (naam, adres, KvK, btw, e-mail)
- [ ] Eigen producten, foto's en teksten; demo-producten verwijderen; `SEED_DEMO=false`
- [ ] Verzendtarieven en -landen kloppen; verlaagde btw (9%) voor producten waar dat geldt
- [ ] Mollie `live_` key; test-bestelling met echte iDEAL-betaling + terugbetaling
- [ ] Back-ups van `<id>-db` (Dokploy → database → Backups, met S3-bestemming)

Dit is geen juridisch advies. Laat de voorwaarden checken door iemand die er verstand van heeft.

## Licenties

Medusa en de DTC-starter: MIT. Skills in `.claude/skills/`: MIT ([awesome-ecommerce-skills](https://github.com/finsilabs/awesome-ecommerce-skills)).
