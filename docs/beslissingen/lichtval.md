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
database voegt de setup de Duo toe, maar laat de prijs van "1 lamp" staan: zet die in de
admin op €129.

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

## Beelden

Sfeerbeelden met fal.ai, op basis van de bestaande productfoto zodat de lamp gelijk blijft.
Alleen genereren na akkoord op de kosten. Zie de commit en `apps/storefront/public/stores/lichtval/`.

## Volgende stappen

1. Sample bestellen (1 lamp, Ordinary E, $54,15): levertijd, verpakking, lamp aan op video.
2. Bij CJ navragen: prijs Duo (2 in één pakket), CE/RoHS, stekker of vaste aansluiting, Kelvin.
3. `cj_vid` van de variant ophalen (met `CJ_API_KEY`) en in `definitions.ts` zetten
   (`metadata: { cj_vid }`, voor de Duo met aantal 2).
