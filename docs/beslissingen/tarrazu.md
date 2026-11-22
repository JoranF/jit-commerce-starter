# Tarrazú: genomen beslissingen

Logboek van de keuzes voor Tarrazú (koffiebonen uit Costa Rica). Voorbeeld: [lichtval.md](./lichtval.md).

## Merk en assortiment (2026-11-22)

| Keuze | Waarde | Waar in de code |
|---|---|---|
| Naam | Tarrazú (naar de bekendste koffiestreek van Costa Rica) | `apps/storefront/src/stores/tarrazu.ts` |
| Product | Hele koffiebonen (geen gemalen) | idem + `definitions.ts` |
| 250 g | `TARRAZU-250` **€12,95** | `apps/backend/src/scripts/stores/definitions.ts` |
| 500 g | `TARRAZU-500` **€22,95** | idem |
| 1 kg | `TARRAZU-1000` **€39,95** | idem |
| Btw | Voedingsmiddel: **NL 9%, BE 6%, DE 7%** (producttype "Voedingsmiddelen", `reducedVat`) | idem |
| Beelden | Placeholders (effen vlakken) tot er productfoto's zijn | `apps/storefront/public/stores/tarrazu/` |
| Bedrijf | Zelfde onderneming als Lichtval | `company` in `tarrazu.ts` |

⚠️ De naam belooft koffie uit de streek Tarrazú. Koop dus een lot uit Tarrazú, of noem de streek
niet in de teksten. Nu staat er alleen "uit Costa Rica" in de productfeiten.

## Leverancier: nog niet gekozen

Koffie is een levensmiddel. Dropshipping uit China (CJ) kan niet. Opties die we vonden
(zelfbeschrijvingen van de leveranciers, nog niet geverifieerd):

| Route | Wie | Wat | Minimum / opmerking |
|---|---|---|---|
| Private label bij NL-branderij (aanrader om te starten) | [Victorie Boontje](https://victorieboontje.nl/pages/private-label-koffie) | Eigen merk, zakken 250 g / 500 g / 1 kg | ~45 kg per bestelling |
| | [Fleur de Café](https://www.fleurdecafe.nl/privatelabelkoffie) | Branderij + groothandel, eigen melange en verpakking | ~32 kg per soort |
| | [Hoofdkwartier Koffiebranderij](https://hoofdkwartier-koffiebranderij.nl/koffie-zakelijk/private-label-koffie/) | Private label | vanaf ~100 kg per jaar |
| | [Laresso](https://www.laresso.nl/private-label-koffie/), [privatelabelcoffee.nl](https://privatelabelcoffee.nl/) | Private label uit eigen branderij | navragen |
| Loonbranden (eigen groene bonen laten branden) | [Fascino Coffee](https://www.fascino-coffee.com/pages/loonbranden) | Brandt en verpakt jouw groene koffie | navragen |
| Groene bonen uit Costa Rica (NL-importeur) | [Attesa Coffee](https://attesacoffee.com/public/origin/costa-rica) (Duivendrecht) | Specialty, o.a. een Tarrazú-lot (SHB, SCA 84) | voor loonbranden |
| | [Grounds Coffees](https://www.groundscoffees.com/) (magazijn Rosmalen) | Specialty uit o.a. Costa Rica | Tarrazú navragen |
| Dropshipping in Europa | [Koffie Unie](https://www.shopify.com/nl/blog/dropshipping-koffie) (NL), [Europe Coffee Roasters](https://www.europecoffeeroasters.com/), [Custom Coffee EU](https://customcoffee.eu/) | Fulfilment per bestelling | Echte dropshipping is in Europa zeldzaam; Costa Rica niet bevestigd |

**Voorstel:** private label bij een NL-branderij met een Costa Ricaans (liefst Tarrazú-)lot.
Vraag per leverancier: herkomst en lot, branddatum op de zak, prijs per kg per formaat, minimum,
verzendt de branderij zelf naar de klant (dropship) of naar jou, levertijd, etiket volgens EU 1169/2011.

## Levertijd en verzending

Aanname tot er een leverancier is: **1–2 werkdagen verwerking + 1–3 werkdagen bezorging**,
verzending €4,95 (`policies` in `definitions.ts`). Aanpassen zodra de leverancier vaststaat.

## Prijs en break-even (in te vullen)

| | 250 g €12,95 | 1 kg €39,95 |
|---|---|---|
| Zonder btw (÷ 1,09) | €11,88 | €36,65 |
| Inkoop (branden + zak + etiket) | ? | ? |
| Verzending die jij betaalt (−€4,95 die de klant betaalt) | ? | ? |
| Betaalkosten + retourreserve (≈ 3%) | −€0,36 | −€1,10 |
| **Max. advertentiekosten per verkoop** | ? | ? |

Let op: bij 250 g blijft er na inkoop weinig over voor advertenties. Stuur in advertenties op
500 g / 1 kg (hogere orderwaarde) en vul daarna `breakEvenCpa` in `analytics/src/stores.ts` in.

## Checklist livegang

- [ ] Leverancier gekozen, inkoopprijs + levertijd ingevuld (hierboven en in `definitions.ts`)
- [ ] **NVWA**: registratie als levensmiddelenbedrijf (ook bij alleen online verkoop)
- [ ] Etiket volgens EU 1169/2011 (naam, gewicht, THT, herkomst, naam/adres) — meestal geregeld door de branderij
- [ ] KvK: handelsnaam Tarrazú; activiteit webwinkel
- [ ] Echte foto's i.p.v. placeholders; smaak/branding toevoegen aan de productfeiten
- [ ] Wachtwoord van de winkel halen (Dokploy → tarrazu-storefront → Security) zodra alles klopt
- [ ] Mollie live-key, testbestelling + terugbetaling; check 9% btw op de factuur
- [ ] PostHog-project, ID in `analytics/src/stores.ts`, `npm run setup -- --store tarrazu`
- [ ] Meta: pixel + CAPI, advertentieaccount en break-even in `analytics/src/stores.ts`
