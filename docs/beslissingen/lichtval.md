# Lichtval: genomen beslissingen

Logboek van de keuzes voor de winkel Lichtval (wandlamp met golvend lichtpatroon). Nieuwste
bovenaan per onderwerp. Wijzig je een keuze, pas dan ook de code aan die erbij staat.

## Bedrijf

| Keuze | Waarde | Waar in de code |
|---|---|---|
| Verkopende partij | Joran Information Technology (eenmanszaak), KvK 96539402, btw NL005215436B31 | `apps/storefront/src/stores/lichtval.ts` → `company` |
| Adres op de site | Prins Bernhardstraat 8, 6668 AH Randwijk | idem |
| Klant-e-mail | joranfloor@gmail.com (later vervangen door een adres op het eigen domein) | idem |
| Telefoon | Niet op de site (bewust: privénummer) | — |

Nog te doen bij de KvK: activiteit "webwinkel" (SBI 47911) toevoegen; "Lichtval" als
handelsnaam inschrijven.

## Leverancier (2026-11-22)

| Keuze | Waarde |
|---|---|
| Leverancier | CJ Dropshipping, product "Advanced Modern And Minimalist Stainless Steel Corrugated Wall Lamp" |
| SKU bij CJ | CJYD206157001AZ, variant **Small Size Warm Light** (850 g) |
| Verzendmethode | **CJPacket Ordinary E** (goedkoper dan Sensitive) |
| Inkoop per lamp naar NL | $36,31 + verzending $14,64 + "customs duty" $3,20 = **$54,15 ≈ €49** |
| Voorraad | Fabriek in China (CJ zelf 0), geen EU-magazijn |
| Levertijd volgens CJ | 1–3 dagen verwerking + 7–15 dagen onderweg |

Details en vragen aan de leverancier: [`../product-research/2026-11-cj-sourcing-lichtval.md`](../product-research/2026-11-cj-sourcing-lichtval.md).

## Prijs en varianten (2026-11-22)

| Variant | SKU | Prijs incl. btw |
|---|---|---|
| 1 lamp | `LICHTVAL-WANDLAMP` | **€129** (was €119) |
| 2 lampen | `LICHTVAL-WANDLAMP-DUO` | **€219** |

Code: `apps/backend/src/scripts/stores/definitions.ts` (optie "Aantal"). Bij een bestaande
database voegt de setup de Duo toe. Prijzen en foto's van een bestaand product worden alleen
bijgewerkt als `revision` in de definitie omhoog gaat (nu 2: foto's van de CJ-lamp en €129);
daarna beheer je ze weer in de admin.

Waarom €129: bij €119 blijft er ≈ €45 per verkoop over voor advertenties, krap tegen de
gangbare €30–45 per verkoop op Meta in NL. Bij €129 is dat ≈ €53.

Rekensom (max. advertentiekosten per verkoop, break-even):

| | 1 lamp €129 | 2 lampen €219 |
|---|---|---|
| Zonder btw (÷ 1,21) | €106,61 | €180,99 |
| Inkoop (koers ≈ 0,90) | −€48,70 | ≈ −€90 ⚠️ (2 × lamp + zwaarder pakket; prijs Duo nog opvragen) |
| Betaalkosten + retourreserve (≈ 4%) | −€5,20 | −€8,80 |
| **Max. advertentiekosten per verkoop** | **≈ €53** | **≈ €82** |

Niet meegerekend: de €4,95 verzendkosten die de klant betaalt (+€4,09 ex btw), sample,
hosting, retourverzending. Aannames om te controleren:

- Koers USD → EUR (0,90 aangenomen).
- De "customs duty" van CJ is waarschijnlijk btw via IOSS: mogelijk dubbel met de btw die
  wij afdragen. Navragen bij de boekhouder. ⚠️

Beslisregel (uit het sourcing-document): inkoop €40–58 → alleen bij ≥ €129 of met de Duo
als hoofdaanbod. Beide is nu zo ingesteld.

## Levertijd en verzending

| Keuze | Waarde | Waar |
|---|---|---|
| Tekst op de site | 8–15 werkdagen, met track & trace | `definitions.ts` → `policies`, `standardShipping` |
| Verzendkosten klant | €4,95 | idem (`shipping_rate`) |
| Express | Verborgen (kan niet vanuit China) | `hideShippingCodes` |
| Retour | 14 dagen bedenktijd, retourkosten voor de klant | `policies` |

CJ's 7–15 dagen zijn waarschijnlijk kalenderdagen en passen dan binnen 8–15 werkdagen.
Na de sample controleren; duurt het langer, dan `transit_days_max` verhogen.

## Beelden (2026-11-22)

De eerste sfeerbeelden toonden een andere lamp (ronde muurplaat, arm, gehamerde schijf) dan
de CJ-lamp. Vervangen door nieuwe AI-beelden op basis van de CJ-productfoto's:

| Plek | Bron (fal, Nano Banana Pro edit, 2K) |
|---|---|
| Koopblok + productfoto 1 (`lamp.jpg`, `1-lamp.jpg`) | product-a |
| Intro close-up (`detail.jpg`, `3-detail.jpg`) | feed-b, vierkant uitgesneden |
| Ruimte "Boven de bank" (`woonkamer.jpg`) | woonkamer-b, 4:5 uitgesneden |
| Ruimte "Naast het bed" (`slaapkamer.jpg`): set van twee | duo-a |
| Ruimte "In de hal" (`hal.jpg`) | story-a, 4:5 uitgesneden |
| Hero breed + mobiel (`hero-breed.jpg`, `hero-mobiel.jpg`) | breed: oude hero bewerkt, lamp vervangen (lichtpunt 77/33); mobiel: uitsnede 9:16 uit het brede beeld (lichtpunt 57/33). Eerste mobiele versie afgekeurd: staalplaat stond los naast de lamp |
| Advertenties (`marketing/lichtval/`) | feed-b (4:5), story-a (9:16) |

Afgekeurd: feed-a (dubbele band bovenin), duo-b (zichtbaar snoer, aansluiting nog onbekend).
Kosten: 12 beelden ≈ $1,80. De kop "Waterlicht op je muur." blijft voorlopig staan. Echte maten van de "Small": 33 cm hoog, schijf 10,5 cm, 8 cm diep,
220 V (maattekening CJ). Na de sample vervangen door eigen foto's.

## Video (2026-11-22)

Geen sample gekocht. Video = echte opname van de lamp (aangeleverd door de eigenaar), geknipt:
`aan.mp4` (3,7 s, uit → aan, loop op de site), `marketing/lichtval/video-aan-draaien.mp4`
(12 s, aan + schijf draaien, voor advertenties). Zonder geluid.

AI-video's (fal: Nano Banana Pro "lamp uit"-beeld + MiniMax H3 Max van uit naar de bestaande
sfeerfoto, 8 s, 1080p; ≈ $0,90 totaal): `marketing/lichtval/video-ai-aan-story-9x16.mp4` en
`video-ai-aan-feed-4x5.mp4`. Gecontroleerd: lamp gaat aan op ±1,5 s, daarna staat het licht stil,
product scherp en gelijk aan de foto's. Let op: het AI-lichtpatroon is zachter/ronder dan het
echte (dat is meer een waaier van stralen). Gebruik in advertenties bij voorkeur de echte opname;
de AI-versies alleen als sfeer, en test of ze niet meer retouren geven ("ziet er anders uit").

## Klantcontact en dropshipping (2026-11-22)

| Keuze | Waarde | Waar |
|---|---|---|
| Herkomst | Nergens genoemd in winkel, mails of statuspagina; ook nooit "verzonden vanuit Nederland" (dat is misleidend). Echte oplossing later: EU-voorraad | teksten, `CJ_ORDER_REMARK` |
| Verpakking | Neutraal: geen factuur, prijzen of reclame van de leverancier (opmerking bij elke CJ-bestelling) | `build-order.ts` → `DEFAULT_CJ_REMARK` |
| Communicatie | Bevestiging met bezorgdatum, verzendmail, "nog onderweg"-mail, statuspagina "Volg je bestelling" | `apps/backend/src/lib/emails`, job `order-care` |
| Bezorgdatum op de site | "Bestel je vandaag, dan is hij er tussen … en …" + kerstmelding vanaf 15 nov | `delivery-estimate.tsx` |
| Beschadigd | Foto sturen → nieuwe lamp of geld terug, niet terugsturen (CJ vergoedt met foto) | FAQ in `lichtval.ts` |
| Douanekosten | "Je betaalt bij bezorging niets extra" ⚠️ controleren met het sample | FAQ |
| Bedrijfsadres | Niet meer in de footer; wel op contact, voorwaarden, retour (noindex, niet in de sitemap) en in de orderbevestiging (wettelijk). Advies: zakelijk adres huren | footer, `sitemap.ts`, mails |
| Duo bij CJ | `cj_quantity: 2` op de variant "2 lampen" (anders stuurt CJ er één) | `definitions.ts` |

## Volgende stappen

1. Sample bestellen (1 lamp, Ordinary E, $54,15): levertijd, verpakking, lamp aan op video.
2. Bij CJ navragen: prijs Duo (2 in één pakket), CE/RoHS, stekker of vaste aansluiting, Kelvin.
3. `cj_vid` van de variant ophalen (met `CJ_API_KEY`) en in `definitions.ts` zetten
   (`metadata: { cj_vid }`, voor de Duo `{ cj_vid, cj_quantity: 2 }`).
4. Alles voor livegang: [`../launch-checklist.md`](../launch-checklist.md). Potentie en
   rekensom met de CJ-prijs: [`../product-research/2026-11-lichtval-hercheck.md`](../product-research/2026-11-lichtval-hercheck.md).
