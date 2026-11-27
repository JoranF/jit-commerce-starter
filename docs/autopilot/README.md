# Autopilot: de winkel verbetert zichzelf

Dit is het draaiboek voor de autopilot (Claude, elke dinsdag via
`.github/workflows/autopilot.yml`) en voor jou. De autopilot leest dit bestand elke keer
eerst. Wijzig je de regels, dan verandert zijn gedrag.

## Wie doet wat (alles draait vanzelf)

| Wanneer | Wat | Waar |
|---|---|---|
| Elk uur (:23) | Eén herinnering aan wie de bestelling niet afrondde en daar zelf om vroeg | backend: job `cart-reminder` |
| Elke 30 min | Bestellingen naar CJ, track & trace terug, verzendmail naar de klant | backend: job `cj-sync`, subscriber `email-shipment-created` |
| Elke dag 05:47 | Advertenties: verliezers pauzeren, winnaars +20% (advies, of echt met `ADS_AUTOPILOT=true`) | `.github/workflows/ads.yml` |
| Elke dag 06:17 | A/B-tests: nieuwe aanmaken, de volgende uit de wachtrij starten, winnaar uitrollen | `.github/workflows/analytics-experiments.yml` |
| Elke dag 08:17 | Nazorg: "nog onderweg"-mail aan klanten, lijstje met probleembestellingen naar jou | backend: job `order-care` |
| Maandag 08:43 | Weekrapport (+ 3 testideeën van Claude) | `.github/workflows/analytics-weekly.yml` |
| Dinsdag 07:23 | **Autopilot**: winnaar inbakken of de volgende test klaarzetten, als pull request | `.github/workflows/autopilot.yml` |

Jij: pull requests van de autopilot goedkeuren (of `AUTOPILOT_AUTOMERGE=true` zetten, zie
onder), het dagelijkse lijstje met probleembestellingen afhandelen, en klantmails beantwoorden.

## Harde regels (nooit overtreden)

1. **Eén ding per week**, en hooguit één test tegelijk (`MAX_CONCURRENT_EXPERIMENTS=1`). Met
   weinig verkeer maken meer tests elkaar onbetrouwbaar.
2. **Niet tussentijds stoppen** omdat het er goed of slecht uitziet. De beslisregels in
   `analytics/src/config.ts` (≥ 14 dagen, ≥ 500 bezoekers per variant, ≥ 95% zekerheid)
   bepalen het. Die regels nooit versoepelen. Geen winnaar na **28 dagen** (`maxDays`)? Dan
   stopt de dagelijkse job de test zelf met control ("geen verschil gevonden") en start de
   volgende. Met ±80 bezoekers per dag is dat voor kleine effecten de normale uitkomst.
   **Metric kiezen naar verkeer.** Bij ±1% conversie heb je in 4 weken per variant maar ±10
   bestellingen: alleen een enorm verschil is dan te zien. Tests bovenin de pagina (kop,
   knoptekst) beslissen daarom op `metric: "add_to_cart"` (±5× zoveel gebeurtenissen), met
   bestellingen als rem: wint een variant op winkelmand maar loopt hij bij de bestellingen
   duidelijk achter, dan wordt hij niet uitgerold. Tests die de orderwaarde raken:
   `revenue_per_visitor`. Checkout-tests: `conversion`.
3. **Geen prijzen wijzigen of testen.** Prijstests per bezoeker zijn juridisch lastig
   (gepersonaliseerde prijzen moet je melden) en raken de rekensom in
   `docs/beslissingen/lichtval.md`. Een prijswijziging is een besluit van de eigenaar.
4. **Geen nieuwe beloftes of claims.** Alleen wat elders in de winkel al waar is: levertijd uit
   het winkelbeleid, 14 dagen bedenktijd, 2 jaar garantie. Geen "op = op", geen afteltimers,
   geen nepreviews, geen "x mensen kijken nu", geen "gratis" wat niet gratis is, geen
   "verzonden vanuit Nederland". (Misleiding: ACM, Omnibus-richtlijn.)
5. **Geen herkomst noemen** (land van de leverancier) in teksten, maar ook nooit een
   onware herkomst suggereren.
6. **Niet aanraken zonder mens**: betalen/checkout-code, backend, juridische pagina's,
   bedrijfsgegevens, prijzen, verzendkosten, de CJ-koppeling, `.github/`, deze regels.
   Wil je daar iets veranderen, zet het dan als **advies** in het logboek.
7. Teksten: Nederlands, kort, rustig, zoals de rest van de winkel (geen uitroeptekens,
   geen hoofdletters voor nadruk). Zinnen met een termijn gebruiken `{levertijd}` e.d.

## Wat de autopilot zelf mag aanpassen

Alleen deze bestanden. Alleen dan mag de PR met `AUTOPILOT_AUTOMERGE=true` automatisch
live (de workflow controleert dat zelf, los van Claude):

- `apps/storefront/src/stores/<winkel>.experiments.ts`: de inhoud van de tests
- `apps/storefront/src/lib/analytics/constants.ts`: de experiment-keys (`EXPERIMENTS`)
- `analytics/src/config.ts`: het experiment met hypothese en beslisregels (`EXPERIMENTS`)
- `docs/autopilot/*`: logboek en wachtrij

Een idee dat code nodig heeft (nieuw soort test, nieuwe sectie) mag als gewone PR, maar
die wacht altijd op akkoord.

## Zo zet je een test klaar (zonder code)

Er zijn nu twee soorten tests die alleen inhoud nodig hebben:

| Soort | In `<winkel>.experiments.ts` | Wat de bezoeker ziet |
|---|---|---|
| Hero-kop | `heroCopy: { flag, test: { title, lead, cta } }` | Andere kop/tekst/knop bovenaan (niet op advertentiepagina's `/a/<angle>`) |
| Voorselectie | `defaultPack: { flag, test: "<optiewaarde>" }` | Die keuze staat al aan in het koopblok |

Stappen (alle drie, anders faalt `npm test` in `analytics/`):

1. Inhoud in `apps/storefront/src/stores/<winkel>.experiments.ts`, met een **nieuwe** `flag`
   (bv. `hero-copy-2`; een afgerond experiment start je niet opnieuw).
2. Dezelfde key in `EXPERIMENTS` in `apps/storefront/src/lib/analytics/constants.ts`.
3. Het experiment in `analytics/src/config.ts`: naam, hypothese ("Als …, dan …, omdat …"),
   varianten `control` en `test`, `minExposuresPerVariant: 500`, `minDays: 14`,
   `winProbability: 0.95`, `autoShip: true`, en `metric: "revenue_per_visitor"` als de
   test de orderwaarde kan veranderen. **Bovenaan** zetten = volgende in de wachtrij.

De dagelijkse job maakt hem daarna aan in PostHog en start hem zodra er niets anders loopt.

## Zo bak je een winnaar in

Als het weekrapport of de testcheck zegt dat een test is uitgerold (winnaar op 100%):

1. Zet de winnende tekst/keuze in de gewone winkelconfig. Bij een hero-kop:
   `hero.title`/`hero.lead` in `apps/storefront/src/stores/<winkel>.ts` (dat bestand
   valt buiten de automerge, dus deze PR wacht op akkoord). Bij voorselectie: de volgorde
   van de varianten in de backend (`definitions.ts`) is een besluit voor de eigenaar; zet het
   als advies in het logboek.
2. Haal de oude inhoud weg uit `<winkel>.experiments.ts`.
3. Laat de key in `constants.ts` en `config.ts` staan tot de flag in PostHog gearchiveerd is
   (anders verdwijnt de uitslag uit de rapporten); noteer in het logboek dat hij af is.

Werd het `keep-control`: alleen de inhoud weghalen en het in het logboek zetten.

## Checks vóór elke PR

```bash
cd analytics && npm test && npm run typecheck
cd apps/storefront && npx tsc --noEmit
```

## Wachtrij voor Lichtval (bovenste eerst)

Ingeschat op verwachte impact. De autopilot mag de volgorde aanpassen als de cijfers daar
reden voor geven (zet de reden in het logboek).

1. **default-pack** (staat klaar): "2 lampen" voorgeselecteerd. Doel: hogere orderwaarde.
   Metric: omzet per bezoeker.
2. **hero-copy** (staat klaar): kop over het gevoel ("Rust op je muur, elke avond.") in
   plaats van over het ding.
3. **atc-flow** (staat klaar): na "In winkelmand" direct naar de checkout.
4. **pdp-cta-text** (staat klaar): "Bestel de lamp" in plaats van "In winkelmand".
5. Idee, inhoud: hero-kop rond de slaapkamer ("Zacht licht naast je bed.") als die
   invalshoek in de advertenties het beste converteert (zie `ad_angle` in het weekrapport).
6. ~~Idee: gratis verzending~~ Gedaan door de eigenaar (23 nov): gratis verzending en retour, €134/€224.
7. Idee, **code nodig**: video-sectie ("Zie het licht aangaan") zodra er eigen beelden van het
   sample zijn (`store.video` bestaat al; alleen nog het bestand).

## Logboek

Elke run schrijft bovenaan in `docs/autopilot/log.md`: datum, wat de cijfers zeiden (bezoekers,
conversie, omzet per bezoeker, lopende test), wat er gedaan is en waarom, en advies aan de
eigenaar (advertenties, prijs, aanbod). Kort, met cijfers.
