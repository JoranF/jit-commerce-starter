# JIT Commerce Starter

Volledig open-source webshop-stack, klaar voor Nederland, met ingebouwde analytics en A/B-testen.
Gebouwd op de officiële [Medusa DTC Starter](https://github.com/medusajs/dtc-starter) (pnpm + Turborepo monorepo).

| Onderdeel | Techniek | Map |
|---|---|---|
| Winkel-backend + admin | [Medusa 2.22](https://medusajs.com) (Node/TypeScript, PostgreSQL) | `apps/backend` |
| Storefront | Next.js 16 (Medusa DTC-storefront, NL-vertaald waar het telt) | `apps/storefront` |
| Betalingen | Mollie: iDEAL, Bancontact, creditcard, Apple Pay (geen PayPal) | plugin in backend |
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
- **Nieuwe winkel in één commando**: `pnpm new-store <id> "<Naam>"` maakt config, backend-product, analytics- en advertentie-instellingen, placeholders en een checklist aan. `pnpm check-store <id>` zegt wat er nog ontbreekt voor livegang
- Elke winkel krijgt vanzelf alle automatisering (A/B-tests, weekrapport, advertenties): de GitHub-workflows draaien per winkel uit `analytics/src/stores.ts`
- Eerste winkel: **Lichtval** (wandlamp met waterlicht). Uitleg: [`apps/storefront/src/stores/README.md`](apps/storefront/src/stores/README.md)

**Dropshipping (CJ Dropshipping)**
- Verkopen zonder voorraad: betaalde bestellingen met CJ-producten (variant metadata `cj_vid`) gaan automatisch naar CJ
- Track & trace komt terug (job elke 30 min) en de bestelling staat in Medusa op verzonden; blok met status + knoppen op de bestelpagina in de admin
- Aan met `CJ_API_KEY`; uitleg in [`apps/backend/src/modules/cj-dropshipping/README.md`](apps/backend/src/modules/cj-dropshipping/README.md)

**E-mail en nazorg** (belangrijk bij dropshipping: stilte = "waar blijft mijn pakket?" en terugboekingen)
- Orderbevestiging met bedrijfsgegevens, verwachte bezorgdatum, bedenktijd en modelformulier (wettelijk verplicht), verzendmail met track & trace, "nog onderweg"-mail als de vroegste verwachte datum voorbij is, annuleringsmail. Via Resend of Brevo; zonder key alleen gelogd. Teksten: `apps/backend/src/lib/emails/`, bekijken: `pnpm medusa exec ./src/scripts/preview-emails.ts`
- **Volg je bestelling** (`/<land>/order/<id>/status`): stappen in gewone taal en de verwachte datum, met de vervoerder als extra link
- Jij krijgt een mail bij elke bestelling en elke ochtend een lijstje met bestellingen die aandacht vragen (CJ-fout, onbetaald in CJ, te laat verzonden, te lang onderweg); job `order-care`
- CJ verpakt neutraal (geen factuur of prijzen in het pakket), alleen echt betaalde bestellingen worden verstuurd, een set van twee (`cj_quantity: 2`) gaat als twee stuks naar CJ

**Meten**
- Browser-events via eigen domein (`/ingest`) → minder last van adblockers
- E-commerce funnel: `product_viewed` → `buy_section_viewed` → `product_added_to_cart` → `cart_viewed` → `checkout_started` → `payment_redirected` → **`order_completed`**
- **Checkout per stap**: `checkout_step_viewed` / `checkout_step_completed` (property `step`: `address`, `delivery`, `payment`, `review`) en `checkout_error` (elke getoonde foutmelding). Zo zie je precies bij welke stap en door welke melding klanten afhaken
- Sessie-opnames en heatmaps (na cookietoestemming; invoervelden gemaskeerd). Zet ze aan in PostHog → Settings
- `order_completed` komt **server-side** uit Medusa (subscriber), met omzet, btw, producten, land en de A/B-varianten. Daardoor klopt de omzet altijd, ook bij adblockers.
- Eén bezoekers-ID (`jit_vid` cookie, gezet in middleware) voor browser én server → experimenten worden correct toegeschreven
- Cookiebanner: zonder toestemming (ook als iemand nog niet geklikt heeft) meet PostHog alleen **cookieless** (anoniem). A/B-resultaten tellen alleen bezoekers met toestemming, omdat alleen die aan hun bestelling te koppelen zijn

**Advertenties (Meta)**
- Elke advertentieklik wordt bewaard (`utm_*`, `fbclid`, `angle`; cookie `jit_ad`, 30 dagen, laatste klik telt) en gaat mee op elk PostHog-event (`ad_*`) en op `order_completed` → **echte omzet per advertentie**
- **Landingspagina per invalshoek**: `angle=<key>` in de advertentie-URL geeft een eigen hero-kop en -tekst (`angles` in de winkelconfig), statisch en zonder verspringen
- **Ads-autopilot** (`npm run ads`): pauzeert verliezers en schaalt winnende advertentiesets op, op basis van je break-even CPA. Standaard alleen advies

**A/B-testen** (wachtrij, één tegelijk, in deze volgorde)
- `default-pack`: "2 lampen" voorgeselecteerd (beslist op omzet per bezoeker, niet alleen conversie)
- `hero-copy`: andere kop in de hero (inhoud in `stores/<id>.experiments.ts`, wisselt onzichtbaar tijdens de intro-animatie)
- `atc-flow`: na "In winkelmand" een bevestiging met knop **Afrekenen** (control) vs. **direct naar de checkout** (test)
- `pdp-cta-text`: tekst van de koopknop (`In winkelmand` vs. `Bestel de lamp`, uit de winkelconfig)
- Client: `useExperiment("flag")` · Server (zonder flikkering): `getExperimentVariant("flag")`

**Automatisering (`analytics/`)**
| Commando | Wat | Wanneer (GitHub Actions) |
|---|---|---|
| `npm run setup` | Maakt dashboard (funnel, omzet, AOV, conversie, landen) + experimenten in PostHog | eenmalig / na wijzigingen |
| `npm run report` | Weekrapport: KPI's vs. vorige week, grootste funnel-lek, **checkout per stap + foutmeldingen**, top-producten, A/B-status, optioneel 3 testideeën van Claude | elke maandag |
| `npm run ads` | Meta-uitgaven per advertentie naast echte bestellingen (PostHog); verliezers pauzeren, winnaars +20% budget. Advies, of uitvoeren met `ADS_AUTOPILOT=true` | dagelijks |
| `npm run experiments` | Bayesiaanse evaluatie van lopende tests; met `AUTO_LAUNCH_EXPERIMENTS=true` worden nieuwe tests automatisch aangemaakt en gestart (wachtrij: één tegelijk, `MAX_CONCURRENT_EXPERIMENTS`), met `AUTO_SHIP_WINNERS=true` wordt een winnaar automatisch op 100% gezet | dagelijks |
| **Autopilot** (Claude) | Leest de cijfers en zet de volgende test klaar of bakt een winnaar in, als pull request. Regels en wachtrij: [`docs/autopilot/README.md`](docs/autopilot/README.md). Met `AUTOPILOT_AUTOMERGE=true` gaan PR's die alleen testinhoud raken zelf live | dinsdag |

Alle commando's draaien per winkel: `npm run <commando> -- --store <id>` (PostHog-project en
advertentieaccount uit `analytics/src/stores.ts`). In GitHub Actions gebeurt dat automatisch voor
elke winkel in die lijst. Rapporten gaan naar `analytics/reports/<winkel>/`, de GitHub job summary
en optioneel Discord/Slack (`REPORT_WEBHOOK_URL`).

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
2. Dokploy → `<id>-backend` → Environment → `MOLLIE_API_KEY=test_...` en `MOLLIE_DESCRIPTION=<winkelnaam>` (staat op het bankafschrift van de klant) → Redeploy
3. Bij de start koppelt de backend de Mollie-methodes (iDEAL, Bancontact, creditcard, Apple Pay) aan je regio's, haalt PayPal eraf als die er nog op staat, en haalt hij de **handmatige testbetaling** eraf: daarmee kon iedereen bestellen zonder te betalen. Alleen om te testen: `ALLOW_TEST_PAYMENT=true` (backend) en `NEXT_PUBLIC_ALLOW_TEST_PAYMENT=true` (storefront)
4. Test een bestelling (betaald, mislukt, geannuleerd, terugbetaling), en zet daarna `live_...`

De Mollie-plugin (`@variablevic/mollie-payments-medusa`) is een community-plugin (v0.0.x, vastgepind op `0.0.13`). Test hem grondig voordat je live gaat.

## E-mail aanzetten

1. Account bij [Resend](https://resend.com) of [Brevo](https://www.brevo.com) (EU) en je domein verifiëren (SPF/DKIM-records in je DNS), anders belanden mails in de spam
2. Dokploy → `<id>-backend` → `RESEND_API_KEY` (of `BREVO_API_KEY`), `EMAIL_FROM=Lichtval <hallo@jouwdomein.nl>`, `EMAIL_REPLY_TO` (je inbox), `SHOP_OWNER_EMAIL` (meldingen voor jou) en optioneel `OPS_WEBHOOK_URL` (Discord/Slack)
3. Merk en bedrijfsgegevens in de mails komen uit `brand` in `apps/backend/src/scripts/stores/definitions.ts` (gelijk houden met de winkelconfig)

## Meta Pixel + Conversions API aanzetten

Voor Meta-advertenties: de pixel meet in de browser, de Conversions API stuurt elke aankoop
ook server-side (mist geen adblockers/iOS). Beide gebruiken event-ID `order_<id>`, dus Meta telt
een aankoop één keer.

1. Events Manager → *Connect data* → Web → pixel aanmaken, kopieer het **Pixel ID**
2. Pixel → Settings → Conversions API → *Generate access token*
3. Dokploy → `<id>-storefront` → build arg `NEXT_PUBLIC_META_PIXEL_ID=<pixel id>` (of `metaPixelId` in de winkelconfig)
4. Dokploy → `<id>-backend` → `META_PIXEL_ID=<pixel id>` en `META_CAPI_TOKEN=<token>`
5. Testen: zet `META_TEST_EVENT_CODE` (Events Manager → Test events), doe een testbestelling, haal hem daarna weg

Privacy: de pixel laadt pas na "Accepteren" in de cookiebanner, en de backend stuurt alleen
aankopen van klanten die accepteerden (`cart.metadata.meta_consent`). Events: PageView,
ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase.

## PostHog + automatisering aanzetten

1. Account op [eu.posthog.com](https://eu.posthog.com) (gratis tier), project aanmaken
2. Project settings → zet **cookieless server hash mode** aan (voor bezoekers die cookies weigeren)
3. Dokploy → `POSTHOG_EVENTS_KEY=phc_...` op de backend en build arg `NEXT_PUBLIC_POSTHOG_KEY=phc_...` op de storefront → Redeploy
4. Maak een **Personal API key** (scopes: query:read, insight:write, dashboard:write, experiment:write, feature_flag:write)
5. Zet het project-ID bij de winkel in `analytics/src/stores.ts` (`posthogProjectId`), dan eenmalig:
   `cd analytics && cp .env.example .env && npm ci && npx --yes dotenv-cli -- npm run setup -- --store <id>`
6. **GitHub** → repo → Settings → Secrets and variables → Actions:
   - Secrets: `POSTHOG_PERSONAL_API_KEY`, optioneel `REPORT_WEBHOOK_URL`, `ANTHROPIC_API_KEY`
   - Variables: `ANALYTICS_ENABLED=true`, en voor volledig automatisch A/B-testen
     `AUTO_LAUNCH_EXPERIMENTS=true` + `AUTO_SHIP_WINNERS=true`
   - Eén PostHog-project per winkel; de project-ID's staan in `analytics/src/stores.ts`, niet in GitHub
7. Zonder `AUTO_LAUNCH_EXPERIMENTS`: start de experimenten zelf in PostHog (Experiments → *Launch*)

## Advertenties automatisch (Meta)

**1. URL-parameters op elke advertentie** (Ads Manager → advertentie → *URL-parameters*):

```
utm_source=meta&utm_medium=paid&utm_campaign={{campaign.id}}&utm_term={{adset.id}}&utm_content={{ad.id}}&angle=<invalshoek>
```

Meta vult `{{…}}` zelf in. `angle` kies je per advertentie uit `angles` in de winkelconfig
(Lichtval: `sfeer`, `slaapkamer`, `cadeau`); de bezoeker ziet dan een hero die past bij de advertentie.
Zonder (of met een onbekende) `angle` ziet hij de gewone pagina.

**2. Meta laat de creatives testen**: zet per advertentieset meerdere advertenties (Advantage+ creative /
dynamic creative), optimaliseer op *Purchase* (komt via pixel + Conversions API binnen).

**3. Ads-autopilot** (`analytics/src/ads.ts`, regels in `ads-rules.ts`, getest):
- **Pauzeren**: ≥ 2× break-even CPA uitgegeven zonder bestelling, of ≥ 3× uitgegeven met CPA > 1,5× break-even.
  Nooit de laatste actieve advertentie in een set.
- **Opschalen**: set met ≥ 3 bestellingen en CPA ≤ 0,7× break-even → dagbudget +20%, max. 1× per 72 uur,
  nooit boven `ADS_MAX_DAILY_BUDGET`.
- Bestellingen komen uit PostHog (`order_completed` met `ad_ad`), niet uit Meta's eigen toeschrijving.

Aanzetten:
1. Business Manager → Instellingen → **Systeemgebruikers** → token met `ads_read` + `ads_management` op het advertentieaccount
2. `analytics/src/stores.ts` → bij de winkel `meta.adAccountId` (`act_…`) en `meta.breakEvenCpa` (rekensom in `docs/beslissingen/<id>.md`)
3. GitHub → Secrets: `META_ADS_TOKEN` · Variables: `ADS_ENABLED=true`, optioneel `ADS_MAX_DAILY_BUDGET` (standaard 50)
4. Draai een paar weken in **adviesmodus** (dagelijks rapport); daarna variable `ADS_AUTOPILOT=true`

Lokaal proberen: `cd analytics && META_ADS_TOKEN=… npx --yes dotenv-cli -- npm run ads -- --store <id>`

### Een nieuw experiment toevoegen
**Zonder code** (hero-kop of voorselectie): inhoud in `apps/storefront/src/stores/<id>.experiments.ts`, key in `constants.ts` en het experiment in `analytics/src/config.ts`. Zie [`docs/autopilot/README.md`](docs/autopilot/README.md); `npm test` in `analytics/` controleert dat de keys overal gelijk zijn.

**Met code**:
1. Voeg de key toe aan `EXPERIMENTS` in `apps/storefront/src/lib/analytics/constants.ts` en aan `analytics/src/config.ts` (hypothese, varianten, beslisregels; `metric: "revenue_per_visitor"` als de orderwaarde kan veranderen)
2. Gebruik hem in een component: `const { variant } = useExperiment(EXPERIMENTS.mijnTest)` (boven de vouw: `useTimedExperiment`, zonder flikkering)
3. De dagelijkse check maakt hem aan in PostHog en start hem als hij aan de beurt is (volgorde in `config.ts` = prioriteit)

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
- [ ] PostHog: cookieless server hash mode, session replay en heatmaps aan; `npm run setup` gedraaid
- [ ] Privacyverklaring noemt de eigen cookies `jit_vid` (bezoekers-ID), `jit_ad` (advertentieklik, 30 dagen) en `jit_consent`

Dit is geen juridisch advies. Laat de voorwaarden checken door iemand die er verstand van heeft.

## Licenties

Medusa en de DTC-starter: MIT. Skills in `.claude/skills/`: MIT ([awesome-ecommerce-skills](https://github.com/finsilabs/awesome-ecommerce-skills)).
