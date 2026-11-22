# Lichtval: wat er nog moet gebeuren (en wat al klaar is)

Stand 22 november 2026. ✅ = staat in de code. ⬜ = jij (account, sleutel, keuze). Volgorde =
volgorde van doen. Achtergrond bij het product: [product-research/2026-11-lichtval-hercheck.md](./product-research/2026-11-lichtval-hercheck.md).

**Tijdlijn**: sample deze week bestellen → begin december binnen → filmen → live en
advertentietest **begin januari**. Levering vóór kerst lukt niet meer (8–15 werkdagen); de site
zegt dat ook eerlijk vanaf half november.

## 1. Blokkerend: zonder dit geen verkoop

### Product en leverancier (CJ)
- ⬜ **Sample bestellen** (1 lamp, CJPacket Ordinary E, ≈ $54). Vraag CJ tegelijk: prijs Duo (2 in één
  pakket), **stekker of vaste aansluiting**, lichtkleur (Kelvin), CE-verklaring + testrapporten
  (LVD, EMC, RoHS), stevige verpakking, en neutraal verpakken (geen factuur/prijzen).
- ⬜ CJ-variant koppelen in `apps/backend/src/scripts/stores/definitions.ts`:
  1 lamp `metadata: { cj_vid: "<vid>" }`, 2 lampen `metadata: { cj_vid: "<vid>", cj_quantity: 2 }`.
  De vid zie je op `https://<api>/admin/cj/products/<pid>?to=NL`. Verhoog `revision`.
- ⬜ Dokploy backend: `CJ_API_KEY`, `CJ_LOGISTICS=CJPacket Ordinary`. Eerst `CJ_AUTO_PAY=false`
  (jij betaalt elke bestelling in CJ); na 3 goede bestellingen saldo opwaarderen en `true`.
- ✅ Duo stuurt nu echt 2 lampen naar CJ (`cj_quantity`; was een bug: er ging er 1).
- ✅ Alleen echt betaalde bestellingen gaan naar CJ (een testbetaling wordt tegengehouden).
- ✅ Bij elke CJ-bestelling: "neutral packaging, no invoice, no prices" (`CJ_ORDER_REMARK` om aan te passen).
- ⬜ Na het sample: eigen foto's in `public/stores/lichtval/` en video (`store.video` in
  `apps/storefront/src/stores/lichtval.ts`, de sectie verschijnt vanzelf). Dan `imageNote` weg.
- ⬜ FAQ "Hoe sluit ik hem aan?" toevoegen zodra je het weet; feit "Licht" aanpassen (230 V, Kelvin).
- ⬜ Check met het sample of je bij bezorging niets extra betaalde (de FAQ belooft dat).

### Betalen (Mollie)
- ✅ De handmatige "testbetaling" staat niet meer in de checkout zodra Mollie aan staat (was een
  lek: iedereen kon bestellen zonder te betalen). De backend haalt hem ook van de regio en
  koppelt de Mollie-methodes vanzelf (bij elke start).
- ✅ Betaling nog "pending" bij terugkomst: geen "mislukt" meer (dan betalen mensen dubbel), maar
  "wordt verwerkt".
- ⬜ Mollie-account afmaken (identiteit/KvK-check duurt een paar dagen), iDEAL, Bancontact,
  creditcard, PayPal en Apple Pay aanzetten.
- ⬜ Dokploy backend: `MOLLIE_API_KEY=test_…` en **`MOLLIE_DESCRIPTION=Lichtval`** (dit staat op
  het bankafschrift van de klant; "Bestelling" herkent niemand → terugboekingen).
- ⬜ Testbestellingen in testmodus: betaald, mislukt, geannuleerd, en een terugbetaling vanuit de
  admin. Dan `live_…`.

### E-mail
- ✅ Orderbevestiging (wettelijk verplicht: bedrijfsgegevens, prijs, levertijd, bedenktijd +
  modelformulier), verzendmail met track & trace, "nog onderweg"-mail, annuleringsmail,
  melding bij elke bestelling naar jou, dagelijks lijstje met probleembestellingen.
- ⬜ Account bij **Resend** (resend.com) of **Brevo** (brevo.com, EU), je domein verifiëren
  (SPF/DKIM in je DNS), dan op de backend: `RESEND_API_KEY` (of `BREVO_API_KEY`),
  `EMAIL_FROM=Lichtval <hallo@lichtval.nl>`, `EMAIL_REPLY_TO=<jouw inbox>`,
  `SHOP_OWNER_EMAIL=<jouw inbox>`, optioneel `OPS_WEBHOOK_URL` (Discord/Slack).
- ⬜ Bekijk de mails: `cd apps/backend && pnpm medusa exec ./src/scripts/preview-emails.ts`.

### Juridisch en administratie (NL)
- ⬜ KvK: activiteit webwinkel (SBI 47911) en handelsnaam "Lichtval".
- ⬜ **Zakelijk adres** huren (vestigingsadres, ±€15–30 per maand) en bij de KvK inschrijven.
  Het adres moet op de site staan (wet) en is via je KvK-nummer op te zoeken; met een
  zakelijk adres staat je huisadres nergens meer. ✅ Het adres staat nu al niet meer in de
  footer van elke pagina, alleen op contact/voorwaarden/retour (niet in Google) en in de
  orderbevestiging.
- ⬜ **E-mail op eigen domein** (hallo@lichtval.nl) in plaats van gmail, ook in `company.email`
  (storefront `lichtval.ts` én backend `definitions.ts` → `brand.company.email`).
- ⬜ **WEEE**: als eerste verkoper van elektrische apparaten in NL ben jij de "producent".
  Registreren bij Stichting OPEN (Nationaal (W)EEE Register) en jaarlijks melden.
- ⬜ **GPSR**: fabrikant (naam + adres uit de CE-verklaring) en waarschuwingen invullen in
  `productSafety` in `lichtval.ts` (het blok "Productveiligheid en fabrikant" staat klaar).
- ⬜ **Btw/IOSS**: met de boekhouder: rekent CJ btw bij invoer (dan dubbel)? Eigen IOSS-nummer?
  OSS-aangifte zodra je > €10.000 per jaar aan BE/DE verkoopt.
- ⬜ **Privacyverklaring** aanvullen: klantgegevens gaan naar CJ (China) voor de verzending =
  doorgifte buiten de EU (noemen + grondslag), en Resend/Brevo, Mollie, PostHog, Meta.
- ⬜ Algemene voorwaarden laten checken. Tip: **WebwinkelKeur** (±€10–25 per maand) geeft
  voorwaarden, een keurmerk en echte reviews; dat helpt een onbekende winkel flink.

## 2. Vóór je advertenties aanzet

- ✅ Site: hero op mobiel (kop stond over de lamp), koopblok met prijs per keuze en "Bespaar €39",
  foto wisselt mee met de keuze, concrete bezorgdatum + eerlijke kerstmelding, betaalmethodes,
  checkout in één kolom met e-mail eerst, geruststelling bij het betalen, alles in het Nederlands.
- ✅ Bug: kiezen van "2 lampen" sprong naar boven op de pagina (Duo-verkoop liep daardoor weg).
- ✅ "Volg je bestelling"-pagina met stappen in gewone taal (link in alle mails).
- ⬜ PostHog: keys op storefront (build arg) en backend, cookieless mode aan, session replay aan,
  `cd analytics && npm run setup -- --store lichtval`.
- ⬜ Meta: pixel-ID (build arg `NEXT_PUBLIC_META_PIXEL_ID`), `META_PIXEL_ID` + `META_CAPI_TOKEN`
  op de backend, domein verifiëren in Business Manager, testen met `META_TEST_EVENT_CODE`.
  ✅ Klikte iemand op een advertentie en accepteerde hij pas later cookies, dan krijgt Meta de
  klik nu toch mee (fbc uit de bewaarde fbclid): betere toeschrijving.
- ⬜ 3–5 video's van het echte licht (eerste 2 seconden: lamp gaat aan in het donker), formaat
  4:5 en 9:16. Invalshoeken: `sfeer`, `slaapkamer`, `cadeau` (cadeau pas weer na de feestdagen).
  URL-parameters per advertentie: zie README → "Advertenties automatisch".
- ⬜ Campagne: doel Verkoop, optimaliseren op Purchase, NL + BE, €25–30 per dag, 7–10 dagen.
  Stopregels staan in de hercheck (en de ads-autopilot past ze toe).
- ⬜ Back-ups van de database (Dokploy → Backups naar S3) en een uptime-monitor op
  `/api/health` (storefront) en `/health` (backend), bv. UptimeRobot of Better Stack (gratis).

## 3. Automatisch draaien (GitHub → Settings → Secrets and variables → Actions)

| Soort | Naam | Waarvoor |
|---|---|---|
| Secret | `POSTHOG_PERSONAL_API_KEY` | rapporten, A/B-tests |
| Secret | `ANTHROPIC_API_KEY` | testideeën in het weekrapport + de autopilot |
| Secret | `META_ADS_TOKEN` | ads-autopilot |
| Secret | `REPORT_WEBHOOK_URL` | rapporten naar Discord/Slack |
| Secret (optioneel) | `AUTOPILOT_GITHUB_TOKEN` | zodat CI ook op autopilot-PR's draait |
| Variable | `ANALYTICS_ENABLED=true` | weekrapport + dagelijkse testcheck |
| Variable | `AUTO_LAUNCH_EXPERIMENTS=true`, `AUTO_SHIP_WINNERS=true` | tests starten en winnaars uitrollen, één tegelijk |
| Variable | `ADS_ENABLED=true` (2 weken advies), dan `ADS_AUTOPILOT=true` | advertenties |
| Variable | `AUTOPILOT_ENABLED=true` | Claude elke dinsdag: volgende test of winnaar inbakken, als PR |
| Variable (optioneel) | `AUTOPILOT_AUTOMERGE=true` | PR's die alleen testinhoud raken gaan zelf live |

Regels en wachtrij van de autopilot: [autopilot/README.md](./autopilot/README.md).

## 4. Na de eerste verkopen (groei)

- Reviews vragen ±7 dagen na bezorging en de echte reviews in `store.reviews` zetten (de sectie en
  de sterren verschijnen vanzelf). Nooit verzinnen.
- Werkt het (≥ 10 verkopen met winst): **EU-voorraad** (CJ EU-magazijn of 20–50 stuks zelf).
  Levering 2–3 dagen → hogere conversie, minder vragen, lagere inkoop. Dit is de grootste stap.
- Verlaten checkouts terughalen per e-mail: kan pas netjes met toestemming (vinkje) of als
  "service-herinnering"; eerst juridisch uitzoeken.
- Google Merchant Center (gratis vermeldingen in Google Shopping): productfeed toevoegen.
- Gratis verzending testen (prijs incl. verzending): grootste verwacht effect op conversie, maar
  raakt de rekensom; staat als idee in de wachtrij van de autopilot.
- Klantenservice: beloofd is "antwoord binnen één werkdag". Claude kan antwoorden voorbereiden
  (Gmail-koppeling).
