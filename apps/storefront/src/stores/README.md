# Winkels (store factory)

Eén codebase, meerdere winkels. Alles wat per winkel verschilt (merk, kleuren,
lettertypen, teksten, beelden, product) staat in een config; de rest is gedeeld.

| Waar | Wat |
|---|---|
| `apps/storefront/src/stores/<id>.ts` | Merk, kleuren, fonts, teksten, beelden, FAQ, bedrijfsgegevens |
| `apps/storefront/public/stores/<id>/` | Beelden van de site (hero, kamers, detail, textuur) |
| `apps/backend/src/scripts/stores/definitions.ts` | Product (titel, prijs, foto's), levertijden, verzendopties |
| `apps/backend/src/scripts/assets/<id>/` | Productfoto's die het setup-script uploadt naar Medusa |

De winkel kies je met **`STORE_ID`** (Dokploy-variabele; wordt `NEXT_PUBLIC_STORE_ID`
voor de storefront-build). De backend draait bij elke start
`setup-store.ts <STORE_ID>`: idempotent, maakt het product aan als het ontbreekt en
zet levertijden en verzendopties goed.

## Nieuwe winkel

```bash
pnpm new-store <id> "<Naam>" --price 49
```

Dat maakt en registreert in één keer: de config (`<id>.ts`, met TODO's), placeholder-beelden,
het product in `definitions.ts`, de winkel in `analytics/src/stores.ts` (A/B-tests, rapporten,
advertenties) en `docs/beslissingen/<id>.md` met de break-even-rekensom en een checklist.
Daarna:

1. **Product kiezen** met de skill `product-research-nl` (Ads Library → marge → leverancier).
2. **Beelden** met fal: eerst een productfoto, die als referentie voor de sfeerbeelden.
   Vervang de placeholders in `public/stores/<id>/` en `apps/backend/src/scripts/assets/<id>/`.
3. **TODO's invullen** in `<id>.ts` en `definitions.ts`; andere lettertypen via `fonts.ts`.
   Advertentie-invalshoeken in `angles`.
4. **Controleren**: `pnpm check-store <id>` (TODO's, beelden, bedrijfsgegevens, automatisering).
5. **Dropshipping**: `cj_vid` in de variant-metadata en `CJ_API_KEY` op de backend.
6. **Deploy** met `STORE_ID=<id>`, PostHog-project in `analytics/src/stores.ts`, en
   `npm run setup -- --store <id>`. De workflows nemen de winkel daarna vanzelf mee.

## Regels voor teksten

- Teksten met `{levertijd}`, `{verwerking}`, `{bezorging}`, `{bedenktijd}`, `{verzendkosten}` komen uit het
  winkelbeleid van de regio. Ontbreekt een waarde, dan wordt de zin niet getoond.
- Alleen feiten die kloppen met het echte product. Bij AI-beelden: `imageNote` tonen tot
  er eigen foto's zijn.
- Geen beloftes die niet waar te maken zijn ("morgen in huis" bij dropshipping).
- `company` invullen vóór livegang (KvK, adres, e-mail): wettelijk verplicht.
