# Lichtval: advertentieset (23 nov 2026)

Beelden en video's zijn AI-gegenereerd (fal.ai) op basis van de CJ-productfoto's. Gebruik ze om de
test te starten, **vervang ze door eigen beelden van het echte licht zodra het sample er is**
(zie `docs/beslissingen/lichtval.md`, "Volgende stappen"). Geen advertentiegeld vóór het sample en
Mollie live, zie `docs/launch-checklist.md`.

## Bestanden

| Bestand | Formaat | Invalshoek (`angle`) | Plek |
|---|---|---|---|
| `advertentie-feed.jpg` | 4:5 | `sfeer` | Feed |
| `advertentie-story.jpg` | 9:16 | `sfeer` | Stories/Reels |
| `advertentie-slaapkamer.jpg` | 4:5 | `slaapkamer` | Feed |
| `advertentie-cadeau.jpg` | 4:5 | `cadeau` | Feed |
| `video-sfeer.mp4` | 9:16, 6 s | `sfeer` | Reels/Stories |
| `video-cadeau.mp4` | 9:16, 6 s | `cadeau` | Reels/Stories |
| `video-hal.mp4` | 9:16, 5 s | `sfeer` | Reels/Stories |
| `video-slaapkamer.mp4` | 9:16, 5 s | `slaapkamer` | Reels/Stories (let op: de brontekening is 4:5, dus in 9:16 staan de lampen aan de rand; liever zelf opnieuw maken met een 9:16-bronbeeld) |

Video's zijn zonder geluid: voeg in Meta of CapCut rustige muziek toe. Uitleg per video: de lamp en
muur blijven hetzelfde, alleen het lichtpatroon beweegt.

## Link per advertentie

`angle` kiest de hero op de site (`store.angles`), de `utm_*` komen in elk event en in `order_completed`.

```
https://<jouw-domein>/nl/products/lichtval-wandlamp?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.id}}&utm_term={{adset.id}}&utm_content={{ad.id}}&angle=<angle>
```

Vul `<jouw-domein>` in zodra de winkel live staat (gepland: lichtval.nl). Plak achter `angle=` de
waarde uit de tabel hierboven. Controleer het pad naar het product in de live winkel.

## Teksten (Nederlands, alleen wat de winkel zelf ook belooft)

### Sfeer (`angle=sfeer`)

- **Primaire tekst:** Zet hem aan en er valt een zachte sluier van warm licht over je muur, zoals licht door water. Een wandlamp die de muur zelf het mooiste deel maakt.
- **Kop:** Waterlicht op je muur.
- **Beschrijving:** 8–15 werkdagen, met track & trace.
- **Knop:** Bekijk de lamp

### Slaapkamer (`angle=slaapkamer`)

- **Primaire tekst:** Zacht licht naast je bed. Een wandlamp die een sluier van warm licht over je muur legt. Genoeg om bij te lezen, zacht genoeg om bij in slaap te vallen. Nu ook als set van twee, één voor elke kant van het bed.
- **Kop:** Zacht licht naast je bed.
- **Beschrijving:** Set van twee: €219 (bespaar €39).
- **Knop:** Bekijk de set

### Cadeau (`angle=cadeau`)

- **Primaire tekst:** Een cadeau dat elke avond aangaat. Een wandlamp met een plaat van gegolfd staal: zet hem aan en er valt een zachte sluier van warm licht over de muur. 14 dagen bedenktijd.
- **Kop:** Een cadeau dat elke avond aangaat.
- **Beschrijving:** Nu bestellen: levering 8–15 werkdagen.
- **Knop:** Bekijk de lamp

Let op: voor een kerstcadeau is levering vóór kerst niet meer haalbaar (8–15 werkdagen). Gebruik de
cadeauhoek daarom pas voor verjaardagen of na de feestdagen, en zet geen "voor kerst in huis" in de tekst.

## Wat niet in een advertentie mag

- Geen herkomst of "uit Nederland verzonden", geen nepschaarste ("nog maar 3"), geen nepreviews.
- Geen "gratis verzending" (klant betaalt €4,95) en geen kortingspercentages die niet kloppen.
- Zorg dat het licht in de advertentie niet sterker, groter of anders is dan dat van de echte lamp.
  Het lichtpatroon verandert per lamp en per muur; houd de beweging zacht.

## Testplan

Uit `docs/product-research/2026-11-lichtval-hercheck.md`: 3–5 advertenties, €25–30 per dag,
7–10 dagen, NL + BE, 30–65 jaar. Stop bij €80 zonder verkoop per advertentieset; na €300 totaal
met een kosten per verkoop > €70 en < 3% "in winkelmand" stoppen. Kosten per verkoop ≤ €55: budget
+20% per 3 dagen (ads-autopilot, `analytics/src/ads-rules.ts`).
