# Dropshipping met CJ Dropshipping

Verkopen zonder voorraad: een klant betaalt in je winkel → Medusa stuurt de bestelling
automatisch door naar [CJ Dropshipping](https://cjdropshipping.com) → CJ verstuurt het pakket
rechtstreeks naar de klant → het trackingnummer komt terug in Medusa en de bestelling
staat op **verzonden**.

```
klant betaalt ─▶ order.placed ─▶ CJ-bestelling aangemaakt (adres, aantallen, verzendmethode)
                                        │
             elke 30 min (job cj-sync) ◀┘  status + track & trace ophalen
                                        │
                Medusa: fulfilment + verzending met trackingnummer (klant kan volgen)
```

## Aanzetten (eenmalig, ±15 minuten)

1. **CJ-account**: maak een gratis account op cjdropshipping.com.
2. **API key**: My CJ → Authorization → API → *Generate*. Zet hem als `CJ_API_KEY`
   (lokaal in `apps/backend/.env`, live als environment variable in Dokploy).
3. **Saldo** (alleen als je `CJ_AUTO_PAY=true` wilt): zet geld op je CJ-wallet. CJ betaalt elke
   bestelling dan direct van dat saldo.
4. Herstart de backend. In de log zie je bij een bestelling `[cj] order … forwarded to CJ`.

| Variabele | Standaard | Betekenis |
|---|---|---|
| `CJ_API_KEY` | – | Leeg = module staat uit |
| `CJ_AUTO_PAY` | `false` | `false`: bestelling staat klaar in CJ, jij klikt op betalen (veilig om mee te starten). `true`: volledig automatisch van je CJ-saldo |
| `CJ_SANDBOX` | `false` | `true`: testbestellingen bij CJ, worden niet verstuurd |
| `CJ_FROM_COUNTRY` | `CN` | Magazijnland als een product niets anders zegt |
| `CJ_LOGISTICS` | – | Voorkeursverzendmethodes, bv. `CJPacket Ordinary,YunExpress` |
| `CJ_MAX_DELIVERY_DAYS` | `15` | Anders: goedkoopste methode die binnen zoveel dagen levert (anders de snelste) |
| `CJ_ORDER_PREFIX` | `jit` | Ordernummer bij CJ wordt `jit-1042`. Gebruik per winkel een eigen prefix |
| `CJ_STORE_NAME` | – | Naam van je API-winkel in CJ (optioneel) |
| `CJ_CREATE_FULFILLMENT` | `true` | Medusa-bestelling op verzonden zetten zodra CJ een trackingnummer heeft |

## Een product koppelen aan CJ

1. Zoek het product op CJ en open het. Het **product-ID (pid)** staat in de URL / productpagina.
2. Bekijk de varianten, voorraad en verzendopties naar NL (ingelogd in de admin):
   `https://<jouw-backend>/admin/cj/products/<pid>?to=NL`
   → je ziet per variant de `vid`, inkoopprijs (USD), gewicht, en per magazijnland de
   verzendmethodes met prijs en levertijd.
3. Maak het product aan in Medusa (admin → Producten) met **Voorraad beheren uit**
   (dropshipping heeft geen eigen voorraad).
4. Zet bij elke variant onder **Metadata**:
   - `cj_vid` = de vid van CJ (**verplicht**)
   - `cj_from_country` = bv. `DE` of `NL` als je uit een EU-magazijn wilt laten versturen (optioneel)
   - `cj_logistic` = vaste verzendmethode, bv. `CJPacket Ordinary` (optioneel)

   Heeft het product maar één variant? Dan mag je dezelfde keys ook op het product zelf zetten.

Producten zonder `cj_vid` worden genegeerd. Je kunt dus eigen voorraad en dropshipping in één winkel mixen.

## In de admin

Op elke bestelling staat rechts het blok **CJ Dropshipping**: status, CJ-ordernummer,
verzendmethode, inkoopbedrag, track & trace en eventuele fouten, met de knoppen
**Doorsturen naar CJ** en **Status ophalen**.

Lukt het doorsturen niet (bv. CJ even onbereikbaar, saldo op), dan staat de fout in dat blok en
probeert de job `cj-sync` het automatisch opnieuw (max. 5 keer, binnen 7 dagen). Dubbele
bestellingen bij CJ kunnen niet: elke Medusa-bestelling heeft een vast ordernummer, en de
module kijkt eerst of CJ dat nummer al kent.

## Let op

- **Levertijd**: zet in je winkel de echte levertijd (vanuit China 7–15 werkdagen, vanuit een
  EU-magazijn 3–7). De standaard in deze repo is 1–2 dagen
  (`src/lib/region-store-policies.ts` en de seed). Pas die aan, anders beloof je iets wat niet klopt.
- **Jij bent de verkoper**: 14 dagen bedenktijd, 2 jaar garantie en productveiligheid (CE, GPSR)
  blijven jouw verantwoordelijkheid, ook zonder voorraad.
- **Begin met `CJ_AUTO_PAY=false`** en een paar echte testbestellingen. Klopt alles, zet het dan op `true`.
- Bestel zelf een sample voordat je adverteert.

## Code

| Bestand | Wat |
|---|---|
| `client.ts` | CJ API: token (180 dagen, gecachet), max. 1 request/seconde, foutcodes |
| `lib/build-order.ts` | Medusa-bestelling → CJ-bestelling (adres, huisnummer, regels), keuze verzendmethode |
| `service.ts` | Doorsturen (idempotent, per magazijnland een CJ-bestelling) |
| `../../workflows/cj/forward-order-to-cj.ts` | Workflow: doorsturen + resultaat in `order.metadata` |
| `../../workflows/cj/sync-cj-order.ts` | Status/track & trace ophalen, fulfilment + verzending aanmaken |
| `../../subscribers/cj-order-placed.ts` | Start doorsturen bij elke nieuwe bestelling |
| `../../jobs/cj-sync.ts` | Elke 30 min: tracking ophalen, mislukte bestellingen opnieuw |
| `../../api/admin/cj/…` | Admin-routes: doorsturen, status ophalen, CJ-product bekijken |
| `../../admin/widgets/cj-order-status.tsx` | Blok op de bestelpagina in de admin |

Tests: `cd apps/backend && pnpm run test:unit -- src/modules/cj-dropshipping`
