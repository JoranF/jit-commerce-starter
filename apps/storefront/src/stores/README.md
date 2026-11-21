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

## Nieuwe winkel in 6 stappen

1. **Product kiezen** met de skill `product-research-nl` (Ads Library → marge → leverancier).
2. **Beelden** met fal: eerst een productfoto, die als referentie voor de sfeerbeelden
   (zodat het product overal gelijk is). Opslaan in `public/stores/<id>/` en
   `apps/backend/src/scripts/assets/<id>/`.
3. **Config**: kopieer `lichtval.ts` naar `<id>.ts`, pas alles aan en registreer hem in
   `index.ts`. Andere lettertypen: `@fontsource`-pakket installeren en importeren in `fonts.ts`.
4. **Backend**: voeg een `STORE_SETUPS["<id>"]` toe in `definitions.ts` (zelfde product-handle).
5. **Dropshipping**: zet `cj_vid` in de variant-metadata (`variantMetadata`) zodra de
   CJ-variant bekend is, en `CJ_API_KEY` op de backend.
6. **Deploy** met `STORE_ID=<id>`; controleer met de screenshots-check (mobiel + desktop).

## Regels voor teksten

- Teksten met `{levertijd}`, `{verwerking}`, `{bezorging}`, `{bedenktijd}`, `{verzendkosten}` komen uit het
  winkelbeleid van de regio. Ontbreekt een waarde, dan wordt de zin niet getoond.
- Alleen feiten die kloppen met het echte product. Bij AI-beelden: `imageNote` tonen tot
  er eigen foto's zijn.
- Geen beloftes die niet waar te maken zijn ("morgen in huis" bij dropshipping).
- `company` invullen vóór livegang (KvK, adres, e-mail): wettelijk verplicht.
