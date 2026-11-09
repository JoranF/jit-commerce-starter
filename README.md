# JIT Commerce Starter

Volledig open-source webshop-stack, klaar voor Nederland, met ingebouwde analytics en A/B-testen.

| Onderdeel | Techniek | Map |
|---|---|---|
| Winkel-backend + admin | [Medusa v2](https://medusajs.com) (Node/TypeScript, PostgreSQL) | `apps/backend` |
| Storefront | Next.js 15 (officiële Medusa-starter, NL-vertaald waar het telt) | `apps/storefront` |
| Betalingen | Mollie: iDEAL, Bancontact, creditcard, PayPal, Apple Pay | plugin in backend |
| Analytics + A/B-tests | PostHog (EU-cloud of zelf gehost) | storefront + backend |
| Automatisering | Dashboards, weekrapport, A/B-evaluatie, AI-testideeën | `analytics/` |
| Deploy | Docker Compose → Dokploy | `docker-compose.yml` |
| Claude Code skills | 24 e-commerce skills (CRO, A/B, SEO, btw, Medusa…) | `.claude/skills/` |

## Wat er al geregeld is

**Winkel (NL-klaar)**
- Regio *Benelux & Duitsland* (NL/BE/DE), EUR, **prijzen incl. btw** (21% / 21% / 19%)
- Verzending: Standaard €4,95 · Express €7,95 (aan te passen in de admin)
- Mollie-checkout met redirect + webhook (bestelling wordt ook afgerond als de klant het tabblad sluit)
- Bij een lege database: demo-producten, vaste publishable key en admin-account (`src/scripts/bootstrap.ts`)

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

Vereist: Node 20+, Docker (voor Postgres/Redis).

```bash
docker compose -f docker-compose.dev.yml up -d

# Backend → http://localhost:9000/app (admin)
cd apps/backend
cp .env.template .env           # DATABASE_URL staat al goed voor de dev-compose
yarn install
npx medusa db:migrate
yarn seed                       # demo-winkel NL; noteer de publishable key (of zie hieronder)
npx medusa user -e jij@voorbeeld.nl -p geheim123
yarn dev

# Storefront → http://localhost:8000
cd ../storefront
cp .env.template .env.local     # zet NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
yarn install
yarn dev
```

Publishable key opvragen: Admin → Settings → Publishable API Keys.

## Live zetten op Dokploy

1. **DNS**: A-records voor bv. `shop.jouwdomein.nl` en `api.shop.jouwdomein.nl` → je server.
2. **Dokploy** → Project → *Create Service* → **Compose**
   - Provider: GitHub → `JoranF/jit-commerce-starter`, branch `main`, compose path `./docker-compose.yml`
3. **Environment**: plak `.env.production.example`, vul in. Secrets: `openssl rand -hex 32`, key: `echo pk_$(openssl rand -hex 32)`.
4. **Domains**:
   - service `storefront`, poort **8000**, host `shop.jouwdomein.nl`, HTTPS (Let's Encrypt)
   - service `backend`, poort **9000**, host `api.shop.jouwdomein.nl`, HTTPS
5. **Deploy**. De eerste start draait migraties, seedt de demo-winkel en maakt je admin-account aan.
6. Admin: `https://api.shop.jouwdomein.nl/app`

> `NEXT_PUBLIC_*`-waarden (publishable key, PostHog key, winkel-URL) worden tijdens de build in de storefront gebakken. Wijzig je die, dan moet je opnieuw deployen.

## Mollie aanzetten

1. Account op [mollie.com](https://www.mollie.com), activeer iDEAL e.d., kopieer de **test**-key (`test_...`)
2. Dokploy → Environment → `MOLLIE_API_KEY=test_...` → Redeploy
3. Koppel de methodes aan je regio: Admin → Settings → Regions → *Benelux & Duitsland* → Payment providers → vink `mollie-ideal`, `mollie-bancontact`, … aan
   (bij een verse database met `MOLLIE_API_KEY` doet de seed dit automatisch)
4. Test een bestelling, en zet daarna `live_...`

De Mollie-plugin (`@variablevic/mollie-payments-medusa`) is een community-plugin (v0.0.x, vastgepind op `0.0.13`). Test hem grondig voordat je live gaat.

## PostHog + automatisering aanzetten

1. Account op [eu.posthog.com](https://eu.posthog.com) (gratis tier), project aanmaken
2. Project settings → zet **cookieless server hash mode** aan (voor bezoekers die cookies weigeren)
3. Dokploy → `POSTHOG_KEY=phc_...` → Redeploy
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
apps/backend/
  medusa-config.ts                     Mollie, PostHog, Redis, bestanden
  src/subscribers/analytics-order-placed.ts   server-side order_completed
  src/scripts/seed.ts                  NL-winkel (btw, verzending, Mollie)
  src/scripts/bootstrap.ts             auto-seed + vaste key + admin (bij container-start)
apps/storefront/
  src/lib/analytics/                   event-namen, experiment-keys, server-helpers
  src/modules/analytics/               PostHog provider + cookiebanner, track(), useExperiment()
  src/app/api/mollie/return/route.ts   terugkeer na Mollie-betaling
  src/middleware.ts                    bezoekers-ID cookie
analytics/
  src/setup.ts | report.ts | experiments.ts | stats.ts
.github/workflows/                     CI, weekrapport, dagelijkse A/B-check
.claude/skills/                        e-commerce skills voor Claude Code
```

## Checklist voor je live gaat (NL)

- [ ] KvK-inschrijving en btw-nummer; bij verkoop aan consumenten in andere EU-landen: **OSS-regeling** (> €10.000/jaar)
- [ ] Algemene voorwaarden, **14 dagen herroepingsrecht** + modelformulier, retourbeleid
- [ ] Privacyverklaring (`/privacy`, de cookiebanner linkt hiernaar) en verwerkersovereenkomsten (Mollie, PostHog)
- [ ] Bedrijfsgegevens in de footer (naam, adres, KvK, btw, e-mail)
- [ ] Eigen producten, foto's en teksten; demo-producten verwijderen; `SEED_DEMO=false`
- [ ] Verzendtarieven en -landen kloppen; verlaagde btw (9%) voor producten waar dat geldt
- [ ] Mollie `live_` key; test-bestelling met echte iDEAL-betaling + terugbetaling
- [ ] Back-ups van het Postgres-volume (Dokploy → Volume backups)

Dit is geen juridisch advies. Laat de voorwaarden checken door iemand die er verstand van heeft.

## Licenties

Medusa en de Next.js-starter: MIT. Skills in `.claude/skills/`: MIT ([awesome-ecommerce-skills](https://github.com/finsilabs/awesome-ecommerce-skills)).
